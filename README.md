# url-from

型安全でパスやクエリの RFC3986 エンコードに対応した URL 生成ライブラリ。

- [Usage]
- [API]
- [Tips]

## Highlight

- 🔒 型安全なプレースホルダによる値の埋め込み
- 🌐 パス、クエリ等、各コンポーネントで適切な RFC3986 エンコード
- 😊 柔軟なスラッシュの管理
- ⛑ lint のような警告によるアドバイス
- 🔱 各種フォーマットをサポート
  - 絶対 URL `https://example.com/`
  - [Protocol-relative URL] `//example.com/`
  - ルートパス `/path/to`
  - 相対パス `path/to`

url-from は依存するライブラリはありません。

## Install

このライブラリは TypeScript 4.7.2 以降で使用できます。

```
npm install url-from
```

## Usage

```js
import urlFrom from "url-from";

// bindUrl: (params?: { tag?: string, "?query": QueryParams, "#fragment"?: string }) => string;
const bindUrl = urlFrom`https://example.com/tags${"/tag?:string"}`;

const url1 = bindUrl();
console.log(url1); // => "https://example.com/tags"

const url2 = bindUrl({
  tag: "🐹", // tag is string type only.
  "?query": { foo: "!'", bar: 2, baz: false },
  "#fragment": "()*",
});
console.log(url2); // => "https://example.com/tags/%F0%9F%90%B9?foo=%21%27&bar=2&baz=false#%28%29%2A"
```

ご利用にあたっては以下もご確認ください。

- [例外が出る主なパターンについて](#例外が出る主なパターンについて)
- [警告が出る主なパターンについて](#警告が出る主なパターンについて)
- [リテラル部分に`%`を含めると警告が出ます](#リテラル部分に--を含めると警告が出ます)

## API

- [Bind Function](#bind-function)
- [User Placeholder](#user-placeholder)
- [Utility Placeholder](#utility-placeholder)
- [Placeholder Options](#placeholder-options)
- [Argument](#argument)
- [Type Narrowing](#type-narrowing)
- [Helper](#helper)
- [Special Values](#special-values)

### Bind Function

`urlFrom` 自体は Bind Function を返す関数です。  
Bind Function を呼び出すことで URL が生成されます。

```js
const bindUrl = urlFrom`users/${"userId:number"}`;
const url1 = bindUrl({ userId: 279 });
const url2 = bindUrl({ userId: 642, "#fragment": "fragment" });
console.log(url1); // => "users/279"
console.log(url2); // => "users/642#fragment"
```

これは、URL の定義ファイルを作り、定義を使って各所で URL を生成できることを意味します。  
Bind Function は [Type Narrowing] によって引数をリテラル型に制限する方法もあるので、これらを組み合わせると強力な URL 管理を実現できます。

### User Placeholder

- [Primitive](#Primitive)
- [Spread](#Spread)

#### Primitive

Format: <code>${"xxx"}</code> (support placeholder options [Value Type] & [Optional] & [Conditional Slash])<br />
Value Type: `string | number`

```js
const url = urlFrom`https://example.com/${"foo"}/to`({ foo: "path" });
console.log(url); // => "https://example.com/path/to"
```

#### Spread

Format: <code>${"...xxx"}</code> (support placeholder options [Value Type] & [Optional] & [Conditional Slash])<br />
Value Type: `Array<string | number>`

```js
const url = urlFrom`https://example.com/${"...paths"}`({ paths: ["path", "to"] });
console.log(url); // => "https://example.com/path/to"
```

セパレータを変更する場合。

```js
const url = urlFrom`https://example.com/${"...paths"}`({ paths: { value: ["path", "to"], separator: "-" } });
console.log(url); // => "https://example.com/path-to"
```

### Utility Placeholder

- [Direct](#direct)
- [SchemeHost](#schemehost)
- [SchemeHostPath](#schemehostpath)
- [Scheme](#scheme)
- [Userinfo](#userinfo)
- [Subdomain](#subdomain)
- [Port](#port)

#### Direct

Format: <code>${["value"]}</code><br />
Value Type: `string | number`

このプレースホルダを使用すると、リテラル文字列に直接エンコードされた文字列を埋め込めます。

```js
const url = urlFrom`https://example.com/path/to/${["white space"]}`();
console.log(url); // => "https://example.com/path/to/white%20space"
```

このプレースホルダは値が必須として扱われるため、空文字を渡すべきではありません。  
もしも、空文字を渡してしまうと例外が発生します。

```js
try {
  const bindUrl = urlFrom`https://example.com/path/to/${[""]}`;
} catch (error) {
  console.log(error.message); // => "The value of the index 0 at direct placeholder is empty string."
}
```

#### SchemeHost

Format: <code>${"scheme://host"}</code> or <code>${"scheme://authority"}</code> (support placeholder options [Optional])<br />
Value Type: `string`

スキームからホスト(ポート)までの文字列を埋め込みます。  
環境別にベース URL を切り替えたい用途向けです。

```js
const url = urlFrom`${"scheme://host"}/path/to`({ "scheme://host": "https://example.com" });
console.log(url); // => "https://example.com/path/to"
```

値にパスを含んでいると警告が出るので、パスを含める場合は[SchemeHostPath Placeholder]を使用してください。

```js
// Warn: The value of the placeholder "scheme://host" cannot contain a path.
//       Use the placeholder "scheme://host/path" to include paths. Received: https://example.com/path
const url = urlFrom`${"scheme://host"}/to`({ "scheme://host": "https://example.com/path" });
console.log(url); // => "https://example.com/path/to"
```

**⚠ 注意点**

- 必ず設定や定義などで用意した、静的な値を渡してください
- 値に動的に連結した文字列を渡すことは脆弱性に繋がるため避けてください
- ホスト部にユニコード、`%HH` 形式、IPv6 を含むと例外を投げます (将来的には対応する可能性があります)
- userinfo 部に区切り文字以外の `:` や `@` を含める場合は、それぞれ `%3A` `%40` 変換してください
- このプレースホルダの値には QueryString や Fragment を含めることが禁止されているため、`?`や`#`以降は無視されます

