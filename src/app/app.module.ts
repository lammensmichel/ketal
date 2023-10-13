import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PlayersListComponent } from 'src/players/players-list/players-list.component';
import { Routes } from '@angular/router';
import { GameComponent } from '../game/game.component';

@NgModule({
  declarations: [AppComponent, PlayersListComponent, GameComponent],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
