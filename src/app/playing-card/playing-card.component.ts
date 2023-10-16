import {Component, Input, OnInit} from '@angular/core';
import {CardType} from "../../models/card-type.model";

@Component({
  selector: 'app-playing-card',
  templateUrl: './playing-card.component.html',
  styleUrls: ['./playing-card.component.scss']
})
export class PlayingCardComponent implements OnInit{
  @Input() card: CardType | undefined;


  constructor() {

  }

  ngOnInit(): void {
  }


}

