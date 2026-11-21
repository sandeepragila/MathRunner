import {Injectable} from '@angular/core';
import {CookieService} from 'ngx-cookie-service';
import {GameConstants} from '../GameConstants';
import {GameSession, MODES, Mode} from '../game/game-session';
import {GameDifficulty, LevelGeneratorService} from './level-generator.service';

@Injectable()
export class GameStorageService {
  readonly key = 'mathrunner.game.v1';
  available = true;

  constructor(private cookies: CookieService, private generator: LevelGeneratorService) {}

  load(): GameSession | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const game = GameSession.restore(raw);
        if (game) { return game; }
      }
    } catch { this.available = false; }
    return this.migrateCookies();
  }

  save(game: GameSession): void {
    try { localStorage.setItem(this.key, game.serialize()); this.available = true; } catch { this.available = false; }
  }

  clear(): void {
    try { localStorage.removeItem(this.key); } catch { this.available = false; }
    // Only remove this game's legacy cookies, never unrelated site cookies.
    for (const name of [GameConstants.MR_CURR_LEVEL_COOKIE, GameConstants.MR_LEVELINFO_COOKIE]) {
      this.cookies.delete(name);
      this.cookies.delete(name, '/');
    }
  }

  private migrateCookies(): GameSession | null {
    const mode = this.cookies.get(GameConstants.MR_CURR_LEVEL_COOKIE) as Mode;
    const raw = this.cookies.get(GameConstants.MR_LEVELINFO_COOKIE);
    if (!MODES.includes(mode) || !/^\d+\|\d+\|\d+\|\d+\|\d+$/.test(raw)) { return null; }
    const values = raw.split('|').map(Number);
    if (values.some(value => !Number.isSafeInteger(value) || value < 0)) { return null; }
    const level = this.generator.getNextLevel(GameDifficulty[mode]);
    const game = new GameSession({matrix: level.matrix, cols: level.cols, solution: level.solution,
      shortestPath: level.shortestPath});
    // Legacy counters recorded levels entered. Only the current mode has an unfinished level.
    MODES.forEach((name, i) => game.state.completed[name] = Math.max(0, values[i] - (name === mode ? 1 : 0)));
    // Preserve access earned under the old, off-by-one unlock rule.
    if (mode !== 'EASY') { game.state.completed.EASY = Math.max(7, game.state.completed.EASY); }
    if (mode === 'HARD') { game.state.completed.MEDIUM = Math.max(7, game.state.completed.MEDIUM); }
    game.state.mode = mode;
    game.state.nextMode = mode;
    game.state.level = MODES.reduce((sum, name) => sum + game.state.completed[name], 1);
    game.state.score = values[4];
    this.save(game);
    return game;
  }
}
