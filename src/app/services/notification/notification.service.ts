import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import { FriendRequest, FriendService } from '../friend/friend.service';
import { RealtimeService } from '../realtime/realtime.service';

/** Collection des relations : c'est ELLE qui porte l'etat notifiable. */
const COLLECTION_FRIENDSHIPS = 'friendships';

/** Etat de la permission des notifications navigateur. */
export type BrowserNotificationPermission = 'unsupported' | 'default' | 'granted' | 'denied';

/**
 * NotificationService — alimente la cloche du header.
 *
 * CHOIX STRUCTURANT : les notifications sont DERIVEES de donnees que le
 * destinataire peut deja lire lui-meme, et non ecrites par l'expediteur.
 *
 * Pourquoi : Appwrite 1.9 refuse qu'une session utilisateur pose une permission
 * au nom d'un autre compte (`Permissions must be one of: any, users, user:<soi>`
 * — 401 user_unauthorized). « L'expediteur cree la notification privee du
 * destinataire » est donc impossible sans Appwrite Function ni cle API. Et se
 * replier sur `read("users")` par document rendrait toute notification lisible
 * par tout le monde : exactement la fuite qu'on veut eviter.
 *
 * A la place, la source est la collection `friendships`, lisible par les
 * comptes authentifies : le destinataire interroge lui-meme
 * `friendUserId = moi AND status = pending`. L'etat est persiste cote serveur,
 * donc le compteur est juste au retour sur la page, apres connexion, ou depuis
 * un autre appareil — sans aucune ecriture croisee.
 *
 * COROLLAIRE ASSUME : il n'y a pas de « marquer comme lu ». Accepter ou refuser
 * EST la resolution. La cloche compte donc des elements ACTIONNABLES, pas un
 * journal de lecture — ce qui vaut mieux : un compteur qui ne descend qu'en
 * agissant ne peut pas mentir.
 *
 * LIMITE CONNUE : ce mecanisme ne couvre que les demandes d'ami, et il n'y a
 * pas de notification a l'acceptation (le demandeur voit simplement son ami
 * apparaitre). Un magasin generique de notifications, reutilisable pour
 * d'autres types, exigerait une Appwrite Function pour effectuer l'ecriture
 * croisee avec une cle API.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly authService = inject(AuthService);
  private readonly friendSrv = inject(FriendService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Nombre d'elements en attente d'action. Derive de la source, jamais compte
   * a la main : il ne peut donc pas deriver de l'etat reel.
   */
  readonly unreadCount = computed(() => this.friendSrv.pendingRequests().length);

  /** Les demandes elles-memes, pour l'affichage sur la page amis. */
  readonly pendingRequests = this.friendSrv.pendingRequests;

  private readonly _isLoading = signal(false);
  readonly isLoading = this._isLoading.asReadonly();

  private readonly _browserPermission = signal<BrowserNotificationPermission>('unsupported');
  readonly browserPermission = this._browserPermission.asReadonly();

  /** Utilisateur actuellement suivi, pour ne pas re-souscrire a l'identique. */
  private watchedUserId: string | null = null;
  private realtimeSubscriptionId: string | null = null;

  /** Demandes deja signalees, pour ne pas rejouer une bulle a chaque evenement. */
  private readonly announcedRequestIds = new Set<string>();

  constructor() {
    this._browserPermission.set(this.readBrowserPermission());

    // Le compteur doit etre juste des le CHARGEMENT de l'application et APRES
    // une connexion en cours de session. Un effect sur currentUser() couvre les
    // deux cas, la ou un appel unique au demarrage manquerait le second : rien
    // ne rejoue un ngOnInit apres un login.
    effect(() => {
      const userId = this.authService.currentUser()?.$id ?? null;
      this.onUserChanged(userId);
    });

    // Une souscription qui survit au service garde un WebSocket ouvert et
    // continue d'appeler un callback sur un etat mort.
    this.destroyRef.onDestroy(() => this.stopRealtime());
  }

  /**
   * Relit les demandes en attente depuis la base.
   *
   * C'est LA requete qui alimente la cloche au chargement.
   */
  async refresh(): Promise<void> {
    if (!this.authService.currentUser()?.$id) {
      return;
    }

    this._isLoading.set(true);
    try {
      const requests = await this.friendSrv.getPendingRequests();
      // Une demande deja presente au chargement n'est pas une nouveaute : on ne
      // la signale pas par une bulle navigateur.
      for (const request of requests) {
        this.announcedRequestIds.add(request.friendshipId);
      }
    } catch (error: unknown) {
      // Une cloche muette vaut mieux qu'un ecran casse.
      console.warn('[NotificationService] Demandes en attente indisponibles:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Ouvre les notifications.
   *
   * NAVIGATION, et non panneau deroulant : le seul contenu notifiable est la
   * section « demandes recues » de la page amis, et c'est aussi la seule ou l'on
   * peut agir (accepter, refuser). Un panneau aurait duplique cette liste et ses
   * deux boutons, pour finir par renvoyer au meme endroit des qu'il faut agir.
   */
  async openNotifications(): Promise<void> {
    await this.router.navigate(['/friends']);
  }

  // --- Notifications navigateur (bonus) -------------------------------------

  /** true si l'API Notification existe dans ce contexte. */
  isBrowserNotificationSupported(): boolean {
    return this.notificationApi !== undefined;
  }

  /**
   * Demande la permission des notifications navigateur.
   *
   * A n'appeler QUE depuis un geste utilisateur : demandee au chargement, elle
   * est bloquee par les navigateurs (et l'API exige un contexte securise).
   * Absence d'API ou refus : degradation silencieuse sur la cloche seule.
   */
  async requestBrowserPermission(): Promise<boolean> {
    const api = this.notificationApi;
    if (!api) {
      this._browserPermission.set('unsupported');
      return false;
    }

    // Deja tranchee : ne pas reposer la question a chaque clic.
    if (api.permission !== 'default') {
      this._browserPermission.set(api.permission as BrowserNotificationPermission);
      return api.permission === 'granted';
    }

    try {
      const result = await api.requestPermission();
      this._browserPermission.set(result as BrowserNotificationPermission);
      return result === 'granted';
    } catch (error: unknown) {
      console.warn('[NotificationService] Permission navigateur indisponible:', error);
      this._browserPermission.set(this.readBrowserPermission());
      return false;
    }
  }

  /**
   * Affiche une bulle navigateur si — et seulement si — l'API existe et la
   * permission est accordee. Aucun service worker, aucun Web Push : hors
   * perimetre, et inutile pour une application au premier plan.
   */
  private showBrowserNotification(request: FriendRequest): void {
    const api = this.notificationApi;
    if (!api || api.permission !== 'granted') {
      return;
    }

    try {
      // tag : deux evenements realtime pour la meme demande ne doivent pas
      // empiler deux bulles.
      new api(this.translate.instant('notifications.friendRequestTitle'), {
        body: this.translate.instant('notifications.friendRequestBody', { name: request.requesterName }),
        tag: request.friendshipId,
      });
    } catch (error: unknown) {
      console.warn('[NotificationService] Notification navigateur impossible:', error);
    }
  }

  /**
   * Acces indirect a l'API, plutot que la globale `Notification` : rend
   * l'absence testable et evite un ReferenceError hors navigateur.
   */
  private get notificationApi(): typeof Notification | undefined {
    const scope = globalThis as { Notification?: typeof Notification };
    return typeof scope.Notification === 'function' ? scope.Notification : undefined;
  }

  private readBrowserPermission(): BrowserNotificationPermission {
    const api = this.notificationApi;
    if (!api) {
      return 'unsupported';
    }
    return api.permission as BrowserNotificationPermission;
  }

  // --- Temps reel (bonus) ---------------------------------------------------

  /**
   * Reagit au changement d'utilisateur : premiere lecture du compteur, mise en
   * place ou coupure du temps reel.
   */
  private onUserChanged(userId: string | null): void {
    if (userId === this.watchedUserId) {
      return;
    }
    this.watchedUserId = userId;
    this.stopRealtime();
    this.announcedRequestIds.clear();

    if (!userId) {
      this.friendSrv.clearFriends();
      return;
    }

    void this.refresh();
    void this.startRealtime(userId);
  }

  private async startRealtime(userId: string): Promise<void> {
    try {
      const subscriptionId = await this.realtime.subscribeToCollection<Record<string, unknown>>(
        COLLECTION_FRIENDSHIPS,
        (payload) => this.onFriendshipEvent(payload, userId)
      );

      // L'utilisateur a pu changer pendant l'await : on ne garde pas une
      // souscription devenue orpheline.
      if (this.watchedUserId !== userId) {
        this.realtime.unsubscribe(subscriptionId);
        return;
      }
      this.realtimeSubscriptionId = subscriptionId;
    } catch (error: unknown) {
      // Sans temps reel la cloche reste juste : elle est relue au chargement.
      console.warn('[NotificationService] Temps reel indisponible:', error);
    }
  }

  private stopRealtime(): void {
    if (this.realtimeSubscriptionId) {
      this.realtime.unsubscribe(this.realtimeSubscriptionId);
      this.realtimeSubscriptionId = null;
    }
  }

  /**
   * Une relation a change : si elle nous concerne, on relit l'etat.
   *
   * On relit plutot que de deduire depuis le payload : les evenements couvrent
   * la creation, la mise a jour ET la suppression, et une deduction locale
   * finirait par deriver de la base.
   */
  private onFriendshipEvent(payload: Record<string, unknown>, userId: string): void {
    const owner = payload['ownerUserId'] as string | undefined;
    const friend = payload['friendUserId'] as string | undefined;
    if (owner !== userId && friend !== userId) {
      return;
    }

    void this.handleFriendshipChange();
  }

  private async handleFriendshipChange(): Promise<void> {
    let requests: FriendRequest[] = [];
    try {
      requests = await this.friendSrv.getPendingRequests();
    } catch (error: unknown) {
      console.warn('[NotificationService] Relecture des demandes impossible:', error);
      return;
    }

    for (const request of requests) {
      if (!this.announcedRequestIds.has(request.friendshipId)) {
        this.announcedRequestIds.add(request.friendshipId);
        this.showBrowserNotification(request);
      }
    }

    // La liste d'amis bouge aussi (acceptation par l'autre partie, retrait) :
    // sans cela, la page amis resterait figee jusqu'au prochain chargement.
    try {
      await this.friendSrv.getFriends();
    } catch (error: unknown) {
      console.warn('[NotificationService] Relecture de la liste d_amis impossible:', error);
    }
  }
}
