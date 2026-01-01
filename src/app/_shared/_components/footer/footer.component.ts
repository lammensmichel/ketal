import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subscription } from "rxjs";
import { GameService } from "../../../services/game/game.service";
import { PlayerHelperService } from "../../_helpers/player.helper";
import { CardType } from '../../_models/card-type.model';
import { DrinkChoiceEnum } from '../../_models/enums/drink_choice.enum';
import { Game } from '../../_models/game.model';
import { PlayerModel } from "../../_models/player.model";
import { ToastComponent } from "../toast/toast.component";


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  @Input() public withSummaryMode: boolean = false;
  @ViewChild('notAllSipsGiven') toastComponent: ToastComponent | undefined;

  game: Game | undefined;

  gameSubs: Subscription | undefined;

  public drinkingCards: Array<CardType> = [];
  public givingCards: Array<CardType> = [];
  public activeTurn: number = 0;


  constructor(public gameSrv: GameService,
              public playerHelper: PlayerHelperService
  ) {
  }

  ngOnInit() {
    this.gameSubs = this.gameSrv.gameSubject?.subscribe((game) => {
      this.game = game;
      if (this.game) {
        if (!this.game.activePlayer) {
          this.game.activePlayer = this.game.players[0];
        }

        this.activeTurn = this.game.turn;
        this.drinkingCards = this.game.drinkingCards;
        this.givingCards = this.game.givingCards;
      }
    });
  }


  chooseColor(color: string) {
    this.gameSrv.setChoiceAndPickCard(DrinkChoiceEnum.Color, color);
  }

  plusOrMinus(selection: string) {
    this.gameSrv.setChoiceAndPickCard(DrinkChoiceEnum.PlusOrMinus, selection);
  }

  inOut(selection: string) {
    this.gameSrv.setChoiceAndPickCard(DrinkChoiceEnum.InAndOut, selection);
  }

  chooseSuit(selection: string) {
    this.gameSrv.setChoiceAndPickCard(DrinkChoiceEnum.Suit, selection);
  }


  displayNotAllSipsGivenToast() {
    if (this.toastComponent) {
      this.toastComponent.show();
    }
  }

  async restartGame() {

    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.gameSrv.isNotAllSipsGiven()) {
      this.displayNotAllSipsGivenToast();
      // Fleme de faire une fonction de callback sur le toastR mais il faudrait
      await this.delay(2500);
      this.openSipGiveModal(this.gameSrv.getLastCard());
      return;
    }

    this.gameSrv.resetGame();
    this.gameSrv.game.status = 0;
  }


  async displaySummary(): Promise<void> {
    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.gameSrv.isNotAllSipsGiven()) {

      this.displayNotAllSipsGivenToast();
      // Fleme de faire une fonction de callback sur le toastR mais il faudrait
      await this.delay(2500);
      this.openSipGiveModal(this.gameSrv.getLastCard());
      return;

    }

    this.gameSrv.setStatus(3);
  }


  openSipGiveModal(newCardGiven: CardType) {
    if (this.game?.summary && this.game.drinkingCards.length === this.game.givingCards.length) {
      let playersWithNewCard: PlayerModel[] = [];
      this.game.players.forEach(player => {
        if (newCardGiven && newCardGiven.value && this.playerHelper.getPlayerCardListValues(player).includes(newCardGiven.value)) {
          if (this.game) {
            playersWithNewCard = this.game?.players.filter(player => {
              return newCardGiven && newCardGiven.value && this.playerHelper.getPlayerCardListValues(player).includes(newCardGiven.value);
            });
          }
        }
      });
      playersWithNewCard.forEach(player => {
        this.gameSrv.openSipGiveModal(player);
      });
    }
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onDisplayCard() {
    let newCardGiven: void | CardType = this.gameSrv.displayNewCard();
    if (!newCardGiven) {
      this.displayNotAllSipsGivenToast();

      // Fleme de faire une fonction de callback sur le toastR mais il faudrait
      await this.delay(2500);
      this.openSipGiveModal(this.gameSrv.getLastCard());
    } else {

      this.openSipGiveModal(newCardGiven);
    }
  }

  public hasPlayers(): boolean {
    return this.playerHelper?.players?.length > 0;
  }

  public beginGame(): void {
    this.gameSrv.beginGame(this.withSummaryMode);
  }

  ngOnDestroy() {
    this.gameSubs?.unsubscribe();
  }

}
