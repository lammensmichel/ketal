import { Game } from './game.model';

export interface Room {
  name: string;
  description: string;
  id: string;
  game?: Game;
}
