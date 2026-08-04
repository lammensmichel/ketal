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
import { FriendService, FriendProfile } from '../../../services/friend/friend.service';

describe('LobbyComponent', () => {
  let component: LobbyComponent;
  let fixture: ComponentFixture<LobbyComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoomService: {
    currentRoom: ReturnType<typeof signal<GameRoom | null>>;
    getRoomById: jasmine.Spy;
    setCurrentRoom: jasmine.Spy;
    leaveRoom: jasmine.Spy;
    renameRoom: jasmine.Spy;
  };
  let mockMemberService: {
    members: ReturnType<typeof signal<GameMember[]>>;
    currentMember: ReturnType<typeof signal<GameMember | null>>;
    getMembersByRoom: jasmine.Spy;
    getMemberByUserOrDevice: jasmine.Spy;
    setCurrentMember: jasmine.Spy;
    updateMember: jasmine.Spy;
    deleteMember: jasmine.Spy;
    createMember: jasmine.Spy;
  };
  let mockFriendService: {
    friendProfiles: ReturnType<typeof signal<FriendProfile[]>>;
    getFriends: jasmine.Spy;
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
    currentSession: ReturnType<typeof signal<unknown>>;
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
    archived: false,
  };

  const mockHostMember: GameMember = {
    $id: 'member-host',
    roomId: 'room123',
    userId: 'user-host',
    deviceId: null,
    displayName: 'Host Player',
    role: 'host',
    isOnline: true,
    lastSeenAt: undefined,
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
    lastSeenAt: undefined,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  const mockFictionalMember: GameMember = {
    $id: 'member-fictional',
    roomId: 'room123',
    userId: null,
    deviceId: null,
    displayName: 'Tata Jeanne',
    role: 'player',
    isOnline: false,
    isFictional: true,
    lastSeenAt: undefined,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  const mockFriendProfile: FriendProfile = {
    userId: 'user-friend',
    name: 'Amie Camille',
    isFriend: true,
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
      renameRoom: jasmine.createSpy('renameRoom').and.resolveTo(mockRoom),
    };

    mockMemberService = {
      members: signal<GameMember[]>([]),
      currentMember: signal<GameMember | null>(null),
      getMembersByRoom: jasmine.createSpy('getMembersByRoom').and.resolveTo([mockHostMember, mockPlayerMember]),
      getMemberByUserOrDevice: jasmine.createSpy('getMemberByUserOrDevice').and.resolveTo(mockHostMember),
      setCurrentMember: jasmine.createSpy('setCurrentMember'),
      updateMember: jasmine.createSpy('updateMember').and.resolveTo(mockHostMember),
      deleteMember: jasmine.createSpy('deleteMember').and.resolveTo(),
      createMember: jasmine.createSpy('createMember').and.resolveTo(mockFictionalMember),
    };

    mockFriendService = {
      friendProfiles: signal<FriendProfile[]>([mockFriendProfile]),
      getFriends: jasmine.createSpy('getFriends').and.resolveTo([]),
    };

    mockRealtimeService = {
      isConnected: signal<boolean>(false),
      subscribeToMembers: jasmine.createSpy('subscribeToMembers').and.resolveTo('sub_123'),
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
      currentSession: signal<unknown>(null),
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
        { provide: FriendService, useValue: mockFriendService },
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

      expect(mockMemberService.getMemberByUserOrDevice).toHaveBeenCalledWith('room123', 'user-host', 'device-123');
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

      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(jasmine.objectContaining({ role: 'host' }));
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

      expect(mockRealtimeService.subscribeToMembers).toHaveBeenCalledWith('room123', jasmine.any(Function));
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
      mockRealtimeService.subscribeToMembers.and.callFake((_roomId: string, callback: (member: unknown) => void) => {
        capturedCallback = callback;
        return 'sub_123';
      });
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

  describe('story 15.6 UI', () => {
    it('applies glassmorphism class on the lobby card', () => {
      createComponent('room123', true);
      mockMemberService.members.set([mockHostMember, mockPlayerMember]);
      mockMemberService.currentMember.set(mockHostMember);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.lobby-card');
      expect(card).toBeTruthy();
    });

    it('builds the invite URL from the room code', () => {
      createComponent('room123', true);
      expect(component.inviteUrl()).toContain('/room/join/ABC123');
    });

    it('writes the room code to the clipboard and shows feedback', fakeAsync(() => {
      createComponent('room123', true);
      const writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextSpy },
      });

      component.copyRoomCode();
      tick();

      expect(writeTextSpy).toHaveBeenCalledWith('ABC123');
      expect(component.feedback()).toBe('lobby.codeCopied');
    }));

    it('maps room.status to the displayStatus signal', () => {
      createComponent('room123', true);
      expect(component.displayStatus()).toBe('waiting');

      mockRoomService.currentRoom.set({ ...mockRoom, status: 'playing' });
      expect(component.displayStatus()).toBe('playing');
    });

    it('flags newly-joined members so the slide-in animation only runs for them', fakeAsync(() => {
      let capturedCallback: ((member: unknown) => void) | undefined;
      mockRealtimeService.subscribeToMembers.and.callFake((_roomId: string, callback: (member: unknown) => void) => {
        capturedCallback = callback;
        return 'sub_123';
      });
      mockRoomService.setCurrentRoom.and.callFake((room: GameRoom) => {
        mockRoomService.currentRoom.set(room);
      });

      createComponent('room123');
      fixture.detectChanges();
      tick();

      // Initial load seeds known ids; no-one is marked newly-joined.
      expect(component.isNewlyJoined(mockPlayerMember.$id)).toBe(false);

      // A realtime event brings in a previously-unknown member. Payload-based detection marks the
      // id immediately; the subsequent reload just syncs the members list.
      mockMemberService.getMembersByRoom.and.callFake(() => {
        mockMemberService.members.set([mockHostMember, mockPlayerMember]);
        return Promise.resolve([mockHostMember, mockPlayerMember]);
      });
      capturedCallback?.({ $id: 'member-new', displayName: 'Newbie', roomId: 'room123' });
      tick();

      expect(component.isNewlyJoined('member-new')).toBe(true);
      expect(component.isNewlyJoined(mockPlayerMember.$id)).toBe(false);
      expect(component.joinedToast()).toBe('Newbie');
    }));
  });

  describe('room rename', () => {
    it('shows the rename action to the host only', () => {
      createComponent('room123', true);
      mockMemberService.members.set([mockHostMember, mockPlayerMember]);
      mockMemberService.currentMember.set(mockHostMember);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn-rename')).toBeTruthy();

      mockMemberService.currentMember.set(mockPlayerMember);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn-rename')).toBeNull();
    });

    it('pre-fills the draft with the current room name when opening the form', () => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockHostMember);

      component.startRename();

      expect(component.isRenaming()).toBe(true);
      expect(component.renameDraft()).toBe('Test Room');
    });

    it('does not open the form for a non-host member', () => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockPlayerMember);

      component.startRename();

      expect(component.isRenaming()).toBe(false);
    });

    it('calls renameRoom with the room id and the trimmed name', fakeAsync(() => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockHostMember);

      component.startRename();
      component.renameDraft.set('  Nouvelle Room  ');
      component.submitRename();
      tick();

      expect(mockRoomService.renameRoom).toHaveBeenCalledWith('room123', 'Nouvelle Room');
      expect(component.isRenaming()).toBe(false);
      expect(component.feedback()).toBe('lobby.renamed');
      tick(2000);
    }));

    it('rejects an empty name without calling the service', fakeAsync(() => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockHostMember);

      component.startRename();
      component.renameDraft.set('   ');
      component.submitRename();
      tick();

      expect(mockRoomService.renameRoom).not.toHaveBeenCalled();
      expect(component.feedback()).toBe('lobby.renameEmpty');
      expect(component.isRenaming()).toBe(true);
      tick(2000);
    }));

    it('ignores a submit from a non-host member', fakeAsync(() => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockPlayerMember);

      component.renameDraft.set('Hijack');
      component.submitRename();
      tick();

      expect(mockRoomService.renameRoom).not.toHaveBeenCalled();
    }));

    it('keeps the form open and reports an error when the rename fails', fakeAsync(() => {
      mockRoomService.renameRoom.and.rejectWith(new Error('network down'));
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockHostMember);

      component.startRename();
      component.renameDraft.set('Nouvelle Room');
      component.submitRename();
      tick();

      expect(component.feedback()).toBe('lobby.renameError');
      expect(component.isRenaming()).toBe(true);
      expect(component.isRenameSaving()).toBe(false);
      tick(2000);
    }));

    it('closes the form without a network call when the name is unchanged', fakeAsync(() => {
      createComponent('room123', true);
      mockMemberService.currentMember.set(mockHostMember);

      component.startRename();
      component.submitRename();
      tick();

      expect(mockRoomService.renameRoom).not.toHaveBeenCalled();
      expect(component.isRenaming()).toBe(false);
    }));
  });

  describe('adding a player without the app', () => {
    beforeEach(() => {
      createComponent('room123', true);
      mockMemberService.members.set([mockHostMember, mockPlayerMember]);
      mockMemberService.currentMember.set(mockHostMember);
    });

    it('shows both add actions to the host only', () => {
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn-add-player')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.btn-invite-friend')).toBeTruthy();

      mockMemberService.currentMember.set(mockPlayerMember);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.btn-add-player')).toBeNull();
      expect(fixture.nativeElement.querySelector('.btn-invite-friend')).toBeNull();
    });

    it('creates a fictional member with no account and no device', fakeAsync(() => {
      component.startAddPlayer();
      component.newPlayerDraft.set('  Tata Jeanne  ');
      component.submitAddPlayer();
      tick();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        jasmine.objectContaining({
          roomId: 'room123',
          userId: null,
          deviceId: null,
          displayName: 'Tata Jeanne',
          role: 'player',
          isOnline: false,
          isFictional: true,
        })
      );
      expect(component.isAddingPlayer()).toBe(false);
      expect(component.feedback()).toBe('lobby.playerAdded');
      tick(2000);
    }));

    it('rejects an empty name without any network call', fakeAsync(() => {
      component.startAddPlayer();
      component.newPlayerDraft.set('   ');
      component.submitAddPlayer();
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(component.feedback()).toBe('lobby.playerNameEmpty');
      expect(component.isAddingPlayer()).toBe(true);
      tick(2000);
    }));

    it('ignores a submit from a non-host member', fakeAsync(() => {
      mockMemberService.currentMember.set(mockPlayerMember);

      component.newPlayerDraft.set('Intrus');
      component.submitAddPlayer();
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
    }));

    it('refuses to go past maxPlayers', fakeAsync(() => {
      mockRoomService.currentRoom.set({ ...mockRoom, maxPlayers: 2 });

      component.startAddPlayer();

      expect(component.isAddingPlayer()).toBe(false);
      expect(component.feedback()).toBe('lobby.roomFull');

      component.newPlayerDraft.set('Trop tard');
      component.submitAddPlayer();
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      tick(2000);
    }));

    it('keeps the form open and reports an error when creation fails', fakeAsync(() => {
      mockMemberService.createMember.and.rejectWith(new Error('network down'));

      component.startAddPlayer();
      component.newPlayerDraft.set('Tata Jeanne');
      component.submitAddPlayer();
      tick();

      expect(component.feedback()).toBe('lobby.addPlayerError');
      expect(component.isAddingPlayer()).toBe(true);
      expect(component.isAddingMember()).toBe(false);
      tick(2000);
    }));

    it('renders a badge instead of the online indicator for a fictional player', () => {
      mockMemberService.members.set([mockHostMember, mockFictionalMember]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.member-card');
      const fictionalCard = Array.from(cards).find((card) =>
        (card as HTMLElement).textContent?.includes('Tata Jeanne')
      ) as HTMLElement;

      expect(fictionalCard.classList).toContain('is-fictional');
      expect(fictionalCard.querySelector('.member-fictional-badge')).toBeTruthy();
      expect(fictionalCard.querySelector('.member-status')).toBeNull();
      expect(fictionalCard.querySelector('.member-remove')).toBeTruthy();
    });

    it('removes a fictional player through the existing member deletion', fakeAsync(() => {
      mockMemberService.members.set([mockHostMember, mockFictionalMember]);

      component.removeFictionalMember(mockFictionalMember);
      tick();

      expect(mockMemberService.deleteMember).toHaveBeenCalledWith('member-fictional');
      expect(component.feedback()).toBe('lobby.playerRemoved');
      tick(2000);
    }));

    it('never removes a real member', fakeAsync(() => {
      component.removeFictionalMember(mockPlayerMember);
      tick();

      expect(mockMemberService.deleteMember).not.toHaveBeenCalled();
    }));
  });

  describe('inviting a friend', () => {
    beforeEach(() => {
      createComponent('room123', true);
      mockMemberService.members.set([mockHostMember, mockPlayerMember]);
      mockMemberService.currentMember.set(mockHostMember);
    });

    it('loads the friend list when the picker opens', fakeAsync(() => {
      component.toggleFriendPicker();
      tick();

      expect(component.showFriendPicker()).toBe(true);
      expect(mockFriendService.getFriends).toHaveBeenCalled();
    }));

    it('creates the member with the friend userId so their seat is reused on join', fakeAsync(() => {
      component.inviteFriend(mockFriendProfile);
      tick();

      expect(mockMemberService.createMember).toHaveBeenCalledWith(
        jasmine.objectContaining({
          roomId: 'room123',
          userId: 'user-friend',
          deviceId: null,
          displayName: 'Amie Camille',
          role: 'player',
          isFictional: false,
        })
      );
      expect(component.feedback()).toBe('lobby.friendInvited');
      tick(2000);
    }));

    it('refuses a friend who is already a member', fakeAsync(() => {
      mockMemberService.members.set([
        mockHostMember,
        { ...mockPlayerMember, userId: 'user-friend', displayName: 'Amie Camille' },
      ]);

      component.inviteFriend(mockFriendProfile);
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(component.feedback()).toBe('lobby.friendAlreadyMember');
      tick(2000);
    }));

    it('flags an existing member in the picker list', () => {
      mockMemberService.members.set([
        mockHostMember,
        { ...mockPlayerMember, userId: 'user-friend', displayName: 'Amie Camille' },
      ]);

      expect(component.invitableFriends()).toEqual([{ profile: mockFriendProfile, alreadyMember: true }]);
    });

    it('refuses to go past maxPlayers', fakeAsync(() => {
      mockRoomService.currentRoom.set({ ...mockRoom, maxPlayers: 2 });

      component.inviteFriend(mockFriendProfile);
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(component.feedback()).toBe('lobby.roomFull');
      tick(2000);
    }));

    it('ignores an invite from a non-host member', fakeAsync(() => {
      mockMemberService.currentMember.set(mockPlayerMember);

      component.inviteFriend(mockFriendProfile);
      tick();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
    }));

    it('reports an error and stays usable when the invite fails', fakeAsync(() => {
      mockMemberService.createMember.and.rejectWith(new Error('network down'));

      component.inviteFriend(mockFriendProfile);
      tick();

      expect(component.feedback()).toBe('lobby.inviteFriendError');
      expect(component.isAddingMember()).toBe(false);
      expect(component.invitingFriendId()).toBeNull();
      tick(2000);
    }));
  });
});
