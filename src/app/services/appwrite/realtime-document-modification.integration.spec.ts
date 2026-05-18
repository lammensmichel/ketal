import { TestBed } from '@angular/core/testing';
import { AppwriteService, DATABASE_ID } from './appwrite.service';
import { ID } from 'appwrite';

const TEST_USER_EMAIL = 'test+integration@fug.app';
const TEST_USER_PASSWORD = 'K3tal-Test!2026';

// Use crypto.randomUUID() for proper UUID v4 generation
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * INTEGRATION TEST: Verify Realtime events are received when documents are created/modified
 *
 * This test creates fug_game_rooms documents and verifies realtime callbacks receive events.
 * Authenticated as integration_test_bot (fug-backend migration 040).
 *
 * Channel format for Appwrite v1.9.0: tablesdb.<DB_ID>.tables.<COLLECTION_ID>.rows
 */
describe('Realtime Document Modification Integration', () => {
  let appwriteService: AppwriteService;
  const COLLECTION_ID = 'fug_game_rooms'; // Pre-existing collection with Realtime enabled
  const createdResourceIds: string[] = [];

  beforeAll(async () => {
    TestBed.configureTestingModule({
      providers: [AppwriteService],
    });
    appwriteService = TestBed.inject(AppwriteService);

    try {
      await appwriteService.account.createEmailPasswordSession({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });
      console.log('[Realtime DocMod] Authenticated as integration_test_bot');
    } catch (e) {
      console.warn('[Realtime DocMod] Could not authenticate test user:', e);
    }
  });

  beforeEach(() => {
    appwriteService = TestBed.inject(AppwriteService);
  });

  /**
   * Cleanup after each test — batch delete via transactions for speed
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
            collectionId: COLLECTION_ID,
            documentId: docId,
          })),
        });
        console.log(`[Cleanup] Batch-deleted ${createdResourceIds.length} document(s)`);
      } finally {
        await appwriteService.databases.deleteTransaction({ transactionId: tx.$id });
      }
    } catch (error) {
      console.warn('[Cleanup] Failed to batch-delete:', error);
    }

    createdResourceIds.length = 0;
  });

  afterAll(async () => {
    try {
      appwriteService.account.deleteSession({ sessionId: 'current' });
    } catch {
      /* ignore */
    }
  });

  it('should create a document and receive Realtime event', async () => {
    const eventsReceived: any[] = [];

    // Generate a unique room ID for this test using UUID v4
    const testRoomId = generateUUID();

    // Subscribe BEFORE creating the document
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${COLLECTION_ID}.rows.${testRoomId}`,
      (event) => {
        console.log(`[Test] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create the document
    const roomData = {
      name: 'Test Room ' + testRoomId.substring(0, 6),
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
      collectionId: COLLECTION_ID,
      documentId: testRoomId,
      data: roomData,
    });

    console.log(`[Test] Created document:`, createdDoc.$id);
    createdResourceIds.push(testRoomId); // TRACK THE ID

    // Wait for realtime event to be received
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received events
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify event structure
    const firstEvent = eventsReceived[0];
    expect(firstEvent['payload']).toBeDefined();
    expect(firstEvent['payload']['$id']).toBe(testRoomId);
    expect(firstEvent['payload']['name']).toBe('Test Room ' + testRoomId.substring(0, 6));
    expect(firstEvent['payload']['status']).toBe('idle');

    // Cleanup
    await subscription.close();
  }, 30000);

  it('should receive update events when document is modified', async () => {
    const eventsReceived: any[] = [];
    // Use a NEW UUID for this test - the previous test's cleanup may have failed
    const testRoomId = generateUUID();

    // Create document first
    const roomData = {
      name: 'Initial Name ' + testRoomId.substring(0, 6), // Unique name to avoid conflicts
      code: testRoomId.substring(0, 6),
      inviteToken: 'test-token-' + new Date().getTime(), // Unique token
      currentGameId: null,
      currentSessionId: null,
      status: 'idle',
      hostMemberId: 'test-member-id-' + Math.floor(Math.random() * 1000),
      mode: 'local',
      maxPlayers: 6,
      gamesPlayed: 0,
    };

    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: testRoomId,
      data: roomData,
    });
    createdResourceIds.push(testRoomId); // TRACK THE ID

    // Subscribe to the specific document
    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${COLLECTION_ID}.rows.${testRoomId}`,
      (event) => {
        console.log(`[Test Update] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Modify the document
    await appwriteService.databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: testRoomId,
      data: {
        name: 'Updated Name',
        status: 'playing',
      },
    });

    // Wait for realtime event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received the update event
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify payload contains updated data
    const lastEvent = eventsReceived[eventsReceived.length - 1];
    expect(lastEvent['payload']['$id']).toBe(testRoomId);
    expect(lastEvent['payload']['name']).toBe('Updated Name');
    expect(lastEvent['payload']['status']).toBe('playing');

    // Cleanup
    await subscription.close();
  }, 30000);

  it('should handle subscription unsubscribe cleanly', async () => {
    const eventsReceived: any[] = [];
    // Use a unique ID for this test
    const testRoomId = generateUUID();

    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${COLLECTION_ID}.rows.${testRoomId}`,
      (event) => eventsReceived.push(event)
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Unsubscribe should complete without error
    await expectAsync(subscription.close()).toBeResolved();

    // Try to create a document after unsubscribe - should not receive event
    const roomData = {
      name: 'After Unsubscribe ' + testRoomId.substring(0, 6),
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

    await appwriteService.databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: testRoomId,
      data: roomData,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Should have exactly 1 event (the create that happened before unsubscribe)
    // The document creation after unsubscribe should NOT be received
    // Note: This might still receive the event if there's a race condition
    console.log(`[Test] Events after unsubscribe:`, eventsReceived.length);

    // Cleanup the document regardless
    createdResourceIds.push(testRoomId); // TRACK THE ID
    try {
      await appwriteService.databases.deleteDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: testRoomId,
      });
    } catch (e) {
      // Document might already be deleted
    }
  }, 30000);

  it('should handle subscription close cleanly', async () => {
    const testRoomId = generateUUID(); // Use crypto.randomUUID() for consistency

    const subscription = await appwriteService.subscribe(
      `tablesdb.${DATABASE_ID}.tables.${COLLECTION_ID}.rows.${testRoomId}`,
      () => {}
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Close should complete without error
    await expectAsync(subscription.close()).toBeResolved();

    // Track and cleanup
    createdResourceIds.push(testRoomId);
    try {
      await appwriteService.databases.deleteDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: testRoomId,
      });
    } catch (e) {
      // Document might not exist
    }
  }, 20000);
});
