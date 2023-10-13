import { CardType } from 'src/models/card-type.model';

export class CardDeckHelperService {
  public possibleSuits: string[] = ['spades', 'diamond', 'clubs', 'hearts'];
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

  public construcDesck(): Array<CardType> {
    let deck = new Array<CardType>();

    for (let i = 0; i < this.possibleSuits.length; i++) {
      for (let x = 0; x < this.possiblevalues.length; x++) {
        let card: CardType = {
          value: this.possiblevalues[x],
          suit: this.possibleSuits[i],
          icon: `&${this.possibleSuits[i]};`,
          Sips: 0,
        };
        deck.push(card);
        this.createdCardDeck.push(card);
      }
    }

    return deck;
  }

  public getRandomCard() {
    const card =
      this.createdCardDeck[
        Math.floor(Math.random() * this.createdCardDeck.length)
      ];

    const toDelete = this.createdCardDeck.indexOf(card, 0);

    if (toDelete > -1) {
      this.createdCardDeck.splice(toDelete, 1);
    }

    return card;
  }

  public resetCards(): void {
    this.createdCardDeck = [];
  }
}
