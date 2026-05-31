import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { AuthService } from '../../services/auth/auth.service';
import { FriendListComponent } from './friend-list.component';
import { FriendAddComponent } from './friend-add.component';
import { QrScannerComponent } from './qr-scanner.component';

type TabId = 'list' | 'add' | 'qr';

interface Tab {
  id: TabId;
  label: string;
  icon: [string, string];
}

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    TranslateModule,
    FontAwesomeIconsModule,
    FriendListComponent,
    FriendAddComponent,
    QrScannerComponent,
  ],
})
export class FriendsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  /** Current active tab */
  readonly activeTab = signal<'list' | 'add' | 'qr'>('list');

  /** Current user */
  readonly currentUser = this.authService.currentUser();

  /** Is current user authenticated? */
  readonly isLoggedIn = this.authService.isLoggedIn;

  /** Tab labels */
  readonly tabs: Tab[] = [
    { id: 'list', label: 'friends.tabFriends', icon: ['fas', 'users'] as const },
    { id: 'add', label: 'friends.tabAdd', icon: ['fas', 'user-plus'] as const },
    { id: 'qr', label: 'friends.tabQr', icon: ['fas', 'qrcode'] as const },
  ];

  /** Switch to a tab */
  switchTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  /** Get active tab class */
  getTabClass(tabId: string): object {
    return {
      'tab-link': true,
      active: this.activeTab() === tabId,
    };
  }

  /** Initialize component */
  ngOnInit(): void {
    // Friend component initialization
  }
}
