import { ComponentFixture, TestBed } from '@angular/core/testing';

import { secondPhaseComponent } from './second-phase.component';

describe('secondPhaseComponent', () => {
  let component: secondPhaseComponent;
  let fixture: ComponentFixture<secondPhaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [secondPhaseComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(secondPhaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
