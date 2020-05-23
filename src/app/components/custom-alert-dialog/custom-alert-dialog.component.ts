import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert-dialog.component.html'
})

export class CustomAlertDialogComponent {
  mainContent = 'Oops! Thats too much';
  buttonsText = ['Ok'];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<CustomAlertDialogComponent>) {
    if (data) {
      this.mainContent = data.mainContent || this.mainContent;
      if (data.buttons) {
        this.buttonsText = data.buttons;
      }
    }
  }
}
