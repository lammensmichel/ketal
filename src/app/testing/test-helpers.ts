import { NEVER, Subject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';

import { AuthService } from '../services/auth/auth.service';
import { GameService } from '../services/game/game.service';
import { PlayerHelperService } from '../_shared/_helpers/player.helper';
import { CardDeckHelperService } from '../_shared/_helpers/card-deck.helper';
import { LocalService } from '../services/local/local.service';
import { CardService } from '../services/card/card.service';
import { RoomService, GameRoom } from '../services/room/room.service';
import { KetalSessionService, KetalSession } from '../services/ketal-session/ketal-session.service';
import { MemberService, GameMember } from '../services/member/member.service';
import { RealtimeService } from '../services/realtime/realtime.service';
import { SoloRoomService } from '../services/solo-room/solo-room.service';
import { Game } from '../_shared/_models/game.model';
import { PlayerModel } from '../_shared/_models/player.model';
import { CardType } from '../_shared/_models/card-type.model';

// Jasmine type declaration for build context (no-op when jasmine is not available)
declare const jasmine: any;

/**
 * Mock object creator that simulates jasmine's createSpyObj API.
 * In test context, it wraps jasmine.createSpyObj. In build context, it creates a simple mock.
 */
function createMockObj(name: string, methods: string[] = [], props: Record<string, unknown> = {}): any {
  // Try to use jasmine if available (test context)
  if (typeof jasmine !== 'undefined' && jasmine.createSpyObj) {
    const spyObj: any = jasmine.createSpyObj(name, methods);
    Object.assign(spyObj, props);
    return spyObj;
  }

  // Fallback: simple mock object without spy functionality (build context)
  const mockObj: any = {};
  methods.forEach((method) => {
    // Create a spy-like function that supports basic methods
    mockObj[method] = function () {
      return mockObj[method].returnValue;
    };
    // Add basic and() API for compatibility
    mockObj[method].and = {
      returnValue: undefined,
      returnValues: [],
      resolveTo: function (val: any) {
        mockObj[method].returnValue = Promise.resolve(val);
        return this;
      },
      throws: function (err: any) {
        throw err;
      },
    };
  });
  Object.assign(mockObj, props);
  return mockObj;
}

/**
 * Factory function for creating RoomService mock (breaks circular dependency)
 * Usage: { provide: RoomService, useFactory: createRoomServiceFactory }
 */
export function createRoomServiceFactory(): any & {
  currentRoom: WritableSignal<GameRoom | null>;
} {
  return createMockRoomService();
}

/**
 * Factory function for creating AuthService mock (breaks circular dependency)
 * Usage: { provide: AuthService, useFactory: createAuthServiceFactory }
 */
export function createAuthServiceFactory(): any & {
  isLoggedIn: WritableSignal<boolean>;
  isAnonymous: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
} {
  return createMockAuthService();
}

/**
 * Factory function for creating GameService mock (breaks circular dependency)
 * Usage: { provide: GameService, useFactory: createGameServiceFactory }
 */
export function createGameServiceFactory(): any & {
  game: WritableSignal<Game>;
  players: WritableSignal<PlayerModel[]>;
  drinkingCards: WritableSignal<CardType[]>;
  givingCards: WritableSignal<CardType[]>;
} {
  return createMockGameService();
}

/**
 * Creates a mock AuthService for testing
 */
export function createMockAuthService(): any & {
  isLoggedIn: WritableSignal<boolean>;
  isAnonymous: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
} {
  const mockIsLoggedIn = signal<boolean>(false);
  const mockIsAnonymous = signal<boolean>(false);
  const mockIsLoading = signal<boolean>(false);

  const mock = createMockObj(
    'AuthService',
    [
      'init',
      'signUp',
      'loginWithEmail',
      'signInWithGoogle',
      'logout',
      'createAnonymousSession',
      'getOrCreateSession',
      'consumePendingSummary',
    ],
    {
      currentUser: signal(null),
      isLoggedIn: mockIsLoggedIn,
      isAnonymous: mockIsAnonymous,
      isLoading: mockIsLoading,
    }
  );

  mock.init.and.resolveTo(undefined);
  mock.signUp.and.resolveTo(undefined);
  mock.loginWithEmail.and.resolveTo(undefined);
  mock.logout.and.resolveTo(undefined);
  mock.createAnonymousSession.and.resolveTo(undefined);
  mock.consumePendingSummary.and.returnValue(false);

  return mock as any & {
    isLoggedIn: WritableSignal<boolean>;
    isAnonymous: WritableSignal<boolean>;
    isLoading: WritableSignal<boolean>;
  };
}

/**
 * Creates a mock GameService for testing
 */
export function createMockGameService(): any & {
  game: WritableSignal<Game>;
  players: WritableSignal<PlayerModel[]>;
  drinkingCards: WritableSignal<CardType[]>;
  givingCards: WritableSignal<CardType[]>;
} {
  // Create mock signals
  const mockWithSummaryMode = signal<boolean>(false);
  const mockGame = signal<Game>({
    players: [],
    turn: 1,
    phase: 1,
    maxTurnCount: 4,
    drinkingCards: [],
    givingCards: [],
    activePlayer: undefined,
    status: 0,
    summary: false,
  });
  const mockPlayers = signal<PlayerModel[]>([]);
  const mockDrinkingCards = signal<CardType[]>([]);
  const mockGivingCards = signal<CardType[]>([]);

  const mock = createMockObj(
    'GameService',
    [
      'isNewGame',
      'isGameStarted',
      'isGameFinished',
      'isSummaryMode',
      'isSummaryActivated',
      'isGameInProgress',
      'setStatus',
      'resetGame',
      'beginGame',
      'pickCard',
      'setChoiceAndPickCard',
      'displayNewCard',
      'addPlayerSip',
      'updatePlayerGivenSipsFromCard',
      'openSipGiveModal',
      'getLastTurnSipsForPlayer',
      'getLastTurnGivenForPlayer',
      'clearLastTurnGivenForPlayer',
      'clearPersistedSummary',
      'clearLastTurnIndicators',
      'addDrinkingCard',
      'addGivingCard',
      'addCardToPlayer',
      'saveCardAndSips',
      'addSips',
      'setCardChoice',
      'pauseGame',
      'resumeGame',
    ],
    {
      withSummaryMode: mockWithSummaryMode,
      game: mockGame,
      status: signal(0),
      turn: signal(1),
      phase: signal(1),
      players: mockPlayers,
      activePlayer: signal(undefined),
      drinkingCards: mockDrinkingCards,
      givingCards: mockGivingCards,
      summary: signal(false),
      gameMode: signal('local'),
      isRoomMode: signal(false),
      openSipGiveModalEvent$: NEVER,
      lastTurnSips: signal<Record<string, number>>({}),
      lastTurnGiven: signal<Record<string, number>>({}),
      phase2LastCardValue: signal<string | null>(null),
    }
  );
  mock.getLastTurnSipsForPlayer.and.returnValue(0);
  mock.getLastTurnGivenForPlayer.and.returnValue(0);
  mock.isNewGame.and.returnValue(true);
  mock.isGameStarted.and.returnValue(false);
  mock.isGameFinished.and.returnValue(false);
  mock.isSummaryMode.and.returnValue(false);
  mock.isSummaryActivated.and.returnValue(false);
  mock.isGameInProgress.and.returnValue(false);
  mock.clearLastTurnGivenForPlayer.and.callFake(() => {});
  mock.clearLastTurnIndicators.and.callFake(() => {});
  return mock as any & {
    game: WritableSignal<Game>;
    players: WritableSignal<PlayerModel[]>;
    drinkingCards: WritableSignal<CardType[]>;
    givingCards: WritableSignal<CardType[]>;
  };
}

/**
 * Creates a mock PlayerHelperService for testing
 */
export function createMockPlayerHelperService(): any {
  const mock = createMockObj('PlayerHelperService', [
    'getPlayerNumber',
    'getPlayers',
    'addPlayer',
    'deletePlayer',
    'savePlayerToStorage',
    'getPlayerCardListValues',
    'getSipCnt',
    'getTotalGivenSips',
    'getPlayerChoice',
    'isMaxPlayerNumberNotReached',
  ]);
  mock.getPlayerNumber.and.returnValue(0);
  mock.getPlayers.and.returnValue([]);
  mock.isMaxPlayerNumberNotReached.and.returnValue(true);
  mock.getSipCnt.and.returnValue(0);
  mock.getTotalGivenSips.and.returnValue(0);
  return mock;
}

/**
 * Creates a mock LocalService for testing
 */
export function createMockLocalService(): any {
  const mock = createMockObj('LocalService', ['getData', 'saveData', 'removeData', 'clearData']);
  mock.getData.and.returnValue(null);
  return mock;
}

/**
 * Creates a mock CardService for testing
 */
export function createMockCardService(): any {
  const mock = createMockObj('CardService', [
    'getCardValue',
    'lowerOrUpperCard',
    'lowestCard',
    'greatestCard',
    'isRedCard',
    'isBlackCard',
  ]);
  mock.getCardValue.and.returnValue(0);
  return mock;
}

/**
 * Creates a mock CardDeckHelperService for testing
 */
export function createMockCardDeckHelperService(): any {
  const mock = createMockObj('CardDeckHelperService', ['constructDeck', 'getRandomCard']);
  return mock;
}

/**
 * Creates a mock RoomService for testing
 */
export function createMockRoomService(): any & {
  currentRoom: WritableSignal<GameRoom | null>;
} {
  const mockCurrentRoom = signal<GameRoom | null>(null);

  const mock = createMockObj(
    'RoomService',
    [
      'createRoom',
      'createSoloRoom',
      'joinRoom',
      'leaveRoom',
      'deleteRoom',
      'getRoomByCode',
      'getRoomByInviteToken',
      'getMyRooms',
      'updateRoom',
      'setCurrentRoom',
      'subscribeToRoom',
    ],
    {
      currentRoom: mockCurrentRoom,
    }
  );

  // Setup default return values
  mock.createRoom.and.resolveTo(null);
  mock.createSoloRoom.and.resolveTo(null);
  mock.joinRoom.and.resolveTo(null);
  mock.leaveRoom.and.resolveTo(undefined);
  mock.deleteRoom.and.resolveTo(undefined);
  mock.getRoomByCode.and.resolveTo(null);
  mock.getRoomByInviteToken.and.resolveTo(null);
  mock.getMyRooms.and.resolveTo([]);
  mock.updateRoom.and.resolveTo(null);
  mock.subscribeToRoom.and.resolveTo('sub_room_123');

  return mock as any & {
    currentRoom: WritableSignal<GameRoom | null>;
  };
}

/**
 * Creates a mock KetalSessionService for testing
 */
export function createMockKetalSessionService(): any & {
  currentSession: WritableSignal<KetalSession | null>;
} {
  const mockCurrentSession = signal<KetalSession | null>(null);

  const mock = createMockObj(
    'KetalSessionService',
    ['startGame', 'updateSession', 'endGame', 'getSession', 'subscribeToSession', 'unsubscribe', 'setCurrentSession'],
    {
      currentSession: mockCurrentSession,
      isPlaying: signal(false),
      currentPhase: signal('setup'),
      players: signal([]),
      activePlayerId: signal(null),
    }
  );

  // Setup default return values
  mock.startGame.and.resolveTo(null);
  mock.updateSession.and.resolveTo(null);
  mock.endGame.and.resolveTo(undefined);
  mock.getSession.and.resolveTo(null);
  mock.subscribeToSession.and.resolveTo(undefined);

  return mock as any & {
    currentSession: WritableSignal<KetalSession | null>;
  };
}

/**
 * Creates a mock GameRoom for testing
 */
export function createMockGameRoom(overrides: Partial<GameRoom> = {}): GameRoom {
  return {
    $id: 'room-123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: 'invite-token-uuid',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'host-member-id',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 0,
    archived: false,
    ...overrides,
  };
}

/**
 * Creates a mock KetalSession for testing
 */
export function createMockKetalSession(overrides: Partial<KetalSession> = {}): KetalSession {
  return {
    $id: 'session-123',
    roomId: 'room-123',
    gameId: 'ketal',
    gameNumber: 1,
    status: 'waiting',
    phase: 'setup',
    turn: 0,
    activePlayerId: null,
    terminatedBy: null,
    players: [],
    drinkingCards: [],
    givingCards: [],
    withSummary: false,
    ...overrides,
  };
}

/**
 * Creates a mock MemberService for testing
 */
export function createMockMemberService(): any & {
  members: WritableSignal<GameMember[]>;
  currentMember: WritableSignal<GameMember | null>;
} {
  const mockMembers = signal<GameMember[]>([]);
  const mockCurrentMember = signal<GameMember | null>(null);

  const mock = createMockObj(
    'MemberService',
    [
      'createMember',
      'getMembersByRoom',
      'getMemberByUserId',
      'getMemberByDeviceId',
      'updateMember',
      'updateMemberStats',
      'deleteMember',
      'setCurrentMember',
      'setMembers',
    ],
    {
      members: mockMembers,
      currentMember: mockCurrentMember,
    }
  );

  // Setup default return values
  mock.createMember.and.resolveTo(null);
  mock.getMembersByRoom.and.resolveTo([]);
  mock.getMemberByUserId.and.resolveTo(null);
  mock.getMemberByDeviceId.and.resolveTo(null);
  mock.updateMember.and.resolveTo(null);
  mock.updateMemberStats.and.resolveTo(null);
  mock.deleteMember.and.resolveTo(undefined);

  return mock as any & {
    members: WritableSignal<GameMember[]>;
    currentMember: WritableSignal<GameMember | null>;
  };
}

/**
 * Creates a mock RealtimeService for testing
 */
export function createMockRealtimeService(): any {
  const mock = createMockObj(
    'RealtimeService',
    [
      'subscribeToRoom',
      'subscribeToSession',
      'subscribeToDocument',
      'subscribeToMembers',
      'subscribeToCollection',
      'unsubscribe',
      'unsubscribeAll',
      'hasSubscription',
      'getActiveSubscriptionIds',
    ],
    {
      isConnected: signal(true),
      activeSubscriptions: signal(0),
    }
  );

  mock.subscribeToRoom.and.resolveTo('sub_room_123');
  mock.subscribeToSession.and.resolveTo('sub_session_123');
  mock.subscribeToDocument.and.resolveTo('sub_document_123');
  mock.subscribeToMembers.and.resolveTo('sub_members_123');
  mock.subscribeToCollection.and.resolveTo('sub_collection_123');
  mock.hasSubscription.and.returnValue(false);
  mock.getActiveSubscriptionIds.and.returnValue([]);

  return mock;
}

/**
 * Creates a mock SoloRoomService for testing
 */
export function createMockSoloRoomService(): any & {
  localModeFallback: WritableSignal<boolean>;
  isCreating: WritableSignal<boolean>;
} {
  const mockLocalModeFallback = signal<boolean>(false);
  const mockIsCreating = signal<boolean>(false);

  const mock = createMockObj(
    'SoloRoomService',
    ['startBackgroundRoomCreation', 'awaitRoom', 'checkActiveSession', 'reset'],
    {
      localModeFallback: mockLocalModeFallback,
      isCreating: mockIsCreating,
    }
  );

  mock.awaitRoom.and.resolveTo(null);
  mock.checkActiveSession.and.resolveTo(null);

  return mock as any & {
    localModeFallback: WritableSignal<boolean>;
    isCreating: WritableSignal<boolean>;
  };
}

/**
 * Creates a mock AppwriteService for testing
 */
export function createMockAppwriteService(): any & {
  initialized: ReturnType<typeof signal<boolean>>;
  connected: ReturnType<typeof signal<boolean>>;
  client: any;
  account: any;
  databases: any;
  databaseId: string;
  subscribe: any;
  setConnected: any;
} {
  const mockInitialized = signal<boolean>(true);
  const mockConnected = signal<boolean>(true);
  const mockClient = createMockObj('Client', ['subscribe']);
  const mockAccount = createMockObj('Account', ['get']);
  const mockDatabases = createMockObj('Databases', ['listDocuments']);

  const mock = createMockObj('AppwriteService', ['subscribe', 'setConnected'], {
    initialized: mockInitialized,
    connected: mockConnected,
    client: mockClient,
    account: mockAccount,
    databases: mockDatabases,
    databaseId: 'fug',
  });

  mock.subscribe.and.returnValue(() => {}); // Return unsubscribe function
  mock.setConnected.and.returnValue(undefined);

  return mock as any & {
    initialized: ReturnType<typeof signal<boolean>>;
    connected: ReturnType<typeof signal<boolean>>;
    client: any;
    account: any;
    databases: any;
    databaseId: string;
    subscribe: any;
    setConnected: any;
  };
}
