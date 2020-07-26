import { createReadStream } from "fs";
import { resolve as pathResolve } from "path";
import { createInterface } from "readline";

/**
 * return a promise of list of sudoku, 9*9 1d-array
 */
export const loadSudokuList = (relativePath = "sudoku.txt") =>
  new Promise((resolve) => {
    const sudoKuList = [];
    let lineNumber = 0;
    const file = createInterface({
      input: createReadStream(pathResolve(__dirname, "..", relativePath)),
      output: process.stdout,
      terminal: false,
    });
    file.on("line", (line) => {
      const index = lineNumber % 10;
      if (index === 0) {
        sudoKuList.push([]);
      } else {
        sudoKuList[sudoKuList.length - 1].push(
          ...line.split("").map((d) => parseInt(d))
        );
      }
      lineNumber++;
    });
    file.on("close", () => resolve(sudoKuList));
  });

/**
 * Get sudoku string ready to print
 * @param {*} sudoku 9*9 1d-array
 * @returns string representation of sudoku
 */
export const formatSudoku = (sudoku) => {
  return Array.from(Array(3).keys())
    .map((R) => {
      return Array.from(Array(3).keys())
        .map((r) => {
          return Array.from(Array(3).keys())
            .map((c) => {
              const start = R * 27 + r * 9 + c * 3;
              return sudoku.slice(start, start + 3).join(" ");
            })
            .join("|");
        })
        .join("\n");
    })
    .join("\n-----------------\n");
};
