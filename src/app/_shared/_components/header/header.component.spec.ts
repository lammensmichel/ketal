import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, Event } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { HeaderComponent } from './header.component';
import { GameService } from '../../../services/game/game.service';
import { createMockGameService } from '../../../testing/test-helpers';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<Event>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    routerEventsSubject = new Subject<Event>();
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable(),
      url: '/',
    });

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HeaderComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('restartGame', () => {
    it('should call gameSrv.resetGame()', () => {
      component.restartGame();
      expect(mockGameService.resetGame).toHaveBeenCalled();
    });

    it('should navigate to /players', () => {
      component.restartGame();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
    });
  });
});
