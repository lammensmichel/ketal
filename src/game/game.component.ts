import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';
import { PlayerHelperService } from 'src/helpers/player.helper';
import { CardType } from 'src/models/card-type.model';
import { PlayerModel } from 'src/models/player.model';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  @Output() public goToPhaseTwo: EventEmitter<void> = new EventEmitter<void>();
  public playerCount: number = 0;
  public maxTurnCount: number = 0;
  public playerTurn: number = 0;
  public turnCount: number = 0;
  public goToSecondPhase: boolean = false;
  public currentCard: CardType | undefined;

  players: PlayerModel[] = [ ];

  constructor(playerHelperService: PlayerHelperService, public cardDeckHelperService: CardDeckHelperService) {
    this.players = playerHelperService.players;
  }

  public ngOnInit(): void {
      this.playerCount = this.players.length;
      this.maxTurnCount = this.playerCount * 4;
  }

  public getPlayerName(): string {
    return this.players[this.playerTurn].name;
  }

  onNextClick() {
    this.currentCard = this.cardDeckHelperService.getRandomCard();


    this.players[this.playerTurn].cards.push(this.currentCard);
    this.playerTurn++;
    this.turnCount++;

    if(this.playerTurn === this.playerCount){
      this.playerTurn = 0;
    }

    if(this.turnCount === this.maxTurnCount){
      this.goToSecondPhase = true;
      this.goToPhaseTwo.emit();
    }
  }

  public getMessage(): string {
    let message = '';

    if(this.turnCount < this.playerCount){
      message = 'Rouge ou noir: ';
    }

    if(this.turnCount >= this.playerCount && this.turnCount < this.playerCount *2) {

      message = 'Plus grand ou plus petit: ';
    }

    if(this.turnCount >= this.playerCount*2 && this.turnCount < this.playerCount *3) {

      message = 'Entre ou extérieur: ';
    }

    if(this.turnCount >= this.playerCount*3) {

      message = 'Carreau Coeur rèfle ou Pique: ';
    }

    return message;
  }
}
