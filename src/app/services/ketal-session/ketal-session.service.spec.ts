import { TestBed } from '@angular/core/testing';
import { KetalSessionService, KetalSession, KetalPlayer, PlayerChoices } from './ketal-session.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RoomService } from '../room/room.service';
import { createMockRoomService, createMockRealtimeService, createMockGameRoom } from '../../testing/test-helpers';

// ============================================================================
// Test Data Factories
// ============================================================================

function createDefaultChoices(): PlayerChoices {
  return { color: '', plus_or_minus: '', in_out: '', suit: '' };
}

function createTestPlayer(overrides: Partial<KetalPlayer> = {}): KetalPlayer {
  return {
    memberId: 'member-1',
    displayName: 'Player 1',
    order: 1,
    cards: [],
    choices: createDefaultChoices(),
    sipsGiven: 0,
    sipsTaken: 0,
    isReady: false,
    ...overrides,
  };
}

function createTestSession(overrides: Partial<KetalSession> = {}): KetalSession {
  return {
    $id: 'session-123',
    roomId: 'room-123',
    gameId: 'ketal',
    gameNumber: 1,
    status: 'waiting',
    phase: 'setup',
    turn: 0,
    activePlayerId: null,
    players: [],
    drinkingCards: [],
    givingCards: [],
    withSummary: false,
    ...overrides,
  };
}

/**
 * Creates a mock Appwrite document response from raw data
 */
function createDocResponse(data: Record<string, unknown>): Record<string, unknown> {
  return { ...data };
}

interface MockDatabases {
  createDocument: jasmine.Spy;
  updateDocument: jasmine.Spy;
  getDocument: jasmine.Spy;
  listDocuments: jasmine.Spy;
}

/**
 * Creates a mock AppwriteService with databases spy
 */
function createMockAppwriteService(): {
  mock: { databases: MockDatabases; databaseId: string };
  databases: MockDatabases;
} {
  const databases = jasmine.createSpyObj<MockDatabases>('Databases', [
    'createDocument',
    'updateDocument',
    'getDocument',
    'listDocuments',
  ]);

  const mock = { databases, databaseId: 'fug' };

  return { mock, databases };
}

