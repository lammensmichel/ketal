import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MemberService, GameMember } from '../../../services/member/member.service';
import { RoomService } from '../../../services/room/room.service';

/**
 * Sort column options for the stats table
 */
export type SortColumn = 'name' | 'sipsGiven' | 'sipsTaken';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * RoomStatsComponent - Displays statistics for all members in a room
 *
 * Shows a sortable table with:
 * - Player names
 * - Total sips given across all games
 * - Total sips taken across all games
 * - Total games played in the room
 *
 * Uses Angular 19 patterns: standalone, signals, computed, inject(), OnPush.
 */
@Component({
  selector: 'app-room-stats',
  templateUrl: './room-stats.component.html',
  styleUrls: ['./room-stats.component.scss'],
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomStatsComponent {
  private readonly memberService = inject(MemberService);
  private readonly roomService = inject(RoomService);

  /** Current sort column */
  readonly sortColumn = signal<SortColumn>('name');

  /** Current sort direction */
  readonly sortDirection = signal<SortDirection>('asc');

  /** Access to members signal from MemberService */
  readonly members = this.memberService.members;

  /** Access to current room signal from RoomService */
  readonly currentRoom = this.roomService.currentRoom;

  /**
   * Computed signal for sorted members based on current sort settings
   */
  readonly sortedMembers = computed(() => {
    const members = [...this.members()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return members.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'sipsGiven':
          comparison = a.totalSipsGiven - b.totalSipsGiven;
          break;
        case 'sipsTaken':
          comparison = a.totalSipsTaken - b.totalSipsTaken;
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  });

  /**
   * Computed signal for total sips given across all members
   */
  readonly totalSipsGiven = computed(() => {
    return this.members().reduce((sum, member) => sum + member.totalSipsGiven, 0);
  });

  /**
   * Computed signal for total sips taken across all members
   */
  readonly totalSipsTaken = computed(() => {
    return this.members().reduce((sum, member) => sum + member.totalSipsTaken, 0);
  });

  /**
   * Computed signal for total games played in the room
   * Uses the room's gamesPlayed counter as the source of truth
   */
  readonly totalGamesPlayed = computed(() => {
    const room = this.currentRoom();
    return room?.gamesPlayed ?? 0;
  });

  /**
   * Handle column header click to sort by that column
   * Clicking the same column toggles the sort direction
   */
  sortBy(column: SortColumn): void {
    if (this.sortColumn() === column) {
      // Toggle direction if clicking same column
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      // New column - set it with ascending order
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  /**
   * Get the sort indicator class for a column header
   */
  getSortIndicator(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '';
    }
    return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  /**
   * Check if the current column is the active sort column
   */
  isActiveSort(column: SortColumn): boolean {
    return this.sortColumn() === column;
  }

  /**
   * Track function for @for directive
   */
  trackByMemberId(_index: number, member: GameMember): string {
    return member.$id;
  }
}
