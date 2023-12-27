import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerGivenSipsSelectionComponent } from './player-given-sips-selection.component';

describe('PlayerGivenSipsSelectionComponent', () => {
  let component: PlayerGivenSipsSelectionComponent;
  let fixture: ComponentFixture<PlayerGivenSipsSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerGivenSipsSelectionComponent]
    });
    fixture = TestBed.createComponent(PlayerGivenSipsSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
