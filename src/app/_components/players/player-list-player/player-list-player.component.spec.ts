import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerListPlayerComponent } from './player-list-player.component';

describe('PlayerListPlayerComponent', () => {
  let component: PlayerListPlayerComponent;
  let fixture: ComponentFixture<PlayerListPlayerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerListPlayerComponent]
    });
    fixture = TestBed.createComponent(PlayerListPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
