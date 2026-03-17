import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
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
  @ViewChild(SideMenuComponent) sideMenu!: SideMenuComponent;

  /** Open the side menu */
  openSideMenu(): void {
    this.sideMenu?.openMenu();
  }
}
