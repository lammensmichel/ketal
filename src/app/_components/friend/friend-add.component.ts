import { Component, signal, effect, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService, FriendProfile } from '../../services/friend/friend.service';

@Component({
  selector: 'app-friend-add',
  templateUrl: './friend-add.component.html',
  styleUrls: ['./friend-add.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, FontAwesomeIconsModule],
})
export class FriendAddComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly friendSrv = inject(FriendService);
  private readonly authService = inject(AuthService);

  /** Current user's friends */
  readonly friends = this.friendSrv.friends;

  /** Search results from user search */
  readonly searchResults = signal<FriendProfile[]>([]);
  readonly isSearching = signal(false);

  /** Search input */
  readonly searchQuery = signal('');

  /** Current user */
  readonly currentUser = this.authService.currentUser();

  /** Loaded state */
  readonly isLoaded = signal(false);
  readonly loadError = signal<string | null>(null);

  /** Avatar error state */
  avatarError = false;

  /** Effect to reload friends when auth state changes */
  private readonly authEffect = effect(
    () => {
      if (this.authService.isLoggedIn()) {
        this.loadFriends();
      }
    },
    { allowSignalWrites: true }
  );

  ngOnInit(): void {
    // Load friends when component initializes
    if (this.authService.isLoggedIn()) {
      this.loadFriends();
    }
  }

  /** Load friends from service */
  loadFriends(): void {
    this.isLoaded.set(false);
    this.loadError.set(null);

    this.friendSrv.getFriends().then(
      () => {
        this.isLoaded.set(true);
        // Re-filter search results if any
        if (this.searchQuery().trim()) {
          this.searchUsers(this.searchQuery());
        }
      },
      (error: any) => {
        this.isLoaded.set(true);
        this.loadError.set('Failed to load friends');
        console.error('[FriendAddComponent] Failed to load friends:', error);
      }
    );
  }

  /** Search users by nickname */
  async searchUsers(query: string): Promise<void> {
    const trimmed = query.trim();
    if (!trimmed) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.searchResults.set([]);

    try {
      const users = await this.friendSrv.searchUsersByNickname(trimmed);

      // Map to FriendProfile without isFriend flag (search results are not friends yet)
      const results: FriendProfile[] = users.map((user) => ({
        userId: user['$id'] as string,
        name: (user['nickname'] as string) || (user['name'] as string) || 'Unknown',
        avatar: user['avatar'] as string | undefined,
        isFriend: false,
      }));

      this.searchResults.set(results);
    } catch (error) {
      console.error('[FriendAddComponent] Search failed:', error);
      // Don't show error - user just didn't find anyone
    } finally {
      this.isSearching.set(false);
    }
  }

  /** Add friend by nickname */
  async addFriendByNickname(nickname: string): Promise<void> {
    try {
      await this.friendSrv.addFriendByNickname(nickname);
      // Reload friends list
      await this.loadFriends();
      // Clear search
      this.searchQuery.set('');
      this.searchResults.set([]);
      // TODO: Show success toast
    } catch (error: any) {
      // TODO: Show error toast
      console.error('[FriendAddComponent] Failed to add friend:', error);
    }
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
}
