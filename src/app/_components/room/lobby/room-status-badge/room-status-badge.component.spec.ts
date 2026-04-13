import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RoomStatusBadgeComponent } from './room-status-badge.component';

describe('RoomStatusBadgeComponent', () => {
  let component: RoomStatusBadgeComponent;
  let fixture: ComponentFixture<RoomStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RoomStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomStatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'waiting');
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('applies .waiting and exposes the waiting translation key', () => {
    expect(component.labelKey()).toBe('lobby.roomStatus.waiting');
    expect(fixture.nativeElement.querySelector('.status-badge.waiting')).toBeTruthy();
  });

  it('swaps to .playing when status changes', () => {
    fixture.componentRef.setInput('status', 'playing');
    fixture.detectChanges();

    expect(component.labelKey()).toBe('lobby.roomStatus.playing');
    expect(fixture.nativeElement.querySelector('.status-badge.playing')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.status-badge.waiting')).toBeFalsy();
  });

  it('renders .finished variant for finished rooms', () => {
    fixture.componentRef.setInput('status', 'finished');
    fixture.detectChanges();

    expect(component.labelKey()).toBe('lobby.roomStatus.finished');
    expect(fixture.nativeElement.querySelector('.status-badge.finished')).toBeTruthy();
  });

  it('sets aria-label and role=status for screen readers', () => {
    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-label')).toBeTruthy();
  });
});