#### SchemeHostPath

Format: <code>${"scheme://host/path"}</code> or <code>${"scheme://authority/path"}</code><br />
Value Type: `string`

スキームからホストやパスまでの文字列を埋め込みます。  
環境別にベース URL を切り替えたい用途向けです。

```js
const url = urlFrom`${"scheme://host/path"}/to`({ "scheme://host/path": "https://example.com/path" });
console.log(url); // => "https://example.com/path/to"
```

**⚠ 注意点**

- 必ず設定や定義などで用意した、静的な値を渡してください
- 値に動的に連結した文字列を渡すことは脆弱性に繋がるため避けてください
- ホスト部にユニコード、`%HH` 形式、IPv6 を含むと例外を投げます (将来的には対応する可能性があります)
- userinfo 部に区切り文字以外の `:` や `@` を含める場合は、それぞれ `%3A` `%40` 変換してください
- このプレースホルダの値には QueryString や Fragment を含めることが禁止されているため、`?`や`#`以降は無視されます
- このプレースホルダは必須のみ利用可能でオプショナルにはできません

#### Scheme

Format: <code>${"scheme:"}</code> (support placeholder options [Optional])<br />
Value Type: `string`

```js
const url = urlFrom`${"scheme:"}//example.com/path/to`({ "scheme:": "https" });
console.log(url); // => "https://example.com/path/to"
```

#### Userinfo

**一般的に URL にユーザー名とパスワードを使用することはセキュリティ上のリスクがあるため、極力使用しないでください**

Format: <code>${"userinfo@"}</code> (support placeholder options [Optional])<br />
Value Type: `{ user?: string; password?: string }`

```js
const url = urlFrom`https://${"userinfo@"}example.com/path/to`({ "userinfo@": { user: "name", password: "pass" } });
console.log(url); // => "https://name:pass@example.com/path/to"
```

#### Subdomain

Format: <code>${"subdomain."}</code> (support placeholder options [Optional])<br />
Value Type: `string[]`

```js
const url = urlFrom`https://${"subdomain."}example.com/path/to`({ "subdomain.": ["foo", "bar"] });
console.log(url); // => "https://foo.bar.example.com/path/to"
```

セパレータを変更する場合。

```js
const url = urlFrom`https://${"subdomain."}example.com/path/to`({
  "subdomain.": { value: ["foo", "bar"], separator: "-" },
});
console.log(url); // => "https://foo-bar.example.com/path/to"
```

#### Port

Format: <code>${":port"}</code> (support placeholder options [Optional])<br />
Value Type: `number`

```js
const url = urlFrom`https://localhost${":port"}/path/to`({ ":port": 3000 });
console.log(url); // => "https://localhost:3000/path/to"
```

### Placeholder Options

#### Value Type

このライブラリでは TypeScript 風の型指定に対応しています。

プレースホルダ名に続けて `:string` `:number` を記述すると型を指定できます。  
型が未指定の場合は `string | number` を受け入れます。

```js
const url = urlFrom`https://example.com/users/${"userId:string"}`({ userId: "279642" }); // もしも、numberを渡すと型エラーになります
console.log(url); // => "https://example.com/users/279642"
```

[Spread] で使用する場合は `:string[]` `:number[]` を記述してください。  
型が未指定の場合は `Array<string | number>` を受け入れます。

```js
const url = urlFrom`https://example.com/${"...paths:string[]"}`({ paths: ["path", "to"] });
console.log(url); // => "https://example.com/path/to"
```

#### Optional

プレースホルダ名の直後に `?` を記述すると省略可能になります。

```js
const bindUrl = urlFrom`https://example.com/users/${"userId?"}`; // ${"userId?:string"} is optional string
console.log(bindUrl()); // => "https://example.com/users/"
console.log(bindUrl({ userId: 279642 })); // => "https://example.com/users/279642"
```

#### Conditional Slash

プレースホルダ文字列の始端か終端、またはその両方に `/` を記述すると、値が埋め込まれたときだけ有効なスラッシュになります。

```js
const bindUrl1 = urlFrom`https://example.com/users${"/userId?"}`;
console.log(bindUrl1()); // => "https://example.com/users"
console.log(bindUrl1({ userId: "279642" })); // => "https://example.com/users/279642"

