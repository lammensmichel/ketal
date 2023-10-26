import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import {GameRoomComponent} from "./_components/game/game-room/game-room.component";
import {PlayersListComponent} from 'src/app/_components/players/players-list/players-list.component';
import {CardDeckHelperService} from 'src/app/_shared/_helpers/card-deck.helper';
import {PlayerHelperService} from 'src/app/_shared/_helpers/player.helper';
import {LocalService} from 'src/app/services/local/local.service';
import {WebsocketService} from 'src/app/services/websocket/websocket.service';
import {GameComponent} from "./_components/game/game/game.component";
import {secondPhaseComponent} from './_components/second-phase/second-phase.component';
import {FooterComponent} from './_shared/_components/footer/footer.component';
import {HeaderComponent} from './_shared/_components/header/header.component';
import {PlayingCardComponent} from './_shared/_components/playing-card/playing-card.component';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {environment} from 'src/environments/environment';
import { PlayerListPlayerComponent } from './_components/players/player-list-player/player-list-player.component';

const config: SocketIoConfig = {url: environment.socketIoUrl, options: {}};

@NgModule({
  declarations: [
    AppComponent,
    PlayersListComponent,
    GameComponent,
    secondPhaseComponent,
    PlayingCardComponent,
    FooterComponent,
    HeaderComponent,
    GameRoomComponent,
    PlayerListPlayerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SocketIoModule.forRoot(config)],
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
