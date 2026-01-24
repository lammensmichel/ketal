import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { GameService } from '../../../services/game/game.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule, UserMenuComponent],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly gameSrv = inject(GameService);

  restartGame(): void {
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }
}