const bindUrl2 = urlFrom`https://example.com/users${"/userId?/"}`;
console.log(bindUrl2()); // => "https://example.com/users"
console.log(bindUrl2({ userId: "279642" })); // => "https://example.com/users/279642/"
```

### Argument

- [Query]
- [Fragment]

#### Query

Key: `?query`  
Type: `QueryParams`

```js
const url = urlFrom`https://example.com/path/to`({
  "?query": {
    foo: 1,
    bar: ["a", "b"],
  },
});
console.log(url); // => "https://example.com/path/to?foo=1&bar=a&bar=b"
```

[URLSearchParams]のような形式や、文字列形式で指定する方法。

```js
// リテラル部分に直接指定
const bindUrl = urlFrom`https://example.com/?foo=1&bar=2`;

// リテラル部分のQueryStringに同じキーの値を追加
const url2 = bindUrl({
  // Array<[string, Value]>
  "?query": [
    ["foo", 123],
    ["bar", 234],
  ],
});
console.log(url2); // => "https://example.com/?foo=1&bar=2&foo=123&bar=234"

// 文字列で指定(RFC3986でエンコード対象の文字が含まれると警告が出てエンコードされます)
const url3 = bindUrl({
  // string
  "?query": "foo=123&bar=234", // "?foo=123&bar=234" でも同じ結果になります
});
console.log(url3); // => "https://example.com/?foo=123&bar=234"
```

#### Fragment

Key: `#fragment`  
Type: `string`

