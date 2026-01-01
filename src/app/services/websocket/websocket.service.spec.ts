import { TestBed } from '@angular/core/testing';
import { Socket } from 'ngx-socket-io';
import { of, Subject } from 'rxjs';
import { Room } from 'src/app/_shared/_models/room.model';
import { WebsocketService } from './websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;
  let mockSocket: jasmine.SpyObj<Socket>;

  beforeEach(() => {
    // Create a mock Socket with spies for the methods used in the service
    mockSocket = jasmine.createSpyObj('Socket', ['fromEvent', 'emit']);
    mockSocket.fromEvent.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [WebsocketService, { provide: Socket, useValue: mockSocket }],
    });
    service = TestBed.inject(WebsocketService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should inject Socket dependency', () => {
      expect(mockSocket).toBeTruthy();
    });
  });

  describe('getRooms()', () => {
    it('should return an observable from socket "rooms" event', (done) => {
      const mockRooms: Room[] = [
        {
          id: '1',
          name: 'Room 1',
          description: 'Test room 1',
        },
        {
          id: '2',
          name: 'Room 2',
          description: 'Test room 2',
        },
      ];

      mockSocket.fromEvent.and.returnValue(of(mockRooms));

      service.getRooms().subscribe((rooms) => {
        expect(rooms).toEqual(mockRooms);
        expect(mockSocket.fromEvent).toHaveBeenCalledWith('rooms');
        done();
      });
    });

    it('should call socket.fromEvent with correct event name', () => {
      service.getRooms();
      expect(mockSocket.fromEvent).toHaveBeenCalledWith('rooms');
    });

    it('should emit multiple room updates', (done) => {
      const roomsSubject = new Subject<Room[]>();
      mockSocket.fromEvent.and.returnValue(roomsSubject.asObservable());

      const emittedValues: Room[][] = [];

      service.getRooms().subscribe((rooms) => {
        emittedValues.push(rooms);

        if (emittedValues.length === 2) {
          expect(emittedValues[0]).toEqual([{ id: '1', name: 'Room 1', description: 'Initial rooms' }]);
          expect(emittedValues[1]).toEqual([
            { id: '1', name: 'Room 1', description: 'Initial rooms' },
            { id: '2', name: 'Room 2', description: 'Added room' },
          ]);
          done();
        }
      });

      roomsSubject.next([{ id: '1', name: 'Room 1', description: 'Initial rooms' }]);
      roomsSubject.next([
        { id: '1', name: 'Room 1', description: 'Initial rooms' },
        { id: '2', name: 'Room 2', description: 'Added room' },
      ]);
    });

    it('should handle empty room list', (done) => {
      mockSocket.fromEvent.and.returnValue(of([]));

      service.getRooms().subscribe((rooms) => {
        expect(rooms).toEqual([]);
        expect(rooms.length).toBe(0);
        done();
      });
    });

    it('should handle rooms with optional game property', (done) => {
      const mockGame = {
        players: [],
        turn: 1,
        maxTurnCount: 10,
        phase: 1,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 1,
        summary: false,
      };

      const mockRoomsWithGame: Room[] = [
        {
          id: '1',
          name: 'Room 1',
          description: 'Test room with game',
          game: mockGame,
        },
      ];

      mockSocket.fromEvent.and.returnValue(of(mockRoomsWithGame));

      service.getRooms().subscribe((rooms) => {
        expect(rooms[0].game).toBeDefined();
        expect(rooms[0].game?.turn).toBe(1);
        expect(rooms[0].game?.status).toBe(1);
        done();
      });
    });
  });

  describe('createRoom()', () => {
    it('should emit "create-room" event with room data', () => {
      const room: Room = {
        id: 'new-room',
        name: 'New Room',
        description: 'A brand new room',
      };

      service.createRoom(room);

      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', room);
    });

    it('should pass room object exactly as provided', () => {
      const room: Room = {
        id: 'room-123',
        name: 'Test Room',
        description: 'Test Description',
      };

      service.createRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[0]).toBe('create-room');
      expect(callArgs[1]).toBe(room);
      expect(callArgs[1].id).toBe('room-123');
      expect(callArgs[1].name).toBe('Test Room');
      expect(callArgs[1].description).toBe('Test Description');
    });

    it('should emit with room containing game property', () => {
      const mockGame = {
        players: [],
        turn: 1,
        maxTurnCount: 10,
        phase: 1,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 1,
        summary: false,
      };

      const room: Room = {
        id: 'room-with-game',
        name: 'Room with Game',
        description: 'Test room',
        game: mockGame,
      };

      service.createRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[1].game).toBeDefined();
      expect(callArgs[1].game?.status).toBe(1);
    });

    it('should not return any value', () => {
      const room: Room = {
        id: '1',
        name: 'Test',
        description: 'Test',
      };

      const result = service.createRoom(room);

      expect(result).toBeUndefined();
    });

    it('should handle multiple createRoom calls independently', () => {
      const room1: Room = {
        id: '1',
        name: 'Room 1',
        description: 'First room',
      };

      const room2: Room = {
        id: '2',
        name: 'Room 2',
        description: 'Second room',
      };

      service.createRoom(room1);
      service.createRoom(room2);

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', room1);
      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', room2);
    });
  });

  describe('joinRoom()', () => {
    it('should emit "join-room" event with room data', () => {
      const room: Room = {
        id: 'room-to-join',
        name: 'Room to Join',
        description: 'Join this room',
      };

      service.joinRoom(room);

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', room);
    });

    it('should pass room object exactly as provided', () => {
      const room: Room = {
        id: 'room-456',
        name: 'Join Room',
        description: 'Join Description',
      };

      service.joinRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[0]).toBe('join-room');
      expect(callArgs[1]).toBe(room);
      expect(callArgs[1].id).toBe('room-456');
      expect(callArgs[1].name).toBe('Join Room');
    });

    it('should emit with room containing game property', () => {
      const mockGame = {
        players: [],
        turn: 1,
        maxTurnCount: 10,
        phase: 1,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 2,
        summary: false,
      };

      const room: Room = {
        id: 'room-with-game',
        name: 'Room with Game',
        description: 'Test room',
        game: mockGame,
      };

      service.joinRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[1].game).toBeDefined();
      expect(callArgs[1].game?.status).toBe(2);
    });

    it('should not return any value', () => {
      const room: Room = {
        id: '1',
        name: 'Test',
        description: 'Test',
      };

      const result = service.joinRoom(room);

      expect(result).toBeUndefined();
    });

    it('should handle multiple joinRoom calls independently', () => {
      const room1: Room = {
        id: '1',
        name: 'Room 1',
        description: 'First room to join',
      };

      const room2: Room = {
        id: '2',
        name: 'Room 2',
        description: 'Second room to join',
      };

      service.joinRoom(room1);
      service.joinRoom(room2);

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', room1);
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', room2);
    });
  });

  describe('deleteRoom()', () => {
    it('should emit "delete-room" event with room data', () => {
      const room: Room = {
        id: 'room-to-delete',
        name: 'Room to Delete',
        description: 'Delete this room',
      };

      service.deleteRoom(room);

      expect(mockSocket.emit).toHaveBeenCalledWith('delete-room', room);
    });

    it('should pass room object exactly as provided', () => {
      const room: Room = {
        id: 'room-789',
        name: 'Delete Room',
        description: 'Delete Description',
      };

      service.deleteRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[0]).toBe('delete-room');
      expect(callArgs[1]).toBe(room);
      expect(callArgs[1].id).toBe('room-789');
      expect(callArgs[1].name).toBe('Delete Room');
    });

    it('should emit with room containing game property', () => {
      const mockGame = {
        players: [],
        turn: 1,
        maxTurnCount: 10,
        phase: 1,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 3,
        summary: false,
      };

      const room: Room = {
        id: 'room-with-game',
        name: 'Room with Game',
        description: 'Test room',
        game: mockGame,
      };

      service.deleteRoom(room);

      const callArgs = mockSocket.emit.calls.mostRecent().args;
      expect(callArgs[1].game).toBeDefined();
      expect(callArgs[1].game?.status).toBe(3);
    });

    it('should not return any value', () => {
      const room: Room = {
        id: '1',
        name: 'Test',
        description: 'Test',
      };

      const result = service.deleteRoom(room);

      expect(result).toBeUndefined();
    });

    it('should handle multiple deleteRoom calls independently', () => {
      const room1: Room = {
        id: '1',
        name: 'Room 1',
        description: 'First room to delete',
      };

      const room2: Room = {
        id: '2',
        name: 'Room 2',
        description: 'Second room to delete',
      };

      service.deleteRoom(room1);
      service.deleteRoom(room2);

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('delete-room', room1);
      expect(mockSocket.emit).toHaveBeenCalledWith('delete-room', room2);
    });
  });

  describe('Socket Integration', () => {
    it('should use the same socket instance for all operations', () => {
      const room: Room = {
        id: '1',
        name: 'Test',
        description: 'Test',
      };

      service.getRooms();
      service.createRoom(room);
      service.joinRoom(room);
      service.deleteRoom(room);

      expect(mockSocket.fromEvent).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalled();
    });

    it('should emit correct event names for each operation', () => {
      const room: Room = {
        id: '1',
        name: 'Test',
        description: 'Test',
      };

      service.createRoom(room);
      service.joinRoom(room);
      service.deleteRoom(room);

      const emitCalls = mockSocket.emit.calls.all();
      expect(emitCalls[0].args[0]).toBe('create-room');
      expect(emitCalls[1].args[0]).toBe('join-room');
      expect(emitCalls[2].args[0]).toBe('delete-room');
    });
  });
});
