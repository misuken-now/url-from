"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_from_1 = __importDefault(require("../url-from"));
const util_1 = require("../util");
const baseSpecialChars = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const baseParams = {
    host: "example.com",
    userId: 279642,
    paths: ["a", "b"],
};
const warnMessage1 = `When embedding values in URLs, some dots are replaced with single-byte spaces because we tried to generate paths that include strings indicating the current or parent directory, such as "." or "..".`;
describe("urlFrom", () => {
    const bindUrl = (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}`;
    // narrowingは型のテストです。関数でラップしているのは実行する意味がないためです。
    describe("narrowing", () => {
        describe("必須のキーが無ければ引数なしで呼べること", () => {
            function _() {
                const bindUrl1 = (0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`;
                const bindUrl2 = (0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`.narrowing;
                bindUrl1();
                bindUrl2();
            }
        });
        describe("ベースの必須のキーは未指定でも自動継承されること", () => {
            function _() {
                const bindUrl1 = (0, url_from_1.default) `https://${"host?"}/users/${"userId"}/${"...paths?"}`.narrowing;
                const bindUrl2 = ((0, url_from_1.default) `https://${"host?"}/users/${"userId"}/${"...paths?"}`.narrowing);
                // @ts-expect-error 必須の引数が必要になること
                bindUrl1();
                bindUrl1(
                // @ts-expect-error 必須の引数が必要になること
                {});
                bindUrl1({ userId: 279642 });
                // @ts-expect-error 必須の引数が必要になること
                bindUrl2();
                bindUrl2(
                // @ts-expect-error 必須の引数が必要になること
                {});
                bindUrl2({ userId: 279642 });
            }
        });
        describe("ベースの任意のキーは必須にできること", () => {
            function _() {
                const bindUrl1 = ((0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`.narrowing);
                // @ts-expect-error 必須の引数が必要になること
                bindUrl1();
                bindUrl1({ host: "example.com" });
            }
        });
        describe("ベースの型を狭められること", () => {
            function _() {
                const bindUrl1 = ((0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`.narrowing);
                // @ts-expect-error 必須の引数が必要になること
                bindUrl1();
                bindUrl1({
                    // @ts-expect-error 絞り込まれた型を満たす必要があること
                    host: "example.com",
                });
                bindUrl1({ host: "www.example.com" });
            }
        });
        describe("ベースで必須のキーは任意にできないこと", () => {
            function _() {
                (0, url_from_1.default) `https://${"host"}/users/${"userId?"}/${"...paths?"}`.narrowing();
            }
        });
        describe("ベースに存在しないキーはエラーになること", () => {
            function _() {
                (0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`.narrowing();
            }
        });
        describe("組み合わせの検証", () => {
            function _() {
                const bindUrl2 = ((0, url_from_1.default) `https://${"host:string"}/users/${"userId"}/${"...paths"}`.narrowing);
                // 上で追加した制約の型のみが引数で要求される(余計なものがないので明確)
                bindUrl2({ host: "example.com", userId: 0, paths: ["foo"], "?query": { foo: 0 } });
                bindUrl2({
                    // @ts-expect-error 許容されない型はエラーになる
                    host: "example2.com",
                    // @ts-expect-error 許容されない型はエラーになる
                    userId: "0",
                    paths: [
                        "foo",
                        // @ts-expect-error 許容されない型はエラーになる
                        1,
                    ],
                    "?query": {
                        // @ts-expect-error 許容されない型はエラーになる
                        foo: "0",
                    },
                });
            }
        });
        describe("Conditional Slashにスラッシュを2つ以上指定した場合はエラーにする", () => {
            function _() {
                // @ts-expect-error 前方のスラッシュが多い(二重)
                (0, url_from_1.default) `https://${"host:string"}/users${"//userId"}/${"...paths"}`;
                // @ts-expect-error 前方のスラッシュが多い(三重)
                (0, url_from_1.default) `https://${"host:string"}/users${"///userId"}/${"...paths"}`;
                // @ts-expect-error 前方のスラッシュが多い(複合)
                (0, url_from_1.default) `https://${"host:string"}/users${"//userId/"}/${"...paths"}`;
                // @ts-expect-error 後方のスラッシュが多い(二重)
                (0, url_from_1.default) `https://${"host:string"}/users/${"userId//"}${"...paths"}`;
                // @ts-expect-error 後方のスラッシュが多い(三重)
                (0, url_from_1.default) `https://${"host:string"}/users/${"userId///"}${"...paths"}`;
                // @ts-expect-error 後方のスラッシュが多い(複合)
                (0, url_from_1.default) `https://${"host:string"}/users/${"/userId//"}${"...paths"}`;
                // @ts-expect-error 両方のスラッシュが多い(二重)
                (0, url_from_1.default) `https://${"host:string"}/users/${"//userId//"}${"...paths"}`;
                // @ts-expect-error 両方のスラッシュが多い(三重)
                (0, url_from_1.default) `https://${"host:string"}/users/${"///userId///"}${"...paths"}`;
            }
        });
    });
    describe("フル機能", () => {
        it.each([
            ["https://musubu:%F0%9F%90%B9@vvv.www.example.com:27964/users/279642/2002-5-10?bool=true&key=1&key=2#hash"],
        ])(`"%s"`, (expected) => {
            const url = (0, url_from_1.default) `https://${"userinfo@"}${"subdomain."}${"host:string"}${":port"}/users/${"userId:number"}/${"...paths:number[]"}?bool=${"bool:string"}`.narrowing({
                "#fragment": "hash",
                ":port": 27964,
                "?query": { key: [1, 2] },
                "subdomain.": ["vvv", "www"],
                "userinfo@": { user: "musubu", password: "🐹" },
                host: "example.com",
                userId: 279642,
                bool: "true",
                paths: {
                    value: [2002, 5, 10],
                    separator: "-",
                },
            });
            expect(url).toBe(expected);
        });
    });
    describe("literal", () => {
        it.each([
            [" ", () => (0, url_from_1.default) `https://example.com/users/279642/a/b `],
            ["!", () => (0, url_from_1.default) `https://example.com/users/279642/a/b!`],
            ['"', () => (0, url_from_1.default) `https://example.com/users/279642/a/b"`],
            ["$", () => (0, url_from_1.default) `https://example.com/users/279642/a/b$`],
            ["%", () => (0, url_from_1.default) `https://example.com/users/279642/a/b%`],
            ["'", () => (0, url_from_1.default) `https://example.com/users/279642/a/b'`],
            ["(", () => (0, url_from_1.default) `https://example.com/users/279642/a/b(`],
            [")", () => (0, url_from_1.default) `https://example.com/users/279642/a/b)`],
            ["*", () => (0, url_from_1.default) `https://example.com/users/279642/a/b*`],
            ["+", () => (0, url_from_1.default) `https://example.com/users/279642/a/b+`],
            [",", () => (0, url_from_1.default) `https://example.com/users/279642/a/b,`],
            [":", () => (0, url_from_1.default) `https://example.com/users/279642/a/b:`],
            [";", () => (0, url_from_1.default) `https://example.com/users/279642/a/b;`],
            ["<", () => (0, url_from_1.default) `https://example.com/users/279642/a/b<`],
            [">", () => (0, url_from_1.default) `https://example.com/users/279642/a/b>`],
            ["@", () => (0, url_from_1.default) `https://example.com/users/279642/a/b@`],
            ["[", () => (0, url_from_1.default) `https://example.com/users/279642/a/b[`],
            ["\\", () => (0, url_from_1.default) `https://example.com/users/279642/a/b\\`],
            ["]", () => (0, url_from_1.default) `https://example.com/users/279642/a/b]`],
            ["^", () => (0, url_from_1.default) `https://example.com/users/279642/a/b^`],
            ["`", () => (0, url_from_1.default) `https://example.com/users/279642/a/b\``],
            ["{", () => (0, url_from_1.default) `https://example.com/users/279642/a/b{`],
            ["|", () => (0, url_from_1.default) `https://example.com/users/279642/a/b|`],
            ["}", () => (0, url_from_1.default) `https://example.com/users/279642/a/b}`],
            ["あ", () => (0, url_from_1.default) `https://example.com/users/279642/a/bあ`],
            ["🐹", () => (0, url_from_1.default) `https://example.com/users/279642/a/b🐹`],
        ])("リテラルのパス部分に直接 %s が含まれる場合は警告を出してエンコードする", (char, action) => {
            const message = `The literal part contains an unencoded path string "${char}". Received: \`https://example.com/users/279642/a/b${char}\``;
            const bind = testWarnMessage(() => action(), [message]);
            expect(bind()).toBe(`https://example.com/users/279642/a/b${(0, util_1.encodeRFC3986)(char)}`);
        });
        it.each([
            ["a", () => (0, url_from_1.default) `https://example.com/users/279642/a/ba`],
            ["A", () => (0, url_from_1.default) `https://example.com/users/279642/a/bA`],
            ["0", () => (0, url_from_1.default) `https://example.com/users/279642/a/b0`],
            ["9", () => (0, url_from_1.default) `https://example.com/users/279642/a/b9`],
            ["-", () => (0, url_from_1.default) `https://example.com/users/279642/a/b-`],
            [".", () => (0, url_from_1.default) `https://example.com/users/279642/a/b.`],
            ["/", () => (0, url_from_1.default) `https://example.com/users/279642/a/b/`],
            ["_", () => (0, url_from_1.default) `https://example.com/users/279642/a/b_`],
            ["~", () => (0, url_from_1.default) `https://example.com/users/279642/a/b~`],
        ])("リテラルのパス部分に直接 %s が含まれる場合は警告を出さずに残る", (char, action) => {
            const bind = testNotWarnMessage(() => action());
            expect(bind()).toBe(`https://example.com/users/279642/a/b${char}`);
        });
        it.each([
            [" ", () => (0, url_from_1.default) `https://example.com/users/279642/a/b? `],
            ["!", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?!`],
            ['"', () => (0, url_from_1.default) `https://example.com/users/279642/a/b?"`],
            ["$", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?$`],
            ["%", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?%`],
            ["'", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?'`],
            ["(", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?(`],
            [")", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?)`],
            ["*", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?*`],
            ["+", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?+`],
            [",", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?,`],
            [":", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?:`],
            [";", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?;`],
            ["<", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?<`],
            [">", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?>`],
            ["@", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?@`],
            ["[", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?[`],
            ["\\", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?\\`],
            ["]", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?]`],
            ["^", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?^`],
            ["`", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?\``],
            ["{", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?{`],
            ["|", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?|`],
            ["}", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?}`],
            ["あ", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?あ`],
            ["🐹", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?🐹`],
        ])("リテラルのQueryString部分に直接 %s が含まれる場合は警告を出してエンコードする", (char, action) => {
            const message = `The literal part contains an unencoded query string "${char}". Received: \`https://example.com/users/279642/a/b?${char}\``;
            const bind = testWarnMessage(() => action(), [message]);
            expect(bind()).toBe(`https://example.com/users/279642/a/b?${(0, util_1.encodeRFC3986)(char)}`);
        });
        it.each([
            ["-", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?-`],
            [".", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?.`],
            ["/", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?/`],
            ["_", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?_`],
            ["~", () => (0, url_from_1.default) `https://example.com/users/279642/a/b?~`],
        ])("リテラルのQueryString部分に直接 %s が含まれる場合は警告を出さずに残る", (char, action) => {
            const bind = testNotWarnMessage(() => action());
            expect(bind()).toBe(`https://example.com/users/279642/a/b?${char}`);
        });
        it.each([
            [" ", () => (0, url_from_1.default) `https://example.com/users/279642/a/b# `],
            ["!", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#!`],
            ['"', () => (0, url_from_1.default) `https://example.com/users/279642/a/b#"`],
            ["$", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#$`],
            ["%", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#%`],
            ["'", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#'`],
            ["(", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#(`],
            [")", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#)`],
            ["*", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#*`],
            ["+", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#+`],
            [",", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#,`],
            [":", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#:`],
            [";", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#;`],
            ["<", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#<`],
            [">", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#>`],
            ["@", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#@`],
            ["[", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#[`],
            ["\\", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#\\`],
            ["]", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#]`],
            ["^", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#^`],
            ["`", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#\``],
            ["{", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#{`],
            ["|", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#|`],
            ["}", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#}`],
            ["あ", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#あ`],
            ["🐹", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#🐹`],
        ])("リテラルのfragment部分に直接 %s が含まれる場合は警告を出してエンコードする", (char, action) => {
            const message = `The literal part contains an unencoded fragment string "${char}". Received: \`https://example.com/users/279642/a/b#${char}\``;
            const bind = testWarnMessage(() => action(), [message]);
            expect(bind()).toBe(`https://example.com/users/279642/a/b#${(0, util_1.encodeRFC3986)(char)}`);
        });
        it.each([
            ["-", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#-`],
            [".", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#.`],
            ["/", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#/`],
            ["_", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#_`],
            ["~", () => (0, url_from_1.default) `https://example.com/users/279642/a/b#~`],
        ])("リテラルのfragment部分に直接 %s が含まれる場合は警告を出さずに残る", (char, action) => {
            const bind = testNotWarnMessage(() => action());
            expect(bind()).toBe(`https://example.com/users/279642/a/b#${char}`);
        });
        it("リテラルの末尾の?は除去される", () => {
            const bind = testNotWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?`);
            expect(bind()).toBe(`https://example.com/users/279642/a/b`);
        });
        it("リテラルに含まれる2つ目以降の ? は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded query string "?". Received: \`https://example.com/users/279642/a/b??\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b??`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b?%3F`);
            const message2 = `The literal part contains an unencoded query string "?". Received: \`https://example.com/users/279642/a/b???\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b???`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b?%3F%3F`);
            const message3_1 = `The literal part contains an unencoded query string "?". Received: \`https://example.com/users/279642/a/b???#?\``;
            const message3_2 = `The literal part contains an unencoded fragment string "?". Received: \`https://example.com/users/279642/a/b???#?\``;
            const bind3 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b???#?`, [message3_1, message3_2]);
            expect(bind3()).toBe(`https://example.com/users/279642/a/b?%3F%3F#%3F`);
        });
        it("リテラルに含まれる ? の前の & は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded path string "&". Received: \`https://example.com/users/279642/a/b&?\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b&?`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b%26`);
            const message2 = `The literal part contains an unencoded path string "&". Received: \`https://example.com/users/279&642/&&a/b?\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279&642/&&a/b?`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279%26642/%26%26a/b`);
        });
        it("リテラルに含まれる ? の後の & は警告を出さずにそのまま残す", () => {
            const bind1 = testNotWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?&`);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b?&`);
            const bind2 = testNotWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?foo=1&bar=2&&`);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b?foo=1&bar=2&&`);
        });
        it("リテラルに含まれる ? の前の = は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded path string "=". Received: \`https://example.com/users/279642/a/b=?\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b=?`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b%3D`);
            const message2 = `The literal part contains an unencoded path string "=". Received: \`https://example.com/users/279=642/==a/b?\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279=642/==a/b?`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279%3D642/%3D%3Da/b`);
        });
        it("リテラルに含まれる ? の後の = は警告を出さずにそのまま残す", () => {
            const bind1 = testNotWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?=`);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b?=`);
        });
        it("リテラルに含まれる ? の後の連続する = は2文字目以降を警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded query string "=". Received: \`https://example.com/users/279642/a/b?==\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?==`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b?=%3D`);
            const message2 = `The literal part contains an unencoded query string "=". Received: \`https://example.com/users/279642/a/b?foo===bar\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b?foo===bar`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b?foo=%3D%3Dbar`);
        });
        it("リテラルに含まれる # の後の # は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded fragment string "#". Received: \`https://example.com/users/279642/a/b##\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b##`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b#%23`);
            const message2 = `The literal part contains an unencoded fragment string "#". Received: \`https://example.com/users/279642/a/b###\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b###`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b#%23%23`);
        });
        it("リテラルに含まれる # の後の ? は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded fragment string "?". Received: \`https://example.com/users/279642/a/b#?\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#?`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b#%3F`);
            const message2 = `The literal part contains an unencoded fragment string "?". Received: \`https://example.com/users/279642/a/b#??\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#??`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b#%3F%3F`);
        });
        it("リテラルに含まれる # の後の = は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded fragment string "=". Received: \`https://example.com/users/279642/a/b#=\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#=`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b#%3D`);
            const message2 = `The literal part contains an unencoded fragment string "=". Received: \`https://example.com/users/279642/a/b#==\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#==`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b#%3D%3D`);
        });
        it("リテラルに含まれる # の後の & は警告を出してエンコードする", () => {
            const message1 = `The literal part contains an unencoded fragment string "&". Received: \`https://example.com/users/279642/a/b#&\``;
            const bind1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#&`, [message1]);
            expect(bind1()).toBe(`https://example.com/users/279642/a/b#%26`);
            const message2 = `The literal part contains an unencoded fragment string "&". Received: \`https://example.com/users/279642/a/b#&&\``;
            const bind2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/279642/a/b#&&`, [message2]);
            expect(bind2()).toBe(`https://example.com/users/279642/a/b#%26%26`);
        });
        it.each([
            [() => (0, url_from_1.default) `./path/to`, "./path/to"],
            [() => (0, url_from_1.default) `../path/to`, "../path/to"],
            [() => (0, url_from_1.default) `.././path/to`, ".././path/to"],
            [() => (0, url_from_1.default) `../../path/to`, "../../path/to"],
        ])("リテラルが './' や `../` から始まる場合は結果に残す", (run, expected) => {
            const bindUrl = testNotWarnMessage(run);
            expect(bindUrl()).toBe(expected);
        });
    });
    describe("placeholder", () => {
        it("文字列以外を渡すと例外が投げられること", () => {
            // @ts-expect-error 敢えて不正な型を渡すため
            expect(() => (0, url_from_1.default) `https://${1}/`).toThrowError("Invalid placeholder type. Received: 1");
            // @ts-expect-error 敢えて不正な型を渡すため
            expect(() => (0, url_from_1.default) `https://${{}}/`).toThrowError("Invalid placeholder type. Received: {}");
            // @ts-expect-error 敢えて不正な型を渡すため
            expect(() => (0, url_from_1.default) `https://${[]}/`).toThrowError("Invalid placeholder type. Received: []");
            // @ts-expect-error 敢えて不正な型を渡すため
            expect(() => (0, url_from_1.default) `https://${true}/`).toThrowError("Invalid placeholder type. Received: true");
        });
    });
    describe("direct", () => {
        it.each([[" "], [0], [baseSpecialChars]])(`直接にエンコード対象 %s を埋め込めること`, (str) => {
            const url = (0, url_from_1.default) `https://example.com/users/279642/a/b/${[str]}`();
            expect(url).toBe(`https://example.com/users/279642/a/b/${(0, util_1.encodeRFC3986)(str.toString())}`);
        });
        it(`Direct Placeholderに空文字を渡すと例外が投げられること`, () => {
            expect(() => (0, url_from_1.default) `https://example.com/users/279642/a/b/${[""]}/`).toThrowError("The value of the index 0 at direct placeholder is empty string.");
            expect(() => (0, url_from_1.default) `https://example.com/users/${[279692]}/a/b/${[""]}/`).toThrowError("The value of the index 1 at direct placeholder is empty string.");
            expect(() => (0, url_from_1.default) `https://example.com/users/${"foo"}/a/b/${[""]}/`).toThrowError("The value of the index 1 at direct placeholder is empty string.");
        });
    });
    describe("scheme", () => {
        it.each([
            ["http", "http://example.com/users/279642/a/b"],
            ["https", "https://example.com/users/279642/a/b"],
            ["foo+bar", "foo+bar://example.com/users/279642/a/b"],
            ["foo-bar", "foo-bar://example.com/users/279642/a/b"],
            ["foo.bar", "foo.bar://example.com/users/279642/a/b"],
            ["foo+bar+", "foo+bar+://example.com/users/279642/a/b"],
            ["foo-bar-", "foo-bar-://example.com/users/279642/a/b"],
            ["foo.bar.", "foo.bar.://example.com/users/279642/a/b"],
            ["foo2", "foo2://example.com/users/279642/a/b"],
        ])(`"%s -> %s"`, (scheme, expected) => {
            const actual = testNotWarnMessage(() => (0, url_from_1.default) `${"scheme:"}//${"host"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), { "scheme:": scheme })));
            expect(actual).toBe(expected);
        });
        it.each(["foo%", "+foo", "-foo", ".foo", "2foo"])(`":scheme" に %s が指定されると警告が出ること -> "%s"`, (scheme) => {
            const bindUrl = (0, url_from_1.default) `${"scheme:"}//${"host"}/users/${"userId"}/${"...paths"}`;
            expect(() => bindUrl(Object.assign(Object.assign({}, baseParams), { "scheme:": scheme }))).toThrowError(`The value of the placeholder ":scheme" invalid scheme. Received: ` + scheme);
        });
        it(`必須のときに""が渡されると例外を投げること`, () => {
            expect(() => (0, url_from_1.default) `${"scheme:"}//example.com/users/279642/a/b`({ "scheme:": "" })).toThrowError('The required placeholder "scheme:" was passed an empty string.');
        });
        describe(`スキームの直後の"/"が多すぎる場合`, () => {
            it.each([["https://example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `https:///example.com//users/279642/a/b?`();
                expect(url).toBe(expected);
            });
            it.each([["file:///example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `file:////example.com//users/279642/a/b?`();
                expect(url).toBe(expected);
            });
        });
        it(`authorityコンポーネントとpathコンポーネントの":"と"@"はエンコードされないこと`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme:"}//user:pass@example.com/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `${"scheme:"}//user:pass@example.com/:/@/::/@@`',
            ]);
            expect(bindUrl({ "scheme:": "https" })).toBe("https://user:pass@example.com/%3A/%40/%3A%3A/%40%40");
        });
    });
    describe("scheme://host", () => {
        describe(`スキームからホストまで埋め込めること`, () => {
            it.each([
                ["https://example.com", "https://example.com/users/279642/a/b"],
                ["https://example.com/", "https://example.com/users/279642/a/b"],
                ["https://localhost", "https://localhost/users/279642/a/b"],
                ["http://example.com", "http://example.com/users/279642/a/b"],
                ["file:///", "file:///users/279642/a/b"],
            ])(`"%s"`, (schemeHostPath, expected) => {
                expect((0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`({ "scheme://host": schemeHostPath })).toBe(expected);
            });
        });
        describe(`パスを含む場合は警告を出すこと`, () => {
            it.each([
                ["https://example.com/foo", "https://example.com/foo/users/279642/a/b"],
                ["https://example.com/foo/", "https://example.com/foo/users/279642/a/b"],
                [
                    "https://user:passowrd@example.com:20510/~_-.%20",
                    "https://user:passowrd@example.com:20510/~_-.%20/users/279642/a/b",
                ],
            ])(`"%s"`, (schemeHostPath, expected) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                expect(testWarnMessage(() => bindUrl({ "scheme://host": schemeHostPath }), [
                    `The value of the placeholder "scheme://host" cannot contain a path.\nUse the placeholder "scheme://host/path" to include paths. Received: ${schemeHostPath}`,
                ])).toBe(expected);
            });
        });
        describe(`ホスト部が空の場合`, () => {
            it.each(["https:///", "https://example.com@/"])(`"%s" が渡されると例外を投げること`, (schemeHostPath) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                expect(() => bindUrl({ "scheme://host": schemeHostPath })).toThrowError(`The host component of value of the placeholder "scheme://host" cannot empty. Received: ${schemeHostPath}`);
            });
            it.each(["file:///"])(`"%s" は有効なため例外を投げないこと`, (schemeHostPath) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                expect(bindUrl({ "scheme://host": schemeHostPath })).toBe(`${schemeHostPath}users/279642/a/b`);
            });
        });
        describe(`ホスト部に unresolved 以外が含まれる場合`, () => {
            // 非予約文字を除外したものが予約文字
            // "@" は userinfo の区切り文字として有効であるためここでは除外
            // "/" はパスの区切り文字として有効であるためここでは除外
            // "?" はQueryの開始として有効であるためここでは除外
            // "#" はFragmentの開始として有効であるためここでは除外
            it.each(baseSpecialChars.replace(/[~_\-.@/?#]/g, "").split(""))(`"%s" は例外を投げること`, (specialChar) => {
                const schemeHostPath = `https://exam${specialChar}ple.com/`;
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                expect(() => bindUrl({ "scheme://host": schemeHostPath })).toThrowError(`The host component of value of the placeholder "scheme://host" cannot contain a "${specialChar}". Received: https://exam${specialChar}ple.com/`);
            });
        });
        describe(`ホスト部に unresolved が含まれる場合`, () => {
            it.each(baseSpecialChars.replace(/[^~_\-.]/g, "").split(""))(`"%s" が使用できること`, (specialChar) => {
                const schemeHostPath = `https://example.com${specialChar}/`;
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                expect(bindUrl({ "scheme://host": schemeHostPath })).toBe(`https://example.com${(0, util_1.encodeRFC3986)(specialChar)}/users/279642/a/b`);
            });
        });
        describe(`userinfoに":"や"@"が2回現れる場合は例外を投げること`, () => {
            it.each([
                ["https://us@er:password@example.com", "@"],
                ["https://us:er:password@example.com", ":"],
                ["https://user:pass@word@example.com", "@"],
                ["https://user:pass:word@example.com", ":"],
                ["https://user:password@exa@mple.com", "@"],
            ])(`"%s"`, (schemeHost, char) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                const message = char === "@"
                    ? `The authority component of value of the placeholder "scheme://host" must be "%40" to use "@" as value instead of delimiter. Received: ${schemeHost}`
                    : `The userinfo component of value of the placeholder "scheme://host" must be "%3A" to use ":" as value instead of delimiter. Received: ${schemeHost}`;
                expect(() => bindUrl({ "scheme://host": schemeHost })).toThrowError(message);
            });
        });
        describe(`記号が含まれてもエンコードしない場合`, () => {
            it.each([
                // パスに"@"や":"を含む場合
                ["https://user:password@example.com/", "https://user:password@example.com/"],
                // portの不要な":"が除去される場合
                ["https://user:password@example.com:/", "https://user:password@example.com/"],
                ["https://user:password@example.com:", "https://user:password@example.com"],
                // userinfoの不要な"@"や":"が除去される場合
                ["https://@example.com/", "https://example.com/"],
                ["https://:@example.com/", "https://example.com/"],
                // port番号のコロンは残る
                ["https://example.com:443", "https://example.com:443"],
                ["https://example.com:443/", "https://example.com:443/"],
                ["http://example.com:80", "http://example.com:80"],
                ["http://example.com:80/", "http://example.com:80/"],
                // passのコロンは残る
                ["https://:443@example.com:443/", "https://:443@example.com:443/"],
                ["http://:80@example.com:80/", "http://:80@example.com:80/"],
                // Protocol-relative URL
                ["//user:password@example.com/", "//user:password@example.com/"],
                // portの不要な":"が除去される場合
                ["//user:password@example.com:/", "//user:password@example.com/"],
                ["//user:password@example.com:", "//user:password@example.com"],
                // userinfoの不要な"@"や":"が除去される場合
                ["//@example.com/", "//example.com/"],
                ["//:@example.com/", "//example.com/"],
                // port番号のコロンは残る
                ["//example.com:443", "//example.com:443"],
                ["//example.com:443/", "//example.com:443/"],
                ["//example.com:80", "//example.com:80"],
                ["//example.com:80/", "//example.com:80/"],
                // passのコロンは残る
                ["//:443@example.com:443/", "//:443@example.com:443/"],
                ["//:80@example.com:80/", "//:80@example.com:80/"],
            ])(`"%s"`, (schemeHostPath, expected) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
                const actual = testNotWarnMessage(() => bindUrl({ "scheme://host": schemeHostPath }));
                expect(actual).toBe(`${expected.replace(/\/$/, "")}/users/279642/a/b`);
            });
        });
        describe(`"?"や"#"以降は警告を出して削除`, () => {
            it.each([["https://example.com?foo", "https://example.com"]])(`"%s"`, (schemeHostPath, expected) => {
                const actual = testWarnMessage(() => (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`({ "scheme://host": schemeHostPath }), [
                    `The value of the placeholder "scheme://host" cannot contain a query string or fragment. Received: ` +
                        schemeHostPath,
                ]);
                expect(actual).toBe(`${expected.replace(/\/$/, "")}/users/279642/a/b`);
            });
        });
        it.each([`https:example.com/`, `https:/example.com/`, `https/://example.com/`, `https//example.com/`])(`適切な "://" or "//" が含まれない場合は例外を投げること "%s"`, (schemeHostPath) => {
            const bindUrl = (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`;
            expect(() => bindUrl({ "scheme://host": schemeHostPath })).toThrowError(`The value of the placeholder "scheme://host" must contain "scheme://" or Protocol-relative URL. Received: ${schemeHostPath}`);
        });
        it(`必須のときに""が渡されると例外を投げること`, () => {
            expect(() => (0, url_from_1.default) `${"scheme://host"}/users/279642/a/b`({ "scheme://host": "" })).toThrowError('The required placeholder "scheme://host" was passed an empty string.');
        });
        it(`省略可能なのときに""が渡されても警告を出さないこと`, () => {
            testNotWarnMessage(() => {
                const url = (0, url_from_1.default) `${"scheme://host?"}/users/279642/a/b`({ "scheme://host": "" });
                expect(url).toBe("/users/279642/a/b");
            });
        });
    });
    describe("scheme://host/path", () => {
        describe(`スキームからホストまで埋め込めること`, () => {
            it.each([
                ["https://example.com", "https://example.com/users/279642/a/b"],
                ["https://example.com/", "https://example.com/users/279642/a/b"],
                ["https://example.com/foo", "https://example.com/foo/users/279642/a/b"],
                ["https://example.com/foo/", "https://example.com/foo/users/279642/a/b"],
                ["https://localhost", "https://localhost/users/279642/a/b"],
                ["http://example.com", "http://example.com/users/279642/a/b"],
                ["file:///example", "file:///example/users/279642/a/b"],
                [
                    "https://user:passowrd@example.com:20510/~_-.%20",
                    "https://user:passowrd@example.com:20510/~_-.%20/users/279642/a/b",
                ],
            ])(`"%s"`, (schemeHostPath, expected) => {
                expect((0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`({ "scheme://host/path": schemeHostPath })).toBe(expected);
            });
        });
        // UNDONE: authorityのエンコード漏れ対応
        xdescribe(`authorityにencode漏れの文字が含まれる場合は警告を出してencodeすること`, () => { });
        describe(`userinfoに":"や"@"が2回現れる場合は例外を投げること`, () => {
            it.each([
                ["https://us@er:password@example.com/path", "@"],
                ["https://us:er:password@example.com/path", ":"],
                ["https://user:pass@word@example.com/path", "@"],
                ["https://user:pass:word@example.com/path", ":"],
                ["https://user:password@exa@mple.com/path", "@"],
            ])(`"%s"`, (schemeHostPath, char) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`;
                const message = char === "@"
                    ? `The authority component of value of the placeholder "scheme://host/path" must be "%40" to use "@" as value instead of delimiter. Received: ${schemeHostPath}`
                    : `The userinfo component of value of the placeholder "scheme://host/path" must be "%3A" to use ":" as value instead of delimiter. Received: ${schemeHostPath}`;
                expect(() => bindUrl({ "scheme://host/path": schemeHostPath })).toThrowError(message);
            });
        });
        describe(`ホスト部に許可されていない記号が含まれていたら例外を投げること`, () => {
            it.each([["https://exa:mple.com/path"], ["https://user:password@exa:mple.com/path"]])(`"%s"`, (schemeHostPath) => {
                expect(() => (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`({ "scheme://host/path": schemeHostPath })).toThrowError(`The host component of value of the placeholder "scheme://host/path" cannot contain a ":". Received: ${schemeHostPath}`);
            });
        });
        describe(`パスにencode漏れの文字が含まれる場合は警告を出してencodeすること`, () => {
            // "?"と"#"は別の処理で消去されるため、このテストからは除外
            const specialChars = baseSpecialChars.replace(/[~_\-./%?#]/g, "");
            it.each(specialChars.split(""))(`"%s"`, (specialChar) => {
                const schemeHostPath = `https://example.com/${specialChar}`;
                const actual = testWarnMessage(() => (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`({ "scheme://host/path": schemeHostPath }), [
                    `The placeholder "scheme://host/path" value contain "${specialChar}". Percent encoding is required. Received: ` +
                        schemeHostPath,
                ]);
                expect(actual).toBe(`https://example.com/${(0, util_1.encodeRFC3986)(specialChar)}/users/279642/a/b`);
            });
        });
        describe(`記号が含まれてもエンコードしない場合`, () => {
            it.each([
                // portの不要な":"が除去される場合
                ["https://user:password@example.com:/", "https://user:password@example.com/"],
                ["https://user:password@example.com:", "https://user:password@example.com"],
                // userinfoの不要な"@"や":"が除去される場合
                ["https://@example.com/", "https://example.com/"],
                ["https://:@example.com/", "https://example.com/"],
                // port番号のコロンは残る
                ["https://example.com:443", "https://example.com:443"],
                ["https://example.com:443/", "https://example.com:443/"],
                ["http://example.com:80", "http://example.com:80"],
                ["http://example.com:80/", "http://example.com:80/"],
                // passのコロンは残る
                ["https://:443@example.com:443/", "https://:443@example.com:443/"],
                ["http://:80@example.com:80/", "http://:80@example.com:80/"],
                // Protocol-relative URL
                // portの不要な":"が除去される場合
                ["//user:password@example.com:/", "//user:password@example.com/"],
                ["//user:password@example.com:", "//user:password@example.com"],
                // userinfoの不要な"@"や":"が除去される場合
                ["//@example.com/", "//example.com/"],
                ["//:@example.com/", "//example.com/"],
                // port番号のコロンは残る
                ["//example.com:80", "//example.com:80"],
                ["//example.com:80/", "//example.com:80/"],
                ["//example.com:443", "//example.com:443"],
                ["//example.com:443/", "//example.com:443/"],
                // passのコロンは残る
                ["//:80@example.com:80/", "//:80@example.com:80/"],
                ["//:443@example.com:443/", "//:443@example.com:443/"],
            ])(`"%s"`, (schemeHostPath, expected) => {
                const bindUrl = (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`;
                const actual = testNotWarnMessage(() => bindUrl({ "scheme://host/path": schemeHostPath }));
                expect(actual).toBe(`${expected.replace(/\/$/, "")}/users/279642/a/b`);
            });
            describe(`ただしパスにエンコード対象の文字が含まれる場合は警告を出してエンコードする`, () => {
                it.each([
                    // パスに"@"や":"を含む場合
                    ["https://user:password@example.com/pa@th", "https://user:password@example.com/pa%40th", "@"],
                    ["https://user:password@example.com/pa:th", "https://user:password@example.com/pa%3Ath", ":"],
                    // Protocol-relative URL
                    ["//user:password@example.com/pa@th", "//user:password@example.com/pa%40th", "@"],
                    ["//user:password@example.com/pa:th", "//user:password@example.com/pa%3Ath", ":"],
                    // userinfoの不要な"@"や":"が除去される場合
                    ["//:443@example.com:443/:443/", "//:443@example.com:443/%3A443/", ":"],
                    ["//:80@example.com:80/:80/", "//:80@example.com:80/%3A80/", ":"],
                    // passとport番号のコロンは残る
                    ["https://:443@example.com:443/:443/", "https://:443@example.com:443/%3A443/", ":"],
                    ["http://:80@example.com:80/:80/", "http://:80@example.com:80/%3A80/", ":"],
                ])(`"%s"`, (schemeHostPath, expected, character) => {
                    const bindUrl = (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`;
                    const actual = testWarnMessage(() => bindUrl({ "scheme://host/path": schemeHostPath }), [
                        // UNDONE: ":@"はユーザー情報の区切り文字以外という説明を付ける
                        `The placeholder "scheme://host/path" value contain "${character}". Percent encoding is required. Received: ${schemeHostPath}`,
                    ]);
                    expect(actual).toBe(`${expected.replace(/\/$/, "")}/users/279642/a/b`);
                });
            });
        });
        describe(`"?"や"#"以降は警告を出して削除`, () => {
            it.each([["https://example.com?foo", "https://example.com"]])(`"%s"`, (schemeHostPath, expected) => {
                const actual = testWarnMessage(() => (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`({ "scheme://host/path": schemeHostPath }), [
                    `The value of the placeholder "scheme://host/path" cannot contain a query string or fragment. Received: ` +
                        schemeHostPath,
                ]);
                expect(actual).toBe(`${expected.replace(/\/$/, "")}/users/279642/a/b`);
            });
        });
        it.each([`https:example.com/`, `https:/example.com/`, `https/://example.com/`, `https//example.com/`])(`適切な "://" or "//" が含まれない場合は例外を投げること "%s"`, (schemeHostPath) => {
            const bindUrl = (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`;
            expect(() => bindUrl({ "scheme://host/path": schemeHostPath })).toThrowError(`The value of the placeholder "scheme://host/path" must contain "scheme://" or Protocol-relative URL. Received: ${schemeHostPath}`);
        });
        it(`必須のときに""が渡されると例外を投げること`, () => {
            expect(() => (0, url_from_1.default) `${"scheme://host/path"}/users/279642/a/b`({ "scheme://host/path": "" })).toThrowError('The required placeholder "scheme://host/path" was passed an empty string.');
        });
        //it(`省略可能なのときに""が渡されても警告を出さないこと`, () => {
        //  testNotWarnMessage(() => {
        //    const url = urlFrom`${"scheme://host/path?"}/users/279642/a/b`({ "scheme://host/path": "" });
        //    expect(url).toBe("/users/279642/a/b");
        //  });
        //});
    });
    describe("scheme://authority/path", () => {
        describe(`スキームからホストまで埋め込めること`, () => {
            it.each([
                ["https://example.com", "https://example.com/users/279642/a/b"],
                ["https://example.com/", "https://example.com/users/279642/a/b"],
                ["https://example.com/foo", "https://example.com/foo/users/279642/a/b"],
                ["https://example.com/foo/", "https://example.com/foo/users/279642/a/b"],
                ["https://localhost", "https://localhost/users/279642/a/b"],
                ["http://example.com", "http://example.com/users/279642/a/b"],
                ["file:///example", "file:///example/users/279642/a/b"],
            ])(`"%s"`, (schemeHostPathPath, expected) => {
                expect((0, url_from_1.default) `${"scheme://authority/path"}/users/279642/a/b`({ "scheme://authority/path": schemeHostPathPath })).toBe(expected);
            });
        });
    });
    describe("path", () => {
        describe("bind", () => {
            it.each([["https://example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                expect(bindUrl(baseParams)).toBe(expected);
            });
        });
        describe("同じプレースホルダの再利用", () => {
            it.each([["https://example.com/users/279642-279642/a/b/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `https://${"host"}/users/${"userId"}-${"userId"}/${"...paths"}/${"...paths"}`(baseParams);
                expect(url).toBe(expected);
            });
        });
        describe("複数のスプレッド", () => {
            it.each([["https://example.com/users/279642/a/b/2002/5/10"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}/${"...birthday"}`(Object.assign(Object.assign({}, baseParams), { birthday: [2002, 5, 10] }));
                expect(url).toBe(expected);
            });
        });
        describe(`無意味な"?"は削除`, () => {
            it.each([["https://example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `https://example.com/users/279642/a/b?`({});
                expect(url).toBe(expected);
            });
        });
        describe(`無意味な"//"は"/"に置換`, () => {
            it.each([["https://example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `https://example.com//users///279642////a/////b?`({});
                expect(url).toBe(expected);
            });
            // Protocol-relative URL
            it.each([["//example.com/users/279642/a/b", "///example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `//example.com//users///279642////a/////b?`({});
                expect(url).toBe(expected);
            });
            // relative
            it.each([["users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `users///279642////a/////b?`({});
                expect(url).toBe(expected);
            });
            it(`相対パスの中に "://" が含まれていると重複スラッシュが除去されて ":" は警告を出してエンコードされること`, () => {
                // ":" の手前に "/" が存在している場合、その時点でschemeではないことが確定する
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `foo/bar://baz//`, [`The literal part contains an unencoded path string ":". Received: \`foo/bar://baz//\``]);
                expect(bindUrl()).toBe("foo/bar%3A/baz/");
            });
        });
        describe(`条件付きスラッシュ`, () => {
            it(`値が指定されたら前スラッシュが反映されること`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users${"/userId?"}`;
                expect(bindUrl({ userId: 279642 })).toBe("https://example.com/users/279642");
            });
            it(`省略時は前スラッシュが反映されないこと`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users${"/userId?"}`;
                expect(bindUrl()).toBe("https://example.com/users");
            });
            it(`値が指定されたら後スラッシュが反映されること`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users/${"userId?/"}`;
                expect(bindUrl({ userId: 279642 })).toBe("https://example.com/users/279642/");
            });
            it(`省略時は後スラッシュが反映されないこと`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users/${"userId?/"}`;
                expect(bindUrl()).toBe("https://example.com/users/");
            });
            it(`値が指定されたら前後スラッシュが反映されること`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users${"/userId?/"}`;
                expect(bindUrl({ userId: 279642 })).toBe("https://example.com/users/279642/");
            });
            it(`省略時は前後スラッシュが反映されないこと`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users${"/userId?/"}`;
                expect(bindUrl()).toBe("https://example.com/users");
            });
            it(`スラッシュが重複しても1つにまとめられること`, () => {
                const bindUrl = (0, url_from_1.default) `https://example.com/users/${"/userId?/"}/`;
                expect(bindUrl({ userId: 279642 })).toBe("https://example.com/users/279642/");
            });
        });
        describe("省略時", () => {
            describe("省略時は後方のスラッシュが無視されること", () => {
                it.each([
                    [{ host: "" }, "https://users/279642/a/b"],
                    [{ userId: "" }, "https://example.com/users/a/b"],
                    [{ userId: null }, "https://example.com/users/a/b"],
                    [{ userId: undefined }, "https://example.com/users/a/b"],
                    [{ paths: [] }, "https://example.com/users/279642/"],
                    [{ paths: ["", null, undefined] }, "https://example.com/users/279642/"],
                    [{ host: "", userId: "", paths: [] }, "https://users/"],
                ])(`%s -> "%s"`, (params, expected) => {
                    const url = (0, url_from_1.default) `https://${"host?"}/users/${"userId?"}/${"...paths?"}`(Object.assign(Object.assign({}, baseParams), params));
                    expect(url).toBe(expected);
                });
            });
            describe("二重以上の省略時も後方のスラッシュが無視されること", () => {
                it.each([[{}, "https://example.com/"]])(`%s -> "%s"`, (params, expected) => {
                    expect((0, url_from_1.default) `https://example.com/${"userId?"}${"...paths?"}/`(params)).toBe(expected);
                    expect((0, url_from_1.default) `https://example.com/${"userId?"}${"...paths?"}/${"userId?"}${"...paths?"}/`(params)).toBe(expected);
                    expect((0, url_from_1.default) `https://example.com/${"userId?"}${"...paths?"}/${"userId?"}${"...paths?"}`(params)).toBe(expected);
                });
            });
            describe(`必須の値が渡されていない場合は例外が投げられること`, () => {
                it.each([
                    [{ host: "" }, `The required placeholder "host" was passed an empty string.`],
                    [{ userId: "" }, `The required placeholder "userId" was passed an empty string.`],
                    [
                        {
                            host: "",
                            userId: "",
                        },
                        `The required placeholder "host" was passed an empty string.`,
                    ],
                ])(`%s`, (params, expectedMessages) => {
                    const bindUrl = (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}`;
                    expect(() => bindUrl(Object.assign(Object.assign({}, baseParams), params))).toThrowError(expectedMessages);
                });
            });
            describe("スプレッドに不正な値が渡された場合は例外を投げる", () => {
                it.each([
                    [{ paths: "foo" }, "...paths", "foo"],
                    [{ paths: 1 }, "...paths", "1"],
                    [{ paths: true }, "...paths", "true"],
                    [{ paths: {} }, "...paths", "[object Object]"],
                    [{ paths: () => { } }, "...paths", "() => { }"],
                ])(`%s + "%s" = "%s"`, (params, expectedKey, expectedType) => {
                    expect(() => 
                    // @ts-expect-error 敢えて不正な型を渡すため
                    (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), params))).toThrowError(`The placeholder "${expectedKey}" in the argument object must be set to an array. Received: ` + expectedType);
                });
            });
            describe("不正なパスが渡された場合は例外を投げる", () => {
                it.each([
                    [{ userId: {} }, "userId", `[object Object]`],
                    [{ userId: [] }, "userId", "Array"],
                ])(`%s + "%s" = "%s"`, (params, expectedKey, expectedType) => {
                    expect(() => 
                    // @ts-expect-error 敢えて不正な型を渡すため
                    (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), params))).toThrowError(`Invalid path value for "${expectedKey}". Received: ` + expectedType);
                });
            });
            describe("不正なパスが渡された場合は例外を投げる", () => {
                it.each([
                    [{ userId: null }, "userId", "null"],
                    [{ userId: undefined }, "userId", "undefined"],
                ])(`%s + "%s" = "%s"`, (params, expectedKey, expectedType) => {
                    expect(() => 
                    // @ts-expect-error 敢えて不正な型を渡すため
                    (0, url_from_1.default) `https://${"host"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), params))).toThrowError(`The placeholder "${expectedKey}" in the argument object must be set to a valid value. Received: ` +
                        expectedType);
                });
            });
        });
        describe("Protocol-relative URL", () => {
            it.each([["//example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `//${"host"}/users/${"userId"}/${"...paths"}`(baseParams);
                expect(url).toBe(expected);
            });
        });
        describe("file:///", () => {
            it.each([["file:///example.com/users/279642/a/b"]])(`"%s"`, (expected) => {
                const url = (0, url_from_1.default) `file:///${"host"}/users/${"userId"}/${"...paths"}`(baseParams);
                expect(url).toBe(expected);
            });
        });
        describe("path value invalid type", () => {
            it.each([[{}], [[]], [() => { }]])(`%s`, (userId) => {
                expect(() => (0, url_from_1.default) `https://example.com/users/${"userId?"}/`(
                // @ts-expect-error 敢えて不正な型を渡すため
                { userId })).toThrowError(`Invalid path value for "userId". Received: ${userId}`);
            });
            it(`パスにNaNを渡すと警告が投げられること`, () => {
                const url = testWarnMessage(() => {
                    return (0, url_from_1.default) `https://example.com/users/${"userId?"}/`({ userId: NaN });
                }, [`The value NaN was passed to the placeholder "userId".`]);
                expect(url).toBe("https://example.com/users/NaN/");
            });
        });
        describe("spread value invalid type", () => {
            it.each([[{}], [[]], [() => { }]])(`%s`, (value) => {
                expect(() => (0, url_from_1.default) `https://example.com/${"...paths"}`({
                    paths: 
                    // @ts-expect-error 敢えて不正な型を渡すため
                    [value],
                })).toThrowError(`Invalid spread value for index 0. Received: ${value}`);
            });
            it(`NaN`, () => {
                const url = testWarnMessage(() => {
                    return (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({ paths: [NaN] });
                }, [`The value NaN was passed to the index 0 at placeholder "...paths".`]);
                expect(url).toBe("https://example.com/users/NaN/");
            });
        });
        describe("Path Traversal", () => {
            it(`埋め込まれた値によって発生する "/./" や "/../" は "/%20/" や "/%20%20/" に変換されること`, () => {
                expect([
                    testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/${"userId"}/`({ userId: "." }), [warnMessage1]),
                    testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/${"userId"}/`({ userId: ".." }), [warnMessage1]),
                    testNotWarnMessage(() => (0, url_from_1.default) `https://example.com/users/${"userId"}/`({ userId: "..." })),
                    testWarnMessage(() => (0, url_from_1.default) `/${"userId"}/`({ userId: "." }), [warnMessage1]),
                    testWarnMessage(() => (0, url_from_1.default) `/${"userId"}/`({ userId: ".." }), [warnMessage1]),
                    testNotWarnMessage(() => (0, url_from_1.default) `foo${"userId"}/`({ userId: "." })),
                    testNotWarnMessage(() => (0, url_from_1.default) `foo${"userId"}/`({ userId: ".." })),
                    testWarnMessage(() => (0, url_from_1.default) `foo/${"userId"}/`({ userId: "." }), [warnMessage1]),
                    testWarnMessage(() => (0, url_from_1.default) `foo/${"userId"}/`({ userId: ".." }), [warnMessage1]),
                    // 先頭の場合は "../" でも "%20%20/" に変換されます
                    testWarnMessage(() => (0, url_from_1.default) `${"userId"}/`({ userId: "." }), [warnMessage1]),
                    testWarnMessage(() => (0, url_from_1.default) `${"userId"}/`({ userId: ".." }), [warnMessage1]),
                ]).toStrictEqual([
                    "https://example.com/users/%20/",
                    "https://example.com/users/%20%20/",
                    "https://example.com/users/.../", // "..." はパスとして通常の文字列であるため変換しない
                    "/%20/",
                    "/%20%20/",
                    "foo./",
                    "foo../",
                    "foo/%20/",
                    "foo/%20%20/",
                    "%20/",
                    "%20%20/",
                ]);
            });
            it(`spread の "./" や "../" は "%20/" や "%20%20/" に変換されること`, () => {
                expect([
                    testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({ paths: ["foo", ".", "..", "...", "bar"] }), [warnMessage1]),
                    testWarnMessage(() => (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({
                        paths: {
                            value: [".", "."],
                            separator: "",
                        },
                    }), [warnMessage1]),
                    // 空文字はスキップされるのでセパレータによって問題が引き起こされることはない
                    (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({
                        paths: {
                            value: ["", ""],
                            separator: "..",
                        },
                    }),
                    // エンコードされているものはさらにエンコードされるので安全
                    (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({ paths: ["foo", "%2E", "%2e", "%2E%2e", "bar"] }),
                    (0, url_from_1.default) `https://example.com/users/${"...paths"}/`({
                        paths: {
                            value: ["%2E", "%2e"],
                            separator: "",
                        },
                    }),
                ]).toStrictEqual([
                    "https://example.com/users/foo/%20/%20%20/.../bar/", // "..." はパスとして通常の文字列であるため変換しない
                    "https://example.com/users/%20%20/",
                    "https://example.com/users/",
                    "https://example.com/users/foo/%252E/%252e/%252E%252e/bar/",
                    "https://example.com/users/%252E%252e/",
                ]);
            });
            describe(`リテラルの先頭の "./" や "../"`, () => {
                it(`リテラルの先頭で指定された "./" や "../" は維持されること`, () => {
                    testNotWarnMessage(() => {
                        expect([
                            (0, url_from_1.default) `./users/${"userId"}/`({ userId: 279642 }),
                            (0, url_from_1.default) `../users/${"userId"}/`({ userId: 279642 }),
                            (0, url_from_1.default) `.?userId=${"userId"}`({ userId: 279642 }),
                            (0, url_from_1.default) `..?userId=${"userId"}`({ userId: 279642 }),
                            (0, url_from_1.default) `.#${"userId"}`({ userId: 279642 }),
                            (0, url_from_1.default) `..#${"userId"}`({ userId: 279642 }),
                        ]).toStrictEqual([
                            "./users/279642/",
                            "../users/279642/",
                            ".?userId=279642",
                            "..?userId=279642",
                            ".#279642",
                            "..#279642",
                        ]);
                    });
                });
                it(`リテラルと埋め込みが混合する場合はリテラルの先頭の "./" や "../" のみが維持されること`, () => {
                    expect([
                        testWarnMessage(() => (0, url_from_1.default) `./users/${"userId"}/`({ userId: "." }), [warnMessage1]),
                        testWarnMessage(() => (0, url_from_1.default) `../users/${"userId"}/`({ userId: ".." }), [warnMessage1]),
                        testWarnMessage(() => (0, url_from_1.default) `./${"userId"}/`({ userId: "." }), [warnMessage1]),
                        testWarnMessage(() => (0, url_from_1.default) `../${"userId"}/`({ userId: ".." }), [warnMessage1]),
                    ]).toStrictEqual(["./users/%20/", "../users/%20%20/", "./%20/", "../%20%20/"]);
                });
            });
            describe(`リテラルの先頭の ".../"`, () => {
                it(`リテラルの先頭で指定された ".../" 通常のパスとして認識されること`, () => {
                    const bindUrl = testNotWarnMessage(() => (0, url_from_1.default) `.../users/${"userId"}/`);
                    expect(bindUrl({ userId: 279642 })).toBe(".../users/279642/");
                });
                it(`リテラルの先頭で指定された "..././../...../" 通常のパスとして認識されること`, () => {
                    const bindUrl = testNotWarnMessage(() => (0, url_from_1.default) `..././../...../users/${"userId"}/`);
                    expect(bindUrl({ userId: 279642 })).toBe("..././../...../users/279642/");
                });
                it(`リテラルの先頭で指定された "...//.///..////...../////" 通常のパスとして認識されること`, () => {
                    const bindUrl = testNotWarnMessage(() => (0, url_from_1.default) `...//.///..////...../////users/${"userId"}/`);
                    expect(bindUrl({ userId: 279642 })).toBe("..././../...../users/279642/");
                });
            });
            it.each([".", ".."])(`埋め込みによって発生する特殊ファイル名は半角スペースに変換されること "%s"`, (value) => {
                const encoded = value.replace(/\./g, "%20");
                // 両端
                const bindUrl1 = testNotWarnMessage(() => (0, url_from_1.default) `${"value"}`);
                expect(testWarnMessage(() => bindUrl1({ value }), [warnMessage1])).toBe(`${encoded}`);
                // 始端/
                const bindUrl2 = testNotWarnMessage(() => (0, url_from_1.default) `${"value"}/`);
                expect(testWarnMessage(() => bindUrl2({ value }), [warnMessage1])).toBe(`${encoded}/`);
                // 始端?
                const bindUrl3 = testNotWarnMessage(() => (0, url_from_1.default) `${"value"}?.`);
                expect(testWarnMessage(() => bindUrl3({ value }), [warnMessage1])).toBe(`${encoded}?.`);
                // 始端#
                const bindUrl4 = testNotWarnMessage(() => (0, url_from_1.default) `${"value"}#.`);
                expect(testWarnMessage(() => bindUrl4({ value }), [warnMessage1])).toBe(`${encoded}#.`);
                // /終端
                const bindUrl5 = testNotWarnMessage(() => (0, url_from_1.default) `/${"value"}`);
                expect(testWarnMessage(() => bindUrl5({ value }), [warnMessage1])).toBe(`/${encoded}`);
                // /終端?
                const bindUrl6 = testNotWarnMessage(() => (0, url_from_1.default) `/${"value"}?.`);
                expect(testWarnMessage(() => bindUrl6({ value }), [warnMessage1])).toBe(`/${encoded}?.`);
                // /終端#
                const bindUrl7 = testNotWarnMessage(() => (0, url_from_1.default) `/${"value"}#.`);
                expect(testWarnMessage(() => bindUrl7({ value }), [warnMessage1])).toBe(`/${encoded}#.`);
                // /前後/
                const bindUrl9 = testNotWarnMessage(() => (0, url_from_1.default) `/${"value"}/`);
                expect(testWarnMessage(() => bindUrl9({ value }), [warnMessage1])).toBe(`/${encoded}/`);
                // 始端/終端
                const bindUrl8 = testNotWarnMessage(() => (0, url_from_1.default) `${"value1"}/${"value2"}`);
                expect(testWarnMessage(() => bindUrl8({ value1: value, value2: value }), [warnMessage1])).toBe(`${encoded}/${encoded}`);
                // 複合
                const bindUrl10 = testNotWarnMessage(() => (0, url_from_1.default) `${"value1"}/${"value2"}/${"value3"}?${"value4"}#${"value5"}`);
                expect(testWarnMessage(() => bindUrl10({ value1: value, value2: value, value3: value, value4: value, value5: value }), [warnMessage1])).toBe(`${encoded}/${encoded}/${encoded}?${value}#${value}`);
            });
            it(`リテラルと埋め込みの複合によって発生する特殊ファイル名の場合、埋め込んだドットだけが半角スペースに変換されること`, () => {
                const bindUrl = testNotWarnMessage(() => (0, url_from_1.default) `.${"value1"}/.${"value2"}/${"value3"}.`);
                const actual = testWarnMessage(() => bindUrl({ value1: ".", value2: ".", value3: "." }), [warnMessage1]);
                expect(actual).toBe(".%20/.%20/%20.");
            });
            // "..." は特殊ファイル扱いにならず、通常の文字列と同等に扱えるため
            it(`リテラルと埋め込みの複合によって発生する "..." は半角スペースに変換されないこと`, () => {
                const bindUrl1 = testNotWarnMessage(() => (0, url_from_1.default) `..${"value1"}/..${"value2"}/${"value3"}..`);
                expect(bindUrl1({ value1: ".", value2: ".", value3: "." })).toBe(".../.../...");
                const bindUrl2 = testNotWarnMessage(() => (0, url_from_1.default) `.${"value1"}${"value1"}/${"value2"}.${"value2"}/${"value3"}${"value3"}.`);
                expect(bindUrl2({ value1: ".", value2: ".", value3: "." })).toBe(".../.../...");
            });
            // 予め開発者がパターンを予想でき、意図的にそのようにした可能性もあるため
            it(`リテラルと埋め込みと埋め込みの省略によって発生する ".." は半角スペースに変換されないこと`, () => {
                const bindUrl1 = testNotWarnMessage(() => (0, url_from_1.default) `..${"value1?"}/.${"value2?"}./${"value3?"}..`);
                expect(bindUrl1()).toBe("../../..");
            });
        });
    });
    describe("埋め込みオプション", () => {
        it.each([
            [[], "https://example.com/users/279642/a/b/"],
            [[1], "https://example.com/users/279642/a/b/1"],
            [[1, 2, 3], "https://example.com/users/279642/a/b/1%3A2%3A3"],
            [[-1, -2, -3], "https://example.com/users/279642/a/b/-1%3A-2%3A-3"],
        ])(`%s -> "%s"`, (domains, expected) => {
            const url = (0, url_from_1.default) `https://example.com/users/${"userId"}/${"...paths"}/${"...domain"}`(Object.assign(Object.assign({}, baseParams), { domain: { value: domains, separator: ":" } }));
            expect(url).toBe(expected);
        });
        it.each([
            [[], "https://example.com/users/279642/a/b/"],
            [[1], "https://example.com/users/279642/a/b/1"],
            [[1, 2, 3], "https://example.com/users/279642/a/b/1/2/3"],
            [[-1, -2, -3], "https://example.com/users/279642/a/b/-1/-2/-3"],
        ])(`%s -> "%s"`, (domains, expected) => {
            const url = (0, url_from_1.default) `https://example.com/users/${"userId"}/${"...paths"}/${"...domain"}`(Object.assign(Object.assign({}, baseParams), { domain: { value: domains } }));
            expect(url).toBe(expected);
        });
    });
    describe("subdomain", () => {
        it.each([
            [[], "https://example.com/users/279642/a/b"],
            [["www"], "https://www.example.com/users/279642/a/b"],
            [["foo", "www"], "https://foo.www.example.com/users/279642/a/b"],
        ])(`%s -> "%s"`, (domains, expected) => {
            const url = (0, url_from_1.default) `https://${"subdomain."}example.com/users/${"userId"}/${"...paths"}`({
                userId: "279642",
                paths: ["a", "b"],
                "subdomain.": domains,
            });
            expect(url).toBe(expected);
        });
        it(`セパレータを変更できること`, () => {
            const url = (0, url_from_1.default) `https://${"subdomain."}example.com/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), { "subdomain.": { value: ["foo", "bar"], separator: "-" } }));
            expect(url).toBe("https://foo-bar.example.com/users/279642/a/b");
        });
        describe("subdomain value invalid type", () => {
            it.each([[{}], [[]], [() => { }]])(`%s`, (value) => {
                expect(() => (0, url_from_1.default) `https://${"subdomain."}example.com/`({
                    "subdomain.": 
                    // @ts-expect-error 敢えて不正な型を渡すため
                    [value],
                })).toThrowError(`Invalid subdomain value for index 0. Received: ${value}`);
            });
            it(`NaN`, () => {
                const url = testWarnMessage(() => {
                    return (0, url_from_1.default) `https://${"subdomain."}example.com/`({ "subdomain.": [NaN] });
                }, [`The value NaN was passed to the index 0 at placeholder "subdomain.".`]);
                expect(url).toBe("https://NaN.example.com/");
            });
        });
    });
    describe("fragment", () => {
        it.each([
            [undefined, "https://example.com/users/279642/a/b"],
            // new URL() の url.hash = "" で "#" が無くなるのと挙動を合わせる
            ["", "https://example.com/users/279642/a/b"],
            ["hash", "https://example.com/users/279642/a/b#hash"],
        ])(`"%s" -> "%s"`, (fragment, expected) => {
            expect(bindUrl(Object.assign(Object.assign({}, baseParams), { "#fragment": fragment }))).toBe(expected);
        });
    });
    describe("query", () => {
        const specialChars = baseSpecialChars;
        describe("エンコード", () => {
            it.each([
                [
                    (0, url_from_1.default) `https://example.com/${"path"}/?foo=1&bar=2`({
                        path: specialChars,
                        "?query": {
                            [specialChars]: specialChars,
                        },
                    }),
                    `https://example.com/${(0, util_1.encodeRFC3986)(specialChars)}/?foo=1&bar=2&${(0, util_1.encodeRFC3986)(specialChars)}=${(0, util_1.encodeRFC3986)(specialChars)}`,
                ],
                // encodeURIComponent ではエンコードされず RFC3986 でエンコードされる文字とコードの対応
                // " " "!" "'" "(" ")" "*"
                // %20 %21 %27 %28 %29 %2A
                [
                    // 各所でエンコードされていることを確認
                    (0, url_from_1.default) `https://${"userinfo@"}${"subdomain."}example.com/${"...paths"}/?foo=1&bar=2`({
                        "userinfo@": { user: "!", password: "*" },
                        "subdomain.": ["(", ")"],
                        paths: ["'", " "],
                        "#fragment": " ",
                    }),
                    `https://%21:%2A@%28.%29.example.com/%27/%20/?foo=1&bar=2#%20`,
                ],
            ])(`"%s" = "%s"`, (url, expected) => {
                expect(url).toBe(expected);
            });
        });
        describe("テンプレート側に記述", () => {
            it.each([
                // 無意味な"?"は削除
                [(0, url_from_1.default) `https://example.com?`(), "https://example.com"],
                [(0, url_from_1.default) `https://example.com?`({ "?query": {} }), "https://example.com"],
                [(0, url_from_1.default) `https://example.com?foo=1&bar=2`(), "https://example.com?foo=1&bar=2"],
                [(0, url_from_1.default) `https://example.com?foo=1&bar=2`({ "?query": {} }), "https://example.com?foo=1&bar=2"],
                // 上書き
                [(0, url_from_1.default) `https://example.com?`({ "?query": { foo: 1, bar: 2 } }), "https://example.com?foo=1&bar=2"],
                [
                    (0, url_from_1.default) `https://example.com?foo=1&bar=2`({ "?query": { bar: 20, baz: 30 } }),
                    "https://example.com?foo=1&bar=20&baz=30",
                ],
                // 追記
                [
                    (0, url_from_1.default) `https://example.com?foo=1&bar=2`({
                        "?query": [
                            ["bar", 20],
                            ["baz", 30],
                        ],
                    }),
                    "https://example.com?foo=1&bar=2&bar=20&baz=30",
                ],
            ])(`"%s" = "%s"`, (url, expected) => {
                expect(url).toBe(expected);
            });
            it("イコールのエンコード漏れに警告を出してエンコードすること", () => {
                const bindUrl1 = testWarnMessage(() => (0, url_from_1.default) `?foo=bar=baz&foo=bar=baz`, ['The literal part contains an unencoded query string "=". Received: `?foo=bar=baz&foo=bar=baz`']);
                expect(bindUrl1()).toBe("?foo=bar%3Dbaz&foo=bar%3Dbaz");
                const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `?f${["o"]}o=b${["a"]}r=b${["a"]}z&f${["o"]}o=b${["a"]}r=b${["a"]}z`, [
                    'The literal part contains an unencoded query string "=". Received: `?f${["o"]}o=b${["a"]}r=b${["a"]}z&f${["o"]}o=b${["a"]}r=b${["a"]}z`',
                ]);
                expect(bindUrl2()).toBe("?foo=bar%3Dbaz&foo=bar%3Dbaz");
                const bindUrl3 = testWarnMessage(() => (0, url_from_1.default) `?${["foo"]}=${["bar"]}=${["baz"]}&${["foo"]}=${["bar"]}=${["baz"]}`, [
                    'The literal part contains an unencoded query string "=". Received: `?${["foo"]}=${["bar"]}=${["baz"]}&${["foo"]}=${["bar"]}=${["baz"]}`',
                ]);
                expect(bindUrl3()).toBe("?foo=bar%3Dbaz&foo=bar%3Dbaz");
            });
        });
        describe("静的なパスと連携", () => {
            it.each([
                [{}, "https://example.com"],
                [{ foo: 1 }, "https://example.com?foo=1"],
                [{ foo: 1, bar: 2 }, "https://example.com?foo=1&bar=2"],
                [[], "https://example.com"],
                [
                    [
                        ["foo", 1],
                        ["foo", 2],
                        ["bar", 3],
                    ],
                    "https://example.com?foo=1&foo=2&bar=3",
                ],
            ])(`%s -> "%s"`, (query, expected) => {
                const url = (0, url_from_1.default) `https://example.com`({ "?query": query });
                expect(url).toBe(expected);
            });
        });
        describe("動的なパスと連携", () => {
            it.each([
                [{}, "https://example.com/users/279642/a/b"],
                [{ foo: 1 }, "https://example.com/users/279642/a/b?foo=1"],
                [{ foo: 1, bar: 2 }, "https://example.com/users/279642/a/b?foo=1&bar=2"],
                [[], "https://example.com/users/279642/a/b"],
                [
                    [
                        ["foo", 1],
                        ["foo", 2],
                        ["bar", 3],
                    ],
                    "https://example.com/users/279642/a/b?foo=1&foo=2&bar=3",
                ],
            ])(`%s -> "%s"`, (query, expected) => {
                expect(bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query }))).toBe(expected);
            });
        });
        describe("文字列で設定", () => {
            it.each([
                ["", `https://example.com/users/279642/a/b`],
                ["foo=1", `https://example.com/users/279642/a/b?foo=1`],
                ["?foo=1", `https://example.com/users/279642/a/b?foo=1`],
                ["%20=%25", `https://example.com/users/279642/a/b?%20=%25`],
                ["?%20=%25", `https://example.com/users/279642/a/b?%20=%25`],
            ])(`"%s"`, (query, expected) => {
                expect(bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query }))).toBe(expected);
            });
            describe("エンコード漏れの文字列は警告を出してエンコードする", () => {
                it.each([
                    ["??", `https://example.com/users/279642/a/b?%3F=`, 1, "?"],
                    ["?foo=1?&bar=2", `https://example.com/users/279642/a/b?foo=1%3F&bar=2`, 6, "?"],
                    ["?foo=1+&bar=2", `https://example.com/users/279642/a/b?foo=1%2B&bar=2`, 6, "+"],
                    ["?foo=1+ &bar=2", `https://example.com/users/279642/a/b?foo=1%2B%20&bar=2`, 6, "+ "],
                ])(`"%s"`, (query, expected, index, character) => {
                    const result = testWarnMessage(() => {
                        return bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query }));
                    }, [
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${index} "${character}"`,
                    ]);
                    expect(result).toBe(expected);
                });
                it(`複数のエンコード漏れに警告を出すこと`, () => {
                    const result = testWarnMessage(() => {
                        return bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": "?foo=1+ &ba +r=2" }));
                    }, [
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "?foo=1+ &ba +r=2" index: 6 "+ "`,
                        `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "?foo=1+ &ba +r=2" index: 11 " +"`,
                    ]);
                    expect(result).toBe(`https://example.com/users/279642/a/b?foo=1%2B%20&ba%20%2Br=2`);
                });
            });
            describe("空文字のキーが残ること", () => {
                it.each([["?=bar"], ["?=bar&=baz"]])(`"%s"`, (query) => {
                    const result = testNotWarnMessage(() => bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query })));
                    expect(result).toBe(`https://example.com/users/279642/a/b${query}`);
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
                    const result = testWarnMessage(() => bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query })), expectedWarningIndexes.map((index) => `The encoding of the string type QueryString is incorrect; pass an RFC3986 compliant QueryString. "${query}" index: ${index} "="`));
                    expect(result).toBe(`https://example.com/users/279642/a/b${expectedQuery}`);
                });
            });
        });
        describe("URLSearchParamsで設定", () => {
            it.each([
                [new URLSearchParams(), `https://example.com/users/279642/a/b`],
                [new URLSearchParams("foo=1"), `https://example.com/users/279642/a/b?foo=1`],
                [new URLSearchParams("?foo=1"), `https://example.com/users/279642/a/b?foo=1`],
                [new URLSearchParams("%20=%25"), `https://example.com/users/279642/a/b?%20=%25`],
                [new URLSearchParams("?%20=%25"), `https://example.com/users/279642/a/b?%20=%25`],
            ])(`"%s"`, (query, expected) => {
                expect(bindUrl(Object.assign(Object.assign({}, baseParams), { "?query": query }))).toBe(expected);
            });
        });
    });
    describe("userinfo", () => {
        it.each([
            [undefined, undefined, "https://example.com/users/279642/a/b"],
            ["user", undefined, "https://user@example.com/users/279642/a/b"],
            ["user", "password", "https://user:password@example.com/users/279642/a/b"],
            [undefined, "password", "https://example.com/users/279642/a/b"],
        ])(`user: %s, password: %s -> "%s"`, (user, password, expected) => {
            const url = (0, url_from_1.default) `https://${"userinfo@"}${"host"}/users/${"userId"}/${"...paths?"}`(Object.assign(Object.assign({}, baseParams), { "userinfo@": { user, password } }));
            expect(url).toBe(expected);
        });
        it(`userinfo使用時、authorityコンポーネントに "@" が現れたら警告を出すこと`, () => {
            const bindUrl1 = testWarnMessage(() => (0, url_from_1.default) `https://${"userinfo@?"}example.com@www.example.com/path/to`, [
                `It is incorrect to include "@" in the authority component when using userinfo placeholder. Please remove "@" from the host.`,
            ]);
            expect(bindUrl1()).toBe("https://example.com@www.example.com/path/to");
            expect(bindUrl1({ "userinfo@": { user: "foo", password: "bar" } })).toBe("https://foo:bar@example.com@www.example.com/path/to");
            const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `https://${"userinfo@"}example.com@www.example.com/path/to`, [
                `It is incorrect to include "@" in the authority component when using userinfo placeholder. Please remove "@" from the host.`,
            ]);
            expect(bindUrl2({ "userinfo@": { user: "foo", password: "bar" } })).toBe("https://foo:bar@example.com@www.example.com/path/to");
        });
    });
    describe("port", () => {
        it.each([
            [0, "https://example.com:0/users/279642/a/b"],
            [65535, "https://example.com:65535/users/279642/a/b"],
        ])(`":port" に %s を指定できること -> "%s"`, (port, expected) => {
            const url = (0, url_from_1.default) `https://${"host"}${":port"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), { ":port": port }));
            expect(url).toBe(expected);
        });
        it.each([[undefined, "https://example.com/users/279642/a/b"]])(`":port?" は指定を省略できること -> "%s"`, (port, expected) => {
            const url = (0, url_from_1.default) `https://${"host"}${":port?"}/users/${"userId"}/${"...paths"}`(Object.assign(Object.assign({}, baseParams), { ":port": port }));
            expect(url).toBe(expected);
        });
        it.each([-1, 65536])(`":port" に %s が指定されると例外が投げられること -> "%s"`, (port) => {
            const bindUrl = (0, url_from_1.default) `https://${"host"}${":port"}/users/${"userId"}/${"...paths"}`;
            expect(() => bindUrl(Object.assign(Object.assign({}, baseParams), { ":port": port }))).toThrowError(`The value of the placeholder ":port" appropriate port number 0 ~ 65535. Received: ` + port);
        });
        it(`":port" に NaN が指定されると例外を投げること`, () => {
            const bindUrl = (0, url_from_1.default) `https://${"host"}${":port"}/users/${"userId"}/${"...paths"}`;
            expect(() => bindUrl(Object.assign(Object.assign({}, baseParams), { ":port": NaN }))).toThrowError('The value NaN was passed to the placeholder ":port".');
        });
    });
    describe("etc", () => {
        it(`相対パスの想定時に省略してルートパスにならないこと"`, () => {
            const bindUrl = (0, url_from_1.default) `${"foo?"}/bar`;
            const url = testWarnMessage(() => bindUrl(), [
                `It is dangerous to try to generate a root path from a template that assumes a relative path.\nplease improve \`\${\"foo?\"}/bar\` to \`\${\"foo?/\"}bar\`.`,
            ]);
            expect(url).toBe("bar");
        });
        // NOTE: 設定があれば特定のホスト、なければルートパスという使い方は想定されるため
        //it(`URL想定時に省略した場合はルートパスを許容すること"`, () => {
        //  const bindUrl = urlFrom`${"scheme://host/path?"}/bar`;
        //  const url = testNotWarnMessage(() => bindUrl());
        //  expect(url).toBe("/bar");
        //});
        // NOTE: schemeあれば優先し、なければProtocol-relative URLという使い方は想定されるため
        it(`scheme省略時のProtocol-relative URLは許容すること"`, () => {
            const bindUrl = (0, url_from_1.default) `${"scheme:?"}//example.com/path/to`;
            const url = testNotWarnMessage(() => bindUrl());
            expect(url).toBe("//example.com/path/to");
        });
        it(`ルートパス想定のときにProtocol-relative URLにならないこと"`, () => {
            expect((0, url_from_1.default) `/${"foo?"}/bar`()).toBe("/bar");
            expect((0, url_from_1.default) `/${"foo?"}${"/bar?"}`({ bar: "bar" })).toBe("/bar");
            expect((0, url_from_1.default) `/${"foo?"}${"/bar?"}/baz`()).toBe("/baz");
        });
        describe(`明らかに不正なURL`, () => {
            it(`リテラルで":"が"/"より先に現れる場合、":"より手前はスキームとして解釈すること`, () => {
                const bindUrl = (0, url_from_1.default) `${"scheme"}://example.com`;
                expect(() => bindUrl({ scheme: 123 })).toThrowError(`Invalid URL "123://example.com"`);
                expect(() => bindUrl({ scheme: ".foo" })).toThrowError(`Invalid URL ".foo://example.com"`);
                expect(() => bindUrl({ scheme: "-foo" })).toThrowError(`Invalid URL "-foo://example.com"`);
                // "scheme:" と違って "scheme" で通常の値として埋め込まれる場合、"+"はエンコードされるため例外のメッセージもエンコードされた状態になる
                expect(() => bindUrl({ scheme: "+foo" })).toThrowError(`Invalid URL "%2Bfoo://example.com"`);
                expect(() => bindUrl({ scheme: "foo+bar" })).toThrowError(`Invalid URL "foo%2Bbar://example.com"`);
            });
            it(`ホストが未設定の場合は例外が投げられること`, () => {
                const bindUrl = (0, url_from_1.default) `${"scheme:"}//`;
                expect(() => bindUrl({ "scheme:": "https" })).toThrowError(`Invalid URL "https://"`);
            });
        });
        it(`authorityコンポーネントに "@" が2回以上現れたら警告を出すこと`, () => {
            const bindUrl1 = testWarnMessage(() => (0, url_from_1.default) `https://user@example.com@www.example.com/path/to`, [
                `It is dangerous to use multiple "@" in the authority component.\nif you use "@" for user or password, please embed it in a Direct Placeholder.`,
            ]);
            expect(bindUrl1()).toBe("https://user@example.com@www.example.com/path/to");
            const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `https://user@${["example.com"]}@www.example.com/path/to`, [
                `It is dangerous to use multiple "@" in the authority component.\nif you use "@" for user or password, please embed it in a Direct Placeholder.`,
            ]);
            expect(bindUrl2()).toBe("https://user@example.com@www.example.com/path/to");
        });
        it(`authorityコンポーネントに "@" が2回以上現れたら警告を出すこと`, () => {
            const bindUrl1 = testWarnMessage(() => (0, url_from_1.default) `https://user@example.com@www.example.com/path/to`, [
                `It is dangerous to use multiple "@" in the authority component.\nif you use "@" for user or password, please embed it in a Direct Placeholder.`,
            ]);
            expect(bindUrl1()).toBe("https://user@example.com@www.example.com/path/to");
            const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `https://user@${["example.com"]}@www.example.com/path/to`, [
                `It is dangerous to use multiple "@" in the authority component.\nif you use "@" for user or password, please embed it in a Direct Placeholder.`,
            ]);
            expect(bindUrl2()).toBe("https://user@example.com@www.example.com/path/to");
        });
        it(`authorityコンポーネントとpathコンポーネントの間にplaceholderが無くてもpathコンポーネントが認識されること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}://user:pass@example.com/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `${"scheme"}://user:pass@example.com/:/@/::/@@`',
            ]);
            expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com/%3A/%40/%3A%3A/%40%40".`);
            expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com/%3A/%40/%3A%3A/%40%40");
        });
        // TODO: 先行してSchemeコンポーネントであることを識別する仕組みが必要
        it(`schemeコンポーネントにplaceholderが2つ使用されてもauthorityコンポーネントを認識できること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme1"}.${"scheme2"}://user:pass@example.com/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `${"scheme1"}.${"scheme2"}://user:pass@example.com/:/@/::/@@`',
            ]);
            expect(() => bindUrl({ scheme1: "---", scheme2: "foo" })).toThrowError(`Invalid URL "---.foo://user:pass@example.com/%3A/%40/%3A%3A/%40%40".`);
            // セキュリティ的に明らかに適切ではないがテストとして必要
            expect(bindUrl({ scheme1: "foo", scheme2: "https" })).toBe("foo.https://user:pass@example.com/%3A/%40/%3A%3A/%40%40");
        });
        // TODO: 先行してSchemeコンポーネントであることを識別する仕組みが必要
        it.skip(`schemeコンポーネントにplaceholderが2つ使用されてもauthorityコンポーネントを認識できること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme1"}+${"scheme2"}://user:pass@example.com/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `${"scheme1"}+${"scheme2"}://user:pass@example.com/:/@/::/@@`',
            ]);
            expect(() => bindUrl({ scheme1: "---", scheme2: "foo" })).toThrowError(`Invalid URL "---+foo://user:pass@example.com/%3A/%40/%3A%3A/%40%40".`);
            // セキュリティ的に明らかに適切ではないがテストとして必要
            expect(bindUrl({ scheme1: "git", scheme2: "https" })).toBe("git+https://user:pass@example.com/%3A/%40/%3A%3A/%40%40");
        });
        it(`authorityコンポーネントにplaceholderが使用されてもauthorityとpathコンポーネントを認識できること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `https://${"user"}:${"pass"}@${"host"}/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `https://${"user"}:${"pass"}@${"host"}/:/@/::/@@`',
            ]);
            // セキュリティ的に明らかに適切ではないがテストとして必要
            expect(bindUrl({ user: "foo", pass: "bar", host: "example.com" })).toBe("https://foo:bar@example.com/%3A/%40/%3A%3A/%40%40");
        });
        it(`authorityコンポーネントにportが指定されていてもauthorityとpathコンポーネントを認識できること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `https://${"user"}:${"pass"}@${"host"}:0/:/@/::/@@`, [
                'The literal part contains an unencoded path string ":@". Received: `https://${"user"}:${"pass"}@${"host"}:0/:/@/::/@@`',
            ]);
            // セキュリティ的に明らかに適切ではないがテストとして必要
            expect(bindUrl({ user: "foo", pass: "bar", host: "example.com" })).toBe("https://foo:bar@example.com:0/%3A/%40/%3A%3A/%40%40");
        });
        it(`authorityコンポーネントのhost部にエンコード対象の文字列が含まれていても認識できること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `https://${"user"}:${"pass"}@${"host"} /:/@/::/@@`, [
                'The literal part contains an unencoded path string " :@". Received: `https://${"user"}:${"pass"}@${"host"} /:/@/::/@@`',
            ]);
            // セキュリティ的に明らかに適切ではないがテストとして必要
            expect(() => bindUrl({ user: "foo", pass: "bar", host: "example.com" })).toThrowError('Invalid URL "https://foo:bar@example.com%20/%3A/%40/%3A%3A/%40%40".');
        });
        describe(`リテラルの"/"より先に現れる最初の":"の直後に"//"が続く場合`, () => {
            it(`終端で終わるリテラルでauthorityコンポーネントを認識できること`, () => {
                const bindUrl = testNotWarnMessage(() => (0, url_from_1.default) `${"scheme"}://user:pass@example.com`);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com".`);
            });
            it(`"?"で終わるリテラルでauthorityコンポーネントを認識できること`, () => {
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}://user:pass@example.com?:=@`, [
                    'The literal part contains an unencoded query string ":@". Received: `${"scheme"}://user:pass@example.com?:=@`',
                ]);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com?%3A=%40");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com?%3A=%40".`);
            });
            it(`"#"で終わるリテラルでauthorityコンポーネントを認識できること`, () => {
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}://user:pass@example.com#:@`, [
                    'The literal part contains an unencoded fragment string ":@". Received: `${"scheme"}://user:pass@example.com#:@`',
                ]);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com#%3A%40");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com#%3A%40".`);
            });
        });
        describe(`リテラルの"/"より先に現れる最初の":"の直後に"//"ではなく"/"が続く場合`, () => {
            it(`authorityコンポーネントが終端で終わるリテラルを使用すると警告を出して"//"に補完すること`, () => {
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}:/user:pass@example.com`, [`Single slash in front of the authority component was missing and has been completed.`]);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com".`);
            });
            it(`authorityコンポーネントが"?"で終わるリテラルを使用すると警告を出して"//"に補完すること`, () => {
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}:/user:pass@example.com?:=@`, [
                    `Single slash in front of the authority component was missing and has been completed.`,
                    'The literal part contains an unencoded query string ":@". Received: `${"scheme"}:/user:pass@example.com?:=@`',
                ]);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com?%3A=%40");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com?%3A=%40".`);
            });
            it(`authorityコンポーネントが"#"で終わるリテラルを使用すると警告を出して"//"に補完すること`, () => {
                const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}:/user:pass@example.com#:@`, [
                    `Single slash in front of the authority component was missing and has been completed.`,
                    'The literal part contains an unencoded fragment string ":@". Received: `${"scheme"}:/user:pass@example.com#:@`',
                ]);
                expect(bindUrl({ scheme: "https" })).toBe("https://user:pass@example.com#%3A%40");
                expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://user:pass@example.com#%3A%40".`);
            });
        });
        it(`"scheme:" ではなく "scheme" で独自に不正なschemeを渡すと例外が投げられること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}:/${"foo?"}/example.com`, [`Single slash in front of the authority component was missing and has been completed.`]);
            expect(bindUrl({ scheme: "https" })).toBe("https://example.com");
            expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://example.com".`);
        });
        it(`authorityコンポーネント前の"//"が"/"の場合は警告を出して"/"を補完すること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `${"scheme"}:/example.com`, ["Single slash in front of the authority component was missing and has been completed."]);
            expect(bindUrl({ scheme: "https" })).toBe("https://example.com");
            expect(bindUrl({ scheme: "file" })).toBe("file://example.com");
            expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://example.com".`);
        });
        it(`authorityコンポーネント前の"//"が無い状態で"/"が必要なschemeになった場合は警告を出して"/"を補完すること`, () => {
            const bindUrl = (0, url_from_1.default) `${"scheme"}:example.com`;
            expect(testWarnMessage(() => bindUrl({ scheme: "https" }), ["Slash in front of the authority component was missing and has been completed."])).toBe("https://example.com");
            expect(testWarnMessage(() => bindUrl({ scheme: "file" }), ["Slash in front of the authority component was missing and has been completed."])).toBe("file:///example.com");
            expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---:example.com".`);
        });
        // NOTE: 本来この挙動は望ましくないが、適切な動作を導き出せていない
        // テンプレートの構成としてはauthorityコンポーネントを持たない想定であるが、値が省略されるとauthorityコンポーネントが発生してしまう。
        it(`":"の直後が値の省略によって"/"になった場合、authorityコンポーネントの開始として認識されること`, () => {
            const bindUrl = (0, url_from_1.default) `${"scheme"}:${"foo?"}//example.com`;
            expect(() => bindUrl({ scheme: "---" })).toThrowError(`Invalid URL "---://example.com".`);
            expect(bindUrl({ scheme: "https" })).toBe("https://example.com");
            expect(bindUrl({ scheme: "file" })).toBe("file://example.com");
        });
        it(`相対パスのpathコンポーネントに ":/" を含んでいると ":" は警告を出してエンコードされること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `./${"scheme"}:/${"foo?"}/example.com`, ['The literal part contains an unencoded path string ":". Received: `./${"scheme"}:/${"foo?"}/example.com`']);
            expect(bindUrl({ scheme: "---" })).toBe("./---%3A/example.com");
        });
        // ":"のルール
        // - "/"より前に":"がある場合、schemeを持つ可能性がある
        //   - schemeを持つことが確定ではないのは`${"scheme:?"}//`のときに値を省略すると`//`から始まるProtocol-relative URLになる可能性があるため
        //     - `${"scheme:"}//`のように必須ならschemeを持つことが確定
        //   - schemeの直後の":"はエンコード対象外
        // - schemeの":"を持つ場合、"://"ではない":/"は警告を出して"://"に変換する
        //   - `${"scheme:"}`の直後の"//"ではない"/"に関しても"//"に変換する
        // - "://"または`${"scheme:"}`直後の"//"から次の"/"まではauthorityコンポーネント
        //   - authorityコンポーネントでは":"と"@"がエンコード対象外
        //   - ":///" の後はauthorityコンポーネントではなくpathコンポーネントなので注意
        // - pathコンポーネント以降の":"と"@"はエンコード対象
        // - URNは一旦現状はサポート外
        it(`pathコンポーネントの":"は警告を出してエンコードされること`, () => {
            const bindUrl1 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/:/foo:bar:`, ['The literal part contains an unencoded path string ":". Received: `https://example.com/:/foo:bar:`']);
            expect(bindUrl1()).toBe("https://example.com/%3A/foo%3Abar%3A");
            const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `https://example.com/:/${"foo"}:bar:`, ['The literal part contains an unencoded path string ":". Received: `https://example.com/:/${"foo"}:bar:`']);
            expect(bindUrl2({ foo: "foo" })).toBe("https://example.com/%3A/foo%3Abar%3A");
        });
        it(`pathコンポーネントの"@"は警告を出してエンコードされること`, () => {
            const bindUrl = testWarnMessage(() => (0, url_from_1.default) `https://example.com/@/foo@bar@`, ['The literal part contains an unencoded path string "@". Received: `https://example.com/@/foo@bar@`']);
            expect(bindUrl()).toBe("https://example.com/%40/foo%40bar%40");
        });
        it(`authorityコンポーネントの"@"と":"は警告を出さずに残ること`, () => {
            const bindUrl1 = (0, url_from_1.default) `https://user:pass@example.com/`;
            expect(bindUrl1()).toBe("https://user:pass@example.com/");
        });
        it(`authorityコンポーネントの"@"と":"は警告を出さずに残し、pathコンポーネントの"@"は警告を出してエンコードされること`, () => {
            const bindUrl2 = testWarnMessage(() => (0, url_from_1.default) `https://user:pass@example.com/@/foo@bar@`, ['The literal part contains an unencoded path string "@". Received: `https://user:pass@example.com/@/foo@bar@`']);
            expect(bindUrl2()).toBe("https://user:pass@example.com/%40/foo%40bar%40");
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
