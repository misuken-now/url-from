/** プレースホルダで特別な意味を持つ文字 */
export type PlaceholderSpecialCharacter = "#" | "." | "/" | ":" | "?" | "@";
/** プレースホルダで特別な文字を含む文字列 */
export type PlaceholderSpecialCharacterContain = `${string}${PlaceholderSpecialCharacter}${string}`;
/** プレースホルダ名に使用できない文字列 */
export type InvalidPlaceholderName = "" | PlaceholderSpecialCharacterContain;

/** QueryString操作で使用する削除を表す識別子 */
export const QueryDelete = Symbol("query delete keyword");
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
export type QueryParams =
  | Readonly<Record<string, QueryValue | readonly QueryValue[]>>
  | QueryTupleArray
  | URLSearchParams
  | string;

/** プレースホルダに結びつける際のパラメータ */
export type BindParam<T> = T | BindObjectParam<T>;

/** プレースホルダに結びつける際のオブジェクト形式のパラメータ */
export type BindObjectParam<T> = { value: T; separator?: string };

/** ユーザー情報のオプション */
export type UserinfoOptions = { user?: string; password?: string };

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
  //"scheme://host/path?"?: string;
  "scheme://authority/path"?: string;
  //"scheme://authority/path?"?: string;
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
type Placeholder<
  Name extends string = string,
  Type extends PathValue = PathValue,
  Optional extends boolean = boolean,
  IsArray extends boolean = boolean
> = {
  name: Name;
  type: Type;
  optional: Optional;
  isArray: IsArray;
};

/** プレースホルダ名ごとに対応している型を解決する */
type ResolvePlaceholderValue<T extends Placeholder> = T["isArray"] extends true
  ? // number[] になる場合、文字列は拒否するため "" を除外
    readonly (T["type"] extends number ? T["type"] | Exclude<PathSkipValue, ""> : T["type"] | PathSkipValue)[]
  : T["name"] extends "scheme://authority" | "scheme://host" | "scheme://authority/path" | "scheme://host/path"
  ? string
  : T["name"] extends "subdomain."
  ? readonly (T["type"] | PathSkipValue)[]
  : T["name"] extends "userinfo@"
  ? Readonly<UserinfoOptions>
  : T["name"] extends "scheme:"
  ? string
  : T["name"] extends ":port"
  ? number
  : T["name"] extends keyof NativePlaceholderValueTable
  ? never
  : T["type"];

/** プレースホルダの構文として正しいものを抽出する */
export type ExtractValidPlaceholderSyntax<Item extends string | [Value], AvailableItem extends string> =
  // union distribution
  Item extends [Value]
    ? Item
    : // string型である(StringLiteral型ではない)かの確認
    string extends Item
    ? // string型は拒否
      never
    : // 予約されたキーは許可
    Item extends keyof NativePlaceholderValueTable
    ? Item
    : // 条件付きスラッシュ
    Item extends `/${string}/` | `/${string}` | `${string}/`
    ? // 予約されたキーとの併用 or 連続するスラッシュは不可
      Item extends `${"/" | ""}${keyof NativePlaceholderValueTable}${"/" | ""}` | `//${string}` | `${string}//`
      ? never
      : Item extends `/${infer P}/`
      ? `/${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}/`
      : Item extends `${infer P}/`
      ? `${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}/`
      : Item extends `/${infer P}`
      ? `/${ExtractValidPlaceholderSyntax<P, TrimSlash<AvailableItem>>}`
      : never
    : // 利用可能な項目であるか(同名型違いで利用不可な項目の場合はAvailableItemに含まれなくなる)
    Item extends AvailableItem
    ? // 正規化されたプレースホルダ名と型名の検証(スプレッドの場合)
      Item extends `...${infer Name}${"?" | ""}${`:${infer Type}` | ""}`
      ? // Typeがstringのときは型指定が無かったことを意味する
        string extends Type
        ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, string>
        : // スプレッドで型指定時は"[]"が付いていること
        Type extends `${infer Type2}[]`
        ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, Type2>
        : never
      : // 正規化されたプレースホルダ名と型名の検証
      Item extends `${infer Name}${"?" | ""}${`:${infer Type}` | ""}`
      ? ExtractValidPlaceholderSpec<Item, AvailableItem, Name, Type>
      : never
    : never;

