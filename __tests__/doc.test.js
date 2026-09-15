"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tester_1 = require("@power-doctest/tester");
const markdown_1 = require("@power-doctest/markdown");
const __1 = __importStar(require("../"));
const globby = require("globby");
const fs = require("fs");
const path = require("path");
const transform = (code) => {
    console.warn = () => { };
    return `
${code.replace(/^import .+/g, "")}
`; // you need pre transform for the code if needed.
};
// doctest for source/**/*.md
describe("doctest:md", function () {
    const sourceDir = path.join(__dirname, "../..", "src");
    const files = globby.sync([
        `${path.join(__dirname, "../..")}/README.md`,
        `${sourceDir}/**/*.md`,
        `!${sourceDir}/**/node_modules{,/**}`,
    ]);
    files.forEach((filePath) => {
        const normalizeFilePath = filePath.replace(sourceDir, "");
        describe(`${normalizeFilePath}`, function () {
            const content = fs.readFileSync(filePath, "utf-8");
            const parsedCodes = (0, markdown_1.parse)({
                filePath,
                content,
            });
            // try to eval
            const dirName = path.dirname(filePath).split(path.sep).pop();
            parsedCodes.forEach((parsedCode) => {
                const codeValue = parsedCode.code;
                const testCaseName = codeValue.slice(0, 32).replace(/[\r\n]/g, "_");
                it(dirName + ": " + testCaseName, function () {
                    return (0, tester_1.test)(Object.assign(Object.assign({}, parsedCode), { code: transform(parsedCode.code) }), {
                        disableRunning: false,
                        defaultDoctestRunnerOptions: {
                            // Default timeout: 2sec
                            timeout: 1000 * 2,
                            context: { urlFrom: __1.default, encodeRFC3986: __1.encodeRFC3986, stringifyQuery: __1.stringifyQuery, replaceQuery: __1.replaceQuery, QueryDelete: __1.QueryDelete },
                        },
                    }).catch((error) => {
                        const filePathLineColumn = `${error.fileName}:${error.lineNumber}:${error.columnNumber}`;
                        console.error(`Markdown Doctest is failed
  at ${filePathLineColumn}

----------
${codeValue}
----------
`);
                        return Promise.reject(error);
                    });
                });
            });
        });
    });
});
