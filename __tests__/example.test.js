"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = __importDefault(require("../"));
// お試し用のサンプルコードです。
// `yarn test --watch` 実行後に手を動かして挙動を確認できます。
it(`example 1`, () => {
    const bindUrl = (0, __1.default) `https://example.com/tags${"/tag?:string"}`;
    const url1 = bindUrl();
    expect(url1).toBe("https://example.com/tags");
});
it(`example 2`, () => {
    const bindUrl = (0, __1.default) `https://example.com/tags${"/tag?:string"}`;
    const url2 = bindUrl({
        tag: "🐹", // tag is string type only.
        "?query": { foo: "!'", bar: 2, baz: false },
        "#fragment": "()*",
    });
    expect(url2).toBe("https://example.com/tags/%F0%9F%90%B9?foo=%21%27&bar=2&baz=false#%28%29%2A");
});
it(`example 3 Type Narrowing`, () => {
    const bindUrl = ((0, __1.default) `https://example.com/theme/${"theme:string"}${"/color?:string"}`.narrowing);
    expect(bindUrl({ theme: "lighter" })).toBe("https://example.com/theme/lighter"); // ✅
    expect(bindUrl({ theme: "dark" })).toBe("https://example.com/theme/dark"); // ✅
    expect(bindUrl({ theme: "original", color: "red" })).toBe("https://example.com/theme/original/red"); // ✅
    // @ts-expect-error
    // ❌ TS2345: Argument of type '{ theme: "original"; }' is not assignable to parameter of type 'Readonly<{ "?query"?: QueryParams | undefined; "#fragment"?: string | undefined; color?: BindParam<string | null | undefined>; } & ({ theme: "lighter" | "dark"; } | { ...; })>'.
    //        Property 'color' is missing in type '{ theme: "original"; }' but required in type 'Readonly<{ "?query"?: QueryParams | undefined; "#fragment"?: string | undefined; color?: BindParam<string | null | undefined>; } & { theme: "original"; color: "red" | "blue"; }>'.
    bindUrl({ theme: "original" });
});
