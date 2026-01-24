import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../_helpers/language.helper';
import { Language } from '../../_models/language.model';

/**
 * UserMenuComponent - Dropdown menu for user profile and settings
 *
 * Features:
 * - Shows login button when not authenticated
 * - Shows user avatar, name, and email when logged in
 * - Language selector for internationalization
 * - Logout functionality
 * - Accessible with keyboard navigation and ARIA attributes
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);

  /** Whether the dropdown menu is open */
  readonly isOpen = signal(false);

  /** Available languages for selection */
  readonly languages: Language[];

  /** Currently selected language code */
  selectedLanguage: string;

  /** Current user from AuthService */
  readonly currentUser = this.authService.currentUser;

  /** Whether user is logged in */
  readonly isLoggedIn = this.authService.isLoggedIn;

  /** Whether user is anonymous */
  readonly isAnonymous = this.authService.isAnonymous;

  /** Loading state from AuthService */
  readonly isLoading = this.authService.isLoading;

  /** Display name for the user */
  readonly displayName = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return '';
    }
    if (this.isAnonymous()) {
      return this.translate.instant('userMenu.guest');
    }
    return user.name || user.email.split('@')[0];
  });

  /** User's initials for avatar fallback */
  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user || this.isAnonymous()) {
      return '?';
    }
    const name = user.name || user.email;
    const parts = name.split(/[\s@]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  constructor() {
    this.languages = this.languageService.constructPossibleLanguages();
    const browserLang = this.translate.getBrowserLang() ?? 'fr';
    this.selectedLanguage = this.translate.currentLang || this.translate.getDefaultLang() || browserLang;
  }

  ngOnInit(): void {
    // Ensure the initial language is set
    if (this.selectedLanguage) {
      this.translate.use(this.selectedLanguage);
    }
  }

  /**
   * Toggle the dropdown menu open/closed
   */
  toggleMenu(): void {
    this.isOpen.update((open) => !open);
  }

  /**
   * Close the dropdown menu
   */
  closeMenu(): void {
    this.isOpen.set(false);
  }

  /**
   * Handle language change from the selector
   */
  onLanguageChange(): void {
    if (this.selectedLanguage) {
      this.translate.use(this.selectedLanguage);
    }
  }

  /**
   * Logout the current user and navigate to home
   */
  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    await this.router.navigate(['/']);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  /**
   * Handle click outside to close the menu
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  /**
   * Handle keyboard navigation - Escape to close
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeMenu();
    }
  }
}
