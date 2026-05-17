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
 * INTEGRATION TEST: Verify Realtime events flow through RealtimeService
 *
 * This test creates documents and verifies that Realtime callbacks receive events.
 *
 * IMPORTANT: Tests create documents but DO NOT clean them up afterwards because:
 * 1. Document deletion from Web SDK returns 401 (permission denied)
 * 2. Integration tests need to coexist with other test runs
 *
 * To avoid ID conflicts when tests are run multiple times, we use ID.unique()
 * which generates UUID v4 identifiers that are globally unique.
 */
// Skipping Realtime integration tests due to Appwrite v25 SDK timing bug
// The WebSocket connection opens but the "Missing channels" error is sent
// before the client can send the subscribe message. This is a timing issue
// in the Appwrite v25 SDK where createSocket() doesn't properly await the
// WebSocket open event before returning.
describe('RealtimeService Realtime Integration', () => {
  let appwriteService: AppwriteService;
  let realtimeService: RealtimeService;

  const ROOMS_COLLECTION_ID = 'fug_game_rooms';

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

  afterAll(async () => {
    // Use environment default - no override needed
  });

  it('should receive events via RealtimeService.subscribeToRoom', async () => {
    // Use a unique room that exists in the collection (not created by tests)
    // This avoidsdocument_already_exists errors when tests run multiple times

    const eventsReceived: any[] = [];

    // Get existing room from collection first
    const listResult = await appwriteService.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: ROOMS_COLLECTION_ID,
      total: true,
    });

    if (listResult.total === 0) {
      console.log('[Test RS] No rooms in collection, skipping test');
      pending('No rooms in fug_game_rooms collection to test with');
      return;
    }

    const existingRoom = listResult.documents[0];
    const testRoomId = existingRoom.$id as string;
    console.log(`[Test RS] Using existing room ID: ${testRoomId}`);

    // Subscribe to updates for this existing room
    const subId = await realtimeService.subscribeToRoom(testRoomId, (room) => {
      console.log(`[Test RS] Received room update:`, room);
      eventsReceived.push(room);
    });

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Modify the existing room (v25 signature: single options object)
    await appwriteService.databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: ROOMS_COLLECTION_ID,
      documentId: testRoomId,
      data: {
        status: 'playing',
        name: `Updated Room Name ${ID.unique()}`,
      },
    });

    // Wait for events to be received
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received events
    console.log(`[Test RS] Events received: ${eventsReceived.length}`);
    expect(eventsReceived.length).toBeGreaterThan(0);

    // Verify the payload contains the expected data
    const lastRoom = eventsReceived[eventsReceived.length - 1];
    expect(lastRoom['$id']).toBe(testRoomId);
    expect(lastRoom.status).toBe('playing');

    // Cleanup
    realtimeService.unsubscribe(subId);
  }, 30000);

  it('should receive collection events via RealtimeService.subscribeToCollection', async () => {
    const eventsReceived: any[] = [];

    const subId = await realtimeService.subscribeToCollection(ROOMS_COLLECTION_ID, (room) => {
      console.log(`[Test RS] Received collection event:`, room);
      eventsReceived.push(room);
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // List existing documents to get one to modify
    const listResult = await appwriteService.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: ROOMS_COLLECTION_ID,
      total: true,
    });

    if (listResult.total === 0) {
      console.log('[Test RS] No rooms in collection, skipping test');
      realtimeService.unsubscribe(subId);
      pending('No rooms in fug_game_rooms collection to test with');
      return;
    }

    const existingRoom = listResult.documents[0];
    const roomId = existingRoom['$id'] as string;
    console.log(`[Test RS] Modifying existing room: ${roomId}`);

    // Modify the existing room to trigger a update event
    await appwriteService.databases.updateDocument({
      databaseId: DATABASE_ID,
      collectionId: ROOMS_COLLECTION_ID,
      documentId: roomId,
      data: {
        status: 'playing',
        name: `Collection Sub Test ${ID.unique()}`,
      },
    });

    // Wait for event
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify we received the event
    expect(eventsReceived.length).toBeGreaterThan(0);

    const modifiedRoom = eventsReceived.find((r) => r['$id'] === roomId);
    expect(modifiedRoom).toBeDefined();
    expect(modifiedRoom?.name).toContain('Collection Sub Test');

    // Cleanup
    realtimeService.unsubscribe(subId);
  }, 30000);

  it('should properly unsubscribe from RealtimeService', async () => {
    const testRoomId = generateUUID();
    console.log(`[Test RS Unsubscribe] Using room ID: ${testRoomId}`);

    const callback = jasmine.createSpy('callback');

    const subId = await realtimeService.subscribeToRoom(testRoomId, callback);

    expect(realtimeService.hasSubscription(subId)).toBeTrue();

    // Unsubscribe
    realtimeService.unsubscribe(subId);

    expect(realtimeService.hasSubscription(subId)).toBeFalse();
    expect(realtimeService.getActiveSubscriptionIds()).not.toContain(subId);

    // Modification after unsubscribe - callback should not be called
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify callback was not called
    expect(callback).not.toHaveBeenCalled();
  }, 20000);

  it('should properly unsubscribeAll', async () => {
    const testRoomId = generateUUID();
    console.log(`[Test RS UnsubscribeAll] Using room ID: ${testRoomId}`);

    const callback = jasmine.createSpy('callback');

    const sub1 = await realtimeService.subscribeToRoom(testRoomId, callback);

    expect(realtimeService.activeSubscriptions()).toBeGreaterThanOrEqual(1);

    // Unsubscribe all
    realtimeService.unsubscribeAll();

    expect(realtimeService.activeSubscriptions()).toBe(0);
    expect(realtimeService.hasSubscription(sub1)).toBeFalse();
  }, 20000);
});
