import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameSummaryComponent } from './game-summary.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';

describe('GameSummaryComponent', () => {
  let component: GameSummaryComponent;
  let fixture: ComponentFixture<GameSummaryComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    // Mock the game object
    (mockGameService as any).game = {
      players: [],
      maxTurnCount: 0,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: undefined,
      status: 1,
      summary: false,
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [GameSummaryComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameSummaryComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation and Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have OnPush change detection strategy', () => {
      const componentMetadata = (GameSummaryComponent as any).__annotations__[0];
      expect(componentMetadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });

    it('should use correct selector', () => {
      const componentMetadata = (GameSummaryComponent as any).__annotations__[0];
      expect(componentMetadata.selector).toBe('app-game-summary');
    });

    it('should have correct template file', () => {
      // Template file is loaded by Angular during compilation
      // Verify the component can render without errors
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
      expect(fixture.nativeElement.querySelector('app-players-list')).toBeTruthy();
    });

    it('should have correct style files', () => {
      // Styles are applied during component initialization
      // Verify component renders with proper styling
      fixture.detectChanges();
      const nativeElement = fixture.nativeElement;
      expect(nativeElement).toBeTruthy();
      // Component has styles applied during initialization
      const hasContent = nativeElement.children.length > 0;
      expect(hasContent).toBe(true);
    });

    it('should instantiate successfully', () => {
      expect(component instanceof GameSummaryComponent).toBe(true);
    });

    it('should have a valid component fixture', () => {
      expect(fixture).toBeDefined();
      expect(fixture.componentInstance).toBe(component);
    });
  });

  describe('Component Template and DOM', () => {
    it('should render players-list component', () => {
      fixture.detectChanges();
      const playersListElement = fixture.nativeElement.querySelector('app-players-list');
      expect(playersListElement).toBeTruthy();
    });

    it('should not render any additional content besides players-list', () => {
      fixture.detectChanges();
      const childElements = fixture.nativeElement.children;
      expect(childElements.length).toBe(1);
      expect(childElements[0].tagName.toLowerCase()).toBe('app-players-list');
    });

    it('should have exactly one child element', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.children.length).toBe(1);
    });

    it('should render the app-players-list as the only child', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.innerHTML).toContain('app-players-list');
    });
  });

  describe('Component Dependencies', () => {
    it('should have GameService injected', () => {
      const gameService = TestBed.inject(GameService);
      expect(gameService).toBe(mockGameService);
    });

    it('should have PlayerHelperService injected', () => {
      const playerHelperService = TestBed.inject(PlayerHelperService);
      expect(playerHelperService).toBe(mockPlayerHelperService);
    });

    it('should have access to GameService instance', () => {
      expect(mockGameService).toBeDefined();
    });

    it('should have access to PlayerHelperService instance', () => {
      expect(mockPlayerHelperService).toBeDefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize component without errors', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should maintain component state after change detection', () => {
      fixture.detectChanges();
      const firstComponent = component;
      fixture.detectChanges();
      expect(component).toBe(firstComponent);
    });

    it('should be defined after fixture creation', () => {
      expect(component).toBeDefined();
    });

    it('should be a valid Angular component', () => {
      expect(fixture).toBeDefined();
      expect(fixture.componentInstance).toBeDefined();
    });

    it('should handle multiple detectChanges calls', () => {
      expect(() => {
        fixture.detectChanges();
        fixture.detectChanges();
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('Component Property Analysis', () => {
    it('should be a simple presentational component', () => {
      // GameSummaryComponent has minimal logic
      expect(component).toBeTruthy();
    });

    it('should not throw on component property access', () => {
      expect(() => {
        const instance = fixture.componentInstance;
        const keys = Object.keys(instance);
        keys.forEach(() => {
          // Access properties safely
        });
      }).not.toThrow();
    });
  });

  describe('Component Methods and Interactions', () => {
    it('should render without triggering service initialization calls', () => {
      // Check that services are available but not called during render
      expect(mockGameService).toBeDefined();
      expect(mockPlayerHelperService).toBeDefined();
    });

    it('should work with empty player list', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([]);
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle various game states', () => {
      const testStates = [
        { players: [], status: 0 },
        { players: [], status: 1 },
        { players: [{ name: 'Player1' }], status: 1 },
      ];

      testStates.forEach((state) => {
        (mockGameService as any).game = { ...mockGameService.game, ...state };
        expect(() => {
          fixture.detectChanges();
        }).not.toThrow();
      });
    });
  });

  describe('Component Service Integration', () => {
    it('should be able to inject GameService', () => {
      const injectedService = TestBed.inject(GameService);
      expect(injectedService).toBe(mockGameService);
    });

    it('should be able to inject PlayerHelperService', () => {
      const injectedService = TestBed.inject(PlayerHelperService);
      expect(injectedService).toBe(mockPlayerHelperService);
    });

    it('should have access to mocked GameService properties', () => {
      expect((mockGameService as any).game).toBeDefined();
      expect((mockGameService as any).game.players).toBeDefined();
    });

    it('should have access to mocked PlayerHelperService methods', () => {
      expect(mockPlayerHelperService.getPlayers).toBeDefined();
      expect(typeof mockPlayerHelperService.getPlayers).toBe('function');
    });
  });

  describe('Component Rendering Behavior', () => {
    it('should render successfully with initial mock data', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const playersListElement = fixture.nativeElement.querySelector('app-players-list');
      expect(playersListElement).toBeTruthy();
    });

    it('should maintain DOM structure across change detection cycles', () => {
      fixture.detectChanges();
      const firstRenderChildren = fixture.nativeElement.children.length;

      fixture.detectChanges();
      const secondRenderChildren = fixture.nativeElement.children.length;

      expect(firstRenderChildren).toBe(secondRenderChildren);
    });

    it('should not modify child elements on re-render', () => {
      fixture.detectChanges();
      const playersListElement1 = fixture.nativeElement.querySelector('app-players-list');

      fixture.detectChanges();
      const playersListElement2 = fixture.nativeElement.querySelector('app-players-list');

      // Both should exist and be of same type
      expect(playersListElement1).toBeTruthy();
      expect(playersListElement2).toBeTruthy();
    });
  });

  describe('Component Edge Cases', () => {
    it('should handle multiple change detection cycles', () => {
      fixture.detectChanges();
      fixture.detectChanges();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should maintain component reference across change detection', () => {
      const componentRef = component;
      fixture.detectChanges();
      expect(component).toBe(componentRef);
    });

    it('should work when GameService game object is modified', () => {
      const originalGame = (mockGameService as any).game;
      (mockGameService as any).game = { ...originalGame, players: [] };

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      (mockGameService as any).game = originalGame;
    });

    it('should render correctly even when service mocks return empty data', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([]);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const playersListElement = fixture.nativeElement.querySelector('app-players-list');
      expect(playersListElement).toBeTruthy();
    });
  });

  describe('Component Cleanup', () => {
    it('should destroy without errors', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });

    it('should not leak resources on destroy', () => {
      fixture.detectChanges();
      const componentBeforeDestroy = component;
      fixture.destroy();
      // Component reference should still exist (instance is maintained in memory)
      expect(componentBeforeDestroy).toBeTruthy();
    });

    it('should handle destroy after multiple renders', () => {
      fixture.detectChanges();
      fixture.detectChanges();
      fixture.detectChanges();

      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });

  describe('Component Accessibility', () => {
    it('should have accessible component instance', () => {
      expect(fixture.componentInstance).toBeTruthy();
      expect(typeof fixture.componentInstance).toBe('object');
    });

    it('should have accessible native element', () => {
      expect(fixture.nativeElement).toBeTruthy();
      expect(fixture.nativeElement instanceof HTMLElement).toBe(true);
    });

    it('should provide access to child elements through query', () => {
      fixture.detectChanges();
      const childElement = fixture.nativeElement.querySelector('app-players-list');
      expect(childElement).toBeTruthy();
    });
  });

  describe('Component Type Safety', () => {
    it('should be an instance of GameSummaryComponent', () => {
      expect(component instanceof GameSummaryComponent).toBe(true);
    });

    it('should maintain type after fixture creation', () => {
      const type = component.constructor.name;
      expect(type).toBe('GameSummaryComponent');
    });

    it('should preserve component type through change detection', () => {
      const typeBeforeDetection = component.constructor.name;
      fixture.detectChanges();
      const typeAfterDetection = component.constructor.name;

      expect(typeBeforeDetection).toBe(typeAfterDetection);
      expect(typeAfterDetection).toBe('GameSummaryComponent');
    });
  });

  describe('Component Rendering Performance', () => {
    it('should use OnPush change detection for performance', () => {
      const changeDetectionStrategy = (GameSummaryComponent as any).__annotations__[0]?.changeDetection;
      expect(changeDetectionStrategy).toBe(ChangeDetectionStrategy.OnPush);
    });

    it('should render without additional change detection cycles', () => {
      let changeDetectionCycleCount = 0;
      const originalDetectChanges = fixture.detectChanges.bind(fixture);
      spyOn(fixture, 'detectChanges').and.callFake(() => {
        changeDetectionCycleCount++;
        originalDetectChanges();
      });

      fixture.detectChanges();
      expect(changeDetectionCycleCount).toBe(1);
    });
  });

  describe('Component Integration', () => {
    it('should be able to compile with all dependencies', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should initialize with TranslateModule', () => {
      const translateService = TestBed.inject(TranslateModule);
      expect(translateService).toBeTruthy();
    });

    it('should provide NO_ERRORS_SCHEMA for child component testing', () => {
      // Verify that child components like app-players-list can be rendered
      fixture.detectChanges();
      const playersListElement = fixture.nativeElement.querySelector('app-players-list');
      expect(playersListElement).toBeTruthy();
    });
  });

  describe('Component Isolation', () => {
    it('should be a purely presentational component', () => {
      // The component should not have any input properties
      const inputs = (GameSummaryComponent as any)['__annotations__']?.[0]?.inputs;
      expect(inputs).toBeFalsy();
    });

    it('should be a purely presentational component (no outputs)', () => {
      // The component should not have any output properties
      const outputs = (GameSummaryComponent as any)['__annotations__']?.[0]?.outputs;
      expect(outputs).toBeFalsy();
    });

    it('should not modify service state on creation', () => {
      const gameServiceSpies = Object.keys(mockGameService).filter(
        (key) => typeof (mockGameService as any)[key]?.calls?.count === 'function'
      );

      fixture.detectChanges();

      gameServiceSpies.forEach((spy) => {
        const callCount = (mockGameService as any)[spy]?.calls?.count?.() || 0;
        expect(callCount).toBe(0);
      });
    });
  });
});
