import { Component } from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-game-over-alert',
  templateUrl: './game-over-alert.component.html'
})
export class GameOverAlertComponent {
  constructor(private dialogRef: MatDialogRef<GameOverAlertComponent>) {
    dialogRef.disableClose = true;
  }
}
