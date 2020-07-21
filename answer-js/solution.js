import { forEach, difference, keys, uniq, assign } from "lodash";

const UNSOLVABLE = { message: "The Sudoku cannot be solved" };
const RANGE = Array.from(Array(9).keys());
const DIGITS = RANGE.map((i) => i + 1);

/**
 * test if sudoku fulfills all constraints, i.e., a solution
 * @param {*} sudoku 9*9 1d array
 * @returns Promise of boolean
 */
const test = async (sudoku = []) => {
  for (let idx = 0; idx < 9; idx++) {
    if (
      uniq(RANGE.map((i) => sudoku[idx * 9 + i])).length !== 9 ||
      uniq(RANGE.map((i) => sudoku[idx + i * 9])).length !== 9 ||
      uniq(RANGE.map((i) => sudoku[idx + Math.floor(i / 3) * 9 + (i % 3)]))
        .length !== 9
    ) {
      return false;
    }
  }
  return true;
};

/**
 * try to reduce search space by constraint, will modify sudoku
 * @param {*} sudoku 9*9 1d array
 * @param {*} space search space
 */
const deduction = async (sudoku = [], space = {}) => {
  let deductionDone = false;
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
    deductionDone = true;
    forEach(space, (choices, idxKey) => {
      if (choices.length === 1) {
        deductionDone = false;
        sudoku[parseInt(idxKey)] = choices[0];
        delete space[idxKey];
      }
    });
  } while (!deductionDone);
};

/**
 * recursively search for solution in the search space
 * @param {*} sudoku 9*9 1d array
 * @param {*} space search space
 * @returns Solved sudoku or throws error
 */
const search = async (sudoku = [], space = {}) => {
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
    delete space[selectedIdx];
    for (let i = 0; i < choices.length; i++) {
      try {
        const sudokuCopy = [...sudoku];
        const spaceCopy = assign({}, space);
        sudokuCopy[parseInt(selectedIdx)] = choices[i];
        await deduction(sudokuCopy, spaceCopy);
        return await search(sudokuCopy, spaceCopy);
      } catch (error) {
        continue;
      }
    }
    throw UNSOLVABLE;
  } else if (test(sudoku)) {
    return sudoku;
  } else {
    throw UNSOLVABLE;
  }
};

/**
 * solve sudoku asynchronously and replace all the 0s
 * @param {*} sudoku 9*9
 * @returns Solved sudoku or throws error
 */
export const toSolution = async (sudoku = []) => {
  const sudokuCopy = [...sudoku];
  const searchSpace = {};
  await deduction(sudokuCopy, searchSpace);
  return await search(sudokuCopy, searchSpace);
};
