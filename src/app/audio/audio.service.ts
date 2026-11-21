import {AudioFiles} from '../GameConstants';
import {Injectable} from '@angular/core';

@Injectable()
export class AudioService {
  muted = false;
  private sounds: Record<string, HTMLAudioElement> = {};
  private backgroundStarted = false;

  play(name: 'walk' | 'gameOver' | 'wrongStep'): void {
    if (this.muted) { return; }
    const files = {walk: AudioFiles.WALK, gameOver: AudioFiles.GAME_OVER, wrongStep: AudioFiles.WRONG_STEP};
    const sound = this.sounds[name] || (this.sounds[name] = new Audio(files[name]));
    sound.currentTime = 0;
    const playback = sound.play();
    if (playback) { playback.catch(() => undefined); }
  }

  startBackground(): void {
    this.backgroundStarted = true;
    if (this.muted) { return; }
    const sound = this.sounds.background || (this.sounds.background = new Audio(AudioFiles.BACK_GROUND));
    sound.loop = true;
    sound.volume = 0.25;
    if (sound.paused === false) { return; }
    const playback = sound.play();
    if (playback) { playback.catch(() => undefined); }
  }

  toggle(): void {
    this.muted = !this.muted;
    if (this.muted) { Object.keys(this.sounds).forEach(name => this.sounds[name].pause()); } else if (this.backgroundStarted) {
      this.startBackground();
    }
  }
}
