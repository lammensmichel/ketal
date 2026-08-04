import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GameService } from '../../../services/game/game.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { SipExchange } from '../../../_shared/_models/sip-exchange.model';

/**
 * Une ligne du detail depliable : « autant de gorgees avec tel joueur ».
 *
 * Les echanges sont agreges par contrepartie (et non listes coup par coup) :
 * une partie produit des dizaines de transferts, dont la lecture brute
 * n'apprend rien. Ce qui interesse le joueur, c'est le solde par binome.
 */
export interface ExchangeLine {
  /** Nom de la contrepartie (celui qui recoit, ou celui qui a donne). */
  playerName: string;
  sips: number;
  /**
   * Largeur de la barre en %, relative au plus gros echange du joueur.
   * Permet de comparer d'un coup d'oeil « qui a le plus arrose qui ».
   */
  share: number;
}

export interface PlayerSummary {
  id: string;
  name: string;
  sipsDrunk: number;
  sipsGiven: number;
  /**
   * Total recu, reconstruit depuis Game.sipExchanges : player.sips n'agrege que
   * `drunk` et `given`, le recu n'existe nulle part ailleurs.
   */
  sipsReceived: number;
  /** Base du classement : bues + donnees (inchange, le spec le verrouille). */
  totalSips: number;
  isWinner: boolean;
  isLoser: boolean;
  givenTo: ExchangeLine[];
  receivedFrom: ExchangeLine[];
  /** Vrai si ce joueur a au moins un echange a montrer (dans un sens ou l'autre). */
  hasExchanges: boolean;
}

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary.component.html',
  styleUrls: ['./game-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, FontAwesomeModule],
})
export class GameSummaryComponent {
  private readonly gameSrv = inject(GameService);
  private readonly router = inject(Router);

  /**
   * Index de la ligne dont le detail est ouvert, `null` = tout replie.
   *
   * Accordeon volontaire (un seul detail ouvert) : sur mobile, plusieurs
   * panneaux ouverts rallongent la page au point de perdre le classement.
   * Indexe par position et non par id : les parties reprises d'un
   * localStorage ancien peuvent porter des ids vides, donc non discriminants.
   */
  private readonly expandedIndex = signal<number | null>(null);

  /**
   * Echanges exploitables de la partie.
   *
   * `sipExchanges` est optionnel (parties anciennes, ou partie sans aucun don) :
   * on retombe sur un tableau vide, et les entrees non exploitables sont
   * ecartees pour que les totaux restent coherents avec les lignes affichees.
   */
  private readonly exchanges = computed<SipExchange[]>(() => {
    const raw = this.gameSrv.game()?.sipExchanges;
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((e) => !!e && typeof e.sips === 'number' && Number.isFinite(e.sips) && e.sips > 0);
  });

  /** Faux => la section des echanges (et le total recu) est masquee partout. */
  readonly hasAnyExchange = computed<boolean>(() => this.exchanges().length > 0);

