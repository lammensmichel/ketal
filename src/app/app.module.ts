import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PlayersListComponent } from 'src/players/players-list/players-list.component';
import { PlayerHelperService } from 'src/helpers/player.helper';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';
import { GameComponent } from '../game/game.component';
import { secondPhaseComponent } from '../second-phase/second-phase.component';
import { LocalService } from 'src/app/services/local/local.service';
import { PlayingCardComponent } from './playing-card/playing-card.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { GameRoomComponent } from 'src/game-room/game-room.component';
import { WebsocketService } from 'src/websocket/websocket.service';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [
    PlayerHelperService,
    CardDeckHelperService,
    LocalService,
    WebsocketService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
