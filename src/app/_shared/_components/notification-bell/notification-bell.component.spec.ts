import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { NotificationBellComponent } from './notification-bell.component';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let unreadCount: ReturnType<typeof signal<number>>;
  let isLoggedIn: ReturnType<typeof signal<boolean>>;
  let mockNotificationService: {
    unreadCount: unknown;
    openNotifications: jasmine.Spy;
    requestBrowserPermission: jasmine.Spy;
  };

  beforeEach(async () => {
    unreadCount = signal(0);
    isLoggedIn = signal(true);

    mockNotificationService = {
      unreadCount: unreadCount.asReadonly(),
      openNotifications: jasmine.createSpy('openNotifications').and.resolveTo(undefined),
      requestBrowserPermission: jasmine.createSpy('requestBrowserPermission').and.resolveTo(false),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: { isLoggedIn: isLoggedIn.asReadonly() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se cree', () => {
    expect(component).toBeTruthy();
  });

  it('n_affiche aucune pastille quand rien n_est en attente', () => {
    expect(fixture.nativeElement.querySelector('.btn-bell')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.bell-badge')).toBeNull();
  });

  it('affiche le nombre d_elements en attente', () => {
    unreadCount.set(3);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bell-badge').textContent.trim()).toBe('3');
  });

  it('plafonne l_affichage a 99+', () => {
    unreadCount.set(150);
    fixture.detectChanges();

    // Le nombre exact n'apporte rien passe 99 et deformerait la pastille.
    expect(component.badgeLabel()).toBe('99+');
  });

  it('n_affiche rien du tout a un visiteur non connecte', () => {
    isLoggedIn.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-bell')).toBeNull();
  });

  it('navigue vers les notifications au clic', () => {
    fixture.nativeElement.querySelector('.btn-bell').click();

    expect(mockNotificationService.openNotifications).toHaveBeenCalled();
  });

  it('demande la permission navigateur SUR LE GESTE, pas au chargement', () => {
    // Une demande posee au chargement est bloquee par les navigateurs.
    expect(mockNotificationService.requestBrowserPermission).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('.btn-bell').click();

    expect(mockNotificationService.requestBrowserPermission).toHaveBeenCalled();
  });
});
