import { TestBed } from '@angular/core/testing';
import { DisplayModeService } from './display-mode.service';
import { GameService } from '../game/game.service';
import { GameMember, MemberService } from '../member/member.service';
import { PlayerModel } from '../../_shared/_models/player.model';
import { createMockGameService, createMockMemberService } from '../../testing/test-helpers';

const DISPLAY_MODE_KEY = 'ketal_display_mode';

function createMember(overrides: Partial<GameMember> = {}): GameMember {
  return {
    $id: 'member-me',
    roomId: 'room-1',
    userId: 'user-1',
    deviceId: null,
    displayName: 'Moi',
    role: 'player',
    isOnline: true,
    totalSipsGiven: 0,
    totalSipsTaken: 0,
    totalGamesPlayed: 0,
    gameStats: {},
    ...overrides,
  };
}

function createPlayer(id: string): PlayerModel {
  const player = new PlayerModel();
  player.id = id;
  player.name = id;
  return player;
}

describe('DisplayModeService', () => {
  let service: DisplayModeService;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockMemberService: ReturnType<typeof createMockMemberService>;

  function configure(): void {
    mockGameService = createMockGameService();
    mockMemberService = createMockMemberService();

    TestBed.configureTestingModule({
      providers: [
        DisplayModeService,
        { provide: GameService, useValue: mockGameService },
        { provide: MemberService, useValue: mockMemberService },
      ],
    });

    service = TestBed.inject(DisplayModeService);
  }

  beforeEach(() => {
    localStorage.removeItem(DISPLAY_MODE_KEY);
    configure();
  });

  afterEach(() => {
    localStorage.removeItem(DISPLAY_MODE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('default mode', () => {
    it('should default to table when nothing is stored', () => {
      mockGameService.isRoomMode.set(true);
      expect(service.preferredMode()).toBe('table');
      expect(service.mode()).toBe('table');
    });

    it('should fall back to table when the stored value is garbage', () => {
      localStorage.setItem(DISPLAY_MODE_KEY, 'not-a-mode');
      TestBed.resetTestingModule();
      configure();

      expect(service.preferredMode()).toBe('table');
    });
  });

  describe('localStorage persistence (preference locale a l appareil)', () => {
    it('should write the chosen mode to localStorage', () => {
      service.setMode('personnel');
      TestBed.flushEffects();

      expect(localStorage.getItem(DISPLAY_MODE_KEY)).toBe('personnel');
    });

    it('should restore the stored mode on a new instance', () => {
      localStorage.setItem(DISPLAY_MODE_KEY, 'viewer');
      TestBed.resetTestingModule();
      configure();
      mockGameService.isRoomMode.set(true);

      expect(service.preferredMode()).toBe('viewer');
      expect(service.mode()).toBe('viewer');
    });
  });

  describe('local mode forces table', () => {
    it('should not offer the mode selector outside room mode', () => {
      mockGameService.isRoomMode.set(false);
      expect(service.isModeSelectable()).toBeFalse();
    });

    it('should force table even when personnel is the stored preference', () => {
      service.setMode('personnel');
      mockGameService.isRoomMode.set(false);

      expect(service.mode()).toBe('table');
      // La preference reste memorisee : de retour en room, elle s'applique.
      expect(service.preferredMode()).toBe('personnel');
      mockGameService.isRoomMode.set(true);
      expect(service.mode()).toBe('personnel');
    });

    it('should keep everything actionable in local mode', () => {
      service.setMode('viewer');
      mockGameService.isRoomMode.set(false);

      expect(service.canControlPlayer('anybody')).toBeTrue();
      expect(service.canDrawSharedCard()).toBeTrue();
      expect(service.canRunTableAction()).toBeTrue();
    });
  });

  describe('table mode (non-regression)', () => {
    beforeEach(() => {
      mockGameService.isRoomMode.set(true);
      mockMemberService.currentMember.set(createMember());
    });

    it('should let any player be controlled, including fictional ones', () => {
      mockMemberService.members.set([
        createMember(),
        createMember({ $id: 'member-other', displayName: 'Autre' }),
        createMember({ $id: 'member-fake', userId: null, deviceId: null, isFictional: true }),
      ]);

      expect(service.mode()).toBe('table');
      expect(service.canControlPlayer('member-me')).toBeTrue();
      expect(service.canControlPlayer('member-other')).toBeTrue();
      expect(service.canControlPlayer('member-fake')).toBeTrue();
    });

    it('should let anyone act whatever the active player is', () => {
      mockGameService.activePlayer.set(createPlayer('member-other'));
      expect(service.canControlActivePlayer()).toBeTrue();
    });

    it('should never flag a card as mine in table mode', () => {
      expect(service.isMyPlayer('member-me')).toBeFalse();
      expect(service.isPersonalView()).toBeFalse();
    });

    it('should keep shared actions available', () => {
      expect(service.canDrawSharedCard()).toBeTrue();
      expect(service.canRunTableAction()).toBeTrue();
    });
  });

  describe('personnel mode', () => {
    beforeEach(() => {
      mockGameService.isRoomMode.set(true);
      mockMemberService.currentMember.set(createMember());
      mockMemberService.members.set([
        createMember(),
        createMember({ $id: 'member-other', displayName: 'Autre' }),
        createMember({ $id: 'member-fake', userId: null, deviceId: null, isFictional: true }),
      ]);
      service.setMode('personnel');
    });

    it('should only control my own player', () => {
      expect(service.canControlPlayer('member-me')).toBeTrue();
      expect(service.canControlPlayer('member-other')).toBeFalse();
    });

    it('should flag my card as mine', () => {
      expect(service.isMyPlayer('member-me')).toBeTrue();
      expect(service.isMyPlayer('member-other')).toBeFalse();
    });

    it('should be actionable when it is my turn', () => {
      mockGameService.activePlayer.set(createPlayer('member-me'));
      expect(service.canControlActivePlayer()).toBeTrue();
    });

    it('should be read only when it is someone else turn', () => {
      mockGameService.activePlayer.set(createPlayer('member-other'));
      expect(service.canControlActivePlayer()).toBeFalse();
    });

    it('should NOT control fictional players when I am a simple player', () => {
      expect(service.canControlPlayer('member-fake')).toBeFalse();
    });

    it('should control fictional players when I am the host', () => {
      mockMemberService.currentMember.set(createMember({ role: 'host' }));

      expect(service.isHost()).toBeTrue();
      expect(service.canControlPlayer('member-fake')).toBeTrue();
      // ...mais toujours pas les joueurs reels des autres appareils.
      expect(service.canControlPlayer('member-other')).toBeFalse();
    });

    it('should let the host play a fictional player turn', () => {
      mockMemberService.currentMember.set(createMember({ role: 'host' }));
      mockGameService.activePlayer.set(createPlayer('member-fake'));

      expect(service.canControlActivePlayer()).toBeTrue();
    });

    it('should keep the shared phase 2 draw pile actionable', () => {
      // Il n'y a plus de joueur actif en phase 2 : verrouiller la pioche
      // bloquerait la partie pour tout le monde.
      mockGameService.activePlayer.set(undefined);
      expect(service.canDrawSharedCard()).toBeTrue();
      expect(service.canRunTableAction()).toBeTrue();
    });
  });

  describe('viewer mode', () => {
    beforeEach(() => {
      mockGameService.isRoomMode.set(true);
      mockMemberService.currentMember.set(createMember({ role: 'host' }));
      mockMemberService.members.set([
        createMember({ role: 'host' }),
        createMember({ $id: 'member-fake', userId: null, deviceId: null, isFictional: true }),
      ]);
      service.setMode('viewer');
    });

    it('should make nothing actionable', () => {
      mockGameService.activePlayer.set(createPlayer('member-me'));

      expect(service.canControlPlayer('member-me')).toBeFalse();
      expect(service.canControlPlayer('member-fake')).toBeFalse();
      expect(service.canControlActivePlayer()).toBeFalse();
      expect(service.canDrawSharedCard()).toBeFalse();
      expect(service.canRunTableAction()).toBeFalse();
    });

    it('should not highlight any card as mine (viewer sees the whole table)', () => {
      expect(service.isPersonalView()).toBeFalse();
      expect(service.isMyPlayer('member-me')).toBeFalse();
    });
  });

  describe('spectator role independence', () => {
    it('should not couple the spectator role with the viewer display mode', () => {
      mockGameService.isRoomMode.set(true);
      mockMemberService.currentMember.set(createMember({ role: 'spectator' }));

      // Un spectateur garde la vue table par defaut...
      expect(service.mode()).toBe('table');

      // ...et un joueur peut choisir la vue TV sans devenir spectateur.
      mockMemberService.currentMember.set(createMember({ role: 'player' }));
      service.setMode('viewer');
      expect(service.mode()).toBe('viewer');
      expect(mockMemberService.currentMember()?.role).toBe('player');
    });
  });
});
