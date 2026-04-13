import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { SoloRoomService } from '../../../services/solo-room/solo-room.service';
import { createMockAuthService, createMockGameService, createMockSoloRoomService } from '../../../testing/test-helpers';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterModule.forRoot([]), LoginComponent],
      providers: [
        { provide: AuthService, useValue: createMockAuthService() },
        { provide: GameService, useValue: createMockGameService() },
        { provide: SoloRoomService, useValue: createMockSoloRoomService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should render the legal disclaimer', () => {
      const disclaimer = fixture.nativeElement.querySelector('.legal-disclaimer');
      expect(disclaimer).toBeTruthy();
    });

    it('should render the disclaimer text element', () => {
      const disclaimerText = fixture.nativeElement.querySelector('.legal-disclaimer p');
      expect(disclaimerText).toBeTruthy();
    });
  });
});
