/**
 * Game Mappers - Data transformation utilities for Stories 12.2-12.5
 *
 * Provides bidirectional mapping between local game state (Game, PlayerModel, CardType)
 * and Appwrite session state (KetalSession, KetalPlayer).
 */

import { CardType } from '../../_shared/_models/card-type.model';
import { Game } from '../../_shared/_models/game.model';
import { PlayerChoice, PlayerModel, PlayerSips } from '../../_shared/_models/player.model';
import {
  KetalPlayer,
  KetalSession,
  PlayerChoices,
  SessionPhase,
  SessionStatus,
} from '../ketal-session/ketal-session.service';

// ============================================================================
// Status Mapping Helpers
// ============================================================================

/**
 * Local game status values:
 * 0 = new, 1 = started, 2 = finished, 3 = summary
 */
type LocalStatus = 0 | 1 | 2 | 3;

/**
 * Maps local numeric status to Appwrite session status string
 */
export function mapLocalStatusToSessionStatus(status: number): SessionStatus {
  switch (status) {
    case 0:
      return 'waiting';
    case 1:
      return 'playing';
    case 2:
    case 3:
      return 'finished';
    default:
      return 'waiting';
  }
}

/**
 * Maps Appwrite session status string to local numeric status
 */
export function mapSessionStatusToLocalStatus(status: SessionStatus, summary: boolean): LocalStatus {
  switch (status) {
    case 'waiting':
      return 0;
    case 'playing':
      return 1;
    case 'finished':
      return summary ? 3 : 2;
    default:
      return 0;
  }
}

// ============================================================================
// Phase Mapping Helpers
// ============================================================================

/**
 * Local game phase values:
 * 1 = prediction phase (4 rounds: color, plus/minus, in/out, suit)
 * 2 = drinking/giving phase (6 cards)
 */
type LocalPhase = 1 | 2;

/**
 * Maps local numeric phase to Appwrite session phase string
 */
export function mapLocalPhaseToSessionPhase(phase: number): SessionPhase {
  switch (phase) {
    case 1:
      return 'dealing'; // Prediction phase where players make choices
    case 2:
      return 'pyramid'; // Drinking/giving phase
    default:
      return 'setup';
  }
}

/**
 * Maps Appwrite session phase string to local numeric phase
 */
export function mapSessionPhaseToLocalPhase(phase: SessionPhase): LocalPhase {
  switch (phase) {
    case 'setup':
      return 1;
    case 'dealing':
      return 1;
    case 'pyramid':
      return 2;
    case 'finished':
      return 2;
    default:
      return 1;
  }
}

// ============================================================================
// Card Serialization
// ============================================================================

/**
 * Serializes a CardType object to a JSON string for Appwrite storage
 */
export function serializeCard(card: CardType): string {
  return JSON.stringify(card);
}

/**
 * Deserializes a JSON string to a CardType object
 */
export function deserializeCard(cardStr: string): CardType {
  try {
    const parsed = JSON.parse(cardStr) as CardType;
    return {
      value: parsed.value ?? null,
      suit: parsed.suit ?? null,
      icon: parsed.icon ?? null,
      sips: parsed.sips ?? 0,
      selected: parsed.selected ?? null,
      img: parsed.img ?? null,
      givenSips: parsed.givenSips,
    };
  } catch {
    // Return a default empty card if parsing fails
    return {
      value: null,
      suit: null,
      icon: null,
      sips: 0,
      selected: null,
      img: null,
      givenSips: undefined,
    };
  }
}

/**
 * Serializes an array of CardType objects to an array of JSON strings
 */
export function serializeCards(cards: CardType[]): string[] {
  return cards.map(serializeCard);
}

/**
 * Deserializes an array of JSON strings to CardType objects
 */
export function deserializeCards(cardStrings: string[]): CardType[] {
  return cardStrings.map(deserializeCard);
}

// ============================================================================
// Player Mapping
// ============================================================================

/**
 * Converts a local PlayerModel to Appwrite KetalPlayer format
 *
 * @param player - The local PlayerModel to convert
 * @param index - The player's index in the players array (0-based, converted to 1-based order)
 * @returns KetalPlayer object for Appwrite storage
 */
