import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayersListComponent } from './players-list/players-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [PlayersListComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class PlayersModule {}
