import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./_components/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./_components/auth/register/register.component').then((m) => m.RegisterComponent),
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
  { path: '', redirectTo: 'players', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
