# Story 16.1: Legal Disclaimer and Terms of Use

**Status**: Done
**Epic**: Epic 16: Legal & Compliance
**Priority**: High

---

## Story

**As a** new user creating an account
**I want** to see a legal disclaimer and terms of use
**So that** the app is legally compliant and doesn't encourage irresponsible drinking

---

## Context

Ketal is a drinking card game. French law requires disclaimers about alcohol consumption. The app must:
- Not encourage excessive alcohol consumption
- Mention that the game can be played with non-alcoholic drinks
- Include age verification (18+)
- Show terms of use on registration

### Legal requirements (France)
- **Loi Évin**: Advertising of alcoholic beverages is regulated. Apps promoting drinking games must include health warnings.
- **Required disclaimer**: "L'abus d'alcool est dangereux pour la santé. À consommer avec modération."
- **Age gate**: Must verify user is 18+ (at minimum a checkbox/declaration)
- **Alternative mention**: Should mention non-alcoholic alternatives

---

## Acceptance Criteria

1. **AC1**: Registration page shows a checkbox "J'ai 18 ans ou plus et j'accepte les conditions d'utilisation"
2. **AC2**: Cannot create account without checking the box
3. **AC3**: Link to full terms of use page
4. **AC4**: Terms page includes:
   - Disclaimer: game can be played with non-alcoholic drinks
   - Health warning: "L'abus d'alcool est dangereux pour la santé"
   - Age requirement: 18+
   - Responsibility clause: app does not encourage alcohol consumption
5. **AC5**: Footer or splash screen shows brief disclaimer
6. **AC6**: All text translated (fr, en, nl, de)

---

## Dev Notes

### Disclaimer text (French)
```
Ketal est un jeu de société qui peut se jouer avec des boissons alcoolisées OU non-alcoolisées.
L'abus d'alcool est dangereux pour la santé. À consommer avec modération.
Vous devez avoir 18 ans ou plus pour utiliser cette application.
Ketal n'encourage en aucun cas la consommation excessive d'alcool.
```

### Files to create/modify
- New: `src/app/_components/legal/terms/terms.component.ts` - Terms page
- Modify: `src/app/_components/auth/register/register.component.html` - Add checkbox + link
- Modify: `src/app/_shared/_components/footer/footer.component.html` - Brief disclaimer
- Add route: `/terms`
- i18n: Add legal.* keys in all language files

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Requested by user for legal compliance | PM |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