```js
const url = urlFrom`https://example.com/path/to`({ "#fragment": "fragment" });
console.log(url); // => "https://example.com/path/to#fragment"
```

リテラル部分に直接指定する方法。

```js
const url = urlFrom`https://example.com/path/to#fragment`();
console.log(url); // => "https://example.com/path/to#fragment"
```

### Type Narrowing

Bind Function の引数をより狭い型にしたい場合は、`narrowing`を使用することで、オプショナルを必須にしたり、各種リテラル型に制限することが可能です。

```ts
const bindUrl = urlFrom`${"scheme:"}//example.com/users/${"userId"}`.narrowing<{
  "scheme:": "http" | "https";
}>;

const url1 = bindUrl({ "scheme:": "http", userId: 279642 }); // ✅
const url2 = bindUrl({ "scheme:": "https", userId: 279642 }); // ✅
const url3 = bindUrl({ "scheme:": "ftp", userId: 279642 }); // ❌ TS2322: Type '"ftp"' is not assignable to type '"http" | "https"'.
```

**ルール**

- 元々引数の型に存在する部分が対象になります
- 元々引数の型を狭められます
  - オプショナルの型を必須にできます
  - 必須の型をオプショナルにはできません

#### 特定のキーや Query を必須にする

```ts
const bindUrl = urlFrom`https://example.com/users/${"userId?"}`.narrowing<{
  userId: number;
  "?query": { foo: string };
  // 自由なQueryを継承しつつ、一部だけ絞り込む場合
  // "?query": { foo: string } & URLFromQueryParams;
}>;

const url1 = bindUrl({ userId: 1, "?query": { foo: "bar" } }); // ✅
const url2 = bindUrl({ userId: 1, "?query": {} }); // ❌ TS2741: Property 'foo' is missing in type '{}' but required in type '{ foo: string; }'.
```

#### 特定のキーワードのみ許容する

```ts
const bindUrl = urlFrom`https://example.com/theme/${"theme:string"}`.narrowing<{
  theme: "lighter" | "dark";
}>;

const url1 = bindUrl({ theme: "dark" }); // ✅
const url2 = bindUrl({ theme: "foo" }); // ❌ TS2322: Type '"foo"' is not assignable to type '"lighter" | "dark"'.
```

#### 複数のパターンを許容する

```ts
const bindUrl = urlFrom`https://example.com/theme/${"theme:string"}${"/color?:string"}`.narrowing<
  | {
      theme: "lighter" | "dark";
    }
  | {
      theme: "original";
      color: "red" | "blue";
    }
>;

const url1 = bindUrl({ theme: "lighter" }); // ✅
const url2 = bindUrl({ theme: "dark" }); // ✅
const url3 = bindUrl({ theme: "original", color: "red" }); // ✅

