import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { FriendsComponent } from './friends.component';
import { AuthService } from '../../services/auth/auth.service';
import { FriendService } from '../../services/friend/friend.service';

/**
 * onQrScanned est appele hors zone Angular depuis le test : fixture.whenStable()
 * ne verrait donc pas ses promesses. Un setTimeout(0) vide la file de microtaches.
 */
function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('FriendsComponent', () => {
  let component: FriendsComponent;
  let fixture: ComponentFixture<FriendsComponent>;
  let mockFriendService: {
    friends: ReturnType<typeof signal>;
    friendProfiles: ReturnType<typeof signal>;
    pendingRequests: ReturnType<typeof signal>;
    getFriends: jasmine.Spy;
    getPendingRequests: jasmine.Spy;
    acceptFriendRequest: jasmine.Spy;
    declineFriendRequest: jasmine.Spy;
    addFriendByQr: jasmine.Spy;
    addFriendByNickname: jasmine.Spy;
    removeFriend: jasmine.Spy;
    searchUsersByNickname: jasmine.Spy;
  };
  let modalRef: { close: jasmine.Spy; dismiss: jasmine.Spy };

  beforeEach(async () => {
    modalRef = { close: jasmine.createSpy('close'), dismiss: jasmine.createSpy('dismiss') };

    mockFriendService = {
      friends: signal([]),
      friendProfiles: signal([]),
      pendingRequests: signal([]),
      getFriends: jasmine.createSpy('getFriends').and.resolveTo([]),
      getPendingRequests: jasmine.createSpy('getPendingRequests').and.resolveTo([]),
      acceptFriendRequest: jasmine.createSpy('acceptFriendRequest').and.resolveTo({}),
      declineFriendRequest: jasmine.createSpy('declineFriendRequest').and.resolveTo(undefined),
      addFriendByQr: jasmine.createSpy('addFriendByQr').and.resolveTo({ $id: 'friendship-1' }),
      addFriendByNickname: jasmine.createSpy('addFriendByNickname').and.resolveTo({}),
      removeFriend: jasmine.createSpy('removeFriend').and.resolveTo(undefined),
      searchUsersByNickname: jasmine.createSpy('searchUsersByNickname').and.resolveTo([]),
    };

    await TestBed.configureTestingModule({
      imports: [FriendsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: FriendService, useValue: mockFriendService },
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ $id: 'me' }),
            isLoggedIn: signal(true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate').and.resolveTo(true), events: new Subject() },
        },
      ],
    })
      // NgbModalModule declare `providers: [NgbModal]` : le service est donc
      // resolu dans l'injecteur d'environnement du composant standalone, qui
      // masque un provider pose au niveau du TestBed. Il faut le remplacer sur le
      // composant lui-meme.
      .overrideComponent(FriendsComponent, {
        add: { providers: [{ provide: NgbModal, useValue: { open: () => modalRef } }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FriendsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se cree', () => {
    expect(component).toBeTruthy();
  });

  it('ajoute l_ami avec l_identifiant extrait du QR scanne', async () => {
    component.openAddModal();

    component.onQrScanned('user-42');
    await flushPromises();

    expect(mockFriendService.addFriendByQr).toHaveBeenCalledWith('user-42');
    expect(component.inviteFeedback()).toBe('friends.requestSent');
    expect(modalRef.close).toHaveBeenCalled();
    expect(component.qrAddError()).toBeNull();
  });

  it('affiche une erreur traduite quand l_ajout par QR echoue', async () => {
    mockFriendService.addFriendByQr.and.rejectWith(new Error('Network unreachable'));

    component.openAddModal();
    component.onQrScanned('user-42');
    await flushPromises();

    expect(component.qrAddError()).toBe('friends.inviteFailed');
    // La modale reste ouverte pour que l'utilisateur voie le message.
    expect(modalRef.close).not.toHaveBeenCalled();
  });

  it('ferme la modale a la destruction pour couper la camera', () => {
    component.openAddModal();

    fixture.destroy();

    expect(modalRef.dismiss).toHaveBeenCalled();
  });
  it('remonte la cle metier d_un doublon, plutot qu_un echec generique', async () => {
    mockFriendService.addFriendByQr.and.rejectWith(new Error('friends.errorRequestIncoming'));

    component.openAddModal();
    component.onQrScanned('user-42');
    await flushPromises();

    // Renvoyer l'utilisateur vers ses demandes recues vaut mieux que « echec ».
    expect(component.qrAddError()).toBe('friends.errorRequestIncoming');
  });

  it('charge les demandes recues a l_initialisation', () => {
    expect(mockFriendService.getPendingRequests).toHaveBeenCalled();
  });

  it('accepte une demande recue', async () => {
    component.acceptRequest({
      friendshipId: 'f-1',
      requesterUserId: 'user-1',
      requesterName: 'Demandeur',
      createdAt: '2024-01-01T00:00:00Z',
    });
    await flushPromises();

    expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('f-1');
    expect(component.actionError()).toBeNull();
  });

  it('demande confirmation AVANT de refuser, sans confirm() natif', () => {
    component.askDeclineRequest('f-1');
    expect(component.pendingDeclineId()).toBe('f-1');
    expect(mockFriendService.declineFriendRequest).not.toHaveBeenCalled();

    component.declineRequest('f-1');

    expect(mockFriendService.declineFriendRequest).toHaveBeenCalledWith('f-1');
    expect(component.pendingDeclineId()).toBeNull();
  });

  it('abandonne le refus quand la confirmation est annulee', () => {
    component.askDeclineRequest('f-1');
    component.cancelDeclineRequest();

    expect(component.pendingDeclineId()).toBeNull();
    expect(mockFriendService.declineFriendRequest).not.toHaveBeenCalled();
  });

  it('affiche une erreur de page quand l_acceptation echoue', async () => {
    mockFriendService.acceptFriendRequest.and.rejectWith(new Error('boom'));

    component.acceptRequest({
      friendshipId: 'f-1',
      requesterUserId: 'user-1',
      requesterName: 'Demandeur',
      createdAt: '2024-01-01T00:00:00Z',
    });
    await flushPromises();

    expect(component.actionError()).toBe('friends.acceptFailed');
  });
});
