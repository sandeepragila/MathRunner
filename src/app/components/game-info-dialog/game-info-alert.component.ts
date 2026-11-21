import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({selector: 'app-game-info', templateUrl: './game-info-alert.component.html',
  styleUrls: ['./game-info-alert.component.css']})
export class GameInfoAlertComponent {
  currIndex = -1;
  instructions = [
    'Start at the top-left cell. Its number is your starting total. The goal is at the bottom-right.',
    'Move one cell right or down to add the number in that cell to your total.',
    'Move diagonally down-right to multiply your total by the number in that cell.',
    'Reach the target total before entering the goal. The goal adds nothing. Select your last cell again to undo it. ' +
      'Find a path with as few cells as possible for the highest score.'
  ];
  constructor(private dialogRef: MatDialogRef<GameInfoAlertComponent>) { dialogRef.disableClose = true; }

  onClick(action: string): void {
    if (action === 'go') { this.dialogRef.close(); return; }
    this.currIndex = Math.max(-1, Math.min(this.instructions.length - 1, this.currIndex + (action === 'next' ? 1 : -1)));
  }
}
