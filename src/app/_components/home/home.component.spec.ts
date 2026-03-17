import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeComponent } from './home.component';
import { RoomService } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';
import { SoloRoomService } from '../../services/solo-room/solo-room.service';
import { signal } from '@angular/core';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: jasmine.SpyObj<Router>;
  let roomService: jasmine.SpyObj<RoomService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    const roomServiceSpy = jasmine.createSpyObj('RoomService', ['createSoloRoom'], {
      currentRoom: signal(null),
    });
    roomServiceSpy.createSoloRoom.and.returnValue(
      Promise.resolve({ $id: 'room1', name: 'Solo-123', code: 'ABC123' })
    );

    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal({ name: 'Test User', email: 'test@test.com', $id: 'user1' }),
      isLoggedIn: signal(true),
      isAnonymous: signal(false),
      isLoading: signal(false),
    });

    const soloRoomServiceSpy = jasmine.createSpyObj('SoloRoomService', [
      'startBackgroundRoomCreation',
      'awaitRoom',
    ]);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: RoomService, useValue: roomServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SoloRoomService, useValue: soloRoomServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display branding', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.app-title');
    expect(title?.textContent).toContain('KETAL');
  });

  it('should have two CTA buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.btn-cta');
    expect(buttons.length).toBe(2);
  });

  it('should call createGame and navigate to /players on success', fakeAsync(() => {
    component.createGame();
    tick();

    expect(roomService.createSoloRoom).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/players']);
    expect(component.isCreating()).toBe(false);
  }));

  it('should set error on createGame failure', fakeAsync(() => {
    roomService.createSoloRoom.and.returnValue(Promise.reject(new Error('Network error')));

    component.createGame();
    tick();

    expect(component.error()).toBe('Network error');
    expect(component.isCreating()).toBe(false);
  }));

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

  it('should navigate to /room/join when joinGame is called', fakeAsync(() => {
    component.joinGame();
    tick();

    expect(router.navigate).toHaveBeenCalledWith(['/room/join']);
  }));

  it('should show loading spinner when creating', fakeAsync(() => {
    let resolveRoom: (value: any) => void;
    roomService.createSoloRoom.and.returnValue(
      new Promise((resolve) => {
        resolveRoom = resolve;
      })
    );

    component.createGame();
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinner).toBeTruthy();
    expect(component.isCreating()).toBe(true);

    resolveRoom!({ $id: 'room1', name: 'Solo', code: 'ABC123' });
    tick();
    fixture.detectChanges();

    const spinnerAfter = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinnerAfter).toBeFalsy();
  }));

  it('should compute userName from auth service', () => {
    expect(component.userName()).toBe('Test User');
  });
});
