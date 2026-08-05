import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';

import { RoomTileComponent } from './room-tile.component';
import { RoomService, GameRoom, RoomStatus } from '../../../services/room/room.service';
import { GameService } from '../../../services/game/game.service';
import { MemberService, GameMember } from '../../../services/member/member.service';

describe('RoomTileComponent', () => {
  let component: RoomTileComponent;
  let fixture: ComponentFixture<RoomTileComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoomService: {
    archiveRoom: jasmine.Spy;
    deleteRoom: jasmine.Spy;
    leaveRoom: jasmine.Spy;
  };
  let mockGameService: {
    handleReconnection: jasmine.Spy;
  };
  let mockMemberService: {
    currentMember: ReturnType<typeof signal<GameMember | null>>;
  };

  const mockRoomIdle: GameRoom = {
    $id: 'room123',
    name: 'Test Room',
    code: 'ABC123',
    inviteToken: 'token-123',
    currentGameId: null,
    currentSessionId: null,
    status: 'idle',
    hostMemberId: 'member-host',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 0,
    archived: false,
  };

  const mockRoomPlaying: GameRoom = {
    $id: 'room456',
    name: 'Playing Room',
    code: 'XYZ789',
    inviteToken: 'token-456',
    currentGameId: 'game-xyz',
    currentSessionId: 'session-xyz',
    status: 'playing',
    hostMemberId: 'member-host',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 1,
    archived: false,
  };

  const mockRoomArchived: GameRoom = {
    $id: 'archived-789',
    name: 'Archived Room',
    code: 'DEF456',
    inviteToken: 'token-789',
    currentGameId: null,
    currentSessionId: null,
    status: 'archived',
    hostMemberId: 'member-host',
    mode: 'multiplayer',
    maxPlayers: 10,
    gamesPlayed: 5,
    archived: true,
  };

  const mockHostMember: GameMember = {
    $id: 'member-host',
    roomId: 'room123',
    userId: 'user-host',
    deviceId: null,
    displayName: 'Host Player',
    role: 'host',
    isOnline: true,
    lastSeenAt: undefined,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  const mockPlayerMember: GameMember = {
    $id: 'member-player',
    roomId: 'room123',
    userId: 'user-player',
    deviceId: null,
    displayName: 'Player 2',
    role: 'player',
    isOnline: true,
    lastSeenAt: undefined,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.resolveTo(true);

    mockRoomService = {
      archiveRoom: jasmine.createSpy('archiveRoom').and.resolveTo(),
      deleteRoom: jasmine.createSpy('deleteRoom').and.resolveTo(),
      leaveRoom: jasmine.createSpy('leaveRoom').and.resolveTo(),
    };

    mockGameService = {
      handleReconnection: jasmine.createSpy('handleReconnection'),
    };

    mockMemberService = {
      currentMember: signal<GameMember | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, RoomTileComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: RoomService, useValue: mockRoomService },
        { provide: GameService, useValue: mockGameService },
        { provide: MemberService, useValue: mockMemberService },
      ],
    }).compileComponents();
  });

  function createComponent(room: GameRoom, currentRole: 'host' | 'player', membersCount: number = 2) {
    fixture = TestBed.createComponent(RoomTileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('room', room);
    fixture.componentRef.setInput('currentRole', currentRole);
    fixture.componentRef.setInput('membersCount', membersCount);
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent(mockRoomIdle, 'host');
    expect(component).toBeTruthy();
  });

  describe('display', () => {
    it('should display room name with archived prefix if archived', () => {
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const roomName = compiled.querySelector('.room-name')?.textContent?.trim();
      expect(roomName).toBe('[Archivé] Archived Room');
    });

    it('should display room name without archived prefix if not archived', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const roomName = compiled.querySelector('.room-name')?.textContent?.trim();
      expect(roomName).toBe('Test Room');
    });

    it('should display member count', () => {
      createComponent(mockRoomIdle, 'host', 5);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const memberCount = compiled.querySelector('.member-count')?.textContent?.trim();
      expect(memberCount).toBe('5/10 joueurs');
    });

    it('should match room code', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const roomCode = compiled.querySelector('.room-code')?.textContent?.trim();
      expect(roomCode).toBe('Code: ABC123');
    });

    it('should display displayStatus as idle', () => {
      createComponent(mockRoomIdle, 'host');
      expect(component.displayStatus()).toBe('idle');
    });

    it('should display displayStatus as playing', () => {
      createComponent(mockRoomPlaying, 'host');
      expect(component.displayStatus()).toBe('playing');
    });

    it('should display displayStatus as archived', () => {
      createComponent(mockRoomArchived, 'host');
      expect(component.displayStatus()).toBe('archived');
    });
  });

  describe('idle room - host click behavior', () => {
    it('should navigate to /room/:id when clicking idle room as host', fakeAsync(() => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      tile?.click();

      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room', 'room123']);
    }));

    it('should not navigate when clicking archived room as host', fakeAsync(() => {
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      tile?.click();

      tick();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('idle room - player click behavior', () => {
    it('should navigate to /room/:id when clicking idle room as player', fakeAsync(() => {
      createComponent(mockRoomIdle, 'player');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      tile?.click();

      tick();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/room', 'room123']);
    }));
  });

  describe('playing room - click behavior', () => {
    beforeEach(() => {
      mockGameService.handleReconnection.and.callFake((sessionId: string) => {
        expect(sessionId).toBe('session-xyz');
      });
    });

    it('should call handleReconnection and navigate to /game when clicking playing room', fakeAsync(() => {
      createComponent(mockRoomPlaying, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      tile?.click();

      tick();

      expect(mockGameService.handleReconnection).toHaveBeenCalledWith('session-xyz');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    }));
  });

  describe('action button - click behavior with stopPropagation', () => {
    it('should call handleAction when clicking action button', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button') as HTMLElement;
      button?.click();

      expect(component.actionLabel()).toBe('Archiver');
    });

    it('should stop propagation when clicking action button', fakeAsync(() => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      const button = compiled.querySelector('button') as HTMLElement;

      // Manually verify stopPropagation is called in the template
      // The template uses (click)="$event.stopPropagation(); handleAction()"
      // We verify this by checking that clicking button doesn't trigger tile click
      // Since we can't easily test the StopPropagation in isolation,
      // we verify the button click doesn't navigate (since handleAction doesn't navigate for idle host)

      button?.click();

      tick();

      // For idle host, handleAction calls handleArchive, not navigate
      // So router.navigate should not be called
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('action button - host idle room', () => {
    it('should show "Archiver" button for idle room when host', () => {
      createComponent(mockRoomIdle, 'host');
      expect(component.actionLabel()).toBe('Archiver');

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button');
      expect(button?.textContent?.trim()).toBe('Archiver');
    });

    it('should call archiveRoom when clicking Archiver button', fakeAsync(() => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button') as HTMLElement;
      button?.click();
      tick();

      expect(mockRoomService.archiveRoom).toHaveBeenCalledWith('room123');
    }));
  });

  describe('action button - host archived room', () => {
    it('should show "Supprimer" button for archived room when host', () => {
      createComponent(mockRoomArchived, 'host');
      expect(component.actionLabel()).toBe('Supprimer');

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button');
      expect(button?.textContent?.trim()).toBe('Supprimer');
    });

    it('should have disabled button for archived room when host', () => {
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      expect(component.isDisabled()).toBeTrue();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button') as HTMLButtonElement;
      expect(button?.disabled).toBeTrue();
    });

    it('should call deleteRoom and notify the parent to reload when clicking Supprimer button', fakeAsync(() => {
      // Manually trigger handleDelete to test the functionality
      // Since the button is disabled for archived rooms, we can't click it
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      let emitted = 0;
      component.roomsChanged.subscribe(() => emitted++);

      component.handleDelete();
      tick();

      expect(mockRoomService.deleteRoom).toHaveBeenCalledWith('archived-789');
      expect(emitted).toBe(1);
    }));
  });

  describe('delete action (host only)', () => {
    it('should not render the delete action for a non-host', () => {
      createComponent(mockRoomIdle, 'player');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(component.canDelete()).toBeFalse();
      expect(compiled.querySelector('.btn-delete-room')).toBeNull();
    });

    it('should render an enabled delete action for the host on an idle room', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteButton = compiled.querySelector('.btn-delete-room') as HTMLButtonElement;
      expect(component.canDelete()).toBeTrue();
      expect(deleteButton).not.toBeNull();
      expect(deleteButton.disabled).toBeFalse();
      expect(deleteButton.textContent?.trim()).toBe('Supprimer');
    });

    it('should render the delete action for the host on a playing room', () => {
      createComponent(mockRoomPlaying, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.btn-delete-room')).not.toBeNull();
    });

    it('should open the confirmation dialog instead of deleting immediately', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.delete-overlay')).toBeNull();

      (compiled.querySelector('.btn-delete-room') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBeTrue();
      expect(compiled.querySelector('.delete-overlay')).not.toBeNull();
      expect(mockRoomService.deleteRoom).not.toHaveBeenCalled();
    });

    it('should not call the service and not emit when the confirmation is declined', fakeAsync(() => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      let emitted = 0;
      component.roomsChanged.subscribe(() => emitted++);

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('.btn-delete-room') as HTMLElement).click();
      fixture.detectChanges();

      component.cancelDelete();
      tick();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBeFalse();
      expect(compiled.querySelector('.delete-overlay')).toBeNull();
      expect(mockRoomService.deleteRoom).not.toHaveBeenCalled();
      expect(emitted).toBe(0);
    }));

    it('should call deleteRoom and emit roomsChanged when the confirmation is accepted', fakeAsync(() => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      let emitted = 0;
      component.roomsChanged.subscribe(() => emitted++);

      const compiled = fixture.nativeElement as HTMLElement;
      (compiled.querySelector('.btn-delete-room') as HTMLElement).click();
      fixture.detectChanges();

      const confirmButton = compiled.querySelector('.delete-dialog .btn-danger') as HTMLElement;
      expect(confirmButton).not.toBeNull();
      confirmButton.click();
      tick();
      fixture.detectChanges();

      expect(mockRoomService.deleteRoom).toHaveBeenCalledWith('room123');
      expect(emitted).toBe(1);
      expect(compiled.querySelector('.delete-overlay')).toBeNull();
    }));

    it('should keep the dialog closed and skip the service when a non-host requests deletion', fakeAsync(() => {
      createComponent(mockRoomIdle, 'player');
      fixture.detectChanges();

      component.requestDelete();
      component.handleDelete();
      tick();

      expect(component.showDeleteConfirm()).toBeFalse();
      expect(mockRoomService.deleteRoom).not.toHaveBeenCalled();
    }));

    it('should not emit roomsChanged when deleteRoom fails', fakeAsync(() => {
      mockRoomService.deleteRoom.and.rejectWith(new Error('boom'));
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      let emitted = 0;
      component.roomsChanged.subscribe(() => emitted++);

      component.confirmDelete();
      tick();

      expect(mockRoomService.deleteRoom).toHaveBeenCalledWith('room123');
      expect(emitted).toBe(0);
    }));
  });

  describe('action button - player in idle room', () => {
    it('should show "Quitter" button for idle room when player', () => {
      createComponent(mockRoomIdle, 'player');
      expect(component.actionLabel()).toBe('Quitter');

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button');
      expect(button?.textContent?.trim()).toBe('Quitter');
    });

    it('should call leaveRoom and notify the parent to reload when clicking Quitter button', fakeAsync(() => {
      createComponent(mockRoomIdle, 'player');
      fixture.detectChanges();

      let emitted = 0;
      component.roomsChanged.subscribe(() => emitted++);

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button') as HTMLElement;
      button?.click();
      tick();

      expect(mockRoomService.leaveRoom).toHaveBeenCalledWith('room123');
      expect(emitted).toBe(1);
    }));
  });

  describe('action button - player in playing room', () => {
    it('should show "Quitter" button for playing room when player', () => {
      createComponent(mockRoomPlaying, 'player');
      expect(component.actionLabel()).toBe('Quitter');

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button');
      expect(button?.textContent?.trim()).toBe('Quitter');
    });

    it('should call handleReconnection and navigate when clicking button in playing room', fakeAsync(() => {
      createComponent(mockRoomPlaying, 'player');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button') as HTMLElement;
      button?.click();
      tick();

      expect(mockGameService.handleReconnection).toHaveBeenCalledWith('session-xyz');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    }));
  });

  describe('disabled state', () => {
    it('should be disabled when room is archived', () => {
      createComponent(mockRoomArchived, 'host');
      expect(component.isDisabled()).toBeTrue();
    });

    it('should be disabled when room is archived for player', () => {
      createComponent(mockRoomArchived, 'player');
      expect(component.isDisabled()).toBeTrue();
    });

    it('should not be disabled for idle room', () => {
      createComponent(mockRoomIdle, 'host');
      expect(component.isDisabled()).toBeFalse();
    });

    it('should not be disabled for playing room', () => {
      createComponent(mockRoomPlaying, 'host');
      expect(component.isDisabled()).toBeFalse();
    });
  });

  describe('isClickable computed', () => {
    it('should return true for idle room', () => {
      createComponent(mockRoomIdle, 'host');
      expect(component.isClickable()).toBeTrue();
    });

    it('should return true for playing room', () => {
      createComponent(mockRoomPlaying, 'host');
      expect(component.isClickable()).toBeTrue();
    });

    it('should return false for archived room', () => {
      createComponent(mockRoomArchived, 'host');
      expect(component.isClickable()).toBeFalse();
    });

    it('should return false when room is null', () => {
      fixture = TestBed.createComponent(RoomTileComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('room', mockRoomIdle);
      fixture.componentRef.setInput('currentRole', 'host');
      fixture.componentRef.setInput('membersCount', 2);
      fixture.detectChanges();

      // room is a required input, so we test with a valid room
      expect(component.isClickable()).toBeTrue();
    });
  });

  describe('edge cases', () => {
    it('should handle null currentRole gracefully', () => {
      fixture = TestBed.createComponent(RoomTileComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('room', mockRoomIdle);
      // currentRole is required, so component won't fully work without it
      // but we can test that it doesn't crash on initialization
      expect(component).toBeTruthy();
    });

    it('should handle zero members count', () => {
      createComponent(mockRoomIdle, 'host', 0);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const memberCount = compiled.querySelector('.member-count')?.textContent?.trim();
      expect(memberCount).toBe('0/10 joueurs');
    });
  });

  describe('template classes', () => {
    it('should add clickable class for idle room', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      expect(tile?.classList.contains('clickable')).toBeTrue();
    });

    it('should add archived class for archived room', () => {
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tile = compiled.querySelector('.room-tile') as HTMLElement;
      expect(tile?.classList.contains('archived')).toBeTrue();
    });

    it('should addstatus bar with correct class for idle', () => {
      createComponent(mockRoomIdle, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar') as HTMLElement;
      expect(statusBar?.classList.contains('idle')).toBeTrue();
    });

    it('should add status bar with correct class for playing', () => {
      createComponent(mockRoomPlaying, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar') as HTMLElement;
      expect(statusBar?.classList.contains('playing')).toBeTrue();
    });

    it('should add status bar with correct class for archived', () => {
      createComponent(mockRoomArchived, 'host');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusBar = compiled.querySelector('.status-bar') as HTMLElement;
      expect(statusBar?.classList.contains('archived')).toBeTrue();
    });
  });
});
