import {AfterViewInit, Component, ElementRef, Input, NgZone, ViewChild} from '@angular/core';
import {PlayerModel} from "../../../_shared/_models/player.model";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";
import {LocalService} from "../../../services/local/local.service";

@Component({
  selector: 'app-player-list-player',
  templateUrl: './player-list-player.component.html',
  styleUrls: ['./player-list-player.component.scss']
})
export class PlayerListPlayerComponent implements AfterViewInit{
  @Input() player: PlayerModel | undefined;
  @ViewChild('contentContainer') contentContainer: ElementRef | undefined;
  @ViewChild('nameContainer') nameContainer!: ElementRef;
  @ViewChild('buttonContainer') buttonContainer: ElementRef | undefined;

  public changeFontSize: boolean = false;

  constructor(public playerHelper: PlayerHelperService,
              public localService: LocalService,
              private ngZone: NgZone) {
  }

  public isTextWrapping(element: HTMLElement): boolean {
    // console.log(this.nameContainer.nativeElement.offsetWidth);
    return element.scrollHeight > element.clientHeight;
  }


  public deletePlayer(player: PlayerModel) {
    this.playerHelper.players = this.playerHelper.players.filter(
      (playerSelected) => playerSelected.name !== player.name
    );

    this.localService.saveData(
      'players',
      JSON.stringify(this.playerHelper.players)
    );
  }

  public changeFontClass() {
    return this.changeFontSize;
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const contentContainer = this.contentContainer;
        const nameContainer = this.nameContainer;
        const buttonContainer = this.buttonContainer;
        const contentContainerWidth = contentContainer?.nativeElement.offsetWidth;
        const nameContainerWidth = nameContainer?.nativeElement.offsetWidth;
        const buttonContainerWidth = buttonContainer?.nativeElement.offsetWidth;


        if (contentContainerWidth < (32 + nameContainerWidth + buttonContainerWidth)) {
          this.ngZone.run(() => {
            this.changeFontSize = true;
          });
        }
      });
    });
  }

}
