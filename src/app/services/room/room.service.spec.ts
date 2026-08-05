import { TestBed } from '@angular/core/testing';
import { RoomService, GameRoom, RoomMode, RoomStatus } from './room.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { MemberService, GameMember } from '../member/member.service';
import { AuthService } from '../auth/auth.service';
import { signal, WritableSignal } from '@angular/core';

describe('RoomService', () => {
  let service: RoomService;
  let mockAppwriteService: jasmine.SpyObj<AppwriteService>;
  let mockRealtimeService: jasmine.SpyObj<RealtimeService>;
  let mockMemberService: jasmine.SpyObj<MemberService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDatabases: {
    createDocument: jasmine.Spy;
    deleteDocument: jasmine.Spy;
    getDocument: jasmine.Spy;
    listDocuments: jasmine.Spy;
    updateDocument: jasmine.Spy;
  };

  const mockRoomDocument: Record<string, unknown> = {
    $id: 'room123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: '550e8400-e29b-41d4-a716-446655440000',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle' as RoomStatus,
    hostMemberId: 'member123',
    mode: 'multiplayer' as RoomMode,
    maxPlayers: 10,
    gamesPlayed: 0,
    archived: false,
  };

  const mockGameRoom: GameRoom = {
    $id: 'room123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: '550e8400-e29b-41d4-a716-446655440000',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'member123',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 0,
    archived: false,
  };

  beforeEach(() => {
    mockDatabases = {
      createDocument: jasmine.createSpy('createDocument'),
      deleteDocument: jasmine.createSpy('deleteDocument'),
      getDocument: jasmine.createSpy('getDocument'),
      listDocuments: jasmine.createSpy('listDocuments'),
      updateDocument: jasmine.createSpy('updateDocument'),
    };

    mockAppwriteService = jasmine.createSpyObj('AppwriteService', [], {
      databases: mockDatabases,
      databaseId: 'fug',
    });

    mockRealtimeService = jasmine.createSpyObj('RealtimeService', [
      'subscribeToRoom',
      'unsubscribe',
      'broadcastToRoom',
    ]);
    mockMemberService = jasmine.createSpyObj('MemberService', [
      'getMembersByRoom',
      'getMembersByUserId',
      'createMember',
      'updateMember',
      'deleteMember',
      'currentMember',
    ]);
    mockAuthService = jasmine.createSpyObj(
      'AuthService',
      [
        'init',
        'signUp',
        'loginWithEmail',
        'signInWithGoogle',
        'logout',
        'createAnonymousSession',
        'getOrCreateSession',
        'consumePendingSummary',
      ],
      {
        currentUser: signal(null),
        isLoggedIn: signal(false),
        isAnonymous: signal(true),
        isLoading: signal(false),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        RoomService,
        { provide: AppwriteService, useValue: mockAppwriteService },
        { provide: RealtimeService, useValue: mockRealtimeService },
        { provide: MemberService, useValue: mockMemberService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(RoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('should have currentRoom signal initialized to null', () => {
      expect(service.currentRoom()).toBeNull();
    });
  });

  describe('createRoom', () => {
    it('should create a room with default values', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);

      const result = await service.createRoom('Test Room');

      expect(mockDatabases.createDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: jasmine.any(String),
        data: jasmine.objectContaining({
          name: 'Test Room',
          code: jasmine.any(String),
          inviteToken: jasmine.any(String),
          currentGameId: null,
          currentSessionId: null,
          status: 'idle',
          hostMemberId: '',
          mode: 'multiplayer',
          maxPlayers: 10,
          gamesPlayed: 0,
        }),
      });
      expect(result.$id).toBe('room123');
      expect(result.name).toBe('Test Room');
    });

    it('should create a room with custom mode and maxPlayers', async () => {
      mockDatabases.createDocument.and.resolveTo({
        ...mockRoomDocument,
        mode: 'local',
        maxPlayers: 6,
      });

      const result = await service.createRoom('Local Room', 'local', 6);

      expect(mockDatabases.createDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: jasmine.any(String),
        data: jasmine.objectContaining({
          name: 'Local Room',
          mode: 'local',
          maxPlayers: 6,
        }),
      });
      expect(result.mode).toBe('local');
      expect(result.maxPlayers).toBe(6);
    });

    it('should set currentRoom signal after creating room', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);

      await service.createRoom('Test Room');

      expect(service.currentRoom()).toEqual(mockGameRoom);
    });

    it('should throw error when creation fails', async () => {
      mockDatabases.createDocument.and.rejectWith(new Error('Database error'));

      await expectAsync(service.createRoom('Test Room')).toBeRejectedWithError('Failed to create room: Database error');
    });

    it('should generate a 6-character room code', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);

      await service.createRoom('Test Room');

      const callArgs = mockDatabases.createDocument.calls.mostRecent().args[0] as { data: { code: string } };
      expect(callArgs.data.code.length).toBe(6);
      expect(callArgs.data.code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate a UUID invite token', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);

      await service.createRoom('Test Room');

      const callArgs = mockDatabases.createDocument.calls.mostRecent().args[0] as { data: { inviteToken: string } };
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(callArgs.data.inviteToken).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room by id', async () => {
      mockDatabases.deleteDocument.and.resolveTo({});

      await service.deleteRoom('room123');

      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
      });
    });

    it('should clear currentRoom signal if deleting current room', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);
      mockDatabases.deleteDocument.and.resolveTo({});

      await service.createRoom('Test Room');
      expect(service.currentRoom()).not.toBeNull();

      await service.deleteRoom('room123');

      expect(service.currentRoom()).toBeNull();
    });

    it('should not clear currentRoom if deleting a different room', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);
      mockDatabases.deleteDocument.and.resolveTo({});

      await service.createRoom('Test Room');
      await service.deleteRoom('different-room-id');

      expect(service.currentRoom()).toEqual(mockGameRoom);
    });

    it('should throw error when deletion fails', async () => {
      mockDatabases.deleteDocument.and.rejectWith(new Error('Not found'));

      await expectAsync(service.deleteRoom('room123')).toBeRejectedWithError('Failed to delete room: Not found');
    });

    describe('member cleanup', () => {
      const memberA: GameMember = {
        $id: 'member-a',
        roomId: 'room123',
        userId: 'user-a',
        deviceId: null,
        displayName: 'A',
        role: 'host',
        isOnline: true,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };
      const memberB: GameMember = { ...memberA, $id: 'member-b', userId: 'user-b', displayName: 'B', role: 'player' };

      it('should delete every member of the room before the room itself', async () => {
        const callOrder: string[] = [];
        mockMemberService.getMembersByRoom.and.resolveTo([memberA, memberB]);
        mockMemberService.deleteMember.and.callFake((id: string) => {
          callOrder.push(`member:${id}`);
          return Promise.resolve();
        });
        mockDatabases.deleteDocument.and.callFake(() => {
          callOrder.push('room');
          return Promise.resolve({});
        });

        await service.deleteRoom('room123');

        expect(callOrder).toEqual(['member:member-a', 'member:member-b', 'room']);
        expect(mockMemberService.getMembersByRoom).toHaveBeenCalledWith('room123');
      });

      it('should still delete the room when one member deletion fails', async () => {
        mockMemberService.getMembersByRoom.and.resolveTo([memberA, memberB]);
        mockMemberService.deleteMember.and.callFake((id: string) =>
          id === 'member-a' ? Promise.reject(new Error('permission denied')) : Promise.resolve()
        );
        mockDatabases.deleteDocument.and.resolveTo({});

        await expectAsync(service.deleteRoom('room123')).toBeResolved();

        expect(mockMemberService.deleteMember).toHaveBeenCalledWith('member-b');
        expect(mockDatabases.deleteDocument).toHaveBeenCalledWith({
          databaseId: 'fug',
          collectionId: 'fug_game_rooms',
          documentId: 'room123',
        });
      });

      it('should still delete the room when the member listing fails', async () => {
        mockMemberService.getMembersByRoom.and.rejectWith(new Error('offline'));
        mockDatabases.deleteDocument.and.resolveTo({});

        await expectAsync(service.deleteRoom('room123')).toBeResolved();

        expect(mockDatabases.deleteDocument).toHaveBeenCalledWith({
          databaseId: 'fug',
          collectionId: 'fug_game_rooms',
          documentId: 'room123',
        });
      });

      it('should not delete sessions, players, cards or sip events documents', async () => {
        mockMemberService.getMembersByRoom.and.resolveTo([memberA]);
        mockMemberService.deleteMember.and.resolveTo();
        mockDatabases.deleteDocument.and.resolveTo({});

        await service.deleteRoom('room123');

        const deletedCollections = mockDatabases.deleteDocument.calls
          .allArgs()
          .map((args) => (args[0] as { collectionId: string }).collectionId);
        expect(deletedCollections).toEqual(['fug_game_rooms']);
      });
    });
  });

  describe('getRoomByCode', () => {
    it('should find a room by its code', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      const result = await service.getRoomByCode('ABC123');

      expect(mockDatabases.listDocuments).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        queries: jasmine.any(Array),
      });
      const queries = mockDatabases.listDocuments.calls.mostRecent().args[0].queries as string[];
      expect(queries.some((q) => q.includes('"code"') && q.includes('"ABC123"'))).toBeTrue();
      expect(result).toEqual(mockGameRoom);
    });

    it('should normalize the code to uppercase', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      await service.getRoomByCode('abc123');

      const queries = mockDatabases.listDocuments.calls.mostRecent().args[0].queries as string[];
      expect(queries.some((q) => q.includes('"ABC123"'))).toBeTrue();
    });

    it('should trim whitespace from code', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      await service.getRoomByCode('  ABC123  ');

      const queries = mockDatabases.listDocuments.calls.mostRecent().args[0].queries as string[];
      expect(queries.some((q) => q.includes('"ABC123"'))).toBeTrue();
    });

    it('should return null for invalid code length', async () => {
      const result = await service.getRoomByCode('ABC');

      expect(mockDatabases.listDocuments).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when room not found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [],
      });

      const result = await service.getRoomByCode('NOTFND');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockDatabases.listDocuments.and.rejectWith(new Error('Query failed'));

      await expectAsync(service.getRoomByCode('ABC123')).toBeRejectedWithError(
        'Failed to find room by code: Query failed'
      );
    });
  });

  describe('getRoomByInviteToken', () => {
    it('should find a room by its invite token', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      const result = await service.getRoomByInviteToken('550e8400-e29b-41d4-a716-446655440000');

      expect(mockDatabases.listDocuments).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        queries: jasmine.any(Array),
      });
      const queries = mockDatabases.listDocuments.calls.mostRecent().args[0].queries as string[];
      expect(
        queries.some((q) => q.includes('"inviteToken"') && q.includes('"550e8400-e29b-41d4-a716-446655440000"'))
      ).toBeTrue();
      expect(result).toEqual(mockGameRoom);
    });

    it('should normalize token to lowercase and trim', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      await service.getRoomByInviteToken('  550E8400-E29B-41D4-A716-446655440000  ');

      const queries = mockDatabases.listDocuments.calls.mostRecent().args[0].queries as string[];
      expect(queries.some((q) => q.includes('"550e8400-e29b-41d4-a716-446655440000"'))).toBeTrue();
    });

    it('should return null when token not found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [],
      });

      const result = await service.getRoomByInviteToken('nonexistent-token');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockDatabases.listDocuments.and.rejectWith(new Error('Query failed'));

      await expectAsync(service.getRoomByInviteToken('550e8400-e29b-41d4-a716-446655440000')).toBeRejectedWithError(
        'Failed to find room by invite token: Query failed'
      );
    });
  });

  describe('getRoomById', () => {
    it('should find a room by its document ID', async () => {
      mockDatabases.getDocument.and.resolveTo(mockRoomDocument);

      const result = await service.getRoomById('room123');

      expect(mockDatabases.getDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
      });
      expect(result).toEqual(mockGameRoom);
    });

    it('should return null when room not found (404)', async () => {
      const notFoundError = { code: 404, message: 'Document not found' };
      mockDatabases.getDocument.and.rejectWith(notFoundError);

      const result = await service.getRoomById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for non-404 errors', async () => {
      mockDatabases.getDocument.and.rejectWith(new Error('Server error'));

      await expectAsync(service.getRoomById('room123')).toBeRejectedWithError('Failed to get room: Server error');
    });
  });

  describe('getMyRooms', () => {
    it('should return rooms for logged-in user', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockMember1: GameMember = {
        $id: 'member1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Player 1',
        role: 'player',
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };
      const mockMember2: GameMember = {
        $id: 'member2',
        roomId: 'room456',
        userId: 'user1',
        deviceId: null,
        displayName: 'Player 2',
        role: 'player',
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };
      mockMemberService.getMembersByUserId.and.resolveTo([mockMember1, mockMember2]);
      mockMemberService.getMembersByRoom.and.resolveTo([mockMember1]);

      const mockRoomDocument2 = { ...mockRoomDocument, $id: 'room456', name: 'Room 2' };
      mockDatabases.getDocument.and.callFake((params: { documentId: string }) => {
        return Promise.resolve(params.documentId === 'room456' ? mockRoomDocument2 : mockRoomDocument);
      });

      const result = await service.getMyRooms();

      expect(mockMemberService.getMembersByUserId).toHaveBeenCalledWith('user1');
      expect(mockDatabases.getDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
      });
      expect(mockDatabases.getDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room456',
      });
      expect(result.length).toBe(2);
      expect(result[0].$id).toBe('room123');
      expect(result[1].$id).toBe('room456');
    });

    it('should return empty array when no rooms exist', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });
      mockMemberService.getMembersByUserId.and.resolveTo([]);

      const result = await service.getMyRooms();

      expect(result).toEqual([]);
    });

    it('should throw error on member service failure', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user123' });

      let spyCalled = false;
      mockMemberService.getMembersByUserId.and.callFake(async () => {
        spyCalled = true;
        throw new Error('Database error');
      });

      let errorCaught = false;
      try {
        await service.getMyRooms();
      } catch (err: any) {
        errorCaught = true;
        expect(err.message).toContain('Database error');
      }
      expect(spyCalled).toBeTrue();
      expect(errorCaught).toBeTrue();
    });
  });

  describe('updateRoom', () => {
    it('should update room properties', async () => {
      const updatedDocument = { ...mockRoomDocument, name: 'Updated Room', status: 'playing' };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      const result = await service.updateRoom('room123', {
        name: 'Updated Room',
        status: 'playing',
      });

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
        data: {
          name: 'Updated Room',
          status: 'playing',
        },
      });
      expect(result.name).toBe('Updated Room');
      expect(result.status).toBe('playing');
    });

    it('should update currentRoom signal if updating current room', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);
      const updatedDocument = { ...mockRoomDocument, name: 'Updated Room' };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      await service.createRoom('Test Room');
      await service.updateRoom('room123', { name: 'Updated Room' });

      expect(service.currentRoom()?.name).toBe('Updated Room');
    });

    it('should not update currentRoom if updating different room', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);
      const updatedDocument = { ...mockRoomDocument, $id: 'other-room', name: 'Updated Room' };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      await service.createRoom('Test Room');
      await service.updateRoom('other-room', { name: 'Updated Room' });

      expect(service.currentRoom()?.name).toBe('Test Room');
    });

    it('should throw error on update failure', async () => {
      mockDatabases.updateDocument.and.rejectWith(new Error('Update failed'));

      await expectAsync(service.updateRoom('room123', { name: 'Updated Room' })).toBeRejectedWithError(
        'Failed to update room: Update failed'
      );
    });

    it('should update currentGameId and currentSessionId', async () => {
      const updatedDocument = {
        ...mockRoomDocument,
        currentGameId: 'game123',
        currentSessionId: 'session123',
      };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      const result = await service.updateRoom('room123', {
        currentGameId: 'game123',
        currentSessionId: 'session123',
      });

      expect(result.currentGameId).toBe('game123');
      expect(result.currentSessionId).toBe('session123');
    });
  });

  describe('subscribeToRoom', () => {
    it('should subscribe to room updates via RealtimeService', async () => {
      const callback = jasmine.createSpy('callback');
      mockRealtimeService.subscribeToRoom.and.resolveTo('sub_123');

      const subscriptionId = await service.subscribeToRoom('room123', callback);

      expect(mockRealtimeService.subscribeToRoom).toHaveBeenCalledWith('room123', callback);
      expect(subscriptionId).toBe('sub_123');
    });

    it('should return subscription id for unsubscribing', async () => {
      const callback = jasmine.createSpy('callback');
      mockRealtimeService.subscribeToRoom.and.resolveTo('sub_456');

      const subscriptionId = await service.subscribeToRoom('room123', callback);

      expect(subscriptionId).toBe('sub_456');
    });

    it('should update currentRoom when receiving room updates', async () => {
      let capturedCallback: ((room: GameRoom) => void) | undefined;
      mockRealtimeService.subscribeToRoom.and.callFake(
        (_roomId: string, callback: (room: GameRoom) => void): Promise<string> => {
          capturedCallback = callback;
          return Promise.resolve('sub_789');
        }
      );

      const callback = jasmine.createSpy('callback');
      await service.subscribeToRoom('room123', callback);

      const updatedRoom: GameRoom = { ...mockGameRoom, status: 'playing' };
      if (capturedCallback) {
        capturedCallback(updatedRoom);
      }

      expect(callback).toHaveBeenCalledWith(updatedRoom);
    });
  });

  describe('joinRoom', () => {
    it('should set currentRoom when room is found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockRoomDocument],
      });

      const result = await service.joinRoom('ABC123');

      expect(service.currentRoom()).toEqual(mockGameRoom);
      expect(result).toEqual(mockGameRoom);
    });

    it('should throw error when room is not found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [],
      });

      await expectAsync(service.joinRoom('NOTFND')).toBeRejectedWithError(
        'Room not found. Please check the code and try again.'
      );
    });
  });

  describe('leaveRoom', () => {
    it('should clear currentRoom signal', async () => {
      mockDatabases.createDocument.and.resolveTo(mockRoomDocument);
      mockDatabases.getDocument.and.resolveTo(mockRoomDocument);
      mockMemberService.getMembersByRoom.and.resolveTo([
        { $id: 'member123', roomId: 'room123', userId: 'current123', role: 'host' } as any,
      ]);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'current123' });

      await service.createRoom('Test Room');
      expect(service.currentRoom()).not.toBeNull();

      await service.leaveRoom(service.currentRoom()!.$id);

      expect(service.currentRoom()).toBeNull();
    });
  });

  describe('setCurrentRoom', () => {
    it('should set currentRoom to provided room', () => {
      service.setCurrentRoom(mockGameRoom);

      expect(service.currentRoom()).toEqual(mockGameRoom);
    });

    it('should set currentRoom to null', () => {
      service.setCurrentRoom(mockGameRoom);
      service.setCurrentRoom(null);

      expect(service.currentRoom()).toBeNull();
    });
  });

  describe('mapDocumentToGameRoom', () => {
    it('should map all fields correctly', async () => {
      const fullDocument: Record<string, unknown> = {
        $id: 'room789',
        name: 'Full Room',
        code: 'XYZ789',
        inviteToken: 'token-123',
        currentGameId: 'game456',
        currentSessionId: 'session789',
        status: 'playing',
        hostMemberId: 'host123',
        mode: 'local',
        maxPlayers: 8,
        gamesPlayed: 5,
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [fullDocument],
      });

      const result = await service.getRoomByCode('XYZ789');

      expect(result).toEqual({
        $id: 'room789',
        name: 'Full Room',
        code: 'XYZ789',
        inviteToken: 'token-123',
        currentGameId: 'game456',
        currentSessionId: 'session789',
        status: 'playing',
        hostMemberId: 'host123',
        mode: 'local',
        maxPlayers: 8,
        gamesPlayed: 5,
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      const minimalDocument: Record<string, unknown> = {
        $id: 'room789',
        name: 'Minimal Room',
        code: 'MIN123',
        inviteToken: 'token-min',
        hostMemberId: 'host123',
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [minimalDocument],
      });

      const result = await service.getRoomByCode('MIN123');

      expect(result?.currentGameId).toBeNull();
      expect(result?.currentSessionId).toBeNull();
      expect(result?.status).toBe('idle');
      expect(result?.mode).toBe('multiplayer');
      expect(result?.maxPlayers).toBe(10);
      expect(result?.gamesPlayed).toBe(0);
    });
  });

  describe('createSoloRoom', () => {
    it('should create a solo room with auto-generated name', async () => {
      const expectedNamePattern = /^Solo-\d+$/;
      mockDatabases.createDocument.and.callFake((params: { data: any }) => {
        return Promise.resolve({
          ...mockRoomDocument,
          name: params.data.name,
          mode: 'solo' as RoomMode,
          maxPlayers: 10,
        });
      });

      const result = await service.createSoloRoom();

      expect(result.name).toMatch(expectedNamePattern);
      expect(result.mode).toBe('solo');
      expect(result.maxPlayers).toBe(10);
      expect(mockDatabases.createDocument).toHaveBeenCalled();
    });
  });

  describe('startNewSession', () => {
    it('should start a new session when room is idle', async () => {
      const mockSession = {
        $id: 'session123',
        roomId: 'room123',
        status: 'active',
        gamesPlayed: 0,
      };

      const mockMember: GameMember = {
        $id: 'member123',
        roomId: 'room123',
        userId: 'user123',
        deviceId: null,
        displayName: 'Test Player',
        role: 'host',
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      // Setup room to be idle
      mockDatabases.getDocument.and.resolveTo({
        ...mockRoomDocument,
        status: 'idle' as RoomStatus,
      });

      // Mock member service currentMember signal
      (service as any).memberService = mockMemberService;
      mockMemberService.currentMember.and.returnValue(mockMember);

      // Mock ketalSession startGame
      (service as any).ketalSession = jasmine.createSpyObj('MockKetalSessionService', ['startGame']);
      (service as any).ketalSession.startGame = jasmine.createSpy('startGame').and.resolveTo(mockSession);

      // Mock room update
      mockDatabases.updateDocument.and.resolveTo({
        ...mockRoomDocument,
        currentSessionId: 'session123',
        status: 'playing' as RoomStatus,
      });

      const result = await service.startNewSession('room123');

      expect(result!.$id).toBe('session123');
      expect(mockDatabases.getDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
      });
    });

    it('should throw error when room not found', async () => {
      mockDatabases.getDocument.and.resolveTo(null);

      await expectAsync(service.startNewSession('nonexistent')).toBeRejectedWithError('Room not found');
    });

    it('should throw error when room is not idle', async () => {
      mockDatabases.getDocument.and.resolveTo({
        ...mockRoomDocument,
        status: 'playing' as RoomStatus,
      });
      (service as any).memberService = mockMemberService;
      mockMemberService.currentMember.and.returnValue({
        $id: 'member123',
        roomId: 'room123',
        userId: 'user123',
        deviceId: null,
        displayName: 'Player',
        role: 'host' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      });

      await expectAsync(service.startNewSession('room123')).toBeRejectedWithError(
        'Room must be idle to start a new game'
      );
    });

    it('should throw error when no member context available', async () => {
      mockDatabases.getDocument.and.resolveTo({
        ...mockRoomDocument,
        status: 'idle' as RoomStatus,
      });
      (service as any).memberService = mockMemberService;
      mockMemberService.currentMember.and.returnValue(null);

      await expectAsync(service.startNewSession('room123')).toBeRejectedWithError(
        'No member context available to start session'
      );
    });
  });

  describe('renameRoom', () => {
    it('should rename room and broadcast event', async () => {
      const updatedRoom = { ...mockGameRoom, name: 'New Name' };
      mockDatabases.updateDocument.and.resolveTo(updatedRoom);

      const result = await service.renameRoom('room123', 'New Name');

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
        data: { name: 'New Name' },
      });
      expect(result.name).toBe('New Name');
      expect(mockRealtimeService.broadcastToRoom).toHaveBeenCalledWith('room123', 'room.renamed', {
        name: 'New Name',
        roomId: 'room123',
      });
    });
  });

  describe('archiveRoom', () => {
    it('should archive room when called by host', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockHostMember: GameMember = {
        $id: 'hostMember1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Host',
        role: 'host' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      mockDatabases.getDocument.and.resolveTo({
        ...mockRoomDocument,
        status: 'idle' as RoomStatus,
      });
      mockMemberService.getMembersByRoom.and.resolveTo([mockHostMember]);
      mockDatabases.updateDocument.and.resolveTo({
        ...mockRoomDocument,
        status: 'archived' as RoomStatus,
      });

      const result = await service.archiveRoom('room123');

      expect(result.status).toBe('archived');
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
        data: { status: 'archived' },
      });
    });

    it('should throw error when called by non-host', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockPlayerMember: GameMember = {
        $id: 'playerMember1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Player',
        role: 'player' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      mockDatabases.getDocument.and.resolveTo(mockRoomDocument);
      mockMemberService.getMembersByRoom.and.resolveTo([mockPlayerMember]);

      await expectAsync(service.archiveRoom('room123')).toBeRejectedWithError('Only the host can archive a room');
    });

    it('should throw error when room not found', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      mockDatabases.getDocument.and.resolveTo(null);

      await expectAsync(service.archiveRoom('nonexistent')).toBeRejectedWithError('Room not found');
    });

    it('should throw error when no auth service available', async () => {
      // Reconfigure service without auth — add getDocument mock so service reaches auth check
      TestBed.resetTestingModule();
      mockDatabases = {
        createDocument: jasmine.createSpy('createDocument'),
        deleteDocument: jasmine.createSpy('deleteDocument'),
        getDocument: jasmine.createSpy('getDocument').and.resolveTo(mockRoomDocument),
        listDocuments: jasmine.createSpy('listDocuments'),
        updateDocument: jasmine.createSpy('updateDocument').and.resolveTo({ ...mockRoomDocument, status: 'archived' }),
      };
      mockAppwriteService = jasmine.createSpyObj('AppwriteService', [], {
        databases: mockDatabases,
        databaseId: 'fug',
      });
      mockRealtimeService = jasmine.createSpyObj('RealtimeService', [
        'subscribeToRoom',
        'unsubscribe',
        'broadcastToRoom',
      ]);
      mockMemberService = jasmine.createSpyObj('MemberService', [
        'getMembersByRoom',
        'getMembersByUserId',
        'createMember',
        'updateMember',
        'deleteMember',
      ]);
      // Mock getMembersByRoom to return a host member so we pass the room-not-found gate
      mockMemberService.getMembersByRoom.and.resolveTo([]);

      TestBed.configureTestingModule({
        providers: [
          RoomService,
          { provide: AppwriteService, useValue: mockAppwriteService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: MemberService, useValue: mockMemberService },
        ],
      });

      const noAuthService = TestBed.inject(RoomService);
      await expectAsync(noAuthService.archiveRoom('room123')).toBeRejectedWithError('User not authenticated');
    });
  });

  describe('leaveRoom', () => {
    it('should not crash when no auth service available', async () => {
      TestBed.resetTestingModule();
      mockDatabases = {
        createDocument: jasmine.createSpy('createDocument'),
        deleteDocument: jasmine.createSpy('deleteDocument'),
        getDocument: jasmine.createSpy('getDocument').and.resolveTo(mockRoomDocument),
        listDocuments: jasmine.createSpy('listDocuments'),
        updateDocument: jasmine.createSpy('updateDocument').and.resolveTo({ ...mockRoomDocument, status: 'archived' }),
      };
      mockAppwriteService = jasmine.createSpyObj('AppwriteService', [], {
        databases: mockDatabases,
        databaseId: 'fug',
      });
      mockRealtimeService = jasmine.createSpyObj('RealtimeService', [
        'subscribeToRoom',
        'unsubscribe',
        'broadcastToRoom',
      ]);
      mockMemberService = jasmine.createSpyObj('MemberService', [
        'getMembersByRoom',
        'getMembersByUserId',
        'createMember',
        'updateMember',
        'deleteMember',
      ]);
      // Mock getMembersByRoom so .find() doesn't crash on undefined
      mockMemberService.getMembersByRoom.and.resolveTo([]);

      TestBed.configureTestingModule({
        providers: [
          RoomService,
          { provide: AppwriteService, useValue: mockAppwriteService },
          { provide: RealtimeService, useValue: mockRealtimeService },
          { provide: MemberService, useValue: mockMemberService },
        ],
      });

      const noAuthService = TestBed.inject(RoomService);
      await expectAsync(noAuthService.leaveRoom('room123')).toBeResolved();
    });

    it('should handle player leaving (not host)', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockPlayerMember: GameMember = {
        $id: 'playerMember1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Player',
        role: 'player' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      mockDatabases.getDocument.and.resolveTo(mockRoomDocument);
      mockMemberService.getMembersByRoom.and.resolveTo([mockPlayerMember]);
      mockMemberService.deleteMember.and.resolveTo();

      await service.leaveRoom('room123');

      expect(mockMemberService.deleteMember).toHaveBeenCalledWith('playerMember1');
      expect(mockRealtimeService.broadcastToRoom).toHaveBeenCalledWith('room123', 'room.player_left', {
        roomId: 'room123',
        playerName: 'Player',
      });
      expect(service.currentRoom()).toBeNull();
    });

    it('should handle host leaving and transfer to remaining player', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockHostMember: GameMember = {
        $id: 'hostMember1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Host',
        role: 'host' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };
      const mockPlayerMember: GameMember = {
        $id: 'playerMember2',
        roomId: 'room123',
        userId: 'user2',
        deviceId: null,
        displayName: 'Player Two',
        role: 'player' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      const roomWithSession = {
        ...mockRoomDocument,
        currentSessionId: 'session123',
        status: 'playing' as RoomStatus,
      };

      mockDatabases.getDocument.and.resolveTo(roomWithSession);
      mockDatabases.updateDocument.and.resolveTo({ ...mockRoomDocument });
      // First call = initial member lookup (host + player), second call = after host deleted (player only)
      mockMemberService.getMembersByRoom.calls.reset();
      let gmCallCount = 0;
      mockMemberService.getMembersByRoom.and.callFake(() => {
        return gmCallCount++ === 0
          ? Promise.resolve([mockHostMember, mockPlayerMember])
          : Promise.resolve([mockPlayerMember]);
      });
      mockMemberService.deleteMember.calls.reset();
      mockMemberService.deleteMember.and.resolveTo();
      mockMemberService.updateMember.calls.reset();
      mockMemberService.updateMember.and.resolveTo();
      (service as any).ketalSession = jasmine.createSpyObj('MockKetalSessionService', ['cancelSession']);
      (service as any).ketalSession.cancelSession = jasmine.createSpy('cancelSession').and.resolveTo();

      const result = await service.leaveRoom('room123');

      expect(mockMemberService.updateMember).toHaveBeenCalledWith('playerMember2', { role: 'host' });
    });

    it('should archive room when host leaves and no members remain', async () => {
      (mockAuthService.isLoggedIn as unknown as WritableSignal<boolean>).set(true);
      (mockAuthService.isAnonymous as unknown as WritableSignal<boolean>).set(false);
      (mockAuthService.currentUser as unknown as WritableSignal<any>).set({ $id: 'user1' });

      const mockHostMember: GameMember = {
        $id: 'hostMember1',
        roomId: 'room123',
        userId: 'user1',
        deviceId: null,
        displayName: 'Host',
        role: 'host' as const,
        isOnline: false,
        totalSipsGiven: 0,
        totalSipsTaken: 0,
        totalGamesPlayed: 0,
        gameStats: {},
      };

      mockDatabases.getDocument.and.resolveTo(mockRoomDocument);
      mockDatabases.updateDocument.and.callFake((params: { data: any }) =>
        Promise.resolve({ ...mockRoomDocument, ...params.data })
      );
      // First call = initial member lookup (host only), second call = after host deleted (empty = room should archive)
      mockMemberService.getMembersByRoom.calls.reset();
      let gmCallCount2 = 0;
      mockMemberService.getMembersByRoom.and.callFake(() => {
        return gmCallCount2++ === 0 ? Promise.resolve([mockHostMember]) : Promise.resolve([]);
      });
      mockMemberService.deleteMember.calls.reset();
      mockMemberService.deleteMember.and.resolveTo();

      await service.leaveRoom('room123');

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith({
        databaseId: 'fug',
        collectionId: 'fug_game_rooms',
        documentId: 'room123',
        data: { status: 'archived' },
      });
    });
  });

  describe('private methods', () => {
    describe('generateRoomCode', () => {
      it('should generate a 6-character uppercase code', () => {
        const serviceAny = service as any;
        const code = serviceAny.generateRoomCode();

        expect(code.length).toBe(6);
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });
    });

    describe('generateInviteToken', () => {
      it('should generate a valid UUID v4', () => {
        const serviceAny = service as any;
        const token = serviceAny.generateInviteToken();

        expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });
    });

    describe('mapDocumentToGameRoom', () => {
      it('should handle $updatedAt field', () => {
        const serviceAny = service as any;
        const document = {
          $id: 'room123',
          name: 'Test',
          code: 'ABC123',
          inviteToken: 'token',
          currentGameId: null,
          currentSessionId: null,
          status: 'idle',
          hostMemberId: 'host1',
          mode: 'multiplayer',
          maxPlayers: 10,
          gamesPlayed: 0,
          $updatedAt: '2024-01-01T00:00:00.000Z',
        };
        const result = serviceAny.mapDocumentToGameRoom(document);

        expect(result.$updatedAt).toBe('2024-01-01T00:00:00.000Z');
      });

      it('should set archived field when present', () => {
        const serviceAny = service as any;
        const document = {
          $id: 'room123',
          name: 'Test',
          code: 'ABC123',
          inviteToken: 'token',
          currentGameId: null,
          currentSessionId: null,
          status: 'idle',
          hostMemberId: 'host1',
          mode: 'multiplayer',
          maxPlayers: 10,
          gamesPlayed: 0,
          archived: true,
        };
        const result = serviceAny.mapDocumentToGameRoom(document);

        expect(result.archived).toBeTrue();
      });
    });
  });
});
