import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeComponent } from './home.component';
import { RoomService } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';
import { GameService } from '../../services/game/game.service';
import { createMockGameService } from '../../testing/test-helpers';
import { signal } from '@angular/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: jasmine.SpyObj<Router>;
  let roomService: jasmine.SpyObj<RoomService>;
  let authService: jasmine.SpyObj<AuthService>;
  let gameService: ReturnType<typeof createMockGameService>;

  beforeEach(waitForAsync(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    const roomServiceSpy = jasmine.createSpyObj('RoomService', ['createSoloRoom', 'getMyRooms'], {
      currentRoom: signal(null),
    });
    roomServiceSpy.createSoloRoom.and.returnValue(Promise.resolve({ $id: 'room1', name: 'Solo-123', code: 'ABC123' }));
    roomServiceSpy.getMyRooms.and.returnValue(Promise.resolve([]));

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['init'], {
      currentUser: signal({ name: 'Test User', email: 'test@test.com', $id: 'user1' }),
      isLoggedIn: signal(true),
      isAnonymous: signal(false),
      isLoading: signal(false),
    });

    const gameServiceSpy = createMockGameService();

    TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RoomService, useValue: roomServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: GameService, useValue: gameServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    gameService = TestBed.inject(GameService) as unknown as ReturnType<typeof createMockGameService>;

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display welcome header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('.welcome-header');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Bienvenue');
  });

  it('should have CTA buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const createBtn = compiled.querySelector('.create-btn');
    const joinLink = compiled.querySelector('.join-link');
    expect(createBtn).toBeTruthy();
    expect(joinLink).toBeTruthy();
  });

  it('should reset the game state BEFORE creating the room', fakeAsync(() => {
    // createSoloRoom() reutilise une room solo idle existante : sans remise a
    // zero, le statut restait celui de la partie precedente, isNewGame() etait
    // faux et la liste des joueurs devenait non editable.
    component.createGame();
    tick();

    expect(gameService.prepareNewGame).toHaveBeenCalled();
    expect(gameService.prepareNewGame).toHaveBeenCalledBefore(roomService.createSoloRoom);
  }));

  it('should call createGame and navigate to /players on success', fakeAsync(() => {
    component.createGame();
    tick();

    expect(roomService.createSoloRoom).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/players']);
    expect(component.isLoading()).toBe(false);
  }));

  it('should set error on createGame failure', async () => {
    roomService.createSoloRoom.and.returnValue(Promise.reject(new Error('Network error')));

    await component.createGame();

    expect(component.errorMsg()).toBe('home.errors.createFailed');
    expect(component.isLoading()).toBe(false);
  });

  it('should not allow double-click on createGame', fakeAsync(() => {
    // Simulate slow room creation
    let resolveRoom: (value: any) => void;
    roomService.createSoloRoom.and.returnValue(
      new Promise((resolve) => {
        resolveRoom = resolve;
      })
    );

    component.createGame();
    // Second call should be ignored
    component.createGame();

    expect(roomService.createSoloRoom).toHaveBeenCalledTimes(1);

    resolveRoom!({ $id: 'room1', name: 'Solo', code: 'ABC123' });
    tick();
  }));

  it('should not allow double-click when room creation is in progress', fakeAsync(() => {
    let resolveRoom: (value: any) => void;
    roomService.createSoloRoom.and.returnValue(
      new Promise((resolve) => {
        resolveRoom = resolve;
      })
    );

    component.createGame();
    // Second call should be ignored because createGame checks isCreatingRoom
    component.createGame();

    expect(roomService.createSoloRoom).toHaveBeenCalledTimes(1);

    resolveRoom!({ $id: 'room1', name: 'Solo', code: 'ABC123' });
    tick();
  }));

  it('should navigate to /room/join when joinGame is called', fakeAsync(() => {
    component.joinGame();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/room/join']);
  }));

  it('should compute userName from auth service', () => {
    expect(component.userName()).toBe('Test User');
  });
});
