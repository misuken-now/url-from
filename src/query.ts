import { QueryDelete, QueryParams, QueryValue } from "./definition";
import { encodeRFC3986 } from "./util";

/**
 * QueryStringやFragmentの部分を生成します。
 *
 * 何を渡しても必ず先頭に"?"を付けた結果を返すため、
 * "?"が不要な場合は`stringifyQuery(query).slice(1)`とすることで "?" を除いた結果を得られます。
 *
 * @example 各種生成方法
 *   stringifyQuery({ foo: 1 }, "fragment"); // => "?foo=1#fragment"
 *   stringifyQuery({ foo: [1, 2] }); // => "?foo=1&foo=2"
 *   stringifyQuery([["foo", 1], ["foo", 2]]); // => "?foo=1&foo=2"
 *   stringifyQuery(undefined); // => "?"
 *   stringifyQuery(undefined, "fragment"); // => "?#fragment"
 *   stringifyQuery({}); // => "?"
 *
 * @param query QueryStringの部分を生成するための値
 * @param fragment Fragmentの部分を生成するための値
 */
export function stringifyQuery(query: QueryParams | QueryDelete | undefined, fragment?: string): `?${string}` {
  return `?${replaceQuery("", query, fragment).replace(/^\?/, "")}`;
}

/**
 * QueryStringやFragmentの部分を生成します。
 *
 * @example 置換
 *   replaceQuery("https://example.com?foo=1&bar=2#fragment", { bar: "baz" }, "hash"); // => "https://example.com?foo=1&bar=baz#hash"
 *
 *   // 追記
 *   replaceQuery("?a=b", { foo: 1 }); // => "?a=b&foo=1"
 *   replaceQuery("?a=b", { foo: [1, 2] }); // => "?a=b&foo=1&foo=2"
 *   replaceQuery("?a=b", [["foo", 1], ["foo", 2]]); // => "?a=b&foo=1&foo=2"
 *
 * @example 削除
 *   replaceQuery("?foo=1&bar=baz#fragment", QueryDelete, ""); // => ""
 *   replaceQuery("?foo=1&bar=baz#fragment", { foo: QueryDelete }); // => "?bar=baz#fragment"
 *
 * @param url URL及びパスの部分
 * @param query QueryStringの部分を生成するための値。シンボル{@see QueryDelete}を渡すと対象部分のQueryStringが無くなります。
 * @param fragment Fragmentの部分を生成するための値。`""`を渡すとFragment部分は無くなります。
 */