// ❌ TS2345: Argument of type '{ theme: "original"; }' is not assignable to parameter of type 'Readonly<{ "?query"?: QueryParams | undefined; "#fragment"?: string | undefined; color?: BindParam<string | null | undefined>; } & ({ theme: "lighter" | "dark"; } | { ...; })>'.
//        Property 'color' is missing in type '{ theme: "original"; }' but required in type 'Readonly<{ "?query"?: QueryParams | undefined; "#fragment"?: string | undefined; color?: BindParam<string | null | undefined>; } & { theme: "original"; color: "red" | "blue"; }>'.
const url4 = bindUrl({ theme: "original" });
```

### Helper

#### encodeRFC3986(string)

文字列を[RFC3986]でエンコードします。

**string**

Type: `string`

```js
console.log(encodeRFC3986("!'()*")); // => "%21%27%28%29%2A"
```

#### stringifyQuery(query, fragment?)

QueryString や Fragment 部分の文字列を生成します。

この関数は何を渡しても必ず先頭に"?"を付けた結果を返すため、"?"が不要な場合は`stringifyQuery(query).slice(1)`とすることで "?" を除いた結果を得られます。

**query**

Type: `URLFromQueryParams | QueryDelete`

**fragment**

Type: `string | undefined`

```js
console.log(stringifyQuery({ foo: 1 }, "fragment")); // => "?foo=1#fragment"
console.log(stringifyQuery({ foo: [1, 2] })); // => "?foo=1&foo=2"
console.log(
  stringifyQuery([
    ["foo", 1],
    ["foo", 2],
  ])
); // => "?foo=1&foo=2"
console.log(stringifyQuery(undefined)); // => "?"
console.log(stringifyQuery(undefined, "fragment")); // => "?#fragment"
console.log(stringifyQuery({})); // => "?"
```

#### replaceQuery(url, query?, fragment?)

QueryString や Fragment 部分の置換や削除を行います。

**url**

Type: `string`

**query**

Type: `URLFromQueryParams | QueryDelete`

**fragment**

Type: `string | undefined`

置換する例。

```js
console.log(replaceQuery("https://example.com?foo=1&bar=2#fragment", { bar: "baz" }, "hash")); // => "https://example.com?foo=1&bar=baz#hash"

// 追記
console.log(replaceQuery("?a=b", { foo: 1 })); // => "?a=b&foo=1"
console.log(replaceQuery("?a=b", { foo: [1, 2] })); // => "?a=b&foo=1&foo=2"
console.log(
  replaceQuery("?a=b", [
    ["foo", 1],
    ["foo", 2],
  ])
); // => "?a=b&foo=1&foo=2"
```

削除する例。

```js
console.log(replaceQuery("?foo=1&bar=baz#fragment", QueryDelete, "")); // => ""
console.log(replaceQuery("?foo=1&bar=baz#fragment", { foo: QueryDelete })); // => "?bar=baz#fragment"
```

`undefined` `{}` `""` では削除できない点に注意してください。

```js
console.log(replaceQuery("?foo=1&bar=baz#fragment", undefined, undefined)); // => "?foo=1&bar=baz#fragment"
console.log(replaceQuery("?foo=1&bar=baz#fragment", {}, undefined)); // => "?foo=1&bar=baz#fragment"
console.log(replaceQuery("?foo=1&bar=baz#fragment", "", undefined)); // => "?foo=1&bar=baz#fragment"
```

### Special Values

プレースホルダや Query に特殊な値を使用した場合の効果の一覧です。

| Type or Value | プレースホルダでの効果 | Query での効果 | 補足                                       |
| ------------- | ---------------------- | -------------- | ------------------------------------------ |
| `""`          | Skip                   | `"key="`       | 必須のパスに使用されると例外が投げられます |
| `number`      | `"0"`                  | `"key=0"`      |                                            |
| `NaN`         | `"NaN"`                | `"key=NaN"`    | 値として渡されると警告が出ます             |
| `true`        | -                      | `"key=true"`   | プレースホルダの値には使用できません       |
| `false`       | -                      | `"key=false"`  | プレースホルダの値には使用できません       |
| `null`        | Skip                   | `"key"`        | Query ではキーのみで表現されます           |
| `undefined`   | Skip                   | Skip           |                                            |
| `QueryDelete` | -                      | Delete         | Query のキー削除用の Symbol です           |

```js
const bindUrl = urlFrom`https://example.com/${"value?"}`;

// Placeholder
console.log(bindUrl({ value: "" })); // => "https://example.com/"
console.log(bindUrl({ value: 0 })); // => "https://example.com/0"
// warn: 'The value NaN was passed to the placeholder "value".'
console.log(bindUrl({ value: NaN })); // => "https://example.com/NaN"
console.log(bindUrl({ value: null })); // => "https://example.com/"
console.log(bindUrl({ value: undefined })); // => "https://example.com/"

