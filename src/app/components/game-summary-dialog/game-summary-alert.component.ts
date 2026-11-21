import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({selector: 'app-game-summary', templateUrl: './game-summary-alert.component.html',
  styleUrls: ['./game-summary-alert.component.css']})
export class GameSummaryAlertComponent {
  displayedColumns = ['mode', 'levelsCompleted'];
  tableData: Array<{mode: string; levelsCompleted: number}>;
  totalScore: number;

  constructor(@Inject(MAT_DIALOG_DATA) data: {totalScore: number; levelsCompleted: Map<string, number>},
              private dialogRef: MatDialogRef<GameSummaryAlertComponent>) {
    dialogRef.disableClose = true;
    this.totalScore = data.totalScore;
    this.tableData = Array.from(data.levelsCompleted, ([mode, levelsCompleted]) => ({mode, levelsCompleted}));
  }
}
