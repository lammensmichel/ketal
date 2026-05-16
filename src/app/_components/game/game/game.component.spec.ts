import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { GameComponent } from './game.component';
import { GameService } from '../../../services/game/game.service';
import { createMockGameService } from '../../../testing/test-helpers';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockGameService: any;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockGameService.isGameInProgress.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [GameComponent, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: GameService, useValue: mockGameService }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct selector', () => {
      const metadata = (GameComponent as any).ɵcmp;
      expect(metadata.selectors[0][0]).toBe('app-game');
    });

    it('should be a standalone component', () => {
      const metadata = (GameComponent as any).ɵcmp;
      expect(metadata.standalone).toBe(true);
    });
  });

  describe('Template Rendering', () => {
    it('should render app-main-game component', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const appMainGame = compiled.querySelector('app-main-game');

      expect(appMainGame).toBeTruthy();
    });
  });
});
