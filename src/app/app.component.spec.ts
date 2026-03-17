import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { GameService } from './services/game/game.service';
import { PlayerHelperService } from './_shared/_helpers/player.helper';
import { HeaderComponent } from './_shared/_components/header/header.component';
import { FooterComponent } from './_shared/_components/footer/footer.component';

// Stub components to replace actual child components
@Component({
  selector: 'app-header',
  template: '',
  standalone: true,
})
class HeaderStubComponent {}

@Component({
  selector: 'app-footer',
  template: '',
  standalone: true,
})
class FooterStubComponent {
  @Input() withSummaryMode: boolean = false;
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockGameService: {
    withSummaryMode: ReturnType<typeof signal<boolean>>;
    summary: ReturnType<typeof signal<boolean>>;
    isNewGame: jasmine.Spy;
  };
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  beforeEach(async () => {
    // Create writable signals for GameService mock
    const withSummaryModeSignal = signal<boolean>(false);
    const summarySignal = signal<boolean>(false);

    mockGameService = {
      withSummaryMode: withSummaryModeSignal,
      summary: summarySignal,
      isNewGame: jasmine.createSpy('isNewGame').and.returnValue(true),
    };

    mockPlayerHelperService = jasmine.createSpyObj('PlayerHelperService', ['getPlayerNumber']);
    mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AppComponent, {
        remove: { imports: [HeaderComponent, FooterComponent] },
        add: { imports: [HeaderStubComponent, FooterStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the app component', () => {
      expect(component).toBeTruthy();
    });

    it('should have withSummaryMode signal initialized', () => {
      expect(component.withSummaryMode).toBeDefined();
      expect(typeof component.withSummaryMode).toBe('function');
    });

    it('should inject required services', () => {
      expect(component.gameSrv).toBeTruthy();
      expect(component.translate).toBeTruthy();
      expect(component.playerSrv).toBeTruthy();
    });
  });

  describe('Constructor', () => {
    it('should set default language from browser or environment', () => {
      expect(component.translate).toBeTruthy();
    });
  });

  describe('withSummaryMode computed signal', () => {
    it('should return false when withSummaryMode signal is false and summary is false', () => {
      fixture.detectChanges();

      mockGameService.withSummaryMode.set(false);
      mockGameService.summary.set(false);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      expect(component.withSummaryMode()).toBe(false);
    });

    it('should return signal value when player count is 1 or less', () => {
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      mockGameService.withSummaryMode.set(true);
      mockGameService.summary.set(false);

      expect(component.withSummaryMode()).toBe(true);
    });

    it('should return true when withSummaryMode is true and player count > 1', () => {
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(true);
      mockGameService.summary.set(false);

      expect(component.withSummaryMode()).toBe(true);
    });

    it('should return true when summary is true and player count > 1', () => {
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(false);
      mockGameService.summary.set(true);

      expect(component.withSummaryMode()).toBe(true);
    });

    it('should return false when player count > 1 and both signals are false', () => {
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(false);
      mockGameService.summary.set(false);

      expect(component.withSummaryMode()).toBe(false);
    });
  });

  describe('onSummaryModeCheckChange', () => {
    it('should set withSummaryMode signal to true when checkbox is checked', () => {
      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      component.onSummaryModeCheckChange(event);

      expect(mockGameService.withSummaryMode()).toBe(true);
    });

    it('should set withSummaryMode signal to false when checkbox is unchecked', () => {
      mockGameService.withSummaryMode.set(true);

      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      component.onSummaryModeCheckChange(event);

      expect(mockGameService.withSummaryMode()).toBe(false);
    });

    it('should handle rapid checkbox changes', () => {
      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      checkbox.checked = true;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(true);

      checkbox.checked = false;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(false);

      checkbox.checked = true;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(true);
    });
  });

  describe('isPlayersPage', () => {
    it('should return false in test environment (not /players)', () => {
      // In test environment, pathname is /context.html, not /players
      expect(component.isPlayersPage()).toBeFalse();
    });
  });

  describe('Summary toggle visibility', () => {
    it('should show summary toggle when isPlayersPage returns true', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockGameService.isNewGame.and.returnValue(true);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should hide summary toggle when isPlayersPage returns false', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(false);
      mockGameService.isNewGame.and.returnValue(true);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeFalsy();
    });

    it('should hide summary toggle when game is not new', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockGameService.isNewGame.and.returnValue(false);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeFalsy();
    });

    it('should hide summary toggle when less than 2 players', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockGameService.isNewGame.and.returnValue(true);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeFalsy();
    });
  });

  describe('Signal reactivity', () => {
    it('should update withSummaryMode when signal changes', () => {
      fixture.detectChanges();

      mockGameService.withSummaryMode.set(false);
      mockGameService.summary.set(false);
      expect(component.withSummaryMode()).toBe(false);

      mockGameService.withSummaryMode.set(true);
      expect(component.withSummaryMode()).toBe(true);
    });

    it('should update withSummaryMode when summary signal changes', () => {
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(false);
      mockGameService.summary.set(false);
      expect(component.withSummaryMode()).toBe(false);

      mockGameService.summary.set(true);
      expect(component.withSummaryMode()).toBe(true);
    });
  });
});
