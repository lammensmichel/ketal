import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';

import { Router } from '@angular/router';
import { RoomService, GameRoomWithMemberCount } from '../../../services/room/room.service';
import { MemberService } from '../../../services/member/member.service';
import { RoomTileComponent } from '../room-tile/room-tile.component';

/**
 * RoomsListComponent - Page displaying list of user's rooms
 *
 * Shows all rooms the user has access to with tile views.
 * Handles loading, empty state, and navigation.
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-rooms-list',
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.scss'],
  standalone: true,
  imports: [RoomTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsListComponent implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly memberService = inject(MemberService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Loading state */
  readonly isLoading = signal(false);

  /** Error message */
  readonly error = signal<string | null>(null);

  /** List of rooms */
  readonly rooms = signal<GameRoomWithMemberCount[]>([]);

  /** Computed: current user's member record */
  readonly currentMember = this.memberService.currentMember;

  /** Computed: does user have a member record in any room? */
  readonly hasRooms = computed<boolean>(() => this.rooms().length > 0);

  /** Computed: filtered list (excluding archived for display) */
  readonly visibleRooms = computed<GameRoomWithMemberCount[]>(() => {
    return this.rooms().filter((room) => !room.archived);
  });

  /**
   * On init: load user's rooms
   */
  async ngOnInit(): Promise<void> {
    await this.loadRooms();
  }

  /**
   * Load user's rooms from service
   */
  private async loadRooms(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const rooms = await this.roomService.getMyRooms();
      this.rooms.set(rooms);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get the user's role in a room
   */
  getRoomRole(roomId: string): 'host' | 'player' {
    const member = this.currentMember();
    if (!member) {
      return 'player';
    }
    if (member.role === 'host') {
      return 'host';
    }
    return 'player';
  }

  /**
   * Handle room creation click
   */
  async handleCreateRoom(): Promise<void> {
    await this.router.navigate(['/room/create']);
  }

  /**
   * Extract error message from caught error
   */
  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'rooms.errors.loadFailed';
  }
}
