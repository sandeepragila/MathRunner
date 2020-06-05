
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
    this.GameLevels.push(new LevelInfo(first, 2, 4, 2, 15));

    const second = [2, 2, 4, 1, 4, 8];
    this.GameLevels.push(new LevelInfo(second, 3, 8, 2, 15));
    const third = [4, 1, 3, 3 , 3, 4, 2, 3, 12];
    this.GameLevels.push(new LevelInfo(third, 3, 14, 3, 30));
    const fourth = [4, 3, 1, 4, 2, 4, 2, 4, 3, 1, 3, 32];
    this.GameLevels.push(new LevelInfo(fourth, 3, 32, 3, 30));
    const fifth = [3, 2, 3, 1, 1, 2, 3, 2, 1, 2, 1, 11];
    this.GameLevels.push(new LevelInfo(fifth, 4, 11, 4, 30));
    const sixth = [2, 3, 3, 2, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 23];
    this.GameLevels.push(new LevelInfo(sixth, 4, 23, 5, 45));
    const seventh = [3, 1, 2, 4, 3, 2, 4, 2, 1, 4, 3, 2, 3, 3, 2, 1, 2, 4, 2, 2, 4, 1, 2, 4, 44];
    this.GameLevels.push(new LevelInfo(seventh, 5, 44, 5, 60));
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

  get timeLimit(): number {
    return this._timeLimit;
  }

  set timeLimit(value: number) {
    this._timeLimit = value;
  }

  constructor(private _matrix: number[],
              private _cols: number,
              private _solution: number,
              private _shortestPath: number,
              private _timeLimit: number) {
    this._matrix = _matrix;
    this._cols = _cols;
    this._solution = _solution;
    this._shortestPath = _shortestPath;
    this._timeLimit = _timeLimit;
  }
}

export class GameSummaryInfo {
  private _level: number;
  private _time: number;
  private _retries: number;
  private _isShortest: boolean;
  private _mode: string;

  constructor(level: number, mode: string) {
    this._level = level;
    this._retries = -1;
    this._mode = mode;
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

  get mode(): string {
    return this._mode;
  }

  set mode(value: string) {
    this._mode = value;
  }
}

export const AudioFiles = {
  WALK: 'assets/sounds/pause.ogg',
  BACK_GROUND: 'assets/sounds/music.mp3',
  GAME_OVER: 'assets/sounds/game-over.ogg',
  WRONG_STEP: 'assets/sounds/attack.ogg'
}
