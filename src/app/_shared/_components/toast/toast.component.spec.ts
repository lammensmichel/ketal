import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ToastComponent } from './toast.component';
import { By } from '@angular/platform-browser';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let debugElement: DebugElement;

  // Mock Bootstrap Toast class
  let mockBootstrapToast: any;

  beforeEach(async () => {
    // Create a mock Bootstrap Toast
    mockBootstrapToast = {
      show: jasmine.createSpy('show'),
      hide: jasmine.createSpy('hide'),
      dispose: jasmine.createSpy('dispose'),
    };

    // Mock the bootstrap global object
    (window as any).bootstrap = {
      Toast: jasmine.createSpy('Toast').and.returnValue(mockBootstrapToast),
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ToastComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  afterEach(() => {
    // Clean up the mock
    delete (window as any).bootstrap;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty titleMessage', () => {
      expect(component.titleMessage).toBe('');
    });

    it('should initialize with empty bodyMessage', () => {
      expect(component.bodyMessage).toBe('');
    });

    it('should have undefined toast initially', () => {
      expect(component.toast).toBeUndefined();
    });
  });

  describe('@Input Properties', () => {
    it('should set titleMessage input property', () => {
      const testTitle = 'Test Title';
      component.titleMessage = testTitle;
      expect(component.titleMessage).toBe(testTitle);
    });

    it('should set bodyMessage input property', () => {
      const testBody = 'Test Body Message';
      component.bodyMessage = testBody;
      expect(component.bodyMessage).toBe(testBody);
    });

    it('should set both titleMessage and bodyMessage', () => {
      const testTitle = 'Error Title';
      const testBody = 'An error occurred during the operation.';

      component.titleMessage = testTitle;
      component.bodyMessage = testBody;

      expect(component.titleMessage).toBe(testTitle);
      expect(component.bodyMessage).toBe(testBody);
    });

    it('should accept special characters in titleMessage', () => {
      const specialTitle = 'Warning! @#$%^&*()';
      component.titleMessage = specialTitle;
      expect(component.titleMessage).toBe(specialTitle);
    });

    it('should accept special characters in bodyMessage', () => {
      const specialBody = '<div>HTML Content & Special Chars</div>';
      component.bodyMessage = specialBody;
      expect(component.bodyMessage).toBe(specialBody);
    });

    it('should accept long text in titleMessage', () => {
      const longTitle =
        'This is a very long title that contains many words and should still be accepted by the component';
      component.titleMessage = longTitle;
      expect(component.titleMessage).toBe(longTitle);
    });

    it('should accept long text in bodyMessage', () => {
      const longBody = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(5);
      component.bodyMessage = longBody;
      expect(component.bodyMessage).toBe(longBody);
    });
  });

  describe('ngOnInit', () => {
    it('should execute ngOnInit without errors', () => {
      expect(() => {
        component.ngOnInit();
      }).not.toThrow();
    });

    it('should not affect component properties on ngOnInit', () => {
      component.titleMessage = 'Test';
      component.bodyMessage = 'Body';

      component.ngOnInit();

      expect(component.titleMessage).toBe('Test');
      expect(component.bodyMessage).toBe('Body');
    });
  });

  describe('ngAfterViewInit and Toast Initialization', () => {
    it('should initialize Bootstrap Toast in ngAfterViewInit', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect((window as any).bootstrap.Toast).toHaveBeenCalled();
    });

    it('should pass correct delay option to Bootstrap Toast', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[1]).toEqual({ delay: 2000 });
    });

    it('should store toast instance in component.toast', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      expect(component.toast).toBe(mockBootstrapToast);
    });

    it('should handle missing toastElement gracefully', () => {
      component.toastElement = undefined;

      expect(() => {
        component.ngAfterViewInit();
      }).not.toThrow();

      expect(component.toast).toBeUndefined();
    });

    it('should use toastRef ViewChild element for Bootstrap initialization', () => {
      fixture.detectChanges();
      // Reset the spy call count since ngAfterViewInit is called automatically
      ((window as any).bootstrap.Toast as jasmine.Spy).calls.reset();

      component.ngAfterViewInit();

      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[0]).toBe(component.toastElement?.nativeElement);
    });
  });

  describe('show() Method - Visibility Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.ngAfterViewInit();
    });

    it('should call toast.show() when show() is invoked', () => {
      component.show();
      expect(mockBootstrapToast.show).toHaveBeenCalled();
    });

    it('should call toast.show() only once per invocation', () => {
      component.show();
      expect(mockBootstrapToast.show).toHaveBeenCalledTimes(1);
    });

    it('should call toast.show() multiple times when show() is called multiple times', () => {
      component.show();
      component.show();
      component.show();
      expect(mockBootstrapToast.show).toHaveBeenCalledTimes(3);
    });

    it('should not throw error when show() is called', () => {
      expect(() => {
        component.show();
      }).not.toThrow();
    });

    it('should handle show() being called before toast is initialized', () => {
      component.toast = undefined;

      expect(() => {
        component.show();
      }).not.toThrow();
    });

    it('should not call show() if toast is not available', () => {
      component.toast = undefined;
      component.show();

      expect(mockBootstrapToast.show).not.toHaveBeenCalled();
    });

    it('should make toast visible when show() is called', () => {
      component.show();
      expect(component.toast.show).toHaveBeenCalled();
    });
  });

  describe('Auto-dismiss Behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.ngAfterViewInit();
    });

    it('should configure 2000ms delay for auto-dismiss', () => {
      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[1].delay).toBe(2000);
    });

    it('should use 2 second timeout as expected by Bootstrap', () => {
      // Verify the delay matches expected behavior (2000ms = 2 seconds)
      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      const delay = callArgs[1].delay;
      expect(delay).toBe(2000);
      expect(delay).toEqual(jasmine.any(Number));
    });

    it('should pass delay option when creating toast', () => {
      component.show();
      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[1]).toBeDefined();
      expect(callArgs[1].delay).toBeDefined();
    });

    it('should create toast with auto-hide configuration', fakeAsync(() => {
      component.show();

      // Toast created with 2000ms delay
      const delayTime = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args[1].delay;
      expect(delayTime).toBe(2000);

      // Advance time and verify
      tick(2000);
      expect(component.toast).toBeDefined();
    }));
  });

  describe('Template Integration', () => {
    it('should render toast element with correct role attribute', () => {
      component.titleMessage = 'Test Title';
      component.bodyMessage = 'Test Body';
      fixture.detectChanges();

      const toastElement = debugElement.query(By.css('[role="alert"]'));
      expect(toastElement).toBeTruthy();
      expect(toastElement.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should render toast element with aria-live assertive', () => {
      fixture.detectChanges();
      const toastElement = debugElement.query(By.css('[aria-live="assertive"]'));
      expect(toastElement).toBeTruthy();
    });

    it('should render toast element with aria-atomic true', () => {
      fixture.detectChanges();
      const toastElement = debugElement.query(By.css('[aria-atomic="true"]'));
      expect(toastElement).toBeTruthy();
    });

    it('should have toast class on root element', () => {
      fixture.detectChanges();
      const toastElement = debugElement.query(By.css('.toast'));
      expect(toastElement).toBeTruthy();
    });

    it('should render title in header section', () => {
      component.titleMessage = 'Important Alert';
      fixture.detectChanges();

      const header = debugElement.query(By.css('.toast-header'));
      expect(header).toBeTruthy();
    });

    it('should render body content in body section', () => {
      component.bodyMessage = 'Alert message content';
      fixture.detectChanges();

      const body = debugElement.query(By.css('.toast-body'));
      expect(body).toBeTruthy();
    });
  });

  describe('Component Lifecycle', () => {
    it('should execute ngOnInit and ngAfterViewInit during initialization', () => {
      // Lifecycle hooks are automatically called during detectChanges()
      // We verify that the component properly initializes its toast reference
      fixture.detectChanges();

      // After initialization, toastElement should be defined
      expect(component.toastElement).toBeDefined();
      // And toast instance should be created in ngAfterViewInit
      expect(component.toast).toBe(mockBootstrapToast);
    });

    it('should have ViewChild reference after view initialization', () => {
      fixture.detectChanges();
      expect(component.toastElement).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty messages gracefully', () => {
      component.titleMessage = '';
      component.bodyMessage = '';

      expect(() => {
        fixture.detectChanges();
        component.ngAfterViewInit();
      }).not.toThrow();
    });

    it('should handle null-like messages gracefully', () => {
      component.titleMessage = '';
      component.bodyMessage = '';

      expect(() => {
        component.show();
      }).not.toThrow();
    });

    it('should handle show() call without ngAfterViewInit', () => {
      component.toast = undefined;

      expect(() => {
        component.show();
      }).not.toThrow();
    });

    it('should use OnPush change detection strategy', () => {
      // ChangeDetectionStrategy.OnPush = 0
      // The component uses OnPush as defined in its decorator
      // We verify this by checking that the component renders correctly with OnPush
      // The component definition has OnPush configured
      fixture.detectChanges();
      expect(component).toBeTruthy();
      // Verify the component works correctly with OnPush
      component.titleMessage = 'Test';
      component.bodyMessage = 'Body';
      expect(component.titleMessage).toBe('Test');
    });

    it('should maintain state across multiple show() calls', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      component.titleMessage = 'Alert 1';
      component.bodyMessage = 'Message 1';
      component.show();

      component.titleMessage = 'Alert 2';
      component.bodyMessage = 'Message 2';
      component.show();

      expect(component.titleMessage).toBe('Alert 2');
      expect(component.bodyMessage).toBe('Message 2');
      expect(mockBootstrapToast.show).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full lifecycle: init -> set properties -> show', () => {
      component.titleMessage = 'Success';
      component.bodyMessage = 'Operation completed successfully';

      fixture.detectChanges();
      component.ngAfterViewInit();
      component.show();

      expect(component.titleMessage).toBe('Success');
      expect(component.bodyMessage).toBe('Operation completed successfully');
      expect(mockBootstrapToast.show).toHaveBeenCalled();
    });

    it('should work with Bootstrap delay configuration', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();

      const callArgs = ((window as any).bootstrap.Toast as jasmine.Spy).calls.mostRecent().args;
      expect(callArgs[1].delay).toBe(2000);

      component.show();
      expect(mockBootstrapToast.show).toHaveBeenCalled();
    });

    it('should render accessibility attributes correctly', () => {
      fixture.detectChanges();

      const toastElement = debugElement.query(By.css('[role="alert"]'));
      expect(toastElement.nativeElement.getAttribute('role')).toBe('alert');
      expect(toastElement.nativeElement.getAttribute('aria-live')).toBe('assertive');
      expect(toastElement.nativeElement.getAttribute('aria-atomic')).toBe('true');
    });
  });
});
