import { TestBed } from '@angular/core/testing';
import { AppwriteService, DATABASE_ID } from './appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ID } from 'appwrite';
import { environment } from '../../../environments/environment';

// Use crypto.randomUUID() for proper UUID v4 generation
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * INTEGRATION TEST: Verify Realtime events are received when ketal_sessions are created/modified
 *
 * This test creates a ketal session and verifies Realtime callbacks receive events.
 *
 * Channel format for Appwrite v1.9.0: tablesdb.<DB_ID>.tables.<COLLECTION_ID>.rows
 */
describe('Realtime ketal_sessions Integration', () => {
  let appwriteService: AppwriteService;
  let realtimeService: RealtimeService;

  const SESSION_COLLECTION_ID = 'ketal_sessions';
  const GAME_ROOMS_COLLECTION_ID = 'fug_game_rooms';
  let testRoomId: string | null = null;
  const createdResourceIds: string[] = [];

  beforeAll(async () => {
    // Use environment default - no override needed
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppwriteService, RealtimeService],
    });
    appwriteService = TestBed.inject(AppwriteService);
    realtimeService = TestBed.inject(RealtimeService);
  });

  /**
   * Cleanup after each test to prevent document accumulation
   */
  afterEach(async () => {
    // Cleanup sessions
    for (const docId of createdResourceIds) {
      try {
        await appwriteService.databases.deleteDocument({
          databaseId: DATABASE_ID,
          collectionId: SESSION_COLLECTION_ID,
          documentId: docId,
        });
        console.log(`[Cleanup] Deleted session: ${docId}`);
      } catch (error) {
        console.warn(`[Cleanup] Failed to delete session ${docId}:`, error);
        // Don't throw - cleanup failures shouldn't mask test failures
      }
    }
    // Clear tracker for next test
    createdResourceIds.length = 0;
  });

  /**
   * Clean up any stale test data before running
   */
  beforeAll(async () => {
    try {
      // Get any existing test rooms with our pattern
      const staleRooms = await appwriteService.databases.listDocuments(
        DATABASE_ID,
        GAME_ROOMS_COLLECTION_ID,
        [], // queries
        'ASC' // order
      );

      // Delete stale test rooms
      for (const doc of staleRooms.documents) {
        const name = doc['name'] as string;
        if (name?.includes('Test Room for Session')) {
          console.log(`[Test Cleanup] Attempting to delete stale room: ${doc['$id']}`);
          try {
            await appwriteService.databases.deleteDocument({
              databaseId: DATABASE_ID,
              collectionId: GAME_ROOMS_COLLECTION_ID,
              documentId: doc['$id'],
            });
            console.log(`[Test Cleanup] Deleted stale room: ${doc['$id']}`);
          } catch (e) {
            // Permission error is expected in some test environments
            // Just log and continue - the test will create its own room
            console.log(`[Test Cleanup] Could not delete room ${doc['$id']}: ${e}`);
          }
        }
      }
    } catch (e) {
      console.log(`[Test Cleanup] Could not list documents: ${e}`);
    }
  });

  /**
   * First, create a test room (required for session)
   * Uses UUID v4 to ensure globally unique IDs across test runs
   */
  it('should create a test room for the session', async () => {
    testRoomId = generateUUID();

    const roomData = {
      name: 'Test Room for Session ' + testRoomId.substring(0, 6),
      code: testRoomId.substring(0, 6),
      inviteToken: 'test-token-' + new Date().getTime(),
      currentGameId: null,
      currentSessionId: null,
      status: 'idle',
      hostMemberId: 'test-member-id-' + Math.floor(Math.random() * 1000),
      mode: 'local',
      maxPlayers: 6,
      gamesPlayed: 0,
    };

    const createdDoc = await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: GAME_ROOMS_COLLECTION_ID,
      documentId: testRoomId,
      data: roomData,
    });

    expect(createdDoc['$id']).toBe(testRoomId);
    console.log(`[Test] Created room: ${testRoomId}`);
    createdResourceIds.push(testRoomId); // TRACK THE ID
    // Cleanup will be handled by afterEach hook
  }, 20000);

  it('should create a session and receive Realtime event', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = generateUUID();

    // Subscribe BEFORE creating the session
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${SESSION_COLLECTION_ID}.rows.${sessionId}`,
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

    const createdDoc = await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: sessionData,
    });

    console.log(`[Test Session] Created session:`, createdDoc.$id);
    createdResourceIds.push(sessionId); // TRACK THE ID

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

    // Cleanup will be handled by afterEach hook
  }, 30000);

  it('should receive update events when session is modified', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = generateUUID();

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

    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: sessionData,
    });
    createdResourceIds.push(sessionId); // TRACK THE ID

    // Subscribe to the specific session
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${SESSION_COLLECTION_ID}.rows.${sessionId}`,
      (event) => {
        console.log(`[Test Session Update] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Modify the session
    await appwriteService.databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: {
        status: 'playing',
        phase: 'dealing',
        turn: 1,
      },
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

    // Cleanup will be handled by afterEach hook
  }, 30000);

  it('should receive collection-level update events', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const sessionId = generateUUID();

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

    // Set up event array and subscription BEFORE creating the document
    const eventsReceived: any[] = [];

    // Subscribe to collection-level updates BEFORE creation
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${SESSION_COLLECTION_ID}.rows`,
      (event) => {
        console.log(`[Test Collection Event] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create session AFTER subscription is active
    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: sessionData,
    });
    createdResourceIds.push(sessionId); // TRACK THE ID

    // Wait for event to arrive
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close subscription to avoid interference with subsequent tests
    await subscription.close();

    // Verify we received at least one event (subscription + modification)
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Parse event payload before searching (payload may be a JSON string)
    const sessionEvent = eventsReceived.find((e) => {
      const parsed = typeof e === 'string' ? JSON.parse(e) : e;
      return parsed['events']?.includes('create') || parsed['payload']?.['$id'] === sessionId;
    });
    expect(sessionEvent).toBeDefined();
    const payload = typeof sessionEvent === 'string' ? JSON.parse(sessionEvent)['payload'] : sessionEvent?.['payload'];
    expect(payload?.['$id']).toBe(sessionId);

    // Cleanup will be handled by afterEach hook
  }, 30000);

  // afterEach hook handles cleanup after each test
});
