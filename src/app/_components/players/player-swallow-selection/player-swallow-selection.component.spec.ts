import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSwallowSelectionComponent } from './player-swallow-selection.component';

describe('PlayerSwallowSelectionComponent', () => {
  let component: PlayerSwallowSelectionComponent;
  let fixture: ComponentFixture<PlayerSwallowSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerSwallowSelectionComponent]
    });
    fixture = TestBed.createComponent(PlayerSwallowSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
