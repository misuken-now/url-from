import { QueryDelete, QueryParams } from "./definition";
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
export declare function stringifyQuery(query: QueryParams | QueryDelete | undefined, fragment?: string): `?${string}`;
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
export declare function replaceQuery(url: string, query?: QueryParams | QueryDelete, fragment?: string): string;
