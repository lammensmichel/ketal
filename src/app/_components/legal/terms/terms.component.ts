import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * TermsComponent - Terms of use and legal disclaimer page
 *
 * Displays the full terms of use including:
 * - Age restriction (18+)
 * - Health warning about alcohol abuse
 * - Non-alcoholic alternative mention
 * - Disclaimer that the app does not encourage alcohol consumption
 */
@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  standalone: true,
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {}
