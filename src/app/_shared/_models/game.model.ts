import { PlayerModel } from './player.model';
import { CardType } from './card-type.model';
import { SipExchange } from './sip-exchange.model';

export interface Game {
  players: PlayerModel[];
  turn: number;
  maxTurnCount: number;
  phase: number;
  drinkingCards: CardType[];
  givingCards: CardType[];
  activePlayer: PlayerModel | undefined;
  status: number;
  summary: boolean;
  /**
   * Historique des transferts de gorgees de la partie, dans l'ordre.
   *
   * Permet de calculer le total RECU par joueur, impossible a deduire de
   * `player.sips` qui n'agrege que `drunk` et `given`. Optionnel : les parties
   * deja en cours dans localStorage n'ont pas ce champ.
   */
  sipExchanges?: SipExchange[];
}
