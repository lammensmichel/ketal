import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';

/**
 * LoginComponent - Authentication page for Ketal
 *
 * Provides email/password login, Google OAuth, and guest access options.
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);

  /** Reactive form for email/password login */
  readonly loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  /** Loading state from AuthService */
  readonly isLoading = this.authService.isLoading;

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** Password visibility toggle */
  readonly showPassword = signal(false);

  /**
   * Handle form submission for email/password login
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error.set(null);

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.loginWithEmail(email!, password!);
      await this.navigateAfterLogin();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  /**
   * Initiate Google OAuth login
   */
  loginWithGoogle(): void {
    this.error.set(null);

    try {
      this.authService.signInWithGoogle();
      // OAuth redirects away from the app, navigation happens on callback
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  /**
   * Login as anonymous guest
   */
  async playAsGuest(): Promise<void> {
    this.error.set(null);

    try {
      await this.authService.createAnonymousSession();
      await this.navigateAfterLogin();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  /**
   * Navigate to appropriate page after login
   * Goes to /game if a game is in progress, otherwise /players
   */
  private async navigateAfterLogin(): Promise<void> {
    const route = this.gameService.isGameStarted() ? '/game' : '/players';
    await this.router.navigate([route]);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  /**
   * Check if a form field has errors and has been touched
   */
  hasFieldError(fieldName: 'email' | 'password'): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a form field
   */
  getFieldError(fieldName: 'email' | 'password'): string {
    const field = this.loginForm.get(fieldName);
    if (!field?.errors) {
      return '';
    }

    if (field.errors['required']) {
      return fieldName === 'email' ? 'auth.errors.emailRequired' : 'auth.errors.passwordRequired';
    }
    if (field.errors['email']) {
      return 'auth.errors.invalidEmail';
    }
    if (field.errors['minlength']) {
      return 'auth.errors.passwordTooShort';
    }
    return '';
  }

  /**
   * Extract error message from caught error
   */
  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'auth.errors.genericError';
  }
}
