import { inject, Injectable } from '@angular/core';
import { Models, Permission, Role } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { isAppwriteException, getAppwriteErrorCode } from '../../_shared/helpers/appwrite-exception.helper';

/** Collection des profils publics, distincte des comptes Auth Appwrite. */
const COLLECTION_USERS = 'users';

/**
 * UserProfileService — cree et maintient le document de profil d'un compte.
 *
 * Un compte Appwrite Auth et un profil sont deux choses distinctes :
 * `account.create()` ne cree qu'un compte Auth, invisible depuis la collection
 * `users`. Or la recherche d'amis par pseudo interroge cette collection. Sans
 * profil, aucun utilisateur n'est trouvable — c'etait le cas de tous les
 * comptes existants.
 *
 * Le document porte volontairement l'`$id` du compte comme identifiant : cela
 * rend l'operation naturellement idempotente et permet a FriendService de
 * resoudre un profil directement par userId.
 *
 * L'utilisateur est passe en parametre plutot qu'obtenu via AuthService, pour
 * eviter une dependance circulaire (AuthService appelle ce service).
 */
@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly appwrite = inject(AppwriteService);

  /**
   * Garantit l'existence du profil du compte donne. Idempotent.
   *
   * Les sessions anonymes sont ignorees : un invite n'a ni email ni pseudo, et
   * n'a pas a etre trouvable dans la recherche d'amis.
   *
   * Ne leve jamais : l'absence de profil ne doit pas empecher de se connecter
   * ni de jouer. L'echec est trace en console et retourne false.
   *
   * @returns true si le profil existe a l'issue de l'appel
   */
  async ensureProfile(user: Models.User<Models.Preferences> | null): Promise<boolean> {
    // email vide = session anonyme (meme critere que AuthService.isAnonymous)
    if (!user?.$id || !user.email) {
      return false;
    }

    try {
      await this.appwrite.databases.getDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_USERS,
        documentId: user.$id,
      });
      return true;
    } catch (error: unknown) {
      const code = isAppwriteException(error) ? getAppwriteErrorCode(error) : null;
      if (code !== 404) {
        // 401 signifie typiquement que les permissions de la collection n'ont
        // pas ete ouvertes aux comptes authentifies (cf. migration 044).
        console.error('[UserProfileService] Lecture du profil impossible:', error);
        return false;
      }
    }

    return this.createProfile(user);
  }

  /** Cree le document de profil. Suppose son absence deja verifiee. */
  private async createProfile(user: Models.User<Models.Preferences>): Promise<boolean> {
    const now = new Date().toISOString();

    try {
      await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_USERS,
        documentId: user.$id,
        data: {
          userId: user.$id,
          name: user.name || this.defaultNickname(user),
          email: user.email,
          nickname: this.defaultNickname(user),
          createdAt: now,
          updatedAt: now,
        },
        // La collection n'accorde que read + create a Role.users(). Les droits
        // de modification sont portes par le document lui-meme, sinon
        // n'importe qui pourrait editer le profil de n'importe qui.
        permissions: [
          Permission.read(Role.users()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
      return true;
    } catch (error: unknown) {
      // 409 : cree entre-temps par un autre onglet ou une autre requete.
      if (isAppwriteException(error) && getAppwriteErrorCode(error) === 409) {
        return true;
      }
      console.error('[UserProfileService] Creation du profil impossible:', error);
      return false;
    }
  }

  /**
   * Met a jour le pseudo. C'est lui qu'interroge la recherche d'amis, via un
   * index fulltext (migration 043).
   */
  async updateNickname(userId: string, nickname: string): Promise<void> {
    const trimmed = nickname.trim();
    if (!trimmed) {
      throw new Error('Le pseudo ne peut pas etre vide');
    }

    await this.appwrite.databases.updateDocument({
      databaseId: this.appwrite.databaseId,
      collectionId: COLLECTION_USERS,
      documentId: userId,
      data: {
        nickname: trimmed,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /** Lit le profil d'un compte, null s'il n'existe pas. */
  async getProfile(userId: string): Promise<Models.Document | null> {
    try {
      return await this.appwrite.databases.getDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_USERS,
        documentId: userId,
      });
    } catch (error: unknown) {
      if (isAppwriteException(error) && getAppwriteErrorCode(error) === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Pseudo par defaut : le nom du compte s'il existe, sinon la partie locale de
   * l'email. Sans valeur, le compte resterait introuvable dans la recherche.
   */
  private defaultNickname(user: Models.User<Models.Preferences>): string {
    const fromName = user.name?.trim();
    if (fromName) {
      return fromName.slice(0, 50);
    }
    return user.email.split('@')[0].slice(0, 50);
  }
}
