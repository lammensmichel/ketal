import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainGameComponent } from '../main-game/main-game.component';
import { GameService } from '../../../services/game/game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainGameComponent],
})
export class GameComponent implements OnInit {
  private readonly gameSrv = inject(GameService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.gameSrv.isGameInProgress()) {
      this.router.navigate(['/players']);
    }
  }
}
