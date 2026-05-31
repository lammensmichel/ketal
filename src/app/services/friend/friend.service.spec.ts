import { TestBed } from '@angular/core/testing';
import { FriendService } from './friend.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { AuthService } from '../auth/auth.service';

// Mock AppwriteService
const mockAppwriteService = {
  databases: {
    listDocuments: jasmine.createSpy('listDocuments'),
    createDocument: jasmine.createSpy('createDocument'),
    deleteDocument: jasmine.createSpy('deleteDocument'),
    getDocument: jasmine.createSpy('getDocument'),
  },
  databaseId: 'fug',
};

// Mock AuthService
const mockAuthService = {
  currentUser: jasmine.createSpy('currentUser').and.returnValue({
    $id: 'test-user-id',
    email: 'test@example.com',
  }),
};

describe('FriendService', () => {
  let service: FriendService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FriendService,
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(FriendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFriends', () => {
    it('should return empty array when user not authenticated', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      const friends = await service.getFriends();
      expect(friends).toEqual([]);
    });

    it('should fetch friendships for current user', async () => {
      const mockDocuments = [
        {
          $id: 'friendship-1',
          ownerUserId: 'test-user-id',
          friendUserId: 'friend-1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: mockDocuments,
        total: 1,
      });
      (mockAppwriteService.databases.getDocument as jasmine.Spy).and.resolveTo({
        $id: 'friend-1',
        nickname: 'friend1',
      });
      const friends = await service.getFriends();
      expect(friends.length).toBe(1);
      expect(friends[0].$id).toBe('friendship-1');
    });
  });

  describe('searchUsersByNickname', () => {
    it('should return empty array for empty query', async () => {
      const results = await service.searchUsersByNickname('');
      expect(results).toEqual([]);
    });

    it('should search users by nickname', async () => {
      const mockUsers = [{ $id: 'user-1', nickname: 'testuser' }];
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: mockUsers,
        total: 1,
      });
      const results = await service.searchUsersByNickname('test');
      expect(results.length).toBe(1);
    });
  });

  describe('addFriendByNickname', () => {
    it('should throw error when user not authenticated', async () => {
      (mockAuthService.currentUser as jasmine.Spy).and.returnValue(null);
      await expectAsync(service.addFriendByNickname('testuser')).toBeRejectedWithError('User not authenticated');
    });

    it('should add friend by nickname', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.returnValues(
        { documents: [{ $id: 'friend-1', nickname: 'testuser' }], total: 1 },
        { documents: [], total: 0 },
        { documents: [], total: 0 }
      );
      (mockAppwriteService.databases.createDocument as jasmine.Spy).and.resolveTo({
        $id: 'friendship-1',
        ownerUserId: 'test-user-id',
        friendUserId: 'friend-1',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const friendship = await service.addFriendByNickname('testuser');
      expect(friendship.$id).toBe('friendship-1');
    });
  });

  describe('removeFriend', () => {
    it('should throw error if not friends', async () => {
      (mockAppwriteService.databases.listDocuments as jasmine.Spy).and.resolveTo({
        documents: [],
        total: 0,
      });
      await expectAsync(service.removeFriend('non-friend')).toBeRejectedWithError('Not friends');
    });
  });
});
