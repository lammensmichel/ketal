import { Component } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent {
  players: any[] = [
    {
      name: 'Joueur 1',
      cards: [
        { number: 'A', color: 'heart' },
        { number: '2', color: 'diamond' },
        { number: '3', color: 'club' },
        { number: '4', color: 'spade' },
      ],
    },
    {
      name: 'Joueur 2',
      cards: [
        { number: '4', color: 'spade' },
        { number: '5', color: 'heart' },
        { number: '6', color: 'spade' },
      ],
    },
    // Ajoutez d'autres joueurs avec leurs cartes ici
  ];
}
