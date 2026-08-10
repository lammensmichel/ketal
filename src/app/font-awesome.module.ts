import { NgModule } from '@angular/core';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Solid icons
import {
  faCaretRight,
  faCaretLeft,
  faMinus,
  faPlus,
  faWineGlass,
  faUserCircle,
  faGlobe,
  faSignInAlt,
  faSignOutAlt,
  faHome,
  faPlay,
  faBars,
  faTimes,
  faTrophy,
  faMedal,
  faRedo,
  faDoorOpen,
  faRightFromBracket,
  faPause,
  faRotateRight,
  faFolder,
  faUsers,
  faUserPlus,
  faQrcode,
  faSearch,
  faSpinner,
  faCamera,
  faUserMinus,
  faCopy,
  faEye,
  faTv,
  faBell,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';

@NgModule({
  imports: [FontAwesomeModule],
  exports: [FontAwesomeModule],
})
export class FontAwesomeIconsModule {
  constructor(library: FaIconLibrary) {
    // Add solid icons
    library.addIcons(
      faCaretRight,
      faCaretLeft,
      faMinus,
      faPlus,
      faWineGlass,
      faUserCircle,
      faGlobe,
      faSignInAlt,
      faSignOutAlt,
      faHome,
      faPlay,
      faBars,
      faTimes,
      faTrophy,
      faMedal,
      faRedo,
      faDoorOpen,
      faRightFromBracket,
      faPause,
      faRotateRight,
      faFolder,
      faUsers,
      faUserPlus,
      faQrcode,
      faSearch,
      faSpinner,
      faCamera,
      faUserMinus,
      faCopy,
      faEye,
      faTv,
      faBell,
      faCheck
    );
  }
}
