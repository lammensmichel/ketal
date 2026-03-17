import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FooterComponent } from './footer.component';
import { PlayerHelperService } from '../../_helpers/player.helper';
import { CardDeckHelperService } from '../../_helpers/card-deck.helper';
import { GameService } from '../../../services/game/game.service';
import { LocalService } from '../../../services/local/local.service';
import { CardService } from '../../../services/card/card.service';
import { PlayingCardComponent } from '../playing-card/playing-card.component';
import { PlayerModel } from '../../_models/player.model';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let playerHelper: PlayerHelperService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FooterComponent, PlayingCardComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: PlayerHelperService,
          useValue: { players: [] } as Partial<PlayerHelperService>,
        },
        {
          provide: CardDeckHelperService,
          useValue: { constructDeck: jasmine.createSpy('constructDeck') },
        },
        {
          provide: GameService,
          useValue: {
            game: undefined,
            gameSubject: { subscribe: jasmine.createSpy('subscribe').and.callFake((cb: any) => cb(undefined)) },
          },
        },
        {
          provide: LocalService,
          useValue: { getData: jasmine.createSpy('getData').and.returnValue(null) },
        },
        {
          provide: CardService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    playerHelper = TestBed.inject(PlayerHelperService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasPlayers', () => {
    it('should return false when there are no players', () => {
      playerHelper.players = [];
      expect(component.hasPlayers()).toBeFalse();
    });

    it('should return false when there is only 1 player', () => {
      playerHelper.players = [{ name: 'Player1' } as PlayerModel];
      expect(component.hasPlayers()).toBeFalse();
    });

    it('should return true when there are 2 or more players', () => {
      playerHelper.players = [
        { name: 'Player1' } as PlayerModel,
        { name: 'Player2' } as PlayerModel,
      ];
      expect(component.hasPlayers()).toBeTrue();
    });

    it('should return true when there are 3 players', () => {
      playerHelper.players = [
        { name: 'Player1' } as PlayerModel,
        { name: 'Player2' } as PlayerModel,
        { name: 'Player3' } as PlayerModel,
      ];
      expect(component.hasPlayers()).toBeTrue();
    });
  });

  describe('hasOnlyOnePlayer', () => {
    it('should return false when there are no players', () => {
      playerHelper.players = [];
      expect(component.hasOnlyOnePlayer()).toBeFalse();
    });

    it('should return true when there is exactly 1 player', () => {
      playerHelper.players = [{ name: 'Player1' } as PlayerModel];
      expect(component.hasOnlyOnePlayer()).toBeTrue();
    });

    it('should return false when there are 2 players', () => {
      playerHelper.players = [
        { name: 'Player1' } as PlayerModel,
        { name: 'Player2' } as PlayerModel,
      ];
      expect(component.hasOnlyOnePlayer()).toBeFalse();
    });
  });

  describe('begin game button visibility', () => {
    it('should not show begin game button when only 1 player', () => {
      playerHelper.players = [{ name: 'Player1' } as PlayerModel];
      component.game = undefined;
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const beginButton = Array.from(buttons).find((btn: any) => btn.textContent.includes('Button_BeginGame'));
      expect(beginButton).toBeUndefined();
    });

    it('should show minimum players message when only 1 player', () => {
      playerHelper.players = [{ name: 'Player1' } as PlayerModel];
      component.game = undefined;
      fixture.detectChanges();

      const message = fixture.nativeElement.querySelector('p.text-muted');
      expect(message).toBeTruthy();
    });
  });
});
