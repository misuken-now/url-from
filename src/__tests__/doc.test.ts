import { test } from "@power-doctest/tester";
import { parse } from "@power-doctest/markdown";
import urlFrom, { encodeRFC3986, stringifyQuery, replaceQuery, QueryDelete } from "../";
const globby = require("globby");
const fs = require("fs");
const path = require("path");

const transform = (code: string) => {
  console.warn = () => {};
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
  files.forEach((filePath: string) => {
    const normalizeFilePath = filePath.replace(sourceDir, "");
    describe(`${normalizeFilePath}`, function () {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsedCodes = parse({
        filePath,
        content,
      });
      // try to eval
      const dirName = path.dirname(filePath).split(path.sep).pop();
      parsedCodes.forEach((parsedCode: any) => {
        const codeValue = parsedCode.code;
        const testCaseName = codeValue.slice(0, 32).replace(/[\r\n]/g, "_");
        it(dirName + ": " + testCaseName, function () {
          return test(
            {
              ...parsedCode,
              code: transform(parsedCode.code),
            },
            {
              disableRunning: false,
              defaultDoctestRunnerOptions: {
                // Default timeout: 2sec
                timeout: 1000 * 2,
                context: { urlFrom, encodeRFC3986, stringifyQuery, replaceQuery, QueryDelete },
              },
            }
          ).catch((error: any) => {
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
