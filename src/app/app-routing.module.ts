import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./_components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./_components/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./_components/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    // NE PAS re-rediriger vers 'home'. Cette route avait ete neutralisee quand
    // CreateRoomComponent n'etait plus reference par personne : elle menait a un
    // ecran juge mort. C'etait l'inverse — c'est la redirection qui le rendait
    // inatteignable, et avec lui le SEUL moyen de creer une partie multijoueur
    // et d'y asseoir des amis (createRoom() + selecteur d'amis). L'accueil y
    // envoie desormais explicitement via « Jouer entre amis ».
    path: 'room/create',
    loadComponent: () =>
      import('./_components/room/create-room/create-room.component').then((m) => m.CreateRoomComponent),
  },
  {
    path: 'room/join',
    loadComponent: () => import('./_components/room/join-room/join-room.component').then((m) => m.JoinRoomComponent),
  },
  {
    path: 'room/join/:code',
    loadComponent: () => import('./_components/room/join-room/join-room.component').then((m) => m.JoinRoomComponent),
  },
  {
    path: 'room/:id',
    loadComponent: () => import('./_components/room/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'room/:id/stats',
    loadComponent: () => import('./_components/room/room-stats/room-stats.component').then((m) => m.RoomStatsComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./_components/players/players-list/players-list.component').then((m) => m.PlayersListComponent),
  },
  {
    path: 'game',
    loadComponent: () => import('./_components/game/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'rooms',
    loadComponent: () => import('./_components/room/rooms-list/rooms-list.component').then((m) => m.RoomsListComponent),
  },
  {
    path: 'friends',
    loadComponent: () => import('./_components/friend/friends.component').then((m) => m.FriendsComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./_components/legal/terms/terms.component').then((m) => m.TermsComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
