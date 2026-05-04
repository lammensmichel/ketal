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
    path: 'room/create',
    redirectTo: 'home',
    pathMatch: 'full',
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
