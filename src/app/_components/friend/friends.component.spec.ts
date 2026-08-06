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
    getFriends: jasmine.Spy;
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
      getFriends: jasmine.createSpy('getFriends').and.resolveTo([]),
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
    expect(component.inviteFeedback()).toBe('friends.inviteAdded');
    expect(modalRef.close).toHaveBeenCalled();
    expect(mockFriendService.getFriends).toHaveBeenCalled();
    expect(component.qrAddError()).toBeNull();
  });

  it('affiche une erreur traduite quand l_ajout par QR echoue', async () => {
    mockFriendService.addFriendByQr.and.rejectWith(new Error('Already friends with this user'));

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
});
