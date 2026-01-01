import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
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
  imports: [TranslateModule, FontAwesomeIconsModule, ToastComponent],
})
export class PlayerGivenSipsSelectionComponent {
  private readonly elementRef = inject(ElementRef);
  readonly gameSrv = inject(GameService);
  readonly playerHelper = inject(PlayerHelperService);

  @Input() currentCard: CardType | undefined;

  @ViewChild('assignAllSips') toastComponent: ToastComponent | undefined;

  tempSips: { [key: string]: number } = {};
  sipsToGive = 0;
  givenPlayer = new PlayerModel();

  get players(): PlayerModel[] {
    return this.gameSrv.players();
  }

  increase(player: any, sips: number = 0) {
    if (this.sipsToGive <= 0) {
      return;
    }

    if (sips > 0) {
      this.tempSips[player.id] += sips;
      this.sipsToGive -= sips;
      return;
    } else {
      this.tempSips[player.id]++;
      this.sipsToGive--;
    }
  }

  decrease(player: any) {
    if (this.tempSips[player.id] > 0) {
      this.tempSips[player.id]--;
      this.sipsToGive++;
    }
  }

  save() {
    if (this.sipsToGive !== 0) {
      if (this.toastComponent) {
        this.toastComponent.show();
      }
      return;
    }
    // Implement your save logic here
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

    this.closeModal();
  }

  resetSips() {
    for (const key in this.tempSips) {
      this.tempSips[key] = 0;
    }
    this.sipsToGive = 0;
  }

  closeModal() {
    const modal = this.elementRef.nativeElement.querySelector('#playerSipsSelectionModal');
    modal.style.display = 'none';

    this.resetSips();
  }

  openModal(player: PlayerModel): void {
    this.givenPlayer = player;
    this.sipsToGive = this.playerHelper.getSipCnt(this.gameSrv.game(), player);

    this.players.forEach((p) => {
      this.tempSips[p.id] = 0;
    });

    const modal = this.elementRef.nativeElement.querySelector('#playerSipsSelectionModal');
    modal.style.display = 'flex';
  }
}
