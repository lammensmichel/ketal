import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export type RoomDisplayStatus = 'waiting' | 'playing' | 'finished';

@Component({
  selector: 'app-room-status-badge',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-status-badge.component.html',
  styleUrls: ['./room-status-badge.component.scss'],
})
export class RoomStatusBadgeComponent {
  readonly status = input.required<RoomDisplayStatus>();

  readonly labelKey = computed(() => `lobby.roomStatus.${this.status()}`);
}
