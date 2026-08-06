import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../font-awesome.module';

/** Intervalle entre deux tentatives de decodage (ms). */
const SCAN_INTERVAL_MS = 250;

/**
 * Sous-ensemble de l'API BarcodeDetector, absente des typages DOM de TypeScript.
 * On ne declare que ce qu'on utilise plutot que d'installer un paquet de types.
 */
interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?(): Promise<string[]>;
}

/** Prend une image du flux et renvoie le contenu du QR code, ou null. */
type QrDecoder = (video: HTMLVideoElement) => Promise<string | null>;

/**
 * Extrait l'identifiant utilisateur du contenu d'un QR code d'ami.
 *
 * Deux formes circulent et doivent toutes deux fonctionner :
 * - l'URL generee aujourd'hui par « Mon QR » : `<origin>/friends?add=<userId>` ;
 * - l'identifiant nu, encode par l'ancienne version du scanner — des codes deja
 *   partages ou imprimes contiennent cette forme.
 *
 * Renvoie null si le contenu n'est ni l'un ni l'autre, pour ne pas envoyer au
 * backend le texte d'un QR quelconque (vCard, lien publicitaire...).
 */
export function extractUserIdFromQr(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) {
    return null;
  }

  // URL.canParse n'existe pas sur Safari < 17, cible de test : on tente le parse.
  try {
    const add = new URL(value).searchParams.get('add')?.trim();
    return add ? add : null;
  } catch {
    // Pas une URL absolue : on retombe sur l'hypothese « identifiant nu ».
  }

  // Un identifiant Appwrite tient en 36 caracteres de [a-zA-Z0-9_-].
  return /^[a-zA-Z0-9_-]{1,36}$/.test(value) ? value : null;
}

/**
 * Scanner de QR code par la camera.
 *
 * Decode via l'API navigateur BarcodeDetector quand elle est disponible
 * (Chrome/Edge Android : zero octet ajoute au bundle), et retombe sur jsQR
 * charge en import dynamique pour Safari/iPad et Firefox.
 *
 * Le composant ne touche pas au FriendService : il remonte l'identifiant extrait
 * et laisse la page decider quoi en faire.
 */
