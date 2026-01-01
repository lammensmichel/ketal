import { Component } from '@angular/core';
import { MainGameComponent } from '../main-game/main-game.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  standalone: true,
  imports: [MainGameComponent],
})
export class GameComponent {}
