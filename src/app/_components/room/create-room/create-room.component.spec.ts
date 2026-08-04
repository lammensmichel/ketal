import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameRoom } from '../../../services/room/room.service';
import { GameMember } from '../../../services/member/member.service';
import { Models } from 'appwrite';

import { CreateRoomComponent } from './create-room.component';
import { RoomService } from '../../../services/room/room.service';
import { MemberService } from '../../../services/member/member.service';
import { AuthService } from '../../../services/auth/auth.service';
import { FriendService, FriendProfile } from '../../../services/friend/friend.service';
import { createMockRoomService, createMockMemberService, createMockAuthService } from '../../../testing/test-helpers';

describe('CreateRoomComponent', () => {
  let component: CreateRoomComponent;
  let fixture: ComponentFixture<CreateRoomComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoomService: jasmine.SpyObj<RoomService>;
  let mockMemberService: jasmine.SpyObj<MemberService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockFriendService: {
    friendProfiles: WritableSignal<FriendProfile[]>;
    getFriends: jasmine.Spy;
  };

  const mockRoom: GameRoom = {
    $id: 'room123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: 'token-123',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: '',
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

  const mockFriendProfile: FriendProfile = {
    userId: 'user-friend',
    name: 'Amie Camille',
    isFriend: true,
  };

  const mockOtherFriendProfile: FriendProfile = {
    userId: 'user-friend-2',
    name: 'Ami Bob',
    isFriend: true,
  };

  const mockAuthenticatedUser: Models.User<Models.Preferences> = {
    $id: 'user-host',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z',
    name: 'Test User',
    email: 'test@example.com',
    phone: '',
    prefs: {},
    status: true,
    labels: [],
    emailVerification: true,
    phoneVerification: false,
    mfa: false,
    accessedAt: '2024-01-01T00:00:00.000Z',
    targets: [],
    registration: '2024-01-01T00:00:00.000Z',
    passwordUpdate: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.resolveTo(true);

    mockRoomService = createMockRoomService() as jasmine.SpyObj<RoomService>;
    mockRoomService.createRoom.and.resolveTo(mockRoom);

    mockMemberService = createMockMemberService() as jasmine.SpyObj<MemberService>;
    mockMemberService.getMemberByUserOrDevice = jasmine.createSpy('getMemberByUserOrDevice').and.resolveTo(null);
    mockMemberService.createMember.and.resolveTo(mockHostMember);
    mockMemberService.setCurrentMember = jasmine.createSpy('setCurrentMember');

    const mockCurrentUser = signal<Models.User<Models.Preferences> | null>(mockAuthenticatedUser);
    mockAuthService = createMockAuthService() as jasmine.SpyObj<AuthService>;
    (mockAuthService as any).currentUser = mockCurrentUser;
    (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);

    mockFriendService = {
      friendProfiles: signal<FriendProfile[]>([mockFriendProfile, mockOtherFriendProfile]),
      getFriends: jasmine.createSpy('getFriends').and.resolveTo([]),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, CreateRoomComponent, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: RoomService, useValue: mockRoomService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: FriendService, useValue: mockFriendService },
      ],
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(CreateRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should have required room name field', () => {
      createComponent();
      const control = component.createRoomForm.controls.roomName;
      expect(control.hasError('required')).toBeTrue();
    });

    it('should require minimum 3 characters for room name', () => {
      createComponent();
      const control = component.createRoomForm.controls.roomName;
      control.setValue('ab');
      expect(control.hasError('minlength')).toBeTrue();
    });

    it('should be valid with 3+ characters', () => {
      createComponent();
      const control = component.createRoomForm.controls.roomName;
      control.setValue('abc');
      expect(control.valid).toBeTrue();
    });

    it('should mark field as touched on submit attempt', () => {
      createComponent();
      const control = component.createRoomForm.controls.roomName;
      control.setValue('');
      component.onSubmit();
      expect(control.touched).toBeTrue();
    });
  });

  describe('onSubmit - room creation', () => {
    it('should call roomService.createRoom with form value', async () => {
      createComponent();
      component.createRoomForm.controls.roomName.setValue('My Room');
      component.onSubmit();

      await fixture.whenStable();
      expect(mockRoomService.createRoom).toHaveBeenCalledWith('My Room');
    });

    it('should set createdRoom with the returned room', async () => {
      createComponent();
      component.createRoomForm.controls.roomName.setValue('My Room');
      component.onSubmit();

      await fixture.whenStable();
      expect(component.createdRoom()).toBe(mockRoom);
    });

    it('should not set createdRoom if form is invalid', async () => {
      createComponent();
      component.createRoomForm.controls.roomName.setValue('');
      component.onSubmit();

      await fixture.whenStable();
      expect(component.createdRoom()).toBeNull();
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });
  });

  describe('enterRoom - solo reuse logic', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CreateRoomComponent);
      component = fixture.componentInstance;
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();
    });

    it('should get member by user for authenticated users', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      await component.enterRoom();

      expect(mockMemberService.getMemberByUserOrDevice).toHaveBeenCalledWith('room123', 'user-host');
    });

    it('should NOT create member if member already exists (idempotent)', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(mockHostMember);

      await component.enterRoom();

      expect(mockMemberService.createMember).not.toHaveBeenCalled();
      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(mockHostMember);
    });

    it('should create host member when no member exists', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      await component.enterRoom();

      expect(mockMemberService.createMember).toHaveBeenCalled();
      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(mockHostMember);
    });

    it('should set host member as current member', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      await component.enterRoom();

      expect(mockMemberService.setCurrentMember).toHaveBeenCalledWith(mockHostMember);
    });

    it('should update room with hostMemberId if not set', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      mockRoomService.updateRoom.and.resolveTo(undefined);

      await component.enterRoom();

      expect(mockRoomService.updateRoom).toHaveBeenCalledWith('room123', { hostMemberId: 'member-host' });
    });

    it('should NOT update room with hostMemberId if already set', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      const roomWithHost: GameRoom = { ...mockRoom, hostMemberId: 'existing-member' };
      component.createdRoom.set(roomWithHost);

      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      await component.enterRoom();

      expect(mockRoomService.updateRoom).not.toHaveBeenCalled();
    });

    it('should navigate to /room/:id after entering', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);

      await component.enterRoom();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room', 'room123']);
    });

    it('should set error on failure', async () => {
      const currentUserWritable =
        mockAuthService.currentUser as unknown as WritableSignal<Models.User<Models.Preferences> | null>;
      currentUserWritable.set(mockAuthenticatedUser);
      mockMemberService.getMemberByUserOrDevice.and.rejectWith(new Error('Enter failed'));

      await component.enterRoom();

      expect(component.error()).not.toBeNull();
    });
  });

  describe('composing the table with friends', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CreateRoomComponent);
      component = fixture.componentInstance;
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();
    });

    it('loads the friend list once the room exists', async () => {
      component.createdRoom.set(null);
      component.createRoomForm.controls.roomName.setValue('My Room');

      await component.onSubmit();

      expect(mockFriendService.getFriends).toHaveBeenCalled();
    });

    it('toggles a friend in and out of the selection', () => {
      component.toggleFriendSelection('user-friend');
      expect(component.isFriendSelected('user-friend')).toBeTrue();

      component.toggleFriendSelection('user-friend');
      expect(component.isFriendSelected('user-friend')).toBeFalse();
    });

    it('refuses a selection beyond maxPlayers minus the host seat', () => {
      component.createdRoom.set({ ...mockRoom, maxPlayers: 2 });

      component.toggleFriendSelection('user-friend');
      component.toggleFriendSelection('user-friend-2');

      expect(component.isFriendSelected('user-friend-2')).toBeFalse();
      expect(component.error()).toBe('room.errors.roomFull');
    });

    it('creates a member carrying the friend userId when entering', async () => {
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);
      component.toggleFriendSelection('user-friend');

      await component.enterRoom();

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
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room', 'room123']);
    });

    it('does not duplicate a friend who is already a member', async () => {
      mockMemberService.getMemberByUserOrDevice.and.callFake((_roomId: string, userId?: string) =>
        Promise.resolve(userId === 'user-friend' ? { ...mockHostMember, $id: 'member-friend' } : null)
      );
      component.toggleFriendSelection('user-friend');

      await component.enterRoom();

      const invitedFriend = mockMemberService.createMember.calls
        .allArgs()
        .some(([data]: [{ userId: string | null }]) => data.userId === 'user-friend');
      expect(invitedFriend).toBeFalse();
    });

    it('reports a failed invitation without blocking the host on a second attempt', async () => {
      mockMemberService.getMemberByUserOrDevice.and.resolveTo(null);
      mockMemberService.createMember.and.callFake((data: { role: string }) =>
        data.role === 'host' ? Promise.resolve(mockHostMember) : Promise.reject(new Error('network down'))
      );
      component.toggleFriendSelection('user-friend');

      await component.enterRoom();

      expect(component.error()).toBe('room.errors.inviteFriendsFailed');
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      await component.enterRoom();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room', 'room123']);
    });
  });

  describe('copyInviteLink', () => {
    it('should copy invite URL to clipboard', async () => {
      createComponent();
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();

      const writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextSpy },
      });

      await component.copyInviteLink();

      expect(writeTextSpy).toHaveBeenCalledWith(`http://${location.host}/room/join/${mockRoom.code}`);
    });

    it('should set success message', async () => {
      createComponent();
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();

      const writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextSpy },
      });

      await component.copyInviteLink();

      expect(component.successMessage()).not.toBeNull();
    });

    it('should clear success message after 2 seconds', fakeAsync(() => {
      createComponent();
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();

      let writeTextSpy: jasmine.Spy;
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        get: () => ({
          writeText: () => {
            if (!writeTextSpy) {
              writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
            }
            return writeTextSpy;
          },
        }),
      });

      component.copyInviteLink();
      tick(0);

      expect(component.successMessage()).not.toBeNull();

      tick(2000);

      expect(component.successMessage()).toBeNull();
    }));

    it('should handle clipboard errors gracefully', async () => {
      createComponent();
      component.createdRoom.set(mockRoom);
      fixture.detectChanges();

      const writeTextSpy = jasmine.createSpy('writeText').and.rejectWith(new Error('Clipboard error'));
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: writeTextSpy },
      });

      await component.copyInviteLink();

      expect(component.error()).not.toBeNull();
    });
  });
});
