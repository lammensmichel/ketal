import { NgModule } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Solid icons
import { faCaretRight, faCaretLeft, faMinus, faPlus, faWineGlass } from '@fortawesome/free-solid-svg-icons';

// Regular icons
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';

@NgModule({
  imports: [FontAwesomeModule],
  exports: [FontAwesomeModule],
})
export class FontAwesomeIconsModule {
  constructor(library: FaIconLibrary) {
    // Add solid icons
    library.addIcons(faCaretRight, faCaretLeft, faMinus, faPlus, faWineGlass);

    // Add regular icons
    library.addIcons(faCircleXmark);
  }
}
