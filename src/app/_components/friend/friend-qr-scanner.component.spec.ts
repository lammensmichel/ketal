import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { FriendQrScannerComponent, extractUserIdFromQr } from './friend-qr-scanner.component';

/**
 * Aucun test ne touche a une vraie camera : `navigator.mediaDevices` est
 * remplace le temps du test et restaure ensuite, sinon les autres suites
 * heriteraient du stub.
 */
describe('extractUserIdFromQr', () => {
  it("extrait l'identifiant d'une URL ?add=", () => {
    expect(extractUserIdFromQr('https://192.168.1.81:4443/friends?add=user-42')).toBe('user-42');
  });

  it("extrait l'identifiant d'une URL ?add= avec d'autres parametres", () => {
    expect(extractUserIdFromQr('https://ketal.app/friends?lang=fr&add=abc123&x=1')).toBe('abc123');
  });

  it('accepte un identifiant brut (ancien format de QR)', () => {
    expect(extractUserIdFromQr('68f0a1b2c3d4e5f60718')).toBe('68f0a1b2c3d4e5f60718');
  });

  it('ignore les espaces autour de la valeur', () => {
    expect(extractUserIdFromQr('  user-42  ')).toBe('user-42');
  });

  it('renvoie null pour une URL sans parametre add', () => {
    expect(extractUserIdFromQr('https://ketal.app/friends')).toBeNull();
  });

  it('renvoie null pour un contenu qui n_est ni URL ni identifiant', () => {
    expect(extractUserIdFromQr('BEGIN:VCARD\nFN:Bob\nEND:VCARD')).toBeNull();
    expect(extractUserIdFromQr('')).toBeNull();
    expect(extractUserIdFromQr(null)).toBeNull();
  });
});

describe('FriendQrScannerComponent', () => {
  let component: FriendQrScannerComponent;
  let fixture: ComponentFixture<FriendQrScannerComponent>;
  let videoEl: HTMLVideoElement;
  let routerEvents: Subject<NavigationStart>;
  let track: { stop: jasmine.Spy };
  let stream: MediaStream;
  let getUserMedia: jasmine.Spy;

  const originalMediaDevices = navigator.mediaDevices;
  const windowWithDetector = window as unknown as { BarcodeDetector?: unknown };
  const originalDetector = windowWithDetector.BarcodeDetector;

  /** Remplace navigator.mediaDevices (non assignable directement). */
  function setMediaDevices(value: unknown): void {
    Object.defineProperty(navigator, 'mediaDevices', { value, configurable: true });
  }

  beforeEach(async () => {
    routerEvents = new Subject<NavigationStart>();
    track = { stop: jasmine.createSpy('stop') };
    // Un vrai MediaStream : le setter srcObject refuse un objet quelconque.
    stream = new MediaStream();
    spyOn(stream, 'getTracks').and.returnValue([track as unknown as MediaStreamTrack]);
    getUserMedia = jasmine.createSpy('getUserMedia').and.resolveTo(stream);
    setMediaDevices({ getUserMedia });

    // Detecteur natif simule : evite le chargement de jsQR dans les tests et
    // rend la boucle de decodage deterministe.
    windowWithDetector.BarcodeDetector = class {
      static getSupportedFormats(): Promise<string[]> {
        return Promise.resolve(['qr_code']);
      }
      detect(): Promise<{ rawValue: string }[]> {
        return Promise.resolve([]);
      }
    };

    await TestBed.configureTestingModule({
      imports: [FriendQrScannerComponent, TranslateModule.forRoot()],
      providers: [{ provide: Router, useValue: { events: routerEvents.asObservable() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(FriendQrScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    videoEl = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
    // play() sur un flux simule reste pendant indefiniment dans Chrome.
    spyOn(videoEl, 'play').and.resolveTo();
  });

  afterEach(() => {
    setMediaDevices(originalMediaDevices);
    windowWithDetector.BarcodeDetector = originalDetector;
  });

  it('se cree', () => {
    expect(component).toBeTruthy();
    expect(component.isScanning()).toBeFalse();
  });

  it('signale une camera indisponible quand mediaDevices est absent (http://)', async () => {
    setMediaDevices(undefined);

    await component.start();

    expect(component.errorKey()).toBe('friends.scanNoCamera');
    expect(component.isScanning()).toBeFalse();
    expect(component.isStarting()).toBeFalse();
  });

  it("signale un refus d'autorisation", async () => {
    const denied = new Error('denied');
    denied.name = 'NotAllowedError';
    getUserMedia.and.rejectWith(denied);

    await component.start();

    expect(component.errorKey()).toBe('friends.scanDenied');
    expect(component.isScanning()).toBeFalse();
  });

  it('demarre la camera et affiche le flux', async () => {
    await component.start();

    expect(getUserMedia).toHaveBeenCalled();
    expect(component.isScanning()).toBeTrue();
    expect(videoEl.srcObject).toBe(stream);
  });

  it('arrete les pistes video a la fermeture', async () => {
    await component.start();

    component.stop();

    expect(track.stop).toHaveBeenCalled();
    expect(component.isScanning()).toBeFalse();
    expect(videoEl.srcObject).toBeNull();
  });

  it('arrete les pistes video a la destruction du composant', async () => {
    await component.start();

    fixture.destroy();

    expect(track.stop).toHaveBeenCalled();
  });

  it('arrete les pistes video au changement de route', async () => {
    await component.start();

    routerEvents.next(new NavigationStart(1, '/rooms'));

    expect(track.stop).toHaveBeenCalled();
    expect(component.isScanning()).toBeFalse();
  });

  it("remonte l'identifiant extrait d'une URL et coupe la camera", async () => {
    await component.start();
    const emitted: string[] = [];
    component.codeScanned.subscribe((userId) => emitted.push(userId));

    component.onDecoded('https://192.168.1.81:4443/friends?add=user-42');

    expect(emitted).toEqual(['user-42']);
    expect(track.stop).toHaveBeenCalled();
    expect(component.isScanning()).toBeFalse();
  });

  it("remonte l'identifiant brut d'un ancien QR code", () => {
    const emitted: string[] = [];
    component.codeScanned.subscribe((userId) => emitted.push(userId));

    component.onDecoded('68f0a1b2c3d4e5f60718');

    expect(emitted).toEqual(['68f0a1b2c3d4e5f60718']);
  });

  it('refuse un QR code etranger sans rien remonter', () => {
    const emitted: string[] = [];
    component.codeScanned.subscribe((userId) => emitted.push(userId));

    component.onDecoded('https://exemple.com/promo');

    expect(emitted).toEqual([]);
    expect(component.errorKey()).toBe('friends.scanInvalid');
  });
});
