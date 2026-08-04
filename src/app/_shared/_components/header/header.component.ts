import { Component, ChangeDetectionStrategy, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { SideMenuComponent } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule, SideMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly router = inject(Router);

  @ViewChild(SideMenuComponent) sideMenu!: SideMenuComponent;

  /** Open the side menu */
  openSideMenu(): void {
    this.sideMenu?.openMenu();
  }

  /** Retour a l'accueil en cliquant sur le titre Ketal */
  goHome(): void {
    this.router.navigate(['/home']);
  }
}
