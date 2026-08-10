import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Models } from 'appwrite';

import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';
import { FriendRequest, FriendService } from '../friend/friend.service';
import { RealtimeService } from '../realtime/realtime.service';

function makeRequest(id: string, name = 'Demandeur'): FriendRequest {
  return {
    friendshipId: id,
    requesterUserId: `user-${id}`,
    requesterName: name,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('NotificationService', () => {
  let service: NotificationService;
  let currentUser: ReturnType<typeof signal<Models.User<Models.Preferences> | null>>;
  let pendingRequests: ReturnType<typeof signal<FriendRequest[]>>;
  let mockFriendService: {
    pendingRequests: unknown;
    getPendingRequests: jasmine.Spy;
    getFriends: jasmine.Spy;
    clearFriends: jasmine.Spy;
  };
  let mockRealtime: { subscribeToCollection: jasmine.Spy; unsubscribe: jasmine.Spy };
  let mockRouter: { navigate: jasmine.Spy };

  /** Callback passe a la souscription temps reel, pour simuler un evenement. */
  let realtimeCallback: ((payload: Record<string, unknown>) => void) | null;

  beforeEach(() => {
    currentUser = signal<Models.User<Models.Preferences> | null>({
      $id: 'me',
    } as Models.User<Models.Preferences>);
    pendingRequests = signal<FriendRequest[]>([]);
    realtimeCallback = null;

    mockFriendService = {
      pendingRequests: pendingRequests.asReadonly(),
      // getPendingRequests met a jour le signal, comme le vrai service.
      getPendingRequests: jasmine.createSpy('getPendingRequests').and.callFake(() => {
        return Promise.resolve(pendingRequests());
      }),
      getFriends: jasmine.createSpy('getFriends').and.resolveTo([]),
      clearFriends: jasmine.createSpy('clearFriends'),
    };

    mockRealtime = {
      subscribeToCollection: jasmine
        .createSpy('subscribeToCollection')
        .and.callFake((_collectionId: string, callback: (payload: Record<string, unknown>) => void) => {
          realtimeCallback = callback;
          return Promise.resolve('sub-1');
        }),
      unsubscribe: jasmine.createSpy('unsubscribe'),
    };

    mockRouter = { navigate: jasmine.createSpy('navigate').and.resolveTo(true) };

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        NotificationService,
        { provide: AuthService, useValue: { currentUser: currentUser.asReadonly() } },
        { provide: FriendService, useValue: mockFriendService },
        { provide: RealtimeService, useValue: mockRealtime },
        { provide: Router, useValue: mockRouter },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('se cree', () => {
    expect(service).toBeTruthy();
  });

  describe('compteur de non-lues', () => {
    it('vaut 0 sans demande en attente', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('reflete le nombre de demandes recues en attente', () => {
      pendingRequests.set([makeRequest('f-1'), makeRequest('f-2')]);
      expect(service.unreadCount()).toBe(2);
    });

    it('redescend quand une demande est resolue : accepter ou refuser EST le marquage comme lu', () => {
      pendingRequests.set([makeRequest('f-1'), makeRequest('f-2')]);
      expect(service.unreadCount()).toBe(2);

      // Ce que fait acceptFriendRequest / declineFriendRequest cote FriendService.
      pendingRequests.set([makeRequest('f-2')]);

      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('lecture au chargement et apres connexion', () => {
    it('relit les demandes des le premier passage de l_effect', () => {
      TestBed.tick();
      expect(mockFriendService.getPendingRequests).toHaveBeenCalled();
    });

    it('met en place le temps reel pour l_utilisateur connecte', () => {
      TestBed.tick();
      expect(mockRealtime.subscribeToCollection).toHaveBeenCalled();
      expect(mockRealtime.subscribeToCollection.calls.mostRecent().args[0]).toBe('friendships');
    });

    it('relit apres une connexion SURVENUE EN COURS DE SESSION', async () => {
      currentUser.set(null);
      TestBed.tick();
      mockFriendService.getPendingRequests.calls.reset();

      // Rien ne rejoue un ngOnInit apres un login : c'est l'effect qui couvre ce cas.
      currentUser.set({ $id: 'me' } as Models.User<Models.Preferences>);
      TestBed.tick();

      expect(mockFriendService.getPendingRequests).toHaveBeenCalled();
    });

    it('ne relit rien au demarrage quand personne n_est connecte', () => {
      currentUser.set(null);
      TestBed.tick();

      expect(mockFriendService.getPendingRequests).not.toHaveBeenCalled();
      expect(service.unreadCount()).toBe(0);
    });

    it('vide l_etat a la deconnexion', () => {
      TestBed.tick();
      mockFriendService.getPendingRequests.calls.reset();

      currentUser.set(null);
      TestBed.tick();

      expect(mockFriendService.getPendingRequests).not.toHaveBeenCalled();
      expect(mockFriendService.clearFriends).toHaveBeenCalled();
    });

    it('garde un compteur utilisable si la requete echoue', async () => {
      mockFriendService.getPendingRequests.and.rejectWith(new Error('backend down'));

      await expectAsync(service.refresh()).toBeResolved();
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('temps reel', () => {
    it('relit l_etat quand une relation qui me concerne change', async () => {
      TestBed.tick();
      await Promise.resolve();
      mockFriendService.getPendingRequests.calls.reset();

      realtimeCallback?.({ ownerUserId: 'someone', friendUserId: 'me', status: 'pending' });
      await Promise.resolve();

      expect(mockFriendService.getPendingRequests).toHaveBeenCalled();
    });

    it('ignore une relation entre deux tiers', async () => {
      TestBed.tick();
      await Promise.resolve();
      mockFriendService.getPendingRequests.calls.reset();

      realtimeCallback?.({ ownerUserId: 'a', friendUserId: 'b', status: 'pending' });
      await Promise.resolve();

      expect(mockFriendService.getPendingRequests).not.toHaveBeenCalled();
    });

    it('se desabonne a la deconnexion', async () => {
      TestBed.tick();
      await Promise.resolve();

      currentUser.set(null);
      TestBed.tick();

      expect(mockRealtime.unsubscribe).toHaveBeenCalledWith('sub-1');
    });

    it('reste fonctionnel si le temps reel est indisponible', async () => {
      mockRealtime.subscribeToCollection.and.rejectWith(new Error('ws down'));

      TestBed.tick();
      await Promise.resolve();
      await Promise.resolve();

      // Le compteur ne depend pas du temps reel : il est relu au chargement.
      pendingRequests.set([makeRequest('f-1')]);
      expect(service.unreadCount()).toBe(1);
    });
  });

  describe('ouverture', () => {
    it('navigue vers la page amis, ou se trouvent les demandes', async () => {
      await service.openNotifications();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/friends']);
    });
  });

  describe('notifications navigateur', () => {
    let originalNotification: unknown;

    beforeEach(() => {
      originalNotification = (globalThis as Record<string, unknown>)['Notification'];
    });

    afterEach(() => {
      if (originalNotification === undefined) {
        delete (globalThis as Record<string, unknown>)['Notification'];
      } else {
        (globalThis as Record<string, unknown>)['Notification'] = originalNotification;
      }
    });

    it('degrade sans planter quand l_API Notification est ABSENTE', async () => {
      delete (globalThis as Record<string, unknown>)['Notification'];

      expect(service.isBrowserNotificationSupported()).toBeFalse();
      await expectAsync(service.requestBrowserPermission()).toBeResolvedTo(false);
      expect(service.browserPermission()).toBe('unsupported');
    });

    it('n_affiche aucune bulle a l_arrivee d_une demande quand l_API est absente', async () => {
      delete (globalThis as Record<string, unknown>)['Notification'];
      TestBed.tick();
      await Promise.resolve();

      pendingRequests.set([makeRequest('f-1')]);

      // Le seul comportement attendu est l'absence d'exception : la cloche, elle,
      // continue de compter.
      expect(() => realtimeCallback?.({ ownerUserId: 'x', friendUserId: 'me' })).not.toThrow();
      await Promise.resolve();
      expect(service.unreadCount()).toBe(1);
    });

    it('ne redemande pas la permission quand elle est deja refusee', async () => {
      const requestPermission = jasmine.createSpy('requestPermission').and.resolveTo('denied');
      (globalThis as Record<string, unknown>)['Notification'] = Object.assign(function () {}, {
        permission: 'denied',
        requestPermission,
      });

      await expectAsync(service.requestBrowserPermission()).toBeResolvedTo(false);
      expect(requestPermission).not.toHaveBeenCalled();
    });

    it('demande la permission quand elle n_a pas encore ete tranchee', async () => {
      const requestPermission = jasmine.createSpy('requestPermission').and.resolveTo('granted');
      (globalThis as Record<string, unknown>)['Notification'] = Object.assign(function () {}, {
        permission: 'default',
        requestPermission,
      });

      await expectAsync(service.requestBrowserPermission()).toBeResolvedTo(true);
      expect(requestPermission).toHaveBeenCalled();
    });
  });
});
