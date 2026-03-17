import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, ViewChild } from '@angular/core';
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

  /** Cached sip count (signed) - recomputed via game signal */
  readonly sipCount = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, false) : 0;
  });

  /** Cached absolute sip count - recomputed via game signal */
  readonly sipCountAbsolute = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, true) : 0;
  });

  /** Translation key for singular/plural sip label */
  readonly sipLabelKey = computed(() => {
    return this.sipCountAbsolute() <= 1 ? 'Label_Sip' : 'Label_Sips';
  });

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
