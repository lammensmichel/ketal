import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [QRCodeComponent],
  template: `
    <div class="qr-code-container">
      <qrcode [qrdata]="data()" [width]="size()" [errorCorrectionLevel]="'M'" [margin]="2"></qrcode>
      @if (label()) {
        <p class="qr-label">{{ label() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .qr-code-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .qr-label {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0;
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppQrCodeComponent {
  /** The data to encode in the QR code (URL, text, etc.) */
  readonly data = input.required<string>();

  /** Size of the QR code in pixels */
  readonly size = input<number>(180);

  /** Optional label to display below the QR code */
  readonly label = input<string>('');
}
