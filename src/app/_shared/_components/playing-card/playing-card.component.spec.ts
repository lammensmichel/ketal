import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PlayingCardComponent } from './playing-card.component';
import { CardType } from '../../_models/card-type.model';
import { By } from '@angular/platform-browser';

describe('PlayingCardComponent', () => {
  let component: PlayingCardComponent;
  let fixture: ComponentFixture<PlayingCardComponent>;
  let compiled: DebugElement;

  // Mock card data for testing
  const mockCard: CardType = {
    value: 'King',
    suit: 'Hearts',
    icon: 'hearts',
    sips: 5,
    selected: false,
    img: 'assets/images/cards/svg/kh.svg',
    givenSips: 0,
  };

  const mockSelectedCard: CardType = {
    value: 'Ace',
    suit: 'Spades',
    icon: 'spades',
    sips: 3,
    selected: true,
    img: 'assets/images/cards/svg/as.svg',
    givenSips: 2,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PlayingCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayingCardComponent);
    component = fixture.componentInstance;
    compiled = fixture.debugElement;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have card property initialized as undefined', () => {
      expect(component.card).toBeUndefined();
    });

    it('should have leftOverlap property initialized to false', () => {
      expect(component.leftOverlap).toBe(false);
    });
  });

  describe('@Input card property binding', () => {
    it('should accept a card input', () => {
      component.card = mockCard;
      expect(component.card).toEqual(mockCard);
    });

    it('should accept undefined card input', () => {
      component.card = undefined;
      expect(component.card).toBeUndefined();
    });

    it('should handle card with all properties defined', () => {
      component.card = mockCard;
      expect(component.card?.value).toBe('King');
      expect(component.card?.suit).toBe('Hearts');
      expect(component.card?.icon).toBe('hearts');
      expect(component.card?.sips).toBe(5);
      expect(component.card?.img).toBe('assets/images/cards/svg/kh.svg');
    });

    it('should handle card with nullable properties', () => {
      const cardWithNulls: CardType = {
        value: null,
        suit: null,
        icon: null,
        sips: 0,
        selected: null,
        img: null,
        givenSips: undefined,
      };
      component.card = cardWithNulls;
      expect(component.card?.value).toBeNull();
      expect(component.card?.suit).toBeNull();
    });
  });

  describe('@Input leftOverlap property binding', () => {
    it('should accept leftOverlap input', () => {
      component.leftOverlap = true;
      expect(component.leftOverlap).toBe(true);
    });

    it('should have default value of false', () => {
      expect(component.leftOverlap).toBe(false);
    });

    it('should toggle leftOverlap value', () => {
      component.leftOverlap = true;
      expect(component.leftOverlap).toBe(true);
      component.leftOverlap = false;
      expect(component.leftOverlap).toBe(false);
    });
  });

  describe('Template rendering with card data', () => {
    it('should render card container div', () => {
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container).toBeTruthy();
    });

    it('should render img element inside container', () => {
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img).toBeTruthy();
    });

    it('should apply card-container classes', () => {
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      const classes = container.nativeElement.className;
      expect(classes).toContain('card-container');
      expect(classes).toContain('d-flex');
      expect(classes).toContain('flex-column');
      expect(classes).toContain('justify-content-center');
    });

    it('should render card image with correct src when card is provided', () => {
      component.card = mockCard;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('kh.svg');
    });

    it('should render default back image when card is undefined', () => {
      component.card = undefined;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('blue_back.svg');
    });

    it('should render default back image when card.img is null', () => {
      component.card = {
        value: 'King',
        suit: 'Hearts',
        icon: 'hearts',
        sips: 5,
        selected: false,
        img: null,
        givenSips: 0,
      };
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('blue_back.svg');
    });

    it('should render correct alt text for card image', () => {
      component.card = mockCard;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.alt).toBe('King Hearts');
    });

    it('should render alt text with null values', () => {
      const cardWithNulls: CardType = {
        value: null,
        suit: null,
        icon: null,
        sips: 0,
        selected: null,
        img: null,
        givenSips: undefined,
      };
      component.card = cardWithNulls;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.alt).toBe(' ');
    });

    it('should apply emphasis class when card is selected', () => {
      component.card = mockSelectedCard;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('emphasis')).toBe(true);
    });

    it('should not apply emphasis class when card is not selected', () => {
      component.card = mockCard;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('emphasis')).toBe(false);
    });

    it('should not apply emphasis class when card is undefined', () => {
      component.card = undefined;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('emphasis')).toBe(false);
    });

    it('should apply left-overlap class when leftOverlap is true', () => {
      component.leftOverlap = true;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('left-overlap')).toBe(true);
    });

    it('should not apply left-overlap class when leftOverlap is false', () => {
      component.leftOverlap = false;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('left-overlap')).toBe(false);
    });

    it('should apply both emphasis and left-overlap classes together', () => {
      component.card = mockSelectedCard;
      component.leftOverlap = true;
      fixture.detectChanges();
      const container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('emphasis')).toBe(true);
      expect(container.nativeElement.classList.contains('left-overlap')).toBe(true);
    });
  });

  describe('card input property', () => {
    it('should accept card with suit property', () => {
      component.card = mockCard;
      expect(component.card?.suit).toBe('Hearts');
    });

    it('should handle card without suit property', () => {
      const cardWithoutSuit: CardType = {
        value: 'King',
        suit: null,
        icon: 'hearts',
        sips: 5,
        selected: false,
        img: 'assets/images/cards/svg/kh.svg',
        givenSips: 0,
      };
      component.card = cardWithoutSuit;
      expect(component.card?.suit).toBeNull();
    });

    it('should handle undefined card', () => {
      component.card = undefined;
      expect(component.card).toBeUndefined();
    });
  });

  describe('Change Detection', () => {
    it('should use default change detection strategy (component does not use OnPush)', () => {
      // PlayingCardComponent uses the default ChangeDetectionStrategy
      // This test verifies the component can detect changes properly
      component.card = mockCard;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('kh.svg');
    });

    it('should update view when card input changes', () => {
      component.card = mockCard;
      fixture.detectChanges();
      let img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('kh.svg');

      component.card = mockSelectedCard;
      fixture.detectChanges();
      img = compiled.query(By.css('.card-container img'));
      expect(img.nativeElement.src).toContain('as.svg');
    });

    it('should update view when leftOverlap input changes', () => {
      component.leftOverlap = false;
      fixture.detectChanges();
      let container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('left-overlap')).toBe(false);

      component.leftOverlap = true;
      fixture.detectChanges();
      container = compiled.query(By.css('.card-container'));
      expect(container.nativeElement.classList.contains('left-overlap')).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle card with empty string properties', () => {
      const cardWithEmptyStrings: CardType = {
        value: '',
        suit: '',
        icon: '',
        sips: 0,
        selected: false,
        img: '',
        givenSips: 0,
      };
      component.card = cardWithEmptyStrings;
      fixture.detectChanges();
      const img = compiled.query(By.css('.card-container img'));
      expect(img).toBeTruthy();
    });

    it('should handle card with special characters in suit', () => {
      const cardWithSpecialChars: CardType = {
        value: 'King',
        suit: '♥ Hearts',
        icon: 'hearts',
        sips: 5,
        selected: false,
        img: 'assets/images/cards/svg/kh.svg',
        givenSips: 0,
      };
      component.card = cardWithSpecialChars;
      expect(component.card?.suit).toBe('♥ Hearts');
    });

    it('should handle card with large sips value', () => {
      const cardWithHighSips: CardType = {
        value: 'Ace',
        suit: 'Spades',
        icon: 'spades',
        sips: 999,
        selected: false,
        img: 'assets/images/cards/svg/as.svg',
        givenSips: 500,
      };
      component.card = cardWithHighSips;
      expect(component.card?.sips).toBe(999);
      expect(component.card?.givenSips).toBe(500);
    });

    it('should handle rapid card changes', () => {
      component.card = mockCard;
      expect(component.card?.suit).toBe('Hearts');

      component.card = mockSelectedCard;
      expect(component.card?.suit).toBe('Spades');

      component.card = mockCard;
      expect(component.card?.suit).toBe('Hearts');
    });
  });
});
