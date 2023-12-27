import {Component, OnInit, ElementRef, ViewChild, Input} from '@angular/core';
import {PlayerModel} from "../../../_shared/_models/player.model";
import {GameService} from "../../../services/game/game.service";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";
import {ToastComponent} from "../../../_shared/_components/toast/toast.component";
import {CardType} from "../../../_shared/_models/card-type.model";

@Component({
  selector: 'app-player-given-sips-selection',
  templateUrl: './player-given-sips-selection.component.html',
  styleUrls: ['./player-given-sips-selection.component.scss']
})
export class PlayerGivenSipsSelectionComponent implements OnInit {
  constructor(private elementRef: ElementRef,
              public gameSrv: GameService,
              public playerHelper: PlayerHelperService) {
  }

  @Input() public currentCard: CardType | undefined;

  @ViewChild('assignAllSips') toastComponent: ToastComponent | undefined;

  public players: PlayerModel[] = [];
  public tempSips: { [key: string]: number } = {};

  public sipsToGive: number = 0;
  public givenPlayer = new PlayerModel();

  ngOnInit(): void {
    this.players = this.gameSrv.game.players;

    this.players.forEach(player => {
      this.tempSips[player.id] = 0;
    });
  }


  increase(player: any) {
    if (this.sipsToGive <= 0) {
      return;
    }
    this.tempSips[player.id]++;
    this.sipsToGive--;
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
    this.players.forEach(player => {
      if (this.tempSips[player.id] > 0) {
        this.playerHelper.addPlayerSip(player, this.tempSips[player.id]);
      }
    });


    const cardsToDecreaseGivenSips: CardType[] = this.givenPlayer.cards.filter((card: CardType) => card.givenSips !== 0);

    cardsToDecreaseGivenSips.forEach((card: CardType) => {
      card.givenSips = 0;
    });

    this.closeModal();
  }

  resetSips() {
    for (let key in this.tempSips) {
      this.tempSips[key] = 0;
    }
    this.sipsToGive = 0;

  }

  closeModal() {
    const modal = this.elementRef.nativeElement.querySelector('#playerSipsSelectionModal');
    modal.style.display = "none";
    this.resetSips();
  }

  openModal(player: PlayerModel) {
    this.givenPlayer = player;
    this.sipsToGive = this.playerHelper.getSipCnt(player);
    const modal = this.elementRef.nativeElement.querySelector('#playerSipsSelectionModal');
    modal.style.display = "flex";
  }
}
