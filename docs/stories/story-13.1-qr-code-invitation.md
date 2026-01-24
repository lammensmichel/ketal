# Story 13.1: Add QR Code for Room Invitation

**Status**: Ready
**Epic**: Epic 13: Room UX Improvements
**Priority**: Medium
**Depends On**: None

---

## Story

**As a** host creating a room
**I want** a QR code displayed with the room invitation
**So that** other players can easily scan and join without typing the code manually

---

## Context

Actuellement, pour rejoindre une room, les joueurs doivent:
1. Recevoir le code (ex: AFVFJ4) ou le lien
2. Taper manuellement le code ou cliquer sur le lien

Un QR code permettrait de scanner directement avec le téléphone pour rejoindre la room, améliorant significativement l'UX en situation de jeu (soirée, bar, etc.).

---

## Acceptance Criteria

1. **AC1**: Un QR code est affiché sur la page de création de room (après création)
2. **AC2**: Un QR code est affiché dans le lobby de la room
3. **AC3**: Le QR code encode l'URL d'invitation complète (ex: `http://localhost:4200/room/join/AFVFJ4`)
4. **AC4**: Le QR code est suffisamment grand pour être scanné facilement (min 150x150px)
5. **AC5**: Le QR code peut être téléchargé ou partagé (optionnel)

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 2, 3, 4): Intégrer une librairie QR code
  - [ ] Installer `qrcode` ou `angularx-qrcode`
  - [ ] Créer un composant `QrCodeComponent` réutilisable
  - [ ] Le composant prend une URL en input et génère le QR

- [ ] **T2** (AC: 1): Ajouter le QR code à la page create-room
  - [ ] Afficher le QR code après création de la room
  - [ ] Positionner à côté du code textuel

- [ ] **T3** (AC: 2): Ajouter le QR code au lobby
  - [ ] Afficher le QR code dans la section d'invitation
  - [ ] Permettre de masquer/afficher le QR code

- [ ] **T4** (AC: 5): Fonctionnalité de partage (optionnel)
  - [ ] Bouton pour télécharger le QR code en image
  - [ ] Intégration Web Share API si disponible

---

## Dev Notes

### Librairies recommandées

**Option 1: angularx-qrcode** (recommandée)
```bash
npm install angularx-qrcode
```

```typescript
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  imports: [QRCodeModule],
  template: `<qrcode [qrdata]="inviteUrl" [width]="200"></qrcode>`
})
```

**Option 2: qrcode (vanilla)**
```bash
npm install qrcode
npm install @types/qrcode --save-dev
```

### URL d'invitation

```typescript
const inviteUrl = `${window.location.origin}/room/join/${room.code}`;
```

### Fichiers Concernés

- `src/app/_shared/_components/qr-code/qr-code.component.ts` (nouveau)
- `src/app/_components/room/create-room/create-room.component.ts`
- `src/app/_components/room/create-room/create-room.component.html`
- `src/app/_components/room/lobby/lobby.component.ts`
- `src/app/_components/room/lobby/lobby.component.html`

---

## UI Mockup

```
┌─────────────────────────────────────┐
│           TestRoom                   │
│         Code: AFVFJ4                 │
│                                      │
│     ┌──────────────────┐            │
│     │   ██████████████ │            │
│     │   ██          ██ │            │
│     │   ██  QR CODE  ██ │  ← Scan   │
│     │   ██          ██ │    pour    │
│     │   ██████████████ │    rejoindre│
│     └──────────────────┘            │
│                                      │
│  [Copier le lien] [Télécharger QR]  │
└─────────────────────────────────────┘
```

---

## Testing

### Unit Tests
- [ ] Test: QrCodeComponent génère un QR code valide
- [ ] Test: URL d'invitation correctement encodée
- [ ] Test: QR code affiché après création de room

### Manual Tests
- [ ] Scanner le QR code avec un téléphone redirige vers la bonne URL
- [ ] Le QR code est lisible sur différentes tailles d'écran

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | Claude |