// Query
console.log(bindUrl({ "?query": { value: "" } })); // => "https://example.com/?value="
console.log(bindUrl({ "?query": { value: 0 } })); // => "https://example.com/?value=0"
// warn: 'Invalid query value for key "value". Received: NaN'
console.log(bindUrl({ "?query": { value: NaN } })); // => "https://example.com/?value=NaN"
console.log(bindUrl({ "?query": { value: null } })); // => "https://example.com/?value"
console.log(bindUrl({ "?query": { value: undefined } })); // => "https://example.com/"
```

## Tips

### 例外が出る主なパターンについて

- 全プレースホルダ共通
  - 必須指定のプレースホルダの値に空文字が渡された場合
  - 型を無視して値が渡された場合
- 各プレースホルダ個別
  - [Scheme Placeholder]の値に許可されない文字が含まれる場合
  - [SchemeHost Placeholder] or [SchemeHostPath Placeholder]の値に`://`が含まれない場合
  - [Direct Placeholder]の値に空文字が渡された場合
  - [Port Placeholder]の値に 0~65535 の範囲外の数値や`NaN`が渡された場合
- その他
  - `new URL()` に渡したとき例外を投げる URL を生成しようとした場合

### 警告が出る主なパターンについて

- リテラル部分
  - リテラル部分に[RFC3986]のエンコード対象文字列が含まれる場合
    - 対処法: [Direct Placeholder]で埋め込むようにしてください
  - リテラル部分の`?=&#`の使用が適切でない場合
- 全プレースホルダ共通
  - 各プレースホルダの値として`NaN`が渡された場合 ([Port Placeholder]の場合は例外)
- 各プレースホルダ個別
  - [SchemeHost Placeholder] or [SchemeHostPath Placeholder]の値に[RFC3986]のエンコード対象文字列が含まれる場合
    - 対処法: [SchemeHost Placeholder] or [SchemeHostPath Placeholder]に限って、エンコード対象文字列を含める場合はパーセントエンコーディング(`%HH`)した値を渡してください
  - [SchemeHost Placeholder] or [SchemeHostPath Placeholder]の値に`?`や`#`が含まれる場合
- その他
  - `new URL()` に渡したとき URL の内容が補完される場合
  - `/` の補完が発生する場合

### リテラル部分に`%`を含めると警告が出ます

パーセントエンコーディング(`%HH`)は[RFC3986]として適切ですが、リテラル部分に使用すると以下の理由により警告を出します。

- `%HH`はデコード後にどのような文字列になるか人間にはわかりにくく誤った記述に繋がりやすいため
- 単一の`%`や不正な形式の`%HH`の検出が必要になり、処理やルールが複雑化するため

リテラル部分に`%`を使うシーンでは[Direct Placeholder]を使用してください。

```js
// warn: The literal part contains an unencoded path string "%". Received: `https://example.com/emoji/%F0%9F%90%B9`
const url1 = urlFrom`https://example.com/emoji/%F0%9F%90%B9%`(); // ❗ Bad
const url2 = urlFrom`https://example.com/emoji/${["🐹%"]}`(); // ✅ Good

console.log(url1); // => "https://example.com/emoji/%25F0%259F%2590%25B9%25"
console.log(url2); // => "https://example.com/emoji/%F0%9F%90%B9%25"
```

### パストラバーサル対策

url-from ではパストラバーサル対策として、動的な埋め込みによって `/./` or `/../` の条件が成立する場合、警告を出して "." を半角スペースに置換します。

```js
// tagsの二階層下へのパスを想定したテンプレート
// https://example.com/tags/<tag>/foo
const bindUrl = urlFrom`https://example.com/tags/${"tag:string"}/foo`;

