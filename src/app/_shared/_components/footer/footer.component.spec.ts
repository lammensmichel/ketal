import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FooterComponent } from './footer.component';
import { PlayingCardComponent } from '../playing-card/playing-card.component';
import { GameService } from '../../../services/game/game.service';
import { LocalService } from '../../../services/local/local.service';
import { CardDeckHelperService } from '../../_helpers/card-deck.helper';
import { PlayerHelperService } from '../../_helpers/player.helper';
import { CardService } from '../../../services/card/card.service';
import { CardType } from '../../_models/card-type.model';
import { SuitsEnum } from '../../_models/enums/suits.enum';
import { BehaviorSubject } from 'rxjs';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  const mockCard: CardType = {
    value: '7',
    suit: SuitsEnum.Hearts,
    icon: null,
    swallow: 0,
    selected: false,
    img: 'assets/images/cards/svg/7_of_hearts.svg'
  };

  const mockPlayer = {
    id: 'player-1',
    name: 'Alice',
    avatarSrc: '',
    cards: [mockCard],
    choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' }
  };

  beforeEach(async () => {
    const gameSubject = new BehaviorSubject<any>(undefined);

    const mockGameService = jasmine.createSpyObj('GameService', [
      'setCardChoice', 'addCardToPlayer', 'refreshSession', 'addTurn',
      'addDrinkingCard', 'addGivingCard', 'resetGame'
    ], {
      game: { players: [mockPlayer], turn: 2, phase: 1, drinkingCards: [], givingCards: [], activePlayer: mockPlayer, maxTurnCount: 4 },
      gameSubject: gameSubject
    });

    const mockLocalService = jasmine.createSpyObj('LocalService', ['getData', 'setData']);
    const mockCardDeckHelper = jasmine.createSpyObj('CardDeckHelperService', ['constructDeck', 'getRandomCard']);
    const mockPlayerHelper = jasmine.createSpyObj('PlayerHelperService', [], { players: [mockPlayer] });

    await TestBed.configureTestingModule({
      declarations: [FooterComponent, PlayingCardComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: LocalService, useValue: mockLocalService },
        { provide: CardDeckHelperService, useValue: mockCardDeckHelper },
        { provide: PlayerHelperService, useValue: mockPlayerHelper },
        CardService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getActivePlayerLastCard', () => {
    it('should return the last card of the active player', () => {
      component.game = {
        players: [mockPlayer],
        activePlayer: mockPlayer,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;

      const card = component.getActivePlayerLastCard();
      expect(card).toBeDefined();
      expect(card?.value).toBe('7');
      expect(card?.suit).toBe(SuitsEnum.Hearts);
    });

    it('should return undefined when there is no active player', () => {
      component.game = {
        players: [mockPlayer],
        activePlayer: undefined,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;

      const card = component.getActivePlayerLastCard();
      expect(card).toBeUndefined();
    });

    it('should return undefined when active player has no cards', () => {
      const playerWithNoCards = { ...mockPlayer, cards: [] };
      component.game = {
        players: [playerWithNoCards],
        activePlayer: playerWithNoCards,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;

      const card = component.getActivePlayerLastCard();
      expect(card).toBeUndefined();
    });

    it('should return the most recent card when player has multiple cards', () => {
      const secondCard: CardType = {
        value: 'K',
        suit: SuitsEnum.Spades,
        icon: null,
        swallow: 0,
        selected: false,
        img: 'assets/images/cards/svg/king_of_spades.svg'
      };
      const playerWithTwoCards = { ...mockPlayer, cards: [mockCard, secondCard] };
      component.game = {
        players: [playerWithTwoCards],
        activePlayer: playerWithTwoCards,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;

      const card = component.getActivePlayerLastCard();
      expect(card?.value).toBe('K');
      expect(card?.suit).toBe(SuitsEnum.Spades);
    });
  });

  describe('getSuitSymbol', () => {
    it('should return hearts symbol for hearts suit', () => {
      expect(component.getSuitSymbol(SuitsEnum.Hearts)).toBe('&hearts;');
    });

    it('should return diams symbol for diams suit', () => {
      expect(component.getSuitSymbol(SuitsEnum.Diams)).toBe('&diams;');
    });

    it('should return spades symbol for spades suit', () => {
      expect(component.getSuitSymbol(SuitsEnum.Spades)).toBe('&spades;');
    });

    it('should return clubs symbol for clubs suit', () => {
      expect(component.getSuitSymbol(SuitsEnum.Clubs)).toBe('&clubs;');
    });

    it('should return empty string for null suit', () => {
      expect(component.getSuitSymbol(null)).toBe('');
    });
  });

  describe('Turn 2 - Plus/Minus buttons rendering', () => {
    it('should render prediction buttons with arrows and labels at turn 2', () => {
      // First detectChanges triggers ngOnInit
      fixture.detectChanges();

      // Now set the game state after ngOnInit subscription is set up
      component.game = {
        players: [mockPlayer],
        activePlayer: mockPlayer,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;
      component.activeTurn = 2;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      const plusButton = compiled.querySelector('[title="choosePlus"]') as HTMLElement;
      const minusButton = compiled.querySelector('[title="chooseMinus"]') as HTMLElement;

      expect(plusButton).toBeTruthy();
      expect(minusButton).toBeTruthy();

      expect(plusButton.querySelector('.prediction-arrow')).toBeTruthy();
      expect(plusButton.querySelector('.prediction-label')).toBeTruthy();
      expect(minusButton.querySelector('.prediction-arrow')).toBeTruthy();
      expect(minusButton.querySelector('.prediction-label')).toBeTruthy();
    });

    it('should show reference card hint at turn 2 when active player has cards', () => {
      fixture.detectChanges();

      component.game = {
        players: [mockPlayer],
        activePlayer: mockPlayer,
        turn: 2, phase: 1, drinkingCards: [], givingCards: [], maxTurnCount: 4
      } as any;
      component.activeTurn = 2;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const referenceHint = compiled.querySelector('.reference-card-hint');
      expect(referenceHint).toBeTruthy();
      expect(referenceHint?.textContent).toContain('7');
    });
  });
});
