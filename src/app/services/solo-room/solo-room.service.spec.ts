import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SoloRoomService } from './solo-room.service';
import { RoomService, GameRoom } from '../room/room.service';
import { KetalSessionService, KetalSession } from '../ketal-session/ketal-session.service';
import {
  createMockRoomService,
  createMockKetalSessionService,
  createMockGameRoom,
  createMockKetalSession,
} from '../../testing/test-helpers';

describe('SoloRoomService', () => {
  let service: SoloRoomService;
  let mockRoomService: ReturnType<typeof createMockRoomService>;
  let mockKetalSessionService: ReturnType<typeof createMockKetalSessionService>;

  beforeEach(() => {
    mockRoomService = createMockRoomService();
    mockKetalSessionService = createMockKetalSessionService();

    TestBed.configureTestingModule({
      providers: [
        SoloRoomService,
        { provide: RoomService, useValue: mockRoomService },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
      ],
    });

    service = TestBed.inject(SoloRoomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have localModeFallback set to false', () => {
      expect(service.localModeFallback()).toBeFalse();
    });

    it('should have isCreating set to false', () => {
      expect(service.isCreating()).toBeFalse();
    });
  });

  describe('startBackgroundRoomCreation', () => {
    it('should call createSoloRoom on RoomService', () => {
      const mockRoom = createMockGameRoom({ mode: 'solo' });
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom').and.resolveTo(mockRoom);

      service.startBackgroundRoomCreation();

      expect(mockRoomService.createSoloRoom).toHaveBeenCalled();
    });

    it('should set isCreating to true while creating', () => {
      const mockRoom = createMockGameRoom({ mode: 'solo' });
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom').and.resolveTo(mockRoom);

      service.startBackgroundRoomCreation();

      expect(service.isCreating()).toBeTrue();
    });

    it('should not create if a room already exists', () => {
      mockRoomService.currentRoom.set(createMockGameRoom());
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom');

      service.startBackgroundRoomCreation();

      expect(mockRoomService.createSoloRoom).not.toHaveBeenCalled();
    });

    it('should not create if already in progress', () => {
      const mockRoom = createMockGameRoom({ mode: 'solo' });
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom').and.resolveTo(mockRoom);

      service.startBackgroundRoomCreation();
      service.startBackgroundRoomCreation();

      expect(mockRoomService.createSoloRoom).toHaveBeenCalledTimes(1);
    });

    it('should set localModeFallback on failure', async () => {
      mockRoomService.createSoloRoom = jasmine
        .createSpy('createSoloRoom')
        .and.rejectWith(new Error('Network error'));

      service.startBackgroundRoomCreation();

      // Wait for the promise to settle
      await service.awaitRoom();

      expect(service.localModeFallback()).toBeTrue();
    });
  });

  describe('awaitRoom', () => {
    it('should return the room when creation succeeds', async () => {
      const mockRoom = createMockGameRoom({ mode: 'solo' });
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom').and.resolveTo(mockRoom);

      service.startBackgroundRoomCreation();
      const result = await service.awaitRoom();

      expect(result).toEqual(mockRoom);
    });

    it('should return null when creation fails', async () => {
      mockRoomService.createSoloRoom = jasmine
        .createSpy('createSoloRoom')
        .and.rejectWith(new Error('Network error'));

      service.startBackgroundRoomCreation();
      const result = await service.awaitRoom();

      expect(result).toBeNull();
    });

    it('should return null when no creation was started and no room exists', async () => {
      const result = await service.awaitRoom();

      expect(result).toBeNull();
    });

    it('should return existing room when no creation was started', async () => {
      const mockRoom = createMockGameRoom();
      mockRoomService.currentRoom.set(mockRoom);

      const result = await service.awaitRoom();

      expect(result).toEqual(mockRoom);
    });

    it('should return null when localModeFallback is set', async () => {
      mockRoomService.createSoloRoom = jasmine
        .createSpy('createSoloRoom')
        .and.rejectWith(new Error('Failed'));

      service.startBackgroundRoomCreation();

      // Wait for promise to settle
      try {
        await service.awaitRoom();
      } catch {
        // Expected
      }

      // Now the fallback should be set
      const result = await service.awaitRoom();
      expect(result).toBeNull();
    });
  });

  describe('checkActiveSession', () => {
    it('should return current session if active', async () => {
      const mockSession = createMockKetalSession({ status: 'playing' });
      mockKetalSessionService.currentSession.set(mockSession);

      const result = await service.checkActiveSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null if current session is finished', async () => {
      const mockSession = createMockKetalSession({ status: 'finished' });
      mockKetalSessionService.currentSession.set(mockSession);

      const result = await service.checkActiveSession();

      expect(result).toBeNull();
    });

    it('should fetch session from room if room has currentSessionId', async () => {
      const mockSession = createMockKetalSession({ status: 'playing' });
      const mockRoom = createMockGameRoom({ currentSessionId: 'session-123' });
      mockRoomService.currentRoom.set(mockRoom);
      mockKetalSessionService.getSession.and.resolveTo(mockSession);

      const result = await service.checkActiveSession();

      expect(mockKetalSessionService.getSession).toHaveBeenCalledWith('session-123');
      expect(result).toEqual(mockSession);
    });

    it('should return null if no current session and no room', async () => {
      const result = await service.checkActiveSession();

      expect(result).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const mockRoom = createMockGameRoom({ mode: 'solo' });
      mockRoomService.createSoloRoom = jasmine.createSpy('createSoloRoom').and.resolveTo(mockRoom);

      service.startBackgroundRoomCreation();
      await service.awaitRoom();

      service.reset();

      expect(service.localModeFallback()).toBeFalse();
      expect(service.isCreating()).toBeFalse();
    });
  });
});
