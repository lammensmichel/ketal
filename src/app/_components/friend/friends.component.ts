import { Component, signal, OnInit, inject, DestroyRef, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService, FriendProfile, FriendRequest } from '../../services/friend/friend.service';
import { FriendQrScannerComponent } from './friend-qr-scanner.component';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule, NgbModule, FormsModule, QRCodeComponent, FriendQrScannerComponent],
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

  /** Demandes recues en attente de reponse (signal du service) */
  readonly pendingRequests = this.friendSrv.pendingRequests;

  /** Demande dont le refus attend confirmation, ou null */
  readonly pendingDeclineId = signal<string | null>(null);

  /** Cle de traduction de l'erreur d'une action de la page (accepter, refuser, retirer) */
  readonly actionError = signal<string | null>(null);

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

  /** Message d'erreur de la recherche par pseudo, ou null */
  readonly scanError = signal<string | null>(null);

  /** Cle de traduction de l'erreur d'ajout via QR scanne, ou null */
  readonly qrAddError = signal<string | null>(null);

  /** Ami dont le retrait attend confirmation, ou null */
  readonly pendingRemoveUserId = signal<string | null>(null);

  /** Cle de traduction du retour de copie du QR, ou null */
  readonly copyFeedback = signal<string | null>(null);

  // QR code modal
  readonly friendQrUrl = signal<string | null>(null);
  readonly qrScale = 4;
  readonly qrWidth = 256;
  readonly qrErrorCorrectionLevel = 'M';

  constructor() {
    // La fenetre de modale de ng-bootstrap vit attachee a document.body, pas dans
    // la vue de ce composant : quitter /friends ne la fermerait pas et le
    // scanner qu'elle contient continuerait de filmer. On la ferme donc a la main.
    this.destroyRef.onDestroy(() => {
      this.modalRef?.dismiss();
      this.qrModalRef?.dismiss();
    });
  }

  ngOnInit(): void {
    // Load friends when component initializes
    if (this.authService.isLoggedIn()) {
      this.friendSrv.getFriends();
      this.friendSrv.getPendingRequests().catch((error: unknown) => {
        console.error('[FriendsComponent] Demandes recues indisponibles:', error);
      });
    }

    this.handleScannedInvite();
  }

  /** Accepte une demande recue : la ligne passe a `accepted`. */
  acceptRequest(request: FriendRequest): void {
    this.actionError.set(null);
    this.pendingDeclineId.set(null);

    this.friendSrv.acceptFriendRequest(request.friendshipId).catch((error: unknown) => {
      console.error('[FriendsComponent] Acceptation impossible:', error);
      this.actionError.set('friends.acceptFailed');
    });
  }

  /** Demande la confirmation du refus, en ligne sur la carte concernee. */
  askDeclineRequest(friendshipId: string): void {
    this.actionError.set(null);
    this.pendingDeclineId.set(friendshipId);
  }

  cancelDeclineRequest(): void {
    this.pendingDeclineId.set(null);
  }

  declineRequest(friendshipId: string): void {
    this.pendingDeclineId.set(null);

    this.friendSrv.declineFriendRequest(friendshipId).catch((error: unknown) => {
      console.error('[FriendsComponent] Refus impossible:', error);
      this.actionError.set('friends.declineFailed');
    });
  }

  /** Avatar d'un demandeur, meme repli que pour un ami. */
  getRequestAvatarUrl(request: FriendRequest): string {
    if (request.requesterAvatar) {
      return request.requesterAvatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(request.requesterName)}&background=0D8ABC&color=fff`;
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
        // « Demande envoyee » et non « ami ajoute » : l'ajout n'est plus
        // immediat, il attend le consentement de l'autre.
        this.inviteFeedback.set('friends.requestSent');
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Ajout par QR impossible:', error);
        this.inviteFeedback.set(this.errorFeedbackKey(error, 'friends.inviteFailed'));
      });
  }

  /**
   * Cle de traduction a afficher pour une erreur remontee par le service.
   *
   * Le service leve des cles de traduction pour les cas metier (doublon,
   * demande deja recue) : les remonter telles quelles evite d'ecraser un
   * message precis par un « echec » generique. Tout autre message, technique et
   * en anglais, est remplace par le repli.
   */
  private errorFeedbackKey(error: unknown, fallbackKey: string): string {
    const message = error instanceof Error ? error.message : '';
    return message.startsWith('friends.') ? message : fallbackKey;
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
  /** Demande la confirmation du retrait, en ligne sur la fiche concernee. */
  askRemoveFriend(friendUserId: string): void {
    this.pendingRemoveUserId.set(friendUserId);
  }

  cancelRemoveFriend(): void {
    this.pendingRemoveUserId.set(null);
  }

  removeFriend(friendUserId: string): void {
    // Plus de confirm() natif : il affiche l'origine de la page et ignore le
    // theme. La confirmation se fait dans la fiche, cf. pendingRemoveUserId.
    this.pendingRemoveUserId.set(null);

    this.actionError.set(null);

    this.friendSrv.removeFriend(friendUserId).catch((error: unknown) => {
      console.error('[FriendsComponent] Failed to remove friend:', error);
      // Erreur affichee sur la PAGE : le retrait se declenche depuis une fiche,
      // pas depuis la modale ou vit scanError.
      this.actionError.set(this.errorFeedbackKey(error, 'friends.removeFailed'));
    });
  }

  openAddModal(): void {
    // Reset search when opening modal
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.isLoaded.set(false);
    this.scanError.set(null);
    this.qrAddError.set(null);

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
    // Aucune confirmation : l'action est explicite (bouton en face du nom cherche)
    // et reversible. Un confirm() natif y affichait l'origine de la page et
    // cassait le theme pour aucun gain.
    // On ajoute par identifiant, pas par pseudo : addFriendByNickname relance une
    // recherche par nom, ce qui echoue si le nom differe du pseudo et peut viser
    // le mauvais compte en cas d'homonymes. L'identifiant du resultat est deja la.
    this.friendSrv
      .addFriendByQr(user.userId)
      .then(() => {
        this.modalRef?.close();
        this.inviteFeedback.set('friends.requestSent');
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Failed to add friend:', error);
        // La modale reste ouverte : l'erreur (doublon, demande deja recue) doit
        // etre lue la ou l'action a ete declenchee.
        this.scanError.set(this.errorFeedbackKey(error, 'friends.inviteFailed'));
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
          // alert() natif remplace : il affiche l'origine de la page (donc l'IP en
          // test) et ignore le theme de l'application.
          this.copyFeedback.set('friends.copiedQr');
          setTimeout(() => this.copyFeedback.set(null), 2500);
        })
        .catch((error: unknown) => {
          console.error('Failed to copy:', error);
          this.copyFeedback.set('friends.copyFailed');
        });
    }
  }

  /**
   * Ajoute l'ami dont le QR code vient d'etre scanne dans la modale.
   *
   * L'identifiant est deja extrait par le scanner : on retrouve ici exactement le
   * meme chemin que l'arrivee par lien (handleScannedInvite), addFriendByQr
   * gerant deja l'auto-ajout, le compte inexistant et le doublon.
   */
  onQrScanned(userId: string): void {
    this.qrAddError.set(null);

    this.friendSrv
      .addFriendByQr(userId)
      .then(() => {
        // La modale se ferme : le retour s'affiche sur la page, comme pour un lien.
        this.inviteFeedback.set('friends.requestSent');
        this.modalRef?.close();
      })
      .catch((error: unknown) => {
        console.error('[FriendsComponent] Ajout par QR scanne impossible:', error);
        this.qrAddError.set(this.errorFeedbackKey(error, 'friends.inviteFailed'));
      });
  }
}
