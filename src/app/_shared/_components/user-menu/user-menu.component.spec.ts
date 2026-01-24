import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserMenuComponent } from './user-menu.component';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../_helpers/language.helper';
import { Models } from 'appwrite';

/**
 * Creates a mock AuthService for testing
 */
function createMockAuthService(): jasmine.SpyObj<AuthService> & {
  currentUser: ReturnType<typeof signal<Models.User<Models.Preferences> | null>>;
  isLoggedIn: ReturnType<typeof signal<boolean>>;
  isAnonymous: ReturnType<typeof signal<boolean>>;
  isLoading: ReturnType<typeof signal<boolean>>;
} {
  const mockCurrentUser = signal<Models.User<Models.Preferences> | null>(null);
  const mockIsLoggedIn = signal(false);
  const mockIsAnonymous = signal(false);
  const mockIsLoading = signal(false);

  const mock = jasmine.createSpyObj('AuthService', ['logout', 'init', 'loginWithEmail', 'createAnonymousSession'], {
    currentUser: mockCurrentUser,
    isLoggedIn: mockIsLoggedIn,
    isAnonymous: mockIsAnonymous,
    isLoading: mockIsLoading,
  });

  mock.logout.and.returnValue(Promise.resolve());

  return mock;
}

describe('UserMenuComponent', () => {
  let component: UserMenuComponent;
  let fixture: ComponentFixture<UserMenuComponent>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let translateService: TranslateService;

  beforeEach(async () => {
    mockAuthService = createMockAuthService();
    mockLanguageService = jasmine.createSpyObj('LanguageService', ['constructPossibleLanguages']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockLanguageService.constructPossibleLanguages.and.returnValue([
      { name: 'Francais', shortName: 'fr' },
      { name: 'English', shortName: 'en' },
    ]);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), UserMenuComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    translateService.setDefaultLang('fr');
    translateService.use('fr');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize languages from languageService', () => {
      expect(mockLanguageService.constructPossibleLanguages).toHaveBeenCalled();
      expect(component.languages).toEqual([
        { name: 'Francais', shortName: 'fr' },
        { name: 'English', shortName: 'en' },
      ]);
    });

    it('should initialize selectedLanguage', () => {
      expect(component.selectedLanguage).toBeDefined();
    });

    it('should start with menu closed', () => {
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('toggleMenu', () => {
    it('should open the menu when closed', () => {
      expect(component.isOpen()).toBe(false);
      component.toggleMenu();
      expect(component.isOpen()).toBe(true);
    });

    it('should close the menu when open', () => {
      component.toggleMenu(); // Open
      expect(component.isOpen()).toBe(true);
      component.toggleMenu(); // Close
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('closeMenu', () => {
    it('should close the menu', () => {
      component.toggleMenu(); // Open
      expect(component.isOpen()).toBe(true);
      component.closeMenu();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('onLanguageChange', () => {
    it('should call translate.use() with selectedLanguage when set', () => {
      spyOn(translateService, 'use');
      component.selectedLanguage = 'en';
      component.onLanguageChange();
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should not call translate.use() when selectedLanguage is empty', () => {
      spyOn(translateService, 'use');
      component.selectedLanguage = '';
      component.onLanguageChange();
      expect(translateService.use).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call authService.logout()', fakeAsync(() => {
      component.logout();
      tick();
      expect(mockAuthService.logout).toHaveBeenCalled();
    }));

    it('should navigate to home after logout', fakeAsync(() => {
      component.logout();
      tick();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should close the menu', fakeAsync(() => {
      component.toggleMenu();
      expect(component.isOpen()).toBe(true);
      component.logout();
      tick();
      expect(component.isOpen()).toBe(false);
    }));
  });

  describe('navigateToLogin', () => {
    it('should navigate to /login', () => {
      component.navigateToLogin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should close the menu', () => {
      component.toggleMenu();
      expect(component.isOpen()).toBe(true);
      component.navigateToLogin();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('keyboard navigation', () => {
    it('should close menu on Escape key when open', () => {
      component.toggleMenu();
      expect(component.isOpen()).toBe(true);
      component.onEscapeKey();
      expect(component.isOpen()).toBe(false);
    });

    it('should not error on Escape key when menu is closed', () => {
      expect(component.isOpen()).toBe(false);
      expect(() => component.onEscapeKey()).not.toThrow();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('click outside', () => {
    it('should close menu when clicking outside', () => {
      component.toggleMenu();
      expect(component.isOpen()).toBe(true);

      // Create a mock event that is outside the element
      const outsideEvent = new MouseEvent('click');
      Object.defineProperty(outsideEvent, 'target', { value: document.body });

      component.onDocumentClick(outsideEvent);
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('displayName computed', () => {
    it('should return empty string when no user', () => {
      expect(component.displayName()).toBe('');
    });

    it('should return user name when available', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      expect(component.displayName()).toBe('John Doe');
    });

    it('should return email username when name is not set', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: '',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      expect(component.displayName()).toBe('john');
    });
  });

  describe('userInitials computed', () => {
    it('should return ? when no user', () => {
      expect(component.userInitials()).toBe('?');
    });

    it('should return ? for anonymous user', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: '',
        email: '',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      (mockAuthService.isAnonymous as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      expect(component.userInitials()).toBe('?');
    });

    it('should return first two letters of name for single name', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      expect(component.userInitials()).toBe('JO');
    });

    it('should return initials for full name', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      expect(component.userInitials()).toBe('JD');
    });
  });

  describe('template rendering', () => {
    it('should show login button when not logged in', () => {
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(false);
      fixture.detectChanges();

      const loginBtn = fixture.nativeElement.querySelector('.login-btn');
      expect(loginBtn).toBeTruthy();
    });

    it('should show user menu trigger when logged in', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('.user-menu-trigger');
      expect(trigger).toBeTruthy();
    });

    it('should show dropdown menu when opened and logged in', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      component.toggleMenu();
      fixture.detectChanges();

      const dropdownMenu = fixture.nativeElement.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeTruthy();
    });

    it('should have correct ARIA attributes on trigger button', () => {
      const mockUser = {
        $id: '123',
        $createdAt: '',
        $updatedAt: '',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        emailVerification: false,
        phoneVerification: false,
        mfa: false,
        prefs: {},
        targets: [],
        accessedAt: '',
        registration: '',
        status: true,
        labels: [],
        passwordUpdate: '',
        hash: '',
        hashOptions: {},
      } as Models.User<Models.Preferences>;

      (mockAuthService.currentUser as ReturnType<typeof signal<Models.User<Models.Preferences> | null>>).set(mockUser);
      (mockAuthService.isLoggedIn as ReturnType<typeof signal<boolean>>).set(true);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('.user-menu-trigger');
      expect(trigger.getAttribute('aria-haspopup')).toBe('true');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      component.toggleMenu();
      fixture.detectChanges();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
