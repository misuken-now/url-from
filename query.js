"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyQuery = stringifyQuery;
exports.replaceQuery = replaceQuery;
const definition_1 = require("./definition");
const util_1 = require("./util");
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
function stringifyQuery(query, fragment) {
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
function replaceQuery(url, query, fragment) {
    if (query === definition_1.QueryDelete) {
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
                    console.warn(`The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${offset} "${str}"`);
                    return (0, util_1.encodeRFC3986)(str);
                });
                // 値の部分にエンコード漏れの"="が無いか確認
                // "?*=*=*&"
                // "?*=*=*#"
                // "?*=*=*"
                newQuery = newQuery.replace(/=(?=[^=&#]*=)[^&#]+/g, (s, offset) => {
                    return s.replace(/(?!^)=/g, (str, localOffset) => {
                        console.warn(`The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${offset + localOffset} "${str}"`);
                        return "%3D";
                    });
                });
                return generateQuery(baseQuery, newQuery);
            }
            return generateQuery(baseQuery, query);
        });
    }
    // 指定があれば静的なフラグメントを更新
    if (fragment !== undefined) {
        url = url.replace(/#.*|$/, () => (fragment === "" ? "" : `#${(0, util_1.encodeRFC3986)(fragment)}`));
    }
    return url;
}
function generateQuery(baseQueryString, params, encoder = util_1.encodeRFC3986) {
    if (typeof params === "string") {
        return generateQuery(baseQueryString, new URLSearchParams(escapeQueryString(escapeQueryString(params))), (v) => v);
    }
    const baseParams = new URLSearchParams(escapeQueryString(escapeQueryString(baseQueryString)));
    const appearedKeys = new Set();
    const paramsIsArray = Array.isArray(params);
    const entries = paramsIsArray
        ? params.filter((param) => !!param)
        : params instanceof URLSearchParams
            ? params
            : Object.entries(params);
    function run(key, value) {
        if (value === undefined) {
            return;
        }
        // Pattern: { key: [1, 2]} -> "key=1&key=2"
        if (Array.isArray(value)) {
            value.forEach((v) => run(key, v));
            return;
        }
        let safeValue;
        if (typeof value === "string") {
            safeValue = encoder(encoder(value));
        }
        else {
            if (value === definition_1.QueryDelete) {
                baseParams.delete(key);
                return;
            }
            if (!validParamValue(value)) {
                const message = `Invalid query value for key "${key}". Received: ${value}`;
                if (Number.isNaN(value)) {
                    console.warn(message);
                }
                else {
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
        }
        else {
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
function validParamValue(value) {
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
function escapeQueryString(str) {
    return str.replace(/[^?&=]+/g, util_1.encodeRFC3986);
}
