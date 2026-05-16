import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SideMenuComponent } from './side-menu.component';
import { GameService } from '../../../services/game/game.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AppwriteService } from '../../../services/appwrite/appwrite.service';
import { createMockGameService, createMockAuthService } from '../../../testing/test-helpers';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAppwriteService: { account: { deleteSession: jasmine.Spy } };
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

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), SideMenuComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
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
});
