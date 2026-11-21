import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {GameConstants} from './GameConstants';
import {GameSession, MODES, Mode, POINTS} from './game/game-session';
import {GameDifficulty, LevelGeneratorService} from './service/level-generator.service';
import {GameStorageService} from './service/game-storage.service';
import {AudioService} from './audio/audio.service';
import {GameInfoAlertComponent} from './components/game-info-dialog/game-info-alert.component';
import {GameSummaryAlertComponent} from './components/game-summary-dialog/game-summary-alert.component';
import {CustomAlertDialogComponent} from './components/custom-alert-dialog/custom-alert-dialog.component';
import {GameNewsAlertComponent} from './components/game-news-dialog/game-news-alert.component';
import {GameOverAlertComponent} from './components/game-over-alert-dialog/game-over-alert.component';

@Component({selector: 'app-root', templateUrl: './app.component.html', styleUrls: ['./app.component.css']})
export class AppComponent implements OnInit {
  title = 'MathRunner';
  modes = MODES;
  game: GameSession;
  message = '';
  ready = false;

  constructor(private dialog: MatDialog, private generator: LevelGeneratorService,
              public storage: GameStorageService, public audio: AudioService) {}

  ngOnInit(): void {
    this.game = this.storage.load();
    if (this.game) { this.ready = true; this.audio.startBackground(); return; }
    this.newGame();
    this.ready = false;
    this.dialog.open(GameNewsAlertComponent).afterClosed().subscribe(() => {
      this.dialog.open(GameInfoAlertComponent).afterClosed().subscribe(() => {
        this.ready = true;
        this.audio.startBackground();
      });
    });
  }

  move(index: number): void {
    if (!this.ready || this.dialog.openDialogs.length) { return; }
    const wasSolved = this.game.state.solved;
    this.message = this.game.move(index) || '';
    if (this.message) { this.audio.play('wrongStep'); return; }
    this.audio.startBackground();
    this.audio.play(this.game.state.solved && !wasSolved ? 'gameOver' : 'walk');
    this.storage.save(this.game);
    if (this.game.state.solved && !wasSolved) { this.showCompletion(); }
  }

  changeMode(mode: Mode): void {
    if (!this.game.selectMode(mode)) {
      this.message = `Complete seven ${mode === 'MEDIUM' ? 'Easy' : 'Medium'} levels to unlock this difficulty.`;
    } else {
      this.message = `The next level will be ${mode.toLowerCase()}.`;
      this.storage.save(this.game);
    }
  }

  retry(): void {
    this.game.retry();
    this.message = '';
    this.storage.save(this.game);
  }

  next(): void {
    const level = this.generator.getNextLevel(GameDifficulty[this.game.state.nextMode]);
    this.game.next({matrix: level.matrix, cols: level.cols, solution: level.solution, shortestPath: level.shortestPath});
    this.message = '';
    this.storage.save(this.game);
  }

  quit(): void {
    this.storage.save(this.game);
    this.dialog.open(GameSummaryAlertComponent, {data: {
      totalScore: this.game.state.score, levelsCompleted: new Map(MODES.map(mode => [mode, this.game.state.completed[mode]]))
    }}).afterClosed().subscribe(action => {
      if (action === 'new') { this.reset(); }
    });
  }

  reset(): void {
    this.dialog.open(CustomAlertDialogComponent, {data: {
      mainContent: 'Reset the game? Your saved progress will be removed.', buttons: ['No', 'Yes']
    }}).afterClosed().subscribe(action => {
      if (action === 'Yes') { this.newGame(); }
    });
  }

  instructions(): void { this.dialog.open(GameInfoAlertComponent); }

  private showCompletion(): void {
    const shortest = this.game.state.path.length === this.game.state.board.shortestPath;
    const popup = shortest ?
      this.dialog.open(GameOverAlertComponent, {data: {points: this.game.state.credited}}) :
      this.dialog.open(CustomAlertDialogComponent, {data: {
        mainContent: this.game.canImprove ?
          `You got ${this.game.state.credited} points! A shorter path earns ${POINTS[this.game.state.mode][1]} points. Try again?` :
          `Your best score for this level is ${this.game.state.credited} points. Try again?`,
        buttons: ['Try again', 'Next level', 'Quit']
      }});
    popup.afterClosed().subscribe(action => {
      if (action === 'next' || action === 'Next level') {
        this.next();
      } else if (action === 'Try again') {
        this.retry();
      } else if (action === 'quit' || action === 'Quit') {
        this.quit();
      }
    });
  }

  private newGame(): void {
    this.storage.clear();
    const level = GameConstants.getGameLevel(0);
    this.game = new GameSession({matrix: [...level.matrix], cols: level.cols,
      solution: level.solution, shortestPath: level.shortestPath});
    this.message = '';
    this.ready = true;
    this.storage.save(this.game);
  }
}
