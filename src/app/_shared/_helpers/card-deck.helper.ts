
import { Injectable } from "@angular/core";
import { LocalService } from "../../services/local/local.service";
import { CardType } from "../_models/card-type.model";
import { CardValueEnum } from "../_models/enums/card_value.enum";
import { SuitsEnum } from "../_models/enums/suits.enum";

@Injectable({
  providedIn: 'root',
})

export class CardDeckHelperService {

  public possibleSuits: string[] = Object.values(SuitsEnum);
  public possibleValues: string[] = Object.values(CardValueEnum);

  public createdCardDeck: Array<CardType> = [];


  constructor(
    public localSrv: LocalService
  ) {
    const sessionCardDeck = JSON.parse(this.localSrv.getData('cardDeck') as string);
    this.createdCardDeck = sessionCardDeck ? sessionCardDeck : [];
  }

  public constructDeck(): Array<CardType> {
    this.resetCards();
    let deck = new Array<CardType>();

    for (let i = 0; i < this.possibleSuits.length; i++) {
      for (let x = 0; x < this.possibleValues.length; x++) {
        let card: CardType = {
          suit: this.possibleSuits[i],
          icon: `&${this.possibleSuits[i]};`,
          swallow: 0,
          selected: false,
          value: '',
          img:`assets/images/cards/svg/${this.possibleValues[x]}_${this.possibleSuits[i]}.svg`,
        };
        card.value = this.possibleValues[x];
        deck.push(card);
      }
    }

    this.localSrv.saveData('cardDeck', JSON.stringify(deck));

    return deck;
  }

  public getRandomCard(): CardType {
    const deck = JSON.parse(this.localSrv.getData('cardDeck') as string)
    const card = deck[Math.floor(Math.random() * deck.length)];

    const toDelete = deck.indexOf(card, 0);

    if (toDelete > -1) {
      deck.splice(toDelete, 1);
    }

    this.localSrv.saveData('cardDeck', JSON.stringify(deck));

    return card;
  }

  public resetCards(): void {
    this.createdCardDeck = [];
    this.localSrv.saveData('cardDeck', JSON.stringify(this.createdCardDeck));

  }
}
