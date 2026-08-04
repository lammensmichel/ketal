import { TestBed } from '@angular/core/testing';
import { SipEventService } from './sip-event.service';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RoomService } from '../room/room.service';
import { KetalSessionService } from '../ketal-session/ketal-session.service';
import { MemberService } from '../member/member.service';
import {
  createMockRoomService,
  createMockKetalSessionService,
  createMockMemberService,
  createMockGameRoom,
  createMockKetalSession,
} from '../../testing/test-helpers';
import { GameMember } from '../member/member.service';
import { SipExchange } from '../../_shared/_models/sip-exchange.model';

function createTestMember(overrides: Partial<GameMember> = {}): GameMember {
  return {
    $id: 'member-1',
    roomId: 'room-123',
    userId: 'user-1',
    deviceId: null,
    displayName: 'Alice',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
    ...overrides,
  };
}

function createExchange(overrides: Partial<SipExchange> = {}): SipExchange {
  return {
    fromPlayerId: 'member-1',
    toPlayerId: 'member-2',
    sips: 3,
    at: '2026-08-04T16:00:00.000Z',
    ...overrides,
  };
}

describe('SipEventService', () => {
  let service: SipEventService;
  let mockRoomService: ReturnType<typeof createMockRoomService>;
  let mockKetalSessionService: ReturnType<typeof createMockKetalSessionService>;
  let mockMemberService: ReturnType<typeof createMockMemberService>;
  let createDocument: jasmine.Spy;

  beforeEach(() => {
    mockRoomService = createMockRoomService();
    mockKetalSessionService = createMockKetalSessionService();
    mockMemberService = createMockMemberService();
    createDocument = jasmine.createSpy('createDocument').and.resolveTo({ $id: 'event-1' });

    TestBed.configureTestingModule({
      providers: [
        SipEventService,
        { provide: AppwriteService, useValue: { databases: { createDocument }, databaseId: 'fug' } },
        { provide: RoomService, useFactory: () => mockRoomService },
        { provide: KetalSessionService, useValue: mockKetalSessionService },
        { provide: MemberService, useValue: mockMemberService },
      ],
    });

    service = TestBed.inject(SipEventService);
  });

  /** Place le service en mode room : un roomId ET un sessionId disponibles. */
  function withRoomAndSession(): void {
    mockRoomService.currentRoom.set(createMockGameRoom({ $id: 'room-123' }));
    mockKetalSessionService.currentSession.set(createMockKetalSession({ $id: 'session-123', gameNumber: 2 }));
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('room mode requirements', () => {
    it('should not write anything without a room (local mode)', async () => {
      mockRoomService.currentRoom.set(null);
      mockKetalSessionService.currentSession.set(createMockKetalSession({ $id: 'session-123' }));

      await service.recordExchanges([createExchange()]);

      expect(createDocument).not.toHaveBeenCalled();
    });

    it('should not write anything without a session (local mode)', async () => {
      mockRoomService.currentRoom.set(createMockGameRoom({ $id: 'room-123' }));
      mockKetalSessionService.currentSession.set(null);

      await service.recordExchanges([createExchange()]);

      expect(createDocument).not.toHaveBeenCalled();
    });

    it('should do nothing for an empty list', async () => {
      withRoomAndSession();

      await service.recordExchanges([]);

      expect(createDocument).not.toHaveBeenCalled();
    });
  });

  describe('payload shape', () => {
    it('should write the room/session context and the exchange itself', async () => {
      withRoomAndSession();
      mockMemberService.members.set([]);

      await service.recordExchanges([createExchange({ fromPlayerId: 'm-a', toPlayerId: 'm-b', sips: 5 })]);

      expect(createDocument).toHaveBeenCalledTimes(1);
      const args = createDocument.calls.mostRecent().args[0];
      expect(args.databaseId).toBe('fug');
      expect(args.collectionId).toBe('ketal_sip_events');
      expect(args.data).toEqual(
        jasmine.objectContaining({
          sessionId: 'session-123',
          roomId: 'room-123',
          fromPlayerId: 'm-a',
          toPlayerId: 'm-b',
          sips: 5,
          gameNumber: 2,
          createdAt: '2026-08-04T16:00:00.000Z',
        })
      );
    });

    it('should write one document per exchange', async () => {
      withRoomAndSession();
      mockMemberService.members.set([]);

      await service.recordExchanges([
        createExchange({ toPlayerId: 'm-b', sips: 1 }),
        createExchange({ toPlayerId: 'm-c', sips: 2 }),
      ]);

      expect(createDocument).toHaveBeenCalledTimes(2);
    });

    it('should filter out 0-sip entries and self-gifts before writing', async () => {
      withRoomAndSession();
      mockMemberService.members.set([]);

      await service.recordExchanges([
        createExchange({ fromPlayerId: 'm-a', toPlayerId: 'm-b', sips: 0 }),
        createExchange({ fromPlayerId: 'm-a', toPlayerId: 'm-a', sips: 4 }),
        createExchange({ fromPlayerId: 'm-a', toPlayerId: 'm-c', sips: 2 }),
      ]);

      expect(createDocument).toHaveBeenCalledTimes(1);
      expect(createDocument.calls.mostRecent().args[0].data.toPlayerId).toBe('m-c');
    });
  });

  describe('userId resolution', () => {
    it('should fill fromUserId and toUserId when both members have an account', async () => {
      withRoomAndSession();
      mockMemberService.members.set([
        createTestMember({ $id: 'member-1', userId: 'user-1' }),
        createTestMember({ $id: 'member-2', userId: 'user-2' }),
      ]);

      await service.recordExchanges([createExchange({ fromPlayerId: 'member-1', toPlayerId: 'member-2' })]);

      const data = createDocument.calls.mostRecent().args[0].data;
      expect(data.fromUserId).toBe('user-1');
      expect(data.toUserId).toBe('user-2');
    });

    it('should still write the event without the userId fields for a guest member', async () => {
      withRoomAndSession();
      // Un invite anonyme n'a pas de compte : userId null, seul deviceId existe
      mockMemberService.members.set([
        createTestMember({ $id: 'member-1', userId: null, deviceId: 'device-1' }),
        createTestMember({ $id: 'member-2', userId: null, deviceId: 'device-2' }),
      ]);

      await service.recordExchanges([createExchange({ fromPlayerId: 'member-1', toPlayerId: 'member-2' })]);

      expect(createDocument).toHaveBeenCalledTimes(1);
      const data = createDocument.calls.mostRecent().args[0].data;
      expect('fromUserId' in data).toBe(false);
      expect('toUserId' in data).toBe(false);
      // L'evenement reste comptabilise par room
      expect(data.fromPlayerId).toBe('member-1');
      expect(data.sips).toBe(3);
    });

    it('should fill only the resolvable side of a mixed account/guest pair', async () => {
      withRoomAndSession();
      mockMemberService.members.set([
        createTestMember({ $id: 'member-1', userId: 'user-1' }),
        createTestMember({ $id: 'member-2', userId: null, deviceId: 'device-2' }),
      ]);

      await service.recordExchanges([createExchange({ fromPlayerId: 'member-1', toPlayerId: 'member-2' })]);

      const data = createDocument.calls.mostRecent().args[0].data;
      expect(data.fromUserId).toBe('user-1');
      expect('toUserId' in data).toBe(false);
    });

    it('should omit the userId fields for a purely local player with no member document', async () => {
      withRoomAndSession();
      mockMemberService.members.set([createTestMember({ $id: 'member-1', userId: 'user-1' })]);

      await service.recordExchanges([createExchange({ fromPlayerId: 'uuid-local-a', toPlayerId: 'uuid-local-b' })]);

      expect(createDocument).toHaveBeenCalledTimes(1);
      const data = createDocument.calls.mostRecent().args[0].data;
      expect('fromUserId' in data).toBe(false);
      expect('toUserId' in data).toBe(false);
    });
  });

  describe('failure tolerance', () => {
    it('should not reject when Appwrite fails', async () => {
      withRoomAndSession();
      mockMemberService.members.set([]);
      createDocument.and.rejectWith(new Error('network down'));

      await expectAsync(service.recordExchanges([createExchange()])).toBeResolved();
    });

    it('should still write the other exchanges when one fails', async () => {
      withRoomAndSession();
      mockMemberService.members.set([]);
      let call = 0;
      createDocument.and.callFake(() => {
        call++;
        return call === 1 ? Promise.reject(new Error('boom')) : Promise.resolve({ $id: 'event-ok' });
      });

      await expectAsync(
        service.recordExchanges([
          createExchange({ toPlayerId: 'm-b' }),
          createExchange({ toPlayerId: 'm-c' }),
          createExchange({ toPlayerId: 'm-d' }),
        ])
      ).toBeResolved();

      expect(createDocument).toHaveBeenCalledTimes(3);
    });
  });
});
