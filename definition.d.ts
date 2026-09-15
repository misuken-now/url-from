/** プレースホルダで特別な意味を持つ文字 */
export type PlaceholderSpecialCharacter = "#" | "." | "/" | ":" | "?" | "@";
/** プレースホルダで特別な文字を含む文字列 */
export type PlaceholderSpecialCharacterContain = `${string}${PlaceholderSpecialCharacter}${string}`;
/** プレースホルダ名に使用できない文字列 */
export type InvalidPlaceholderName = "" | PlaceholderSpecialCharacterContain;
/** QueryString操作で使用する削除を表す識別子 */
export declare const QueryDelete: unique symbol;
export type QueryDelete = typeof QueryDelete;
/** 値 */
export type Value = string | number;
/** パスに指定できる値 */
export type PathValue = Value | PathSkipValue;
/** パスで処理をスキップする値 */
export type PathSkipValue = "" | null | undefined;
/** Queryに指定できる値 */
export type QueryValue = Value | boolean | QuerySkipValue | QueryDelete;
/** Queryに指定できる値 */
export type QuerySkipValue = null | undefined;
/** Queryに指定できるkey:valueに該当する組 */
export type QueryTuple = readonly [string, QueryValue | readonly QueryValue[]];
/** Queryに指定できる組の配列に指定できるFalsyな値 */
export type QueryTupleFalsyValue = "" | false | null | undefined;
/** Queryに指定できる組の配列 */
export type QueryTupleArray = ReadonlyArray<QueryTuple | QueryTupleFalsyValue>;
/** QueryStringを表現するオブジェクト */
export type QueryParams = Readonly<Record<string, QueryValue | readonly QueryValue[]>> | QueryTupleArray | URLSearchParams | string;
/** プレースホルダに結びつける際のパラメータ */
export type BindParam<T> = T | BindObjectParam<T>;
/** プレースホルダに結びつける際のオブジェクト形式のパラメータ */
export type BindObjectParam<T> = {
    value: T;
    separator?: string;
};
/** ユーザー情報のオプション */
export type UserinfoOptions = {
    user?: string;
    password?: string;
};
/** オプション */
export type Options = {
    "userinfo@"?: Readonly<UserinfoOptions>;
    "scheme://host"?: string;
    "scheme://authority"?: string;
    "scheme://host/path"?: string;
    "scheme://authority/path"?: string;
    "scheme:"?: string;
    ":port"?: number;
    "subdomain."?: readonly string[];
};
/** bind時のオプション */
export type BindOptions = {
    "?query"?: QueryParams;
    "#fragment"?: string;
};
export type NativePlaceholderValueTable = {
    "userinfo@"?: Readonly<UserinfoOptions>;
    "userinfo@?"?: Readonly<UserinfoOptions>;
    "scheme://host"?: string;
    "scheme://host?"?: string;
    "scheme://authority"?: string;
    "scheme://authority?"?: string;
    "scheme://host/path"?: string;
    "scheme://authority/path"?: string;
    "scheme:"?: string;
    "scheme:?"?: string;
    ":port"?: number;
    ":port?"?: number;
    "subdomain."?: readonly string[];
    "subdomain.?"?: readonly string[];
};
type TypeTable = {
    string: string;
    number: number;
};
/** プレースホルダの情報 */
type Placeholder<Name extends string = string, Type extends PathValue = PathValue, Optional extends boolean = boolean, IsArray extends boolean = boolean> = {
    name: Name;
    type: Type;
    optional: Optional;
    isArray: IsArray;
};
/** プレースホルダ名ごとに対応している型を解決する */
type ResolvePlaceholderValue<T extends Placeholder> = T["isArray"] extends true ? readonly (T["type"] extends number ? T["type"] | Exclude<PathSkipValue, ""> : T["type"] | PathSkipValue)[] : T["name"] extends "scheme://authority" | "scheme://host" | "scheme://authority/path" | "scheme://host/path" ? string : T["name"] extends "subdomain." ? readonly (T["type"] | PathSkipValue)[] : T["name"] extends "userinfo@" ? Readonly<UserinfoOptions> : T["name"] extends "scheme:" ? string : T["name"] extends ":port" ? number : T["name"] extends keyof NativePlaceholderValueTable ? never : T["type"];
/** プレースホルダの構文として正しいものを抽出する */
export type ExtractValidPlaceholderSyntax<Item extends string | [Value], AvailableItem extends string> = Item extends [Value] ? Item : string extends Item ? never : Item extends keyof NativePlaceholderValueTable ? Item : Item extends `/${string}/` | `/${string}` | `${string}/` ? Item extends `${"/" | ""}${keyof NativePlaceholderValueTable}${"/" | ""}` | `//${string}` | `${string}//` ? never : Item extends `/${infer P}/` ? `/${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}/` : Item extends `${infer P}/` ? `${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}/` : Item extends `/${infer P}` ? `/${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}` : never : Item extends AvailableItem ? Item extends `...${infer Name}${"?" | ""}${`:${infer Type}` | ""}` ? string extends Type ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, string> : Type extends `${infer Type2}[]` ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, Type2> : never : Item extends `${infer Name}${"?" | ""}${`:${infer Type}` | ""}` ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, Type> : never : never;
type ExtractValidPlaceholderSpec<Item extends string, AvailableItem, Name, Type> = Name extends InvalidPlaceholderName ? never : string extends Type ? Item : Type extends keyof TypeTable ? Item : never;
export type BindParams<PlaceholderSyntax extends string, Placeholders extends {
    [P in string]: Placeholder;
} = {
    [P in PlaceholderSyntax as ParsePlaceholderSyntax<P>["name"]]: ParsePlaceholderSyntax<P>;
}, Names extends string = ParsePlaceholderSyntax<PlaceholderSyntax>["name"]> = BindOptions & {
    [P in Names as false extends Placeholders[P]["optional"] ? P : never]: BindParam<ResolvePlaceholderValue<Placeholders[P]>>;
} & {
    [P in Names as true extends Placeholders[P]["optional"] ? P : never]?: BindParam<ResolvePlaceholderValue<Placeholders[P]> | PathSkipValue>;
};
export type TrimSlash<T extends string | [Value]> = T extends string ? T extends `/${infer P}/` ? P : T extends `/${infer P}` | `${infer P}/` ? P : T : T;
export type ResolvePlaceholders<PlaceholderSyntax extends string | [Value], OriginPlaceholder extends {
    [P in string]: Placeholder;
} = {
    [P in Extract<PlaceholderSyntax, string>]: ParsePlaceholderSyntax<P>;
}, NormalizedPlaceholder extends {
    [P in keyof OriginPlaceholder as OriginPlaceholder[P]["name"]]: Placeholder;
} = {
    [P in keyof OriginPlaceholder as OriginPlaceholder[P]["name"]]: OriginPlaceholder[P];
}> = {
    [P in keyof OriginPlaceholder as NormalizedPlaceholder[OriginPlaceholder[P]["name"]] extends {
        type: OriginPlaceholder[P]["type"];
        optional: OriginPlaceholder[P]["optional"];
        isArray: OriginPlaceholder[P]["isArray"];
    } ? P : never]: OriginPlaceholder[P];
};
type ParsePlaceholderSyntax<Syntax extends string, Type = keyof TypeTable, IsArray extends boolean = false> = Syntax extends `${"scheme://authority/path"}${"?" | ""}` ? MakePlaceholder<"scheme://authority/path", "string", IsArray, Syntax> : Syntax extends `${"scheme://authority"}${"?" | ""}` ? MakePlaceholder<"scheme://authority", "string", IsArray, Syntax> : Syntax extends `${`scheme://host/path`}${"?" | ""}` ? MakePlaceholder<"scheme://host/path", "string", IsArray, Syntax> : Syntax extends `${`scheme://host`}${"?" | ""}` ? MakePlaceholder<"scheme://host", "string", IsArray, Syntax> : Syntax extends `${"scheme:"}${"?" | ""}` ? MakePlaceholder<"scheme:", "string", IsArray, Syntax> : Syntax extends `:port${"?" | ""}` ? MakePlaceholder<":port", "number", IsArray, Syntax> : Syntax extends `/${infer P}/` ? ParsePlaceholderSyntax<P> : Syntax extends `${infer P}/` ? ParsePlaceholderSyntax<P> : Syntax extends `/${infer P}` ? ParsePlaceholderSyntax<P> : Syntax extends `...${infer P}:${infer InferType}[]` ? ParsePlaceholderSyntax<P, InferType, true> : Syntax extends `...${infer P}` ? ParsePlaceholderSyntax<P, "string" | "number", true> : Syntax extends `${infer P}:${infer InferType}` ? ParsePlaceholderSyntax<P, InferType, IsArray> : Syntax extends `${infer P}?` ? MakePlaceholder<P, Type, IsArray, Syntax> : MakePlaceholder<Syntax, Type, IsArray>;
type MakePlaceholder<Name extends string, Type = keyof TypeTable, IsArray extends boolean = false, Syntax extends string = Name> = Placeholder<Name, Type extends keyof TypeTable ? TypeTable[Type] : never, Syntax extends `${string}?${string}` ? true : false, IsArray>;
export type TemplateWithHelper<T> = Template<T> & Helper<T>;
export type PlaceholderArg = string | [Value];
export type BindUrl<T extends PlaceholderArg> = TemplateWithHelper<BindParams<Extract<TrimSlash<T>, string>>>;
export type Template<T> = Partial<T> extends T ? (bindParams?: Readonly<T>) => string : (bindParams: Readonly<T>) => string;
type Helper<BaseParams> = {
    /**
     * テンプレートに渡せる引数の型を狭める
     *
     * - テンプレートのキーで指定されなかったものは自動継承されます
     * - テンプレートで任意のキーを必須にすることが可能です("?query"などの標準のオプションも対象になります)
     * - テンプレートの元の型を狭めることが可能です ex. string -> "A" | "B" or number -> 1 | 2
     *
     * @example 必須の"type"をリテラル型にし、"?query"を必須にする例
     *   // (bindParams: Readonly<{ type: "A" | "B"; size: number; "?query": { color: "yellow" | "lime", optionalColor?: string } }>) => string
     *   const bindUrl = urlFrom`https://example.com/types/${"type:string"}/?size=${"size:number"}`.narrowing<{
     *     type: "A" | "B";
     *     "?query": { color: "yellow" | "lime", optionalColor?: string }
     *   }>();
     *   bindUrl({ type: "A", size: 27, "?query": { color: "yellow" } }); // => https://example.com/types/A/?size=27&color=yellow
     *   bindUrl({ type: "B", size: 64, "?query": { color: "lime", optionalColor: "orange" } }); // => https://example.com/types/B/?size=64&color=lime&optionalColor=orange
     */
    narrowing: <OriginalParams extends {
        [P in keyof BaseParams as P extends keyof OriginalParams ? OriginalParams[P] extends BaseParams[P] ? never : P : never]: BaseParams[P];
    } & {
        [P in Exclude<keyof OriginalParams, keyof BaseParams>]: never;
    } = never>(...args: Partial<ConditionalExtends<OriginalParams, BaseParams>> extends ConditionalExtends<OriginalParams, BaseParams> ? [ConditionalExtends<OriginalParams, BaseParams>?] : [ConditionalExtends<OriginalParams, BaseParams>]) => string;
};
/**
 * オリジナル側で未指定のベースの定義を継承する
 */
