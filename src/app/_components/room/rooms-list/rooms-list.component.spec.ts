import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

import { RoomsListComponent } from './rooms-list.component';
import { RoomService, GameRoomWithMemberCount, GameRoom } from '../../../services/room/room.service';
import { AuthService } from '../../../services/auth/auth.service';
import { MemberService, GameMember } from '../../../services/member/member.service';
import { GameService } from '../../../services/game/game.service';
import { AppwriteService } from '../../../services/appwrite/appwrite.service';
import { RealtimeService } from '../../../services/realtime/realtime.service';
import { LocalService } from '../../../services/local/local.service';
import { KetalSessionService } from '../../../services/ketal-session/ketal-session.service';

describe('RoomsListComponent', () => {
  let component: RoomsListComponent;
  let fixture: ComponentFixture<RoomsListComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoomService: {
    getMyRooms: jasmine.Spy;
  };
  let mockMemberService: {
    currentMember: ReturnType<typeof signal<GameMember | null>>;
    getMembersByRoom: jasmine.Spy;
    setCurrentMember: jasmine.Spy;
    updateMember: jasmine.Spy;
    deleteMember: jasmine.Spy;
  };

  const mockRoom1: GameRoomWithMemberCount = {
    $id: 'room1',
    name: 'Test Room 1',
    code: 'ABC123',
    inviteToken: 'token1',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'host1',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 0,
    archived: false,
    memberCount: 2,
    myRole: 'player',
    $updatedAt: '2024-01-03T12:00:00Z',
  };

  const mockRoom2: GameRoomWithMemberCount = {
    $id: 'room2',
    name: 'Test Room 2',
    code: 'XYZ789',
    inviteToken: 'token2',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'host2',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 1,
    archived: false,
    memberCount: 4,
    myRole: 'player',
    $updatedAt: '2024-01-02T12:00:00Z',
  };

  const mockArchivedRoom: GameRoomWithMemberCount = {
    $id: 'archived1',
    name: '[Archivé] Archived Room',
    code: 'DEF456',
    inviteToken: 'token3',
    currentGameId: null,
    currentSessionId: null,
    status: 'archived',
    hostMemberId: 'host3',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 5,
    archived: true,
    memberCount: 3,
    myRole: 'player',
    $updatedAt: '2024-01-01T12:00:00Z',
  };

  const mockMember: GameMember = {
    $id: 'member1',
    roomId: 'room1',
    userId: 'user1',
    deviceId: null,
    displayName: 'Test User',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.resolveTo(true);

    mockRoomService = {
      getMyRooms: jasmine.createSpy('getMyRooms'),
    };

    mockMemberService = {
      currentMember: signal<GameMember | null>(null),
      getMembersByRoom: jasmine.createSpy('getMembersByRoom'),
      setCurrentMember: jasmine.createSpy('setCurrentMember'),
      updateMember: jasmine.createSpy('updateMember'),
      deleteMember: jasmine.createSpy('deleteMember'),
    };

    // Create minimal mocks for services that AuthService depends on
    const mockAuthService = {
      currentUser: signal<{ $id: string } | null>({ $id: 'user1', email: 'test@test.com' } as any),
      isLoggedIn: signal(true),
      isAnonymous: signal(false),
    };

    const mockGameService = jasmine.createSpyObj('GameService', ['isGameStarted', 'isGameFinished', 'resetGame']);
    const mockAppwriteService = {};
    const mockRealtimeService = {};
    const mockLocalService = {};
    const mockKetalSessionService = {};

    await TestBed.configureTestingModule({
      imports: [RoomsListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: RoomService, useValue: mockRoomService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: GameService, useValue: mockGameService },
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: LocalService, useValue: mockLocalService },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
      ],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(RoomsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function loadAndDetect() {
    tick();
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('when rooms are loaded', () => {
    beforeEach(() => {
      mockRoomService.getMyRooms.and.resolveTo([mockRoom1, mockRoom2]);
    });

    it('should render rooms grid when rooms array is not empty', fakeAsync(() => {
      mockMemberService.currentMember.set(mockMember);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember]);
      createComponent();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const roomsGrid = compiled.querySelector('.rooms-grid');
      expect(roomsGrid).toBeTruthy();
    }));

    it('should show loading skeleton on initial load (before data resolves)', fakeAsync(() => {
      createComponent();
      // Loading state should be visible before tick() resolves the promise
      const compiled = fixture.nativeElement as HTMLElement;
      const skeleton = compiled.querySelector('.loading-skeleton');
      expect(skeleton).toBeTruthy();
      expect(skeleton?.querySelectorAll('.skeleton-card').length).toBe(4);
    }));

    it('should show empty state when rooms list is empty', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([]);
      createComponent();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      // Check for the empty state element
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      // Check for the empty state content
      const emptyContent = compiled.querySelector('.empty-state-content');
      expect(emptyContent).toBeTruthy();
      // No rooms grid should be present
      const roomsGrid = compiled.querySelector('.rooms-grid');
      expect(roomsGrid).toBeFalsy();
    }));

    it('should call roomService.getMyRooms() on init', fakeAsync(() => {
      mockMemberService.currentMember.set(mockMember);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember]);
      createComponent();
      tick();
      fixture.detectChanges();

      expect(mockRoomService.getMyRooms).toHaveBeenCalled();
    }));
  });

  describe('navigation on tile click', () => {
    beforeEach(() => {
      mockMemberService.currentMember.set(mockMember);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember]);
    });

    it('should navigate to /room/:id when clicking idle room tile', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([mockRoom1]);
      createComponent();
      tick();

      // Verify room data is loaded
      expect(component.rooms().length).toBe(1);
      expect(component.rooms()[0].$id).toBe('room1');

      // visibleRooms() filters out archived rooms
      expect(component.visibleRooms().length).toBe(1);
      expect(component.visibleRooms()[0].$id).toBe('room1');
    }));

    it('should not navigate when clicking archived room tile', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([mockArchivedRoom]);
      mockMemberService.currentMember.set(mockMember);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember]);
      createComponent();
      tick();
      fixture.detectChanges();

      // Verify that archived rooms are filtered from visibleRooms
      expect(component.visibleRooms().length).toBe(0);
    }));
  });

  describe('error handling', () => {
    it('should show loading and then error state on API failure', fakeAsync(() => {
      mockRoomService.getMyRooms.and.callFake(() => Promise.reject(new Error('API Error')));
      createComponent();
      tick();
      fixture.detectChanges();

      // Debug: Check what the component state is
      expect(component.error()).not.toBeNull();

      const compiled = fixture.nativeElement as HTMLElement;
      // Error should be displayed
      const errorAlert = compiled.querySelector('.alert-danger');
      expect(errorAlert).toBeTruthy('Error alert should be present');
      expect(errorAlert?.textContent).toContain('API Error');
      // Should NOT have rooms grid
      const roomsGrid = compiled.querySelector('.rooms-grid');
      expect(roomsGrid).toBeFalsy();
      // Empty state will also be shown because hasRooms() is false
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy('Empty state should also be shown when rooms is empty');
    }));

    it('should show retry message after error', fakeAsync(() => {
      mockRoomService.getMyRooms.and.callFake(() => Promise.reject(new Error('Connection failed')));
      createComponent();
      tick();

      // Verify error state
      expect(component.error()).not.toBeNull();
      expect(component.error()).toBe('Connection failed');
    }));
  });

  describe('room filtering', () => {
    it('should show visible rooms (non-archived)', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([mockRoom1, mockRoom2, mockArchivedRoom]);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember]);
      createComponent();
      tick();

      expect(component.rooms().length).toBe(3);
      expect(component.visibleRooms().length).toBe(2);
      expect(component.visibleRooms().every((r) => !r.archived)).toBeTrue();
    }));
  });

  describe('role helpers', () => {
    let component: RoomsListComponent;
    let fixture: ComponentFixture<RoomsListComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(RoomsListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    // Le role vient desormais de la room elle-meme (myRole, calcule par room dans
    // getMyRooms) et non de currentMember() : ce dernier renvoyait le role de la
    // derniere room rejointe pour TOUTES les tuiles.
    it('should return host role when the user is host of THAT room', () => {
      expect(component.getRoomRole({ ...mockRoom1, myRole: 'host' })).toBe('host');
    });

    it('should return player role when the user is player of that room', () => {
      expect(component.getRoomRole({ ...mockRoom1, myRole: 'player' })).toBe('player');
    });

    it('should map spectator to player', () => {
      expect(component.getRoomRole({ ...mockRoom1, myRole: 'spectator' })).toBe('player');
    });

    it('should not leak the role of another room', () => {
      // currentMember() est hote, mais cette room-ci a myRole player.
      mockMemberService.currentMember.set({ ...mockMember, role: 'host' } as GameMember);
      expect(component.getRoomRole({ ...mockRoom1, myRole: 'player' })).toBe('player');
    });
  });

  describe('hasRooms computed', () => {
    it('should return false when no rooms', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([]);
      createComponent();
      tick();

      expect(component.hasRooms()).toBeFalse();
    }));

    it('should return true when rooms exist', fakeAsync(() => {
      mockRoomService.getMyRooms.and.resolveTo([mockRoom1]);
      createComponent();
      tick();

      expect(component.hasRooms()).toBeTrue();
    }));
  });
});
