import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ketal';
  public displayPlayerChoice: boolean = true;

  public beginGame(players: string[]): void{
    this.displayPlayerChoice = !this.displayPlayerChoice;
  }
}
