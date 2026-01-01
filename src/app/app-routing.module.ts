import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
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
