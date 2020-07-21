import { forEach, difference, keys, uniq, includes, assign } from "lodash";

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
    for (let i = 0; i < choices.length; i++) {
      try {
        const sudokuCopy = [...sudoku];
        const spaceCopy = assign({}, spaceOrigin);
        sudokuCopy[parseInt(selectedIdx)] = choices[i];
        await updateSudokuAndSpace(sudokuCopy, spaceCopy);
        return await solveSudokuBySpace(sudokuCopy, spaceCopy);
      } catch (error) {
        continue;
      }
    }
    throw UNSOLVABLE;
  } else if (checkSudoku(sudoku)) {
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
export const solveSudoku = async (sudoku = []) => {
  const sudokuCopy = [...sudoku];
  const searchSpace = {};
  await updateSudokuAndSpace(sudokuCopy, searchSpace);
  return await solveSudokuBySpace(sudokuCopy, searchSpace);
};
