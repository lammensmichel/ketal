import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { GameService } from '../../../services/game/game.service';
import { PlayerGivenSipsSelectionComponent } from '../player-given-sips-selection/player-given-sips-selection.component';
import { PlayingCardComponent } from '../../../_shared/_components/playing-card/playing-card.component';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TranslateModule, FontAwesomeIconsModule, PlayerGivenSipsSelectionComponent, PlayingCardComponent],
})
export class PlayerCardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerSrv = inject(PlayerHelperService);
  private readonly gameSrv = inject(GameService);

  @ViewChild(PlayerGivenSipsSelectionComponent)
  private playerGivenSipsModal: PlayerGivenSipsSelectionComponent | undefined;

  @Input() player: PlayerModel = new PlayerModel();
  @Input() isActive = false;
  @Input() hasActivePlayer = false;

  readonly cardSlots = [0, 1, 2, 3];

  /** Avatar load error flag */
  avatarError = false;

  /** Bounce animation trigger */
  readonly sipBounce = signal(false);

  /** Player initials for avatar fallback */
  readonly initials = computed(() => {
    if (!this.player?.name) {
      return '?';
    }
    return this.player.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  /** Cached sip count (signed) - recomputed via game signal */
  readonly sipCount = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, false) : 0;
  });

  /** Cached absolute sip count - recomputed via game signal */
  readonly sipCountAbsolute = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, true) : 0;
  });

  /** Sips to drink (absolute) */
  readonly sipsDrunk = computed(() => {
    const count = this.sipCount();
    return count < 0 ? Math.abs(count) : 0;
  });

  /** Sips to give */
  readonly sipsGiven = computed(() => {
    const count = this.sipCount();
    return count > 0 ? count : 0;
  });

  /** Per-turn sip indicator for Phase 1 - resets when active player changes */
  readonly lastTurnSips = computed(() => {
    this.gameSrv.lastTurnSips();
    return this.player ? this.gameSrv.getLastTurnSipsForPlayer(this.player.id) : 0;
  });

  constructor() {
    // Trigger bounce animation when sip count changes
    effect(() => {
      this.sipCountAbsolute();
      this.sipBounce.set(true);
      setTimeout(() => this.sipBounce.set(false), 300);
    });
  }

  ngOnInit(): void {
    this.gameSrv.openSipGiveModalEvent$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player) => {
      if (this.player.id === player.id) {
        this.openPlayerGivenSipsModal(player);
      }
    });
  }

  openPlayerGivenSipsModal(player: PlayerModel): void {
    if (this.playerSrv.getPlayerNumber() === 1 || !this.gameSrv.isSummaryActivated()) {
      return;
    }

    const hasSipsToGive = this.sipCount() > 0 && this.playerSrv.getTotalGivenSips(player) > 0;
    if (hasSipsToGive) {
      this.playerGivenSipsModal?.openModal(player);
    }
  }
}
