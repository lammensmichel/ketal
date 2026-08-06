import { Component, signal, computed, OnInit, inject, DestroyRef, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService, FriendProfile } from '../../services/friend/friend.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule, NgbModule, FormsModule, QRCodeComponent],
})
export class FriendsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly friendSrv = inject(FriendService);
  private readonly modalService = inject(NgbModal);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Retour utilisateur apres un scan de QR (cle de traduction, ou null) */
  readonly inviteFeedback = signal<string | null>(null);

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
  readonly filteredFriendList = computed(() => {
    const profiles = this.friendProfiles();
    const filter = this.searchFilter().toLowerCase().trim();
    if (!filter) {
      return profiles;
    }
    return profiles.filter((p: FriendProfile) => p.name.toLowerCase().includes(filter));
  });

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

    this.handleScannedInvite();
  }

  /**
   * Traite l'arrivee via un QR code scanne : /friends?add=<userId>.
   *
   * Le parametre est retire de l'URL apres traitement, sinon un rafraichissement
   * relancerait l'ajout — et afficherait « deja ami » a chaque fois.
   */
  private handleScannedInvite(): void {
    const userId = this.route.snapshot.queryParamMap.get('add');
    if (!userId) {
      return;
    }

    // Nettoyage immediat, avant tout appel reseau : l'utilisateur peut
    // rafraichir pendant la requete.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { add: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (!this.authService.isLoggedIn()) {
      this.inviteFeedback.set('friends.inviteNeedsAccount');
      return;
    }

    if (userId === this.authService.currentUser()?.$id) {
      this.inviteFeedback.set('friends.inviteSelf');
      return;
    }

    this.friendSrv
      .addFriendByQr(userId)
      .then(() => {
        this.inviteFeedback.set('friends.inviteAdded');
        return this.friendSrv.getFriends();
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Ajout par QR impossible:', error);
        this.inviteFeedback.set('friends.inviteFailed');
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

    this.modalRef = this.modalService.open(this.addModal);
  }

  openQrModal(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser?.$id) {
      // window.location.origin, et non un domaine en dur : l'URL doit fonctionner
      // la ou l'app est reellement servie. Elle pointait sur
      // https://ketal.app/friend/add, un domaine de production inexistant ET une
      // route qui n'existe pas dans app-routing — le scan ne menait donc nulle
      // part, meme en production.
      //
      // On reutilise la route /friends existante avec un parametre, plutot que
      // d'en ajouter une : le traitement se fait dans ngOnInit ci-dessus.
      this.friendQrUrl.set(`${window.location.origin}/friends?add=${encodeURIComponent(currentUser.$id)}`);
    }
    this.qrModalRef = this.modalService.open(this.qrModal);
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
    this.scanError.set(null);

    this.friendSrv
      .searchUsersByNickname(query)
      .then((users) => {
        this.isSearching.set(false);
        // Le service renvoie les documents Appwrite bruts : on les projette sur
        // FriendProfile pour que le template lise des champs qui existent
        // vraiment, plutot qu'un cast qui masque les absences.
        this.searchResults.set(
          users.map((doc) => ({
            userId: (doc['userId'] as string) ?? (doc['$id'] as string) ?? '',
            name: (doc['nickname'] as string) || (doc['name'] as string) || '',
            avatar: doc['avatar'] as string | undefined,
            isFriend: false,
          }))
        );
        // Sans ce passage a true, tout le bloc de resultats du template — place
        // derriere @if (isLoaded()) — restait masque, meme avec des resultats.
        this.isLoaded.set(true);
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Search failed:', error);
        this.isSearching.set(false);
        this.isLoaded.set(true);
        this.scanError.set(error instanceof Error ? error.message : 'Search failed');
      });
  }

  confirmAddFriend(user: FriendProfile): void {
    const confirmed = confirm(`Add ${user.name} as your friend?`);
    if (!confirmed) {
      return;
    }

    // On ajoute par identifiant, pas par pseudo : addFriendByNickname relance une
    // recherche par nom, ce qui echoue si le nom differe du pseudo et peut viser
    // le mauvais compte en cas d'homonymes. L'identifiant du resultat est deja la.
    this.friendSrv
      .addFriendByQr(user.userId)
      .then(() => {
        this.modalRef?.close();
        return this.friendSrv.getFriends();
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Failed to add friend:', error);
        this.scanError.set(error instanceof Error ? error.message : 'Failed to add friend');
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
