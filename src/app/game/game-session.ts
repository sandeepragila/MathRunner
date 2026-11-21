import {shortestPath} from './shortest-path';

export type Mode = 'EASY' | 'MEDIUM' | 'HARD';
export const MODES: Mode[] = ['EASY', 'MEDIUM', 'HARD'];
export const POINTS = {EASY: [3, 5], MEDIUM: [7, 10], HARD: [10, 15]};
export interface Board { matrix: number[]; cols: number; solution: number; shortestPath: number; }
export interface SavedGame {
  version: number;
  board: Board;
  mode: Mode;
  nextMode: Mode;
  level: number;
  score: number;
  completed: Record<Mode, number>;
  path: number[];
  credited: number;
  solved: boolean;
}

/** Rules and progress are independent of Angular, browser events and rendering. */
export class GameSession {
  state: SavedGame;

  constructor(board: Board) {
    this.state = {version: 1, board, mode: 'EASY', nextMode: 'EASY', level: 1, score: 0,
      completed: {EASY: 0, MEDIUM: 0, HARD: 0}, path: [], credited: 0, solved: false};
  }

  get result(): number { return this.evaluate(this.state.path); }

  get canImprove(): boolean { return this.state.credited < POINTS[this.state.mode][1]; }

  canSelect(mode: Mode): boolean {
    return mode === 'EASY' || (mode === 'MEDIUM' ? this.state.completed.EASY >= 7 : this.state.completed.MEDIUM >= 7);
  }

  selectMode(mode: Mode): boolean {
    if (!MODES.includes(mode) || !this.canSelect(mode)) { return false; }
    this.state.nextMode = mode;
    return true;
  }

  move(index: number): string | null {
    const s = this.state;
    if (s.solved) { return null; }
    if (!Number.isInteger(index) || index < 0 || index >= s.board.matrix.length) { return 'Invalid cell.'; }
    const last = s.path[s.path.length - 1];
    if (index === last) { s.path.pop(); return null; }
    if (!s.path.length && index !== 0) { return 'Start at the first cell.'; }
    if (s.path.length && !this.adjacent(last, index)) { return 'Move one cell right, down, or diagonally down-right.'; }
    if (index === s.board.matrix.length - 1) {
      if (this.result !== s.board.solution) { return `Reach exactly ${s.board.solution} before entering the goal.`; }
      const points = POINTS[s.mode][s.path.length === s.board.shortestPath ? 1 : 0];
      if (s.credited === 0) { s.completed[s.mode]++; }
      s.score += Math.max(0, points - s.credited);
      s.credited = Math.max(points, s.credited);
      s.solved = true;
      return null;
    }
    const next = [...s.path, index];
    if (this.evaluate(next) > s.board.solution) { return 'That exceeds the target. Try another step.'; }
    s.path = next;
    return null;
  }

  retry(): void { this.state.path = []; this.state.solved = false; }

  next(board: Board): void {
    if (!this.state.credited) { return; }
    Object.assign(this.state, {board, mode: this.state.nextMode, level: this.state.level + 1,
      path: [], credited: 0, solved: false});
  }

  serialize(): string { return JSON.stringify(this.state); }

  static restore(raw: string): GameSession | null {
    try {
      const s: SavedGame = JSON.parse(raw);
      const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
      if (!s || s.version !== 1 || !MODES.includes(s.mode) || !MODES.includes(s.nextMode) || !s.completed ||
          !integer(s.level) || s.level < 1 || !integer(s.score) || !integer(s.credited) ||
          MODES.some(mode => !integer(s.completed[mode])) || !Array.isArray(s.path) || typeof s.solved !== 'boolean') {
        return null;
      }
      const b = s.board;
      if (!b || !Array.isArray(b.matrix) || !Number.isInteger(b.cols) || b.cols < 2 || b.cols > 9 ||
          b.matrix.length < b.cols * 2 || b.matrix.length > b.cols * 9 || b.matrix.length % b.cols !== 0 ||
          !integer(b.solution) || b.solution < 1 || b.solution > 10000 ||
          b.matrix.some((v, i) => !integer(v) || v < 1 || (i < b.matrix.length - 1 && v > 5)) ||
          b.matrix[b.matrix.length - 1] !== b.solution || b.shortestPath !== shortestPath(b.matrix, b.cols, b.solution) ||
          !Number.isFinite(b.shortestPath) || s.path.length >= b.matrix.length) { return null; }
      if (s.credited !== 0 && !POINTS[s.mode].includes(s.credited)) { return null; }
      if (s.score < s.credited || (s.credited > 0 && s.completed[s.mode] < 1) ||
          MODES.reduce((sum, mode) => sum + s.completed[mode], 0) !== s.level - 1 + (s.credited > 0 ? 1 : 0)) { return null; }
      const game = new GameSession(b);
      for (const index of s.path) {
        if (index === b.matrix.length - 1 || game.state.path.includes(index) || game.move(index)) { return null; }
      }
      if (s.solved && (!s.credited || game.move(b.matrix.length - 1) || !game.state.solved ||
          s.credited < POINTS[s.mode][s.path.length === b.shortestPath ? 1 : 0])) { return null; }
      game.state = s;
      if (!game.canSelect(s.nextMode) || !game.canSelect(s.mode)) { return null; }
      return game;
    } catch { return null; }
  }

  private adjacent(from: number, to: number): boolean {
    const cols = this.state.board.cols;
    const row = Math.floor(to / cols) - Math.floor(from / cols);
    const col = to % cols - from % cols;
    return (row === 0 && col === 1) || (row === 1 && col === 0) || (row === 1 && col === 1);
  }

  private evaluate(path: number[]): number {
    const {matrix, cols} = this.state.board;
    return path.reduce((total, index, i) => {
      if (!i) { return matrix[index]; }
      const last = path[i - 1];
      return Math.floor(index / cols) > Math.floor(last / cols) && index % cols > last % cols ?
        total * matrix[index] : total + matrix[index];
    }, 0);
  }
}
