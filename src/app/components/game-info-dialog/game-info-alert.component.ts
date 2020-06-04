import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-game-info',
  templateUrl: './game-info-alert.component.html',
  styleUrls: ['./game-info-alert.component.css']
})

export class GameInfoAlertComponent {

  CLICK_ACTION = {BACK: 'Back', NEXT: 'Next', GO: 'Let\'s Go!'};
  toggle = true;
  nextButton = {
      id: 'next',
      name: 'Next'
    };
  backButton = {
      id: 'back',
      name: 'Back'
    };
  goButton = {
      id: 'go',
      name: 'Let\'s Go!'
    };
  buttons = [
    {
      id: 'next',
      name: 'Next'
    }
  ];

  instructions = [
    {
      id: 1,
      image: 'assets/images/instruction-1.PNG',
      visible: true
    },
    {
      id: 2,
      image: 'assets/images/instruction-2.PNG',
      visible: false
    },
    {
      id: 3,
      image: 'assets/images/instruction-3.PNG',
      visible: false
    },
    {
      id: 4,
      image: 'assets/images/instruction-4.PNG',
      visible: false
    },
  ]
  currImage = this.instructions[0];
  currIndex = -1;

  constructor(private dialogRef: MatDialogRef<GameInfoAlertComponent>) {
    dialogRef.disableClose = true;
  }

  onClick(event) {
    const target = event.target || event.srcElement || event.currentTarget;
    const id = target.innerText;
    if (this.currIndex === -1 || (this.currIndex === 0 && id === this.CLICK_ACTION.BACK)) {
      this.toggle = !this.toggle;
    }

    if (id === this.CLICK_ACTION.NEXT) {
      this.currIndex += 1;
    } else if (id === this.CLICK_ACTION.BACK) {
      this.currIndex -= 1;
    } else if (id === this.CLICK_ACTION.GO) {
      this.dialogRef.close();
      return;
    }

    this.addButtons();
    this.currImage = this.instructions[this.currIndex];
  }

  private addButtons() {
    if (this.currIndex >= 0 && this.currIndex <= 1) {
      this.buttons = [this.backButton, this.nextButton];
    }
    if (this.currIndex === -1) {
      this.buttons = [this.nextButton];
    }
    if (this.currIndex === this.instructions.length - 1) {
      this.buttons = [this.backButton, this.goButton];
    }
  }

  public get width() {
    return window.innerWidth;
  }
}
