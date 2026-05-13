import { TestBed } from '@angular/core/testing';
import { AppwriteService, DATABASE_ID } from './appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ID } from 'appwrite';
import { environment } from '../../../environments/environment';

/**
 * INTEGRATION TEST: Verify Realtime events are received when ketal_sessions are created/modified
 *
 * This test creates a ketal session and verifies Realtime callbacks receive events.
 */
describe('Realtime ketal_sessions Integration', () => {
  let appwriteService: AppwriteService;
  let realtimeService: RealtimeService;

  const SESSION_COLLECTION_ID = 'ketal_sessions';
  const GAME_ROOMS_COLLECTION_ID = 'fug_game_rooms';
  let testRoomId: string | null = null;

  beforeAll(async () => {
    (environment as any).appwrite.endpoint = 'http://127.0.0.1/v1';
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppwriteService, RealtimeService],
    });
    appwriteService = TestBed.inject(AppwriteService);
    realtimeService = TestBed.inject(RealtimeService);
  });

  afterAll(async () => {
    (environment as any).appwrite.endpoint = 'http://localhost/v1';
  });

  /**
   * Clean up any stale test data before running
   */
  beforeAll(async () => {
    try {
      // Get any existing test rooms with我们的 pattern
      const staleRooms = await appwriteService.databases.listDocuments(
        DATABASE_ID,
        GAME_ROOMS_COLLECTION_ID,
        [], // queries
        'ASC' // order
      );

      // Delete stale test rooms
      for (const doc of staleRooms.documents) {
        if ((doc['name'] as string)?.includes('Test Room for Session')) {
          console.log(`[Test Cleanup] Deleting stale room: ${doc['$id']}`);
          try {
            await appwriteService.databases.deleteDocument(DATABASE_ID, GAME_ROOMS_COLLECTION_ID, doc['$id']);
          } catch (e) {
            console.log(`[Test Cleanup] Failed to delete room ${doc['$id']}: ${e}`);
          }
        }
      }
    } catch (e) {
      console.log(`[Test Cleanup] Could not list documents: ${e}`);
    }
  });

  /**
   * First, create a test room (required for session)
   * Uses ID.unique() to ensure fresh ID on each run
   */
  it('should create a test room for the session', async () => {
    testRoomId = ID.unique();

    const roomData = {
      name: 'Test Room for Session',
      code: testRoomId.substring(0, 6),
      inviteToken: 'test-token',
      currentGameId: null,
      currentSessionId: null,
      status: 'idle',
      hostMemberId: 'test-member-id',
      mode: 'local',
      maxPlayers: 6,
      gamesPlayed: 0,
    };

    const createdDoc = await appwriteService.databases.createDocument(
      DATABASE_ID,
      GAME_ROOMS_COLLECTION_ID,
      testRoomId,
      roomData
    );

    expect(createdDoc['$id']).toBe(testRoomId);
    console.log(`[Test] Created room: ${testRoomId}`);
    // Cleanup room - this should work as we created it
    try {
      await appwriteService.databases.deleteDocument(DATABASE_ID, GAME_ROOMS_COLLECTION_ID, testRoomId);
    } catch (e) {
      console.log(`[Test] Room cleanup skipped or failed: ${e}`);
    }
  }, 20000);

  it('should create a session and receive Realtime event', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = ID.unique();

    // Subscribe BEFORE creating the session
    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${SESSION_COLLECTION_ID}.documents.${sessionId}`,
      (event) => {
        console.log(`[Test Session] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create the session document
    const sessionData = {
      roomId: testRoomId,
      gameId: 'ketal' as const,
      gameNumber: 1,
      status: 'waiting',
      phase: 'setup',
      turn: 0,
      activePlayerId: null,
      terminatedBy: null,
      withSummary: false,
    };

    const createdDoc = await appwriteService.databases.createDocument(
      DATABASE_ID,
      SESSION_COLLECTION_ID,
      sessionId,
      sessionData
    );

    console.log(`[Test Session] Created session:`, createdDoc.$id);

    // Wait for realtime event to be received
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received events
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify event structure
    const firstEvent = eventsReceived[0];
    expect(firstEvent['payload']).toBeDefined();
    expect(firstEvent['payload']['$id']).toBe(sessionId);
    expect(firstEvent['payload']['roomId']).toBe(testRoomId);
    expect(firstEvent['payload']['status']).toBe('waiting');

    // Cleanup - skip due to permission errors with deleteDocument from Web SDK
    // await subscription.unsubscribe();
    // await appwriteService.databases.deleteDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId);
    // await appwriteService.databases.deleteDocument(DATABASE_ID, GAME_ROOMS_COLLECTION_ID, testRoomId);
  }, 30000);

  it('should receive update events when session is modified', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = ID.unique();

    // Create session first
    const sessionData = {
      roomId: testRoomId,
      gameId: 'ketal' as const,
      gameNumber: 1,
      status: 'waiting',
      phase: 'setup',
      turn: 0,
      activePlayerId: null,
      terminatedBy: null,
      withSummary: false,
    };

    await appwriteService.databases.createDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId, sessionData);

    // Subscribe to the specific session
    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${SESSION_COLLECTION_ID}.documents.${sessionId}`,
      (event) => {
        console.log(`[Test Session Update] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Modify the session
    await appwriteService.databases.updateDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId, {
      status: 'playing',
      phase: 'dealing',
      turn: 1,
    });

    // Wait for realtime event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received the update event
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify payload contains updated data
    const lastEvent = eventsReceived[eventsReceived.length - 1];
    expect(lastEvent['payload']['$id']).toBe(sessionId);
    expect(lastEvent['payload']['status']).toBe('playing');
    expect(lastEvent['payload']['phase']).toBe('dealing');
    expect(lastEvent['payload']['turn']).toBe(1);

    // Cleanup - skip due to permission errors with deleteDocument from Web SDK
    // await subscription.unsubscribe();
    // await appwriteService.databases.deleteDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId);
    // await appwriteService.databases.deleteDocument(DATABASE_ID, GAME_ROOMS_COLLECTION_ID, testRoomId);
  }, 30000);

  it('should receive collection-level update events', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = ID.unique();

    // Subscribe to collection-level updates
    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${SESSION_COLLECTION_ID}.documents`,
      (event) => {
        console.log(`[Test Collection Event] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create a session
    const sessionData = {
      roomId: testRoomId,
      gameId: 'ketal' as const,
      gameNumber: 1,
      status: 'waiting',
      phase: 'setup',
      turn: 0,
      activePlayerId: null,
      terminatedBy: null,
      withSummary: false,
    };

    await appwriteService.databases.createDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId, sessionData);

    // Wait for event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received the create event
    expect(eventsReceived.length).toBeGreaterThan(0);

    const createEvent = eventsReceived.find((e) => e['events']?.includes('create'));
    expect(createEvent).toBeDefined();
    expect(createEvent?.['payload']['$id']).toBe(sessionId);

    // Cleanup - skip due to permission errors with deleteDocument from Web SDK
    // await subscription.unsubscribe();
    // await appwriteService.databases.deleteDocument(DATABASE_ID, SESSION_COLLECTION_ID, sessionId);
    // await appwriteService.databases.deleteDocument(DATABASE_ID, GAME_ROOMS_COLLECTION_ID, testRoomId);
  }, 30000);
});
