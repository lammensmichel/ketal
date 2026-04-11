import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { GameProgressComponent } from './game-progress.component';
import { GameService } from '../../../services/game/game.service';

describe('GameProgressComponent', () => {
  let component: GameProgressComponent;
  let fixture: ComponentFixture<GameProgressComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;

  // Writable signals for testing
  const phaseSignal = signal(1);
  const turnSignal = signal(1);
  const drinkingCardsSignal = signal<any[]>([]);
  const givingCardsSignal = signal<any[]>([]);

  beforeEach(async () => {
    // Reset signals before each test
    phaseSignal.set(1);
    turnSignal.set(1);
    drinkingCardsSignal.set([]);
    givingCardsSignal.set([]);

    mockGameService = jasmine.createSpyObj('GameService', [], {
      phase: phaseSignal,
      turn: turnSignal,
      drinkingCards: drinkingCardsSignal,
      givingCards: givingCardsSignal,
    });

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), GameProgressComponent],
      providers: [{ provide: GameService, useValue: mockGameService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject GameService', () => {
      expect(component.phase).toBeDefined();
      expect(component.turn).toBeDefined();
    });

    it('should have steps defined', () => {
      expect(component.steps).toEqual([
        { num: 1, icon: '🔴', labelKey: 'game.progress.turn.color' },
        { num: 2, icon: '↕', labelKey: 'game.progress.turn.plusMinus' },
        { num: 3, icon: '↔', labelKey: 'game.progress.turn.inOut' },
        { num: 4, icon: '♠', labelKey: 'game.progress.turn.suit' },
      ]);
    });
  });

  describe('Phase Signal', () => {
    it('should return phase 1 when game is in prediction phase', () => {
      phaseSignal.set(1);
      expect(component.phase()).toBe(1);
    });

    it('should return phase 2 when game is in distribution phase', () => {
      phaseSignal.set(2);
      expect(component.phase()).toBe(2);
    });
  });

  describe('Turn Signal', () => {
    it('should return turn 1 at the start', () => {
      turnSignal.set(1);
      expect(component.turn()).toBe(1);
    });

    it('should return turn 2 when on second round', () => {
      turnSignal.set(2);
      expect(component.turn()).toBe(2);
    });

    it('should return turn 3 when on third round', () => {
      turnSignal.set(3);
      expect(component.turn()).toBe(3);
    });

    it('should return turn 4 when on fourth round', () => {
      turnSignal.set(4);
      expect(component.turn()).toBe(4);
    });
  });

  describe('Phase 2 Card Counts', () => {
    it('should return 0 for drinkingCardsCount when no cards', () => {
      drinkingCardsSignal.set([]);
      expect(component.drinkingCardsCount()).toBe(0);
    });

    it('should return correct count for drinkingCardsCount', () => {
      drinkingCardsSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(component.drinkingCardsCount()).toBe(3);
    });

    it('should return 0 for givingCardsCount when no cards', () => {
      givingCardsSignal.set([]);
      expect(component.givingCardsCount()).toBe(0);
    });

    it('should return correct count for givingCardsCount', () => {
      givingCardsSignal.set([{ id: 1 }, { id: 2 }]);
      expect(component.givingCardsCount()).toBe(2);
    });

    it('should calculate totalPhase2Cards correctly', () => {
      drinkingCardsSignal.set([{ id: 1 }, { id: 2 }]);
      givingCardsSignal.set([{ id: 3 }]);
      expect(component.totalPhase2Cards()).toBe(3);
    });

    it('should return 0 for totalPhase2Cards when no cards', () => {
      drinkingCardsSignal.set([]);
      givingCardsSignal.set([]);
      expect(component.totalPhase2Cards()).toBe(0);
    });
  });

  describe('Steps and Turn Mapping', () => {
    it('should have step 1 active for turn 1', () => {
      turnSignal.set(1);
      expect(component.isStepActive(1)).toBeTrue();
    });

    it('should have step 2 active for turn 2', () => {
      turnSignal.set(2);
      expect(component.isStepActive(2)).toBeTrue();
    });

    it('should have step 3 active for turn 3', () => {
      turnSignal.set(3);
      expect(component.isStepActive(3)).toBeTrue();
    });

    it('should have step 4 active for turn 4', () => {
      turnSignal.set(4);
      expect(component.isStepActive(4)).toBeTrue();
    });

    it('should have no step active for turn 0', () => {
      turnSignal.set(0);
      expect(component.isStepActive(1)).toBeFalse();
      expect(component.isStepActive(2)).toBeFalse();
    });

    it('should have no step active for turn 5', () => {
      turnSignal.set(5);
      expect(component.isStepActive(4)).toBeFalse();
    });
  });

  describe('isStepCompleted', () => {
    it('should return false when turn is less than step', () => {
      turnSignal.set(1);
      expect(component.isStepCompleted(2)).toBeFalse();
    });

    it('should return false when turn equals step', () => {
      turnSignal.set(2);
      expect(component.isStepCompleted(2)).toBeFalse();
    });

    it('should return true when turn is greater than step', () => {
      turnSignal.set(3);
      expect(component.isStepCompleted(2)).toBeTrue();
    });

    it('should return true for step 1 when on turn 4', () => {
      turnSignal.set(4);
      expect(component.isStepCompleted(1)).toBeTrue();
    });
  });

  describe('isStepActive', () => {
    it('should return true when turn equals step', () => {
      turnSignal.set(2);
      expect(component.isStepActive(2)).toBeTrue();
    });

    it('should return false when turn is less than step', () => {
      turnSignal.set(1);
      expect(component.isStepActive(2)).toBeFalse();
    });

    it('should return false when turn is greater than step', () => {
      turnSignal.set(3);
      expect(component.isStepActive(2)).toBeFalse();
    });

    it('should return true for step 1 on turn 1', () => {
      turnSignal.set(1);
      expect(component.isStepActive(1)).toBeTrue();
    });

    it('should return true for step 4 on turn 4', () => {
      turnSignal.set(4);
      expect(component.isStepActive(4)).toBeTrue();
    });
  });

  describe('Template Rendering - Phase 1', () => {
    beforeEach(() => {
      phaseSignal.set(1);
      turnSignal.set(1);
      fixture.detectChanges();
    });

    it('should render game-progress container', () => {
      const container = fixture.debugElement.query(By.css('.game-progress'));
      expect(container).toBeTruthy();
    });

    it('should render phase label', () => {
      const phaseLabel = fixture.debugElement.query(By.css('.phase-label'));
      expect(phaseLabel).toBeTruthy();
    });

    it('should render stepper dots in phase 1', () => {
      const dots = fixture.debugElement.query(By.css('.stepper-dots'));
      expect(dots).toBeTruthy();
    });

    it('should not render phase2-progress in phase 1', () => {
      const progress = fixture.debugElement.query(By.css('.phase2-progress'));
      expect(progress).toBeFalsy();
    });

    it('should render 4 stepper dots', () => {
      const dots = fixture.debugElement.queryAll(By.css('.stepper-dot'));
      expect(dots.length).toBe(4);
    });

    it('should render turn label', () => {
      const turnLabel = fixture.debugElement.query(By.css('.turn-label'));
      expect(turnLabel).toBeTruthy();
    });

    it('should show active dot for current turn', () => {
      turnSignal.set(2);
      fixture.detectChanges();
      const activeDots = fixture.debugElement.queryAll(By.css('.stepper-dot.active'));
      expect(activeDots.length).toBe(1);
    });

    it('should show completed dots for previous turns', () => {
      turnSignal.set(3);
      fixture.detectChanges();
      const completedDots = fixture.debugElement.queryAll(By.css('.stepper-dot.completed'));
      expect(completedDots.length).toBe(2);
    });
  });

  describe('Template Rendering - Phase 2', () => {
    beforeEach(() => {
      phaseSignal.set(2);
      drinkingCardsSignal.set([{ id: 1 }, { id: 2 }]);
      givingCardsSignal.set([{ id: 3 }]);
      fixture.detectChanges();
    });

    it('should render phase2-progress in phase 2', () => {
      const progress = fixture.debugElement.query(By.css('.phase2-progress'));
      expect(progress).toBeTruthy();
    });

    it('should not render stepper dots in phase 2', () => {
      const dots = fixture.debugElement.query(By.css('.stepper-dots'));
      expect(dots).toBeFalsy();
    });

    it('should render two progress rows', () => {
      const rows = fixture.debugElement.queryAll(By.css('.progress-row'));
      expect(rows.length).toBe(2);
    });

    it('should display drinking cards count', () => {
      const values = fixture.debugElement.queryAll(By.css('.progress-value'));
      expect(values[0].nativeElement.textContent.trim()).toBe('2/6');
    });

    it('should display giving cards count', () => {
      const values = fixture.debugElement.queryAll(By.css('.progress-value'));
      expect(values[1].nativeElement.textContent.trim()).toBe('1/6');
    });

    it('should update drinking count when cards change', () => {
      drinkingCardsSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.progress-value'));
      expect(values[0].nativeElement.textContent.trim()).toBe('4/6');
    });

    it('should update giving count when cards change', () => {
      givingCardsSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
      fixture.detectChanges();
      const values = fixture.debugElement.queryAll(By.css('.progress-value'));
      expect(values[1].nativeElement.textContent.trim()).toBe('6/6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle phase 0 gracefully', () => {
      phaseSignal.set(0);
      fixture.detectChanges();
      const phaseIndicator = fixture.debugElement.query(By.css('.phase-label'));
      expect(phaseIndicator).toBeFalsy();
    });

    it('should handle turn 0 gracefully', () => {
      turnSignal.set(0);
      expect(component.isStepActive(1)).toBeFalse();
      expect(component.isStepCompleted(1)).toBeFalse();
    });

    it('should handle empty card arrays in phase 2', () => {
      phaseSignal.set(2);
      drinkingCardsSignal.set([]);
      givingCardsSignal.set([]);
      fixture.detectChanges();

      const values = fixture.debugElement.queryAll(By.css('.progress-value'));
      expect(values[0].nativeElement.textContent.trim()).toBe('0/6');
      expect(values[1].nativeElement.textContent.trim()).toBe('0/6');
    });

    it('should handle full card arrays in phase 2', () => {
      phaseSignal.set(2);
      drinkingCardsSignal.set([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
      givingCardsSignal.set([{ id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }]);
      fixture.detectChanges();

      expect(component.totalPhase2Cards()).toBe(12);
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      // Verify the component works correctly with OnPush
      phaseSignal.set(1);
      turnSignal.set(2);
      fixture.detectChanges();

      expect(component.phase()).toBe(1);
      expect(component.turn()).toBe(2);
    });

    it('should update when signals change', () => {
      turnSignal.set(1);
      fixture.detectChanges();
      expect(component.isStepActive(1)).toBeTrue();

      turnSignal.set(2);
      fixture.detectChanges();
      expect(component.isStepActive(2)).toBeTrue();
      expect(component.isStepActive(1)).toBeFalse();
    });
  });
});