describe('KetalSessionService', () => {
  let service: KetalSessionService;
  let mockRoomService: ReturnType<typeof createMockRoomService>;
  let mockRealtimeService: ReturnType<typeof createMockRealtimeService>;
  let appwriteMock: ReturnType<typeof createMockAppwriteService>;

  beforeEach(() => {
    mockRoomService = createMockRoomService();
    mockRealtimeService = createMockRealtimeService();
    appwriteMock = createMockAppwriteService();

    TestBed.configureTestingModule({
      providers: [
        KetalSessionService,
        { provide: AppwriteService, useValue: appwriteMock.mock },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: RoomService, useValue: mockRoomService },
      ],
    });
    service = TestBed.inject(KetalSessionService);
  });

  // ==========================================================================
  // Service Creation
  // ==========================================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null currentSession initially', () => {
    expect(service.currentSession()).toBeNull();
  });

  it('should have isPlaying as false initially', () => {
    expect(service.isPlaying()).toBeFalse();
  });

  it('should have currentPhase as setup initially', () => {
    expect(service.currentPhase()).toBe('setup');
  });

  it('should have empty players initially', () => {
    expect(service.players()).toEqual([]);
  });

  // ==========================================================================
  // startGame()
  // ==========================================================================

  describe('startGame()', () => {
    const roomId = 'room-123';
    const players = [
      createTestPlayer({ memberId: 'member-1', displayName: 'Player 1', order: 1 }),
      createTestPlayer({ memberId: 'member-2', displayName: 'Player 2', order: 2 }),
    ];

    beforeEach(() => {
      mockRoomService.currentRoom.set(createMockGameRoom({ $id: roomId, gamesPlayed: 0 }));

      // Mock session doc creation
      appwriteMock.databases.createDocument.and.callFake(
        (_dbId: string, collectionId: string, _docId: string, _data: Record<string, unknown>) => {
          if (collectionId === 'ketal_sessions') {
            return Promise.resolve(
              createDocResponse({
                $id: 'session-new',
                roomId,
                gameId: 'ketal',
                gameNumber: 1,
                status: 'waiting',
                phase: 'setup',
                turn: 0,
                activePlayerId: 'member-1',
                withSummary: false,
              })
            );
          }
          if (collectionId === 'ketal_players') {
            return Promise.resolve(
              createDocResponse({
                $id: `player-doc-${_data['memberId']}`,
                sessionId: 'session-new',
                memberId: _data['memberId'],
                displayName: _data['displayName'],
                order: _data['order'],
                cards: _data['cards'],
                choices: _data['choices'],
                sipsTaken: _data['sipsTaken'],
                sipsGiven: _data['sipsGiven'],
                isReady: _data['isReady'],
              })
            );
          }
          if (collectionId === 'ketal_cards') {
            return Promise.resolve(
              createDocResponse({
                $id: 'cards-doc-1',
                sessionId: 'session-new',
                drinkingCards: '[]',
                givingCards: '[]',
              })
            );
          }
          return Promise.reject(new Error('Unknown collection'));
        }
      );

      mockRoomService.updateRoom.and.resolveTo(createMockGameRoom());
    });

    it('should create session, player, and cards documents', async () => {
      const result = await service.startGame(roomId, players, false);

      // 1 session + 2 players + 1 cards = 4 createDocument calls
      expect(appwriteMock.databases.createDocument).toHaveBeenCalledTimes(4);
      expect(result).toBeTruthy();
      expect(result.$id).toBe('session-new');
    });

    it('should update room with session ID and playing status', async () => {
      await service.startGame(roomId, players, false);

      expect(mockRoomService.updateRoom).toHaveBeenCalledWith(roomId, {
        currentSessionId: 'session-new',
        status: 'playing',
        gamesPlayed: 1,
      });
    });

    it('should set internal signals after starting', async () => {
      await service.startGame(roomId, players, false);

      expect(service.currentSession()).toBeTruthy();
      expect(service.currentSession()!.$id).toBe('session-new');
      expect(service.currentSession()!.players.length).toBe(2);
    });

    it('should set activePlayerId to first player memberId', async () => {
      await service.startGame(roomId, players, false);

      expect(service.activePlayerId()).toBe('member-1');
    });

    it('should increment gameNumber from room gamesPlayed', async () => {
      mockRoomService.currentRoom.set(createMockGameRoom({ $id: roomId, gamesPlayed: 3 }));

      // Update mock to reflect gameNumber 4
      appwriteMock.databases.createDocument.and.callFake(
        (_dbId: string, collectionId: string, _docId: string, data: Record<string, unknown>) => {
          if (collectionId === 'ketal_sessions') {
            return Promise.resolve(
              createDocResponse({
                $id: 'session-new',
                roomId,
                gameId: 'ketal',
                gameNumber: data['gameNumber'],
                status: 'waiting',
                phase: 'setup',
                turn: 0,
                activePlayerId: 'member-1',
                withSummary: false,
              })
            );
          }
          if (collectionId === 'ketal_players') {
            return Promise.resolve(
              createDocResponse({
                $id: `player-doc-${data['memberId']}`,
                sessionId: 'session-new',
                ...data,
              })
            );
          }
          if (collectionId === 'ketal_cards') {
            return Promise.resolve(createDocResponse({ $id: 'cards-doc-1', sessionId: 'session-new', ...data }));
          }
          return Promise.reject(new Error('Unknown collection'));
        }
      );

      const result = await service.startGame(roomId, players, false);
      expect(result.gameNumber).toBe(4);
    });

    it('should throw an error when session creation fails', async () => {
      appwriteMock.databases.createDocument.and.rejectWith(new Error('Network error'));

      await expectAsync(service.startGame(roomId, players, false)).toBeRejectedWithError(/Failed to start game/);
    });
  });

  // ==========================================================================
  // updateSession()
  // ==========================================================================

  describe('updateSession()', () => {
    beforeEach(() => {
      // Seed internal state via setCurrentSession
      const session = createTestSession({
        $id: 'session-123',
        players: [
          createTestPlayer({ memberId: 'member-1', order: 1 }),
          createTestPlayer({ memberId: 'member-2', order: 2 }),
        ],
        drinkingCards: [],
        givingCards: [],
      });
      service.setCurrentSession(session);
    });

    it('should update session-level fields', async () => {
      appwriteMock.databases.updateDocument.and.resolveTo(
        createDocResponse({
          $id: 'session-123',
          roomId: 'room-123',
          gameId: 'ketal',
          gameNumber: 1,
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          activePlayerId: 'member-1',
          withSummary: false,
        })
      );

      const result = await service.updateSession('session-123', {
        status: 'playing',
        phase: 'dealing',
        turn: 1,
      });

      expect(appwriteMock.databases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'ketal_sessions',
        documentId: 'session-123',
        data: jasmine.objectContaining({ status: 'playing', phase: 'dealing', turn: 1 }),
      });
      expect(result.status).toBe('playing');
    });

    it('should update player documents when players are provided', async () => {
      appwriteMock.databases.updateDocument.and.callFake(
        (params: { collectionId: string; documentId: string; data: Record<string, unknown> }) => {
          const { collectionId, documentId, data } = params;
          return Promise.resolve(
            createDocResponse({
              $id: documentId,
              sessionId: 'session-123',
              memberId: collectionId === 'ketal_players' ? 'member-1' : undefined,
              displayName: 'Player 1',
              order: 1,
              cards: data['cards'] || '[]',
              choices: data['choices'] || '{}',
              sipsTaken: data['sipsTaken'] ?? 0,
              sipsGiven: data['sipsGiven'] ?? 0,
              isReady: data['isReady'] ?? false,
            })
          );
        }
      );

      const updatedPlayer = createTestPlayer({ memberId: 'member-1', sipsTaken: 5 });
      await service.updateSession('session-123', { players: [updatedPlayer] });

      expect(appwriteMock.databases.updateDocument).toHaveBeenCalled();
    });

    it('should update cards document when drinkingCards are provided', async () => {
      appwriteMock.databases.updateDocument.and.resolveTo(
        createDocResponse({
          $id: 'local-cards',
          sessionId: 'session-123',
          drinkingCards: '["card1","card2"]',
          givingCards: '[]',
        })
      );

      await service.updateSession('session-123', { drinkingCards: ['card1', 'card2'] });

      expect(appwriteMock.databases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'ketal_cards',
        documentId: 'local-cards',
        data: jasmine.objectContaining({ drinkingCards: '["card1","card2"]' }),
      });
    });

    it('should update cards document when givingCards are provided', async () => {
      appwriteMock.databases.updateDocument.and.resolveTo(
        createDocResponse({
          $id: 'local-cards',
          sessionId: 'session-123',
          drinkingCards: '[]',
          givingCards: '["cardA"]',
        })
      );

      await service.updateSession('session-123', { givingCards: ['cardA'] });

      expect(appwriteMock.databases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'ketal_cards',
        documentId: 'local-cards',
        data: jasmine.objectContaining({ givingCards: '["cardA"]' }),
      });
    });

    it('should not call updateDocument when no session-level fields provided', async () => {
      // Only providing players (no session fields)
      appwriteMock.databases.updateDocument.and.resolveTo(
        createDocResponse({
          $id: 'local-player-0',
          sessionId: 'session-123',
          memberId: 'member-1',
          displayName: 'Player 1',
          order: 1,
          cards: '[]',
          choices: '{}',
          sipsTaken: 0,
          sipsGiven: 0,
          isReady: false,
        })
      );

      await service.updateSession('session-123', {
        players: [createTestPlayer({ memberId: 'member-1' })],
      });

      // Should only update ketal_players, not ketal_sessions
      const sessionCalls = (appwriteMock.databases.updateDocument as jasmine.Spy).calls
        .allArgs()
        .filter((args: unknown[]) => (args[0] as { collectionId: string }).collectionId === 'ketal_sessions');
      expect(sessionCalls.length).toBe(0);
    });

    it('should throw an error when update fails', async () => {
      appwriteMock.databases.updateDocument.and.rejectWith(new Error('Update failed'));

      await expectAsync(service.updateSession('session-123', { status: 'playing' })).toBeRejectedWithError(
        /Failed to update session/
      );
    });
  });

  // ==========================================================================
  // endGame()
  // ==========================================================================

  describe('endGame()', () => {
    beforeEach(() => {
      const session = createTestSession({ $id: 'session-123', roomId: 'room-123' });
      service.setCurrentSession(session);
      appwriteMock.databases.updateDocument.and.resolveTo(
        createDocResponse({ $id: 'session-123', status: 'finished', phase: 'finished' })
      );
      mockRoomService.updateRoom.and.resolveTo(createMockGameRoom());
    });

    it('should update session status to finished', async () => {
      await service.endGame('session-123');

      expect(appwriteMock.databases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'ketal_sessions',
        documentId: 'session-123',
        data: {
          status: 'finished',
          phase: 'finished',
        },
      });
    });

    it('should clear room currentSessionId and set status to idle', async () => {
      await service.endGame('session-123');

      expect(mockRoomService.updateRoom).toHaveBeenCalledWith('room-123', {
        currentSessionId: null,
        status: 'idle',
      });
    });

    it('should clear internal signals', async () => {
      await service.endGame('session-123');

      expect(service.currentSession()).toBeNull();
      expect(service.players()).toEqual([]);
      expect(service.isPlaying()).toBeFalse();
    });

    it('should call unsubscribe on realtime subscriptions', async () => {
      // Set up subscriptions first
      await service.subscribeToSession('session-123');

      await service.endGame('session-123');

      expect(mockRealtimeService.unsubscribe).toHaveBeenCalled();
    });

    it('should throw an error when endGame fails', async () => {
      appwriteMock.databases.updateDocument.and.rejectWith(new Error('End failed'));

      await expectAsync(service.endGame('session-123')).toBeRejectedWithError(/Failed to end game/);
    });
  });

  // ==========================================================================
  // getSession()
  // ==========================================================================

  describe('getSession()', () => {
    it('should fetch from 3 collections and compose result', async () => {
      appwriteMock.databases.getDocument.and.resolveTo(
        createDocResponse({
          $id: 'session-123',
          roomId: 'room-123',
          gameId: 'ketal',
          gameNumber: 1,
          status: 'playing',
          phase: 'dealing',
          turn: 2,
          activePlayerId: 'member-1',
          withSummary: true,
        })
      );

      appwriteMock.databases.listDocuments.and.callFake((_dbId: string, collectionId: string) => {
        if (collectionId === 'ketal_players') {
          return Promise.resolve({
            documents: [
              createDocResponse({
                $id: 'player-doc-1',
                sessionId: 'session-123',
                memberId: 'member-1',
                displayName: 'Alice',
                order: 1,
                cards: '["card1"]',
                choices: '{"color":"red","plus_or_minus":"","in_out":"","suit":""}',
                sipsTaken: 2,
                sipsGiven: 1,
                isReady: true,
              }),
            ],
          });
        }
        if (collectionId === 'ketal_cards') {
          return Promise.resolve({
            documents: [
              createDocResponse({
                $id: 'cards-doc-1',
                sessionId: 'session-123',
                drinkingCards: '["dc1","dc2"]',
                givingCards: '["gc1"]',
              }),
            ],
          });
        }
        return Promise.resolve({ documents: [] });
      });

      const result = await service.getSession('session-123');

      expect(result).toBeTruthy();
      expect(result!.$id).toBe('session-123');
      expect(result!.status).toBe('playing');
      expect(result!.phase).toBe('dealing');
      expect(result!.players.length).toBe(1);
      expect(result!.players[0].memberId).toBe('member-1');
      expect(result!.players[0].displayName).toBe('Alice');
      expect(result!.players[0].cards).toEqual(['card1']);
      expect(result!.players[0].choices.color).toBe('red');
      expect(result!.drinkingCards).toEqual(['dc1', 'dc2']);
      expect(result!.givingCards).toEqual(['gc1']);
    });

    it('should set internal signals after fetching', async () => {
      appwriteMock.databases.getDocument.and.resolveTo(
        createDocResponse({
          $id: 'session-123',
          roomId: 'room-123',
          gameId: 'ketal',
          gameNumber: 1,
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          activePlayerId: null,
          withSummary: false,
        })
      );

      appwriteMock.databases.listDocuments.and.resolveTo({ documents: [] });

      await service.getSession('session-123');

      expect(service.currentSession()).toBeTruthy();
      expect(service.isPlaying()).toBeTrue();
      expect(service.currentPhase()).toBe('dealing');
    });

    it('should return null when session is not found', async () => {
      appwriteMock.databases.getDocument.and.rejectWith(new Error('Document not found'));

      const result = await service.getSession('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error for non-not-found errors', async () => {
      appwriteMock.databases.getDocument.and.rejectWith(new Error('Network error'));

      await expectAsync(service.getSession('session-123')).toBeRejectedWithError(/Failed to get session/);
    });
  });

  // ==========================================================================
  // subscribeToSession()
  // ==========================================================================

  describe('subscribeToSession()', () => {
    beforeEach(() => {
      // Seed state so cards subscription is set up
      const session = createTestSession({
        $id: 'session-123',
        players: [createTestPlayer({ memberId: 'member-1' })],
      });
      service.setCurrentSession(session);
    });

    it('should set up 3 subscriptions (session, players, cards)', async () => {
      await service.subscribeToSession('session-123');

      // subscribeToDocument called for session + cards (2 times)
      expect(mockRealtimeService.subscribeToDocument).toHaveBeenCalledTimes(2);
      // subscribeToCollection called for players (1 time)
      expect(mockRealtimeService.subscribeToCollection).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to ketal_sessions document', async () => {
      await service.subscribeToSession('session-123');

      expect(mockRealtimeService.subscribeToDocument).toHaveBeenCalledWith(
        'ketal_sessions',
        'session-123',
        jasmine.any(Function)
      );
    });

    it('should subscribe to ketal_players collection', async () => {
      await service.subscribeToSession('session-123');

      expect(mockRealtimeService.subscribeToCollection).toHaveBeenCalledWith('ketal_players', jasmine.any(Function));
    });

    it('should subscribe to ketal_cards document when cards doc exists', async () => {
      await service.subscribeToSession('session-123');

      expect(mockRealtimeService.subscribeToDocument).toHaveBeenCalledWith(
        'ketal_cards',
        'local-cards',
        jasmine.any(Function)
      );
    });

    it('should call onUpdate callback when session updates arrive', async () => {
      const onUpdate = jasmine.createSpy('onUpdate');
      let capturedSessionCallback: (data: unknown) => void = () => {
        /* noop */
      };

      mockRealtimeService.subscribeToDocument.and.callFake(
        (collectionId: string, _docId: string, callback: (data: unknown) => void) => {
          if (collectionId === 'ketal_sessions') {
            capturedSessionCallback = callback;
          }
          return Promise.resolve(`sub_${collectionId}`);
        }
      );

      await service.subscribeToSession('session-123', onUpdate);

      // Simulate a session update via realtime
      capturedSessionCallback({
        $id: 'session-123',
        roomId: 'room-123',
        gameId: 'ketal',
        gameNumber: 1,
        status: 'playing',
        phase: 'pyramid',
        turn: 3,
        activePlayerId: 'member-1',
        withSummary: true,
      });

      expect(onUpdate).toHaveBeenCalled();
      const updatedSession = onUpdate.calls.mostRecent().args[0] as KetalSession;
      expect(updatedSession.phase).toBe('pyramid');
    });

    it('should unsubscribe existing subscriptions before subscribing', async () => {
      // Subscribe once
      await service.subscribeToSession('session-123');
      const unsubCallCountBefore = mockRealtimeService.unsubscribe.calls.count();

      // Subscribe again — should unsubscribe the old ones first
      await service.subscribeToSession('session-456');

      // Should have called unsubscribe for previous subscriptions
      expect(mockRealtimeService.unsubscribe.calls.count()).toBeGreaterThan(unsubCallCountBefore);
    });
  });

  // ==========================================================================
  // unsubscribe()
  // ==========================================================================

  describe('unsubscribe()', () => {
    it('should clean up all subscriptions', async () => {
      const session = createTestSession({ $id: 'session-123' });
      service.setCurrentSession(session);

      await service.subscribeToSession('session-123');
      service.unsubscribe();

      expect(mockRealtimeService.unsubscribe).toHaveBeenCalled();
    });

    it('should not call unsubscribe when no active subscriptions', () => {
      service.unsubscribe();
      // No error thrown, and unsubscribe should not be called
      expect(mockRealtimeService.unsubscribe).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // setCurrentSession()
  // ==========================================================================

  describe('setCurrentSession()', () => {
    it('should decompose session into 3 internal signals', () => {
      const session = createTestSession({
        $id: 'session-456',
        roomId: 'room-789',
        status: 'playing',
        phase: 'dealing',
        turn: 2,
        activePlayerId: 'member-1',
        withSummary: true,
        players: [
          createTestPlayer({ memberId: 'member-1', displayName: 'Alice', order: 1 }),
          createTestPlayer({ memberId: 'member-2', displayName: 'Bob', order: 2 }),
        ],
        drinkingCards: ['dc1', 'dc2'],
        givingCards: ['gc1'],
      });

      service.setCurrentSession(session);

      const current = service.currentSession();
      expect(current).toBeTruthy();
      expect(current!.$id).toBe('session-456');
      expect(current!.roomId).toBe('room-789');
      expect(current!.status).toBe('playing');
      expect(current!.phase).toBe('dealing');
      expect(current!.turn).toBe(2);
      expect(current!.activePlayerId).toBe('member-1');
      expect(current!.withSummary).toBeTrue();
      expect(current!.players.length).toBe(2);
      expect(current!.players[0].displayName).toBe('Alice');
      expect(current!.players[1].displayName).toBe('Bob');
      expect(current!.drinkingCards).toEqual(['dc1', 'dc2']);
      expect(current!.givingCards).toEqual(['gc1']);
    });

    it('should clear all signals when null is passed', () => {
      service.setCurrentSession(createTestSession());
      expect(service.currentSession()).toBeTruthy();

      service.setCurrentSession(null);

      expect(service.currentSession()).toBeNull();
      expect(service.players()).toEqual([]);
      expect(service.isPlaying()).toBeFalse();
    });

    it('should update computed signals correctly', () => {
      service.setCurrentSession(
        createTestSession({
          status: 'playing',
          phase: 'pyramid',
          activePlayerId: 'member-42',
        })
      );

      expect(service.isPlaying()).toBeTrue();
      expect(service.currentPhase()).toBe('pyramid');
      expect(service.activePlayerId()).toBe('member-42');
    });
  });

  // ==========================================================================
  // currentSession computed signal
  // ==========================================================================

  describe('currentSession computed', () => {
    it('should compose from 3 internal signals correctly', () => {
      const session = createTestSession({
        $id: 'session-abc',
        players: [
          createTestPlayer({ memberId: 'm1', order: 2, displayName: 'Bob' }),
          createTestPlayer({ memberId: 'm2', order: 1, displayName: 'Alice' }),
        ],
        drinkingCards: ['d1'],
        givingCards: ['g1', 'g2'],
      });

      service.setCurrentSession(session);

      const current = service.currentSession()!;
      // Players should be sorted by order
      expect(current.players[0].displayName).toBe('Alice');
      expect(current.players[1].displayName).toBe('Bob');
      expect(current.drinkingCards).toEqual(['d1']);
      expect(current.givingCards).toEqual(['g1', 'g2']);
    });

    it('should return null when no session data is set', () => {
      expect(service.currentSession()).toBeNull();
    });
  });

  // ==========================================================================
  // handlePlayerDocUpdate (via subscribeToSession realtime)
  // ==========================================================================

  describe('handlePlayerDocUpdate', () => {
    beforeEach(() => {
      const session = createTestSession({
        $id: 'session-123',
        players: [createTestPlayer({ memberId: 'member-1', displayName: 'Alice', order: 1 })],
      });
      service.setCurrentSession(session);
    });

    it('should update an existing player when receiving a realtime update', async () => {
      let capturedPlayersCallback: (data: unknown) => void = () => {
        /* noop */
      };
      let capturedSessionCallback: (data: unknown) => void = () => {
        /* noop */
      };

      mockRealtimeService.subscribeToDocument.and.callFake(
        (collectionId: string, _docId: string, callback: (data: unknown) => void) => {
          if (collectionId === 'ketal_sessions') {
            capturedSessionCallback = callback;
          }
          return Promise.resolve(`sub_${collectionId}`);
        }
      );

      mockRealtimeService.subscribeToCollection.and.callFake(
        (_collectionId: string, callback: (data: unknown) => void) => {
          capturedPlayersCallback = callback;
          return Promise.resolve('sub_players');
        }
      );

      await service.subscribeToSession('session-123');

      // Simulate update for existing player
      capturedPlayersCallback({
        $id: 'local-player-0',
        sessionId: 'session-123',
        memberId: 'member-1',
        displayName: 'Alice Updated',
        order: 1,
        cards: '["newcard"]',
        choices: '{"color":"red","plus_or_minus":"","in_out":"","suit":""}',
        sipsTaken: 3,
        sipsGiven: 1,
        isReady: true,
      });

      const current = service.currentSession()!;
      expect(current.players.length).toBe(1);
      expect(current.players[0].displayName).toBe('Alice Updated');
      expect(current.players[0].sipsTaken).toBe(3);
      expect(current.players[0].cards).toEqual(['newcard']);
    });

    it('should add a new player when receiving a doc with unknown $id', async () => {
      let capturedPlayersCallback: (data: unknown) => void = () => {
        /* noop */
      };
      let capturedSessionCallback: (data: unknown) => void = () => {
        /* noop */
      };

      mockRealtimeService.subscribeToDocument.and.callFake(
        (collectionId: string, _docId: string, callback: (data: unknown) => void) => {
          if (collectionId === 'ketal_sessions') {
            capturedSessionCallback = callback;
          }
          return Promise.resolve(`sub_${collectionId}`);
        }
      );

      mockRealtimeService.subscribeToCollection.and.callFake(
        (_collectionId: string, callback: (data: unknown) => void) => {
          capturedPlayersCallback = callback;
          return Promise.resolve('sub_players');
        }
      );

      await service.subscribeToSession('session-123');

      // Simulate a new player joining
      capturedPlayersCallback({
        $id: 'brand-new-doc',
        sessionId: 'session-123',
        memberId: 'member-2',
        displayName: 'Bob',
        order: 2,
        cards: '[]',
        choices: '{"color":"","plus_or_minus":"","in_out":"","suit":""}',
        sipsTaken: 0,
        sipsGiven: 0,
        isReady: false,
      });

      const current = service.currentSession()!;
      expect(current.players.length).toBe(2);
      expect(current.players[1].displayName).toBe('Bob');
    });

    it('should ignore player updates for different sessions', async () => {
      let capturedPlayersCallback: (data: unknown) => void = () => {
        /* noop */
      };
      let capturedSessionCallback: (data: unknown) => void = () => {
        /* noop */
      };

      mockRealtimeService.subscribeToDocument.and.callFake(
        (collectionId: string, _docId: string, callback: (data: unknown) => void) => {
          if (collectionId === 'ketal_sessions') {
            capturedSessionCallback = callback;
          }
          return Promise.resolve(`sub_${collectionId}`);
        }
      );

      mockRealtimeService.subscribeToCollection.and.callFake(
        (_collectionId: string, callback: (data: unknown) => void) => {
          capturedPlayersCallback = callback;
          return Promise.resolve('sub_players');
        }
      );

      await service.subscribeToSession('session-123');

      // Simulate update for a different session
      capturedPlayersCallback({
        $id: 'other-player',
        sessionId: 'other-session',
        memberId: 'member-99',
        displayName: 'Intruder',
        order: 1,
        cards: '[]',
        choices: '{}',
        sipsTaken: 0,
        sipsGiven: 0,
        isReady: false,
      });

      const current = service.currentSession()!;
      // Should still have only the original player
      expect(current.players.length).toBe(1);
      expect(current.players[0].displayName).toBe('Alice');
    });
  });
});
