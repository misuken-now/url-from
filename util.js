"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeRFC3986 = encodeRFC3986;
/** RFC3986準拠のエンコード */
function encodeRFC3986(str) {
    return str && encodeURIComponent(str).replace(/[!'()*]/g, rfc3986SpecialEncoder);
}
const rfc3986SpecialEncodeTable = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "*": "%2A",
};
const rfc3986SpecialEncoder = (c) => rfc3986SpecialEncodeTable[c];
