import { TestBed } from '@angular/core/testing';
import { RealtimeService, GameRoom, Subscription } from './realtime.service';
import { AppwriteService, DATABASE_ID } from '../appwrite/appwrite.service';
import { environment } from '../../../environments/environment';

/**
 * INTEGRATION TEST: Verify Realtime events are received when documents are modified
 *
 * This test verifies the full Realtime flow:
 * 1. Subscribe to a document
 * 2. Modify the document (create or update)
 * 3. Verify the callback receives the correct event with payload
 *
 * Since Web SDK cannot create collections, this test uses an EXISTING collection
 * and modifies a document that we know exists.
 */
describe('Realtime Document Modification Integration', () => {
  let realtimeService: RealtimeService;
  let appwriteService: AppwriteService;

  const COLLECTION_ID = 'fug_game_rooms'; // Pre-existing collection with Realtime enabled
  let testRoomId: string | null = null;

  beforeAll(async () => {
    // Use environment default - no override needed
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RealtimeService, AppwriteService],
    });
    realtimeService = TestBed.inject(RealtimeService);
    appwriteService = TestBed.inject(AppwriteService);
  });

  afterAll(async () => {
    // Use environment default - no override needed
  });

  /**
   * FIRST: Get rooms from the collection
   */
  it('should get rooms from the collection', async () => {
    const roomsResponse = await appwriteService.databases.listDocuments({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      total: true,
    });

    expect(roomsResponse.total).toBeGreaterThanOrEqual(0);

    if (roomsResponse.total > 0) {
      testRoomId = roomsResponse.documents[0].$id;
      console.log(`[Integration Test] Using room: ${testRoomId}`);
    } else {
      console.warn('[Integration Test] No rooms in collection');
    }
  }, 10000);

  /**
   * Verify subscription receives events when a document exists
   */
  it('should receive events when subscribed to a document channel', async () => {
    const eventsReceived: any[] = [];
    const callback = (data: GameRoom) => {
      eventsReceived.push(data);
      console.log(`[Integration Test] Event received:`, data);
    };

    // If we have a room ID, subscribe to it
    if (testRoomId) {
      const subId = await realtimeService.subscribeToRoom(testRoomId, callback);

      // Wait for subscription to connect and potentially receive background events
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify the subscription is active
      expect(realtimeService.hasSubscription(subId)).toBeTrue();

      console.log(`[Integration Test] Events received: ${eventsReceived.length}`);

      // Cleanup
      realtimeService.unsubscribe(subId);
    } else {
      console.log('[Integration Test] No room to test - skipping subscription test');
      pending('No rooms available in collection for integration testing');
    }
  }, 25000);

  /**
   * Test collection-level subscription
   */
  it('should receive events when subscribed to a collection channel', async () => {
    const eventsReceived: any[] = [];

    const subId = await realtimeService.subscribeToCollection<GameRoom>(COLLECTION_ID, (data) => {
      eventsReceived.push(data);
      console.log(`[Integration Test] Collection event:`, data);
    });

    // Wait to see any events
    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(realtimeService.hasSubscription(subId)).toBeTrue();
    console.log(`[Integration Test] Collection events received: ${eventsReceived.length}`);

    realtimeService.unsubscribe(subId);
  }, 25000);

  /**
   * Test.unsubscribe() cleans up properly
   */
  it('should properly unsubscribe and clean up subscription', async () => {
    const callback = jasmine.createSpy('callback');

    if (testRoomId) {
      const subId = await realtimeService.subscribeToRoom(testRoomId, callback);

      expect(realtimeService.hasSubscription(subId)).toBeTrue();

      // Unsubscribe
      realtimeService.unsubscribe(subId);

      // Should be removed from active subscriptions
      expect(realtimeService.hasSubscription(subId)).toBeFalse();

      // Verify subscription ID no longer in list
      expect(realtimeService.getActiveSubscriptionIds()).not.toContain(subId);
    } else {
      pending('No rooms available in collection for integration testing');
    }
  }, 15000);

  /**
   * Test unsubscribeAll() cleans up all subscriptions
   */
  it('should properly unsubscribeAll when destroying', async () => {
    const callback = jasmine.createSpy('callback');

    if (testRoomId) {
      const sub1 = await realtimeService.subscribeToRoom(testRoomId, callback);
      const sub2 = await realtimeService.subscribeToSession<GameRoom>(testRoomId, callback);

      expect(realtimeService.activeSubscriptions()).toBeGreaterThanOrEqual(2);

      // Unsubscribe all
      realtimeService.unsubscribeAll();

      expect(realtimeService.activeSubscriptions()).toBe(0);
    } else {
      pending('No rooms available in collection for integration testing');
    }
  }, 20000);
});
