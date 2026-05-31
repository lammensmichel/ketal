import { Component, signal, OnInit, inject, DestroyRef, TemplateRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService, FriendProfile } from '../../services/friend/friend.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  standalone: true,
  imports: [NgClass, TranslateModule, FontAwesomeIconsModule],
})
export class FriendsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly friendSrv = inject(FriendService);

  /** Current user */
  readonly currentUser = this.authService.currentUser();

  /** Is current user authenticated? */
  readonly isLoggedIn = this.authService.isLoggedIn;

  /** Friend list from service */
  readonly friends = this.friendSrv.friends;

  /** Current user's friend profiles (signal from service) */
  readonly friendProfiles = this.friendSrv.friendProfiles;

  /** Filter for searching friends by nickname */
  readonly searchFilter = signal('');

  /** Computed list of friends matching search filter */
  filteredFriendList = signal<FriendProfile[]>([]);

  /** Avatar error state */
  avatarError = false;

  /** Modal references */
  modalRef: any;
  qrModalRef: any;

  @ViewChild('addModal') addModal!: TemplateRef<any>;
  @ViewChild('qrModal') qrModal!: TemplateRef<any>;

  // Add friend modal signals
  readonly searchQuery = signal('');
  readonly isSearching = signal(false);
  readonly searchResults = signal<FriendProfile[]>([]);
  readonly isLoaded = signal(false);

  // QR scanner signals
  readonly isScanning = signal(false);
  readonly scanError = signal<string | null>(null);
  readonly scanResult = signal<string | null>(null);

  // QR code modal
  readonly friendQrUrl = signal<string | null>(null);
  readonly qrScale = 4;
  readonly qrWidth = 256;
  readonly qrErrorCorrectionLevel = 'M';

  ngOnInit(): void {
    // Load friends when component initializes
    if (this.authService.isLoggedIn()) {
      this.friendSrv.getFriends();
    }

    // Update filtered list when search filter changes
    this.friendProfiles.subscribe((profiles) => {
      const filter = this.searchFilter().toLowerCase().trim();
      if (!filter) {
        this.filteredFriendList.set(profiles);
      } else {
        this.filteredFriendList.set(profiles.filter((p: FriendProfile) => p.name.toLowerCase().includes(filter)));
      }
    });
  }

  /** Get friend's avatar URL or fallback */
  getAvatarUrl(friend: FriendProfile): string | null {
    if (friend.avatar) {
      return friend.avatar;
    }
    const name = friend.name;
    if (!name) {
      return null;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
  }

  /** Get friend status badge */
  getStatusBadge(friend: FriendProfile): string | null {
    if (friend.userId === this.authService.currentUser()?.['$id']) {
      return 'You';
    }
    return null;
  }

  /** Remove friend from list */
  removeFriend(friendUserId: string): void {
    if (!confirm('Remove this friend?')) {
      return;
    }

    this.friendSrv.removeFriend(friendUserId).catch((error: any) => {
      console.error('[FriendsComponent] Failed to remove friend:', error);
    });
  }

  openAddModal(): void {
    // Reset search when opening modal
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isLoaded.set(false);

    // Show modal (requires ng-bootstrap modal)
    // this.modalRef = this.modalService.show(this.addModal);
  }

  openQrModal(): void {
    // Generate QR URL for current user
    const currentUser = this.authService.currentUser();
    if (currentUser?.$id) {
      this.friendQrUrl.set(JSON.stringify({ type: 'friend_add', userId: currentUser.$id }));
    }
    // this.qrModalRef = this.modalService.show(this.qrModal);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchFilter.set(value);
  }

  searchUsers(query: string): void {
    if (!query.trim()) {
      return;
    }
    this.isSearching.set(true);
    this.searchResults.set([]);

    this.friendSrv
      .searchUsersByNickname(query)
      .then((users) => {
        this.isSearching.set(false);
        this.searchResults.set(users);
      })
      .catch((error: any) => {
        console.error('[FriendsComponent] Search failed:', error);
        this.isSearching.set(false);
        this.searchError.set(error instanceof Error ? error.message : 'Search failed');
      });
  }

  addFriendByNickname(nickname: string): void {
    this.friendSrv
      .addFriendByNickname(nickname)
      .then(() => {
        // Refresh friends list
        this.friendSrv.getFriends();
      })
      .catch((error: any) => {
        console.error('[FriendsComponent] Failed to add friend:', error);
      });
  }

  copyQrCode(): void {
    if (this.friendQrUrl()) {
      navigator.clipboard
        .writeText(this.friendQrUrl()!)
        .then(() => {
          alert('QR code URL copied to clipboard!');
        })
        .catch((error: any) => {
          console.error('Failed to copy:', error);
        });
    }
  }

  // QR scanner methods
  startScan(): void {
    this.isScanning.set(true);
    this.scanError.set(null);
    this.scanResult.set(null);

    // TODO: Implement QR scanning logic
  }

  handleScanResult(result: string): void {
    this.isScanning.set(false);
    this.scanResult.set(result);
    this.scanError.set(null);

    // Try to parse and add friend
    try {
      const data = JSON.parse(result);
      if (data.type === 'friend_add' && data.userId) {
        this.friendSrv.addFriendByQr(data.userId);
      }
    } catch (e) {
      this.scanError.set('Invalid QR code format');
    }
  }
}
