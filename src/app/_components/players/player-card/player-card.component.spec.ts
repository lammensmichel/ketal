import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { PlayerCardComponent } from './player-card.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { Game } from '../../../_shared/_models/game.model';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';

describe('PlayerCardComponent', () => {
  let component: PlayerCardComponent;
  let fixture: ComponentFixture<PlayerCardComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let sipGiveModalSubject: Subject<PlayerModel>;

  const mockPlayer: PlayerModel = {
    id: '1',
    name: 'Test Player',
    cards: [],
    avatarSrc: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
    sips: { drunk: 0, given: 0 },
  };

  const mockPlayer2: PlayerModel = {
    id: '2',
    name: 'Test Player 2',
    cards: [],
    avatarSrc: '',
    choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
    sips: { drunk: 0, given: 0 },
  };

  const mockGame: Game = {
    players: [mockPlayer, mockPlayer2],
    turn: 1,
    maxTurnCount: 4,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: mockPlayer,
    status: 1,
    summary: true,
  };

  beforeEach(async () => {
    sipGiveModalSubject = new Subject<PlayerModel>();
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    Object.defineProperty(mockGameService, 'openSipGiveModalEvent$', {
      get: () => sipGiveModalSubject.asObservable(),
      configurable: true,
    });

    mockGameService.game.set(mockGame);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PlayerCardComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerCardComponent);
    component = fixture.componentInstance;
    component.player = mockPlayer;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('@Input player', () => {
    it('should accept player input', () => {
      component.player = mockPlayer;
      expect(component.player).toEqual(mockPlayer);
    });

    it('should have default empty PlayerModel', () => {
      const newComponent = TestBed.createComponent(PlayerCardComponent).componentInstance;
      expect(newComponent.player).toBeDefined();
      expect(newComponent.player.name).toBe('');
    });
  });

  describe('@Input isActive', () => {
    it('should default to false', () => {
      expect(component.isActive).toBe(false);
    });

    it('should accept isActive input', () => {
      component.isActive = true;
      expect(component.isActive).toBe(true);
    });
  });

  describe('@Input hasActivePlayer', () => {
    it('should default to false', () => {
      expect(component.hasActivePlayer).toBe(false);
    });

    it('should accept hasActivePlayer input', () => {
      component.hasActivePlayer = true;
      expect(component.hasActivePlayer).toBe(true);
    });
  });

  describe('active/inactive CSS classes', () => {
    it('should apply player-card--active class when isActive is true', () => {
      component.isActive = true;
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.player-card');
      expect(cardElement.classList.contains('player-card--active')).toBe(true);
      expect(cardElement.classList.contains('player-card--inactive')).toBe(false);
    });

    it('should apply player-card--inactive class when isActive is false and hasActivePlayer is true', () => {
      component.isActive = false;
      component.hasActivePlayer = true;
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.player-card');
      expect(cardElement.classList.contains('player-card--inactive')).toBe(true);
      expect(cardElement.classList.contains('player-card--active')).toBe(false);
    });

    it('should not apply any highlight class when hasActivePlayer is false', () => {
      component.isActive = false;
      component.hasActivePlayer = false;
      fixture.detectChanges();

      const cardElement = fixture.nativeElement.querySelector('.player-card');
      expect(cardElement.classList.contains('player-card--active')).toBe(false);
      expect(cardElement.classList.contains('player-card--inactive')).toBe(false);
    });
  });

  describe('initials', () => {
    it('should compute initials from player name', () => {
      component.player = { ...mockPlayer, name: 'Jean Dupont' };
      expect(component.initials()).toBe('JD');
    });

    it('should return single initial for single name', () => {
      component.player = { ...mockPlayer, name: 'Jean' };
      expect(component.initials()).toBe('J');
    });

    it('should return ? for empty name', () => {
      component.player = { ...mockPlayer, name: '' };
      expect(component.initials()).toBe('?');
    });
  });

  describe('cardSlots', () => {
    it('should have 4 card slots', () => {
      expect(component.cardSlots).toEqual([0, 1, 2, 3]);
    });
  });

  describe('ngOnInit subscription', () => {
    it('should subscribe to openSipGiveModalEvent$', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should call openPlayerGivenSipsModal when player id matches', fakeAsync(() => {
      fixture.detectChanges();
      const modalSpy = spyOn(component, 'openPlayerGivenSipsModal');

      sipGiveModalSubject.next(mockPlayer);
      tick();

      expect(modalSpy).toHaveBeenCalledWith(mockPlayer);
    }));

    it('should not call openPlayerGivenSipsModal when player id does not match', () => {
      fixture.detectChanges();
      const modalSpy = spyOn(component, 'openPlayerGivenSipsModal');

      sipGiveModalSubject.next(mockPlayer2);

      expect(modalSpy).not.toHaveBeenCalled();
    });
  });

  describe('sipCount', () => {
    it('should return sip count from playerSrv', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(5);
      component.player = mockPlayer;
      fixture.detectChanges();

      const result = component.sipCount();

      expect(result).toBe(5);
      expect(mockPlayerHelperService.getSipCnt).toHaveBeenCalledWith(mockGameService.game(), mockPlayer, false);
    });

    it('should return 0 when player is falsy', () => {
      component.player = null as any;

      const result = component.sipCount();

      expect(result).toBe(0);
    });

    it('should return absolute sip count via sipCountAbsolute', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(10);
      component.player = mockPlayer;
      fixture.detectChanges();

      const result = component.sipCountAbsolute();

      expect(result).toBe(10);
      expect(mockPlayerHelperService.getSipCnt).toHaveBeenCalledWith(mockGameService.game(), mockPlayer, true);
    });
  });

  describe('sipsDrunk and sipsGiven', () => {
    it('should compute sipsDrunk from negative sipCount', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(-3);
      component.player = mockPlayer;
      fixture.detectChanges();

      expect(component.sipsDrunk()).toBe(3);
      expect(component.sipsGiven()).toBe(0);
    });

    it('should compute sipsGiven from positive sipCount', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(5);
      component.player = mockPlayer;
      fixture.detectChanges();

      expect(component.sipsDrunk()).toBe(0);
      expect(component.sipsGiven()).toBe(5);
    });
  });

  describe('openPlayerGivenSipsModal', () => {
    it('should return early when player count is 1', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);

      component.openPlayerGivenSipsModal(mockPlayer);

      expect(mockGameService.isSummaryActivated).not.toHaveBeenCalled();
    });

    it('should return early when summary mode is not activated', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(false);

      component.openPlayerGivenSipsModal(mockPlayer);

      expect(mockPlayerHelperService.getTotalGivenSips).not.toHaveBeenCalled();
    });

    it('should check for sips to give when conditions are met', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(true);
      mockPlayerHelperService.getSipCnt.and.returnValue(3);
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(5);
      fixture.detectChanges();

      component.openPlayerGivenSipsModal(mockPlayer);

      expect(mockPlayerHelperService.getTotalGivenSips).toHaveBeenCalledWith(mockPlayer);
    });
  });

  describe('lastTurnSips', () => {
    it('should return 0 by default', () => {
      fixture.detectChanges();
      expect(component.lastTurnSips()).toBe(0);
    });

    it('should return value from GameService for this player', () => {
      mockGameService.getLastTurnSipsForPlayer.and.returnValue(3);
      fixture.detectChanges();

      expect(component.lastTurnSips()).toBe(3);
      expect(mockGameService.getLastTurnSipsForPlayer).toHaveBeenCalledWith('1');
    });

    it('should return 0 when player is falsy', () => {
      component.player = null as any;
      expect(component.lastTurnSips()).toBe(0);
    });

    it('should not display per-turn sips badge when lastTurnSips is 0', () => {
      mockGameService.getLastTurnSipsForPlayer.and.returnValue(0);
      fixture.detectChanges();

      const perTurnBadge = fixture.nativeElement.querySelector('.player-card__turn-badge');
      expect(perTurnBadge).toBeNull();
    });

    it('should display per-turn sips badge when lastTurnSips is greater than 0', () => {
      mockGameService.getLastTurnSipsForPlayer.and.returnValue(2);
      fixture.detectChanges();

      const perTurnBadge = fixture.nativeElement.querySelector('.player-card__turn-badge');
      expect(perTurnBadge).toBeTruthy();
      expect(perTurnBadge.textContent).toContain('+2');
    });
  });

  describe('Component lifecycle', () => {
    it('should properly clean up on destroy', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
