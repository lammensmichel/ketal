import { Component, computed, signal, effect, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService, FriendProfile } from '../../services/friend/friend.service';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, FontAwesomeIconsModule],
})
export class FriendListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly friendSrv = inject(FriendService);
  private readonly authService = inject(AuthService);

  /** Current user's friends (signal from service) */
  readonly friends = this.friendSrv.friends;

  /** Current user's friend profiles (signal from service) */
  readonly friendProfiles = this.friendSrv.friendProfiles;

  /** Filter for searching friends by nickname */
  readonly searchFilter = signal('');

  /** Computed list of friends matching search filter */
  readonly filteredFriends = computed(() => {
    const filter = this.searchFilter().toLowerCase().trim();
    if (!filter) {
      return this.friendProfiles();
    }

    return this.friendProfiles().filter((profile: FriendProfile) => profile.name.toLowerCase().includes(filter));
  });

  /** Avatar error state */
  avatarError = false;

  /** Load friends on init */
  ngOnInit(): void {
    // Load friends when component initializes
    // Only if user is authenticated
    if (this.authService.isLoggedIn()) {
      this.loadFriends();
    }

    // Re-load when auth state changes
    effect(
      () => {
        if (this.authService.isLoggedIn()) {
          this.loadFriends();
        }
      },
      { allowSignalWrites: true }
    );
  }

  /** Load friends from service */
  loadFriends(): void {
    this.friendSrv.getFriends().catch((error: any) => {
      console.error('[FriendListComponent] Failed to load friends:', error);
      // TODO: Show error toast
    });
  }

  /** Remove friend from list */
  removeFriend(friendUserId: string): void {
    if (!confirm('Remove this friend?')) {
      return;
    }

    this.friendSrv.removeFriend(friendUserId).catch((error: any) => {
      console.error('[FriendListComponent] Failed to remove friend:', error);
      // TODO: Show error toast
    });
  }

  /** Get friend's avatar URL or fallback */
  getAvatarUrl(friend: FriendProfile): string | null {
    if (friend.avatar) {
      return friend.avatar;
    }
    // Generate initials from name
    const name = friend.name;
    if (!name) {
      return null;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=0D8ABC&color=fff`;
  }

  /** Get friend status badge */
  getStatusBadge(friend: FriendProfile): string | null {
    if (friend.userId === this.authService.currentUser()?.['$id']) {
      return 'You';
    }
    return null;
  }
}
