import { Component, EventEmitter, inject, Output, signal, computed, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { PlayerHelperService } from 'src/app/_shared/_helpers/player.helper';
import { PlayerModel } from 'src/app/_shared/_models/player.model';
import { LocalService } from 'src/app/services/local/local.service';
import { isNullOrWhiteSpace } from 'src/app/_shared/_helpers/string.helper';
import { GameService } from '../../../services/game/game.service';
import { RoomService } from '../../../services/room/room.service';
import { PlayerListPlayerComponent } from '../player-list-player/player-list-player.component';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, TranslateModule, PlayerListPlayerComponent, QRCodeComponent],
})
export class PlayersListComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly localService = inject(LocalService);
  private readonly destroyRef = inject(DestroyRef);
  readonly playerHelper = inject(PlayerHelperService);
  readonly gameSrv = inject(GameService);
  readonly translate = inject(TranslateService);
  readonly roomService = inject(RoomService);

  readonly playersForm: FormGroup;
  allPlayersCreated = false;
  @Output() readonly beginGame = new EventEmitter<void>();

  /** Whether the invite panel is shown */
  readonly showInvite = signal(false);

  /** Success message for copy feedback */
  readonly inviteCopySuccess = signal<string | null>(null);

  /** Computed: whether a room exists (invite button visible) */
  readonly hasRoom = computed(() => !!this.roomService.currentRoom());

  /** Computed: invite URL */
  readonly inviteUrl = computed(() => {
    const room = this.roomService.currentRoom();
    if (!room) {
      return '';
    }
    return `${window.location.origin}/room/join/${room.code}`;
  });

  /** Timeout ID for cleanup */
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const localPlayer = JSON.parse(this.localService.getData('players') as string);
    if (localPlayer) {
      this.playerHelper.players = localPlayer;
    }
    this.playersForm = this.fb.group({
      newPlayer: ['', Validators.required],
    });

    this.destroyRef.onDestroy(() => {
      if (this.successTimeoutId) {
        clearTimeout(this.successTimeoutId);
      }
    });
  }

  public addPlayer() {
    if (!this.playerHelper.isMaxPlayerNumberNotReached()) {
      return;
    }

    if (this.playersForm.valid && !isNullOrWhiteSpace(this.playersForm.controls['newPlayer'].value)) {
      this.playerHelper.addPlayer(this.playersForm.value.newPlayer);
      this.playersForm.reset();
    }
  }

  public getPlayers(): PlayerModel[] {
    return this.gameSrv.isNewGame() ? this.playerHelper.getPlayers() : this.gameSrv.players();
  }

  public getNewPlayerInputPlaceholder(): string {
    return this.translate.instant('Label_PlaceHolder_PlayerName');
  }

  public isGamePaused(): boolean {
    return this.gameSrv.isGameInProgress();
  }

  public resumeGame(): void {
    this.router.navigate(['/game']);
  }

  get newPlayer() {
    return this.playersForm.get('newPlayer');
  }

  /** Toggle invite panel visibility */
  toggleInvite(): void {
    this.showInvite.update((v) => !v);
  }

  /** Copy invite link to clipboard */
  async copyInviteLink(): Promise<void> {
    const url = this.inviteUrl();
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      this.inviteCopySuccess.set('room.linkCopied');

      if (this.successTimeoutId) {
        clearTimeout(this.successTimeoutId);
      }

      this.successTimeoutId = setTimeout(() => {
        this.inviteCopySuccess.set(null);
        this.successTimeoutId = null;
      }, 2000);
    } catch {
      // Clipboard API may not be available
    }
  }
}