export function mapPlayerModelToKetalPlayer(player: PlayerModel, index: number): KetalPlayer {
  // Convert PlayerChoice to PlayerChoices (same structure, just interface alignment)
  // Use bracket notation for index signature access
  const choices: PlayerChoices = {
    color: player.choice['color'] || '',
    plus_or_minus: player.choice['plus_or_minus'] || '',
    in_out: player.choice['in_out'] || '',
    suit: player.choice['suit'] || '',
  };

  return {
    memberId: player.id,
    displayName: player.name,
    order: index + 1, // Convert 0-based index to 1-based order
    cards: serializeCards(player.cards),
    choices,
    sipsGiven: player.sips['given'] || 0,
    sipsTaken: player.sips['drunk'] || 0,
    isReady: true, // Default to ready when mapping from active game
  };
}

/**
 * Converts an Appwrite KetalPlayer to local PlayerModel format
 *
 * @param ketalPlayer - The Appwrite KetalPlayer to convert
 * @returns PlayerModel object for local game state
 */
export function mapKetalPlayerToPlayerModel(ketalPlayer: KetalPlayer): PlayerModel {
  // Convert PlayerChoices to PlayerChoice
  const choice: PlayerChoice = {
    color: ketalPlayer.choices.color || '',
    plus_or_minus: ketalPlayer.choices.plus_or_minus || '',
    in_out: ketalPlayer.choices.in_out || '',
    suit: ketalPlayer.choices.suit || '',
  };

  // Convert sips format
  const sips: PlayerSips = {
    drunk: ketalPlayer.sipsTaken || 0,
    given: ketalPlayer.sipsGiven || 0,
  };

  const playerModel = new PlayerModel();
  playerModel.id = ketalPlayer.memberId;
  playerModel.name = ketalPlayer.displayName;
  playerModel.cards = deserializeCards(ketalPlayer.cards);
  playerModel.choice = choice;
  playerModel.sips = sips;
  // Note: avatarSrc is not stored in KetalPlayer, would need to be fetched separately

  return playerModel;
}

// ============================================================================
// Game/Session Mapping
// ============================================================================

/**
 * Converts local Game state to a partial KetalSession update object
 *
 * Used for syncing local game changes to Appwrite.
 *
 * @param game - The local Game state to convert
 * @returns Partial KetalSession object suitable for Appwrite update
 */
export function mapGameToSessionUpdate(game: Game): Partial<KetalSession> {
  return {
    status: mapLocalStatusToSessionStatus(game.status),
    phase: mapLocalPhaseToSessionPhase(game.phase),
    turn: game.turn,
    activePlayerId: game.activePlayer?.id || null,
    players: game.players.map((player, index) => mapPlayerModelToKetalPlayer(player, index)),
    drinkingCards: serializeCards(game.drinkingCards),
    givingCards: serializeCards(game.givingCards),
    withSummary: game.summary,
  };
}

/**
 * Converts an Appwrite KetalSession to local Game state
 *
 * Used for initializing local game from Appwrite or syncing realtime updates.
 *
 * @param session - The Appwrite KetalSession to convert
 * @returns Game object for local state management
 */
export function mapSessionToGame(session: KetalSession): Game {
  // Convert players
  const players = session.players.map(mapKetalPlayerToPlayerModel);

  // Find active player by matching ID
  const activePlayer = session.activePlayerId ? players.find((p) => p.id === session.activePlayerId) : undefined;

  // Deserialize cards - handle both string arrays and already-parsed arrays
  const drinkingCards = session.drinkingCards.map((card) => {
    if (typeof card === 'string') {
      return deserializeCard(card);
    }
    return card as unknown as CardType;
  });

  const givingCards = session.givingCards.map((card) => {
    if (typeof card === 'string') {
      return deserializeCard(card);
    }
    return card as unknown as CardType;
  });

  return {
    players,
    turn: session.turn,
    maxTurnCount: players.length * 4, // Each player gets 4 turns in prediction phase
    phase: mapSessionPhaseToLocalPhase(session.phase),
    drinkingCards,
    givingCards,
    activePlayer,
    status: mapSessionStatusToLocalStatus(session.status, session.withSummary),
    summary: session.withSummary,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a default empty KetalPlayer
 */
export function createEmptyKetalPlayer(memberId: string, displayName: string, order: number): KetalPlayer {
  return {
    memberId,
    displayName,
    order,
    cards: [],
    choices: {
      color: '',
      plus_or_minus: '',
      in_out: '',
      suit: '',
    },
    sipsGiven: 0,
    sipsTaken: 0,
    isReady: false,
  };
}

/**
 * Creates a default initial Game state
 */
export function createInitialGame(): Game {
  return {
    players: [],
    turn: 1,
    maxTurnCount: 4,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: undefined,
    status: 0, // new
    summary: false,
  };
}
