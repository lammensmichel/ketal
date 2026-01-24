import { TestBed } from '@angular/core/testing';
import { MemberService, GameMember, CreateMemberData, GameStats } from './member.service';
import { AppwriteService } from '../appwrite/appwrite.service';

describe('MemberService', () => {
  let service: MemberService;
  let mockAppwriteService: jasmine.SpyObj<AppwriteService>;
  let mockDatabases: {
    createDocument: jasmine.Spy;
    listDocuments: jasmine.Spy;
    getDocument: jasmine.Spy;
    updateDocument: jasmine.Spy;
    deleteDocument: jasmine.Spy;
  };

  const mockMemberDocument = {
    $id: 'member123',
    roomId: 'room456',
    userId: 'user789',
    deviceId: null,
    displayName: 'Test Player',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 10,
    totalSipsTaken: 5,
    totalGamesPlayed: 2,
    gameStats: JSON.stringify({
      ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
    }),
  };

  const mockMember: GameMember = {
    $id: 'member123',
    roomId: 'room456',
    userId: 'user789',
    deviceId: null,
    displayName: 'Test Player',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 10,
    totalSipsTaken: 5,
    totalGamesPlayed: 2,
    gameStats: {
      ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
    },
  };

  const mockCreateMemberData: CreateMemberData = {
    roomId: 'room456',
    userId: 'user789',
    deviceId: null,
    displayName: 'Test Player',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  beforeEach(() => {
    mockDatabases = {
      createDocument: jasmine.createSpy('createDocument'),
      listDocuments: jasmine.createSpy('listDocuments'),
      getDocument: jasmine.createSpy('getDocument'),
      updateDocument: jasmine.createSpy('updateDocument'),
      deleteDocument: jasmine.createSpy('deleteDocument'),
    };

    mockAppwriteService = jasmine.createSpyObj('AppwriteService', [], {
      databases: mockDatabases,
      databaseId: 'fug',
    });

    TestBed.configureTestingModule({
      providers: [MemberService, { provide: AppwriteService, useValue: mockAppwriteService }],
    });

    service = TestBed.inject(MemberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signals', () => {
    it('should have members signal initialized to empty array', () => {
      expect(service.members()).toEqual([]);
    });

    it('should have currentMember signal initialized to null', () => {
      expect(service.currentMember()).toBeNull();
    });
  });

  describe('createMember', () => {
    it('should create a new member and add to members signal', async () => {
      const createdDocument = {
        ...mockMemberDocument,
        $id: 'newMember123',
        gameStats: '{}',
      };
      mockDatabases.createDocument.and.resolveTo(createdDocument);

      const result = await service.createMember(mockCreateMemberData);

      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        'fug',
        'fug_game_members',
        jasmine.any(String),
        jasmine.objectContaining({
          roomId: 'room456',
          userId: 'user789',
          displayName: 'Test Player',
          gameStats: '{}',
        })
      );
      expect(result.$id).toBe('newMember123');
      expect(service.members().length).toBe(1);
      expect(service.members()[0].$id).toBe('newMember123');
    });

    it('should serialize gameStats to JSON string', async () => {
      const dataWithStats: CreateMemberData = {
        ...mockCreateMemberData,
        gameStats: { ketal: { sipsGiven: 5, sipsTaken: 3, gamesPlayed: 1 } },
      };
      mockDatabases.createDocument.and.resolveTo({
        ...mockMemberDocument,
        gameStats: JSON.stringify(dataWithStats.gameStats),
      });

      await service.createMember(dataWithStats);

      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        'fug',
        'fug_game_members',
        jasmine.any(String),
        jasmine.objectContaining({
          gameStats: JSON.stringify(dataWithStats.gameStats),
        })
      );
    });

    it('should throw error when creation fails', async () => {
      const error = new Error('Database error');
      mockDatabases.createDocument.and.rejectWith(error);

      await expectAsync(service.createMember(mockCreateMemberData)).toBeRejectedWithError(
        'Failed to create member: Database error'
      );
    });

    it('should throw error with generic message for unknown errors', async () => {
      mockDatabases.createDocument.and.rejectWith('Unknown error type');

      await expectAsync(service.createMember(mockCreateMemberData)).toBeRejectedWithError(
        'Failed to create member: Unknown error'
      );
    });
  });

  describe('getMembersByRoom', () => {
    it('should fetch members for a room and update signal', async () => {
      const member2Document = {
        ...mockMemberDocument,
        $id: 'member456',
        displayName: 'Player 2',
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument, member2Document],
        total: 2,
      });

      const result = await service.getMembersByRoom('room456');

      expect(mockDatabases.listDocuments).toHaveBeenCalledWith('fug', 'fug_game_members', [
        jasmine.objectContaining({ method: 'equal', attribute: 'roomId', values: ['room456'] }),
        jasmine.objectContaining({ method: 'limit', values: [100] }),
      ]);
      expect(result.length).toBe(2);
      expect(result[0].$id).toBe('member123');
      expect(result[1].$id).toBe('member456');
      expect(service.members().length).toBe(2);
    });

    it('should return empty array when no members found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [],
        total: 0,
      });

      const result = await service.getMembersByRoom('emptyRoom');

      expect(result).toEqual([]);
      expect(service.members()).toEqual([]);
    });

    it('should parse gameStats JSON string from documents', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });

      const result = await service.getMembersByRoom('room456');

      expect(result[0].gameStats).toEqual({
        ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
      });
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Network error');
      mockDatabases.listDocuments.and.rejectWith(error);

      await expectAsync(service.getMembersByRoom('room456')).toBeRejectedWithError(
        'Failed to get members for room: Network error'
      );
    });
  });

  describe('getMemberByUserOrDevice', () => {
    it('should return null when neither userId nor deviceId provided', async () => {
      const result = await service.getMemberByUserOrDevice('room456');

      expect(result).toBeNull();
      expect(mockDatabases.listDocuments).not.toHaveBeenCalled();
    });

    it('should find member by userId', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });

      const result = await service.getMemberByUserOrDevice('room456', 'user789');

      expect(mockDatabases.listDocuments).toHaveBeenCalledWith('fug', 'fug_game_members', [
        jasmine.objectContaining({ method: 'equal', attribute: 'roomId', values: ['room456'] }),
        jasmine.objectContaining({ method: 'limit', values: [1] }),
        jasmine.objectContaining({ method: 'equal', attribute: 'userId', values: ['user789'] }),
      ]);
      expect(result).not.toBeNull();
      expect(result!.$id).toBe('member123');
    });

    it('should find member by deviceId when userId search fails', async () => {
      mockDatabases.listDocuments.and.callFake(async (_db: string, _collection: string, queries: Array<{ attribute: string }>) => {
        const hasUserId = queries.some((q) => q.attribute === 'userId');
        if (hasUserId) {
          return { documents: [], total: 0 };
        }
        return {
          documents: [{ ...mockMemberDocument, userId: null, deviceId: 'device123' }],
          total: 1,
        };
      });

      const result = await service.getMemberByUserOrDevice('room456', 'user789', 'device123');

      expect(result).not.toBeNull();
      expect(result!.deviceId).toBe('device123');
    });

    it('should find member by deviceId only', async () => {
      const deviceMemberDocument = {
        ...mockMemberDocument,
        userId: null,
        deviceId: 'device123',
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [deviceMemberDocument],
        total: 1,
      });

      const result = await service.getMemberByUserOrDevice('room456', undefined, 'device123');

      expect(mockDatabases.listDocuments).toHaveBeenCalledWith('fug', 'fug_game_members', [
        jasmine.objectContaining({ method: 'equal', attribute: 'roomId', values: ['room456'] }),
        jasmine.objectContaining({ method: 'limit', values: [1] }),
        jasmine.objectContaining({ method: 'equal', attribute: 'deviceId', values: ['device123'] }),
      ]);
      expect(result).not.toBeNull();
    });

    it('should return null when member not found', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [],
        total: 0,
      });

      const result = await service.getMemberByUserOrDevice('room456', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when query fails', async () => {
      const error = new Error('Query error');
      mockDatabases.listDocuments.and.rejectWith(error);

      await expectAsync(service.getMemberByUserOrDevice('room456', 'user789')).toBeRejectedWithError(
        'Failed to find member: Query error'
      );
    });
  });

  describe('updateMember', () => {
    it('should update member and return updated data', async () => {
      const updatedDocument = {
        ...mockMemberDocument,
        displayName: 'Updated Name',
      };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      const result = await service.updateMember('member123', { displayName: 'Updated Name' });

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith('fug', 'fug_game_members', 'member123', {
        displayName: 'Updated Name',
      });
      expect(result.displayName).toBe('Updated Name');
    });

    it('should serialize gameStats when updating', async () => {
      const newGameStats = { ketal: { sipsGiven: 15, sipsTaken: 8, gamesPlayed: 3 } };
      mockDatabases.updateDocument.and.resolveTo({
        ...mockMemberDocument,
        gameStats: JSON.stringify(newGameStats),
      });

      await service.updateMember('member123', { gameStats: newGameStats });

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith('fug', 'fug_game_members', 'member123', {
        gameStats: JSON.stringify(newGameStats),
      });
    });

    it('should update members signal with updated member', async () => {
      // First, populate the members signal
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });
      await service.getMembersByRoom('room456');

      // Now update
      const updatedDocument = {
        ...mockMemberDocument,
        displayName: 'Updated Name',
      };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      await service.updateMember('member123', { displayName: 'Updated Name' });

      expect(service.members()[0].displayName).toBe('Updated Name');
    });

    it('should update currentMember signal if it matches', async () => {
      service.setCurrentMember(mockMember);

      const updatedDocument = {
        ...mockMemberDocument,
        isOnline: false,
      };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      await service.updateMember('member123', { isOnline: false });

      expect(service.currentMember()!.isOnline).toBe(false);
    });

    it('should not update currentMember signal if it does not match', async () => {
      service.setCurrentMember(mockMember);

      const updatedDocument = {
        ...mockMemberDocument,
        $id: 'otherMember',
        isOnline: false,
      };
      mockDatabases.updateDocument.and.resolveTo(updatedDocument);

      await service.updateMember('otherMember', { isOnline: false });

      expect(service.currentMember()!.isOnline).toBe(true);
    });

    it('should throw error when update fails', async () => {
      const error = new Error('Update failed');
      mockDatabases.updateDocument.and.rejectWith(error);

      await expectAsync(service.updateMember('member123', { displayName: 'New Name' })).toBeRejectedWithError(
        'Failed to update member: Update failed'
      );
    });
  });

  describe('updateMemberStats', () => {
    const newStats: GameStats = {
      sipsGiven: 15,
      sipsTaken: 8,
      gamesPlayed: 3,
    };

    it('should update member stats and totals', async () => {
      mockDatabases.getDocument.and.resolveTo(mockMemberDocument);
      mockDatabases.updateDocument.and.resolveTo({
        ...mockMemberDocument,
        totalSipsGiven: 15,
        totalSipsTaken: 8,
        totalGamesPlayed: 3,
        gameStats: JSON.stringify({ ketal: newStats }),
      });

      await service.updateMemberStats('member123', 'ketal', newStats);

      expect(mockDatabases.getDocument).toHaveBeenCalledWith('fug', 'fug_game_members', 'member123');
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        'fug',
        'fug_game_members',
        'member123',
        jasmine.objectContaining({
          totalSipsGiven: 15,
          totalSipsTaken: 8,
          totalGamesPlayed: 3,
        })
      );
    });

    it('should calculate deltas correctly from previous stats', async () => {
      mockDatabases.getDocument.and.resolveTo(mockMemberDocument);
      mockDatabases.updateDocument.and.resolveTo({
        ...mockMemberDocument,
        gameStats: JSON.stringify({ ketal: newStats }),
      });

      await service.updateMemberStats('member123', 'ketal', newStats);

      // Previous: sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2
      // New: sipsGiven: 15, sipsTaken: 8, gamesPlayed: 3
      // Delta: +5, +3, +1
      // New totals: 10+5=15, 5+3=8, 2+1=3
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        'fug',
        'fug_game_members',
        'member123',
        jasmine.objectContaining({
          totalSipsGiven: 15,
          totalSipsTaken: 8,
          totalGamesPlayed: 3,
        })
      );
    });

    it('should add new game stats when game does not exist', async () => {
      mockDatabases.getDocument.and.resolveTo(mockMemberDocument);
      mockDatabases.updateDocument.and.resolveTo({
        ...mockMemberDocument,
        gameStats: JSON.stringify({
          ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
          newGame: { sipsGiven: 5, sipsTaken: 3, gamesPlayed: 1 },
        }),
      });

      const newGameStats: GameStats = { sipsGiven: 5, sipsTaken: 3, gamesPlayed: 1 };
      await service.updateMemberStats('member123', 'newGame', newGameStats);

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        'fug',
        'fug_game_members',
        'member123',
        jasmine.objectContaining({
          totalSipsGiven: 15,
          totalSipsTaken: 8,
          totalGamesPlayed: 3,
        })
      );
    });

    it('should throw error when get document fails', async () => {
      const error = new Error('Document not found');
      mockDatabases.getDocument.and.rejectWith(error);

      await expectAsync(service.updateMemberStats('member123', 'ketal', newStats)).toBeRejectedWithError(
        'Failed to update member stats: Document not found'
      );
    });

    it('should throw error when update fails', async () => {
      mockDatabases.getDocument.and.resolveTo(mockMemberDocument);
      const error = new Error('Update failed');
      mockDatabases.updateDocument.and.rejectWith(error);

      await expectAsync(service.updateMemberStats('member123', 'ketal', newStats)).toBeRejectedWithError(
        'Failed to update member: Update failed'
      );
    });
  });

  describe('deleteMember', () => {
    it('should delete member from database', async () => {
      mockDatabases.deleteDocument.and.resolveTo({});

      await service.deleteMember('member123');

      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith('fug', 'fug_game_members', 'member123');
    });

    it('should remove member from members signal', async () => {
      // First, populate the members signal
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });
      await service.getMembersByRoom('room456');
      expect(service.members().length).toBe(1);

      // Now delete
      mockDatabases.deleteDocument.and.resolveTo({});
      await service.deleteMember('member123');

      expect(service.members().length).toBe(0);
    });

    it('should clear currentMember signal if it matches deleted member', async () => {
      service.setCurrentMember(mockMember);
      expect(service.currentMember()).not.toBeNull();

      mockDatabases.deleteDocument.and.resolveTo({});
      await service.deleteMember('member123');

      expect(service.currentMember()).toBeNull();
    });

    it('should not clear currentMember signal if it does not match', async () => {
      service.setCurrentMember(mockMember);

      mockDatabases.deleteDocument.and.resolveTo({});
      await service.deleteMember('otherMember');

      expect(service.currentMember()).not.toBeNull();
    });

    it('should throw error when deletion fails', async () => {
      const error = new Error('Delete failed');
      mockDatabases.deleteDocument.and.rejectWith(error);

      await expectAsync(service.deleteMember('member123')).toBeRejectedWithError(
        'Failed to delete member: Delete failed'
      );
    });
  });

  describe('setOnlineStatus', () => {
    it('should update member online status', async () => {
      mockDatabases.updateDocument.and.resolveTo({
        ...mockMemberDocument,
        isOnline: false,
      });

      await service.setOnlineStatus('member123', false);

      expect(mockDatabases.updateDocument).toHaveBeenCalledWith('fug', 'fug_game_members', 'member123', {
        isOnline: false,
      });
    });

    it('should throw error when update fails', async () => {
      const error = new Error('Status update failed');
      mockDatabases.updateDocument.and.rejectWith(error);

      await expectAsync(service.setOnlineStatus('member123', true)).toBeRejectedWithError(
        'Failed to set online status: Failed to update member: Status update failed'
      );
    });
  });

  describe('setCurrentMember', () => {
    it('should set current member', () => {
      service.setCurrentMember(mockMember);

      expect(service.currentMember()).toEqual(mockMember);
    });

    it('should clear current member when null is passed', () => {
      service.setCurrentMember(mockMember);
      service.setCurrentMember(null);

      expect(service.currentMember()).toBeNull();
    });
  });

  describe('clearMembers', () => {
    it('should clear members signal', async () => {
      // First, populate the members signal
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });
      await service.getMembersByRoom('room456');
      expect(service.members().length).toBe(1);

      service.clearMembers();

      expect(service.members()).toEqual([]);
    });

    it('should clear currentMember signal', () => {
      service.setCurrentMember(mockMember);
      expect(service.currentMember()).not.toBeNull();

      service.clearMembers();

      expect(service.currentMember()).toBeNull();
    });
  });

  describe('mapDocumentToMember (via public methods)', () => {
    it('should handle gameStats as JSON string', async () => {
      mockDatabases.listDocuments.and.resolveTo({
        documents: [mockMemberDocument],
        total: 1,
      });

      const result = await service.getMembersByRoom('room456');

      expect(result[0].gameStats).toEqual({
        ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
      });
    });

    it('should handle gameStats as object', async () => {
      const documentWithObjectStats = {
        ...mockMemberDocument,
        gameStats: { ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 } },
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [documentWithObjectStats],
        total: 1,
      });

      const result = await service.getMembersByRoom('room456');

      expect(result[0].gameStats).toEqual({
        ketal: { sipsGiven: 10, sipsTaken: 5, gamesPlayed: 2 },
      });
    });

    it('should handle invalid JSON in gameStats', async () => {
      const documentWithInvalidStats = {
        ...mockMemberDocument,
        gameStats: 'invalid json',
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [documentWithInvalidStats],
        total: 1,
      });

      const result = await service.getMembersByRoom('room456');

      expect(result[0].gameStats).toEqual({});
    });

    it('should handle null/undefined fields with defaults', async () => {
      const minimalDocument = {
        $id: 'member123',
        roomId: 'room456',
        displayName: 'Test',
        userId: null,
        deviceId: null,
        role: null,
        isOnline: null,
        totalSipsGiven: null,
        totalSipsTaken: null,
        totalGamesPlayed: null,
        gameStats: null,
      };
      mockDatabases.listDocuments.and.resolveTo({
        documents: [minimalDocument],
        total: 1,
      });

      const result = await service.getMembersByRoom('room456');

      expect(result[0].role).toBe('player');
      expect(result[0].isOnline).toBe(false);
      expect(result[0].totalSipsGiven).toBe(0);
      expect(result[0].totalSipsTaken).toBe(0);
      expect(result[0].totalGamesPlayed).toBe(0);
      expect(result[0].gameStats).toEqual({});
    });
  });
});
