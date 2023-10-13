import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
  joueurs: { name: string }[] = [{ name: 'Joueur 1' }, { name: 'Joueur 2' }];
  joueurForm: FormGroup; // Créez un formulaire réactif

  constructor(private fb: FormBuilder) {
    this.joueurForm = this.fb.group({
      nouveauJoueur: ['', Validators.required], // Créez un champ "nouveauJoueur" avec validation requise
    });
  }

  ajouterJoueur() {
    if (this.joueurForm.valid) {
      this.joueurs.push({ name: this.joueurForm.value.nouveauJoueur });
      this.joueurForm.reset(); // Réinitialisez le formulaire après l'ajout
    }
  }
}
