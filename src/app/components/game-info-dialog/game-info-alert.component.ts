import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-game-info',
  templateUrl: './game-info-alert.component.html',
  styleUrls: ['./game-info-alert.component.css']
})

export class GameInfoAlertComponent {
  constructor(private dialogRef: MatDialogRef<GameInfoAlertComponent>) {
    dialogRef.disableClose = true;
  }
}
