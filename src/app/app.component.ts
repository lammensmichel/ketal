import {Component} from '@angular/core';
import {GameService} from "./services/game/game.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ketal';

  constructor(public gameSrv: GameService) {
  }
}
