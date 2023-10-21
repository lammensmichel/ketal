import {CardType} from 'src/models/card-type.model';
import {LocalService} from "../app/services/local/local.service";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root',
})

export class CardDeckHelperService {

  public possibleSuits: string[] = ['spades', 'diams', 'clubs', 'hearts'];
  public possiblevalues: string[] = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];
  public createdCardDeck: Array<CardType> = [];


  constructor(
    public localSrv: LocalService
  ) {
    const sessionCardDeck = JSON.parse(this.localSrv.getData('cardDeck') as string);
    this.createdCardDeck = sessionCardDeck ? sessionCardDeck : [];
  }

  public construcDesck(): Array<CardType> {
    this.resetCards();
    let deck = new Array<CardType>();

    for (let i = 0; i < this.possibleSuits.length; i++) {
      for (let x = 0; x < this.possiblevalues.length; x++) {
        let card: CardType = {
          suit: this.possibleSuits[i],
          icon: `&${this.possibleSuits[i]};`,
          swallow: 0,
          selected: false,
          value: '',
          img:`assets/images/cards/svg/${this.possiblevalues[x]}_${this.possibleSuits[i]}.svg`,
        };
        card.value = this.possiblevalues[x];
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
