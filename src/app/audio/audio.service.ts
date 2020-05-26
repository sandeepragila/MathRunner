import {AudioFiles} from '../GameConstants';
import {Injectable} from '@angular/core';

@Injectable()
export class AudioService {
  walk;
  gameOver;
  wrongStep;
  bg;

  constructor() {
    this.walk = this.loadSound(AudioFiles.WALK);
    this.gameOver = this.loadSound(AudioFiles.GAME_OVER);
    this.wrongStep = this.loadSound(AudioFiles.WRONG_STEP);
    this.bg = this.loadSound(AudioFiles.BACK_GROUND);
  }
  private loadSound(src: string){
    const audio = new Audio();
    audio.src = src;
    audio.load();
    return audio;
  }
}
