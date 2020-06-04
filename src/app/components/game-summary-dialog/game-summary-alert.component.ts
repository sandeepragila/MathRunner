import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {GameSummaryInfo} from '../../GameConstants';

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary-alert.component.html'
})

export class GameSummaryAlertComponent {
  gameSummaryInfo: Map<number, GameSummaryInfo> = new Map();
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<GameSummaryAlertComponent>) {
    this.dialogRef.disableClose = true;
    this.gameSummaryInfo = data.gameSummaryInfo;
  }

  onClick(event) {
    window.location.reload();
  }
}
