import {AfterViewInit, ChangeDetectorRef, Component} from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import {MatDialog} from '@angular/material/dialog';
import {GameOverAlertComponent} from './components/game-over-alert-dialog/game-over-alert.component';
import {CustomAlertDialogComponent} from './components/custom-alert-dialog/custom-alert-dialog.component';
import {GameConstants, GameSummaryInfo, LevelInfo} from './GameConstants';
import {GameSummaryAlertComponent} from './components/game-summary-dialog/game-summary-alert.component';
import {GameInfoAlertComponent} from './components/game-info-dialog/game-info-alert.component';
import {AudioService} from './audio/audio.service';
import {GameDifficulty, LevelGeneratorService} from './service/level-generator.service';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import 'hammerjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'MathRunner';
  isMouseDown = false;
  result = 0;
  prevResult: any;
  colors: ThemePalette[] = ['primary', 'accent', 'warn'];
  currLevelInfo: LevelInfo;
  prevLevelInfo: LevelInfo;
  currLevelNumber = 0;
  display = false;
  startGame = false;
  path: Array<Step> = [];
  timer;
  timeLeft;
  gameSummaryInfo: Map<number, GameSummaryInfo> = new Map();
  gameModes = [
    {id: 'EASY', name: 'EASY'},
    {id: 'MEDIUM', name: 'MEDIUM'},
    {id: 'HARD', name: 'HARD'}
  ];
  gameDifficulty = this.gameModes[0];
  modeForm: FormGroup;
  modeValidator: Map<string, number> = new Map();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public audio: AudioService,
    public levelGenerator: LevelGeneratorService,
    private fb: FormBuilder
  ) {
    this.modeForm = fb.group({
      gameMode: [this.gameDifficulty]
    });
  }

  private startTimer() {
    this.timeLeft = this.currLevelInfo.timeLimit;
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.stopTimer();
        const ref = this.raisePopup('Oops! Time up!! :(', ['Retry']);
        ref.afterClosed().subscribe(result => {
          this.loadNextLevel(this.currLevelNumber);
        });
      }
    }, 1000)
  }

  private stopTimer() {
    clearInterval(this.timer);
    this.storeInfo();
  }

  private storeInfo() {
    const level = this.currLevelNumber + 1;
    if (this.gameSummaryInfo.has(level)) {
      const info: GameSummaryInfo = this.gameSummaryInfo.get(level);
      info.time = this.currLevelInfo.timeLimit - this.timeLeft;
      info.retries += 1;
      info.isShortest = this.path.length === this.currLevelInfo.shortestPath;
    } else {
      const info: GameSummaryInfo = new GameSummaryInfo(level);
      info.time = this.currLevelInfo.timeLimit - this.timeLeft;
      info.isShortest = this.path.length === this.currLevelInfo.shortestPath;
      this.gameSummaryInfo.set(level, info);
    }
  }

  ngAfterViewInit(): void {
    this.dialog.open(GameInfoAlertComponent).afterClosed().subscribe(result => {
    this.currLevelInfo = GameConstants.getGameLevel(this.currLevelNumber);
    this.prevLevelInfo = this.currLevelInfo;
    this.modeValidator.set(this.gameDifficulty.name, 1);
    this.display = true;
    this.cdr.detectChanges();
    this.addMatrixListeners();
    this.startGame = true;
    this.audio.bg.play();
    // this.startTimer();
    })
  }

  private loadNextLevel(level: number) {
    this.path = [];
    this.startGame = false;
    this.display = false;
    this.result = 0;
    this.currLevelInfo = undefined;
    this.cdr.detectChanges();
    this.currLevelInfo = this.getCorrectLevel(level);
    this.currLevelNumber = level;
    this.display = true;
    this.cdr.detectChanges();
    this.addMatrixListeners();
    this.startGame = true;
    this.audio.bg.play();
    // this.startTimer();
  }

  private getCorrectLevel(level: number): LevelInfo {
    const mode = this.gameDifficulty.name;
    if (level !== this.currLevelNumber) {
      this.prevLevelInfo = this.levelGenerator.getNextLevel(this.getAsEnum());
      if (this.modeValidator.has(mode)) {
        this.modeValidator.set(mode, this.modeValidator.get(mode) + 1);
      } else {
        this.modeValidator.set(mode, 1);
      }
    }
    return this.prevLevelInfo;
  }

  public onDifficultyChange(event) {
    if (event.value.name === 'EASY') {
      this.gameDifficulty = event.value;
      this.raisePopup('Your next level difficulty is set to EASY');
    }
    if (event.value.name === 'MEDIUM') {
      if (this.modeValidator.has('EASY') && this.modeValidator.get('EASY') >= 7) {
        this.gameDifficulty = event.value;
        this.raisePopup('You earned it! Your next level difficulty is set to ' + this.gameDifficulty.name);
      } else {
        this.modeForm.controls['gameMode'].patchValue(this.gameDifficulty);
        const levelsToComplete = this.modeValidator.has('EASY') ? 7 - this.modeValidator.get('EASY') : 7;
        this.raisePopup('In a hurry? You need to complete ' +  levelsToComplete + ' more EASY levels to switch to MEDIUM difficulty');
      }
    }
    if (event.value.name === 'HARD') {
      if (this.modeValidator.has('MEDIUM') && this.modeValidator.get('MEDIUM') >= 7) {
        this.gameDifficulty = event.value;
        this.raisePopup('You earned it! Your next level difficulty is set to ' + this.gameDifficulty.name);
      } else {
        const levelsToComplete = this.modeValidator.has(this.gameDifficulty.name) ?
          7 - this.modeValidator.get(this.gameDifficulty.name) : 7;
        this.modeForm.controls['gameMode'].patchValue(this.gameDifficulty);
        this.raisePopup('In a hurry? You need to complete ' + levelsToComplete + ' more ' + this.gameDifficulty.name + ' levels to switch to HARD difficulty');
      }
    }
  }

  private getAsEnum(): GameDifficulty {
   const key = this.gameDifficulty.name as keyof typeof GameDifficulty;
   return GameDifficulty[key];
  }

  private checkGameOver(level: number): boolean {
    if (level === GameConstants.GameLevels.length) {
      this.triggerGameOver();
      return true;
    }
    return false;
  }

  private triggerGameOver() {
    const ref =  this.dialog.open(GameSummaryAlertComponent, {
      data: {
        gameSummaryInfo: this.gameSummaryInfo
      }
    });
    ref.afterClosed().subscribe(result => {
      window.location.reload();
    });
  }

  public highlight(event) {
    if (!this.startGame) {
      return;
    }
    const target = event.target || event.srcElement || event.currentTarget;
    const index = Number(target.parentElement.dataset.index);
    const row = Math.floor((index / this.currLevelInfo.cols));
    const col = index % this.currLevelInfo.cols;
    if ((index + 1) === this.currLevelInfo.matrix.length) {
      target.style.background = '#ce4e4e';
      if (this.result === this.currLevelInfo.solution) {
        if (!this.isValidPathToPrincess(new Step(row, col, 0))) {
          const ref = this.raisePopup('Sorry no jumps allowed!');
          ref.afterClosed().subscribe(result => {
            target.style.background = 'lightblue';
          })
          return;
        }
        if (this.path.length === this.currLevelInfo.shortestPath) {
          this.gameOver(false);
        } else {
          this.gameOver(true);
        }
      } else  {
        const ref = this.raisePopup('Did you cover ' + this.currLevelInfo.solution + ' miles before you get here? Go back!');
        ref.afterClosed().subscribe(result => {
          target.style.background = 'lightblue';
        })
      }
      return;
    }

    const step = new Step(row, col,  index === 0 ? this.currLevelInfo.matrix[0] : Number(target.textContent));
    if (!this.validate(step)) {
      if (this.path.length !== 0) {
        this.raisePopup('Wrong step! Please follow the rules');
      }
      return;
    }
    this.audio.walk.play();
    this.calcResult(step);
    if (target.style.background === '' || target.style.background === 'lightblue') {
      if (this.result > this.currLevelInfo.solution) {
        this.calcResult(step);
        this.raisePopup('Oops! That\'s too much!');
        return;
      }
      target.style.background = '#ce4e4e';
    } else {
      target.style.background = 'lightblue';
    }
  }

  private isValidPathToPrincess(step: Step): boolean {
    return this.validate(step);
  }

  private calcResult(step: Step) {
    if (this.path.length === 0) {
      this.path.push(step);
      this.incrResult(undefined, step);
      return;
    }
    let lastStep = this.path[this.path.length - 1];
    if (lastStep.equals(step)) {
      this.path.pop();
      lastStep = this.path[this.path.length - 1];
      this.decrResult(lastStep, step);
    } else {
      this.path.push(step);
      this.incrResult(lastStep, step);
    }
  }

  private incrResult(lastStep: Step, step: Step) {
    if (lastStep === undefined) {
      this.result = step.val;
      return;
    }
    if (lastStep.isRightOrDown(step)) {
      this.result += step.val;
    } else {
      this.result *= step.val;
    }
  }

  private decrResult(lastStep: Step, step: Step) {
    if (lastStep === undefined) {
      this.result = 0;
      return;
    }
    if (lastStep.isRightOrDown(step)) {
      this.result -= step.val;
    } else {
      this.result /= step.val;
    }
  }

  private addMatrixListeners() {
    document.querySelectorAll('mat-grid-tile').forEach(item => {
      item.setAttribute('style', 'background: lightblue');
    });

    document.body.addEventListener('mouseup', ev => {
      this.isMouseDown = false;
    });
  }

  public myChangeEvent(event, down: boolean) {
    if (down) {
      this.isMouseDown = true;
      this.highlight(event);
    } else {
      if (this.isMouseDown) {
        this.highlight(event);
      }
    }
  }

  private validate(step: Step): boolean {
    if (this.path.length === 0 && (step.row !== 0 || step.col !== 0)) {
      this.raisePopup('Aahaa! You can only start from the first cell!');
      return false;
    }
    if (this.path.length === 0) {
      return true;
    }
    const lastStep = this.path[this.path.length - 1];
    if (lastStep.equals(step)) {
      return true;
    }
    if (lastStep.isValidStep(step)) {
      return true;
    }
    return false;
  }

  private raisePopup(message: string, buttons?: any) {
    this.audio.wrongStep.play();
    return this.dialog.open(CustomAlertDialogComponent, {
      data: {
        mainContent: message,
        buttons: buttons
      }
    })
  }

  private gameOver(redo: boolean) {
    // this.stopTimer();
    this.storeInfo();
    this.audio.gameOver.play();
    if (redo) {
      const popupRef = this.raisePopup('You almost got it! But, there is a better solution with fewer steps \n' +
        ' I hope you like challenges! :)', ['Let\'s do it again', 'That\'s all I got! Next level', 'Quit']);
      popupRef.afterClosed().subscribe(result => {
        if (result === 'Let\'s do it again') {
          this.loadNextLevel(this.currLevelNumber);
        } else if (result === 'Quit') {
          this.triggerGameOver();
        } else {
          this.loadNextLevel(this.currLevelNumber + 1);
        }
      })
      return;
    }

    const dialogRef = this.dialog.open(GameOverAlertComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Let\'s Go!') {
        this.loadNextLevel(this.currLevelNumber + 1);
      } else {
        this.triggerGameOver();
      }
    })
  }

  quitGame(event) {
    this.triggerGameOver();
  }
}

export class Step {
  private _row: number;
  private _col: number;
  private _val: number;

  constructor(row: number, col: number, val: number) {
    this._row = row;
    this._col = col;
    this._val = val;
  }

  get row(): number {
    return this._row;
  }

  get col(): number {
    return this._col;
  }
  get val(): number {
    return this._val;
  }
  public isValidStep(step: Step): boolean {
    return (this.isRightOrDown(step) || this.isDiagonal(step));
  }
  public  isRightOrDown(step: Step): boolean {
    return ((this._row === step._row && this._col === (step._col - 1)) || (this._row === (step._row - 1) && this._col === step._col));
  }
  public isDiagonal(step: Step): boolean {
    return this.row === (step._row - 1) && this._col === (step._col - 1);
  }
  public equals(step: Step): boolean {
    if (this._row === step.row && this.col === step._col) {
      return true;
    }
    return false;
  }
}

