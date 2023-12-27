import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Subscription} from "rxjs";
import {GameService} from "../../../services/game/game.service";
import {PlayerHelperService} from "../../_helpers/player.helper";
import {CardType} from '../../_models/card-type.model';
import {DrinkChoiceEnum} from '../../_models/enums/drink_choice.enum';
import {Game} from '../../_models/game.model';
import {ToastComponent} from "../toast/toast.component";


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

  restartGame() {

    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.gameSrv.isNotAllSipsGiven()) {
      this.displayNotAllSipsGivenToast();
      return;
    }

    this.gameSrv.resetGame();
    this.gameSrv.game.status = 0;
  }

  displaySummary(): void {
    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.gameSrv.isNotAllSipsGiven()) {
      this.displayNotAllSipsGivenToast();
      return;
    }

    this.gameSrv.setStatus(3);
  }

  onDisplayCard() {
    let newCardGiven: number | void = this.gameSrv.displayNewCard();
    if (newCardGiven === -1) {
      this.displayNotAllSipsGivenToast();
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
