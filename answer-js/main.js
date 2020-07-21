import { map, sumBy } from "lodash";
import { loadSudokuList } from "./utils";
import { solveSudoku } from "./solution";

loadSudokuList()
  .then((sudokuList) =>
    Promise.all(map(sudokuList, (sudoku) => solveSudoku(sudoku)))
  )
  .then((sudokuSolutionList) => {
    const result = sumBy(
      sudokuSolutionList,
      (s) => s[0] * 100 + s[1] * 10 + s[2]
    );
    // should output 24702
    console.log(result);
  });