type ExtractValidPlaceholderSpec<Item extends string, AvailableItem, Name, Type> =
  // 許可されないプレースホルダ名なら拒否
  Name extends InvalidPlaceholderName
    ? never
    : // Typeがstringのときは型指定が無かったことを意味する
    string extends Type
    ? Item
    : //TypeがLiteral型の場合、型が規定されているものに一致するか
    Type extends keyof TypeTable
    ? Item
    : never;

export type BindParams<
  // 入力された元プレースホルダ
  // "foo" | "foo:number" | "...bar?:number[]"
  PlaceholderSyntax extends string,
  // {
  //   foo: { name: "foo"; type: string | number; optional: false, isArray: false }
  //      | { name: "foo"; type: number; optional: false, isArray: false };
  //   bar: { name: "bar"; type: number; optional: true, isArray: true };
  // }
  Placeholders extends { [P in string]: Placeholder } = {
    [P in PlaceholderSyntax as ParsePlaceholderSyntax<P>["name"]]: ParsePlaceholderSyntax<P>;
  },
  // 引数のキーに追加される文字列
  // "foo" | "bar"
  Names extends string = ParsePlaceholderSyntax<PlaceholderSyntax>["name"]
> = BindOptions & {
  [P in Names as false extends Placeholders[P]["optional"] ? P : never]: BindParam<
    ResolvePlaceholderValue<Placeholders[P]>
  >;
} & {
  [P in Names as true extends Placeholders[P]["optional"] ? P : never]?: BindParam<
    ResolvePlaceholderValue<Placeholders[P]> | PathSkipValue
  >;
};

export type TrimSlash<T extends string | [Value]> = T extends string
  ? T extends `/${infer P}/`
    ? P
    : T extends `/${infer P}` | `${infer P}/`
    ? P
    : T
  : T;

export type ResolvePlaceholders<
  // 入力された元プレースホルダ
  // "foo:string" | "foo:number" | "...bar?:number[]"
  PlaceholderSyntax extends string | [Value],
  // パースした元プレースホルダ情報
  // {
  //   foo:string: { name: "foo"; type: string; optional: false, isArray: false }
  //   "foo:number": { name: "foo"; type: number; optional: false, isArray: false }
  //   "...bar?:number[]": { name: "bar"; type: number; optional: true, isArray: true }
  // }
  OriginPlaceholder extends { [P in string]: Placeholder } = {
    [P in Extract<PlaceholderSyntax, string>]: ParsePlaceholderSyntax<P>;
  },
  // 正規化したnameでマージしたプレースホルダ情報
  // {
  //   foo: { name: "foo", type: string | number; optional: false, isArray: false }
  //   bar: { name: "bar", type: number; optional: true, isArray: true }
  // }
  NormalizedPlaceholder extends {
    [P in keyof OriginPlaceholder as OriginPlaceholder[P]["name"]]: Placeholder;
  } = {
    [P in keyof OriginPlaceholder as OriginPlaceholder[P]["name"]]: OriginPlaceholder[P];
  }
> = {
  // 正規化したnameでマージしたtypeとoptionalとisArrayで元のものに代入できるなら、同名で2つ以上のプレースホルダが指定されていても整合性が取れている。
  // 条件を満たせない場合は never でキーを削除することで、有効なプレースホルダのみが残る。
  // 以下の例の場合は型の整合性が取れていない状態。
  // 正規化したnameでマージした { name: "foo", type: string | number; optional: false, isArray: false } 型の値は、
  // マージ前の両方またはいずれかの型の値に代入できない { type: string; optional: false, isArray: false } | { type: number; optional: false, isArray: false } ため、
  // 整合性が取れていないものとして拒否する。
  [P in keyof OriginPlaceholder as NormalizedPlaceholder[OriginPlaceholder[P]["name"]] extends {
    type: OriginPlaceholder[P]["type"];
    optional: OriginPlaceholder[P]["optional"];
    isArray: OriginPlaceholder[P]["isArray"];
  }
    ? P
    : never]: OriginPlaceholder[P];
};

