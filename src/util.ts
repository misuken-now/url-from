/** RFC3986準拠のエンコード */
export function encodeRFC3986(str: string) {
  return str && encodeURIComponent(str).replace(/[!'()*]/g, rfc3986SpecialEncoder);
}
const rfc3986SpecialEncodeTable = {
  "!": "%21",
  "'": "%27",
  "(": "%28",
  ")": "%29",
  "*": "%2A",
};
const rfc3986SpecialEncoder = (c: string): string =>
  rfc3986SpecialEncodeTable[c as keyof typeof rfc3986SpecialEncodeTable];
