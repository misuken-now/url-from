# url-from

A URL generation library that supports type-safe path and query RFC3986 encoding.

- [Usage]
- [API]
- [Tips]

## Highlight

- 🔒 Embedding values with type-safe placeholders
- 🌐 Proper RFC3986 encoding for each component such as path and query
- 😊 Flexible management of slashes
- ⛑ Advice through warnings, similar to lint
- 🔱 Support for various formats
  - Absolute URL `https://example.com/`
  - [Protocol-relative URL] `//example.com/`
  - Root path `/path/to`
  - Relative path `path/to`

url-from has no external dependencies.

## Install

This library can be used with TypeScript 4.7.2 or later.

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

Please also check the following when using this library:

- [Common Patterns for Throwing Exceptions](#common-patterns-for-throwing-exceptions)
- [Common Patterns for Emitting Warnings](#common-patterns-for-emitting-warnings)
- [Literal Parts with `%` will Emit Warnings](#literal-parts-with--will-emit-warnings)

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

`urlFrom` itself is a function that returns a Bind Function.
By calling the Bind Function, a URL is generated.

```js
const bindUrl = urlFrom`users/${"userId:number"}`;
const url1 = bindUrl({ userId: 279 });
const url2 = bindUrl({ userId: 642, "#fragment": "fragment" });
console.log(url1); // => "users/279"
console.log(url2); // => "users/642#fragment"
```

This means that you can create a URL definition file and use the definition to generate URLs in various places.
The Bind Function also allows restricting arguments to literal types through [Type Narrowing], enabling powerful URL management.

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

If you want to change the separator:

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

This placeholder allows you to directly embed a string that is encoded as a literal string.

```js
const url = urlFrom`https://example.com/path/to/${["white space"]}`();
console.log(url); // => "https://example.com/path/to/white%20space"
```

Since this placeholder treats the value as required, you should not pass an empty string. If you pass an empty string, an exception will be thrown.

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

Embeds a string representing the portion from scheme to host (including port). It is useful for switching base URLs depending on the environment.

```js
const url = urlFrom`${"scheme://host"}/path/to`({ "scheme://host": "https://example.com" });
console.log(url); // => "https://example.com/path/to"
```

If you include a path in the value, a warning will be issued. In such cases, use the [SchemeHostPath Placeholder].

```js
// Warn: The value of the placeholder "scheme://host" cannot contain a path.
//       Use the placeholder "scheme://host/path" to include paths. Received: https://example.com/path
const url = urlFrom`${"scheme://host"}/to`({ "scheme://host": "https://example.com/path" });
console.log(url); // => "https://example.com/path/to"
```

**⚠ Note:**

- Always pass static values prepared in settings or definitions.
- Avoid passing dynamically concatenated strings as values, as it can lead to vulnerabilities.
- If the host part contains Unicode, `%HH` format, or IPv6, an exception will be thrown (future support may be added).
- If you want to include characters other than the delimiter `:` or `@` in the userinfo part, convert them to `%3A` and `%40`, respectively.
- The value of this placeholder should not include a QueryString or Fragment, so any characters after `?` or `#` will be ignored.

#### SchemeHostPath

Format: <code>${"scheme://host/path"}</code> or <code>${"scheme://authority/path"}</code><br />
Value Type: `string`

Embeds a string representing the portion from scheme to host or path. It is useful for switching base URLs depending on the environment.

```js
const url = urlFrom`${"scheme://host/path"}/to`({ "scheme://host/path": "https://example.com/path" });
console.log(url); // => "https://example.com/path/to"
```

**⚠ Note:**

- Always pass static values prepared in settings or definitions.
- Avoid passing dynamically concatenated strings as values, as it can lead to vulnerabilities.
- If the host part contains Unicode, `%HH` format, or IPv6, an exception will be thrown (future support may be added).
- If you want to include characters other than the delimiter `:` or `@` in the userinfo part, convert them to `%3A` and `%40`, respectively.
- The value of this placeholder should not include a QueryString or Fragment, so any characters after `?` or `#` will be ignored.
- This placeholder is available only as required and cannot be optional.

#### Scheme

Format: <code>${"scheme:"}</code> (support placeholder options [Optional])<br />
Value Type: `string`

```js
const url = urlFrom`${"scheme:"}//example.com/path/to`({ "scheme:": "https" });
console.log(url); // => "https://example.com/path/to"
```

#### Userinfo

**Using usernames and passwords in URLs is generally a security risk, so please avoid it as much as possible.**

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

If you want to change the separator:

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

This library supports TypeScript-like type specification.

You can specify the type by appending `:string` or `:number` after the placeholder name.  
If the type is not specified, it accepts `string | number` as the default type.

```js
const url = urlFrom`https://example.com/users/${"userId:string"}`({ userId: "279642" }); // If you pass a number, it will result in a type error
console.log(url); // => "https://example.com/users/279642"
```

When using with [Spread], please use `:string[]` or `:number[]` for array types.  
If the type is not specified, it accepts `Array<string | number>` as the default type.

```js
const url = urlFrom`https://example.com/${"...paths:string[]"}`({ paths: ["path", "to"] });
console.log(url); // => "https://example.com/path/to"
```

#### Optional

By appending `?` immediately after the placeholder name, it becomes optional.

```js
const bindUrl = urlFrom`https://example.com/users/${"userId?"}`; // ${"userId?:string"} is optional string
console.log(bindUrl()); // => "https://example.com/users/"
console.log(bindUrl({ userId: 279642 })); // => "https://example.com/users/279642"
```

#### Conditional Slash

By adding `/` at the beginning, end, or both ends of the placeholder string, the slash becomes effective only when a value is embedded.

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

Ways to specify in the format of [URLSearchParams] or as a string.

```js
// Directly specified in the literal part
const bindUrl = urlFrom`https://example.com/?foo=1&bar=2`;

// Adding values with the same keys to the QueryString in the literal part
const url2 = bindUrl({
  // Array<[string, Value]>
  "?query": [
    ["foo", 123],
    ["bar", 234],
  ],
});
console.log(url2); // => "https://example.com/?foo=1&bar=2&foo=123&bar=234"

// Specifying as a string (Warning: If it contains characters that need to be encoded according to RFC3986, it will be encoded)
const url3 = bindUrl({
  // string
  "?query": "foo=123&bar=234", // It will produce the same result even with "?foo=123&bar=234"
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

Method to directly specify in the literal part.

```js
const url = urlFrom`https://example.com/path/to#fragment`();
console.log(url); // => "https://example.com/path/to#fragment"
```

### Type Narrowing

If you want to narrow down the argument of the Bind Function to a more specific type, you can use `narrowing` to make optionals mandatory or restrict to various literal types.

```ts
const bindUrl = urlFrom`${"scheme:"}//example.com/users/${"userId"}`.narrowing<{
  "scheme:": "http" | "https";
}>;

const url1 = bindUrl({ "scheme:": "http", userId: 279642 }); // ✅
const url2 = bindUrl({ "scheme:": "https", userId: 279642 }); // ✅
const url3 = bindUrl({ "scheme:": "ftp", userId: 279642 }); // ❌ TS2322: Type '"ftp"' is not assignable to type '"http" | "https"'.
```

**Rules**

- Only the parts that exist in the original argument type are targeted.
- The original argument type can be narrowed down.
  - Optional types can be made mandatory.
  - Mandatory types cannot be made optional.

#### Making specific keys or QueryParams mandatory

```ts
const bindUrl = urlFrom`https://example.com/users/${"userId?"}`.narrowing<{
  userId: number;
  "?query": { foo: string };
  // Narrowing down while inheriting free QueryParams
  // "?query": { foo: string } & URLFromQueryParams;
}>;

const url1 = bindUrl({ userId: 1, "?query": { foo: "bar" } }); // ✅
const url2 = bindUrl({ userId: 1, "?query": {} }); // ❌ TS
### Helper

#### encodeRFC3986(string)

Encodes a string using [RFC3986].

**string**

Type: `string`

```js
console.log(encodeRFC3986("!'()*")); // => "%21%27%28%29%2A"
```

#### stringifyQuery(query, fragment?)

Generates a string for the QueryString or Fragment portion.

This function always returns the result with a leading "?" regardless of what is passed. If you don't need the "?", you can use `stringifyQuery(query).slice(1)` to obtain the result without the "?".

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

Performs replacement or deletion of the QueryString or Fragment portion.

**url**

Type: `string`

**query**

Type: `URLFromQueryParams | QueryDelete`

**fragment**

Type: `string | undefined`

Replacement example:

```js
console.log(replaceQuery("https://example.com?foo=1&bar=2#fragment", { bar: "baz" }, "hash")); // => "https://example.com?foo=1&bar=baz#hash"

// Additional examples
console.log(replaceQuery("?a=b", { foo: 1 })); // => "?a=b&foo=1"
console.log(replaceQuery("?a=b", { foo: [1, 2] })); // => "?a=b&foo=1&foo=2"
console.log(
  replaceQuery("?a=b", [
    ["foo", 1],
    ["foo", 2],
  ])
); // => "?a=b&foo=1&foo=2"
```

Deletion example:

```js
console.log(replaceQuery("?foo=1&bar=baz#fragment", QueryDelete, "")); // => ""
console.log(replaceQuery("?foo=1&bar=baz#fragment", { foo: QueryDelete })); // => "?bar=baz#fragment"
```

Note that deletion cannot be done with `undefined`, `{}`, or `""`.

```js
console.log(replaceQuery("?foo=1&bar=baz#fragment", undefined, undefined)); // => "?foo=1&bar=baz#fragment"
console.log(replaceQuery("?foo=1&bar=baz#fragment", {}, undefined)); // => "?foo=1&bar=baz#fragment"
console.log(replaceQuery("?foo=1&bar=baz#fragment", "", undefined)); // => "?foo=1&bar=baz#fragment"
```

### Special Values

A list of effects when using special values in placeholders or queries.

| Type or Value | Effect of Placeholder | Effect in Query | Supplement |
| ------------- | ---------------------- | -------------- | ------------------------------------------ |
| `""`          | Skip                   | `"key="`       | An exception is thrown when used in a required path. |
| `number`      | `"0"`                  | `"key=0"`      |                                            |
| `NaN`         | `"NaN"`                | `"key=NaN"`    | A warning is issued when passed as a value.             |
| `true`        | -                      | `"key=true"`   | Cannot be used as a placeholder value.       |
| `false`       | -                      | `"key=false"`  | Cannot be used as a placeholder value.       |
| `null`        | Skip                   | `"key"`        | Represented only by the key in the Query.           |
| `undefined`   | Skip                   | Skip           |                                            |
| `QueryDelete` | -                      | Delete         | Symbol for deleting the key in the Query.           |

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

### Common cases for exceptions

- Common for all placeholders:
  - Empty string passed to a required placeholder value.
  - Value is passed without considering the type.
- Individual placeholders:
  - Invalid characters included in the value of [Scheme Placeholder].
  - [SchemeHost Placeholder] or [SchemeHostPath Placeholder] does not include `://` in its value.
  - Empty string passed to the value of [Direct Placeholder].
  - Value outside the range of 0-65535 or `NaN` is passed to the [Port Placeholder].
- Others:
  - Attempting to create a URL that throws an exception when passed to `new URL()`.

### A warning is issued when `%` is included in the literal part

Percent-encoding (`%HH`) is appropriate according to [RFC3986], but a warning is issued when it is used in the literal part for the following reasons:

- `%HH` is not easily understandable to humans in its decoded form and can lead to incorrect representations.
- Detecting single `%` or malformed `%HH` requires complex processing and rules.

When using `%` in the literal part, please use [Direct Placeholder].

```js
// warn: The literal part contains an unencoded path string "%". Received: `https://example.com/emoji/%F0%9F%90%B9`
const url1 = urlFrom`https://example.com/emoji/%F0%9F%90%B9%`(); // ❗ Bad
const url2 = urlFrom`https://example.com/emoji/${["🐹%"]}`(); // ✅ Good

console.log(url1); // => "https://example.com/emoji/%25F0%259F%2590%25B9%25"
console.log(url2); // => "https://example.com/emoji/%F0%9F%90%B9%25"
```

### Path Traversal Protection

In url-from, as a path traversal protection measure, if the conditions of `/./` or `/../` are satisfied through dynamic embedding, a warning is issued and the "." is replaced with a half-width space.

```js
// Assuming a template for a path under the second level of tags
// https://example.com/tags/<tag>/foo
const bindUrl = urlFrom`https://example.com/tags/${"tag:string"}/foo`;

// When "." is passed as a value
// Normally, it would result in a path to a different level than intended... https://example.com/tags/./foo -> https://example.com/tags/foo
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
const url1 = bindUrl({ tag: "." });
// The path is maintained with the replaced half-width space
console.log(url1); // => "https://example.com/tags/%20/foo"

// When ".." is passed as a value
// Normally, it would result in a path to a different level than intended... https://example.com/tags/../foo -> https://example.com/foo
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
const url2 = bindUrl({ tag: ".." });
// The path is maintained with the replaced half-width space
console.log(url2); // => "https://example.com/tags/%20%20/foo"
```

The reason for replacing with a half-width space is based on evaluating which risk is lower: changing the directory structure or replacing the "." with a half-width space.

- It is unlikely that a path consisting only of a half-width space has any meaning.
- When used as a tag name, a half-width space is a character subject to trimming, so it is unlikely to have any meaning.
- When it interacts with databases or other storage systems, it is unlikely that a blank-only string would pass through validation.

In this way, while both changing the directory structure due to path traversal and replacing "." with a half-width space are unintended behaviors for implementers, if there is no solution to unintended behavior, it is preferable to choose the option with less risk.

**Additional Information**

- `/.../` is a valid path (e.g., [https://en.wikipedia.org/wiki/...](https://en.wikipedia.org/wiki/...) is an alias for [https://en.wikipedia.org/wiki/Ellipsis](https://en.wikipedia.org/wiki/Ellipsis)).
- Converting `/../` to `/%2E%2E/` is meaningless because it is interpreted the same as `/../`.

The replacement of "." with a half-width space only occurs for dynamically embedded values. In cases like the following example, where the `/../` occurs due to the static literal ".", the literal "." remains unchanged.

```js
const bindUrl = urlFrom`https://example.com/dot-files/.${"type:string"}/README.md`;

console.log(bindUrl({ type: "gitignore" })); // => "https://example.com/dot-files/.gitignore/README.md"
// warn: When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".
console.log(bindUrl({ type: "." })); // => "https://example.com/dot-files/.%20/README.md"
```

### Security Mechanisms

- With the url-from mechanism, there is no way to overlook encoding in any part, such as the path or query.
- Strict type checks prevent the inclusion of invalid values.
- Warnings are issued for implementations that need improvement, allowing for refinement into more appropriate and secure implementations.
- There is no risk of path traversal attacks.
- It enables concise and readable code.

## NOTE

The sample code in this document has been tested using [power-doctest](https://github.com/azu/power-doctest).

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