  readonly playersSorted = computed<PlayerSummary[]>(() => {
    const players = this.gameSrv.players();
    if (!players || players.length === 0) {
      return [];
    }

    const exchanges = this.exchanges();
    const nameById = new Map<string, string>(players.map((p: PlayerModel) => [p.id, p.name]));

    // Agregation en un seul passage : deux tables par joueur (donne / recu).
    const givenByPlayer = new Map<string, Map<string, number>>();
    const receivedByPlayer = new Map<string, Map<string, number>>();
    for (const exchange of exchanges) {
      addTo(givenByPlayer, exchange.fromPlayerId, exchange.toPlayerId, exchange.sips);
      addTo(receivedByPlayer, exchange.toPlayerId, exchange.fromPlayerId, exchange.sips);
    }

    const summaries = players.map((player: PlayerModel) => {
      const given = givenByPlayer.get(player.id);
      const received = receivedByPlayer.get(player.id);
      const givenTo = toLines(given, nameById);
      const receivedFrom = toLines(received, nameById);

      // Echelle commune aux deux sens pour que les barres soient comparables
      // entre « donne a » et « recu de » chez un meme joueur.
      const maxSips = Math.max(0, ...givenTo.map((l) => l.sips), ...receivedFrom.map((l) => l.sips));
      scaleLines(givenTo, maxSips);
      scaleLines(receivedFrom, maxSips);

      return {
        id: player.id,
        name: player.name,
        sipsDrunk: player.sips['drunk'] || 0,
        sipsGiven: player.sips['given'] || 0,
        sipsReceived: sum(received),
        totalSips: (player.sips['drunk'] || 0) + (player.sips['given'] || 0),
        isWinner: false,
        isLoser: false,
        givenTo,
        receivedFrom,
        hasExchanges: givenTo.length > 0 || receivedFrom.length > 0,
      };
    });

    // Sort by total sips descending (most sips = loser = top of list)
    summaries.sort((a, b) => b.totalSips - a.totalSips);

    if (summaries.length > 0) {
      const maxSips = summaries[0].totalSips;
      const minSips = summaries[summaries.length - 1].totalSips;

      // Mark all players with max sips as losers
      summaries.forEach((s) => {
        if (s.totalSips === maxSips) {
          s.isLoser = true;
        }
      });

      // Mark all players with min sips as winners (only if different from max)
      if (minSips !== maxSips) {
        summaries.forEach((s) => {
          if (s.totalSips === minSips) {
            s.isWinner = true;
          }
        });
      }
    }

    return summaries;
  });

  readonly winner = computed<PlayerSummary | null>(() => {
    const sorted = this.playersSorted();
    return sorted.find((p) => p.isWinner) ?? null;
  });

  readonly loser = computed<PlayerSummary | null>(() => {
    const sorted = this.playersSorted();
    return sorted.find((p) => p.isLoser) ?? null;
  });

  isExpanded(index: number): boolean {
    return this.expandedIndex() === index;
  }

  toggleExchanges(index: number): void {
    this.expandedIndex.update((current) => (current === index ? null : index));
  }

  replay(): void {
    this.gameSrv.resetGame();
    // resetGame() remet le statut a 0 et quitte la room. Sans navigation on
    // restait sur /game, ou les trois @if de main-game (isGameStarted,
    // isGameFinished, isSummaryMode) testent les statuts 1, 2 et 3 : plus rien
    // ne s'affichait, d'ou l'ecran noir et l'impossibilite de relancer une
    // partie. Meme enchainement que restartGame() dans le footer.
    this.router.navigate(['/players']);
  }

  exit(): void {
    this.gameSrv.resetGame();
    this.router.navigate(['/']);
  }
}

function addTo(table: Map<string, Map<string, number>>, owner: string, counterpart: string, sips: number): void {
  let byCounterpart = table.get(owner);
  if (!byCounterpart) {
    byCounterpart = new Map<string, number>();
    table.set(owner, byCounterpart);
  }
  byCounterpart.set(counterpart, (byCounterpart.get(counterpart) ?? 0) + sips);
}

function sum(byCounterpart: Map<string, number> | undefined): number {
  if (!byCounterpart) {
    return 0;
  }
  let total = 0;
  for (const sips of byCounterpart.values()) {
    total += sips;
  }
  return total;
}

function toLines(byCounterpart: Map<string, number> | undefined, nameById: Map<string, string>): ExchangeLine[] {
  if (!byCounterpart) {
    return [];
  }
  return Array.from(byCounterpart.entries())
    .map(([id, sips]) => ({ playerName: nameById.get(id) || '?', sips, share: 0 }))
    .sort((a, b) => b.sips - a.sips || a.playerName.localeCompare(b.playerName));
}

/** Barre minimale de 8% : en dessous, un petit echange devient invisible. */
function scaleLines(lines: ExchangeLine[], maxSips: number): void {
  if (maxSips <= 0) {
    return;
  }
  for (const line of lines) {
    line.share = Math.max(8, Math.round((line.sips / maxSips) * 100));
  }
}