// 簡易的な型のテストコード
type PP<Name extends string> = ParsePlaceholderSyntax<Name>;
const r01: PP<"foo"> = { name: "foo", type: "xxx", optional: false, isArray: false }; // ✅
const r02: PP<"foo?"> = { name: "foo", type: "xxx", optional: true, isArray: false }; // ✅
const r1: PP<"foo:string"> = { name: "foo", type: "xxx", optional: false, isArray: false }; // ✅
const r2: PP<"foo?:string"> = { name: "foo", type: "xxx", optional: true, isArray: false }; // ✅
// @ts-expect-error
const r3: PP<"foo:string?"> = { name: "foo", type: "xxx", optional: false, isArray: false }; // ❌ format error
const n1: PP<"foo:number"> = { name: "foo", type: 1, optional: false, isArray: false }; // ✅
const n2: PP<"foo?:number"> = { name: "foo", type: 2, optional: true, isArray: false }; // ✅
// @ts-expect-error
const n3: PP<"foo:number?"> = { name: "foo", type: "xxx", optional: false, isArray: false }; // ❌ format error

// @ts-expect-error
const pr01: PP<":port"> = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error
const pr012: PP<":port"> = { name: ":port", type: 1, optional: false, isArray: false }; // ✅
// @ts-expect-error
const pr02: PP<":port?"> = { name: ":port", type: "xxx", optional: true, isArray: false }; // ❌ value type error
const pr022: PP<":port?"> = { name: ":port", type: 1, optional: true, isArray: false }; // ✅
// @ts-expect-error
const pr1: PP<":port:string"> = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error
// @ts-expect-error
const pr2: PP<":port?:string"> = { name: ":port", type: "xxx", optional: true, isArray: false }; // ❌ value type error
// @ts-expect-error
const pr3: PP<":port:string?"> = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const pn1: PP<":port:number"> = { name: ":port", type: 1, optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const pn2: PP<":port?:number"> = { name: ":port", type: 2, optional: true, isArray: false }; // ❌ format error
// @ts-expect-error
const pn3: PP<":port:number?"> = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error

// @ts-expect-error
const prr01: PP<"scheme:"> = { name: "scheme:", type: 1, optional: false, isArray: false }; // ❌ value type error
const prr012: PP<"scheme:"> = { name: "scheme:", type: "1", optional: false, isArray: false }; // ✅
// @ts-expect-error
const prr02: PP<"scheme:?"> = { name: "scheme:", type: 2, optional: true, isArray: false }; // ❌ value type error
const prr022: PP<"scheme:?"> = { name: "scheme:", type: "2", optional: true, isArray: false }; // ✅
// @ts-expect-error
const prr1: PP<"scheme::string"> = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const prr2: PP<"scheme:?:string"> = { name: "scheme:", type: "xxx", optional: true, isArray: false }; // ❌ format error
// @ts-expect-error
const prr3: PP<"scheme::string?"> = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const prn1: PP<"scheme::number"> = { name: "scheme:", type: 1, optional: false, isArray: false }; // ❌ value type error
// @ts-expect-error
const prn2: PP<"scheme:?:number"> = { name: "scheme:", type: 2, optional: true, isArray: false }; // ❌ value type error
// @ts-expect-error
const prn3: PP<"scheme::number?"> = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ value type error

// "https://example.com/path/to"
// "/path/to"

// "https://example.com/path/to"
// "/to"

type ParsePlaceholderSyntax<Syntax extends string, Type = keyof TypeTable, IsArray extends boolean = false> =
  // "scheme://authority/path"の型
  // "scheme://authority/path" ->  { name: "scheme://authority/path"; type: string; optional: false, isArray: false }
  // "scheme://authority/path?" ->  { name: "scheme://authority/path"; type: string; optional: true, isArray: false }
  Syntax extends `${"scheme://authority/path"}${"?" | ""}`
    ? MakePlaceholder<"scheme://authority/path", "string", IsArray, Syntax>
    : // "scheme://authority/"の型
    // "scheme://authority/" ->  { name: "scheme://authority/"; type: string; optional: false, isArray: false }
    // "scheme://authority/?" ->  { name: "scheme://authority/"; type: string; optional: true, isArray: false }
    Syntax extends `${"scheme://authority"}${"?" | ""}`
    ? MakePlaceholder<"scheme://authority", "string", IsArray, Syntax>
    : // "scheme://host/path"の型
    // "scheme://host/path" ->  { name: "scheme://host/path"; type: string; optional: false, isArray: false }
    // "scheme://host/path?" ->  { name: "scheme://host/path"; type: string; optional: true, isArray: false }
    Syntax extends `${`scheme://host/path`}${"?" | ""}`
    ? MakePlaceholder<"scheme://host/path", "string", IsArray, Syntax>
    : // "scheme://host/"の型
    // "scheme://host/" ->  { name: "scheme://host/"; type: string; optional: false, isArray: false }
    // "scheme://host/?" ->  { name: "scheme://host/"; type: string; optional: true, isArray: false }
    Syntax extends `${`scheme://host`}${"?" | ""}`
    ? MakePlaceholder<"scheme://host", "string", IsArray, Syntax>
    : // "scheme:"の型
    // "scheme:" ->  { name: "scheme:"; type: string; optional: false, isArray: false }
    // "scheme:?" ->  { name: "scheme:"; type: string; optional: true, isArray: false }
    Syntax extends `${"scheme:"}${"?" | ""}`
    ? MakePlaceholder<"scheme:", "string", IsArray, Syntax>
    : // ":port"の型
    // ":port" ->  { name: ":port"; type: number; optional: false, isArray: false }
    // ":port?" ->  { name: ":port"; type: number; optional: true, isArray: false }
    Syntax extends `:port${"?" | ""}`
    ? MakePlaceholder<":port", "number", IsArray, Syntax>
    : Syntax extends `/${infer P}/`
    ? ParsePlaceholderSyntax<P>
    : Syntax extends `${infer P}/`
    ? ParsePlaceholderSyntax<P>
    : Syntax extends `/${infer P}`
    ? ParsePlaceholderSyntax<P>
    : // 1. スプレッドと型の指定があるもの -> 再度ParsePlaceholderSyntaxを呼んで4へ
    // ...foo:number[]" ->  ParsePlaceholderSyntax<"foo", "number", true>
    // ...foo?:number[]" ->  ParsePlaceholderSyntax<"foo?", "number", true>
    Syntax extends `...${infer P}:${infer InferType}[]`
    ? ParsePlaceholderSyntax<P, InferType, true>
    : // 2. スプレッドの指定があるもの -> 再度ParsePlaceholderSyntaxを呼んで4へ
    // ...foo" ->  ParsePlaceholderSyntax<"foo", "string" | "number", true>
    // ...foo?" ->  ParsePlaceholderSyntax<"foo?", "string" | "number", true>
    Syntax extends `...${infer P}`
    ? ParsePlaceholderSyntax<P, "string" | "number", true>
    : // 3. 型の指定があるもの -> 再度ParsePlaceholderSyntaxを呼んで4へ
    // foo:number" ->  ParsePlaceholderSyntax<"foo", "number", IsArray>
    // foo?:number" ->  ParsePlaceholder<"foo?", "number", IsArray>
    Syntax extends `${infer P}:${infer InferType}`
    ? ParsePlaceholderSyntax<P, InferType, IsArray>
    : // 4. 名前部分からオプショナル判定
    // "foo" -> { name: "foo"; type: Type; optional: false, isArray: IsArray }
    // "foo?" -> { name: "foo"; type: Type; optional: true, isArray: IsArray }
    Syntax extends `${infer P}?`
    ? MakePlaceholder<P, Type, IsArray, Syntax>
    : MakePlaceholder<Syntax, Type, IsArray>;

type MakePlaceholder<
  Name extends string,
  Type = keyof TypeTable,
  IsArray extends boolean = false,
  Syntax extends string = Name
> = Placeholder<
  Name,
  Type extends keyof TypeTable ? TypeTable[Type] : never,
  Syntax extends `${string}?${string}` ? true : false,
  IsArray
>;

export type TemplateWithHelper<T> = Template<T> & Helper<T>;

export type PlaceholderArg = string | [Value];
export type BindUrl<T extends PlaceholderArg> = TemplateWithHelper<BindParams<Extract<TrimSlash<T>, string>>>;

// 引数が必要ない(全て省略可能な)場合は引数無しで呼び出せるようにする
export type Template<T> = Partial<T> extends T
  ? (bindParams?: Readonly<T>) => string
  : (bindParams: Readonly<T>) => string;

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
  narrowing: <
    // オリジナルがベースより狭い型のみを受け入れる
    OriginalParams extends
      | {
          // ベースのOptionalを結果に反映した型にするため、`P in keyof BaseParams` でMapped Typesを作る
          [P in keyof BaseParams as P extends keyof OriginalParams
            ? // オリジナルの型をベースの型に代入できる場合、オリジナルの型が狭いので指定は有効。
              // 代入できない場合、オリジナルの型がベースの型より広いのでエラーにするためにキーを残してextendsを失敗させる。
              OriginalParams[P] extends BaseParams[P]
              ? never
              : P
            : never]: BaseParams[P];
        } & {
          // BaseParamsに存在しないキーは指定させてはいけないので、never型にしてextendsを失敗させる
          [P in Exclude<keyof OriginalParams, keyof BaseParams>]: never;
        } = never
  >(
    ...args: Partial<ConditionalExtends<OriginalParams, BaseParams>> extends ConditionalExtends<
      OriginalParams,
      BaseParams
    >
      ? [ConditionalExtends<OriginalParams, BaseParams>?]
      : [ConditionalExtends<OriginalParams, BaseParams>]
  ) => string;
};

