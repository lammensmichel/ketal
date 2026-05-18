import { TestBed } from '@angular/core/testing';
import { AppwriteService, DATABASE_ID } from './appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ID } from 'appwrite';

// Use crypto.randomUUID() for proper UUID v4 generation
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * INTEGRATION TEST: Verify Realtime events are received when ketal_sessions are created/modified
 *
 * This test creates a ketal session and verifies Realtime callbacks receive events.
 * Authenticated as integration_test_bot (fug-backend migration 040).
 *
 * Channel format for Appwrite v1.9.0: tablesdb.<DB_ID>.tables.<COLLECTION_ID>.rows
 */
const TEST_USER_EMAIL = 'test+integration@fug.app';
const TEST_USER_PASSWORD = 'K3tal-Test!2026';

describe('Realtime ketal_sessions Integration', () => {
  let appwriteService: AppwriteService;
  let realtimeService: RealtimeService;

  const SESSION_COLLECTION_ID = 'ketal_sessions';
  const GAME_ROOMS_COLLECTION_ID = 'fug_game_rooms';
  let testRoomId: string | null = null;
  const createdResourceIds: string[] = [];

  beforeAll(async () => {
    // Setup dependencies and authenticate as dedicated test user (migration 040)
    TestBed.configureTestingModule({
      providers: [AppwriteService, RealtimeService],
    });
    appwriteService = TestBed.inject(AppwriteService);
    realtimeService = TestBed.inject(RealtimeService);

    try {
      await appwriteService.account.createEmailPasswordSession({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
      console.log('[Realtime Session] Authenticated as integration_test_bot');
    } catch (e) {
      console.warn('[Realtime Session] Could not authenticate test user:', e);
    }
  });

  beforeEach(() => {
    // Re-inject RealtimeService per test fresh subscription state
    realtimeService = TestBed.inject(RealtimeService);
  });

  /**
   * Cleanup after each test to prevent document accumulation
   * Uses batch delete via createOperations for speed (matching pagination spec pattern)
   */
  afterEach(async () => {
    if (createdResourceIds.length === 0) {
      return;
    }

    try {
      const tx = await appwriteService.databases.createTransaction({ ttl: 30 });
      try {
        await appwriteService.databases.createOperations({
          transactionId: tx.$id,
          operations: createdResourceIds.map((docId) => ({
            action: 'delete',
            databaseId: DATABASE_ID,
            collectionId: SESSION_COLLECTION_ID,
            documentId: docId,
          })),
        });
        console.log(`[Cleanup] Batch-deleted ${createdResourceIds.length} session(s)`);
      } finally {
        await appwriteService.databases.deleteTransaction({ transactionId: tx.$id });
      }
    } catch (error) {
      console.warn('[Cleanup] Failed to batch-delete sessions:', error);
    }

    // Also try game rooms if any were created
    if (testRoomId) {
      try {
        await appwriteService.databases.deleteDocument({
          databaseId: DATABASE_ID,
          collectionId: GAME_ROOMS_COLLECTION_ID,
          documentId: testRoomId,
        });
        console.log(`[Cleanup] Deleted room: ${testRoomId}`);
      } catch (e) {
        /* ignore */
      }
    }

    createdResourceIds.length = 0;
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
    const createdDoc = await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: {
        roomId: testRoomId,
        gameId: 'ketal',
        gameNumber: 1,
        status: 'waiting',
        phase: 'setup',
        turn: 0,
        activePlayerId: null,
        terminatedBy: null,
        withSummary: false,
      },
    });

    console.log(`[Test Session] Created session:`, createdDoc.$id);
    createdResourceIds.push(sessionId);

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

    // Cleanup subscription
    await subscription.close();
  }, 30000);

  it('should receive update events when session is modified', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const eventsReceived: any[] = [];
    const sessionId = generateUUID();

    // Create session first
    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: {
        roomId: testRoomId,
        gameId: 'ketal',
        gameNumber: 1,
        status: 'waiting',
        phase: 'setup',
        turn: 0,
        activePlayerId: null,
        terminatedBy: null,
        withSummary: false,
      },
    });

    createdResourceIds.push(sessionId);

    // Subscribe to the specific session before modifying it
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
      data: { status: 'playing', phase: 'dealing', turn: 1 },
    });

    // Wait for realtime event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received the update event
    expect(eventsReceived.length).toBeGreaterThan(0);

    const lastEvent = eventsReceived[eventsReceived.length - 1];
    expect(lastEvent['payload']['$id']).toBe(sessionId);
    expect(lastEvent['payload']['status']).toBe('playing');
    expect(lastEvent['payload']['phase']).toBe('dealing');
    expect(lastEvent['payload']['turn']).toBe(1);

    await subscription.close();
  }, 30000);

  it('should receive collection-level update events', async () => {
    if (!testRoomId) {
      pending('Test room not available');
      return;
    }

    const sessionId = generateUUID();
    const eventsReceived: any[] = [];

    // Subscribe to collection-level updates BEFORE creating anything
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${SESSION_COLLECTION_ID}.rows`,
      (event) => {
        console.log(`[Test Collection Event] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create session AFTER subscription is active
    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SESSION_COLLECTION_ID,
      documentId: sessionId,
      data: {
        roomId: testRoomId,
        gameId: 'ketal',
        gameNumber: 1,
        status: 'waiting',
        phase: 'setup',
        turn: 0,
        activePlayerId: null,
        terminatedBy: null,
        withSummary: false,
      },
    });

    createdResourceIds.push(sessionId);

    // Wait for event to arrive
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Close subscription
    await subscription.close();

    // Verify we received at least one event
    expect(eventsReceived.length).toBeGreaterThan(0);

    const sessionEvent = eventsReceived.find((e) => {
      const parsed = typeof e === 'string' ? JSON.parse(e) : e;
      return parsed['events']?.includes('create') || parsed['payload']?.['$id'] === sessionId;
    });

    expect(sessionEvent).toBeDefined();
  }, 30000);

  /**
   * Final cleanup: delete test user session
   */
  afterAll(async () => {
    try {
      appwriteService.account.deleteSession({ sessionId: 'current' });
    } catch {
      /* ignore */
    }
  }, 10000);
});
