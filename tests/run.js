const assert = require('assert');
require('ts-node').register({transpileOnly: true, compilerOptions: {module: 'commonjs'}});
const {shortestPath} = require('../src/app/game/shortest-path');
const {GameSession} = require('../src/app/game/game-session');
const {LevelGeneratorService} = require('../src/app/service/level-generator.service');
const {GameStorageService} = require('../src/app/service/game-storage.service');
const {GameInfoAlertComponent} = require('../src/app/components/game-info-dialog/game-info-alert.component');
const {GameSummaryAlertComponent} = require('../src/app/components/game-summary-dialog/game-summary-alert.component');
const {AppComponent} = require('../src/app/app.component');
const {GameBoardComponent} = require('../src/app/components/game-board/game-board.component');
const {AudioService} = require('../src/app/audio/audio.service');
const {GameOverAlertComponent} = require('../src/app/components/game-over-alert-dialog/game-over-alert.component');
const {CustomAlertDialogComponent} = require('../src/app/components/custom-alert-dialog/custom-alert-dialog.component');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS', name); }
const first = () => ({matrix: [1, 3, 2, 4], cols: 2, solution: 4, shortestPath: 2});
const retryBoard = () => ({matrix: [1,2,1,1,2,1,1,1,4], cols: 3, solution: 4, shortestPath: 3});
function play(game, path) { for (const cell of path) assert.strictEqual(game.move(cell), null); }
// Independent forward enumeration, no inversion or memoized backward recurrence.
function oracle(matrix, cols, target) {
  let best = Infinity;
  const goal = matrix.length - 1, rows = matrix.length / cols;
  function walk(index, sum, length) {
    const r = Math.floor(index / cols), c = index % cols;
    for (const [dr, dc] of [[0,1],[1,0],[1,1]]) {
      if (r + dr >= rows || c + dc >= cols) continue;
      const next = (r + dr) * cols + c + dc;
      if (next === goal) { if (sum === target) best = Math.min(best, length); continue; }
      const total = dr && dc ? sum * matrix[next] : sum + matrix[next];
      if (total <= target) walk(next, total, length + 1);
    }
  }
  walk(0, matrix[0], 1);
  return best;
}
test('solver agrees with exhaustive enumeration for all 2x3 grids of values 1..3, targets 1..20', () => {
  for (let mask = 0; mask < 243; mask++) {
    let n = mask; const matrix = [];
    for (let i = 0; i < 5; i++) { matrix.push(n % 3 + 1); n = Math.floor(n / 3); }
    matrix.push(1);
    for (let target = 1; target <= 20; target++) assert.strictEqual(shortestPath(matrix, 3, target), oracle(matrix, 3, target));
  }
});
test('900 seeded generated boards are reachable and have the correct minimum', () => {
  const random = Math.random; let seed = 20261121;
  Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  try {
    const gen = new LevelGeneratorService();
    for (const [mode, min, max] of [[3,2,3],[5,4,5],[9,6,9]]) {
      for (let i = 0; i < 300; i++) {
        const b = gen.getNextLevel(mode);
        assert(b.cols >= min && b.cols <= max && b.matrix.length / b.cols >= min && b.matrix.length / b.cols <= max);
        assert.strictEqual(b.shortestPath, oracle(b.matrix, b.cols, b.solution));
        assert(Number.isFinite(b.shortestPath));
      }
    }
  } finally { Math.random = random; }
});
test('solver rejects malformed boards, handles multiplication by one and unreachable targets', () => {
  assert.strictEqual(shortestPath([1,1,1,1], 2, 1), 1);
  assert.strictEqual(shortestPath([2,1,1,1], 2, 1), Infinity);
  assert.strictEqual(shortestPath([0,1,1,1], 2, 1), Infinity);
  assert.strictEqual(shortestPath([1,2,3], 2, 3), Infinity);
  assert.throws(() => new LevelGeneratorService().getLevel(1, 3));
});
test('movement rejects jumps and overflow, adds, multiplies and undoes', () => {
  const g = new GameSession(retryBoard());
  assert(g.move(1)); play(g, [0,4]); assert.strictEqual(g.result, 2);
  play(g, [4]); assert.strictEqual(g.result, 1);
  assert(g.move(7)); play(g, [1]); assert.strictEqual(g.result, 3);
  assert(g.move(4)); assert.strictEqual(g.result, 3);
  play(g, [1,0]); assert.strictEqual(g.result, 0);
  assert(g.move(8));
});
test('completion awards once, retry upgrades only the difference and cannot downgrade', () => {
  const g = new GameSession(retryBoard());
  play(g, [0,3,6,7,8]); assert.strictEqual(g.state.score, 3); assert.strictEqual(g.state.completed.EASY, 1);
  assert.strictEqual(g.canImprove, true);
  g.move(8); assert.strictEqual(g.state.score, 3);
  g.retry(); play(g, [0,3,4,8]); assert.strictEqual(g.state.score, 5); assert.strictEqual(g.state.completed.EASY, 1);
  g.retry(); play(g, [0,3,6,7,8]); assert.strictEqual(g.state.score, 5); assert.strictEqual(g.state.completed.EASY, 1);
  assert.strictEqual(g.canImprove, false);
  g.retry(); g.next(first());
  assert.strictEqual(g.state.level, 2); assert.strictEqual(g.state.score, 5);
  assert.strictEqual(g.state.credited, 0);
});
test('reload preserves board, path, result, completion and score; restored retries remain playable', () => {
  const g = new GameSession(retryBoard()); play(g, [0,3]);
  let restored = GameSession.restore(g.serialize()); assert(restored); assert.strictEqual(restored.result, 2);
  assert.deepStrictEqual(restored.state.board, retryBoard());
  play(restored, [6,7,8]); restored = GameSession.restore(restored.serialize()); assert(restored);
  assert.strictEqual(restored.state.score, 3); assert(restored.state.solved);
  restored.retry(); restored = GameSession.restore(restored.serialize()); assert(restored);
  play(restored, [0,3,4,8]); assert.strictEqual(restored.state.score, 5);
});
test('difficulty requires seven completed levels and current level retains its original scoring', () => {
  const g = new GameSession(first());
  for (let i = 0; i < 6; i++) { play(g, [0,1,3]); g.next(first()); }
  assert.strictEqual(g.canSelect('MEDIUM'), false);
  play(g, [0,1,3]); assert(g.selectMode('MEDIUM')); assert.strictEqual(g.state.mode, 'EASY');
  assert.strictEqual(g.state.score, 35);
  g.next(first()); assert.strictEqual(g.state.mode, 'MEDIUM');
  play(g, [0,1,3]); assert.strictEqual(g.state.score, 45); assert.strictEqual(g.state.completed.MEDIUM, 1);
  assert.strictEqual(g.canSelect('HARD'), false); assert(GameSession.restore(g.serialize()));
  for (let i = 0; i < 6; i++) { g.next(first()); play(g, [0,1,3]); }
  assert.strictEqual(g.state.completed.MEDIUM, 7);
  assert(g.selectMode('HARD')); g.next(first()); assert.strictEqual(g.state.mode, 'HARD');
  play(g, [0,1,3]); assert.strictEqual(g.state.score, 120);
});
test('invalid saves fail safely', () => {
  assert.strictEqual(GameSession.restore('{'), null);
  for (const edit of [s => s.score = -1, s => s.mode = 'OTHER', s => s.board.cols = 0,
    s => s.board.shortestPath = 999, s => s.board.matrix[0] = 0, s => s.path = [0,0],
    s => s.path = [0,3], s => s.solved = true, s => s.completed.EASY = 99]) {
    const g = new GameSession(first()); edit(g.state); assert.strictEqual(GameSession.restore(g.serialize()), null);
  }
});
const cookieData = new Map(); const removed = [];
const cookies = {get: name => cookieData.get(name) || '', delete: name => {removed.push(name); cookieData.delete(name);}};
let stored = new Map();
global.localStorage = {getItem: key => stored.get(key) || null, setItem: (key, val) => stored.set(key,val), removeItem: key => stored.delete(key)};
test('storage round trip and legacy migration preserve progress without deleting other cookies', () => {
  const storage = new GameStorageService(cookies, new LevelGeneratorService());
  const g = new GameSession(first()); play(g, [0,1,3]); storage.save(g);
  assert.strictEqual(storage.load().state.score, 5); storage.clear();
  cookieData.set('mr-curr-level', 'EASY'); cookieData.set('mr-levelinfo', '4|0|0|3|15'); cookieData.set('unrelated','keep');
  const migrated = storage.load(); assert.strictEqual(migrated.state.score,15); assert.strictEqual(migrated.state.completed.EASY,3);
  assert(GameSession.restore(migrated.serialize())); storage.clear(); assert.strictEqual(cookieData.get('unrelated'),'keep');
  assert(removed.every(name => name === 'mr-curr-level' || name === 'mr-levelinfo'));
});
test('corrupt new save falls back to valid legacy progress', () => {
  const storage = new GameStorageService(cookies, new LevelGeneratorService());
  stored.set(storage.key, '{invalid');
  cookieData.set('mr-curr-level', 'EASY');
  cookieData.set('mr-levelinfo', '3|0|0|2|10');
  const migrated = storage.load();
  assert(migrated);
  assert.strictEqual(migrated.state.score, 10);
  assert.strictEqual(migrated.state.completed.EASY, 2);
  storage.clear();
});
test('unavailable storage does not stop play', () => {
  const original = global.localStorage;
  global.localStorage = {getItem() {throw Error('blocked');},setItem() {throw Error('full');},removeItem() {throw Error('blocked');}};
  const storage = new GameStorageService(cookies, new LevelGeneratorService());
  assert.strictEqual(storage.load(), null); storage.save(new GameSession(first())); storage.clear(); assert.strictEqual(storage.available,false);
  global.localStorage = original;
});
test('tutorial can go back from the final page and forward again', () => {
  let closed = false; const tutorial = new GameInfoAlertComponent({close() {closed=true;}});
  for (let i=0;i<4;i++) tutorial.onClick('next'); assert.strictEqual(tutorial.currIndex,3);
  tutorial.onClick('back'); assert.strictEqual(tutorial.currIndex,2);
  tutorial.onClick('next'); assert.strictEqual(tutorial.currIndex,3); tutorial.onClick('go'); assert(closed);
});
test('summary uses exact per-mode completion counts, including zero', () => {
  const summary = new GameSummaryAlertComponent({totalScore:5,levelsCompleted:new Map([['EASY',1],['MEDIUM',0],['HARD',0]])},{});
  assert.deepStrictEqual(summary.tableData.map(row=>row.levelsCompleted),[1,0,0]);
});
test('level completion restores shortest and retry pop-ups with working actions', () => {
  stored.clear(); let onClose, opened;
  const dialog = {openDialogs: [],open(component, options) {
    opened = {component, options};
    return {afterClosed() {return {subscribe(fn) {onClose=fn;}};}};
  }};
  const app = new AppComponent(dialog,new LevelGeneratorService(),
    new GameStorageService(cookies,new LevelGeneratorService()),{play(){},startBackground(){}});
  app.ngOnInit(); onClose(); onClose();
  app.move(0); app.move(1); app.move(3);
  assert.strictEqual(opened.component, GameOverAlertComponent);
  assert.strictEqual(opened.options.data.points, 5);
  onClose('next'); assert.strictEqual(app.game.state.level, 2);
  app.game = new GameSession(retryBoard());
  for (const cell of [0,3,6,7,8]) app.move(cell);
  assert.strictEqual(opened.component, CustomAlertDialogComponent);
  assert.deepStrictEqual(opened.options.data.buttons, ['Try again','Next level','Quit']);
  onClose('Try again'); assert.strictEqual(app.game.state.score, 3);
  assert.strictEqual(app.game.state.path.length, 0);
  for (const cell of [0,3,4,8]) app.move(cell);
  assert.strictEqual(opened.component, GameOverAlertComponent);
  assert.strictEqual(opened.options.data.points, 5);
  onClose('quit'); assert.strictEqual(opened.component, GameSummaryAlertComponent);
});
test('root flow persists a win before quit, resumes, and starts an actual new game', () => {
  stored.clear(); let onClose; const dialog = {openDialogs: [],open() {return {afterClosed() {return {subscribe(fn) {onClose=fn;}};}};}};
  const storage = new GameStorageService(cookies, new LevelGeneratorService());
  const app = new AppComponent(dialog,new LevelGeneratorService(),storage,{play(){},startBackground(){}});
  app.ngOnInit(); onClose(); onClose(); app.move(0); app.move(1); app.move(3);
  assert.strictEqual(storage.load().state.score,5); app.quit(); onClose('resume'); assert.strictEqual(app.game.state.score,5);
  app.quit(); onClose('new'); onClose('No'); assert.strictEqual(app.game.state.score,5);
  app.quit(); onClose('new'); onClose('Yes');
  assert.strictEqual(app.game.state.score,0); assert.strictEqual(app.game.state.level,1);
  app.move(0); app.reset(); onClose('No'); assert.strictEqual(app.game.result,1);
  app.reset(); onClose('Yes'); assert.strictEqual(app.game.result,0); assert.strictEqual(storage.load().state.score,0);
});
test('pointer tap and keyboard click each select once; pointer cancellation ends dragging', () => {
  const board = new GameBoardComponent(); board.board=first(); const selected=[]; board.choose.subscribe(index=>selected.push(index));
  board.pointerDown({button:0,preventDefault(){},currentTarget:{focus(){}}},0);
  board.click({detail:1},0); assert.deepStrictEqual(selected,[0]);
  const previousDocument = global.document;
  global.document = {elementFromPoint: () => ({closest: selector => selector === 'button[data-cell]' ?
    {dataset: {cell: '1'},closest: () => ({})} : null})};
  board.pointerMove({clientX:10,clientY:10});
  board.pointerMove({clientX:10,clientY:10});
  assert.deepStrictEqual(selected,[0,1]);
  global.document = previousDocument;
  board.stopDrag(); board.click({detail:0},2); assert.deepStrictEqual(selected,[0,1,2]);
  board.disabled=true; board.click({detail:0},3); assert.deepStrictEqual(selected,[0,1,2]);
});
test('audio handles denied playback and muting', () => {
  let played=0,paused=0;
  global.Audio = class {
    constructor() {this.paused=true;}
    play(){played++;return Promise.reject(Error('autoplay denied'));}
    pause(){paused++;this.paused=true;}
  };
  const audio=new AudioService(); audio.play('walk'); audio.startBackground();
  audio.toggle(); audio.play('walk');
  assert.strictEqual(played,2); assert.strictEqual(paused,2);
  audio.toggle(); assert.strictEqual(played,3);
});
console.log(`\n${passed} regression groups passed.`);
