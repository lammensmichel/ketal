import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './header.component';
import { GameService } from '../../../services/game/game.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;

  beforeEach(async () => {
    mockGameService = jasmine.createSpyObj('GameService', ['resetGame'], {
      game: undefined,
    });

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call openMenu on sideMenu when openSideMenu is called', () => {
    const mockSideMenu = { openMenu: jasmine.createSpy('openMenu') };
    component.sideMenu = mockSideMenu as never;
    component.openSideMenu();
    expect(mockSideMenu.openMenu).toHaveBeenCalled();
  });

  it('should not throw when sideMenu is not set', () => {
    expect(() => component.openSideMenu()).not.toThrow();
  });
});
