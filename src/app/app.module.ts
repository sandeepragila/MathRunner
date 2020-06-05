import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig} from '@angular/platform-browser';
import {Injectable, NgModule} from '@angular/core';

import { AppComponent } from './app.component';
import {DemoMaterialModule} from './material-module';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatNativeDateModule} from '@angular/material/core';
import {GameOverAlertComponent} from './components/game-over-alert-dialog/game-over-alert.component';
import {MatDialogModule} from '@angular/material/dialog';
import {CustomAlertDialogComponent} from './components/custom-alert-dialog/custom-alert-dialog.component';
import {GameSummaryAlertComponent} from './components/game-summary-dialog/game-summary-alert.component';
import {GameInfoAlertComponent} from './components/game-info-dialog/game-info-alert.component';
import {MatCardModule} from '@angular/material/card';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {AudioService} from './audio/audio.service';
import {LevelGeneratorService} from './service/level-generator.service';
import {MatTableModule} from '@angular/material/table';

@NgModule({
  exports: [
    MatDialogModule,
    MatCardModule
  ]
})
export class MaterialModule { }

@Injectable()
export class MyHammerConfig extends HammerGestureConfig  {
  overrides = <any>{
    'swipe': {velocity: 0.4, threshold: 20} // override default settings
  }
}

@NgModule({
  declarations: [
    AppComponent,
    GameOverAlertComponent,
    CustomAlertDialogComponent,
    GameSummaryAlertComponent,
    GameInfoAlertComponent
  ],
  imports: [
    NgbModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    DemoMaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatTableModule
  ],
  entryComponents: [GameInfoAlertComponent, GameOverAlertComponent, CustomAlertDialogComponent, GameSummaryAlertComponent],
  providers: [AudioService, LevelGeneratorService, {
    provide: HAMMER_GESTURE_CONFIG,
    useClass: MyHammerConfig
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }

