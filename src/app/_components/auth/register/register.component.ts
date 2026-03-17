import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { SoloRoomService } from '../../../services/solo-room/solo-room.service';

/**
 * RegisterComponent - User registration page for Ketal
 *
 * Provides email/password registration with name and Google OAuth options.
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);
  private readonly soloRoomService = inject(SoloRoomService);

  /** Reactive form for registration with password match validation */
  readonly registerForm = new FormGroup(
    {
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
      ageVerification: new FormControl(false, [Validators.requiredTrue]),
    },
    { validators: this.passwordMatchValidator }
  );

  /** Loading state from AuthService */
  readonly isLoading = this.authService.isLoading;

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** Password visibility toggle */
  readonly showPassword = signal(false);

  /** Confirm password visibility toggle */
  readonly showConfirmPassword = signal(false);

  /**
   * Custom validator to check if password and confirmPassword match
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the mismatch error if passwords match (but keep other errors)
    if (confirmPassword.errors?.['passwordMismatch']) {
      const { passwordMismatch, ...otherErrors } = confirmPassword.errors;
      confirmPassword.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
    }

    return null;
  }

  /**
   * Handle form submission for registration
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.error.set(null);

    try {
      const { name, email, password } = this.registerForm.value;
      await this.authService.signUp(email!, password!, name!);
      await this.navigateAfterRegistration();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  /**
   * Navigate to appropriate page after registration.
   * If pendingSummary flag is set, navigates to /game and shows summary.
   * Checks for active KetalSession to resume, otherwise starts background
   * solo room creation and navigates to /players.
   */
  private async navigateAfterRegistration(): Promise<void> {
    if (this.authService.consumePendingSummary()) {
      await this.router.navigate(['/game']);
      this.gameService.setStatus(3);
      return;
    }

    // Check for active session to resume
    const activeSession = await this.soloRoomService.checkActiveSession();
    if (activeSession) {
      await this.router.navigate(['/game']);
      return;
    }

    // Start background solo room creation while user adds players
    this.soloRoomService.startBackgroundRoomCreation();
    await this.router.navigate(['/players']);
  }

  /**
   * Initiate Google OAuth registration
   */
  registerWithGoogle(): void {
    this.error.set(null);
    // OAuth redirects away from the app, navigation happens on callback
    this.authService.signInWithGoogle();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((show) => !show);
  }

  /**
   * Check if a form field has errors and has been touched
   */
  hasFieldError(fieldName: 'name' | 'email' | 'password' | 'confirmPassword' | 'ageVerification'): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a form field
   */
  getFieldError(fieldName: 'name' | 'email' | 'password' | 'confirmPassword' | 'ageVerification'): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors) {
      return '';
    }

    if (field.errors['required']) {
      const errorKeys: Record<string, string> = {
        name: 'auth.errors.nameRequired',
        email: 'auth.errors.emailRequired',
        password: 'auth.errors.passwordRequired',
        confirmPassword: 'auth.errors.passwordRequired',
        ageVerification: 'auth.errors.ageVerificationRequired',
      };
      return errorKeys[fieldName];
    }
    if (field.errors['minlength']) {
      if (fieldName === 'name') {
        return 'auth.errors.nameRequired';
      }
      return 'auth.errors.passwordTooShort';
    }
    if (field.errors['email']) {
      return 'auth.errors.invalidEmail';
    }
    if (field.errors['passwordMismatch']) {
      return 'auth.errors.passwordMismatch';
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
