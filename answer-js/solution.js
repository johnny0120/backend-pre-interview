import {
  forEach,
  difference,
  keys,
  uniq,
  includes,
  assign,
  join,
  isArray,
} from "lodash";
import minimist from "minimist";
import { formatSudoku } from "./utils";

const args = minimist(process.argv.slice(2));

const UNSOLVABLE = new Error("The Sudoku cannot be solved");
const RANGE = Array.from(Array(9).keys());
const DIGITS = RANGE.map((i) => i + 1);

/**
 * test if sudoku fulfills all constraints, i.e., a solution
 * @param {*} sudoku 9*9 1d array
 * @returns boolean
 */
const checkSudoku = (sudoku = []) => {
  for (let idx = 0; idx < 9; idx++) {
    const grd = Math.floor(idx / 3) * 27 + (idx % 3) * 3;
    if (
      uniq(RANGE.map((i) => sudoku[idx * 9 + i])).length !== 9 ||
      uniq(RANGE.map((i) => sudoku[idx + i * 9])).length !== 9 ||
      uniq(RANGE.map((i) => sudoku[grd + Math.floor(i / 3) * 9 + (i % 3)]))
        .length !== 9
    ) {
      return false;
    }
  }
  return !includes(sudoku, 0);
};

/**
 * try to reduce search space by constraint, will modify sudoku
 * @param {*} sudoku 9*9 1d array
 * @param {*} space search space
 */
const updateSudokuAndSpace = async (sudoku = [], space = {}) => {
  let updateSudokuAndSpaceDone = false;
  if (args["c"]) {
    console.log(
      `<<< load space:\n${JSON.stringify(
        space,
        (k, v) => (isArray(v) ? join(v, ",") : v),
        4
      )}`
    );
  }
  do {
    forEach(sudoku, (digit, idx) => {
      if (digit === 0) {
        const col = idx % 9;
        const row = Math.floor(idx / 9);
        const grd = Math.floor(row / 3) * 27 + Math.floor(col / 3) * 3;
        space[`${idx}`] = difference(
          space[`${idx}`] || DIGITS,
          RANGE.map((i) => sudoku[row * 9 + i]),
          RANGE.map((i) => sudoku[col + i * 9]),
          RANGE.map((i) => sudoku[grd + Math.floor(i / 3) * 9 + (i % 3)])
        );
        if (space[`${idx}`].length === 0) {
          throw UNSOLVABLE;
        }
      }
    });
    updateSudokuAndSpaceDone = true;
    forEach(space, (choices, idxKey) => {
      if (choices.length === 1) {
        updateSudokuAndSpaceDone = false;
        sudoku[parseInt(idxKey)] = choices[0];
        delete space[idxKey];
      }
    });
    if (args["c"]) {
      console.log(
        `<<< update search space:\n${JSON.stringify(
          space,
          (k, v) => (isArray(v) ? join(v, ",") : v),
          4
        )}`
      );
    }
  } while (!updateSudokuAndSpaceDone);
};

/**
 * recursively search for solution in the search space
 * @param {*} sudoku 9*9 1d array
 * @param {*} space search space
 * @returns Solved sudoku or throws error
 */
const solveSudokuBySpace = async (sudoku = [], space = {}) => {
  if (keys(space).length !== 0) {
    let selectedIdx = "";
    let minimalChoicesLength = Infinity;
    forEach(space, (choices, idxKey) => {
      if (choices.length < minimalChoicesLength) {
        minimalChoicesLength = choices.length;
        selectedIdx = idxKey;
      }
    });
    const choices = space[selectedIdx];
    const spaceOrigin = assign({}, space);
    delete spaceOrigin[selectedIdx];
    if (args["t"]) {
      console.log(`index=${selectedIdx}, choices=[ ${join(choices, ", ")} ]`);
    }
    for (let i = 0; i < choices.length; i++) {
      try {
        if (args["t"]) {
          console.log(`index=${selectedIdx}, try=[ ${choices[i]} ]`);
        }
        const sudokuCopy = [...sudoku];
        const spaceCopy = assign({}, spaceOrigin);
        sudokuCopy[parseInt(selectedIdx)] = choices[i];
        await updateSudokuAndSpace(sudokuCopy, spaceCopy);
        return await solveSudokuBySpace(sudokuCopy, spaceCopy);
      } catch (error) {
        if (args["t"]) {
          console.error(`index=${selectedIdx}, error=[ ${choices[i]} ]`);
        }
        continue;
      }
    }
    throw UNSOLVABLE;
  } else if (checkSudoku(sudoku)) {
    if (args["t"]) {
      console.log(`<<< finish searching with:\n${formatSudoku(sudoku)}\n`);
    }
    return sudoku;
  } else {
    throw UNSOLVABLE;
  }
};

/**
 * solve sudoku asynchronously and replace all the 0s
 * @param {*} sudoku 9*9
 * @returns Solved sudoku or throws UNSOLVABLE error
 */
export const solveSudoku = async (sudoku) => {
  if (!sudoku) {
    return sudoku;
  }
  const sudokuCopy = [...sudoku];
  const searchSpace = {};
  await updateSudokuAndSpace(sudokuCopy, searchSpace);
  if (args["t"]) {
    console.log(`>>> start searching from:\n${formatSudoku(sudokuCopy)}\n`);
  }
  return await solveSudokuBySpace(sudokuCopy, searchSpace);
};
