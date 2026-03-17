import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainGameComponent } from '../main-game/main-game.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainGameComponent],
})
export class GameComponent {}
