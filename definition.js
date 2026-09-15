"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryDelete = void 0;
/** QueryString操作で使用する削除を表す識別子 */
exports.QueryDelete = Symbol("query delete keyword");
const r01 = { name: "foo", type: "xxx", optional: false, isArray: false }; // ✅
const r02 = { name: "foo", type: "xxx", optional: true, isArray: false }; // ✅
const r1 = { name: "foo", type: "xxx", optional: false, isArray: false }; // ✅
const r2 = { name: "foo", type: "xxx", optional: true, isArray: false }; // ✅
// @ts-expect-error
const r3 = { name: "foo", type: "xxx", optional: false, isArray: false }; // ❌ format error
const n1 = { name: "foo", type: 1, optional: false, isArray: false }; // ✅
const n2 = { name: "foo", type: 2, optional: true, isArray: false }; // ✅
// @ts-expect-error
const n3 = { name: "foo", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const pr01 = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error
const pr012 = { name: ":port", type: 1, optional: false, isArray: false }; // ✅
// @ts-expect-error
const pr02 = { name: ":port", type: "xxx", optional: true, isArray: false }; // ❌ value type error
const pr022 = { name: ":port", type: 1, optional: true, isArray: false }; // ✅
// @ts-expect-error
const pr1 = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error
// @ts-expect-error
const pr2 = { name: ":port", type: "xxx", optional: true, isArray: false }; // ❌ value type error
// @ts-expect-error
const pr3 = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const pn1 = { name: ":port", type: 1, optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const pn2 = { name: ":port", type: 2, optional: true, isArray: false }; // ❌ format error
// @ts-expect-error
const pn3 = { name: ":port", type: "xxx", optional: false, isArray: false }; // ❌ value type error
// @ts-expect-error
const prr01 = { name: "scheme:", type: 1, optional: false, isArray: false }; // ❌ value type error
const prr012 = { name: "scheme:", type: "1", optional: false, isArray: false }; // ✅
// @ts-expect-error
const prr02 = { name: "scheme:", type: 2, optional: true, isArray: false }; // ❌ value type error
const prr022 = { name: "scheme:", type: "2", optional: true, isArray: false }; // ✅
// @ts-expect-error
const prr1 = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const prr2 = { name: "scheme:", type: "xxx", optional: true, isArray: false }; // ❌ format error
// @ts-expect-error
const prr3 = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ format error
// @ts-expect-error
const prn1 = { name: "scheme:", type: 1, optional: false, isArray: false }; // ❌ value type error
// @ts-expect-error
const prn2 = { name: "scheme:", type: 2, optional: true, isArray: false }; // ❌ value type error
// @ts-expect-error
const prn3 = { name: "scheme:", type: "xxx", optional: false, isArray: false }; // ❌ value type error
