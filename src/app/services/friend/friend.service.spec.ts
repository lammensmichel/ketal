import { TestBed } from '@angular/core/testing';
import { FriendService, FRIENDSHIP_ACCEPTED, FRIENDSHIP_PENDING } from './friend.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { AuthService } from '../auth/auth.service';

/**
 * Les mocks sont recrees a CHAQUE test, et non une fois au niveau module.
 *
 * Avec des spies partages, l'etat fuyait d'un test a l'autre : « should return
 * empty array when user not authenticated » force currentUser a renvoyer null et
 * ne le restaure pas, si bien que tous les tests suivants voyaient un
 * utilisateur nul et echouaient. Les resultats dependaient donc de l'ordre
 * d'execution, que Jasmine randomise.
 */
type MockAppwrite = {
  databases: {
    listDocuments: jasmine.Spy;
    createDocument: jasmine.Spy;
    updateDocument: jasmine.Spy;
    deleteDocument: jasmine.Spy;
    getDocument: jasmine.Spy;
  };
  databaseId: string;
};

/** Requetes emises pour une collection donnee, dans l'ordre des appels. */
function queriesFor(spy: jasmine.Spy, collectionId: string): string[][] {
  return spy.calls
    .allArgs()
    .filter(([args]) => (args as { collectionId: string }).collectionId === collectionId)
    .map(([args]) => ((args as { queries?: string[] }).queries ?? []) as string[]);
}

