/**
 * Un transfert de gorgees d'un joueur vers un autre, tel que decide dans la
 * modale de distribution.
 *
 * C'est la seule source de l'information « qui a donne combien a qui ». Rien
 * dans le modele ne la portait : `player.sips` ne connait que les totaux `drunk`
 * et `given`, ce qui rend le total RECU par joueur non calculable. Cote backend,
 * la collection `ketal_sip_events` (migration 047) la persiste pour alimenter
 * plus tard des stats de room filtrables par date.
 */
export interface SipExchange {
  /** Joueur qui donne (PlayerModel.id) */
  fromPlayerId: string;
  /** Joueur qui recoit (PlayerModel.id) */
  toPlayerId: string;
  /** Nombre de gorgees transferees, toujours strictement positif */
  sips: number;
  /**
   * Horodatage ISO 8601 du transfert.
   *
   * Renseigne par le client et non deduit du `$createdAt` d'Appwrite : les
   * attributs systeme ne sont pas librement indexables, or l'index composite
   * `roomId + createdAt` de `ketal_sip_events` en depend.
   */
  at: string;
}
