import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal, computed } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd, RouterEvent } from '@angular/router';
import { HeaderComponent } from './header.component';
import { GameService } from '../../../services/game/game.service';
import { AppwriteService } from '../../../services/appwrite/appwrite.service';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../_helpers/language.helper';
import { Models } from 'appwrite';
import { Subject, of } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockAuthService: Partial<AuthService>;
  let routerEventsSubject: Subject<RouterEvent>;

  beforeEach(async () => {
    // Create a mock AuthService that provides the required signals
    const mockUserSignal = signal<Models.User<Models.Preferences> | null>(null);
    mockAuthService = {
      currentUser: mockUserSignal.asReadonly(),
      isLoggedIn: computed(() => mockUserSignal() !== null),
      isAnonymous: computed(() => false),
      isLoading: computed(() => false),
    };

    // Create router events subject
    routerEventsSubject = new Subject<RouterEvent>();
    const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
    // Set up router.events to return an observable with pipe support
    (mockRouter as any).events = of({ urlAfterRedirects: '/test', type: 1 } as any).pipe(
      filter((e: any) => e instanceof NavigationEnd),
      map((e: any) => e),
      startWith({ urlAfterRedirects: '/test', type: 1 } as any)
    );

    // Create mock GameService
    mockGameService = jasmine.createSpyObj('GameService', ['resetGame']);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: AuthService, useValue: mockAuthService },
        // AppwriteService - no methods to spy on, use a simple object
        { provide: AppwriteService, useValue: {} },
        { provide: Router, useValue: mockRouter },
        { provide: NavigationEnd, useValue: NavigationEnd },
        { provide: LanguageService, useValue: jasmine.createSpyObj('LanguageService', ['constructPossibleLanguages']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call openMenu on sideMenu when openSideMenu is called', () => {
    const mockSideMenu = { openMenu: jasmine.createSpy('openMenu') };
    component.sideMenu = mockSideMenu as never;
    component.openSideMenu();
    expect(mockSideMenu.openMenu).toHaveBeenCalled();
  });

  it('should not throw when sideMenu is not set', () => {
    expect(() => component.openSideMenu()).not.toThrow();
  });
});
