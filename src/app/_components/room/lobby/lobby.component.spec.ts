import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LobbyComponent } from './lobby.component';
import { RoomService, GameRoom } from '../../../services/room/room.service';
import { MemberService, GameMember } from '../../../services/member/member.service';
import { RealtimeService } from '../../../services/realtime/realtime.service';
import { AuthService } from '../../../services/auth/auth.service';
import { GuestService } from '../../../services/guest/guest.service';
import { KetalSessionService } from '../../../services/ketal-session/ketal-session.service';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoomService: {
    currentRoom: ReturnType<typeof signal<GameRoom | null>>;
    getRoomById: jasmine.Spy;
    setCurrentRoom: jasmine.Spy;
    leaveRoom: jasmine.Spy;
  };
  let mockMemberService: {
    members: ReturnType<typeof signal<GameMember[]>>;
    currentMember: ReturnType<typeof signal<GameMember | null>>;
    getMembersByRoom: jasmine.Spy;
    getMemberByUserOrDevice: jasmine.Spy;
    setCurrentMember: jasmine.Spy;
    updateMember: jasmine.Spy;
    deleteMember: jasmine.Spy;
  };
  let mockRealtimeService: {
    isConnected: ReturnType<typeof signal<boolean>>;
    subscribeToMembers: jasmine.Spy;
    unsubscribe: jasmine.Spy;
  };
  let mockAuthService: {
    currentUser: ReturnType<typeof signal<{ $id: string } | null>>;
  };
  let mockGuestService: {
    getOrCreateDeviceId: jasmine.Spy;
  };
  let mockKetalSessionService: {
    startGame: jasmine.Spy;
  };

  const mockRoom: GameRoom = {
    $id: 'room123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: 'token-123',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'member-host',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 0,
  };

  const mockHostMember: GameMember = {
    $id: 'member-host',
    roomId: 'room123',
    userId: 'user-host',
    deviceId: null,
    displayName: 'Host Player',
    role: 'host',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  const mockPlayerMember: GameMember = {
    $id: 'member-player',
    roomId: 'room123',
    userId: 'user-player',
    deviceId: null,
    displayName: 'Player 2',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  function createComponent(routeParamId: string | null = 'room123', roomAlreadySet = false) {
    if (roomAlreadySet) {
      mockRoomService.currentRoom.set(mockRoom);
    }

    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap: {
            get: (key: string) => (key === 'id' ? routeParamId : null),
          },
        },
      },
    });

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.resolveTo(true);

    mockRoomService = {
      currentRoom: signal<GameRoom | null>(null),
      getRoomById: jasmine.createSpy('getRoomById').and.resolveTo(mockRoom),
      setCurrentRoom: jasmine.createSpy('setCurrentRoom'),
      leaveRoom: jasmine.createSpy('leaveRoom').and.resolveTo(),
    };

    mockMemberService = {
      members: signal<GameMember[]>([]),
      currentMember: signal<GameMember | null>(null),
      getMembersByRoom: jasmine.createSpy('getMembersByRoom').and.resolveTo([mockHostMember, mockPlayerMember]),
      getMemberByUserOrDevice: jasmine.createSpy('getMemberByUserOrDevice').and.resolveTo(mockHostMember),
      setCurrentMember: jasmine.createSpy('setCurrentMember'),
      updateMember: jasmine.createSpy('updateMember').and.resolveTo(mockHostMember),
      deleteMember: jasmine.createSpy('deleteMember').and.resolveTo(),
    };

    mockRealtimeService = {
      isConnected: signal<boolean>(false),
      subscribeToMembers: jasmine.createSpy('subscribeToMembers').and.returnValue('sub_123'),
      unsubscribe: jasmine.createSpy('unsubscribe'),
    };

    mockAuthService = {
      currentUser: signal<{ $id: string } | null>({ $id: 'user-host' }),
    };

    mockGuestService = {
      getOrCreateDeviceId: jasmine.createSpy('getOrCreateDeviceId').and.returnValue('device-123'),
    };

    mockKetalSessionService = {
      startGame: jasmine.createSpy('startGame').and.resolveTo({}),
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), LobbyComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'room123' } },
          },
        },
        { provide: RoomService, useValue: mockRoomService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GuestService, useValue: mockGuestService },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent('room123', true);
    expect(component).toBeTruthy();
  });

  describe('room restoration from route params', () => {
    it('should fetch room from route params when currentRoom is null', fakeAsync(() => {
      createComponent('room123');
      fixture.detectChanges();
      tick();

      expect(mockRoomService.getRoomById).toHaveBeenCalledWith('room123');
      expect(mockRoomService.setCurrentRoom).toHaveBeenCalledWith(mockRoom);
    }));

    it('should not fetch room when currentRoom is already set', fakeAsync(() => {
      createComponent('room123', true);
      fixture.detectChanges();
      tick();

      expect(mockRoomService.getRoomById).not.toHaveBeenCalled();
    }));

    it('should navigate to home when no route param id', fakeAsync(() => {
      createComponent(null);
      fixture.detectChanges();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should navigate to home when room not found', fakeAsync(() => {
      mockRoomService.getRoomById.and.resolveTo(null);
      createComponent('nonexistent');
      fixture.detectChanges();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }));
  });

  describe('member identity recovery', () => {
    it('should recover member identity after room restoration', fakeAsync(() => {
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });
      createComponent('room123');
      fixture.detectChanges();
      tick();

      expect(mockMemberService.getMemberByUserOrDevice).toHaveBeenCalledWith(
        'room123',
        'user-host',
        'device-123'
      );
      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(mockHostMember);
    }));

    it('should skip recovery when currentMember is already set', fakeAsync(() => {
      mockMemberService.currentMember.set(mockHostMember);
      createComponent('room123', true);
      fixture.detectChanges();
      tick();

      expect(mockMemberService.getMemberByUserOrDevice).not.toHaveBeenCalled();
    }));

    it('should redirect to join when no member found', fakeAsync(() => {
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });
      createComponent('room123');
      fixture.detectChanges();
      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room/join', 'ABC123']);
    }));

    it('should preserve host role after recovery', fakeAsync(() => {
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });
      createComponent('room123');
      fixture.detectChanges();
      tick();

      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(
        jasmine.objectContaining({ role: 'host' })
      );
    }));
  });

  describe('realtime subscription', () => {
    it('should subscribe to member updates after room is restored', fakeAsync(() => {
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });
      createComponent('room123');
      fixture.detectChanges();
      tick();

      expect(mockRealtimeService.subscribeToMembers).toHaveBeenCalledWith(
        'room123',
        jasmine.any(Function)
      );
    }));

    it('should unsubscribe on component destroy', fakeAsync(() => {
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });
      createComponent('room123');
      fixture.detectChanges();
      tick();

      fixture.destroy();

      expect(mockRealtimeService.unsubscribe).toHaveBeenCalledWith('sub_123');
    }));

    it('should reload members when realtime event is received', fakeAsync(() => {
      let capturedCallback: ((member: unknown) => void) | undefined;
      mockRealtimeService.subscribeToMembers.and.callFake(
        (_roomId: string, callback: (member: unknown) => void) => {
          capturedCallback = callback;
          return 'sub_123';
        }
      );
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });

      createComponent('room123');
      fixture.detectChanges();
      tick();

      // Reset call count after initial load
      mockMemberService.getMembersByRoom.calls.reset();

      // Simulate realtime event
      if (capturedCallback) {
        capturedCallback({ $id: 'new-member', roomId: 'room123' });
      }
      tick();

      expect(mockMemberService.getMembersByRoom).toHaveBeenCalledWith('room123');
    }));

    it('should retry subscription on failure', fakeAsync(() => {
      mockRealtimeService.subscribeToMembers.and.throwError('Connection failed');
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });

      createComponent('room123');
      fixture.detectChanges();
      tick();

      // First call throws, retry will be scheduled
      expect(mockRealtimeService.subscribeToMembers).toHaveBeenCalledTimes(1);

      // After retry delay (2000ms), it should retry
      mockRealtimeService.subscribeToMembers.and.returnValue('sub_retry');
      tick(2000);

      expect(mockRealtimeService.subscribeToMembers).toHaveBeenCalledTimes(2);
    }));
  });

  describe('connection status', () => {
    it('should expose isConnected from realtime service', () => {
      createComponent('room123', true);

      expect(component.isConnected()).toBe(false);

      mockRealtimeService.isConnected.set(true);
      expect(component.isConnected()).toBe(true);
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      createComponent('room123', true);
      mockMemberService.members.set([mockHostMember, mockPlayerMember]);
      mockMemberService.currentMember.set(mockHostMember);
    });

    it('should compute isHost correctly for host member', () => {
      expect(component.isHost()).toBe(true);
    });

    it('should compute isHost correctly for non-host member', () => {
      mockMemberService.currentMember.set(mockPlayerMember);
      expect(component.isHost()).toBe(false);
    });

    it('should compute playerCount excluding spectators', () => {
      const spectator: GameMember = {
        ...mockPlayerMember,
        $id: 'spectator-1',
        role: 'spectator',
      };
      mockMemberService.members.set([mockHostMember, mockPlayerMember, spectator]);

      expect(component.playerCount()).toBe(2);
    });

    it('should compute canStartGame when host and 2+ players', () => {
      expect(component.canStartGame()).toBe(true);
    });

    it('should not allow start game with fewer than 2 players', () => {
      mockMemberService.members.set([mockHostMember]);
      expect(component.canStartGame()).toBe(false);
    });

    it('should sort members: host first, then players, then spectators', () => {
      const spectator: GameMember = {
        ...mockPlayerMember,
        $id: 'spectator-1',
        displayName: 'Spectator',
        role: 'spectator',
      };
      mockMemberService.members.set([mockPlayerMember, spectator, mockHostMember]);

      const sorted = component.sortedMembers();
      expect(sorted[0].role).toBe('host');
      expect(sorted[1].role).toBe('player');
      expect(sorted[2].role).toBe('spectator');
    });
  });

  describe('role helpers', () => {
    beforeEach(() => {
      createComponent('room123', true);
    });

    it('should return correct role icons', () => {
      expect(component.getRoleIcon('host')).toBe('crown');
      expect(component.getRoleIcon('player')).toBe('gamepad');
      expect(component.getRoleIcon('spectator')).toBe('eye');
    });

    it('should return correct role label keys', () => {
      expect(component.getRoleLabel('host')).toBe('lobby.role.host');
      expect(component.getRoleLabel('player')).toBe('lobby.role.player');
      expect(component.getRoleLabel('spectator')).toBe('lobby.role.spectator');
    });
  });
});
