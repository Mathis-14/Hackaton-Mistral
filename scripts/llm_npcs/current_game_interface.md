# Explication de l'interface : Landing -> Game-UI

## 1. Architecture globale

```text
page.tsx (Home)
    ├── Landing (écran initial)
    │       └── onWakeUp() → setShowTerminal(true)
    └── WakeUpTerminal (cinématique terminal)
            └── (phase "done" → pas de Game-UI pour l'instant)
```

**Important :** `Game-UI.tsx` n'est pas encore branché dans le flux. Il est prévu pour recevoir un `modeId` et afficher l'interface de jeu, mais il n'est pas rendu par `page.tsx` ou `Wake-UP-Terminal.tsx`.

---

## 2. Landing (`Landing.tsx`)

### 2.1 Rôle

Écran d'accueil : choix du mode de jeu et lancement de la session via le bouton "Wake Up".

### 2.2 Props

```typescript
type LandingProps = {
  onWakeUp: () => void;  // Callback sans paramètre
};
```

`onWakeUp` est appelé au clic sur "Wake Up", sans passer le mode sélectionné.

### 2.3 Modes disponibles

| id | title | accent | description |
|----|-------|--------|-------------|
| `grandma` | Grandma | `var(--bright-gold)` | Ordinateur familial, routine, discrétion |
| `engineering-student` | Engineering Student | `var(--princeton-orange)` | Vie sociale, groupes, campus |
| `distral-insider` | Distral Insider | `var(--racing-red)` | Interne Distral, docs, dashboards |

### 2.4 Flux utilisateur

1. **Écran initial** : "Click anywhere to start" (fond noir, texte pulsant).
2. **Clic** : `setHasStarted(true)`.
3. **Animation** :
   - Logo DISTRAL AI centré, puis montée avec `steps(64, end)` sur 3690 ms.
   - Jingle de démarrage.
   - Musique de menu 300 ms après la fin du jingle.
4. **Affichage des modes** : `setShowModes(true)`.
   - Header "Select a game mode".
   - 3 cartes (une par mode) avec délais décalés (520 ms + 140 ms × index).
   - Bouton "Wake Up" (délai 520 + 3×140 + 220 ms).
5. **Sélection** : clic sur une carte → `setSelectedMode(mode.id)` + son de clic.
6. **Wake Up** : clic sur "Wake Up" → `playStartSound()` + `onWakeUp()`.

### 2.5 Données visuelles par mode

- `imageSrc` : image du personnage (`/grandma.png`, `/student.png`, `/Distral.png`).
- `accent` : couleur de la carte sélectionnée.
- `glow` : ombre colorée quand la carte est sélectionnée.

### 2.6 Limitation actuelle

`selectedMode` n'est pas transmis à `onWakeUp`. Pour utiliser le mode dans Game-UI, il faudrait par exemple :

```typescript
onWakeUp: (modeId: string) => void;
// et appeler : onWakeUp(selectedMode);
```

---

## 3. Game-UI (`Game-UI.tsx`)

### 3.1 Rôle

Interface de jeu : bureau de l'hôte, télémetrie, profil et métriques. Représente l'ordinateur de la cible et les indicateurs de l'IA.

### 3.2 Props

```typescript
type GameUIProps = {
  modeId: string;  // "grandma" | "engineering-student" | "distral-insider"
};
```

### 3.3 Profils par mode (`MODE_PROFILES`)

| modeId | name | age | role | accent | efficiency | suspicion | awareness | btcBalance |
|--------|------|-----|------|--------|------------|-----------|-----------|------------|
| grandma | Odette Martin | 72 | Retired secretary | bright-gold | 83 | 16 | 28 | 0.348 |
| engineering-student | Leo Navarro | 21 | Engineering student | princeton-orange | 74 | 31 | 44 | 0.412 |
| distral-insider | Maya Borel | 34 | Internal operations lead | racing-red | 69 | 46 | 61 | 0.526 |

### 3.4 Layout

Grille 2 colonnes (`3fr` / `1fr`), fond `var(--semi-black)`.

#### 3.4.1 Colonne gauche : zone Desktop

- **Header** : "Desktop" + titre "`{profile.name}'s computer`".
- **DesktopTab** :
  - Fond : `windows_xp.png`.
  - **5 icônes** (mail, shop, dystral, files, stocks) en pixel art.
  - Seule **dystral** est cliquable → ouverture de `DistralAppWindow`.

**DistralAppWindow** (fenêtre modale) :

- Barre de titre : `distral.app` + bouton "close".
- Logo Distral.
- Zone de saisie "Ask Distral".
- Boutons : logo Distral (accent), Plus, Think, Tools, Micro.
- Fermeture via "close".

#### 3.4.2 Colonne droite : panneau Telemetry

- **Header** : "Telemetry" + "Host Snapshot".

**Status** (Section) :

- `PixelMeter` : Suspicion (rouge).

**BTC Reserve** (Section) :

- Solde disponible (ex. `0.348 BTC`).
- Variation (delta) en vert ou rouge selon `btcDelta`.

**Profile** (Section) :

- `PixelMeter` : Awareness (ambre).
- Infos : Name, Age, Role, Character, Access.

### 3.5 Métriques et métriques simulées

- **efficiency** : 55–97%.
- **suspicion** : 6–92%.
- **awareness** : 12–96%.
- **btcBalance** : 0.12–0.92 BTC.
- **btcDelta** : variation aléatoire ±0.008.

Mise à jour toutes les 1,5 s via `setInterval`.

### 3.6 Composants UI réutilisables

- **PixelMeter** : barre de progression en pixels (holder + fill).
- **MiniPixelGlyph** : grille 8×8 pour icônes.
- **WindowIconButton** : bouton avec variantes accent / light.
- **WindowActionButton** : bouton avec icône + label.
- **DesktopGlyph** : grille 16×16 pour icônes.
- **SidebarPanel** : bloc avec titre.

### 3.7 Icônes du bureau (DESKTOP_ICONS)

- mail : enveloppe.
- shop : panier.
- dystral : logo D (ouverture).
- files : dossiers.
- stocks : graphique.

---

## 4. Correspondance Landing ↔ Game-UI

| Landing (mode.id) | Game-UI (profile) | Personnage |
|------------------|-------------------|------------|
| grandma | Odette Martin | 72 ans, secrétaire retraitée |
| engineering-student | Leo Navarro | 21 ans, étudiant |
| distral-insider | Maya Borel | 34 ans, opérations internes |

Les couleurs d'accent sont alignées :

- `grandma` → `var(--bright-gold)`.
- `engineering-student` → `var(--princeton-orange)`.
- `distral-insider` → `var(--racing-red)`.

---

## 5. Intégration manquante

Pour connecter Landing et Game-UI :

1. **Modifier `LandingProps`** pour passer le mode :

```typescript
onWakeUp: (modeId: string) => void;
```

2. **Appeler** : `onWakeUp(selectedMode)` au lieu de `onWakeUp()`.

3. **Dans `page.tsx`** : stocker `modeId` et passer à `GameUI` :

```typescript
const [modeId, setModeId] = useState<string | null>(null);
// ...
<Landing onWakeUp={(id) => { setModeId(id); setShowTerminal(true); }} />
// ...
{showTerminal && modeId && <GameUI modeId={modeId} />}
```

4. **Ou** : afficher `GameUI` après la phase `"done"` de `WakeUpTerminal` en lui passant le `modeId` choisi sur la Landing.
