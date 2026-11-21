# MathRunner

A browser puzzle game: start at the top-left cell, add on right/down moves, multiply on diagonal down-right moves, and reach the bottom-right goal with exactly its target total. Entering the goal performs no arithmetic. Selecting the last selected cell undoes that step. There is no time limit.

## Development

The existing Angular 10 toolchain uses Node 14 and npm 6 (CI pins Node 14.21.3). A framework/runtime upgrade remains separate maintenance work; newer Node versions are not validated with this toolchain.

```sh
npm ci
npm start
```

Open http://localhost:4200. Use pointer taps, mouse/touch dragging, or keyboard Tab/arrow keys followed by Enter/Space.

```sh
npm test                 # deterministic rules, persistence, component and solver regressions
npm run lint
npm run build -- --prod  # production output in dist/
npm run check           # all three checks
```

Tests use Node assertions and the installed TypeScript runtime, without a browser driver. The solver is checked against independent exhaustive forward enumeration for 4,860 small cases and 900 seeded generated puzzles. Browser smoke checks should cover onboarding, play, reload, retry, summary, reset, keyboard input and dragging. The obsolete Karma/Protractor scaffold has been removed.

## Architecture and progress

- `game/shortest-path.ts`: exact memoized backward solver keyed by row, column and required total. Sparse storage; worst-case O(rows × columns × target) states. The goal is excluded from the counted path.
- `game/game-session.ts`: pure arithmetic, movement, score and difficulty rules. Seven completed Easy levels unlock Medium; seven completed Medium levels unlock Hard. A level counts once; improving a previous solution adds only the score difference.
- `service/level-generator.service.ts`: constructs reachable targets and asks the exact solver for their minimum lengths. Grid sizes are Easy 2–3, Medium 4–5 and Hard 6–9 per dimension.
- `service/game-storage.service.ts`: versioned local storage with validation, including the exact board, path, current/next modes, score and completed-level counts. A blocked/full store falls back to in-memory play with a visible notice.
- `components/game-board`: accessible native buttons with pointer and keyboard input. Rendering derives from game state.

Legacy two-day cookies are migrated when no new save exists. They did not retain boards or accurate historical completion counts, so migration generates a replacement board, converts counters as closely as possible and preserves previously unlocked modes. Reset only clears MathRunner storage/cookies. New Game creates and saves a fresh first level; Resume preserves the existing game.

Completed levels award Easy 3/5, Medium 7/10 or Hard 10/15 points (longer/shortest path). Awards are saved immediately, including before quitting. Retry preserves earned credit, so it cannot farm points or lose prior earnings. Reloading a completed puzzle restores its completion controls.
After retrying a completed level, players can keep their best score and continue without solving it again.

## Deployment

GitHub Actions installs locked dependencies, tests, lints, builds, and uploads **dist/** to GitHub Pages. Pull requests validate but do not deploy. Enable Pages with GitHub Actions as the source. For a project URL under `/repository/`, set the repository Actions variable `PAGES_BASE_HREF` to `/repository/`; the default `/` suits a root/custom domain such as mathrunner.fun.

No backend or account is required. Scores are local to the browser and are not suitable as trusted competitive rankings. This repository does not configure the domain or DNS.
