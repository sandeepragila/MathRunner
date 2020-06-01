import {Injectable} from '@angular/core';
import {LevelInfo} from '../GameConstants';

@Injectable()
export class LevelGeneratorService {
  static MAX_BLOCK_VALUE = 5;
  static LEFT = 1;
  static TOP = 2;
  static DIAGONAL = 3;
  constructor() {
  }

  public getNextLevel(difficulty: GameDifficulty): LevelInfo {
    const min = this.getMinRows(difficulty);
    const max = difficulty;
    const rowSize = this.getRandomInt(min, max, 1);
    const colSize = this.getRandomInt(min, max, 1);

    return this.getLevel(rowSize, colSize);
  }

  public getLevel(rowSize: number, colSize: number): LevelInfo {
    const maxAllowedResult = this.getRandomInt(0, (Math.max(rowSize, colSize) * 10), 30);
    const grid: Block[][] = [];

    for (let i = 0; i < rowSize; i++) {
      grid[i] = [];
      for (let j = 0; j < colSize; j++) {
        const blockVal = this.getMaxRandomInt(LevelGeneratorService.MAX_BLOCK_VALUE);
        grid[i].push(new Block(blockVal));
      }
    }

    this.findMinPathToPrincess(grid, maxAllowedResult);
    const princessBlock = grid[rowSize - 1][colSize - 1];
    const levelInfo = new LevelInfo(this.getAsFlatArray(grid), colSize, princessBlock.val, princessBlock.pathLen, 60);
    return levelInfo;
  }

  private getAsFlatArray(grid: Block[][]) {
    const resultArr = [];
    grid.forEach(row => {
      row.forEach(block => {
        resultArr.push(block.val);
      })
    });
    return resultArr;
  }

  /**
   * Heuristic algorithm that tries to find a solution by assuming maxAllowedResult as threshold
   * in finding the quickest route.
   *
   * @param grid - input grid to parse
   * @param maxAllowedResult - threshold for the end result
   */
  private findMinPathToPrincess(grid: Block[][], maxAllowedResult: number) {
    const rows = grid.length;
    const cols = grid[0].length;
    grid[0][0].pathWeight = grid[0][0].val;
    grid[0][0].pathLen = 1;
    // init the top row (walk first row)
    for (let i = 1; i < rows; i++) {
      grid[i][0].pathWeight = grid[i - 1][0].pathWeight + grid[i][0].val;
      grid[i][0].pathLen = grid[i - 1][0].pathLen + 1;
    }
    // init the first col (walk first col)
    for (let i = 1; i < cols; i++) {
      grid[0][i].pathWeight = grid[0][i - 1].pathWeight + grid[0][i].val;
      grid[0][i].pathLen = grid[0][i - 1].pathLen + 1;
    }
    // go over the rest of the grid and find the min path
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        if (i === rows - 1 && j === cols - 1) {
          this.pickRandomResult(i, j, grid);
        } else {
          this.setValidMaxBlock(i, j, grid, maxAllowedResult);
        }
      }
    }
  }

  private pickRandomResult(row, col, grid) {
    const randomSolution: number = this.getMaxRandomInt(4);
    const princessBlock: Block = grid[row][col];
    const leftBlock = grid[row][col - 1];
    const topBlock = grid[row - 1][col];
    const diagonalBlock = grid[row - 1][col - 1];

    let chosenBlock: Block;
    if (randomSolution === LevelGeneratorService.LEFT) {
      chosenBlock = this.pickShortestIfSame(leftBlock, topBlock, diagonalBlock);
    } else if (randomSolution === LevelGeneratorService.TOP) {
      chosenBlock = this.pickShortestIfSame(topBlock, leftBlock, diagonalBlock);
    } else {
      chosenBlock = this.pickShortestIfSame(diagonalBlock, topBlock, leftBlock);
    }
    princessBlock.val = chosenBlock.pathWeight;
    princessBlock.pathLen = chosenBlock.pathLen;
  }

  // check if the chosen result matches with the other two. if so, pick the fastest
  private pickShortestIfSame(chosenBlock: Block, option1: Block, option2: Block): Block {
    if (chosenBlock.val === option1.val && option1.pathLen < chosenBlock.pathLen) {
      chosenBlock = option1;
    }
    if (chosenBlock.val === option2.val && option2.pathLen < chosenBlock.pathLen) {
      chosenBlock = option2;
    }
    return chosenBlock;
  }

  // heuristics
  private setValidMaxBlock(row, col, grid, maxAllowedResult) {
    const currBlock: Block = grid[row][col];
    let maxValForCurrBlock = 0;

    // what if we walk diagonally
    // const valFromDiagonal = pathMatrix[row - 1][col - 1] * currBlock.val;
    const valFromDiagonal = grid[row - 1][col - 1].pathWeight * currBlock.val;
    if (valFromDiagonal < maxAllowedResult && valFromDiagonal > maxValForCurrBlock) {
      maxValForCurrBlock = valFromDiagonal;
      grid[row][col].pathWeight = valFromDiagonal;
      currBlock.pathLen = grid[row - 1][col - 1].pathLen + 1;
    }

    // what if we walk from left?
    const valFromleft = grid[row][col - 1].pathWeight + currBlock.val;
    if (valFromleft < maxAllowedResult && valFromleft > maxValForCurrBlock) {
      maxValForCurrBlock = valFromleft;
      grid[row][col].pathWeight = valFromleft;
      currBlock.pathLen = grid[row ][col - 1].pathLen + 1;
    }
    // what if we walk from top
    const valFromTop = grid[row - 1][col].pathWeight + currBlock.val;
    if (valFromTop < maxAllowedResult && valFromTop > maxValForCurrBlock) {
      maxValForCurrBlock = valFromTop;
      grid[row][col].pathWeight = valFromTop;
      currBlock.pathLen = grid[row - 1][col].pathLen + 1;
    }

    // if no valid result found then take a min step
    if (maxValForCurrBlock === 0) {
      if (valFromleft > valFromTop) {
        grid[row][col].pathWeight = valFromleft;
        currBlock.pathLen = grid[row ][col - 1].pathLen + 1;
      } else {
        grid[row][col].pathWeight = valFromTop;
        currBlock.pathLen = grid[row - 1][col].pathLen + 1;
      }
    }
  }

  private getMinRows(difficulty: GameDifficulty): number {
    switch (difficulty) {
      case GameDifficulty.EASY:
        return 1;
      case GameDifficulty.MEDIUM:
        return GameDifficulty.EASY;
      case GameDifficulty.HARD:
        return GameDifficulty.MEDIUM
    }
  }

  private getMaxRandomInt(max) {
    return this.getRandomInt(0, max, 1);
  }

  private getRandomInt(min, max, salt) {
    const randomNum = Math.floor(Math.random() * (max - min)) + min;
    return randomNum + salt;
  }
}

export enum GameDifficulty {
  EASY = 3,
  MEDIUM = 5,
  HARD = 9
}

export class Block {
  private _val: number;
  private _pathLen: number;
  private _pathWeight: number;

  constructor(val: number) {
    this._val = val;
  }

  get val(): number {
    return this._val;
  }

  set val(value: number) {
    this._val = value;
  }

  get pathLen(): number {
    return this._pathLen;
  }

  set pathLen(value: number) {
    this._pathLen = value;
  }

  get pathWeight(): number {
    return this._pathWeight;
  }

  set pathWeight(value: number) {
    this._pathWeight = value;
  }
}
