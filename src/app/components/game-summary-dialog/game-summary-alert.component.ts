import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {GameSummaryInfo} from '../../GameConstants';

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary-alert.component.html',
  styleUrls: ['./game-summary-alert.component.css']
})

export class GameSummaryAlertComponent {
  displayedColumns: string[] = ['mode', 'levelsCompleted'];
  gameSummaryInfo: Map<number, GameSummaryInfo> = new Map();
  levelsCompleted: Map<string, number> = new Map();
  tableData: GameData[] = [];
  totalScore: number;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<GameSummaryAlertComponent>) {
    this.dialogRef.disableClose = true;
    this.gameSummaryInfo = data.gameSummaryInfo;
    this.totalScore = data.totalScore;
    this.calculateDisplayData();
  }

  private calculateDisplayData() {
    this.gameSummaryInfo.forEach((value, key) => {
      if (this.levelsCompleted.has(value.mode)) {
        this.levelsCompleted.set(value.mode, this.levelsCompleted.get(value.mode) + 1);
      } else {
        this.levelsCompleted.set(value.mode, 1);
      }
    });
    this.levelsCompleted.forEach(((value, key) => {
      this.tableData.push({mode: key, levelsCompleted: value});
    }));
  }

  onClick(event) {
    window.location.reload();
  }
}

export interface GameData {
  mode: string;
  levelsCompleted: number;
}
