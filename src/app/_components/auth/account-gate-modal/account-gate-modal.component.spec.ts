import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AccountGateModalComponent } from './account-gate-modal.component';

describe('AccountGateModalComponent', () => {
  let component: AccountGateModalComponent;
  let fixture: ComponentFixture<AccountGateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), AccountGateModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountGateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('visibility', () => {
    it('should be hidden by default', () => {
      expect(component.isVisible()).toBeFalse();
    });

    it('should be visible after calling show()', () => {
      component.show();
      expect(component.isVisible()).toBeTrue();
    });

    it('should be hidden after calling hide()', () => {
      component.show();
      component.hide();
      expect(component.isVisible()).toBeFalse();
    });
  });

  describe('onCreateAccount', () => {
    it('should emit createAccount and hide modal', () => {
      spyOn(component.createAccount, 'emit');
      component.show();

      component.onCreateAccount();

      expect(component.isVisible()).toBeFalse();
      expect(component.createAccount.emit).toHaveBeenCalled();
    });
  });

  describe('onLogin', () => {
    it('should emit login and hide modal', () => {
      spyOn(component.login, 'emit');
      component.show();

      component.onLogin();

      expect(component.isVisible()).toBeFalse();
      expect(component.login.emit).toHaveBeenCalled();
    });
  });

  describe('onDismiss', () => {
    it('should emit dismiss and hide modal', () => {
      spyOn(component.dismiss, 'emit');
      component.show();

      component.onDismiss();

      expect(component.isVisible()).toBeFalse();
      expect(component.dismiss.emit).toHaveBeenCalled();
    });
  });

  describe('template rendering', () => {
    it('should not render modal content when hidden', () => {
      fixture.detectChanges();
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeNull();
    });

    it('should render modal content when visible', () => {
      component.show();
      fixture.detectChanges();
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
    });

    it('should render create account button when visible', () => {
      component.show();
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('.btn-action');
      expect(buttons.length).toBe(2);
    });

    it('should render dismiss button when visible', () => {
      component.show();
      fixture.detectChanges();
      const dismissBtn = fixture.nativeElement.querySelector('.btn-dismiss');
      expect(dismissBtn).toBeTruthy();
    });
  });
});
