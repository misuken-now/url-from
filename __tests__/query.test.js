"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_1 = require("../query");
const definition_1 = require("../definition");
describe("stringifyQuery", () => {
    it.each([
        [undefined, "?"],
        [{}, "?"],
        [{ "🐹": "🐹" }, "?%F0%9F%90%B9=%F0%9F%90%B9"],
        [
            [
                ["foo", 1],
                ["bar", "value"],
                ["baz1", true],
                ["baz2", false],
                ["null", null],
                ["undefined", undefined],
            ],
            "?foo=1&bar=value&baz1=true&baz2=false&null",
        ],
    ])(`stringifyQuery("%s", %s) -> "%s"`, (query, expected) => {
        expect((0, query_1.stringifyQuery)(query)).toBe(expected);
    });
});
describe("replaceQuery", () => {
    // 各種パスでテストを通すこと
    describe.each([
        ["no path", ""],
        ["root url", "/"],
        ["relative url", "path/to"],
        ["protocol relative url", "//example.com/path/to"],
        ["absolute url", "https://example.com/path/to"],
    ])(`%s "%s"`, (_, basePath) => {
        describe("query overwrite", () => {
            it.each([
                [`${basePath}`, undefined, `${basePath}`],
                [`${basePath}`, {}, `${basePath}`],
                [`${basePath}?`, undefined, `${basePath}`],
                [`${basePath}?`, {}, `${basePath}`],
                [`${basePath}?foo=1&bar=2`, {}, `${basePath}?foo=1&bar=2`],
                [`${basePath}?foo=1&bar=2`, { bar: 20, baz: 30 }, `${basePath}?foo=1&bar=20&baz=30`],
                [
                    `${basePath}?foo=1&bar=2`,
                    { bar: [20, 200], baz: [30, 300] },
                    `${basePath}?foo=1&bar=20&bar=200&baz=30&baz=300`,
                ],
                ["https://example.com?a=b", { foo: 1 }, "https://example.com?a=b&foo=1"],
                ["https://example.com?a=b", { foo: [1, 2] }, "https://example.com?a=b&foo=1&foo=2"],
                [
                    "https://example.com?a=b",
                    [
                        ["foo", 1],
                        ["foo", 2],
                    ],
                    "https://example.com?a=b&foo=1&foo=2",
                ],
                ["https://example.com?a=b", undefined, "https://example.com?a=b"],
                ["https://example.com?a=b", {}, "https://example.com?a=b"],
            ])(`replaceQuery("%s", %s) -> "%s"`, (path, query, expected) => {
                expect((0, query_1.replaceQuery)(path, query)).toBe(expected);
            });
            it.each([
                [
                    "https://example.com?foo=1&bar=2#hash",
                    { bar: "baz" },
                    "fragment",
                    "https://example.com?foo=1&bar=baz#fragment",
                ],
                ["https://example.com?a=b", { foo: [1, 2] }, "hash", "https://example.com?a=b&foo=1&foo=2#hash"],
                [
                    "https://example.com?a=b",
                    [
                        ["foo", 1],
                        ["foo", 2],
                    ],
                    "hash",
                    "https://example.com?a=b&foo=1&foo=2#hash",
                ],
                ["https://example.com?a=b", undefined, "hash", "https://example.com?a=b#hash"],
                ["https://example.com?a=b", {}, "hash", "https://example.com?a=b#hash"],
            ])(`replaceQuery("%s", %s, "%s") -> "%s"`, (path, query, fragment, expected) => {
                expect((0, query_1.replaceQuery)(path, query, fragment)).toBe(expected);
            });
        });
        describe("query append", () => {
            it.each([
                [`${basePath}?foo=1&bar=2`, [], `${basePath}?foo=1&bar=2`],
                [
                    `${basePath}?foo=1&bar=2`,
                    [
                        ["bar", 20],
                        ["baz", 30],
                    ],
                    `${basePath}?foo=1&bar=2&bar=20&baz=30`,
                ],
                // 削除と追記
                [
                    `${basePath}?foo=1&bar=2&bar=20`,
                    [
                        ["bar", definition_1.QueryDelete],
                        ["bar", 20],
                        ["bar", 200],
                    ],
                    `${basePath}?foo=1&bar=20&bar=200`,
                ],
            ])(`replaceQuery("%s", %s) -> "%s"`, (path, query, expected) => {
                expect((0, query_1.replaceQuery)(path, query)).toBe(expected);
            });
        });
        describe("文字列で設定", () => {
            it.each([
                [`${basePath}`, "", `${basePath}`],
                [`${basePath}`, "?", `${basePath}`],
                [`${basePath}?`, "?", `${basePath}`],
                [`${basePath}?`, "?foo=1", `${basePath}?foo=1`],
                [`${basePath}?`, "foo=1", `${basePath}?foo=1`],
                [`${basePath}?foo=1`, "", `${basePath}?foo=1`],
                [`${basePath}?foo=1`, "?", `${basePath}?foo=1`],
                [`${basePath}?foo=1`, "foo=2", `${basePath}?foo=2`],
                [`${basePath}?foo=1`, "?foo=2", `${basePath}?foo=2`],
                [`${basePath}?foo=1&bar=2`, "?bar=20&bar=300&baz=3", `${basePath}?foo=1&bar=20&bar=300&baz=3`],
                // エンコードされない全ての文字が残ること
                [
                    `${basePath}`,
                    "?abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-._~%20=&",
                    `${basePath}?abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-._~%20=`,
                ],
            ])(`"%s"`, (path, query, expected) => {
                expect((0, query_1.replaceQuery)(path, query)).toBe(expected);
            });
            describe("エンコード漏れの文字列は警告を出してエンコードする", () => {
                it.each([
                    [`${basePath}`, "??", `${basePath}?%3F=`, 1, "?"],
                    [`${basePath}`, "?foo=1?&bar=2", `${basePath}?foo=1%3F&bar=2`, 6, "?"],
                    [`${basePath}`, "?foo=1+&bar=2", `${basePath}?foo=1%2B&bar=2`, 6, "+"],
                    [`${basePath}`, "?foo=1+ &bar=2", `${basePath}?foo=1%2B%20&bar=2`, 6, "+ "],
                ])(`"%s"`, (path, query, expected, index, character) => {
                    const result = testWarnMessage(() => {
                        return (0, query_1.replaceQuery)(path, query);
                    }, [
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${index} "${character}"`,
                    ]);
                    expect(result).toBe(expected);
                });
                it(`複数のエンコード漏れに警告を出すこと`, () => {
                    const result = testWarnMessage(() => {
                        return (0, query_1.replaceQuery)(basePath, "?foo=1+ &ba +r=2");
                    }, [
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "?foo=1+ &ba +r=2" index: 6 "+ "`,
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "?foo=1+ &ba +r=2" index: 11 " +"`,
                    ]);
                    expect(result).toBe(`${basePath}?foo=1%2B%20&ba%20%2Br=2`);
                });
            });
            describe("空文字のキーが残ること", () => {
                it.each([["?=bar"], ["?=bar&=baz"]])(`"%s"`, (query) => {
                    const result = testNotWarnMessage(() => (0, query_1.replaceQuery)(basePath, query));
                    expect(result).toBe(`${basePath}${query}`);
                });
            });
            describe("イコールのエンコード漏れに警告を出してエンコードすること", () => {
                it.each([
                    ["?foo==bar", "?foo=%3Dbar", [5]],
                    ["?foo===bar", "?foo=%3D%3Dbar", [5, 6]],
                    ["?foo=bar=baz", "?foo=bar%3Dbaz", [8]],
                    ["?foo==bar==baz", "?foo=%3Dbar%3D%3Dbaz", [5, 9, 10]],
                    // 空のキーも有効
                    ["?==bar&==baz", "?=%3Dbar&=%3Dbaz", [2, 8]],
                ])(`"%s"`, (query, expectedQuery, expectedWarningIndexes) => {
                    const result = testWarnMessage(() => (0, query_1.replaceQuery)(basePath, query), expectedWarningIndexes.map((index) => `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${index} "="`));
                    expect(result).toBe(`${basePath}${expectedQuery}`);
                });
            });
        });
        describe("配列で設定", () => {
            it.each([
                // "" -> "foo="
                // false -> ""
                // null -> "foo"
                // undefined -> ""
                [{ foo: [1, "2", "", false, null, undefined] }, `${basePath}?foo=1&foo=2&foo=&foo=false&foo`],
                [
                    [
                        ["foo", [1, "a", "", false, null, undefined]],
                        ["foo", [true, "b", "", false, null, undefined]],
                        // 以下のような書き方ができるよう、項目自体のfalsyな値は無視する
                        // [value && [value]]
                        false,
                        null,
                        undefined,
                        "",
                        ["bar", [10, "c", "", false, null, undefined]],
                    ],
                    `${basePath}?foo=1&foo=a&foo=&foo=false&foo&foo=true&foo=b&foo=&foo=false&foo&bar=10&bar=c&bar=&bar=false&bar`,
                ],
                // 削除混じっている場合はその時点で削除され、以降の処理は通常通り行われる
                [{ foo: [1, definition_1.QueryDelete, "2", "", false, null, undefined] }, `${basePath}?foo=2&foo=&foo=false&foo`],
                [
                    [
                        ["foo", [1, "a", "", false, null, undefined, definition_1.QueryDelete]],
                        ["foo", [true, "b", "", false, null, undefined]],
                        ["bar", [10, "c", "", false, null, undefined]],
                    ],
                    `${basePath}?foo=true&foo=b&foo=&foo=false&foo&bar=10&bar=c&bar=&bar=false&bar`,
                ],
            ])(`replaceQuery("%s", %s) -> "%s""`, (query, expected) => {
                expect((0, query_1.replaceQuery)(basePath, query)).toBe(expected);
            });
        });
        describe("query delete", () => {
            it.each([
                [`${basePath}?foo=1&bar=2`, { foo: definition_1.QueryDelete }, `${basePath}?bar=2`],
                [`${basePath}?foo=1&bar=2`, { bar: definition_1.QueryDelete, baz: definition_1.QueryDelete }, `${basePath}?foo=1`],
                [`${basePath}?foo=1&bar=2`, { foo: definition_1.QueryDelete, bar: definition_1.QueryDelete, baz: definition_1.QueryDelete }, `${basePath}`],
                // Query全削除
                [`${basePath}`, definition_1.QueryDelete, `${basePath}`],
                [`${basePath}?`, definition_1.QueryDelete, `${basePath}`],
                [`${basePath}?#`, definition_1.QueryDelete, `${basePath}#`],
                [`${basePath}?foo=1&bar=2`, definition_1.QueryDelete, `${basePath}`],
                [`${basePath}?foo=1&bar=2#`, definition_1.QueryDelete, `${basePath}#`],
            ])(`replaceQuery("%s", %s) -> "%s"`, (path, query, expected) => {
                expect((0, query_1.replaceQuery)(path, query)).toBe(expected);
            });
        });
        describe("query value invalid type", () => {
            it.each([
                [{ foo: {} }, {}],
                [{ foo: () => { } }, () => { }],
            ])(`replaceQuery("%s", %s) -> "%s"`, (query, expected) => {
                expect(() => (0, query_1.replaceQuery)("", 
                // @ts-expect-error 敢えて不正な型を渡すため
                query)).toThrowError(`Invalid query value for key "foo". Received: ${expected}`);
            });
            it(`replaceQuery("${basePath}", { foo: NaN }) -> "${basePath}`, () => {
                const url = testWarnMessage(() => {
                    return (0, query_1.replaceQuery)(basePath, { foo: NaN });
                }, [`Invalid query value for key "foo". Received: NaN`]);
                expect(url).toBe(`${basePath}?foo=NaN`);
            });
        });
        describe("hash update", () => {
            it.each([
                [`${basePath}#hash`, undefined, `${basePath}#hash`],
                [`${basePath}#hash`, "", `${basePath}`],
                [`${basePath}#hash`, "#", `${basePath}#%23`],
                [`${basePath}#hash`, "fragment", `${basePath}#fragment`],
                [`${basePath}#hash`, "fragment#", `${basePath}#fragment%23`],
                [`${basePath}#hash`, "fragment?#", `${basePath}#fragment%3F%23`],
            ])(`replaceQuery("%s", %s) -> "%s"`, (path, fragment, expected) => {
                expect((0, query_1.replaceQuery)(path, undefined, fragment)).toBe(expected);
            });
            it(`QueryDeleteと同時にfragmentを消せること`, () => {
                expect((0, query_1.replaceQuery)("https://example.com/?foo#bar", definition_1.QueryDelete, "")).toBe("https://example.com/");
            });
        });
        describe("query and hash update", () => {
            it.each([
                [`${basePath}`, {}, "", `${basePath}`],
                [`${basePath}?#hash`, {}, "fragment", `${basePath}#fragment`],
                [`${basePath}?foo=1&bar=2#hash`, {}, "fragment", `${basePath}?foo=1&bar=2#fragment`],
                [`${basePath}?foo=1&bar=2#hash`, { bar: 20, baz: 30 }, "fragment", `${basePath}?foo=1&bar=20&baz=30#fragment`],
                [
                    `${basePath}?foo=1&bar=2#hash`,
                    { bar: 20, baz: 30 },
                    "fragment#",
                    `${basePath}?foo=1&bar=20&baz=30#fragment%23`,
                ],
                [
                    `${basePath}?foo=1&bar=2#hash`,
                    { bar: 20, baz: 30 },
                    "fragment?#",
                    `${basePath}?foo=1&bar=20&baz=30#fragment%3F%23`,
                ],
                [`${basePath}?foo=1&bar=2#ha#sh`, { bar: 20, baz: 30 }, "fragment", `${basePath}?foo=1&bar=20&baz=30#fragment`],
                [
                    `${basePath}?foo=1&bar=2#ha?#sh`,
                    { bar: 20, baz: 30 },
                    "frag#?ment",
                    `${basePath}?foo=1&bar=20&baz=30#frag%23%3Fment`,
                ],
                [
                    `${basePath}?foo=1&bar=2#ha#?sh`,
                    { bar: 20, baz: 30 },
                    "frag?#ment",
                    `${basePath}?foo=1&bar=20&baz=30#frag%3F%23ment`,
                ],
            ])(`replaceQuery("%s", %s, "%s") -> "%s"`, (path, query, fragment, expected) => {
                expect((0, query_1.replaceQuery)(path, query, fragment)).toBe(expected);
            });
        });
    });
});
function testNotWarnMessage(run) {
    return testWarnMessage(() => run(), []);
}
function testWarnMessage(run, messages) {
    const warn = console.warn;
    const fn = jest.fn();
    console.warn = fn;
    const result = run();
    messages.forEach((message, i) => {
        expect(fn).nthCalledWith(i + 1, message);
    });
    expect(fn).toBeCalledTimes(messages.length);
    console.warn = warn;
    return result;
}
