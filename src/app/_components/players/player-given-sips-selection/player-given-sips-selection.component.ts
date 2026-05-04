import { Component, inject, Input, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass } from '@angular/common';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { ToastComponent } from '../../../_shared/_components/toast/toast.component';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { CardType } from '../../../_shared/_models/card-type.model';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { GameService } from '../../../services/game/game.service';

@Component({
  selector: 'app-player-given-sips-selection',
  templateUrl: './player-given-sips-selection.component.html',
  styleUrls: ['./player-given-sips-selection.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgClass, FontAwesomeIconsModule, ToastComponent],
})
export class PlayerGivenSipsSelectionComponent {
  readonly gameSrv = inject(GameService);
  readonly playerHelper = inject(PlayerHelperService);

  @Input() currentCard: CardType | undefined;

  @ViewChild('assignAllSips') toastComponent: ToastComponent | undefined;

  tempSips: { [key: string]: number } = {};
  sipsToGive = 0;
  givenPlayer = new PlayerModel();
  modalOpen = false;

  get players(): PlayerModel[] {
    return this.gameSrv.players();
  }

  increase(player: PlayerModel, sips: number = 0): void {
    if (this.sipsToGive <= 0) {
      return;
    }

    if (sips > 0) {
      sips = Math.min(sips, this.sipsToGive);
      this.tempSips[player.id] += sips;
      this.sipsToGive -= sips;
    } else {
      this.tempSips[player.id]++;
      this.sipsToGive--;
    }
  }

  decrease(player: PlayerModel): void {
    if (this.tempSips[player.id] > 0) {
      this.tempSips[player.id]--;
      this.sipsToGive++;
    }
  }

  save(): void {
    if (this.sipsToGive !== 0) {
      this.toastComponent?.show();
      return;
    }

    this.players.forEach((player) => {
      if (this.tempSips[player.id] > 0) {
        this.gameSrv.addPlayerSip(player, this.tempSips[player.id]);
      }
    });

    const cardsToDecreaseGivenSips: CardType[] = this.givenPlayer.cards.filter(
      (card: CardType) => card.givenSips && card.givenSips !== 0
    );

    cardsToDecreaseGivenSips.forEach((card: CardType) => {
      this.gameSrv.updatePlayerGivenSipsFromCard(this.givenPlayer, card, 0);
    });

    // Clear the giver's per-event "+N to give" badge — the obligation is now settled.
    this.gameSrv.clearLastTurnGivenForPlayer(this.givenPlayer.id);

    this.closeModal();
  }

  closeModal(): void {
    this.modalOpen = false;
    for (const key in this.tempSips) {
      this.tempSips[key] = 0;
    }
    this.sipsToGive = 0;
  }

  openModal(player: PlayerModel): void {
    this.givenPlayer = player;
    this.sipsToGive = this.playerHelper.getTotalGivenSips(player);

    this.players.forEach((p) => {
      this.tempSips[p.id] = 0;
    });

    this.modalOpen = true;
  }
}
