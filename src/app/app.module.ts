import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {CookieService} from 'ngx-cookie-service';
import {AppComponent} from './app.component';
import {CustomAlertDialogComponent} from './components/custom-alert-dialog/custom-alert-dialog.component';
import {GameSummaryAlertComponent} from './components/game-summary-dialog/game-summary-alert.component';
import {GameInfoAlertComponent} from './components/game-info-dialog/game-info-alert.component';
import {GameBoardComponent} from './components/game-board/game-board.component';
import {GameNewsAlertComponent} from './components/game-news-dialog/game-news-alert.component';
import {GameOverAlertComponent} from './components/game-over-alert-dialog/game-over-alert.component';
import {AudioService} from './audio/audio.service';
import {LevelGeneratorService} from './service/level-generator.service';
import {GameStorageService} from './service/game-storage.service';

@NgModule({
  declarations: [AppComponent, CustomAlertDialogComponent, GameSummaryAlertComponent, GameInfoAlertComponent,
    GameBoardComponent, GameNewsAlertComponent, GameOverAlertComponent],
  imports: [BrowserModule, BrowserAnimationsModule, MatButtonModule, MatDialogModule, MatTableModule],
  providers: [CookieService, AudioService, LevelGeneratorService, GameStorageService],
  bootstrap: [AppComponent]
})
export class AppModule {}
