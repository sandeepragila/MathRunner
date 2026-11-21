import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Board} from '../../game/game-session';

@Component({selector: 'app-game-board', templateUrl: './game-board.component.html', styleUrls: ['./game-board.component.css']})
export class GameBoardComponent {
  @Input() board: Board;
  @Input() path: number[] = [];
  @Input() disabled = false;
  @Output() choose = new EventEmitter<number>();
  private dragging = false;
  private lastPointerIndex = -1;

  label(index: number): string {
    const cell = `Row ${Math.floor(index / this.board.cols) + 1}, column ${index % this.board.cols + 1}`;
    return `${cell}: ${index === this.board.matrix.length - 1 ? 'goal, target ' + this.board.solution : this.board.matrix[index]}` +
      (index === 0 ? ', start here' : '');
  }

  pointerDown(event: PointerEvent, index: number): void {
    if (event.button !== 0 || this.disabled) { return; }
    event.preventDefault();
    (event.currentTarget as HTMLElement).focus();
    this.dragging = true;
    this.lastPointerIndex = index;
    this.choose.emit(index);
  }

  @HostListener('document:pointermove', ['$event'])
  pointerMove(event: PointerEvent): void {
    if (!this.dragging || this.disabled) { return; }
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const button = target && target.closest('button[data-cell]') as HTMLElement;
    if (!button || !button.closest('app-game-board')) { return; }
    const index = Number(button.dataset.cell);
    if (index !== this.lastPointerIndex) { this.lastPointerIndex = index; this.choose.emit(index); }
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  @HostListener('window:blur')
  stopDrag(): void { this.dragging = false; this.lastPointerIndex = -1; }

  click(event: MouseEvent, index: number): void {
    // Pointer presses were handled above; keyboard and assistive clicks have detail zero.
    if (event.detail === 0 && !this.disabled) { this.choose.emit(index); }
  }

  key(event: KeyboardEvent, index: number): void {
    const offsets = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: this.board.cols, ArrowUp: -this.board.cols};
    if (!(event.key in offsets)) { return; }
    event.preventDefault();
    const next = index + offsets[event.key];
    if (next < 0 || next >= this.board.matrix.length ||
        ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
          Math.floor(next / this.board.cols) !== Math.floor(index / this.board.cols))) { return; }
    const board = (event.currentTarget as HTMLElement).parentElement;
    (board.children[next] as HTMLElement).focus();
  }
}
