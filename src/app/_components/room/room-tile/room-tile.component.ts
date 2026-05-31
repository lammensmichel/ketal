import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService, GameRoom, RoomStatus } from '../../../services/room/room.service';
import { GameService } from '../../../services/game/game.service';
import { MemberService } from '../../../services/member/member.service';

/**
 * RoomTileComponent - Single room tile display
 *
 * Shows a room with status indicator, name, code, member count,
 * and action buttons based on user role.
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-room-tile',
  templateUrl: './room-tile.component.html',
  styleUrls: ['./room-tile.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomTileComponent {
  private readonly router = inject(Router);
  private readonly roomService = inject(RoomService);
  private readonly gameService = inject(GameService);
  private readonly memberService = inject(MemberService);

  /** Room data input */
  readonly room = input.required<GameRoom>();

  /** Current user's role in the room */
  readonly currentRole = input.required<'host' | 'player'>();

  /** Number of members in this room */
  readonly membersCount = input.required<number>();

  /** Computed: display status for UI */
  readonly displayStatus = computed(() => this.room().status as 'idle' | 'playing' | 'archived');

  /** Computed: room name with archived indicator */
  readonly roomName = computed<string>(() => {
    const room = this.room();
    return room.archived ? `[Archivé] ${room.name}` : room.name;
  });

  /** Computed: action label based on role and status */
  readonly actionLabel = computed<string>(() => {
    const status = this.displayStatus();
    const role = this.currentRole();

    if (status === 'archived') {
      return role === 'host' ? 'Supprimer' : '';
    }

    if (role === 'host') {
      return status === 'idle' ? 'Archiver' : '';
    }

    return 'Quitter';
  });

  /** Computed: whether the card is clickable */
  readonly isClickable = computed<boolean>(() => {
    const status = this.displayStatus();
    return status === 'idle' || status === 'playing';
  });

  /** Computed: disabled state */
  readonly isDisabled = computed<boolean>(() => !this.isClickable());

  /**
   * Handle tile click (for non-button clicks)
   */
  handleClick(): void {
    if (!this.isClickable()) {
      return;
    }

    const room = this.room();
    const status = room.status;
    const role = this.currentRole();

    if (status === 'playing') {
      this.handleReconnect();
    } else if (status === 'idle') {
      // For idle rooms, navigate for ALL users (host + player)
      this.router.navigate(['/room', room.$id]);
    }
  }

  /**
   * Handle action button click
   */
  handleAction(): void {
    const room = this.room();
    const status = room.status;
    const role = this.currentRole();

    if (status === 'archived') {
      if (role === 'host') {
        this.handleDelete();
      }
      return;
    }

    if (role === 'host') {
      if (status === 'idle') {
        this.handleArchive();
      }
      return;
    }

    if (status === 'playing') {
      this.handleReconnect();
    } else {
      this.handleLeave();
    }
  }

  /**
   * Handle reconnection to a playing session
   */
  handleReconnect(): void {
    const room = this.room();
    if (room.currentSessionId) {
      this.gameService.handleReconnection(room.currentSessionId);
      this.router.navigate(['/game']);
    }
  }

  /**
   * Handle archive action (host only)
   */
  async handleArchive(): Promise<void> {
    const room = this.room();
    try {
      await this.roomService.archiveRoom(room.$id);
    } catch (err) {
      console.error('Failed to archive room:', err);
    }
  }

  /**
   * Handle delete action (host only for archived rooms)
   */
  async handleDelete(): Promise<void> {
    const room = this.room();
    try {
      await this.roomService.deleteRoom(room.$id);
      // Force full page reload to refresh room list immediately
      window.location.href = '/rooms';
    } catch (err) {
      console.error('Failed to delete room:', err);
    }
  }

  /**
   * Handle leave room action (player only)
   */
  async handleLeave(): Promise<void> {
    const room = this.room();
    try {
      await this.roomService.leaveRoom(room.$id);
      // Force full page reload to refresh room list immediately
      window.location.href = '/rooms';
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  }
}
