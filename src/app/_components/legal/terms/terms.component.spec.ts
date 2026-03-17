import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterModule.forRoot([]), TermsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should render the terms title', () => {
      const title = fixture.nativeElement.querySelector('.terms-title');
      expect(title).toBeTruthy();
    });

    it('should render all terms sections', () => {
      const sections = fixture.nativeElement.querySelectorAll('.terms-section');
      expect(sections.length).toBe(5);
    });

    it('should render the health warning with special styling', () => {
      const warning = fixture.nativeElement.querySelector('.health-warning');
      expect(warning).toBeTruthy();
    });

    it('should render a back to register link', () => {
      const backLink = fixture.nativeElement.querySelector('.terms-back a');
      expect(backLink).toBeTruthy();
      expect(backLink.getAttribute('href')).toBe('/register');
    });
  });
});
