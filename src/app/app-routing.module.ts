import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Autres routes existantes, le cas échéant
  {
    path: 'players',
    loadChildren: () =>
      import('../players/players.module').then((m) => m.PlayersModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
