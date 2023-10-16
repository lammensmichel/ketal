import {Component, OnInit} from '@angular/core';
import {CardDeckHelperService} from 'src/helpers/card-deck.helper';
import {GameService} from "./services/game/game.service";
import {Game} from "../models/game.model";
import {LocalService} from "./services/local/local.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    title = 'ketal';
    public displayPlayerChoice: boolean = true;
    public displaySecondPhase: boolean = false;

    private game: Game | undefined;


    constructor(public cardDeckHelperService: CardDeckHelperService,
                public gameSrv: GameService
    ) {
    }


    ngOnInit(): void {

        // this.displayPlayerChoice = !;
    }



    beginSecondPhase() {
        this.gameSrv.game.phase = 2;
        this.displaySecondPhase = !this.displaySecondPhase;
    }
}
