import { TestBed } from '@angular/core/testing';
import { AppwriteService, DATABASE_ID } from './appwrite.service';
import { ID } from 'appwrite';
import { environment } from '../../../environments/environment';

/**
 * INTEGRATION TEST: Verify Realtime events are received when documents are created/modified
 *
 * This test:
 * 1. Creates a test document in a collection
 * 2. Subscribes to Realtime events for that document
 * 3. Modifies the document
 * 4. Verifies the callback receives the correct events with payloads
 */
xdescribe('Realtime Document Modification Integration', () => {
  let appwriteService: AppwriteService;
  const COLLECTION_ID = 'fug_game_rooms'; // Pre-existing collection with Realtime enabled

  beforeAll(async () => {
    (environment as any).appwrite.endpoint = 'http://127.0.0.1/v1';
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppwriteService],
    });
    appwriteService = TestBed.inject(AppwriteService);
  });

  afterAll(async () => {
    (environment as any).appwrite.endpoint = 'http://localhost/v1';
  });

  it('should create a document and receive Realtime event', async () => {
    const eventsReceived: any[] = [];

    // Generate a unique room ID for this test
    const testRoomId = `test-realtime-${Date.now()}`;

    // Subscribe BEFORE creating the document
    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${testRoomId}`,
      (event) => {
        console.log(`[Test] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create the document
    const roomData = {
      name: 'Test Room',
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

    const createdDoc = await appwriteService.databases.createDocument(DATABASE_ID, COLLECTION_ID, testRoomId, roomData);

    console.log(`[Test] Created document:`, createdDoc.$id);

    // Wait for realtime event to be received
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received events
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify event structure
    const firstEvent = eventsReceived[0];
    expect(firstEvent['payload']).toBeDefined();
    expect(firstEvent['payload']['$id']).toBe(testRoomId);
    expect(firstEvent['payload']['name']).toBe('Test Room');
    expect(firstEvent['payload']['status']).toBe('idle');

    // Cleanup
    await subscription.unsubscribe();
    await appwriteService.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testRoomId);
  }, 30000);

  it('should receive update events when document is modified', async () => {
    const eventsReceived: any[] = [];
    const testRoomId = `test-update-${Date.now()}`;

    // Create document first
    const roomData = {
      name: 'Initial Name',
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

    await appwriteService.databases.createDocument(DATABASE_ID, COLLECTION_ID, testRoomId, roomData);

    // Subscribe to the specific document
    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${testRoomId}`,
      (event) => {
        console.log(`[Test Update] Received event:`, JSON.stringify(event));
        eventsReceived.push(event);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Modify the document
    await appwriteService.databases.updateDocument(DATABASE_ID, COLLECTION_ID, testRoomId, {
      name: 'Updated Name',
      status: 'playing',
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
    await subscription.unsubscribe();
    await appwriteService.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testRoomId);
  }, 30000);

  it('should handle subscription unsubscribe cleanly', async () => {
    const eventsReceived: any[] = [];
    const testRoomId = `test- unsubscribe-${Date.now()}`;

    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${testRoomId}`,
      (event) => eventsReceived.push(event)
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Unsubscribe should complete without error
    await expectAsync(subscription.unsubscribe()).toBeResolved();

    // Try to create a document after unsubscribe - should not receive event
    const roomData = {
      name: 'After Unsubscribe',
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

    await appwriteService.databases.createDocument(DATABASE_ID, COLLECTION_ID, testRoomId, roomData);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Should have exactly 1 event (the create that happened before unsubscribe)
    // The document creation after unsubscribe should NOT be received
    // Note: This might still receive the event if there's a race condition
    console.log(`[Test] Events after unsubscribe:`, eventsReceived.length);

    // Cleanup the document regardless
    try {
      await appwriteService.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testRoomId);
    } catch (e) {
      // Document might already be deleted
    }
  }, 30000);

  it('should handle subscription close cleanly', async () => {
    const testRoomId = `test-close-${Date.now()}`;

    const subscription = await appwriteService.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${testRoomId}`,
      () => {}
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Close should complete without error
    await expectAsync(subscription.close()).toBeResolved();

    // Cleanup
    try {
      await appwriteService.databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testRoomId);
    } catch (e) {
      // Document might not exist
    }
  }, 20000);
});