// 値として "." が渡された場合
// 通常は想定と違う階層へのパスになってしまいますが... https://example.com/tags/./foo -> https://example.com/tags/foo
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
const url1 = bindUrl({ tag: "." });
// 半角スペースに置換されて階層が維持されます
console.log(url1); // => "https://example.com/tags/%20/foo"

// 値として ".." が渡された場合
// 通常は想定と違う階層へのパスになってしまいますが... https://example.com/tags/../foo -> https://example.com/foo
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
const url2 = bindUrl({ tag: ".." });
// 半角スペースに置換されて階層が維持されます
console.log(url2); // => "https://example.com/tags/%20%20/foo"
```

半角スペースに置換する理由は、階層が変わることと、半角スペースに置換することのどちらのリスクが低いかを評価した結果です。

- 半角スペースのみのパスに意味を持たせている可能性が低い
- タグ名等として使用される場合、半角スペースは trim 対象の文字なので、意味を持っている可能性が低い
- DB 等保存対象と絡む場合、バリデーションで空白のみの文字が通過する可能性が低い

このように、実装者にとってパストラバーサルによって階層が変わることも、"."が半角スペースに変わることも、どちらも意図しない挙動ではありますが、意図しない挙動の解決策が無いのであればリスクの少ない方が良いという方針です。

**補足**

- `/.../` は有効なパスとなります (ex. [https://en.wikipedia.org/wiki/...](https://en.wikipedia.org/wiki/...) は https://en.wikipedia.org/wiki/Ellipsis のエイリアスです )
- `/../` を `/%2E%2E/` に変換しても `/../` と同様に解釈されるので無意味です

"." が半角スペースに置換されるのは、動的に埋め込まれる値のみです。  
以下の例のように、リテラルの静的な "." と動的に埋め込まれた "." によって発生する `/../` の場合、リテラルの "." はそのまま残ります。

```js
const bindUrl = urlFrom`https://example.com/dot-files/.${"type:string"}/README.md`;

console.log(bindUrl({ type: "gitignore" })); // => "https://example.com/dot-files/.gitignore/README.md"
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
console.log(bindUrl({ type: "." })); // => "https://example.com/dot-files/.%20/README.md"
```

### 安全の仕組み

- url-from の仕組み上、パスやクエリ等全ての部分でエンコード漏れを起こす方法がありません
- 厳格な型チェックによって不正な値の混入を防げます
- 改善すべき実装には警告が発せられるため、より適切で安全な実装にブラッシュアップできます
- パストラバーサル攻撃のリスクがありません
- 簡潔に記述できるため、可読性の高いコードになります

## NOTE

このドキュメントのサンプルコードは [power-doctest](https://github.com/azu/power-doctest) によってテストされています。

## LICENSE

[@misuken-now/url-from](https://github.com/misuken-now/url-from)・MIT

[URL]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[URLSearchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[Protocol-relative URL]: https://en.wikipedia.org/wiki/Wikipedia:Protocol-relative_URL
[RFC3986]: https://datatracker.ietf.org/doc/html/rfc3986
[Usage]: #usage
[API]: #api
[Bind Function]: #bind-function
[User Placeholder]: #user-placeholder
[Primitive]: #primitive
[Spread]: #spread
[Utility Placeholder]: #utility-placeholder
[Direct Placeholder]: #direct
[SchemeHost Placeholder]: #schemehost
[SchemeHostPath Placeholder]: #schemehostpath
[Scheme Placeholder]: #scheme
[Userinfo Placeholder]: #userinfo
[Subdomain Placeholder]: #subdomain
[Port Placeholder]: #port
[Placeholder Options]: #placeholder-options
[Value Type]: #value-type
[Optional]: #optional
[Conditional Slash]: #conditional-slash
[Argument]: #argument
[Query]: #query
[Fragment]: #fragment
[Type Narrowing]: #type-narrowing
[Helper]: #helper
[Special Values]: #special-values
[Tips]: #tips