/**
 * オリジナル側で未指定のベースの定義を継承する
 */
type ConditionalExtends<OriginalParams, BaseParams> =
  // オリジナルが渡されていない場合はベースをそのまま使用する
  [OriginalParams] extends [never]
    ? BaseParams
    : {
        // ベースのキーの中で残すのは、オリジナルに存在しないものだけ
        [P in keyof BaseParams as P extends keyof OriginalParams ? never : P]: BaseParams[P];
      } & FlexibleFalsyForTupleArray<OriginalParams>;

/** Tがタプルであれば true を返す */
type IsTuple<T> = T extends { length: infer P } ? (number extends P ? false : true) : false;
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
type FlexibleFalsyForTupleArray<T> = T extends readonly unknown[]
  ? IsTuple<T> extends true
    ? FlexibleFalsyForTupleArrayRecursive<T>
    : T
  : T;

/** タプル配列のタプルを1つずつ走査して省略可能なものに FalsyValue を付与する */
type FlexibleFalsyForTupleArrayRecursive<Input extends readonly unknown[], Output extends readonly unknown[] = []> =
  // 入力の長さが0になったら終わり
  Input["length"] extends 0
    ? Output
    : // 必須のタプル
    Input extends [[string, unknown], ...infer Rest]
    ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, FlexibleFalsyForTuple<Input[0]>]>
    : // オプショナルのタプル
    Input extends [[string, unknown]?, ...infer Rest]
    ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, FlexibleFalsyForTuple<Input[0]>?]>
    : // タプルが省かれてfalsyな場合(ここは無くしてもいいかもしれない)
    Input extends [infer Falsy, ...infer Rest]
    ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, Falsy]>
    : Input extends [(infer Falsy)?, ...infer Rest]
    ? FlexibleFalsyForTupleArrayRecursive<Rest, [...Output, Falsy?]>
    : never;
/** 省略可能なタプルに FalsyValue を付与する */
type FlexibleFalsyForTuple<Tuple> = undefined extends Tuple ? Tuple | QueryTupleFalsyValue : Tuple;
