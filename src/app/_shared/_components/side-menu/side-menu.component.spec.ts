import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SideMenuComponent } from './side-menu.component';
import { GameService } from '../../../services/game/game.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AppwriteService } from '../../../services/appwrite/appwrite.service';
import { DisplayModeService } from '../../../services/display-mode/display-mode.service';
import { MemberService } from '../../../services/member/member.service';
import { createMockGameService, createMockAuthService, createMockMemberService } from '../../../testing/test-helpers';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAppwriteService: { account: { deleteSession: jasmine.Spy } };
  let mockMemberService: ReturnType<typeof createMockMemberService>;
  let displayModeService: DisplayModeService;
  let routerEventsSubject: Subject<Event>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockAuthService = createMockAuthService();
    routerEventsSubject = new Subject<Event>();
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable(),
      url: '/',
    });
    mockAppwriteService = {
      account: {
        deleteSession: jasmine.createSpy('deleteSession').and.resolveTo({}),
      },
    };
    mockMemberService = createMockMemberService();
    localStorage.removeItem('ketal_display_mode');

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), SideMenuComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    displayModeService = TestBed.inject(DisplayModeService);
  });

  afterEach(() => {
    localStorage.removeItem('ketal_display_mode');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('menu open/close', () => {
    it('should open the menu', () => {
      component.openMenu();
      expect(component.isOpen()).toBeTrue();
    });

    it('should close the menu', () => {
      component.openMenu();
      component.closeMenu();
      expect(component.isOpen()).toBeFalse();
    });

    it('should toggle the menu', () => {
      component.toggleMenu();
      expect(component.isOpen()).toBeTrue();
      component.toggleMenu();
      expect(component.isOpen()).toBeFalse();
    });

    it('should close on escape key', () => {
      component.openMenu();
      component.onEscapeKey();
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('goToMenu', () => {
    it('should navigate to /players and close menu', () => {
      component.openMenu();
      component.goToMenu();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('quit confirmation', () => {
    it('should show quit confirmation dialog', () => {
      component.showQuitConfirmation();
      expect(component.showQuitConfirm()).toBeTrue();
    });

    it('should dismiss quit confirmation on cancel', () => {
      component.showQuitConfirmation();
      component.cancelQuit();
      expect(component.showQuitConfirm()).toBeFalse();
    });

    it('should reset game and navigate on confirm quit', () => {
      component.openMenu();
      component.showQuitConfirmation();
      component.confirmQuit();
      expect(component.showQuitConfirm()).toBeFalse();
      expect(component.isOpen()).toBeFalse();
      expect(mockGameService.resetGame).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
    });

    it('should dismiss quit dialog on escape before closing menu', () => {
      component.openMenu();
      component.showQuitConfirmation();
      component.onEscapeKey();
      expect(component.showQuitConfirm()).toBeFalse();
      expect(component.isOpen()).toBeTrue();
    });
  });

  describe('auth actions', () => {
    it('should navigate to login and close menu', () => {
      component.openMenu();
      component.navigateToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isOpen()).toBeFalse();
    });

    it('should logout and navigate to home', async () => {
      component.openMenu();
      await component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('guest menu actions', () => {
    it('should expose isAnonymous from AuthService', () => {
      expect(component.isAnonymous()).toBeFalse();
      mockAuthService.isAnonymous.set(true);
      expect(component.isAnonymous()).toBeTrue();
    });

    it('should delete anonymous session and navigate to login on connectToAccount', async () => {
      component.openMenu();
      await component.connectToAccount();
      expect(mockAppwriteService.account.deleteSession).toHaveBeenCalledWith(
        jasmine.objectContaining({ sessionId: 'current' })
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isOpen()).toBeFalse();
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should navigate to login even if deleteSession fails on connectToAccount', async () => {
      mockAppwriteService.account.deleteSession.and.rejectWith(new Error('Network error'));
      component.openMenu();
      await component.connectToAccount();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isOpen()).toBeFalse();
    });

    it('should call full logout and navigate to login on quitGame', async () => {
      component.openMenu();
      await component.quitGame();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('language change', () => {
    it('should have languages available', () => {
      expect(component.languages.length).toBeGreaterThan(0);
    });
  });
  // ── Selecteur de mode d'affichage ─────────────────────────────────────────
  describe('display mode selector', () => {
    function modeButtonLabels(): string[] {
      return Array.from(fixture.nativeElement.querySelectorAll('.side-menu-item[aria-pressed]')).map((btn) =>
        ((btn as HTMLElement).getAttribute('aria-pressed') ?? '').toString()
      );
    }

    it('should offer the three modes in room mode', () => {
      mockGameService.isRoomMode.set(true);
      component.openMenu();
      fixture.detectChanges();

      expect(modeButtonLabels().length).toBe(3);
    });

    it('should not offer any mode outside room mode', () => {
      mockGameService.isRoomMode.set(false);
      component.openMenu();
      fixture.detectChanges();

      expect(modeButtonLabels().length).toBe(0);
      expect(displayModeService.mode()).toBe('table');
    });

    it('should default to table', () => {
      mockGameService.isRoomMode.set(true);
      expect(displayModeService.mode()).toBe('table');
    });

    it('should persist the selected mode on this device', () => {
      mockGameService.isRoomMode.set(true);
      component.selectDisplayMode('personnel');
      TestBed.flushEffects();

      expect(displayModeService.mode()).toBe('personnel');
      expect(localStorage.getItem('ketal_display_mode')).toBe('personnel');
    });

    it('should keep the menu open so modes can be compared', () => {
      mockGameService.isRoomMode.set(true);
      component.openMenu();
      component.selectDisplayMode('viewer');

      expect(component.isOpen()).toBeTrue();
      expect(displayModeService.mode()).toBe('viewer');
    });

    it('should mark the active mode as pressed', () => {
      mockGameService.isRoomMode.set(true);
      component.selectDisplayMode('viewer');
      component.openMenu();
      fixture.detectChanges();

      expect(modeButtonLabels()).toEqual(['false', 'false', 'true']);
    });
  });
});
