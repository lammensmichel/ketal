import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCaretRight,
  faCaretLeft,
  faMinus,
  faPlus,
  faWineGlass,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { AuthService } from './app/services/auth/auth.service';

/**
 * Initialize authentication on app startup
 * Restores any existing session from Appwrite
 */
function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => authService.init();
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    {
      provide: FaIconLibrary,
      useFactory: () => {
        const library = new FaIconLibrary();
        library.addIcons(faCaretRight, faCaretLeft, faMinus, faPlus, faWineGlass, faRightFromBracket);
        return library;
      },
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