type ConditionalExtends<OriginalParams, BaseParams> = [
    OriginalParams
] extends [never] ? BaseParams : {
    [P in keyof BaseParams as P extends keyof OriginalParams ? never : P]: BaseParams[P];
} & FlexibleFalsyForTupleArray<OriginalParams>;
/** Tがタプルであれば true を返す */
type IsTuple<T> = T extends {
    length: infer P;
} ? (number extends P ? false : true) : false;
/**
 * Tの内部に含まれるタプル配列を探し、{@see QueryTupleArray}と同様に、配列内のタプルが省略可能な場合、Falsyな値も使えるようにする。
 *
 * ```
 * FlexibleFalsyForTupleArray<[["foo", number], ["bar", number]?]>
 * // [["foo", number], (FalsyValue | ["bar", number])?]
 * ```
 *
 * これにより `[isFoo && ["foo", 1], isBar && ["bar", 2]]` のような簡潔な分岐が記述可能になる。
 */
type FlexibleFalsyForTupleArray<T> = T extends readonly unknown[] ? IsTuple<T> extends true ? FlexibleFalsyForTupleArrayRecursive<T> : T : T;
/** タプル配列のタプルを1つずつ走査して省略可能なものに FalsyValue を付与する */
type FlexibleFalsyForTupleArrayRecursive<Input extends readonly unknown[], Output extends readonly unknown[] = []> = Input["length"] extends 0 ? Output : Input extends [[string, unknown], ...infer Rest] ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, FlexibleFalsyForTuple<Input[0]>]> : Input extends [[string, unknown]?, ...infer Rest] ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, FlexibleFalsyForTuple<Input[0]>?]> : Input extends [infer Falsy, ...infer Rest] ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, Falsy]> : Input extends [(infer Falsy)?, ...infer Rest] ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, Falsy?]> : never;
/** 省略可能なタプルに FalsyValue を付与する */
type FlexibleFalsyForTuple<Tuple> = undefined extends Tuple ? Tuple | QueryTupleFalsyValue : Tuple;
export {};
