import { TestBed, inject } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { GameService } from './game.service';
import { LocalService } from '../local/local.service';
import { CardService } from '../card/card.service';
import { RoomService } from '../room/room.service';
import { AuthService } from '../auth/auth.service';
import { KetalSessionService } from '../ketal-session/ketal-session.service';
import { MemberService } from '../member/member.service';
import { PlayerHelperService } from '../../_shared/_helpers/player.helper';
import { CardDeckHelperService } from '../../_shared/_helpers/card-deck.helper';
import {
  createMockLocalService,
  createMockCardService,
  createMockPlayerHelperService,
  createMockCardDeckHelperService,
  createMockRoomService,
  createMockAuthService,
  createMockKetalSessionService,
  createMockMemberService,
  createMockRealtimeService,
  createMockSoloRoomService,
  createMockAppwriteService,
  createMockGameRoom,
  createMockKetalSession,
} from '../../testing/test-helpers';
import { RealtimeService } from '../realtime/realtime.service';
import { SoloRoomService } from '../solo-room/solo-room.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { Game } from '../../_shared/_models/game.model';
import { PlayerModel } from '../../_shared/_models/player.model';
import { CardType } from '../../_shared/_models/card-type.model';
import { ColorsEnum } from '../../_shared/_models/enums/color.enum';
import { PlusOrMinusEnum } from '../../_shared/_models/enums/plus_minus.enum';
import { InAndOutEnum } from '../../_shared/_models/enums/in_out.enum';
import { DrinkChoiceEnum } from '../../_shared/_models/enums/drink_choice.enum';

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Creates a mock card with default values
 */
