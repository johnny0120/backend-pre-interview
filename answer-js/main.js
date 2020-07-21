import { map, sumBy, includes, forEach } from "lodash";
import { loadSudokuList, formatSudoku } from "./utils";
import { solveSudoku } from "./solution";
import minimist from "minimist";

const args = minimist(process.argv.slice(2));

if (args["help"] || args["h"]) {
  console.log("Additional options:");
  console.log("-g \t run the program with selected grid-id; -g=1,2,3");
  console.log("-s \t show solution in the end;");
  console.log("-t \t show search steps;");
  console.log("-c \t show deduction steps;");
  process.exit(0);
}

loadSudokuList()
  .then((sudokuList) =>
    map(sudokuList, (s, i) =>
      !args["g"] || i + 1 === args["g"] || includes(args["g"], i + 1) ? s : null
    )
  )
  .then((sudokuList) => Promise.all(map(sudokuList, solveSudoku)))
  .then((sudokuSolutionList) => {
    if (args["s"]) {
      forEach(
        sudokuSolutionList,
        (s, i) => s && console.log(`Solution ${i + 1}:\n${formatSudoku(s)}\n`)
      );
    }
    const result = sumBy(sudokuSolutionList, (s) =>
      !s ? 0 : s[0] * 100 + s[1] * 10 + s[2]
    );
    // should output 24702 for all 50 grids
    console.log(result);
  });
