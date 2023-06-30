import {
  Value,
  PlaceholderArg,
  BindUrl,
  NativePlaceholderValueTable,
  ExtractValidPlaceholderSyntax,
  ResolvePlaceholders,
  BindParams,
  TrimSlash,
  Options,
  BindOptions,
  BindParam,
  PathValue,
  UserinfoOptions,
} from "./definition";
import { encodeRFC3986 } from "./util";
import { replaceQuery } from "./query";

export default function urlFrom<T extends PlaceholderArg = never, U extends keyof NativePlaceholderValueTable = never>(
  rawLiterals: TemplateStringsArray,
  ...placeholders: [...Array<ExtractValidPlaceholderSyntax<T, keyof ResolvePlaceholders<T> & string> | U | [Value]>]
): BindUrl<T> {
  // リテラルに含まれるエンコード対象の文字をエンコード
  const encodedLiterals = resolveLiterals(rawLiterals, placeholders);

  // リテラルに含まれる "." を "{DOT}" に置換し、プレースホルダ経由で動的に埋め込まれる "." と区別できるようにする。
  // Path Traversal対策として必要。
  // encodedLiterals内の "{}" はエンコードされているため、 "{DOT}" はマーカーとして安全に使用できる。
  const { literals, unescapeLiteralDots } = escapeLiteralDots(encodedLiterals);

  // 型を無視した不正なプレースホルダが含まれる場合は例外を投げる
  checkPlaceholders(placeholders);

  // メイン関数のbindUrlを narrowing 対応させて返す
  return Object.assign(bindUrl, { narrowing: bindUrl }) as BindUrl<T>;

  /**
   * リテラルにプレースホルダの値を埋め込む.
   * @param bindParams 埋め込むパラメータを含むオブジェクト
   */
  function bindUrl(bindParams?: Readonly<BindParams<Extract<TrimSlash<T>, string>>>): string {
    const {
      "scheme://authority": schemeAuthority,
      "scheme://host": schemeHost,
      "scheme://authority/path": schemeAuthorityPath,
      "scheme://host/path": schemeHostPath,
      "scheme:": scheme,
      "userinfo@": userinfoOptions,
      ":port": port,
      "?query": query,
      "#fragment": fragment,
    }: Options & BindOptions = bindParams || {};

    /** パスを結合するための配列 */
    const parts: string[] = [];

    const literalsLength = literals.length;
    for (let index = 0; index < literalsLength; index++) {
      const { literal, placeholder, beforeSlash, afterSlash, hasLastItemTrailingSlash } = resolveCurrentIndexInfo(
        index,
        literals,
        placeholders,
        parts
      );

      if (literal) {
        parts.push(literal);
      }

      // Tagged Template Literals は最後のループでplaceholderが存在しない
      if (placeholder === undefined) {
        break;
      }

      // Direct Placeholder `${[" "]}`
      if (Array.isArray(placeholder)) {
        parts.push(resolveValue(placeholder[0]));
        continue;
      }

      // 埋め込みに関する情報を得る
      const { placeholderName, value, separator, skip } = resolveBindInfo(bindParams, placeholder);

      if (skip) {
        continue;
      }

      // Authority Placeholder
      // `${"scheme://authority"}` or `${"scheme://host"}` or
      // `${"scheme://authority/path"}` or `${"scheme://host/path"}`
      if (
        placeholderName === "scheme://authority" ||
        placeholderName === "scheme://host" ||
        placeholderName === "scheme://authority/path" ||
        placeholderName === "scheme://host/path"
      ) {
        const part = resolveSchemeAuthorityPath(
          schemeAuthority || schemeHost || schemeAuthorityPath || schemeHostPath,
          placeholderName
        );
        part && parts.push(part);
        continue;
      }

      // Scheme Placeholder `${"scheme:"}`
      if (placeholderName === "scheme:") {
        const part = resolveScheme(scheme);
        part && parts.push(part);
        continue;
      }

      // Userinfo Placeholder `${"userinfo@"}`
      if (placeholderName === "userinfo@") {
        const part = userinfoOptions && resolveUserinfo(userinfoOptions);
        part && parts.push(part);
        continue;
      }

      // Port Placeholder `${":port"}`
      if (placeholderName === ":port") {
        const part = resolvePort(port);
        part && parts.push(part);
        continue;
      }

      // Subdomain Placeholder `${"subdomain."}`
      if (placeholderName === "subdomain.") {
        const part = resolveSubdomain(value, separator, placeholderName);
        part && parts.push(part);
        continue;
      }

      // Spread Placeholder `${"...paths"}`
      if (placeholderName.startsWith("...")) {
        const part = resolveSpreadPaths(value, separator, placeholderName);
        part && parts.push(part);
        continue;
      }

      // Primitive Placeholder `${"name"}`
      if (matchPathValue(value)) {
        pushPathPart(encodeRFC3986(value));
        continue;
      }

      // パスに使用できない不正な値の場合は例外を投げる
      const receivedMessage = Array.isArray(value) ? "Array" : value;
      throw new TypeError(`Invalid path value for "${placeholderName}". Received: ${receivedMessage}`);

      /**
       * Conditional Slashを考慮してpartsにpartを追加する
       * @param part partsに追加するpart
       */
      function pushPathPart(part: string) {
        if (beforeSlash) {
          parts.push("/");
        }
        parts.push(part);
        if (afterSlash) {
          parts.push("/");
        }
      }
    }

    // escapeLiteralDotsでエスケープした "{DOT}" を "." に戻す
    const path = unescapeLiteralDots(parts.join(""));

    // パスの冗長な部分を正規化する
    const normalizedPath = normalizePath(path, literals[0], placeholders[0]);

    // パスにQueryStringとFragmentの部分を追加する
    return replaceQuery(normalizedPath, query, fragment);
  }
}