describe('FriendService', () => {
  let service: FriendService;
  let mockAppwriteService: MockAppwrite;
  let mockAuthService: { currentUser: jasmine.Spy };

  beforeEach(() => {
    mockAppwriteService = {
      databases: {
        listDocuments: jasmine.createSpy('listDocuments'),
        createDocument: jasmine.createSpy('createDocument'),
        updateDocument: jasmine.createSpy('updateDocument'),
        deleteDocument: jasmine.createSpy('deleteDocument'),
        getDocument: jasmine.createSpy('getDocument'),
      },
      databaseId: 'fug',
    };

    mockAuthService = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({
        $id: 'test-user-id',
        email: 'test@example.com',
        name: 'Testeur',
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        FriendService,
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(FriendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFriends', () => {
    it('should return empty array when user not authenticated', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      const friends = await service.getFriends();
      expect(friends).toEqual([]);
    });

    it('should fetch friendships for current user', async () => {
      const mockDocuments = [
        {
          $id: 'friendship-1',
          ownerUserId: 'test-user-id',
          friendUserId: 'friend-1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: mockDocuments,
        total: 1,
      });
      (mockAppwriteService.databases.getDocument as jasmine.Spy).and.resolveTo({
        $id: 'friend-1',
        nickname: 'friend1',
      });
      const friends = await service.getFriends();
      expect(friends.length).toBe(1);
      expect(friends[0].$id).toBe('friendship-1');
    });

    it('interroge les DEUX sens et ne demande que les relations acceptees', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });

      await service.getFriends();

      const queries = queriesFor(mockAppwriteService.databases.listDocuments, 'friendships')[0];
      const joined = queries.join('|');
      expect(joined).toContain('"or"');
      expect(joined).toContain('ownerUserId');
      expect(joined).toContain('friendUserId');
      expect(joined).toContain(FRIENDSHIP_ACCEPTED);
    });

    it('resout le profil de l_AUTRE cote, y compris quand la demande venait de lui', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              // Ligne creee par MOI
              {
                $id: 'f-1',
                ownerUserId: 'test-user-id',
                friendUserId: 'friend-1',
                status: 'accepted',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
              // Ligne creee par L'AUTRE : sans bidirectionnalite, il serait invisible
              {
                $id: 'f-2',
                ownerUserId: 'friend-2',
                friendUserId: 'test-user-id',
                status: 'accepted',
                createdAt: '2024-01-02T00:00:00.000Z',
              },
            ],
            total: 2,
          });
        }
        return Promise.resolve({
          documents: [
            { $id: 'friend-1', nickname: 'un' },
            { $id: 'friend-2', nickname: 'deux' },
          ],
          total: 2,
        });
      });

      await service.getFriends();

      expect(service.friendProfiles().map((p) => p.userId)).toEqual(['friend-1', 'friend-2']);
    });

    it('ne remonte pas une relation `pending` comme une amitie', async () => {
      // Le filtre est cote serveur : on verifie ici que le statut lu est fidele,
      // donc qu'une ligne `pending` reste identifiable comme telle.
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              {
                $id: 'f-1',
                ownerUserId: 'test-user-id',
                friendUserId: 'friend-1',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            total: 1,
          });
        }
        return Promise.resolve({ documents: [], total: 0 });
      });

      const friends = await service.getFriends();
      expect(friends[0].status).toBe(FRIENDSHIP_PENDING);
    });

    it('traite une ligne sans statut comme une amitie etablie', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [
          { $id: 'f-legacy', ownerUserId: 'test-user-id', friendUserId: 'friend-1', createdAt: '2024-01-01T00:00:00Z' },
        ],
        total: 1,
      });

      const friends = await service.getFriends();
      expect(friends[0].status).toBe(FRIENDSHIP_ACCEPTED);
    });
  });

  describe('searchUsersByNickname', () => {
    it('should return empty array for empty query', async () => {
      const results = await service.searchUsersByNickname('');
      expect(results).toEqual([]);
    });

    it('should search users by nickname', async () => {
      const mockUsers = [{ $id: 'user-1', nickname: 'testuser' }];
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: mockUsers,
        total: 1,
      });
      const results = await service.searchUsersByNickname('test');
      expect(results.length).toBe(1);
    });
  });

  describe('addFriendByNickname', () => {
    it('should throw error when user not authenticated', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      await expectAsync(service.addFriendByNickname('testuser')).toBeRejectedWithError('User not authenticated');
    });

    it('should add friend by nickname', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.returnValues(
        { documents: [{ $id: 'friend-1', nickname: 'testuser' }], total: 1 },
        { documents: [], total: 0 },
        { documents: [], total: 0 }
      );
      (mockAppwriteService.databases.createDocument as jasmine.Spy).and.resolveTo({
        $id: 'friendship-1',
        ownerUserId: 'test-user-id',
        friendUserId: 'friend-1',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const friendship = await service.addFriendByNickname('testuser');
      expect(friendship.$id).toBe('friendship-1');
    });
  });

  describe('sendFriendRequest', () => {
    beforeEach(() => {
      (mockAppwriteService.databases.createDocument as jasmine.Spy).and.callFake(
        (args: { data: Record<string, unknown> }) => Promise.resolve({ $id: 'friendship-new', ...args.data })
      );
    });

    it('cree la ligne en `pending`, avec le statut ECRIT EXPLICITEMENT', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });

      const friendship = await service.sendFriendRequest('friend-1');

      const data = (mockAppwriteService.databases.createDocument as jasmine.Spy).calls.mostRecent().args[0].data;
      // Le defaut du schema est `accepted` : omettre le champ creerait une amitie
      // sans consentement.
      expect(data.status).toBe(FRIENDSHIP_PENDING);
      expect(data.ownerUserId).toBe('test-user-id');
      expect(data.friendUserId).toBe('friend-1');
      expect(friendship.status).toBe(FRIENDSHIP_PENDING);
    });

    it('n_ajoute PAS la demande a la liste d_amis', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });

      await service.sendFriendRequest('friend-1');

      expect(service.friends()).toEqual([]);
    });

    it('refuse l_auto-ajout', async () => {
      await expectAsync(service.sendFriendRequest('test-user-id')).toBeRejectedWithError(
        'Cannot add yourself as a friend'
      );
      expect(mockAppwriteService.databases.createDocument).not.toHaveBeenCalled();
    });

    it('cherche un doublon DANS LES DEUX SENS', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });

      await service.sendFriendRequest('friend-1');

      const joined = queriesFor(mockAppwriteService.databases.listDocuments, 'friendships')[0].join('|');
      // Les deux couples (moi -> lui) ET (lui -> moi) doivent etre demandes.
      expect(joined).toContain('"or"');
      expect(joined).toContain('"and"');
      expect(joined.match(/ownerUserId/g)?.length).toBe(2);
      expect(joined.match(/friendUserId/g)?.length).toBe(2);
    });

    it('refuse un doublon quand la ligne existe dans MON sens', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [
          {
            $id: 'f-1',
            ownerUserId: 'test-user-id',
            friendUserId: 'friend-1',
            status: 'pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      });

      await expectAsync(service.sendFriendRequest('friend-1')).toBeRejectedWithError('friends.errorAlreadyRequested');
      expect(mockAppwriteService.databases.createDocument).not.toHaveBeenCalled();
    });

    it('refuse un doublon quand la ligne existe dans le sens INVERSE', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [
          {
            $id: 'f-1',
            ownerUserId: 'friend-1',
            friendUserId: 'test-user-id',
            status: 'pending',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      });

      // Message different : l'utilisateur doit etre renvoye vers ses demandes
      // recues, pas informe d'un echec opaque.
      await expectAsync(service.sendFriendRequest('friend-1')).toBeRejectedWithError('friends.errorRequestIncoming');
      expect(mockAppwriteService.databases.createDocument).not.toHaveBeenCalled();
    });

    it('refuse un doublon quand les deux sont deja amis', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [
          {
            $id: 'f-1',
            ownerUserId: 'friend-1',
            friendUserId: 'test-user-id',
            status: 'accepted',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      });

      await expectAsync(service.sendFriendRequest('friend-1')).toBeRejectedWithError('friends.errorAlreadyFriends');
    });
  });

  describe('getPendingRequests', () => {
    it('ne demande que les demandes RECUES en attente', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });

      await service.getPendingRequests();

      const joined = queriesFor(mockAppwriteService.databases.listDocuments, 'friendships')[0].join('|');
      expect(joined).toContain('friendUserId');
      expect(joined).toContain('test-user-id');
      expect(joined).toContain(FRIENDSHIP_PENDING);
      expect(joined).not.toContain('ownerUserId');
    });

    it('enrichit chaque demande du pseudo du demandeur', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              {
                $id: 'f-1',
                ownerUserId: 'friend-1',
                friendUserId: 'test-user-id',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
          });
        }
        return Promise.resolve({ documents: [{ $id: 'friend-1', nickname: 'Demandeur' }], total: 1 });
      });

      const requests = await service.getPendingRequests();

      expect(requests.length).toBe(1);
      expect(requests[0].friendshipId).toBe('f-1');
      expect(requests[0].requesterUserId).toBe('friend-1');
      expect(requests[0].requesterName).toBe('Demandeur');
      expect(service.pendingRequests().length).toBe(1);
    });

    it('renvoie une liste vide sans utilisateur connecte', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      await expectAsync(service.getPendingRequests()).toBeResolvedTo([]);
      expect(mockAppwriteService.databases.listDocuments).not.toHaveBeenCalled();
    });
  });

  describe('acceptFriendRequest', () => {
    beforeEach(() => {
      (mockAppwriteService.databases.updateDocument as jasmine.Spy).and.resolveTo({
        $id: 'f-1',
        ownerUserId: 'friend-1',
        friendUserId: 'test-user-id',
        status: 'accepted',
        createdAt: '2024-01-01T00:00:00Z',
      });
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({ documents: [], total: 0 });
    });

    it('passe la ligne EXISTANTE a `accepted`, sans creer de seconde ligne', async () => {
      const friendship = await service.acceptFriendRequest('f-1');

      const args = (mockAppwriteService.databases.updateDocument as jasmine.Spy).calls.mostRecent().args[0];
      expect(args.documentId).toBe('f-1');
      expect(args.data).toEqual({ status: FRIENDSHIP_ACCEPTED });
      expect(friendship.status).toBe(FRIENDSHIP_ACCEPTED);
      // Pas de ligne symetrique : c'est tout l'interet du modele a une ligne.
      expect(mockAppwriteService.databases.createDocument).not.toHaveBeenCalled();
    });

    it('retire la demande de la liste en attente', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              {
                $id: 'f-1',
                ownerUserId: 'friend-1',
                friendUserId: 'test-user-id',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
          });
        }
        return Promise.resolve({ documents: [{ $id: 'friend-1', nickname: 'Demandeur' }], total: 1 });
      });
      await service.getPendingRequests();
      expect(service.pendingRequests().length).toBe(1);

      await service.acceptFriendRequest('f-1');

      expect(service.pendingRequests().length).toBe(0);
    });

    it('exige un utilisateur connecte', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      await expectAsync(service.acceptFriendRequest('f-1')).toBeRejectedWithError('User not authenticated');
    });
  });

  describe('declineFriendRequest', () => {
    it('SUPPRIME la ligne, pour que la personne puisse redemander plus tard', async () => {
      (mockAppwriteService.databases.deleteDocument as jasmine.Spy).and.resolveTo(undefined);

      await service.declineFriendRequest('f-1');

      const args = (mockAppwriteService.databases.deleteDocument as jasmine.Spy).calls.mostRecent().args[0];
      expect(args.collectionId).toBe('friendships');
      expect(args.documentId).toBe('f-1');
      // Aucun statut `declined` : il resterait detecte comme doublon et
      // interdirait definitivement toute nouvelle demande.
      expect(mockAppwriteService.databases.updateDocument).not.toHaveBeenCalled();
    });

    it('retire la demande de la liste en attente', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              {
                $id: 'f-1',
                ownerUserId: 'friend-1',
                friendUserId: 'test-user-id',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
          });
        }
        return Promise.resolve({ documents: [{ $id: 'friend-1', nickname: 'Demandeur' }], total: 1 });
      });
      await service.getPendingRequests();
      (mockAppwriteService.databases.deleteDocument as jasmine.Spy).and.resolveTo(undefined);

      await service.declineFriendRequest('f-1');

      expect(service.pendingRequests()).toEqual([]);
    });
  });

  describe('removeFriend', () => {
    it('should throw error if not friends', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [],
        total: 0,
      });
      await expectAsync(service.removeFriend('non-friend')).toBeRejectedWithError('Not friends with this user');
    });

    it('supprime la ligne meme quand la demande venait de l_autre', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [
          {
            $id: 'f-1',
            ownerUserId: 'friend-1',
            friendUserId: 'test-user-id',
            status: 'accepted',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
      });
      (mockAppwriteService.databases.deleteDocument as jasmine.Spy).and.resolveTo(undefined);

      await service.removeFriend('friend-1');

      expect((mockAppwriteService.databases.deleteDocument as jasmine.Spy).calls.mostRecent().args[0].documentId).toBe(
        'f-1'
      );
    });
  });

  describe('clearFriends', () => {
    it('vide aussi les demandes en attente', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.callFake((args: { collectionId: string }) => {
        if (args.collectionId === 'friendships') {
          return Promise.resolve({
            documents: [
              {
                $id: 'f-1',
                ownerUserId: 'friend-1',
                friendUserId: 'test-user-id',
                status: 'pending',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
          });
        }
        return Promise.resolve({ documents: [], total: 0 });
      });
      await service.getPendingRequests();

      service.clearFriends();

      expect(service.pendingRequests()).toEqual([]);
      expect(service.friends()).toEqual([]);
      expect(service.friendProfiles()).toEqual([]);
    });
  });
});
