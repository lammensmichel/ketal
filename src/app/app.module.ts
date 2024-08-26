import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import {GameRoomComponent} from 'src/app/_components/game/game-room/game-room.component';
import {PlayersListComponent} from 'src/app/_components/players/players-list/players-list.component';
import {CardDeckHelperService} from 'src/app/_shared/_helpers/card-deck.helper';
import {PlayerHelperService} from 'src/app/_shared/_helpers/player.helper';
import {LocalService} from 'src/app/services/local/local.service';
import {WebsocketService} from 'src/app/services/websocket/websocket.service';
import {environment} from 'src/environments/environment';
import {GameComponent} from './_components/game/game/game.component';
import { PlayerListPlayerComponent } from './_components/players/player-list-player/player-list-player.component';
import {FooterComponent} from './_shared/_components/footer/footer.component';
import {HeaderComponent} from './_shared/_components/header/header.component';
import {PlayingCardComponent} from './_shared/_components/playing-card/playing-card.component';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import { GameSummaryComponent } from './_components/game/game-summary/game-summary.component';
import { PlayerGivenSipsSelectionComponent } from './_components/players/player-given-sips-selection/player-given-sips-selection.component';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayerCardComponent } from './_components/players/player-card/player-card.component';
import { MainGameComponent } from './_components/game/main-game/main-game.component';
import { ToastComponent } from './_shared/_components/toast/toast.component';

const config: SocketIoConfig = {url: environment.socketIoUrl, options: {}};

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    PlayersListComponent,
    GameComponent,
    PlayingCardComponent,
    FooterComponent,
    HeaderComponent,
    GameRoomComponent,
    PlayerListPlayerComponent,
    GameSummaryComponent,
    PlayerGivenSipsSelectionComponent,
    PlayerCardComponent,
    MainGameComponent,
    ToastComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    PlayerHelperService,
    CardDeckHelperService,
    LocalService,
    WebsocketService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
