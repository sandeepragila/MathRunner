import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-game-over-alert',
  templateUrl: './game-over-alert.component.html'
})
export class GameOverAlertComponent {
  points: number;
  constructor(@Inject(MAT_DIALOG_DATA) private data: any,
              private dialogRef: MatDialogRef<GameOverAlertComponent>) {
    dialogRef.disableClose = true;
    this.points = data.points;
  }
}
