import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { PlayerCardComponent } from './player-card.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { Game } from '../../../_shared/_models/game.model';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';

describe('PlayerCardComponent', () => {
  let component: PlayerCardComponent;
  let fixture: ComponentFixture<PlayerCardComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let sipGiveModalSubject: Subject<PlayerModel>;

  const mockPlayer: PlayerModel = {
    id: '1',
    name: 'Test Player',
    cards: [],
    avatarSrc: '',
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

    // Override openSipGiveModalEvent$ with our Subject
    Object.defineProperty(mockGameService, 'openSipGiveModalEvent$', {
      get: () => sipGiveModalSubject.asObservable(),
      configurable: true,
    });

    // Mock the game object
    (mockGameService as any).game = { ...mockGame };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [PlayerCardComponent],
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
    // Ensure component is destroyed before completing subject
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

    it('should update player input when changed', () => {
      component.player = mockPlayer;
      expect(component.player.name).toBe('Test Player');

      component.player = mockPlayer2;
      expect(component.player.name).toBe('Test Player 2');
    });
  });

  describe('ngOnInit', () => {
    it('should subscribe to openSipGiveModalEvent$', () => {
      component.ngOnInit();
      expect(component).toBeTruthy();
    });

    it('should call onpenPlayerGivenSipsSelectionModal when player id matches', fakeAsync(() => {
      // Set up the component with the player and spy before ngOnInit
      component.player = mockPlayer;
      const modalSpy = spyOn(component, 'onpenPlayerGivenSipsSelectionModal');

      // Initialize the component which will subscribe
      component.ngOnInit();

      // Now emit a value from the subject after subscription
      sipGiveModalSubject.next(mockPlayer);
      tick();
      expect(modalSpy).toHaveBeenCalledWith(mockPlayer);
    }));

    it('should not call onpenPlayerGivenSipsSelectionModal when player id does not match', () => {
      component.player = mockPlayer;
      const modalSpy = spyOn(component, 'onpenPlayerGivenSipsSelectionModal');
      component.ngOnInit();
      sipGiveModalSubject.next(mockPlayer2);
      expect(modalSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from observables', () => {
      component.ngOnInit();
      const nextSpy = spyOn(component['ngUnsubscribe'], 'next');
      const completeSpy = spyOn(component['ngUnsubscribe'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('getSipCount', () => {
    it('should return sip count from playerSrv when player is provided', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(5);
      const result = component.getSipCount(mockPlayer);
      expect(mockPlayerHelperService.getSipCnt).toHaveBeenCalledWith(mockGameService.game, mockPlayer, false);
      expect(result).toBe(5);
    });

    it('should return sip count with absolute flag', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(10);
      const result = component.getSipCount(mockPlayer, true);
      expect(mockPlayerHelperService.getSipCnt).toHaveBeenCalledWith(mockGameService.game, mockPlayer, true);
      expect(result).toBe(10);
    });

    it('should return 0 when player is null', () => {
      const result = component.getSipCount(null as any);
      expect(result).toBe(0);
    });

    it('should return 0 when player is undefined', () => {
      const result = component.getSipCount(undefined as any);
      expect(result).toBe(0);
    });
  });

  describe('onpenPlayerGivenSipsSelectionModal', () => {
    it('should not open modal if player number is 1', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      mockGameService.isSummaryActivated.and.returnValue(true);
      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);
      // Should return early without attempting to open modal
      expect(mockPlayerHelperService.getTotalGivenSips).not.toHaveBeenCalled();
    });

    it('should not open modal if summary is not activated', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(false);
      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);
      // Should return early without attempting to open modal
      expect(mockPlayerHelperService.getTotalGivenSips).not.toHaveBeenCalled();
    });

    it('should check totalGivenSips when player number > 1 and summary activated', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(true);
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(5);
      mockPlayerHelperService.getSipCnt.and.returnValue(3);

      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);

      expect(mockPlayerHelperService.getTotalGivenSips).toHaveBeenCalledWith(mockPlayer);
    });

    it('should call openModal on PlayerGivenSipsSelectionComponent when conditions are met', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(true);
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(5);
      mockPlayerHelperService.getSipCnt.and.returnValue(3);

      const mockModalComponent = { openModal: jasmine.createSpy('openModal') };
      component.PlayerGivenSipsSelectionComponent = mockModalComponent as any;

      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);

      expect(mockModalComponent.openModal).toHaveBeenCalledWith(mockPlayer);
    });

    it('should not call openModal when sipCount is 0', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(true);
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(5);
      mockPlayerHelperService.getSipCnt.and.returnValue(0);

      const mockModalComponent = { openModal: jasmine.createSpy('openModal') };
      component.PlayerGivenSipsSelectionComponent = mockModalComponent as any;

      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);

      expect(mockModalComponent.openModal).not.toHaveBeenCalled();
    });

    it('should not call openModal when totalGivenSips is 0', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.isSummaryActivated.and.returnValue(true);
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(0);
      mockPlayerHelperService.getSipCnt.and.returnValue(3);

      const mockModalComponent = { openModal: jasmine.createSpy('openModal') };
      component.PlayerGivenSipsSelectionComponent = mockModalComponent as any;

      component.onpenPlayerGivenSipsSelectionModal(mockPlayer);

      expect(mockModalComponent.openModal).not.toHaveBeenCalled();
    });
  });

  describe('SafeUnsubscribe inheritance', () => {
    it('should have ngUnsubscribe subject', () => {
      expect(component['ngUnsubscribe']).toBeDefined();
    });
  });
});
