import { NEVER, Subject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { GameService } from '../services/game/game.service';
import { PlayerHelperService } from '../_shared/_helpers/player.helper';
import { CardDeckHelperService } from '../_shared/_helpers/card-deck.helper';
import { LocalService } from '../services/local/local.service';
import { CardService } from '../services/card/card.service';
import { Game } from '../_shared/_models/game.model';
import { PlayerModel } from '../_shared/_models/player.model';
import { CardType } from '../_shared/_models/card-type.model';

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
      openSipGiveModalEvent$: NEVER,
    }
  );
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