function createMockCard(overrides: Partial<CardType> = {}): CardType {
  return {
    value: '5',
    suit: 'hearts',
    icon: 'heart',
    sips: 0,
    selected: false,
    img: 'card-image.png',
    givenSips: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock player with default values
 */
function createMockPlayer(overrides: Partial<PlayerModel> = {}): PlayerModel {
  const player = new PlayerModel();
  player.id = 'player-1';
  player.name = 'Test Player';
  player.avatarSrc = 'avatar.png';
  player.cards = [];
  player.choice = {
    color: '',
    plus_or_minus: '',
    in_out: '',
    suit: '',
  };
  player.sips = {
    drunk: 0,
    given: 0,
  };

  return { ...player, ...overrides } as PlayerModel;
}

/**
 * Creates a mock game with default values
 */
function createMockGame(overrides: Partial<Game> = {}): Game {
  return {
    players: [createMockPlayer()],
    turn: 1,
    maxTurnCount: 4,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: undefined,
    status: 0,
    summary: false,
    ...overrides,
  };
}

describe('GameService', () => {
  let service: GameService;
  let mockLocalService: jasmine.SpyObj<LocalService>;
  let mockCardService: jasmine.SpyObj<CardService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockCardDeckHelperService: jasmine.SpyObj<CardDeckHelperService>;
  let mockRoomService: ReturnType<typeof createMockRoomService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockKetalSessionService: ReturnType<typeof createMockKetalSessionService>;
  let mockMemberService: ReturnType<typeof createMockMemberService>;
  let mockRealtimeService: ReturnType<typeof createMockRealtimeService>;
  let mockSoloRoomService: ReturnType<typeof createMockSoloRoomService>;

  beforeEach(() => {
    localStorage.removeItem('ketal_summary_mode');
    mockLocalService = createMockLocalService();
    mockCardService = createMockCardService();
    mockPlayerHelperService = createMockPlayerHelperService();
    mockCardDeckHelperService = createMockCardDeckHelperService();
    mockRoomService = createMockRoomService();
    mockAuthService = createMockAuthService();
    mockKetalSessionService = createMockKetalSessionService();
    mockMemberService = createMockMemberService();
    mockRealtimeService = createMockRealtimeService();
    mockSoloRoomService = createMockSoloRoomService();

    // Break the circular dependency by using factory functions for RoomService and AuthService
    // Angular's DI cycle detection works by exploring the graph BEFORE considering useValue.
    // By using factory functions, we defer the actual value creation until after DI resolution.
    const mockRoomServiceFactory = () => mockRoomService;
    const mockAuthServiceFactory = () => mockAuthService;

    // Create factory functions that return the pre-created mock objects
    // This breaks the circular dependency by deferring object creation
    const roomServiceFactory = () => mockRoomService;
    const authServiceFactory = () => mockAuthService;

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: LocalService, useValue: mockLocalService },
        { provide: CardService, useValue: mockCardService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
        // Use factory to break circular dependency between RoomService and AuthService
        { provide: RoomService, useFactory: roomServiceFactory },
        { provide: AuthService, useFactory: authServiceFactory },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: SoloRoomService, useValue: mockSoloRoomService },
        { provide: AppwriteService, useValue: createMockAppwriteService() },
      ],
    });
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // Constructor and Initialization Tests
  // ==========================================================================
  describe('Constructor and Initialization', () => {
    it('should initialize game from local storage on construction', () => {
      const mockGame = createMockGame();
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

      // Factory functions to break circular dependency
      const mockRoomServiceFactory = () => mockRoomService;
      const mockAuthServiceFactory = () => mockAuthService;

      // Re-create service to trigger constructor
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      const newService = TestBed.inject(GameService);

      expect(newService.game).toBeDefined();
      expect(newService.game().players).toEqual(mockGame.players);
      expect(newService.game().turn).toBe(mockGame.turn);
    });

    it('should return empty game when no data in local storage', () => {
      mockLocalService.getData.and.returnValue(null);

      // Factory functions to break circular dependency
      const mockRoomServiceFactory = () => mockRoomService;
      const mockAuthServiceFactory = () => mockAuthService;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      const newService = TestBed.inject(GameService);

      expect(newService.game).toBeDefined();
      // When no data, game() returns empty game structure
      expect(newService.game().players).toEqual([]);
      expect(newService.game().status).toBe(0);
    });
  });

  // ==========================================================================
  // Game State Management Tests
  // ==========================================================================
  describe('Game State Management', () => {
    describe('game computed signal', () => {
      it('should return game from local storage on initialization', () => {
        const mockGame = createMockGame();
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        // Re-create service to trigger constructor with mock data
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        const result = newService.game();

        expect(mockLocalService.getData).toHaveBeenCalledWith('game');
        expect(result.players).toEqual(mockGame.players);
        expect(result.turn).toBe(mockGame.turn);
        expect(result.status).toBe(mockGame.status);
        expect(result.phase).toBe(mockGame.phase);
      });

      it('should return empty game structure when no data in storage', () => {
        mockLocalService.getData.and.returnValue(null);

        // Re-create service
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        const result = newService.game();

        expect(result.players).toEqual([]);
        expect(result.status).toBe(0);
      });
    });

    describe('setCardChoice', () => {
      it('should set the card choice for the active player', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        // Re-create service with mock data
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        newService.setCardChoice('color', 'red', 'player-1');

        expect(newService.game().players[0].choice['color']).toBe('red');
        expect(newService.game().activePlayer?.id).toBe('player-1');
      });

      it('should not change anything if player not found', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        // Re-create service with mock data
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        newService.setCardChoice('color', 'red', 'non-existent-player');

        expect(newService.game().players[0].choice['color']).toBe('');
      });
    });
  });

  // ==========================================================================
  // Game Status Methods Tests
  // ==========================================================================
  describe('Game Status Methods', () => {
    describe('status computed signal', () => {
      it('should return 0 when game is not defined', () => {
        mockLocalService.getData.and.returnValue(null);

        // Re-create service with full providers
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.status()).toBe(0);
      });

      it('should return game status when game is defined', () => {
        const mockGame = createMockGame({ status: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        // Re-create service
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.status()).toBe(2);
      });
    });

    describe('isNewGame', () => {
      it('should return true when status is 0', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isNewGame()).toBe(true);
      });

      it('should return false when status is not 0', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isNewGame()).toBe(false);
      });
    });

    describe('isGameStarted', () => {
      it('should return true when status is 1', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isGameStarted()).toBe(true);
      });

      it('should return false when status is not 1', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isGameStarted()).toBe(false);
      });
    });

    describe('isGameFinished', () => {
      it('should return true when status is 2', () => {
        const mockGame = createMockGame({ status: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isGameFinished()).toBe(true);
      });

      it('should return false when status is not 2', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isGameFinished()).toBe(false);
      });
    });

    describe('isSummaryMode', () => {
      it('should return true when summary is activated and status is 3', () => {
        const mockGame = createMockGame({ status: 3, summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isSummaryMode()).toBe(true);
      });

      it('should return false when summary is not activated', () => {
        const mockGame = createMockGame({ status: 3, summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isSummaryMode()).toBe(false);
      });

      it('should return false when status is not 3', () => {
        const mockGame = createMockGame({ status: 1, summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isSummaryMode()).toBe(false);
      });
    });

    describe('isSummaryActivated', () => {
      it('should return true when game summary is true', () => {
        const mockGame = createMockGame({ summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isSummaryActivated()).toBe(true);
      });

      it('should return false when game summary is false', () => {
        const mockGame = createMockGame({ summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.isSummaryActivated()).toBe(false);
      });
    });

    describe('setStatus', () => {
      it('should set the game status', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        newService.setStatus(2);

        expect(newService.game().status).toBe(2);
      });
    });

    describe('withSummaryMode', () => {
      afterEach(() => {
        localStorage.removeItem('ketal_summary_mode');
      });

      it('should return false when no value in localStorage', () => {
        localStorage.removeItem('ketal_summary_mode');

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.withSummaryMode()).toBe(false);
      });

      it('should return true when localStorage has "true"', () => {
        localStorage.setItem('ketal_summary_mode', 'true');

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
            { provide: RealtimeService, useValue: mockRealtimeService },
            { provide: SoloRoomService, useValue: mockSoloRoomService },
          ],
        });
        const newService = TestBed.inject(GameService);

        expect(newService.withSummaryMode()).toBe(true);
      });

      it('should persist value to localStorage when set to true', () => {
        localStorage.removeItem('ketal_summary_mode');

        service.withSummaryMode.set(true);
        TestBed.flushEffects();

        expect(localStorage.getItem('ketal_summary_mode')).toBe('true');
      });

      it('should persist value to localStorage when set to false', () => {
        localStorage.setItem('ketal_summary_mode', 'true');

        service.withSummaryMode.set(false);
        TestBed.flushEffects();

        expect(localStorage.getItem('ketal_summary_mode')).toBe('false');
      });

      it('should update value when set is called', () => {
        expect(service.withSummaryMode()).toBe(false);

        service.withSummaryMode.set(true);

        expect(service.withSummaryMode()).toBe(true);
      });

      it('should support update method', () => {
        expect(service.withSummaryMode()).toBe(false);

        service.withSummaryMode.update((v) => !v);

        expect(service.withSummaryMode()).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Player Sips Calculation Methods Tests
  // ==========================================================================
  describe('Player Sips Calculation Methods', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game): GameService {
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    describe('getSipsNumberForColorChoice (via assignSipsForFirstTurn)', () => {
      it('should return 1 sip when player chose red but card is black', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Red, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'spades' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isBlackCard.and.returnValue(true);
        mockCardService.isRedCard.and.returnValue(false);

        testService.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(1);
        expect(testService.game().players[0].sips['drunk']).toBe(1);
      });

      it('should return 1 sip when player chose black but card is red', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Black, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Black);
        mockCardService.isBlackCard.and.returnValue(false);
        mockCardService.isRedCard.and.returnValue(true);

        testService.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(1);
      });

      it('should return 0 sips when player chose correctly', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Red, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isBlackCard.and.returnValue(false);
        mockCardService.isRedCard.and.returnValue(true);

        testService.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(0);
      });
    });

    describe('getSipsNumberForMinusChoice (via assignSipsForFirstTurn turn 2)', () => {
      it('should return 4 sips when new card value equals previous card value', () => {
        const previousCard = createMockCard({ value: '5' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(5, 5); // previous = 5, new = 5

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(4);
      });

      it('should return 2 sips when player chose plus but new card is lower', () => {
        const previousCard = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '3' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(7, 3); // previous = 7, new = 3

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(2);
      });

      it('should return 2 sips when player chose minus but new card is higher', () => {
        const previousCard = createMockCard({ value: '3' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Minus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Minus);
        mockCardService.getCardValue.and.returnValues(3, 7); // previous = 3, new = 7

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(2);
      });

      it('should return 0 sips when player chose correctly', () => {
        const previousCard = createMockCard({ value: '3' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(3, 7); // previous = 3, new = 7

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });
    });

    describe('getSipsNumberForInAndOutChoice (via assignSipsForFirstTurn turn 3)', () => {
      it('should return 6 sips when new card value equals lowest card value', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '3' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(6);
      });

      it('should return 6 sips when new card value equals highest card value', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(6);
      });

      it('should return 0 sips when player chose in and new card is between', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '5') {
            return 5;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });

      it('should return 3 sips when player chose in but new card is outside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '9' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '9') {
            return 9;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(3);
      });

      it('should return 0 sips when player chose out and new card is outside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.Out, suit: '' },
        });
        const newCard = createMockCard({ value: '9' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.Out);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '9') {
            return 9;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });

      it('should return 3 sips when player chose out but new card is inside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.Out, suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.Out);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '5') {
            return 5;
          }
          return 0;
        });

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(3);
      });
    });

    describe('getSipsNumberForSuitChoice (via assignSipsForFirstTurn turn 4)', () => {
      it('should return 4 sips when player chose wrong suit', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [createMockCard(), createMockCard(), createMockCard()],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
        });
        const newCard = createMockCard({ suit: 'spades' });
        const mockGame = createMockGame({ players: [player], turn: 4 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(4);
      });

      it('should return 0 sips when player chose correct suit', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [createMockCard(), createMockCard(), createMockCard()],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
        });
        const newCard = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 4 });
        const testService = createServiceWithGame(mockGame);

        mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

        testService.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });
    });
  });

  // ==========================================================================
  // assignSipsForFirstTurn Tests
  // ==========================================================================
  describe('assignSipsForFirstTurn', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game): GameService {
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    it('should return early if player not found', () => {
      const mockGame = createMockGame({ players: [], turn: 1 });
      const testService = createServiceWithGame(mockGame);

      const card = createMockCard();
      testService.assignSipsForFirstTurn(card, 'non-existent-player');

      expect(card.sips).toBe(0); // Unchanged
    });

    it('should not assign sips for turns other than 1-4', () => {
      const player = createMockPlayer({ id: 'player-1' });
      const mockGame = createMockGame({ players: [player], turn: 5 });
      const testService = createServiceWithGame(mockGame);

      const card = createMockCard();
      testService.assignSipsForFirstTurn(card, 'player-1');

      // Card sips should remain undefined for turn 5 (no assignment happens)
      expect(card.sips).toBe(0);
    });
  });

  // ==========================================================================
  // addPlayerSip Tests
  // ==========================================================================
  describe('addPlayerSip', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game): GameService {
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    it('should add drunk sips when player has less than 4 cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.addPlayerSip(player, 3);

      expect(testService.game().players[0].sips['drunk']).toBe(3);
    });

    it('should add drunk sips when drink=true and player has 4+ cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.addPlayerSip(player, 3, true);

      expect(testService.game().players[0].sips['drunk']).toBe(3);
    });

    it('should add given sips when drink=false and player has 4+ cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.addPlayerSip(player, 3, false);

      expect(testService.game().players[0].sips['given']).toBe(3);
    });

    it('should not add sips when sipNbr is 0', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard()],
        sips: { drunk: 5, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.addPlayerSip(player, 0);

      expect(testService.game().players[0].sips['drunk']).toBe(5); // Unchanged
    });

    it('should not add sips when player not found', () => {
      const player = createMockPlayer({ id: 'player-1' });
      const unknownPlayer = createMockPlayer({ id: 'unknown' });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.addPlayerSip(unknownPlayer, 3);

      expect(testService.game().players[0].sips['drunk']).toBe(0);
    });

    it('should save to local storage after adding sips', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);
      mockLocalService.saveData.calls.reset();

      testService.addPlayerSip(player, 3);

      expect(mockLocalService.saveData).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // pickCard Tests
  // ==========================================================================
  describe('pickCard', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game | null): GameService {
      mockLocalService.getData.and.returnValue(mockGame ? JSON.stringify(mockGame) : null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    it('should not pick card when game is undefined', () => {
      const testService = createServiceWithGame(null);

      testService.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
    });

    it('should not pick card when activePlayer is undefined', () => {
      const mockGame = createMockGame({ activePlayer: undefined });
      const testService = createServiceWithGame(mockGame);

      testService.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
    });

    it('should pick a card and add it to active player', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({ players: [player], activePlayer: player, turn: 1 });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard({ value: '5', suit: 'hearts' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
      mockCardService.isBlackCard.and.returnValue(false);
      mockCardService.isRedCard.and.returnValue(true);

      testService.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).toHaveBeenCalled();
      expect(testService.game().players[0].cards.length).toBe(1);
    });

    it('should move to next player after picking card', () => {
      const player1 = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const player2 = createMockPlayer({
        id: 'player-2',
        cards: [],
        choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player1, player2],
        activePlayer: player1,
        turn: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      testService.pickCard();

      expect(testService.game().activePlayer?.id).toBe('player-2');
    });

    it('should set activePlayer to first player and increment turn when last player picks', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      testService.pickCard();

      // When last player picks and turn < 4, turn increments and activePlayer is set to first player
      expect(testService.game().turn).toBe(2);
      expect(testService.game().activePlayer?.id).toBe('player-1');
    });

    it('should increment turn when all players made choices', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      testService.pickCard();

      expect(testService.game().turn).toBe(2);
    });

    it('should set phase to 2 when turn exceeds 4', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard()],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 4,
        phase: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

      testService.pickCard();

      expect(testService.game().phase).toBe(2);
    });

    it('should set lastTurnSips for the active player after picking a card', () => {
      const player1 = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const player2 = createMockPlayer({
        id: 'player-2',
        cards: [],
        choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player1, player2],
        activePlayer: player1,
        turn: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard({ value: '5', suit: 'hearts' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
      mockCardService.isBlackCard.and.returnValue(true);
      mockCardService.isRedCard.and.returnValue(false);

      testService.pickCard();

      // Player 1 predicted red but got black => 1 sip
      expect(testService.getLastTurnSipsForPlayer('player-1')).toBe(1);
      expect(testService.getLastTurnSipsForPlayer('player-2')).toBe(0);
    });

    it('should keep lastTurnSips when a new round starts (last player result visible)', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 1,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard({ value: '5', suit: 'hearts' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
      mockCardService.isBlackCard.and.returnValue(true);
      mockCardService.isRedCard.and.returnValue(false);

      testService.pickCard();

      // Last player's result persists until next player picks
      expect(testService.getLastTurnSipsForPlayer('player-1')).toBe(1);
    });

    it('should keep lastTurnSips when entering Phase 2 and reset on first Phase 2 card draw', () => {
      // Player has 3 hand cards all with default value '5' (from createMockCard).
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard()],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 4,
        phase: 1,
      });
      const testService = createServiceWithGame(mockGame);

      // Turn-4 pickCard returns a value '5' card. Suit prediction wrong → 4 sips.
      const drawnPhase1Card = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(drawnPhase1Card);
      mockPlayerHelperService.getPlayerChoice.and.returnValue('spades');

      testService.pickCard();

      // lastTurnSips persists across the Phase 1 → Phase 2 transition.
      expect(testService.game().phase).toBe(2);
      expect(testService.getLastTurnSipsForPlayer('player-1')).toBe(4);

      // First Phase 2 card draw: use a card with a value the player does NOT
      // hold so the per-draw map stays empty (otherwise the new effect would
      // populate it with the count of matching hand cards).
      const phase2Card = createMockCard({ value: 'K', suit: 'clubs' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(phase2Card);
      testService.displayNewCard();
      expect(testService.getLastTurnSipsForPlayer('player-1')).toBe(0);
    });
  });

  // ==========================================================================
  // displayNewCard (Phase 2) Tests
  // ==========================================================================
  describe('displayNewCard', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game | null): GameService {
      mockLocalService.getData.and.returnValue(mockGame ? JSON.stringify(mockGame) : null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    it('should return early if game is undefined', () => {
      const testService = createServiceWithGame(null);

      const result = testService.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should return early if 6 giving cards already exist', () => {
      const mockGame = createMockGame({
        givingCards: [
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
        ],
      });
      const testService = createServiceWithGame(mockGame);

      const result = testService.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should display a new card and deselect all previous cards', () => {
      const existingCard = createMockCard({ selected: true });
      const mockGame = createMockGame({
        givingCards: [existingCard],
        drinkingCards: [],
        players: [createMockPlayer({ cards: [] })],
        summary: false,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard({ value: '7' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      testService.displayNewCard();

      // The existing card in givingCards should be deselected
      expect(testService.game().givingCards[0].selected).toBe(false);
    });

    it('should return early if not all sips given in summary mode', () => {
      const cardWithGivenSips = createMockCard({ givenSips: 2 });
      const player = createMockPlayer({ cards: [cardWithGivenSips] });
      const mockGame = createMockGame({
        givingCards: [],
        drinkingCards: [createMockCard()],
        players: [player],
        summary: true,
      });
      const testService = createServiceWithGame(mockGame);

      const result = testService.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should set game status to 2 when 6 giving cards are reached', () => {
      const mockGame = createMockGame({
        givingCards: [createMockCard(), createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        drinkingCards: [
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
        ],
        players: [createMockPlayer()],
        summary: false,
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      testService.displayNewCard();

      expect(testService.game().status).toBe(2);
    });

    it('should mark new card as selected', () => {
      const mockGame = createMockGame({
        givingCards: [],
        drinkingCards: [],
        players: [createMockPlayer()],
      });
      const testService = createServiceWithGame(mockGame);

      const newCard = createMockCard({ selected: false });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      const result = testService.displayNewCard();

      expect(result?.selected).toBe(true);
    });
  });

  // ==========================================================================
  // beginGame Tests
  // ==========================================================================
  describe('beginGame', () => {
    it('should construct deck and initialize game', () => {
      const players = [createMockPlayer({ id: 'player-1' }), createMockPlayer({ id: 'player-2' })];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(mockCardDeckHelperService.constructDeck).toHaveBeenCalled();
      expect(service.game().turn).toBe(1);
      expect(service.game().phase).toBe(1);
      expect(service.game().status).toBe(1);
    });

    it('should set maxTurnCount to players.length * 4', () => {
      const players = [
        createMockPlayer({ id: 'player-1' }),
        createMockPlayer({ id: 'player-2' }),
        createMockPlayer({ id: 'player-3' }),
      ];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game().maxTurnCount).toBe(12);
    });

    it('should set first player as active player', () => {
      const players = [createMockPlayer({ id: 'player-1' }), createMockPlayer({ id: 'player-2' })];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game().activePlayer?.id).toBe('player-1');
    });

    it('should initialize empty drinkingCards and givingCards arrays', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game().drinkingCards).toEqual([]);
      expect(service.game().givingCards).toEqual([]);
    });

    it('should set summary mode to false by default', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game().summary).toBe(false);
    });

    it('should set summary mode to true when passed as parameter', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame(true);

      expect(service.game().summary).toBe(true);
    });
  });

  // ==========================================================================
  // resetGame Tests
  // ==========================================================================
  describe('resetGame', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game): GameService {
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    it('should reset game status to 0', () => {
      const mockGame = createMockGame({ status: 2 });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.game().status).toBe(0);
    });

    it('should not reset withSummaryMode preference', () => {
      const mockGame = createMockGame({ status: 2 });
      const testService = createServiceWithGame(mockGame);

      testService.withSummaryMode.set(true);
      testService.resetGame();

      expect(testService.withSummaryMode()).toBe(true);
    });

    it('should reset givingCards and drinkingCards to empty arrays', () => {
      const mockGame = createMockGame({
        givingCards: [createMockCard()],
        drinkingCards: [createMockCard()],
      });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.game().givingCards).toEqual([]);
      expect(testService.game().drinkingCards).toEqual([]);
    });

    it('should reset phase and turn to 0', () => {
      const mockGame = createMockGame({ phase: 2, turn: 4 });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.game().phase).toBe(0);
      expect(testService.game().turn).toBe(0);
    });

    it('should reset activePlayer to undefined', () => {
      const player = createMockPlayer();
      const mockGame = createMockGame({ activePlayer: player });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.game().activePlayer).toBeUndefined();
    });

    it('should reset all players sips, cards, and choices', () => {
      const player = createMockPlayer({
        sips: { drunk: 10, given: 5 },
        cards: [createMockCard()],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
      });
      const mockGame = createMockGame({ players: [player] });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.game().players[0].sips).toEqual({ drunk: 0, given: 0, phase1Drunk: 0 });
      expect(testService.game().players[0].cards).toEqual([]);
      expect(testService.game().players[0].choice).toEqual({
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: '',
      });
    });

    it('should save players to storage after reset', () => {
      const mockGame = createMockGame({ players: [createMockPlayer()] });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(mockPlayerHelperService.savePlayerToStorage).toHaveBeenCalled();
    });

    it('should clear lastTurnSips on reset', () => {
      const mockGame = createMockGame({ status: 2 });
      const testService = createServiceWithGame(mockGame);

      testService.resetGame();

      expect(testService.getLastTurnSipsForPlayer('player-1')).toBe(0);
    });
  });

  // ==========================================================================
  // isChoiceUndefinedOrWhiteSpace Tests
  // ==========================================================================
  describe('isChoiceUndefinedOrWhiteSpace', () => {
    it('should return true for empty string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('')).toBe(true);
    });

    it('should return true for whitespace only string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('   ')).toBe(true);
    });

    it('should return true for null', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(null as unknown as string)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(undefined as unknown as string)).toBe(true);
    });

    it('should return false for valid string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('red')).toBe(false);
    });

    it('should return false for string with spaces but also content', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(' red ')).toBe(false);
    });
  });

  // ==========================================================================
  // Additional Methods Tests
  // ==========================================================================
  describe('Additional Methods', () => {
    // Helper function to create service with specific game state
    function createServiceWithGame(mockGame: Game | null): GameService {
      mockLocalService.getData.and.returnValue(mockGame ? JSON.stringify(mockGame) : null);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    describe('addDrinkingCard', () => {
      it('should add card to drinkingCards array', () => {
        const mockGame = createMockGame({ drinkingCards: [] });
        const testService = createServiceWithGame(mockGame);

        const card = createMockCard();
        testService.addDrinkingCard(card);

        expect(testService.game().drinkingCards.length).toBe(1);
      });
    });

    describe('addGivingCard', () => {
      it('should add card to givingCards array', () => {
        const mockGame = createMockGame({ givingCards: [] });
        const testService = createServiceWithGame(mockGame);

        const card = createMockCard();
        testService.addGivingCard(card);

        expect(testService.game().givingCards.length).toBe(1);
      });
    });

    describe('addCardToPlayer', () => {
      it('should add card to player cards array', () => {
        const player = createMockPlayer({ id: 'player-1', cards: [] });
        const mockGame = createMockGame({ players: [player], activePlayer: player });
        const testService = createServiceWithGame(mockGame);

        const card = createMockCard();
        testService.addCardToPlayer(card, 'player-1');

        expect(testService.game().players[0].cards.length).toBe(1);
      });

      it('should not add card if player not found', () => {
        const player = createMockPlayer({ id: 'player-1', cards: [] });
        const mockGame = createMockGame({ players: [player] });
        const testService = createServiceWithGame(mockGame);

        const card = createMockCard();
        testService.addCardToPlayer(card, 'unknown-player');

        expect(testService.game().players[0].cards.length).toBe(0);
      });
    });

    describe('addTurn', () => {
      it('should increment turn by 1', () => {
        const mockGame = createMockGame({ turn: 2 });
        const testService = createServiceWithGame(mockGame);

        testService.addTurn();

        expect(testService.game().turn).toBe(3);
      });
    });

    describe('getLastCard', () => {
      it('should return last giving card when givingCards >= drinkingCards', () => {
        const givingCard = createMockCard({ value: 'K' });
        const drinkingCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({
          givingCards: [givingCard],
          drinkingCards: [drinkingCard],
        });
        const testService = createServiceWithGame(mockGame);

        const result = testService.getLastCard();

        expect(result?.value).toBe('K');
      });

      it('should return last drinking card when drinkingCards > givingCards', () => {
        const drinkingCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({
          givingCards: [],
          drinkingCards: [drinkingCard],
        });
        const testService = createServiceWithGame(mockGame);

        const result = testService.getLastCard();

        expect(result?.value).toBe('5');
      });
    });

    describe('isGivingCard', () => {
      it('should return true when drinkingCards > givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard()],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isGivingCard()).toBe(true);
      });

      it('should return false when drinkingCards <= givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard()],
          givingCards: [createMockCard()],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isGivingCard()).toBe(false);
      });
    });

    describe('getSipsNumber', () => {
      it('should return 1 when both arrays are empty', () => {
        const mockGame = createMockGame({
          drinkingCards: [],
          givingCards: [],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.getSipsNumber()).toBe(1);
      });

      it('should return 1 when only drinkingCards has elements', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard()],
          givingCards: [],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.getSipsNumber()).toBe(1);
      });

      it('should return drinkingCards.length + 1 when lengths are equal', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard(), createMockCard()],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.getSipsNumber()).toBe(3);
      });

      it('should return givingCards.length + 1 when drinkingCards > givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard(), createMockCard()],
          givingCards: [createMockCard(), createMockCard()],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.getSipsNumber()).toBe(3);
      });
    });

    describe('isNotAllSipsGiven', () => {
      it('should return false when summary is not activated', () => {
        const mockGame = createMockGame({ summary: false });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isNotAllSipsGiven()).toBe(false);
      });

      it('should return false when drinkingCards is empty', () => {
        const mockGame = createMockGame({ summary: true, drinkingCards: [] });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isNotAllSipsGiven()).toBe(false);
      });

      it('should return true when there are remaining sips to give', () => {
        const cardWithGivenSips = createMockCard({ givenSips: 2 });
        const player = createMockPlayer({ cards: [cardWithGivenSips] });
        const mockGame = createMockGame({
          summary: true,
          drinkingCards: [createMockCard()],
          players: [player],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isNotAllSipsGiven()).toBe(true);
      });

      it('should return false when all sips are given', () => {
        const cardWithNoGivenSips = createMockCard({ givenSips: 0 });
        const player = createMockPlayer({ cards: [cardWithNoGivenSips] });
        const mockGame = createMockGame({
          summary: true,
          drinkingCards: [createMockCard()],
          players: [player],
        });
        const testService = createServiceWithGame(mockGame);

        expect(testService.isNotAllSipsGiven()).toBe(false);
      });
    });

    describe('updatePlayerGivenSipsFromCard', () => {
      it('should update givenSips on matching card', () => {
        const card = createMockCard({ value: '5', suit: 'hearts', givenSips: 0 });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const mockGame = createMockGame({ players: [player] });
        const testService = createServiceWithGame(mockGame);

        testService.updatePlayerGivenSipsFromCard(player, card, 3);

        expect(testService.game().players[0].cards[0].givenSips).toBe(3);
      });

      it('should not update if player not found', () => {
        const card = createMockCard({ value: '5', suit: 'hearts' });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const unknownPlayer = createMockPlayer({ id: 'unknown' });
        const mockGame = createMockGame({ players: [player] });
        const testService = createServiceWithGame(mockGame);

        testService.updatePlayerGivenSipsFromCard(unknownPlayer, card, 3);

        expect(testService.game().players[0].cards[0].givenSips).toBeUndefined();
      });

      it('should not update if card not found', () => {
        const card = createMockCard({ value: '5', suit: 'hearts' });
        const differentCard = createMockCard({ value: 'K', suit: 'spades' });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const mockGame = createMockGame({ players: [player] });
        const testService = createServiceWithGame(mockGame);

        testService.updatePlayerGivenSipsFromCard(player, differentCard, 3);

        expect(testService.game().players[0].cards[0].givenSips).toBeUndefined();
      });
    });

    describe('setChoiceAndPickCard', () => {
      it('should set choice and pick card when game and activePlayer exist', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        const testService = createServiceWithGame(mockGame);

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        testService.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(testService.game().players[0].choice['color']).toBe('red');
        expect(mockCardDeckHelperService.getRandomCard).toHaveBeenCalled();
      });

      it('should not do anything when game is undefined', () => {
        const testService = createServiceWithGame(null);

        testService.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
      });

      it('should not do anything when activePlayer is undefined', () => {
        const mockGame = createMockGame({ activePlayer: undefined });
        const testService = createServiceWithGame(mockGame);

        testService.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
      });
    });

    describe('selectCardOnPlayer', () => {
      it('should select cards with matching value on all players', () => {
        const card1 = createMockCard({ value: '5', selected: false });
        const card2 = createMockCard({ value: '7', selected: false });
        const player = createMockPlayer({ cards: [card1, card2] });
        const mockGame = createMockGame({ players: [player], summary: false });
        const testService = createServiceWithGame(mockGame);

        const currentCard = createMockCard({ value: '5' });
        testService.selectCardOnPlayer(2, currentCard);

        expect(testService.game().players[0].cards[0].selected).toBe(true);
        expect(testService.game().players[0].cards[1].selected).toBe(false);
      });

      it('should set givenSips when summary is activated and isGivingCard', () => {
        const card = createMockCard({ value: '5', selected: false, givenSips: undefined });
        const player = createMockPlayer({ cards: [card] });
        const mockGame = createMockGame({
          players: [player],
          summary: true,
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard()],
        });
        const testService = createServiceWithGame(mockGame);

        const currentCard = createMockCard({ value: '5' });
        testService.selectCardOnPlayer(3, currentCard);

        expect(testService.game().players[0].cards[0].givenSips).toBe(3);
      });
    });

    describe('addSips', () => {
      it('should add sips to players with matching card value', () => {
        const card1 = createMockCard({ value: '5' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          sips: { drunk: 0, given: 0 },
        });
        const mockGame = createMockGame({
          players: [player],
          drinkingCards: [],
          givingCards: [],
        });
        const testService = createServiceWithGame(mockGame);

        const matchingCard = createMockCard({ value: '5' });
        testService.addSips(matchingCard, 2);

        expect(testService.game().players[0].sips['drunk']).toBe(2);
      });

      it('should add sips multiple times for multiple matching cards', () => {
        const card1 = createMockCard({ value: '5' });
        const card2 = createMockCard({ value: '5' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          sips: { drunk: 0, given: 0 },
        });
        const mockGame = createMockGame({
          players: [player],
          drinkingCards: [],
          givingCards: [],
        });
        const testService = createServiceWithGame(mockGame);

        const matchingCard = createMockCard({ value: '5' });
        testService.addSips(matchingCard, 2);

        expect(testService.game().players[0].sips['drunk']).toBe(4);
      });
    });

    describe('openSipGiveModal', () => {
      it('should emit player on openSipGiveModalEvent$', (done) => {
        const player = createMockPlayer({ id: 'player-1' });

        service.openSipGiveModalEvent$.subscribe((emittedPlayer) => {
          expect(emittedPlayer).toEqual(player);
          done();
        });

        service.openSipGiveModal(player);
      });
    });
  });

  // ==========================================================================
  // Appwrite Integration Tests
  // ==========================================================================
  describe('Appwrite Integration', () => {
    // Helper function to create service with specific game state and room mode
    function createServiceWithGameAndRoom(
      mockGame: Game | null,
      room: ReturnType<typeof createMockGameRoom> | null = null
    ): GameService {
      mockLocalService.getData.and.returnValue(mockGame ? JSON.stringify(mockGame) : null);
      mockRoomService.currentRoom.set(room);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
        ],
      });
      return TestBed.inject(GameService);
    }

    describe('gameMode computed signal', () => {
      it('should return "local" when no room is active', () => {
        mockRoomService.currentRoom.set(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        expect(testService.gameMode()).toBe('local');
      });

      it('should return "room" when roomService.currentRoom() returns a room', () => {
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        expect(testService.gameMode()).toBe('room');
      });
    });

    describe('isRoomMode computed signal', () => {
      it('should return false when in local mode', () => {
        mockRoomService.currentRoom.set(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        expect(testService.isRoomMode()).toBe(false);
      });

      it('should return true when in room mode', () => {
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        expect(testService.isRoomMode()).toBe(true);
      });
    });

    describe('dual-mode persistence', () => {
      it('should save to localStorage in local mode', () => {
        const mockGame = createMockGame({ status: 0 });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        testService.setStatus(1);

        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', jasmine.any(String));
      });

      it('should route to saveToAppwrite in room mode (placeholder implementation)', () => {
        const mockRoom = createMockGameRoom();
        const mockGame = createMockGame({ status: 0 });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);

        // Spy on console.debug to verify the Appwrite path is taken
        const consoleSpy = spyOn(console, 'debug');
        mockLocalService.saveData.calls.reset();

        testService.setStatus(1);

        // In room mode, saveToAppwrite should be called (logged via console.debug)
        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
      });
    });

    describe('beginGame dual-mode behavior', () => {
      it('should work in local mode without room', () => {
        mockRoomService.currentRoom.set(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        const players = [createMockPlayer({ id: 'player-1' })];
        mockLocalService.getData.and.returnValue(JSON.stringify(players));
        mockLocalService.saveData.calls.reset();

        testService.beginGame();

        expect(testService.game().status).toBe(1);
        expect(testService.game().turn).toBe(1);
        expect(testService.game().phase).toBe(1);
        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', jasmine.any(String));
      });

      it('should work in room mode with active room', async () => {
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        // Create a mock session that will be returned by startGame
        const mockSession = createMockKetalSession({
          $id: 'session-123',
          roomId: mockRoom.$id,
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          activePlayerId: 'player-1',
          players: [
            {
              memberId: 'player-1',
              displayName: 'Test Player',
              order: 1,
              cards: [],
              choices: { color: '', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 0,
              isReady: true,
            },
          ],
        });
        mockKetalSessionService.startGame.and.resolveTo(mockSession);
        mockKetalSessionService.updateSession.and.resolveTo(mockSession);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        const players = [createMockPlayer({ id: 'player-1' })];
        mockLocalService.getData.and.returnValue(JSON.stringify(players));
        const consoleSpy = spyOn(console, 'debug');

        await testService.beginGame();

        // In room mode, startGame should be called on the session service
        expect(mockKetalSessionService.startGame).toHaveBeenCalled();
        // Session should be transitioned to playing state
        expect(mockKetalSessionService.updateSession).toHaveBeenCalledWith(
          'session-123',
          jasmine.objectContaining({ status: 'playing', phase: 'dealing', turn: 1 })
        );
        expect(consoleSpy).toHaveBeenCalledWith('[GameService] Game started in room mode', jasmine.any(Object));
      });

      it('should pass withSummaryMode parameter correctly in both modes', () => {
        mockRoomService.currentRoom.set(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        const players = [createMockPlayer({ id: 'player-1' })];
        mockLocalService.getData.and.returnValue(JSON.stringify(players));

        testService.beginGame(true);

        expect(testService.game().summary).toBe(true);
      });
    });

    describe('game state changes persist to correct backend', () => {
      it('should persist addDrinkingCard to localStorage in local mode', () => {
        const mockGame = createMockGame({ drinkingCards: [] });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        const card = createMockCard();
        testService.addDrinkingCard(card);

        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', jasmine.any(String));
        expect(testService.game().drinkingCards.length).toBe(1);
      });

      it('should persist addGivingCard to localStorage in local mode', () => {
        const mockGame = createMockGame({ givingCards: [] });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        const card = createMockCard();
        testService.addGivingCard(card);

        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', jasmine.any(String));
        expect(testService.game().givingCards.length).toBe(1);
      });

      it('should route to Appwrite for addDrinkingCard in room mode', () => {
        const mockRoom = createMockGameRoom();
        const mockGame = createMockGame({ drinkingCards: [] });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');
        mockLocalService.saveData.calls.reset();

        const card = createMockCard();
        testService.addDrinkingCard(card);

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
        expect(testService.game().drinkingCards.length).toBe(1);
      });

      it('should route to Appwrite for addTurn in room mode', () => {
        const mockRoom = createMockGameRoom();
        const mockGame = createMockGame({ turn: 1 });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        testService.addTurn();

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
        expect(testService.game().turn).toBe(2);
      });
    });

    describe('resetGame in dual-mode', () => {
      it('should reset game and save to localStorage in local mode', () => {
        const player = createMockPlayer({
          sips: { drunk: 10, given: 5 },
          cards: [createMockCard()],
        });
        const mockGame = createMockGame({
          players: [player],
          status: 2,
          phase: 2,
          turn: 4,
        });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        testService.resetGame();

        expect(mockLocalService.saveData).toHaveBeenCalled();
        expect(testService.game().status).toBe(0);
        expect(testService.game().phase).toBe(0);
        expect(testService.game().turn).toBe(0);
      });

      it('should reset game and route to Appwrite in room mode', () => {
        const mockRoom = createMockGameRoom();
        const player = createMockPlayer({
          sips: { drunk: 10, given: 5 },
          cards: [createMockCard()],
        });
        const mockGame = createMockGame({
          players: [player],
          status: 2,
          phase: 2,
          turn: 4,
        });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        testService.resetGame();

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
        expect(testService.game().status).toBe(0);
      });
    });

    describe('pickCard in dual-mode', () => {
      it('should persist card pick to localStorage in local mode', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [],
          choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
        });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isRedCard.and.returnValue(true);

        testService.pickCard();

        expect(mockLocalService.saveData).toHaveBeenCalled();
        expect(testService.game().players[0].cards.length).toBe(1);
      });

      it('should route card pick to Appwrite in room mode', () => {
        const mockRoom = createMockGameRoom();
        const player = createMockPlayer({
          id: 'player-1',
          cards: [],
          choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
        });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isRedCard.and.returnValue(true);

        testService.pickCard();

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
        expect(testService.game().players[0].cards.length).toBe(1);
      });
    });

    describe('setChoiceAndPickCard in dual-mode', () => {
      it('should work correctly in local mode', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [],
          choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
        });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        testService.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(mockLocalService.saveData).toHaveBeenCalled();
        expect(testService.game().players[0].choice['color']).toBe('red');
      });

      it('should work correctly in room mode', () => {
        const mockRoom = createMockGameRoom();
        const player = createMockPlayer({
          id: 'player-1',
          cards: [],
          choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
        });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        testService.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
        expect(testService.game().players[0].choice['color']).toBe('red');
      });
    });

    describe('mode switching', () => {
      it('should correctly switch from local to room mode when room is set', () => {
        mockRoomService.currentRoom.set(null);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        // Initially in local mode
        expect(testService.gameMode()).toBe('local');
        expect(testService.isRoomMode()).toBe(false);

        // Simulate joining a room
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        // Now should be in room mode
        expect(testService.gameMode()).toBe('room');
        expect(testService.isRoomMode()).toBe(true);
      });

      it('should correctly switch from room to local mode when room is cleared', () => {
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            GameService,
            { provide: LocalService, useValue: mockLocalService },
            { provide: CardService, useValue: mockCardService },
            { provide: PlayerHelperService, useValue: mockPlayerHelperService },
            { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
            { provide: RoomService, useValue: mockRoomService },
            { provide: AuthService, useValue: mockAuthService },
            { provide: KetalSessionService, useValue: mockKetalSessionService },
            { provide: MemberService, useValue: mockMemberService },
          ],
        });
        const testService = TestBed.inject(GameService);

        // Initially in room mode
        expect(testService.gameMode()).toBe('room');
        expect(testService.isRoomMode()).toBe(true);

        // Simulate leaving the room
        mockRoomService.currentRoom.set(null);

        // Now should be in local mode
        expect(testService.gameMode()).toBe('local');
        expect(testService.isRoomMode()).toBe(false);
      });
    });

    describe('displayNewCard in dual-mode', () => {
      it('should persist new card to localStorage in local mode', () => {
        const mockGame = createMockGame({
          givingCards: [],
          drinkingCards: [],
          players: [createMockPlayer()],
        });
        const testService = createServiceWithGameAndRoom(mockGame, null);
        mockLocalService.saveData.calls.reset();

        const newCard = createMockCard({ selected: false });
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        testService.displayNewCard();

        expect(mockLocalService.saveData).toHaveBeenCalled();
      });

      it('should route new card persistence to Appwrite in room mode', () => {
        const mockRoom = createMockGameRoom();
        const mockGame = createMockGame({
          givingCards: [],
          drinkingCards: [],
          players: [createMockPlayer()],
        });
        const testService = createServiceWithGameAndRoom(mockGame, mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        const newCard = createMockCard({ selected: false });
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        testService.displayNewCard();

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] saveToAppwrite - no active session');
      });
    });
  });

  // ==========================================================================
  // Realtime Synchronization Tests (Story 12.5)
  // ==========================================================================
  describe('Realtime Synchronization (Story 12.5)', () => {
    // Helper function to create service with room mode and realtime
    function createServiceWithRoomMode(
      mockGame: Game | null,
      room: ReturnType<typeof createMockGameRoom> | null = null
    ): GameService {
      mockLocalService.getData.and.returnValue(mockGame ? JSON.stringify(mockGame) : null);
      mockRoomService.currentRoom.set(room);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
          { provide: RoomService, useValue: mockRoomService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: KetalSessionService, useValue: mockKetalSessionService },
          { provide: MemberService, useValue: mockMemberService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: SoloRoomService, useValue: mockSoloRoomService },
        ],
      });
      return TestBed.inject(GameService);
    }

    describe('subscribeToSessionUpdates', () => {
      it('should subscribe to realtime updates via KetalSessionService', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.subscribeToSessionUpdates('session-123');

        expect(mockKetalSessionService.subscribeToSession).toHaveBeenCalledWith('session-123', jasmine.any(Function));
      });

      it('should store the session ID for reconnection', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.subscribeToSessionUpdates('session-123');

        // Verify we can unsubscribe (delegates to ketalSessionService)
        testService.unsubscribeFromSession();
        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });

      it('should cleanup existing subscription before creating new one', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.subscribeToSessionUpdates('session-1');
        testService.subscribeToSessionUpdates('session-2');

        // First subscribe calls unsubscribe (cleanup), then second subscribe also calls unsubscribe
        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
        expect(mockKetalSessionService.subscribeToSession).toHaveBeenCalledTimes(2);
      });
    });

    describe('unsubscribeFromSession', () => {
      it('should unsubscribe via KetalSessionService when called', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.subscribeToSessionUpdates('session-123');
        mockKetalSessionService.unsubscribe.calls.reset();
        testService.unsubscribeFromSession();

        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });

      it('should call unsubscribe even when no subscription exists', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.unsubscribeFromSession();

        // KetalSessionService.unsubscribe is always safe to call
        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });

      it('should be idempotent', () => {
        const testService = createServiceWithRoomMode(null, createMockGameRoom());

        testService.subscribeToSessionUpdates('session-123');
        testService.unsubscribeFromSession();
        testService.unsubscribeFromSession();

        // Multiple calls are safe - KetalSessionService handles cleanup
        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });
    });

    describe('handleSessionUpdate', () => {
      it('should update local game state from session update', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          $id: 'session-123',
          status: 'playing',
          phase: 'dealing',
          turn: 2,
          activePlayerId: 'player-1',
          players: [
            {
              memberId: 'player-1',
              displayName: 'Alice',
              order: 1,
              cards: [],
              choices: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 1,
              isReady: true,
            },
          ],
          withSummary: false,
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().turn).toBe(2);
        expect(testService.game().phase).toBe(1); // 'dealing' maps to phase 1
        expect(testService.game().status).toBe(1); // 'playing' maps to status 1
        expect(testService.game().players.length).toBe(1);
        expect(testService.game().players[0].name).toBe('Alice');
        expect(testService.game().players[0].sips['drunk']).toBe(1);
      });

      it('should map session phase "pyramid" to local phase 2', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          phase: 'pyramid',
          status: 'playing',
          turn: 5,
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().phase).toBe(2);
      });

      // C'est summaryDisplayed, et non withSummary, qui fait passer au statut 3.
      // withSummary dit seulement que le mode resume est actif ; s'y fier faisait
      // sauter les appareils distants au resume des la fin de partie, sans
      // qu'aucun bouton n'ait ete presse, privant le dernier joueur du temps de
      // lire ses gorgees.
      it('should map "finished" to local status 3 only once the summary was triggered', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'finished',
          withSummary: true,
          summaryDisplayed: true,
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().status).toBe(3);
      });

      it('should map "finished" to local status 2 while the summary is enabled but not triggered', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'finished',
          withSummary: true,
          summaryDisplayed: false,
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().status).toBe(2);
      });

      it('should map session status "finished" without summary to local status 2', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'finished',
          withSummary: false,
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().status).toBe(2);
      });

      it('should map player choices correctly', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          players: [
            {
              memberId: 'p1',
              displayName: 'Player 1',
              order: 1,
              cards: [],
              choices: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
              sipsGiven: 3,
              sipsTaken: 5,
              isReady: true,
            },
          ],
        });

        testService.handleSessionUpdate(session);

        const player = testService.game().players[0];
        expect(player.choice['color']).toBe('red');
        expect(player.choice['plus_or_minus']).toBe('plus');
        expect(player.choice['in_out']).toBe('in');
        expect(player.choice['suit']).toBe('hearts');
        expect(player.sips['drunk']).toBe(5);
        expect(player.sips['given']).toBe(3);
      });

      it('should set activePlayer from activePlayerId', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          activePlayerId: 'p2',
          players: [
            {
              memberId: 'p1',
              displayName: 'Player 1',
              order: 1,
              cards: [],
              choices: { color: '', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 0,
              isReady: true,
            },
            {
              memberId: 'p2',
              displayName: 'Player 2',
              order: 2,
              cards: [],
              choices: { color: '', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 0,
              isReady: true,
            },
          ],
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().activePlayer?.id).toBe('p2');
        expect(testService.game().activePlayer?.name).toBe('Player 2');
      });

      it('should handle errors gracefully', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());
        const consoleSpy = spyOn(console, 'error');

        // Pass a session with invalid data that will cause mapping to fail
        const invalidSession = { $id: 'bad' } as any;

        testService.handleSessionUpdate(invalidSession);

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] Failed to handle session update:', jasmine.anything());
      });
    });

    describe('sync loop prevention', () => {
      it('should not re-save data received from realtime updates', () => {
        const mockRoom = createMockGameRoom();
        const mockGame = createMockGame();
        const testService = createServiceWithRoomMode(mockGame, mockRoom);

        const session = createMockKetalSession({
          status: 'playing',
          phase: 'dealing',
          turn: 2,
          players: [],
        });

        // handleSessionUpdate should update the signal but NOT trigger saveToAppwrite
        mockKetalSessionService.updateSession.calls.reset();
        testService.handleSessionUpdate(session);

        // The update should NOT trigger a save to Appwrite
        // (saveToAppwrite is only called through saveAndNotify)
        expect(mockKetalSessionService.updateSession).not.toHaveBeenCalled();
      });
    });

    describe('subscription cleanup', () => {
      it('should unsubscribe when resetGame is called', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        testService.subscribeToSessionUpdates('session-123');
        mockKetalSessionService.unsubscribe.calls.reset();

        testService.resetGame();

        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });

      it('should unsubscribe when game ends (status 2) in room mode', async () => {
        const mockRoom = createMockGameRoom();
        const mockSession = createMockKetalSession({ $id: 'session-123' });
        mockKetalSessionService.currentSession.set(mockSession);

        const testService = createServiceWithRoomMode(createMockGame(), mockRoom);
        testService.subscribeToSessionUpdates('session-123');
        mockKetalSessionService.unsubscribe.calls.reset();

        testService.setStatus(2);

        // Allow async finalizeGameStats to complete
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(mockKetalSessionService.unsubscribe).toHaveBeenCalled();
      });

      it('should subscribe during beginGame in room mode', async () => {
        const mockRoom = createMockGameRoom();
        mockRoomService.currentRoom.set(mockRoom);

        const mockSession = createMockKetalSession({
          $id: 'session-456',
          status: 'playing',
          phase: 'dealing',
          turn: 1,
          players: [
            {
              memberId: 'player-1',
              displayName: 'Test Player',
              order: 1,
              cards: [],
              choices: { color: '', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 0,
              isReady: true,
            },
          ],
        });
        mockKetalSessionService.startGame.and.resolveTo(mockSession);
        mockKetalSessionService.updateSession.and.resolveTo(mockSession);

        const testService = createServiceWithRoomMode(null, mockRoom);
        const players = [createMockPlayer({ id: 'player-1' })];
        mockLocalService.getData.and.returnValue(JSON.stringify(players));

        await testService.beginGame();

        expect(mockKetalSessionService.subscribeToSession).toHaveBeenCalledWith('session-456', jasmine.any(Function));
      });
    });

    describe('handleReconnection', () => {
      it('should fetch session and update game state', async () => {
        const mockRoom = createMockGameRoom();
        const mockSession = createMockKetalSession({
          $id: 'session-123',
          status: 'playing',
          phase: 'dealing',
          turn: 3,
          players: [
            {
              memberId: 'p1',
              displayName: 'Reconnected Player',
              order: 1,
              cards: [],
              choices: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
              sipsGiven: 0,
              sipsTaken: 2,
              isReady: true,
            },
          ],
        });
        mockKetalSessionService.getSession.and.resolveTo(mockSession);

        const testService = createServiceWithRoomMode(createMockGame(), mockRoom);

        await testService.handleReconnection('session-123');

        expect(mockKetalSessionService.getSession).toHaveBeenCalledWith('session-123');
        expect(testService.game().turn).toBe(3);
        expect(testService.game().players[0].name).toBe('Reconnected Player');
      });

      it('should re-subscribe to realtime updates after reconnection', async () => {
        const mockRoom = createMockGameRoom();
        const mockSession = createMockKetalSession({ $id: 'session-123' });
        mockKetalSessionService.getSession.and.resolveTo(mockSession);

        const testService = createServiceWithRoomMode(createMockGame(), mockRoom);
        mockKetalSessionService.subscribeToSession.calls.reset();

        await testService.handleReconnection('session-123');

        expect(mockKetalSessionService.subscribeToSession).toHaveBeenCalledWith('session-123', jasmine.any(Function));
      });

      it('should use stored activeSessionId when no sessionId provided', async () => {
        const mockRoom = createMockGameRoom();
        const mockSession = createMockKetalSession({ $id: 'session-stored' });
        mockKetalSessionService.getSession.and.resolveTo(mockSession);

        const testService = createServiceWithRoomMode(createMockGame(), mockRoom);

        // Subscribe first to store activeSessionId
        testService.subscribeToSessionUpdates('session-stored');
        mockRealtimeService.subscribeToSession.calls.reset();

        await testService.handleReconnection();

        expect(mockKetalSessionService.getSession).toHaveBeenCalledWith('session-stored');
      });

      it('should do nothing when no session ID is available', async () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        await testService.handleReconnection();

        expect(mockKetalSessionService.getSession).not.toHaveBeenCalled();
      });

      it('should do nothing when session is not found', async () => {
        const mockRoom = createMockGameRoom();
        mockKetalSessionService.getSession.and.resolveTo(null);

        const testService = createServiceWithRoomMode(createMockGame(), mockRoom);
        const consoleSpy = spyOn(console, 'debug');

        await testService.handleReconnection('session-missing');

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] handleReconnection - session not found');
      });

      it('should handle errors gracefully', async () => {
        mockKetalSessionService.getSession.and.rejectWith(new Error('Network error'));

        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());
        const consoleSpy = spyOn(console, 'error');

        await testService.handleReconnection('session-123');

        expect(consoleSpy).toHaveBeenCalledWith('[GameService] handleReconnection - failed:', jasmine.anything());
      });
    });

    describe('realtime callback invocation', () => {
      it('should call handleSessionUpdate when realtime update is received', () => {
        const testService = createServiceWithRoomMode(createMockGame(), createMockGameRoom());

        const session = createMockKetalSession({
          status: 'playing',
          phase: 'pyramid',
          turn: 5,
          players: [],
        });

        testService.handleSessionUpdate(session);

        expect(testService.game().phase).toBe(2); // 'pyramid' maps to phase 2
      });
    });
  });
});
