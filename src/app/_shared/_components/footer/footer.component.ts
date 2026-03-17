import { Component, Input, ViewChild, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../_helpers/player.helper';
import { CardType } from '../../_models/card-type.model';
import { DrinkChoiceEnum } from '../../_models/enums/drink_choice.enum';
import { ToastComponent } from '../toast/toast.component';
import { PlayingCardComponent } from '../playing-card/playing-card.component';

/** Routes where the game footer should be hidden */
const HIDDEN_ROUTES = ['/login', '/register', '/forgot-password', '/room'];

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [NgClass, TranslateModule, FontAwesomeIconsModule, ToastComponent, PlayingCardComponent],
})
export class FooterComponent {
  private readonly router = inject(Router);
  readonly gameSrv = inject(GameService);
  readonly playerHelper = inject(PlayerHelperService);

  @Input() public withSummaryMode: boolean = false;
  @ViewChild('notAllSipsGiven') toastComponent: ToastComponent | undefined;

  readonly cardSlots = [0, 1, 2, 3, 4, 5];

  /** Check if current route is a page where game footer should be hidden */
  isHiddenPage(): boolean {
    return HIDDEN_ROUTES.some((route) => this.router.url.startsWith(route));
  }

  /** Check if current route is the players page (where local game start UI should be visible) */
  isPlayersPage(): boolean {
    return this.router.url === '/players';
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

  async restartGame(): Promise<void> {
    if (await this.ensureAllSipsGiven()) {
      this.gameSrv.resetGame();
      this.router.navigate(['/players']);
    }
  }

  async displaySummary(): Promise<void> {
    if (await this.ensureAllSipsGiven()) {
      this.gameSrv.setStatus(3);
    }
  }

  private async ensureAllSipsGiven(): Promise<boolean> {
    if (!this.gameSrv.isNotAllSipsGiven()) {
      return true;
    }

    this.toastComponent?.show();
    await this.delay(2500);
    this.openSipGiveModal(this.gameSrv.getLastCard());
    return false;
  }

  openSipGiveModal(newCardGiven: CardType): void {
    if (!this.gameSrv.summary() || this.gameSrv.drinkingCards().length !== this.gameSrv.givingCards().length) {
      return;
    }

    if (!newCardGiven?.value) {
      return;
    }

    const playersWithNewCard = this.gameSrv
      .players()
      .filter((player) => this.playerHelper.getPlayerCardListValues(player).includes(newCardGiven.value!));

    playersWithNewCard.forEach((player) => this.gameSrv.openSipGiveModal(player));
  }

  async onDisplayCard(): Promise<void> {
    const newCardGiven = this.gameSrv.displayNewCard();
    if (newCardGiven) {
      this.openSipGiveModal(newCardGiven);
      return;
    }

    this.toastComponent?.show();
    await this.delay(2500);
    this.openSipGiveModal(this.gameSrv.getLastCard());
  }

  hasPlayers(): boolean {
    return this.playerHelper?.getPlayers()?.length > 0;
  }

  async beginGame(): Promise<void> {
    await this.gameSrv.beginGame(this.withSummaryMode);
    this.router.navigate(['/game']);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
