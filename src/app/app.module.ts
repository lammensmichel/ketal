import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { CardDeckHelperService } from 'src/app/_shared/_helpers/card-deck.helper';
import { PlayerHelperService } from 'src/app/_shared/_helpers/player.helper';
import { LocalService } from 'src/app/services/local/local.service';
import { WebsocketService } from 'src/app/services/websocket/websocket.service';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FontAwesomeIconsModule } from './font-awesome.module';

const config: SocketIoConfig = { url: environment.socketIoUrl, options: {} };

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FontAwesomeIconsModule,
    SocketIoModule.forRoot(config),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    PlayerHelperService,
    CardDeckHelperService,
    LocalService,
    WebsocketService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
