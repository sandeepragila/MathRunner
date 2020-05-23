
export class GameConstants {
  static GameLevels: LevelInfo[] = [];

  public static getGameLevel(level: number) {
    if (this.GameLevels.length === 0) {
      this.initGameLevels();
    }
    return this.GameLevels[level];
  }

  private static initGameLevels() {
    const first = [1, 3, 2, 4];
    this.GameLevels.push(new LevelInfo(first, 2, 4, 2));

    const second = [2, 2, 4, 1, 4, 8];
    this.GameLevels.push(new LevelInfo(second, 3, 8, 2));
    const third = [3, 1, 4, 3, 5, 10, 2, 3, 18];
    this.GameLevels.push(new LevelInfo(third, 3, 18, 3));
    const fourth = [5, 10, 6, 2, 5, 3, 3, 12, 7, 20, 20, 52];
    this.GameLevels.push(new LevelInfo(fourth, 3, 52, 4));
  }
}

export class LevelInfo {
  get matrix(): number[] {
    return this._matrix;
  }

  set matrix(value: number[]) {
    this._matrix = value;
  }

  get cols(): number {
    return this._cols;
  }

  set cols(value: number) {
    this._cols = value;
  }

  get solution(): number {
    return this._solution;
  }
  get shortestPath(): number {
    return this._shortestPath;
  }

  set solution(value: number) {
    this._solution = value;
  }
  constructor(private _matrix: number[],
              private _cols: number,
              private _solution: number,
              private _shortestPath: number) {
    this._matrix = _matrix;
    this._cols = _cols;
    this._solution = _solution;
    this._shortestPath = _shortestPath;
  }
}

export class GameSummaryInfo {
  private _level: number;
  private _time: number;
  private _retries: number;
  private _isShortest: boolean;
  constructor(level: number) {
    this._level = level;
    this._retries = 1;
  }

  get level(): number {
    return this._level;
  }

  set level(value: number) {
    this._level = value;
  }

  get time(): number {
    return this._time;
  }

  set time(value: number) {
    this._time = value;
  }

  get retries(): number {
    return this._retries;
  }

  set retries(value: number) {
    this._retries = value;
  }

  get isShortest(): boolean {
    return this._isShortest;
  }

  set isShortest(value: boolean) {
    this._isShortest = value;
  }
}