function resolveLiterals(rawLiterals: TemplateStringsArray, placeholders: PlaceholderArg[]): string[] {
  let currentComponent: "afterScheme" | "authority" | "path" | "query" | "hash" | undefined;
  // RFC3986におけるエンコード対象の文字列が含まれているか検査
  const pathEncodedChars = new Set<string>();
  const queryEncodedChars = new Set<string>();
  const fragmentEncodedChars = new Set<string>();

  const literals: string[] = rawLiterals.map((literal, index) => {
    // "...?" "...#" の単位に分割してエンコード漏れを検査する
    return literal.replace(/([^?#]*)([?#]?)/g, (_, str: string, mark: "" | "?" | "#") => {
      let beforeStr = "";

      // Fragment Component
      if (currentComponent === "hash") {
        // NOTE: エンコード対象文字を1文字ずつ扱うため、絵文字等が壊れないようにuフラグが必要
        str = str.replace(/[^a-z\d\-./_~]/giu, (s) => {
          fragmentEncodedChars.add(s);
          return encodeRFC3986(s);
        });
        if (mark) {
          str += encodeRFC3986(mark);
          fragmentEncodedChars.add(mark);
        }
        return str;
      }

      // Query Component
      if (currentComponent === "query") {
        // QueryString内では "&" "=" はエンコード対象外
        // NOTE: エンコード対象文字を1文字ずつ扱うため、絵文字等が壊れないようにuフラグが必要
        str = str.replace(/[^a-z\d#&\-./=?_~]/giu, (s) => {
          queryEncodedChars.add(s);
          return encodeRFC3986(s);
        });
        // ただし連続する "=" は2文字目以降をエンコード
        str = str.replace(/(=)(=+)/g, (_, eq, value) => {
          queryEncodedChars.add("=");
          return `${eq}${encodeRFC3986(value)}`;
        });

        if (mark === "#") {
          str += mark;
          currentComponent = "hash";
        } else if (mark) {
          str += "%3F"; // %3F = ?
          queryEncodedChars.add(mark);
        }
        return str;
      }

      // Scheme Component ~ Path Component
      const placeholder = placeholders[index];
      if (currentComponent !== "path") {
        const literalIndexOfSlash = str.indexOf("/");
        const literalIndexOfColon = str.indexOf(":");
        const hasSlash = literalIndexOfSlash !== -1;
        const hasColon = literalIndexOfColon !== -1;

        // Scheme Placeholderの直後
        if (currentComponent === "afterScheme") {
          // リテラルが "/" から始まっている => authorityコンポーネントの開始 `${"scheme:"}//example.com`
          // リテラルが "/" から始まっていない => pathコンポーネントの開始 `${"scheme:"}foo`
          if (literalIndexOfSlash === 0) {
            currentComponent = "authority";
            // authorityコンポーネントは "//" の後から開始するので調整
            beforeStr += str.slice(0, 2); // schemeコンポーネント
            str = str.slice(2); // authorityコンポーネント
          } else {
            currentComponent = "path";
          }
        }
        // 次に Scheme Placeholder が使用されている場合
        else if (typeof placeholder === "string" && /scheme:(?!\w)/.test(placeholder)) {
          // 次のループはScheme Placeholderの直後になる
          currentComponent = "afterScheme";

          // Scheme Placeholderの手前はSchemeコンポーネントであるため、エンコード不要。
          // 不正な文字列が含まれる場合は最後のURLの検査で例外になる。
          return str;
        }
        // authorityコンポーネント内
        else if (currentComponent === "authority") {
          // 現在のリテラル内に "/" が存在する場合は、それがauthorityコンポーネントとpathコンポーネントの境界になる
          if (hasSlash) {
            // "/" の前はauthorityコンポーネントとして、後はpathコンポーネントとしてエンコードした上でpathコンポーネントに切り替える
            beforeStr += str.slice(0, literalIndexOfSlash).replace(/[^a-z\d#\-.:?@_~]/giu, (s) => {
              pathEncodedChars.add(s);
              return encodeRFC3986(s);
            });
            str = str.slice(literalIndexOfSlash);
            currentComponent = "path";
          }
        } else if (hasColon) {
          // schemeコンポーネントとauthorityコンポーネント or pathコンポーネントの境界
          // ":" のみ存在する(ex. "tel:0123456789") or ":" が "/" より先に現れる場合(ex. "https://")
          if (!hasSlash || (hasSlash && literalIndexOfColon < literalIndexOfSlash)) {
            // 先頭から最初の ":" までは scheme、その後の "/" の有無によってその後の currentComponent が決まる
            // "/" がある -> authorityコンポーネント
            // "/" がない -> pathコンポーネント
            str = str.replace(/^([^:]*:)(\/{0,2})/, (_, scheme, slashes) => {
              // スラッシュ不足を補完
              if (slashes === "/") {
                slashes = "//";
                console.warn(`Single slash in front of the authority component was missing and has been completed.`);
              }

              // currentComponentと整合性が取るため、"/"までの部分は処理済みにして str にはそれ以降のみ残るようにする
              currentComponent = slashes ? "authority" : "path";
              beforeStr += `${scheme}${slashes}`;
              return "";
            });
          } else {
            // "/" が先の場合は相対 or ルートパス or Protocol-relative URL
            currentComponent = "path";
          }
        }
      }

      // NOTE: エンコード対象文字を1文字ずつ扱うため、絵文字等が壊れないようにuフラグが必要
      str = str.replace(/[^a-z\d\-._~]/giu, (s) => {
        if (s === "/") {
          currentComponent = "path";
          return s;
        }
        if (currentComponent === "authority" && (s === ":" || s === "@")) {
          return s;
        }
        pathEncodedChars.add(s);
        return encodeRFC3986(s);
      });

      if (currentComponent !== "path" && typeof placeholder === "string" && placeholder.includes("/")) {
        currentComponent = "path";
      }

      if (mark === "?") {
        currentComponent = "query";
      } else if (mark === "#") {
        currentComponent = "hash";
      }

      return beforeStr + str + mark;
    });
  });

  if (pathEncodedChars.size > 0) {
    const templateText = stringifyTemplateText(rawLiterals, placeholders);
    const unencodedChars = Array.from(pathEncodedChars).join("");
    const message = `The literal part contains an unencoded path string "${unencodedChars}". Received: \`${templateText}\``;
    console.warn(message);
  }

  if (queryEncodedChars.size > 0) {
    const templateText = stringifyTemplateText(rawLiterals, placeholders);
    const unencodedChars = Array.from(queryEncodedChars).join("");
    const message = `The literal part contains an unencoded query string "${unencodedChars}". Received: \`${templateText}\``;
    console.warn(message);
  }

  if (fragmentEncodedChars.size > 0) {
    const templateText = stringifyTemplateText(rawLiterals, placeholders);
    const unencodedChars = Array.from(fragmentEncodedChars).join("");
    const message = `The literal part contains an unencoded fragment string "${unencodedChars}". Received: \`${templateText}\``;
    console.warn(message);
  }

  return literals;
}

/**
 * literals に含まれる "." を "{DOT}" に置換した literals と、置換を元に戻す関数を返します。
 * これは、リテラルの "." とプレースホルダ経由で動的に埋め込まれる "." と区別するために使用されます。
 *
 * @param literals
 */
function escapeLiteralDots([...literals]: string[]) {
  // リテラルに含まれる "." を "{DOT}" に置換
  literals.forEach((literal, index) => {
    literals[index] = literal.replace(/\./g, "{DOT}");
  });

  return {
    literals,
    /**
     * escapeLiteralDotsでエスケープした "{DOT}" を "." に戻します。
     *
     * @param inputPath
     */
    unescapeLiteralDots: (inputPath: string) => {
      let sanitized = false;
      const path = inputPath
        // Path Traversal measures.
        //
        // 埋め込まれた "." によって発生する Path Traversal に対して、 "." を半角スペースに変換することで無害化する。
        // 完全な無害化ではないものの、半角スペースだけの文字列はtrimや一般的なバリデーションで考慮される対象であり、
        // ".." のままでパス階層が変わってしまう場合に対してリスクが低いと考えられる。
        //
        // そもそもURLのスラッシュで囲まれたパス部分で "." や ".." を値として伝達する方法が存在しないため、
        // そのようなパターンを使おうとするURL設計自体に問題があると言える。
        //
        // このライブラリでは問題のパターンをいかに比較的安全な状態に無害化するかという点に焦点を当てて対策を行う方針をとる。
        //
        // 検出対象のパターンは以下に加えて、".." がリテラルと埋め込みの一つずつの "." の組み合わせで発生するパターン。
        // リテラルの "." は許容し、埋め込まれたものだけを半角スペースに置換する対象とする。
        // "." "./" ".?" ".#" "/." "/.?" "/.#" "/./"
        // ".." "../" "..?" "..#" "/.." "/..?" "/..#" "/../"
        .replace(/(\/|^)(\.\.?|\.\{DOT}|\{DOT}\.)(?=[/?#]|$)/g, (_, s1, s2) => {
          sanitized = true;
          return `${s1}${s2.replace(/\./g, "%20")}`;
        })
        // リテラルの "." のマーカーとしていた "{DOT}" を置換してもとに戻す
        .replace(/\{DOT}/g, ".");

      if (sanitized) {
        console.warn(
          `When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".`
        );
      }

      return path;
    },
  };
}

/**
 * プレースホルダに不正な値が渡されている場合は例外を投げる
 * @param placeholders
 */
function checkPlaceholders(placeholders: PlaceholderArg[]): void {
  placeholders.forEach((placeholder: unknown, index) => {
    if (typeof placeholder === "string") {
      return;
    }
    // Direct Placeholderのチェック
    if (Array.isArray(placeholder)) {
      const value = placeholder[0];
      if (value === "") {
        throw new TypeError(`The value of the index ${index} at direct placeholder is empty string.`);
      }
      if (typeof value === "string" || typeof value === "number") {
        return;
      }
    }
    throw new TypeError(`Invalid placeholder type. Received: ${JSON.stringify(placeholder)}`);
  });
}

function resolveValue(value: Value): string {
  return encodeRFC3986(value.toString());
}

function resolveSchemeAuthorityPath(format: string | undefined, placeholderName: string): string | undefined {
  if (matchSkipValue(format)) {
    return undefined;
  }
  const originFormat = format;
  // "<scheme>://" or "//" から始まるか検査
  let [whole, schemeAndColon = "", authority = "", afterAuthority = ""] =
    format.match(/^([a-z][a-z\d+.-]*:)?\/\/([^/?#]*)(.*)/i) || [];
  if (!whole) {
    throw new TypeError(
      `The value of the placeholder "${placeholderName}" must contain "scheme://" or Protocol-relative URL. Received: ${originFormat}`
    );
  }
  // "?"や"#"以降は警告を出して消去
  // NOTE: "scheme://authority/path"と"scheme://host/path"でQueryStringやFragmentを許容しない理由
  // - `${"https://example.com?foo#hash"}/users/279642/a/b` のように埋め込むと、QueryStringやFragmentの後にパスが続くようなイメージになって違和感があるため
  // - 通常、QueryStringやFragmentはパスごとに定義されるものであり、パスが定まる前に指定されたものは意図しない挙動を生むリスクが有るため
  if (/[?#]/.test(afterAuthority)) {
    console.warn(
      `The value of the placeholder "${placeholderName}" cannot contain a query string or fragment. Received: ${originFormat}`
    );
    afterAuthority = afterAuthority.replace(/[?#].+/i, "");
  }
  // エンコードの必要な文字が含まれていたらエンコードして警告
  const match = afterAuthority.match(/[^a-z\d%\-./_~]+/i);
  if (match) {
    console.warn(
      `The placeholder "${placeholderName}" value contain "${match[0]}". Percent encoding is required. Received: ${originFormat}`
    );
    afterAuthority = afterAuthority.replace(/[^a-z\d%\-./_~]+/gi, (s) => encodeRFC3986(s));
  }

  // 空のportを除去
  authority = authority.replace(/:$/, "");

  // Userinfo
  if (authority.includes("@")) {
    // 空の user pass を除去 ex. "//:" "//:@" "//@"
    authority = authority.replace(/^:?@/, "");

    // authority に "@" が2つ以上あったら例外を投げる
    // ex. user:pass@foo@example.com
    if (/@[^@]*@/.test(authority)) {
      throw new TypeError(
        `The authority component of value of the placeholder "${placeholderName}" must be "%40" to use "@" as value instead of delimiter. Received: ${originFormat}`
      );
    }

    // userinfo に ":" が2つ以上あったら例外を投げる
    // ex. user:pass:foo@example.com
    const [userinfo] = authority.match(/^[^@]+(?=@)/) || [];
    if (userinfo && /:[^:]*:/.test(userinfo)) {
      throw new TypeError(
        `The userinfo component of value of the placeholder "${placeholderName}" must be "%3A" to use ":" as value instead of delimiter. Received: ${originFormat}`
      );
    }
  }

  // Host
  // NOTE: 事前に "@" が2つ以上あった場合は例外を投げる処理が含まれているので、簡易的な正規表現で処理
  authority.replace(/^([^@]*@|)([^@]*)$/, (_, userinfo, hostAndPort) => {
    // port部を切り捨て
    const [host = ""] = hostAndPort.split(/(?=:\d+$|$)/);

    // NOTE: file:の場合は空のホスト名を許可する
    if (host === "" && schemeAndColon !== "file:") {
      throw new TypeError(
        `The host component of value of the placeholder "${placeholderName}" cannot empty. Received: ${originFormat}`
      );
    }

    // NOTE: エンコード対象文字を1文字ずつ扱うため、絵文字等が壊れないようにuフラグが必要
    host.replace(/[^a-z\d\-./_~]/iu, (s: string) => {
      throw new TypeError(
        `The host component of value of the placeholder "${placeholderName}" cannot contain a "${s}". Received: ${originFormat}`
      );
    });
    return "";
  });

  // Protocol-relative URL の場合は scheme が空文字
  const baseUrl = `${schemeAndColon}//${authority}${afterAuthority}`;

  // ${"scheme://*/path"}
  if (placeholderName.endsWith("/path")) {
    // NOTE: 末尾スラッシュを除去する
    // "https://example.com/pa" + "th/to" のようなことを許容するため
    return baseUrl.replace(/\/+$/, "");
  }
  // ${"scheme://*"}
  else {
    // NOTE: ${"scheme://*"} にパスが含まれている場合は警告を出す
    // ${"scheme://*"} は絶対URLとルートパスの使い分けを許容するために ${"scheme://*?"} が使える。
    // パスを含んでいると省略したときに絶対URLとルートパスで階層がズレて危険なため。
    // urlFrom`${"scheme://host?"}/path/to`(); // => "/path/to" Good
    // urlFrom`${"scheme://host?"}/path/to`({ "scheme://host": "https://example.com/" }); // => "https://example.com/path/to" Good
    // urlFrom`${"scheme://host?"}/path/to`({ "scheme://host": "https://example.com/foo" }); // => "https://example.com/foo/path/to" Bad
    if (afterAuthority && afterAuthority !== "/") {
      console.warn(
        `The value of the placeholder "${placeholderName}" cannot contain a path.\nUse the placeholder "${placeholderName}/path" to include paths. Received: ${originFormat}`
      );
    }

    // NOTE: 末尾のスラッシュが不足している場合に追加する
    // "https://example.com" + "path/to" のようなことが発生しないように。
    return `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}`;
  }
}

function resolveScheme(scheme: string | undefined): string | undefined {
  if (matchSkipValue(scheme)) {
    return undefined;
  }
  // https://www.rfc-editor.org/rfc/rfc3986#section-3.1
  // scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  if (!scheme.match(/^[a-z][a-z\d+\-.]*$/i)) {
    throw new TypeError(`The value of the placeholder ":scheme" invalid scheme. Received: ${scheme}`);
  }
  return `${scheme}:`;
}

function stringifyTemplateText(literals: TemplateStringsArray, placeholders: PlaceholderArg[]): string {
  let templateText = "";
  for (let i = 0; i < literals.length; i++) {
    templateText += literals[i] + (placeholders[i] === undefined ? "" : `\$\{${JSON.stringify(placeholders[i])}\}`);
  }
  return templateText;
}

function resolveCurrentIndexInfo(
  index: number,
  literals: ReadonlyArray<string>,
  placeholders: PlaceholderArg[],
  parts: readonly string[]
) {
  const currentTrailingPart = parts[parts.length - 1] || "";
  const hasLastItemTrailingSlash = Boolean(currentTrailingPart.endsWith("/"));
  const literal = hasLastItemTrailingSlash ? literals[index].replace(/^\/+/, "") : literals[index];
  const isEnd = index >= placeholders.length;

  // `${"/foo?/"}` `$["/foo?"}` `${"foo?/"}` のスラッシュを解釈する
  const rawPlaceholder = isEnd ? undefined : placeholders[index];
  if (typeof rawPlaceholder === "string") {
    const beforeSlash = rawPlaceholder.startsWith("/");
    const afterSlash = rawPlaceholder.endsWith("/");
    return {
      literal,
      placeholder: rawPlaceholder.replace(/^\/|\/$/g, ""),
      beforeSlash,
      afterSlash,
      hasLastItemTrailingSlash,
    };
  }
  return { literal, placeholder: rawPlaceholder, hasLastItemTrailingSlash };
}

function resolveBindInfo<T extends string | keyof Options | keyof BindOptions>(
  bindParams: Readonly<BindParams<T>> | undefined,
  placeholder: string
) {
  // "foo?" "foo?:string" "foo:string" を "foo" にする。
  // ただし以下は例外とする。
  // - ":port" を対象にしないため、先頭の":"は無視する
  // - "scheme:" "scheme://authority/path" "scheme://host/path" の":"も通常の文字列として扱う
  const placeholderName = placeholder.replace(
    /(?!^:)[?:].*$|^(scheme:\/\/(?:authority|host)(?:\/path)?|scheme:)[?:]?.*$/,
    "$1"
  ) as keyof BindParams<T> & string;
  const bindParam = bindParams?.[
    placeholderName.replace(/^\.{3}/, "") as typeof placeholderName
  ] as BindParam<PathValue>;

  // オブジェクト形式とプリミティブで渡された差を解決する
  const { value, separator = undefined } =
    typeof bindParam === "object" && bindParam !== null && "value" in bindParam ? bindParam : { value: bindParam };

  const valueIsSkipPathValue = matchSkipPathValue(value);
  const optional = placeholder.includes("?");

  if (Number.isNaN(value)) {
    const message = `The value NaN was passed to the placeholder "${placeholderName}".`;
    // NOTE: portへのNaNは間違いのリスクが高いので例外にする
    if (placeholderName === ":port") {
      throw new TypeError(message);
    }
    // NOTE: その他の場合のNaNも将来的に例外とする可能性はある
    console.warn(message);
  } else {
    // 必須のときに有効な値ではない場合
    if (!optional && valueIsSkipPathValue) {
      if (value === "") {
        throw new TypeError(`The required placeholder "${placeholderName}" was passed an empty string.`);
      } else {
        const stringifiedValue = JSON.stringify(value);
        throw new TypeError(
          `The placeholder "${placeholderName}" in the argument object must be set to a valid value. Received: ${stringifiedValue}`
        );
      }
    }
  }

  return { placeholderName, value, separator, skip: valueIsSkipPathValue };
}

function resolvePathValues(value: PathValue, placeholderName: string, placeholderType: string): PathValue & any[] {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `The placeholder "${placeholderName}" in the argument object must be set to an array. Received: ${value}`
    );
  }
  value.forEach((v, index) => {
    if (!matchPathValue(v) && !matchSkipPathValue(v)) {
      throw new TypeError(`Invalid ${placeholderType} value for index ${index}. Received: ${v}`);
    }
    if (Number.isNaN(v)) {
      console.warn(`The value NaN was passed to the index ${index} at placeholder "${placeholderName}".`);
    }
  });
  return value;
}

function resolveUserinfo({ user, password }: UserinfoOptions): string | undefined {
  if (user === undefined) {
    return undefined;
  }
  if (password) {
    return `${encodeRFC3986(user)}:${encodeRFC3986(password)}@`;
  }
  return `${encodeRFC3986(user)}@`;
}

function resolvePort(port: number | undefined): string | undefined {
  if (port === undefined) {
    return undefined;
  }
  if (port < 0 || port > 65535 || Number.isNaN(port)) {
    throw new TypeError(`The value of the placeholder ":port" appropriate port number 0 ~ 65535. Received: ${port}`);
  }
  return `:${port}`;
}

function resolveSubdomain(
  value: PathValue,
  separator: string | undefined,
  placeholderName: string
): string | undefined {
  const values = resolvePathValues(value, placeholderName, "subdomain");
  const approvedSeparator = separator === undefined ? "." : encodeRFC3986(separator);
  const stringifiedPaths = stringifyPaths(values, encodeRFC3986, approvedSeparator);
  if (stringifiedPaths) {
    return `${stringifiedPaths}.`;
  }
  return undefined;
}

function resolveSpreadPaths(value: PathValue, separator: string | undefined, placeholderName: string): string {
  const values = resolvePathValues(value, placeholderName, "spread");
  // セパレータは未定義のときだけエスケープしない "/" を利用可能
  const approvedSeparator = separator === undefined ? "/" : encodeRFC3986(separator);
  return stringifyPaths(values, encodeRFC3986, approvedSeparator);
}

/**
 * パスを正規化する
 *
 * 正規化の内容は主にスラッシュの重複除去で、スラッシュが重複している可能性があるのは以下のパターン。
 *
 * - リテラル部分のスラッシュが元々多く記述されている場合 ex. urlFrom`${"foo?"}//${"bar?"}`({ foo: "path", bar: "to" })
 * - Conditional Slash が重なる場合 ex. urlFrom`/${"/foo?/"}${"/bar?/"}/`({ foo: "path", bar: "to" })
 * - オプショナルの埋め込みが省略された場合 ex. urlFrom`/${"foo?"}/`()
 *
 * スラッシュの重複を除去するのは以下のrightPartの部分。
 *
 * +---------------------------------+------------+--------------------------+-------------------------------+
 * | path                            | leftPart   | rightPart                | result                        |
 * +---------------------------------+------------+--------------------------+-------------------------------+
 * | "https://example.com/path/to"   | "https://" |  "example.com/path/to"   | "https://example.com/path/to" |
 * | "https:///example.com//path/to" | "https://" |  "/example.com//path/to" | "https://example.com/path/to" |
 * | "file:///path/to"               | "file:///" | "path/to"                | "file:///path/to"             |
 * | "file:////path/to"              | "file:///" | "/path/to"               | "file:///path/to"             |
 * | "//example.com/path/to"         | "//"       | "example.com/path/to"    | "//example.com/path/to"       |
 * | "///example.com//path/to"       | "//"       | "/example.com//path/to"  | "//example.com/path/to"       |
 * | "/path/to"                      | ""         | "/path/to"               | "/path/to"                    |
 * | "/path//to"                     | ""         | "/path//to"              | "/path/to"                    |
 * | "path/to"                       | ""         | "path/to"                | "path/to"                     |
 * | "path//to"                      | ""         | "path//to"               | "path/to"                     |
 * +---------------------------------+------------+--------------------------+-------------------------------+
 *
 * @param path 正規化前のパス
 * @param firstLiteral リテラルの配列の最初の要素
 * @param firstPlaceholder プレースホルダの配列の最初の要素
 */
function normalizePath(path: string, firstLiteral: string, firstPlaceholder: PlaceholderArg): string {
  const { isRootPath, isPossiblyProtocolRelativeUrl } = resolveFormatInfo(path, firstLiteral, firstPlaceholder);

  const match = isPossiblyProtocolRelativeUrl
    ? path.match(/^file:\/{0,3}|^[^:/]+:\/{0,2}|^\/\//)
    : path.match(/^file:\/{0,3}|^[^:/]+:\/{0,2}/);
  const leftPart = match?.[0] || "";
  const rightPart = path.slice(leftPart.length).replace(/\/\/+/g, "/");
  // leftPart が "/" で終わっている場合、 rightPart の先頭の "/" は重複と判断できるので除去する
  let url = `${leftPart}${leftPart.endsWith("/") ? rightPart.replace(/^\/+/, "") : rightPart}`;

  // NOTE: 意図せず相対パスがルートパスに変化する問題を防ぐ
  // urlFrom`${"foo?"}/bar`() のような場合に "/bar" ではなく "bar" を返す
  if (!isPossiblyProtocolRelativeUrl && !isRootPath && url.startsWith("/")) {
    console.warn(
      'It is dangerous to try to generate a root path from a template that assumes a relative path.\nplease improve `${"foo?"}/bar` to `${"foo?/"}bar`.'
    );
    url = url.replace(/^\/+/g, "");
  }

  // NOTE: URLとして扱える物は念のためURLとして解釈できるかチェックする
  if (leftPart) {
    try {
      const isProtocolRelativeUrl = url.startsWith("//");
      // Protocol-relative URLの場合は `https:` を付与してチェック
      if (isProtocolRelativeUrl) {
        new URL(`https:${url}`);
      } else {
        // スラッシュの補完
        // "http:example.com" -> "http://example.com"
        // "http:/example.com" -> "http://example.com"
        // "file:path/to" -> "file:///path/to"
        const delimiter = new URL(url).toString().replace(/^[^:]+(:\/*).*$/, "$1");
        url = url.replace(/:\/*/, (s) => {
          if (s !== delimiter) {
            console.warn("Slash in front of the authority component was missing and has been completed.");
          }
          return delimiter;
        });
      }
    } catch (error) {
      throw new TypeError(`Invalid URL "${url}".`);
    }
  }

  return url;
}

function resolveFormatInfo(path: string, firstLiteral: string, firstPlaceholder: PlaceholderArg) {
  const isProtocolRelativeUrl = firstLiteral.startsWith("//");
  const isRootPath = !isProtocolRelativeUrl && firstLiteral.startsWith("/");
  // Protocol-relative URLの可能性があれば true
  const isPossiblyProtocolRelativeUrl =
    isProtocolRelativeUrl ||
    (typeof firstPlaceholder === "string" &&
      // NOTE: `${"scheme:?"}//` のように Scheme Placeholder が省略可の場合は `//` から開始する可能性を許容しているため
      (firstPlaceholder.startsWith("scheme:?") ||
        // NOTE: SchemeHost SchemeHostPath系は、 "//" から開始する可能性を許容しているため
        firstPlaceholder.startsWith("scheme://host") ||
        firstPlaceholder.startsWith("scheme://authority")));

  return {
    isRootPath,
    isPossiblyProtocolRelativeUrl,
  };
}

function stringifyPaths(paths: string[], converter: (value: string, index: number) => string, separator = ""): string {
  return paths.filter(matchPathValue).map(converter).join(separator);
}

/**
 * パスで有効な値の場合に true を返す
 *
 * - True for string (non-empty) or number
 * - Boolean or other is false
 *
 * @param value
 */
function matchPathValue(value: unknown): value is string {
  switch (typeof value) {
    case "string":
      return value !== "";
    case "number":
      return true;
    case "boolean":
    default: {
      return false;
    }
  }
}

function matchSkipPathValue(value: unknown): boolean {
  return matchSkipValue(value) || value === "";
}

function matchSkipValue(value: unknown): value is false | undefined | null {
  return value === false || value === undefined || value === null;
}
