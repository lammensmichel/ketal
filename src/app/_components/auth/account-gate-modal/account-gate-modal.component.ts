import { Component, ChangeDetectionStrategy, EventEmitter, Output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * AccountGateModalComponent - Modal prompting anonymous users to create an account
 *
 * Displayed when an anonymous user tries to access a gated feature (e.g., game summary).
 * Provides options to create an account, log in, or dismiss.
 *
 * Architecture note: This component is designed to be extensible for future
 * monetization gates (e.g., subscription-only features).
 */
@Component({
  selector: 'app-account-gate-modal',
  templateUrl: './account-gate-modal.component.html',
  styleUrls: ['./account-gate-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountGateModalComponent {
  /** Emitted when user chooses to create an account */
  @Output() readonly createAccount = new EventEmitter<void>();

  /** Emitted when user chooses to log in */
  @Output() readonly login = new EventEmitter<void>();

  /** Emitted when user dismisses the modal */
  @Output() readonly dismiss = new EventEmitter<void>();

  /** Controls modal visibility */
  readonly isVisible = signal(false);

  /** Show the modal */
  show(): void {
    this.isVisible.set(true);
  }

  /** Hide the modal */
  hide(): void {
    this.isVisible.set(false);
  }

  onCreateAccount(): void {
    this.hide();
    this.createAccount.emit();
  }

  onLogin(): void {
    this.hide();
    this.login.emit();
  }

  onDismiss(): void {
    this.hide();
    this.dismiss.emit();
  }
}
