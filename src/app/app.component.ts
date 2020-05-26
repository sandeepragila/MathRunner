import {AfterViewInit, ChangeDetectorRef, Component} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ThemePalette} from '@angular/material/core';
import {MatDialog} from '@angular/material/dialog';
import {GameOverAlertComponent} from './components/game-over-alert-dialog/game-over-alert.component';
import {CustomAlertDialogComponent} from './components/custom-alert-dialog/custom-alert-dialog.component';
import {GameConstants, GameSummaryInfo, LevelInfo} from './GameConstants';
import {GameSummaryAlertComponent} from './components/game-summary-dialog/game-summary-alert.component';
import {GameInfoAlertComponent} from './components/game-info-dialog/game-info-alert.component';

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
  currLevelNumber = 0;
  display = false;
  startGame = false;
  path: Array<Step> = [];
  timer;
  timeLeft;
  gameSummaryInfo: Map<number, GameSummaryInfo> = new Map();
  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
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
    this.display = true;
    this.cdr.detectChanges();
    this.addMatrixListeners();
    this.startGame = true;
    this.startTimer();
    })
  }
  private loadNextLevel(level: number) {
    this.path = [];
    this.startGame = false;
    this.display = false;
    this.result = 0;
    this.currLevelInfo = undefined;
    this.cdr.detectChanges();
    this.currLevelInfo = GameConstants.getGameLevel(level);
    this.display = true;
    this.cdr.detectChanges();
    this.addMatrixListeners();
    this.startGame = true;
    this.startTimer();
  }
  private checkGameOver(level: number): boolean {
    if (level === GameConstants.GameLevels.length) {
      const ref =  this.dialog.open(GameSummaryAlertComponent, {
        data: {
          gameSummaryInfo: this.gameSummaryInfo
        }
      });
      ref.afterClosed().subscribe(result => {
        window.location.reload();
      });
      return true;
    }
    return false;
  }

  public highlight(event) {
    if (!this.startGame) {
      return;
    }
    const target = event.target || event.srcElement || event.currentTarget;
    const index = Number(target.parentElement.dataset.index);
    if ((index + 1) === this.currLevelInfo.matrix.length) {
      target.style.background = '#ce4e4e';
      if (this.result === this.currLevelInfo.solution) {
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
    const row = Math.floor((index / this.currLevelInfo.cols));
    const col = index % this.currLevelInfo.cols;
    const step = new Step(row, col,  index === 0 ? this.currLevelInfo.matrix[0] : Number(target.textContent));
    if (!this.validate(step)) {
      return;
    }
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
    this.raisePopup('Wrong step! Please follow the rules');
    return false;
  }
  private raisePopup(message: string, buttons?: any) {
    return this.dialog.open(CustomAlertDialogComponent, {
      data: {
        mainContent: message,
        buttons: buttons
      }
    })
  }
  private gameOver(redo: boolean) {
    this.stopTimer();
    if (redo) {
      const popupRef = this.raisePopup('You almost got it! But, there is a better solution with fewer steps \n' +
        ' I hope you like challenges! :)', ['Let\'s do it again', 'That\'s all I got! Next level', 'Quit']);
      popupRef.afterClosed().subscribe(result => {
        if (result === 'Let\'s do it again') {
          this.loadNextLevel(this.currLevelNumber);
        } else if (result === 'Quit') {
          this.currLevelNumber = GameConstants.GameLevels.length;
          this.checkGameOver(this.currLevelNumber);
        } else {
          if (this.checkGameOver(++this.currLevelNumber)) {
            return;
          }
          this.loadNextLevel(this.currLevelNumber);
        }
      })
      return;
    }
    ++this.currLevelNumber
    if (this.checkGameOver(this.currLevelNumber)) {
      return;
    }
    const dialogRef = this.dialog.open(GameOverAlertComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Let\'s Go!') {
        this.loadNextLevel(this.currLevelNumber);
      } else {
        this.currLevelNumber = GameConstants.GameLevels.length;
        this.checkGameOver(this.currLevelNumber);
      }
    })
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

