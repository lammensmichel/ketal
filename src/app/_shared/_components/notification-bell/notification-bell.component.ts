import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';

/**
 * Cloche de notifications du header.
 *
 * NAVIGATION et non panneau deroulant : le seul contenu notifiable est la
 * section « demandes recues » de la page amis, et c'est le seul endroit ou l'on
 * peut agir (accepter, refuser). Un panneau aurait duplique cette liste et ses
 * deux boutons pour finir par renvoyer au meme endroit des qu'il faut agir — et
 * il aurait fallu le maintenir en double.
 */
@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly notificationSrv = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly unreadCount = this.notificationSrv.unreadCount;

  /** Au-dela de 99 le nombre exact n'apporte rien et deforme la pastille. */
  readonly badgeLabel = computed(() => (this.unreadCount() > 99 ? '99+' : String(this.unreadCount())));

  open(): void {
    void this.notificationSrv.openNotifications();

    // La permission des notifications navigateur est demandee ICI, sur un geste
    // utilisateur explicite : demandee au chargement, elle est bloquee par les
    // navigateurs. Un refus n'a aucune consequence, la cloche suffit.
    void this.notificationSrv.requestBrowserPermission();
  }
}
