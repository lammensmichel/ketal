import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PlayersListComponent } from 'src/players/players-list/players-list.component';
import { PlayerHelperService } from 'src/helpers/player.helper';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';
import { GameComponent } from '../game/game.component';
import { secondPhaseComponent } from '../second-phase/second-phase.component';
import { LocalService } from 'src/app/services/local/local.service';
import { PlayingCardComponent } from './playing-card/playing-card.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayersListComponent,
    GameComponent,
    secondPhaseComponent,
    PlayingCardComponent,
    FooterComponent,
    HeaderComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule],
  providers: [PlayerHelperService, CardDeckHelperService, LocalService],
  bootstrap: [AppComponent],
})
export class AppModule {}