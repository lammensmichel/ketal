import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { SoloRoomService } from '../../../services/solo-room/solo-room.service';
import { createMockAuthService, createMockGameService, createMockSoloRoomService } from '../../../testing/test-helpers';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterModule.forRoot([]), RegisterComponent],
      providers: [
        { provide: AuthService, useValue: createMockAuthService() },
        { provide: GameService, useValue: createMockGameService() },
        { provide: SoloRoomService, useValue: createMockSoloRoomService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should have an invalid form by default', () => {
      expect(component.registerForm.valid).toBeFalse();
    });

    it('should have ageVerification control', () => {
      const control = component.registerForm.get('ageVerification');
      expect(control).toBeTruthy();
    });

    it('should be invalid when ageVerification is not checked', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        ageVerification: false,
      });
      expect(component.registerForm.valid).toBeFalse();
    });

    it('should be valid when all fields are filled and ageVerification is checked', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        ageVerification: true,
      });
      expect(component.registerForm.valid).toBeTrue();
    });
  });

  describe('hasFieldError', () => {
    it('should return true for touched invalid ageVerification', () => {
      const control = component.registerForm.get('ageVerification')!;
      control.markAsTouched();
      expect(component.hasFieldError('ageVerification')).toBeTrue();
    });

    it('should return false for untouched ageVerification', () => {
      expect(component.hasFieldError('ageVerification')).toBeFalse();
    });
  });

  describe('getFieldError', () => {
    it('should return ageVerificationRequired for unchecked ageVerification', () => {
      const control = component.registerForm.get('ageVerification')!;
      control.markAsTouched();
      expect(component.getFieldError('ageVerification')).toBe('auth.errors.ageVerificationRequired');
    });
  });

  describe('onSubmit', () => {
    it('should not submit when ageVerification is unchecked', async () => {
      const authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        ageVerification: false,
      });

      await component.onSubmit();

      expect(authService.signUp).not.toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should render the age verification checkbox', () => {
      const checkbox = fixture.nativeElement.querySelector('#ageVerification');
      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
    });

    it('should render a link to terms page', () => {
      const termsLink = fixture.nativeElement.querySelector('.age-verification a');
      expect(termsLink).toBeTruthy();
      expect(termsLink.getAttribute('href')).toBe('/terms');
    });
  });
});
