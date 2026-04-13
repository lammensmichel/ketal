import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-room-status-badge',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-status-badge.component.html',
  styleUrls: ['./room-status-badge.component.scss'],
})
export class RoomStatusBadgeComponent {
  readonly connected = input.required<boolean>();
}
