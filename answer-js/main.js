import { map, sumBy } from "lodash";
import { loadSudokuList, toSudokuText } from "./utils";
import { toSolution } from "./solution";

loadSudokuList()
  .then((sudokuList) =>
    Promise.all(map(sudokuList, (sudoku) => toSolution(sudoku)))
  )
  .then((sudokuSolutionList) => {
    console.log(`Grid 01 solution:\n${toSudokuText(sudokuSolutionList[0])}`);
    const result = sumBy(
      sudokuSolutionList,
      (s) => s[0] * 100 + s[1] * 10 + s[2]
    );
    // should output 23827
    console.log(result);
  });
