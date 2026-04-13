import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth/auth.service';
import { GameService } from './services/game/game.service';
import { SoloRoomService } from './services/solo-room/solo-room.service';
import { PlayerHelperService } from './_shared/_helpers/player.helper';
import { HeaderComponent } from './_shared/_components/header/header.component';
import { FooterComponent } from './_shared/_components/footer/footer.component';
import { createMockAuthService, createMockSoloRoomService } from './testing/test-helpers';

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
    handleReconnection: jasmine.Spy;
    clearPersistedSummary: jasmine.Spy;
  };
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockSoloRoomService: ReturnType<typeof createMockSoloRoomService>;
  beforeEach(async () => {
    // Create writable signals for GameService mock
    const withSummaryModeSignal = signal<boolean>(false);
    const summarySignal = signal<boolean>(false);

    mockGameService = {
      withSummaryMode: withSummaryModeSignal,
      summary: summarySignal,
      isNewGame: jasmine.createSpy('isNewGame').and.returnValue(true),
      handleReconnection: jasmine.createSpy('handleReconnection').and.resolveTo(undefined),
      clearPersistedSummary: jasmine.createSpy('clearPersistedSummary'),
    };

    mockPlayerHelperService = jasmine.createSpyObj('PlayerHelperService', ['getPlayerNumber']);
    mockPlayerHelperService.getPlayerNumber.and.returnValue(0);
    mockAuthService = createMockAuthService();
    mockSoloRoomService = createMockSoloRoomService();

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: SoloRoomService, useValue: mockSoloRoomService },
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
      expect(component.authService).toBeTruthy();
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
    // The computed short-circuits to false for anonymous/logged-out users so a
    // summary flag inherited from a prior session can't leak into Partie rapide.
    // These tests cover the connected non-anonymous path; anonymous behavior is
    // covered separately below.
    beforeEach(() => {
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
    });

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

    it('should return false for anonymous users even with summary signals true', () => {
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(true);
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(true);
      mockGameService.summary.set(true);

      expect(component.withSummaryMode()).toBe(false);
    });

    it('should return false for logged-out users even with summary signals true', () => {
      mockAuthService.isLoggedIn.set(false);
      fixture.detectChanges();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(true);
      mockGameService.summary.set(true);

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

  describe('canShowSummary', () => {
    it('should return true when on players page, logged in, and not anonymous', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);

      expect(component.canShowSummary()).toBeTrue();
    });

    it('should return false when not on players page', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(false);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);

      expect(component.canShowSummary()).toBeFalse();
    });

    it('should return false when not logged in', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(false);
      mockAuthService.isAnonymous.set(false);

      expect(component.canShowSummary()).toBeFalse();
    });

    it('should return false when user is anonymous', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(true);

      expect(component.canShowSummary()).toBeFalse();
    });

    it('should return true regardless of player count (0 players)', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      expect(component.canShowSummary()).toBeTrue();
    });
  });

  describe('Summary toggle visibility', () => {
    it('should show summary toggle when canShowSummary returns true', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeTruthy();
    });

    it('should hide summary toggle when not on players page', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(false);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeFalsy();
    });

    it('should hide summary toggle when user is anonymous', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(true);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeFalsy();
    });

    it('should show summary toggle with 0 players for connected user', () => {
      spyOn(component, 'isPlayersPage').and.returnValue(true);
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);
      fixture.detectChanges();

      const toggle = fixture.nativeElement.querySelector('.summary-toggle');
      expect(toggle).toBeTruthy();
    });
  });

  describe('Signal reactivity', () => {
    beforeEach(() => {
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
    });

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