@Component({
  selector: 'app-friend-qr-scanner',
  templateUrl: './friend-qr-scanner.component.html',
  styleUrls: ['./friend-qr-scanner.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendQrScannerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /** Identifiant utilisateur extrait d'un QR code valide. */
  readonly codeScanned = output<string>();

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');

  /** Camera allumee et boucle de decodage active. */
  readonly isScanning = signal(false);

  /** Autorisation / demarrage de la camera en cours. */
  readonly isStarting = signal(false);

  /** Cle de traduction du message d'erreur courant, ou null. */
  readonly errorKey = signal<string | null>(null);

  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private decoder: QrDecoder | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    // Deux filets en plus de l'arret explicite a la fermeture de la modale.
    //
    // ng-bootstrap attache la fenetre de modale a document.body, hors de la vue
    // de la page hote : une navigation ne la detruit donc pas forcement, et sans
    // l'abonnement au routeur la camera resterait allumee (voyant compris) apres
    // avoir quitte /friends.
    this.destroyRef.onDestroy(() => this.stop());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed()
      )
      .subscribe(() => this.stop());
  }

  /** Handler de clic : `start()` est asynchrone et ne rejette jamais. */
  onStartClick(): void {
    void this.start();
  }

  /** Allume la camera et lance la boucle de decodage. */
  async start(): Promise<void> {
    if (this.isScanning() || this.isStarting()) {
      return;
    }
    this.errorKey.set(null);

    // navigator.mediaDevices n'existe pas hors contexte securise : en http://
    // depuis une IP privee, l'objet lui-meme est undefined. On le signale au
    // lieu de laisser planter un appel sur undefined.
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      this.errorKey.set('friends.scanNoCamera');
      return;
    }

    const video = this.videoRef()?.nativeElement ?? null;
    if (!video) {
      this.errorKey.set('friends.scanFailed');
      return;
    }

    this.isStarting.set(true);
    let stream: MediaStream;
    try {
      // facingMode 'environment' n'est qu'une preference : sur un portable sans
      // camera arriere le navigateur renvoie la camera frontale sans echouer.
      stream = await mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (error: unknown) {
      this.isStarting.set(false);
      this.errorKey.set(this.isPermissionDenied(error) ? 'friends.scanDenied' : 'friends.scanFailed');
      return;
    }

    this.stream = stream;
    this.videoEl = video;
    video.srcObject = stream;
    // Requis par iOS pour une lecture en ligne : sans muted + playsInline,
    // Safari passe la video en plein ecran ou refuse de la demarrer.
    video.muted = true;
    video.playsInline = true;

    this.isScanning.set(true);
    this.isStarting.set(false);

    try {
      await video.play();
    } catch (error: unknown) {
      console.warn('[FriendQrScanner] Lecture video refusee:', error);
    }

    try {
      this.decoder = await this.createDecoder();
    } catch (error: unknown) {
      console.error('[FriendQrScanner] Aucun decodeur disponible:', error);
      this.stop();
      this.errorKey.set('friends.scanFailed');
      return;
    }

    // stop() a pu etre appele pendant les await ci-dessus (fermeture rapide).
    if (!this.isScanning()) {
      return;
    }
    this.scheduleTick();
  }

  /**
   * Eteint la camera et libere le flux.
   *
   * Idempotent : appele a la main, a la destruction et sur navigation.
   */
  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isScanning.set(false);
    this.isStarting.set(false);
    this.decoder = null;

    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }

    // C'est track.stop() qui eteint le capteur. Detacher le flux du <video> ne
    // suffit pas : le voyant de la camera resterait allume.
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  /**
   * Traite un contenu de QR code decode.
   *
   * Sur contenu valide on coupe la camera avant de remonter l'identifiant :
   * inutile de continuer a filmer pendant l'ajout.
   */
  onDecoded(raw: string): void {
    const userId = extractUserIdFromQr(raw);
    if (!userId) {
      // On continue de scanner : l'utilisateur a peut-etre cadre un autre code.
      this.errorKey.set('friends.scanInvalid');
      this.scheduleTick();
      return;
    }

    this.stop();
    this.codeScanned.emit(userId);
  }

  private scheduleTick(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.tick();
    }, SCAN_INTERVAL_MS);
  }

  private async tick(): Promise<void> {
    const decoder = this.decoder;
    const video = this.videoEl;
    if (!this.isScanning() || !decoder || !video) {
      return;
    }

    // Les premieres frames arrivent apres le demarrage du flux : tant que la
    // video n'a pas de dimensions, tout decodage renverrait null.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      this.scheduleTick();
      return;
    }

    let raw: string | null = null;
    try {
      raw = await decoder(video);
    } catch (error: unknown) {
      console.warn('[FriendQrScanner] Frame illisible:', error);
    }

    if (!this.isScanning()) {
      return;
    }
    if (raw) {
      this.onDecoded(raw);
      return;
    }
    this.scheduleTick();
  }

  private async createDecoder(): Promise<QrDecoder> {
    return (await this.createNativeDecoder()) ?? (await this.createFallbackDecoder());
  }

  /** Decodeur natif BarcodeDetector, ou null si indisponible sur la plateforme. */
  private async createNativeDecoder(): Promise<QrDecoder | null> {
    const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!ctor) {
      return null;
    }

    try {
      // Chrome expose BarcodeDetector sur des plateformes ou aucun format n'est
      // supporte (macOS notamment). Sans cette verification on partirait sur un
      // detecteur qui ne trouve jamais rien, au lieu de basculer sur jsQR.
      const formats = await ctor.getSupportedFormats?.();
      if (formats && !formats.includes('qr_code')) {
        return null;
      }

      const detector = new ctor({ formats: ['qr_code'] });
      return async (video: HTMLVideoElement) => {
        const codes = await detector.detect(video);
        return codes.length > 0 ? codes[0].rawValue : null;
      };
    } catch (error: unknown) {
      console.warn('[FriendQrScanner] BarcodeDetector inutilisable, repli sur jsQR:', error);
      return null;
    }
  }

  /** Repli jsQR pour iPad/Safari et Firefox. */
  private async createFallbackDecoder(): Promise<QrDecoder> {
    // Import DYNAMIQUE volontaire : jsQR pese ~250 ko non minifies. Un import
    // statique l'ajouterait au bundle initial, deja a 1,1 Mo pour un budget
    // d'erreur a 1,5 Mo. Ici le poids n'est paye qu'a l'ouverture du scanner,
    // et seulement sur les navigateurs sans BarcodeDetector.
    const { default: jsQR } = await import('jsqr');

    return async (video: HTMLVideoElement) => {
      const frame = this.grabFrame(video);
      if (!frame) {
        return null;
      }
      // 'dontInvert' : deux fois moins de travail par frame, et les QR d'ami sont
      // toujours sombres sur fond clair.
      return jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
    };
  }

  /** Recopie la frame courante dans un canvas hors DOM pour la lire en pixels. */
  private grabFrame(video: HTMLVideoElement): ImageData | null {
    this.canvas ??= document.createElement('canvas');
    const canvas = this.canvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // willReadFrequently : sans ce drapeau les navigateurs gardent le canvas sur
    // le GPU et chaque getImageData force un aller-retour couteux.
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return null;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  private isPermissionDenied(error: unknown): boolean {
    const name = (error as { name?: string } | null)?.name;
    return name === 'NotAllowedError' || name === 'SecurityError';
  }
}
