import { Component, signal, effect, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';
import { FriendService } from '../../services/friend/friend.service';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [FormsModule, NgClass, NgIf, TranslateModule, FontAwesomeIconsModule, QRCodeComponent],
})
export class QrScannerComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly friendSrv = inject(FriendService);

  /** QR code payload (decoded) */
  readonly qrPayload = signal('');

  /** Scanner active state */
  readonly isScanning = signal(false);

  /** Camera access error */
  readonly scanError = signal<string | null>(null);

  /** Result from scan */
  readonly scanResult = signal<string | null>(null);

  /** Generate friend's QR code (contains their userId) */
  readonly friendQrUrl = signal<string | null>(null);

  /** QR code config */
  readonly qrScale = 5;
  readonly qrWidth = 200;
  readonly qrErrorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M';

  ngOnInit(): void {
    // Generate QR code for current user's userId when component initializes
    const authService = this.friendSrv['authService'] as any;
    if (authService) {
      const userId = authService.currentUser()?.['$id'];
      if (userId) {
        this.friendQrUrl.set(userId);
      }
    }
  }

  /** Scan QR code (for adding friends) */
  async scanQr(payload: string): Promise<void> {
    if (!payload.trim()) {
      this.scanError.set('No QR code detected');
      return;
    }

    this.isScanning.set(true);
    this.scanError.set(null);

    try {
      // Add friend via QR payload
      await this.friendSrv.addFriendByQr(payload);

      // Success - clear result
      this.scanResult.set(payload);
      this.qrPayload.set('');
      // TODO: Show success toast
      // TODO: Reload friends list
    } catch {
      this.scanError.set('Failed to add friend via QR code');
    } finally {
      this.isScanning.set(false);
    }
  }

  /** Copy current user's QR code to clipboard */
  async copyQrCode(): Promise<void> {
    const authService = this.friendSrv['authService'] as any;
    if (!authService) {
      return;
    }

    const userId = authService.currentUser()?.['$id'];
    if (!userId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(userId);
      // TODO: Show success toast
    } catch {
      // TODO: Show error toast
    }
  }
}
