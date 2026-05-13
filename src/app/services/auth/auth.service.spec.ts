import { TestBed } from '@angular/core/testing';
import { Models } from 'appwrite';
import { AuthService } from './auth.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { GameService } from '../game/game.service';
import { RoomService } from '../room/room.service';
import { MemberService } from '../member/member.service';
import { KetalSessionService } from '../ketal-session/ketal-session.service';
import { RealtimeService } from '../realtime/realtime.service';
import { LocalService } from '../local/local.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockAppwriteService: jasmine.SpyObj<AppwriteService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockRoomService: jasmine.SpyObj<RoomService>;
  let mockMemberService: jasmine.SpyObj<MemberService>;
  let mockKetalSessionService: jasmine.SpyObj<KetalSessionService>;
  let mockRealtimeService: jasmine.SpyObj<RealtimeService>;
  let mockLocalService: jasmine.SpyObj<LocalService>;
  let mockAccount: {
    get: jasmine.Spy;
    create: jasmine.Spy;
    createEmailPasswordSession: jasmine.Spy;
    createOAuth2Session: jasmine.Spy;
    deleteSession: jasmine.Spy;
    createAnonymousSession: jasmine.Spy;
  };

  const mockUser: Models.User<Models.Preferences> = {
    $id: 'user123',
    $createdAt: '2024-01-01T00:00:00.000Z',
    $updatedAt: '2024-01-01T00:00:00.000Z',
    name: 'Test User',
    email: 'test@example.com',
    phone: '',
    prefs: {},
    registration: '2024-01-01T00:00:00.000Z',
    status: true,
    labels: [],
    passwordUpdate: '2024-01-01T00:00:00.000Z',
    mfa: false,
    accessedAt: '2024-01-01T00:00:00.000Z',
    emailVerification: true,
    phoneVerification: false,
    targets: [],
  };

  const mockAnonymousUser: Models.User<Models.Preferences> = {
    ...mockUser,
    $id: 'anon123',
    name: '',
    email: '',
  };

  beforeEach(() => {
    mockAccount = {
      get: jasmine.createSpy('get'),
      create: jasmine.createSpy('create'),
      createEmailPasswordSession: jasmine.createSpy('createEmailPasswordSession'),
      createOAuth2Session: jasmine.createSpy('createOAuth2Session'),
      deleteSession: jasmine.createSpy('deleteSession'),
      createAnonymousSession: jasmine.createSpy('createAnonymousSession'),
    };

    mockAppwriteService = jasmine.createSpyObj('AppwriteService', [], {
      account: mockAccount,
    });

    mockGameService = jasmine.createSpyObj('GameService', ['resetGame']);
    mockRoomService = jasmine.createSpyObj('RoomService', ['setCurrentRoom']);
    mockMemberService = jasmine.createSpyObj('MemberService', ['clearMembers']);
    mockKetalSessionService = jasmine.createSpyObj('KetalSessionService', ['setCurrentSession']);
    mockRealtimeService = jasmine.createSpyObj('RealtimeService', ['unsubscribeAll']);
    mockLocalService = jasmine.createSpyObj('LocalService', ['saveData', 'getData', 'removeData', 'clearData']);

    TestBed.configureTestingModule({
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: RoomService, useValue: mockRoomService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: LocalService, useValue: mockLocalService },
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('should have currentUser signal initialized to null', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('should have isLoggedIn computed signal return false when no user', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should have isAnonymous computed signal return false when no user', () => {
      expect(service.isAnonymous()).toBeFalse();
    });

    it('should have isLoading signal initialized to false', () => {
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('init', () => {
    it('should set currentUser when session exists', async () => {
      mockAccount.get.and.resolveTo(mockUser);

      await service.init();

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.isLoading()).toBeFalse();
    });

    it('should set currentUser to null when no session exists', async () => {
      mockAccount.get.and.rejectWith(new Error('No session'));

      await service.init();

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
      expect(service.isLoading()).toBeFalse();
    });

    it('should set isLoading during operation', async () => {
      let loadingDuringCall = false;
      mockAccount.get.and.callFake(async () => {
        loadingDuringCall = service.isLoading();
        return mockUser;
      });

      await service.init();

      expect(loadingDuringCall).toBeTrue();
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('signUp', () => {
    it('should create account, session, and set user on success', async () => {
      mockAccount.create.and.resolveTo({});
      mockAccount.createEmailPasswordSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockUser);

      await service.signUp('test@example.com', 'password123', 'Test User');

      expect(mockAccount.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      );
      expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
        jasmine.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should clear user and throw error on failure', async () => {
      const error = new Error('Email already exists');
      mockAccount.create.and.rejectWith(error);

      await expectAsync(service.signUp('test@example.com', 'password123', 'Test User')).toBeRejectedWith(error);

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should set isLoading to false after completion', async () => {
      mockAccount.create.and.resolveTo({});
      mockAccount.createEmailPasswordSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockUser);

      await service.signUp('test@example.com', 'password123', 'Test User');

      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('signInWithGoogle', () => {
    it('should call createOAuth2Session with correct parameters', () => {
      service.signInWithGoogle();

      expect(mockAccount.createOAuth2Session).toHaveBeenCalledWith(
        jasmine.objectContaining({
          provider: 'google',
          success: jasmine.stringMatching(/\/$/),
          failure: jasmine.stringMatching(/\/login$/),
        })
      );
    });
  });

  describe('loginWithEmail', () => {
    it('should create session and set user on success', async () => {
      mockAccount.createEmailPasswordSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockUser);

      await service.loginWithEmail('test@example.com', 'password123');

      expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
        jasmine.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should clear user and throw error on failure', async () => {
      const error = new Error('Invalid credentials');
      mockAccount.createEmailPasswordSession.and.rejectWith(error);

      await expectAsync(service.loginWithEmail('test@example.com', 'wrong')).toBeRejectedWith(error);

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should set isLoading to false after completion', async () => {
      mockAccount.createEmailPasswordSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockUser);

      await service.loginWithEmail('test@example.com', 'password123');

      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should delete session and clear user', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockAccount.deleteSession).toHaveBeenCalledWith(jasmine.objectContaining({ sessionId: 'current' }));
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should clear user even if delete session fails', async () => {
      mockAccount.deleteSession.and.rejectWith(new Error('Network error'));

      await service.logout();

      expect(service.currentUser()).toBeNull();
      expect(service.isLoading()).toBeFalse();
    });

    it('should reset game state on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockGameService.resetGame).toHaveBeenCalled();
    });

    it('should clear room state on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockRoomService.setCurrentRoom).toHaveBeenCalledWith(null);
    });

    it('should clear member state on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockMemberService.clearMembers).toHaveBeenCalled();
    });

    it('should clear ketal session state on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockKetalSessionService.setCurrentSession).toHaveBeenCalledWith(null);
    });

    it('should unsubscribe from all realtime subscriptions on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockRealtimeService.unsubscribeAll).toHaveBeenCalled();
    });

    it('should clear localStorage game data on logout', async () => {
      mockAccount.deleteSession.and.resolveTo({});

      await service.logout();

      expect(mockLocalService.removeData).toHaveBeenCalledWith('game');
      expect(mockLocalService.removeData).toHaveBeenCalledWith('players');
    });

    it('should clear all state even if Appwrite session deletion fails', async () => {
      mockAccount.deleteSession.and.rejectWith(new Error('Network error'));

      await service.logout();

      expect(mockGameService.resetGame).toHaveBeenCalled();
      expect(mockRoomService.setCurrentRoom).toHaveBeenCalledWith(null);
      expect(mockMemberService.clearMembers).toHaveBeenCalled();
      expect(mockKetalSessionService.setCurrentSession).toHaveBeenCalledWith(null);
      expect(mockRealtimeService.unsubscribeAll).toHaveBeenCalled();
      expect(mockLocalService.removeData).toHaveBeenCalledWith('game');
      expect(mockLocalService.removeData).toHaveBeenCalledWith('players');
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('createAnonymousSession', () => {
    it('should create anonymous session and set user', async () => {
      mockAccount.createAnonymousSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockAnonymousUser);

      await service.createAnonymousSession();

      expect(mockAccount.createAnonymousSession).toHaveBeenCalled();
      expect(service.currentUser()).toEqual(mockAnonymousUser);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.isAnonymous()).toBeTrue();
    });

    it('should clear user and throw error on failure', async () => {
      const error = new Error('Failed to create session');
      mockAccount.createAnonymousSession.and.rejectWith(error);

      await expectAsync(service.createAnonymousSession()).toBeRejectedWith(error);

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('getOrCreateSession', () => {
    it('should return existing user if available', async () => {
      // First, set up an existing user via init
      mockAccount.get.and.resolveTo(mockUser);
      await service.init();

      const result = await service.getOrCreateSession();

      expect(result).toEqual(mockUser);
      // Should only have called get once (during init)
      expect(mockAccount.get).toHaveBeenCalledTimes(1);
    });

    it('should restore existing session if available', async () => {
      mockAccount.get.and.resolveTo(mockUser);

      const result = await service.getOrCreateSession();

      expect(result).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should create anonymous session if no existing session', async () => {
      mockAccount.get.and.rejectWith(new Error('No session'));
      mockAccount.createAnonymousSession.and.resolveTo({});

      // Reset the mock for the second call
      let callCount = 0;
      mockAccount.get.and.callFake(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('No session');
        }
        return mockAnonymousUser;
      });

      const result = await service.getOrCreateSession();

      expect(result).toEqual(mockAnonymousUser);
      expect(mockAccount.createAnonymousSession).toHaveBeenCalled();
      expect(service.isAnonymous()).toBeTrue();
    });

    it('should throw error if anonymous session creation fails', async () => {
      mockAccount.get.and.rejectWith(new Error('No session'));
      mockAccount.createAnonymousSession.and.rejectWith(new Error('Creation failed'));

      await expectAsync(service.getOrCreateSession()).toBeRejectedWithError('Creation failed');

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('consumePendingSummary', () => {
    afterEach(() => {
      localStorage.removeItem('pendingSummary');
    });

    it('should return true and clear flag when pendingSummary is set', () => {
      localStorage.setItem('pendingSummary', 'true');

      const result = service.consumePendingSummary();

      expect(result).toBeTrue();
      expect(localStorage.getItem('pendingSummary')).toBeNull();
    });

    it('should return false when pendingSummary is not set', () => {
      const result = service.consumePendingSummary();

      expect(result).toBeFalse();
    });

    it('should return false when pendingSummary has a non-true value', () => {
      localStorage.setItem('pendingSummary', 'false');

      const result = service.consumePendingSummary();

      expect(result).toBeFalse();
    });
  });

  describe('isAnonymous computed signal', () => {
    it('should return true for anonymous user (empty email)', async () => {
      mockAccount.createAnonymousSession.and.resolveTo({});
      mockAccount.get.and.resolveTo(mockAnonymousUser);

      await service.createAnonymousSession();

      expect(service.isAnonymous()).toBeTrue();
    });

    it('should return false for authenticated user', async () => {
      mockAccount.get.and.resolveTo(mockUser);

      await service.init();

      expect(service.isAnonymous()).toBeFalse();
    });
  });
});
