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

/**
 * Creates a mock AuthService for testing
 */
export function createMockAuthService(): jasmine.SpyObj<AuthService> & {
  isLoggedIn: WritableSignal<boolean>;
  isAnonymous: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
} {
  const mockIsLoggedIn = signal<boolean>(false);
  const mockIsAnonymous = signal<boolean>(false);
  const mockIsLoading = signal<boolean>(false);

  const mock = jasmine.createSpyObj(
    'AuthService',
    ['init', 'signUp', 'loginWithEmail', 'signInWithGoogle', 'logout', 'createAnonymousSession', 'getOrCreateSession', 'consumePendingSummary'],
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

  return mock as jasmine.SpyObj<AuthService> & {
    isLoggedIn: WritableSignal<boolean>;
    isAnonymous: WritableSignal<boolean>;
    isLoading: WritableSignal<boolean>;
  };
}

/**
 * Creates a mock GameService for testing
 */
export function createMockGameService(): jasmine.SpyObj<GameService> & {
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

  const mock = jasmine.createSpyObj(
    'GameService',
    [
      'isNewGame',
      'isGameStarted',
      'isGameFinished',
      'isSummaryMode',
      'isSummaryActivated',
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
    }
  );
  mock.getLastTurnSipsForPlayer.and.returnValue(0);
  mock.isNewGame.and.returnValue(true);
  mock.isGameStarted.and.returnValue(false);
  mock.isGameFinished.and.returnValue(false);
  mock.isSummaryMode.and.returnValue(false);
  mock.isSummaryActivated.and.returnValue(false);
  return mock as jasmine.SpyObj<GameService> & {
    game: WritableSignal<Game>;
    players: WritableSignal<PlayerModel[]>;
    drinkingCards: WritableSignal<CardType[]>;
    givingCards: WritableSignal<CardType[]>;
  };
}

/**
 * Creates a mock PlayerHelperService for testing
 */
export function createMockPlayerHelperService(): jasmine.SpyObj<PlayerHelperService> {
  const mock = jasmine.createSpyObj('PlayerHelperService', [
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
export function createMockLocalService(): jasmine.SpyObj<LocalService> {
  const mock = jasmine.createSpyObj('LocalService', ['getData', 'saveData', 'removeData', 'clearData']);
  mock.getData.and.returnValue(null);
  return mock;
}

/**
 * Creates a mock CardService for testing
 */
export function createMockCardService(): jasmine.SpyObj<CardService> {
  const mock = jasmine.createSpyObj('CardService', [
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
export function createMockCardDeckHelperService(): jasmine.SpyObj<CardDeckHelperService> {
  const mock = jasmine.createSpyObj('CardDeckHelperService', ['constructDeck', 'getRandomCard']);
  return mock;
}

/**
 * Creates a mock RoomService for testing
 */
export function createMockRoomService(): jasmine.SpyObj<RoomService> & {
  currentRoom: WritableSignal<GameRoom | null>;
} {
  const mockCurrentRoom = signal<GameRoom | null>(null);

  const mock = jasmine.createSpyObj(
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
  mock.subscribeToRoom.and.returnValue('subscription-id');

  return mock as jasmine.SpyObj<RoomService> & {
    currentRoom: WritableSignal<GameRoom | null>;
  };
}

/**
 * Creates a mock KetalSessionService for testing
 */
export function createMockKetalSessionService(): jasmine.SpyObj<KetalSessionService> & {
  currentSession: WritableSignal<KetalSession | null>;
} {
  const mockCurrentSession = signal<KetalSession | null>(null);

  const mock = jasmine.createSpyObj(
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
  mock.subscribeToSession.and.stub();

  return mock as jasmine.SpyObj<KetalSessionService> & {
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
export function createMockMemberService(): jasmine.SpyObj<MemberService> & {
  members: WritableSignal<GameMember[]>;
  currentMember: WritableSignal<GameMember | null>;
} {
  const mockMembers = signal<GameMember[]>([]);
  const mockCurrentMember = signal<GameMember | null>(null);

  const mock = jasmine.createSpyObj(
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

  return mock as jasmine.SpyObj<MemberService> & {
    members: WritableSignal<GameMember[]>;
    currentMember: WritableSignal<GameMember | null>;
  };
}

/**
 * Creates a mock RealtimeService for testing
 */
export function createMockRealtimeService(): jasmine.SpyObj<RealtimeService> {
  const mock = jasmine.createSpyObj(
    'RealtimeService',
    ['subscribeToRoom', 'subscribeToSession', 'subscribeToDocument', 'subscribeToMembers', 'subscribeToCollection', 'unsubscribe', 'unsubscribeAll', 'hasSubscription', 'getActiveSubscriptionIds'],
    {
      isConnected: signal(true),
      activeSubscriptions: signal(0),
    }
  );

  mock.subscribeToRoom.and.returnValue('sub_room_123');
  mock.subscribeToSession.and.returnValue('sub_session_123');
  mock.subscribeToDocument.and.returnValue('sub_document_123');
  mock.subscribeToMembers.and.returnValue('sub_members_123');
  mock.subscribeToCollection.and.returnValue('sub_collection_123');
  mock.hasSubscription.and.returnValue(false);
  mock.getActiveSubscriptionIds.and.returnValue([]);

  return mock;
}

/**
 * Creates a mock SoloRoomService for testing
 */
export function createMockSoloRoomService(): jasmine.SpyObj<SoloRoomService> & {
  localModeFallback: WritableSignal<boolean>;
  isCreating: WritableSignal<boolean>;
} {
  const mockLocalModeFallback = signal<boolean>(false);
  const mockIsCreating = signal<boolean>(false);

  const mock = jasmine.createSpyObj(
    'SoloRoomService',
    ['startBackgroundRoomCreation', 'awaitRoom', 'checkActiveSession', 'reset'],
    {
      localModeFallback: mockLocalModeFallback,
      isCreating: mockIsCreating,
    }
  );

  mock.awaitRoom.and.resolveTo(null);
  mock.checkActiveSession.and.resolveTo(null);

  return mock as jasmine.SpyObj<SoloRoomService> & {
    localModeFallback: WritableSignal<boolean>;
    isCreating: WritableSignal<boolean>;
  };
}