export function replaceQuery(url: string, query?: QueryParams | QueryDelete, fragment?: string): string {
  if (query === QueryDelete) {
    return replaceQuery(url.replace(/\?[^#]*(?=#|$)/, ""), undefined, fragment);
  }
  if (url.includes("?") || query !== undefined) {
    // "?"から"#"の間 or "#" の直前 or 終端 のいずれかを置換します。
    // 最終的に "?" だけ残る場合は除去します。
    url = url.replace(/\?[^#]*|(?=#)|$/, (baseQuery) => {
      // 更新の必要がない場合
      if (!query || query === "?") {
        return baseQuery === "?" ? "" : baseQuery;
      }

      // 文字列形式で更新する場合は安全上の確認が必要
      // RFC3986で適切にエンコードされていない文字列に対して警告を出して補正します。
      if (typeof query === "string") {
        // エンコード漏れを検出してエンコード
        // 先頭の"?"は有効なため、それ以降の文字列に対してチェック。
        let newQuery = query.replace(/(?!^\?)[^\w%&=\-._~]+/gi, (str, offset) => {
          console.warn(
            `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${offset} "${str}"`
          );
          return encodeRFC3986(str);
        });

        // "="は特定の出現パターンのとき、冗長な記述と判断して削除します。
        if (newQuery.includes("&=") || newQuery.includes("?=") || newQuery.includes("==")) {
          const match = newQuery.match(/[?&=]=/i);
          if (match) {
            console.warn(
              `Incorrect encoding for string type QueryString. Possible encoding omission. "${newQuery}" index: ${match.index} "${match[0]}"`
            );
            newQuery = newQuery
              // キーの存在しない項目の場合は値ごと除去
              // "?=1" -> "?"
              // "?foo=1&=1" -> "?foo=1"
              // "?foo=1&=2&bar=3" -> "?foo=1&bar=3"
              .replace(/([?&])=[^&]*/g, (_, s1) => s1)
              // 連続する"="は正規化
              // "foo==1" -> "foo=1"
              .replace(/==+/g, `=`);
            return generateQuery(baseQuery, newQuery);
          }
        }
        return generateQuery(baseQuery, newQuery);
      }

      return generateQuery(baseQuery, query);
    });
  }

  // 指定があれば静的なフラグメントを更新
  if (fragment !== undefined) {
    url = url.replace(/#.*|$/, () => (fragment === "" ? "" : `#${encodeRFC3986(fragment)}`));
  }

  return url;
}

function generateQuery(
  baseQueryString: string,
  params: QueryParams,
  encoder: (str: string) => string = encodeRFC3986
): string {
  if (typeof params === "string") {
    return generateQuery(baseQueryString, new URLSearchParams(escapeQueryString(escapeQueryString(params))), (v) => v);
  }
  const baseParams = new URLSearchParams(escapeQueryString(escapeQueryString(baseQueryString)));
  const appearedKeys = new Set<string>();
  const paramsIsArray = Array.isArray(params);
  const entries = paramsIsArray
    ? params.filter((param): param is readonly [string, QueryValue] => !!param)
    : params instanceof URLSearchParams
    ? params
    : Object.entries(params);
  function run(key: string, value: unknown) {
    if (value === undefined) {
      return;
    }
    // Pattern: { key: [1, 2]} -> "key=1&key=2"
    if (Array.isArray(value)) {
      value.forEach((v) => run(key, v));
      return;
    }
    let safeValue: string;
    if (typeof value === "string") {
      safeValue = encoder(encoder(value));
    } else {
      if (value === QueryDelete) {
        baseParams.delete(key);
        return;
      }
      if (!validParamValue(value)) {
        const message = `Invalid query value for key "${key}". Received: ${value}`;
        if (Number.isNaN(value)) {
          console.warn(message);
        } else {
          throw new TypeError(message);
        }
      }

      // nullの場合は特殊処理を行います。
      // - fooが""の場合は "foo=" のように"="を付ける
      // - fooがnullの場合は "foo" のように"="を付けない
      // URLSearchParamsは自動的に"="を付加するため、削除する処理が必要になります。
      // 他の値は二重エンコードされているため、エンコードしない"@"をマーカーとして利用します。
      const nullMaker = "@";
      safeValue = value === null ? nullMaker : value.toString();
    }
    if (paramsIsArray || appearedKeys.has(key)) {
      baseParams.append(encoder(encoder(key)), safeValue);
    } else {
      baseParams.set(encoder(encoder(key)), safeValue);
      appearedKeys.add(key);
    }
  }

  for (const [key, value] of entries) {
    run(key, value);
  }

  // nullMakerを埋め込んだ物があれば"="と一緒に削除
  // 他の値は二重エンコードされており、"%"に続く文字列は"25"("%"をエンコードしたもの)しかないため、以下の置換は安全に行なえます。
  const doubleEncodedResult = baseParams.toString().replace(/=%40/g, "");
  const result = decodeURIComponent(decodeURIComponent(doubleEncodedResult));
  return result ? `?${result}` : "";
}

function validParamValue(value: unknown): boolean {
  if (Number.isNaN(value)) {
    return false;
  }
  if (value === undefined || value === null) {
    return true;
  }
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return true;
    default: {
      return false;
    }
  }
}

function escapeQueryString(str: string) {
  return str.replace(/[^?&=]+/g, encodeRFC3986);
}
