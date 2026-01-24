import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { GameService } from '../../../services/game/game.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

/** Routes where game controls should be hidden */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

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

  /** Current URL path as a signal */
  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Whether current route is an auth page */
  readonly isAuthPage = computed(() => {
    const path = this.currentPath();
    return AUTH_ROUTES.some((route) => path.startsWith(route));
  });

  restartGame(): void {
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }
}
