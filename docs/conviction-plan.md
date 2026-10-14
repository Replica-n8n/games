# Pièce à conviction · plan

Jeu de placement et d'enquête, en PWA. Reprend le prototype validé
« L'Affaire Valcourt » (`docs/conviction-poc-valcourt.html`), en code propre et maintenable.
Contenu 100 % original : ni le nom, ni les personnages, ni les scènes des
livres existants.

Nom choisi : **Pièce à conviction** (nom court « Conviction »). Il se règle à
un seul endroit, `conviction/config.js`, repris par le manifest et `conviction/i18n/fr.js`.

## Où vit le projet, et quelle technique

Dossier `conviction/` du dépôt `games`, servi à
`https://replica-n8n.github.io/games/conviction/`. Branche `conviction`,
worktree `games-conviction/`.

**JavaScript sans build, comme les autres jeux** (décidé le 2026-10-14, après
qu'elle m'a laissé choisir la technique). Le prompt d'origine demandait Vite + TypeScript.
Dans ce dépôt servi tel quel, il aurait fallu commiter un dossier construit et
maintenir un second système pour un seul jeu.

- **Modules ES** dans le navigateur, sans dépendance.
- **Types en JSDoc**, vérifiés par `tsc --checkJs` (`conviction/jsconfig.json`)
  en CI : la sécurité de TypeScript, sans compilation.
- **Tests** : `node --test tools/conviction-*.test.mjs`, intégré à Node.
- **Validation des enquêtes** : `node tools/conviction-enquetes.mjs`, en CI.
  Une enquête invalide fait échouer la CI.
- **Service worker écrit à la main**, avec nos règles : cache
  `conviction:app:VERSION`, `?v=` à l'installation, toast de mise à jour.
- Préfixe `conviction:` pour les caches et le stockage (même origine que
  toutes nos apps). L'Arcade pourra l'afficher en tuile.
- La catégorie « PWA » de Lighthouse n'existe plus depuis Lighthouse 12 :
  cibles ≥ 90 en Performance, Accessibilité, Bonnes pratiques ;
  installabilité et hors-ligne prouvés par un banc Playwright, réseau coupé.
- localStorage plutôt qu'IndexedDB (quelques Ko). Touches 1 à N, pas 1 à 6
  (une enquête 8×8 a 8 personnes).

## Moteur (`conviction/engine/`, sans DOM)

### Format d'une enquête (`conviction/puzzles/*.json`)

```
id, title, theme, difficulty ("facile" | "moyen" | "difficile"), size
intro            texte d'ouverture
rooms            [{ id, name }]
layout           N chaînes, une lettre de pièce par case
furniture        [{ type, cells: [[ligne, colonne]] }]
persons          [{ id, name, role, color, victim?, clue, testimony }]
solution         { personId: [ligne, colonne] }
verdict          récit de fin quand le bon coupable est désigné
```

Types de meubles dans `conviction/engine/furniture.js` : chacun dit s'il **bloque**
la case, s'il est un **siège**, ou s'il n'est qu'un repère au sol. Son nom et
son article (« le piano ») vivent dans `fr.ts`.

### Indices (JSON déclaratif, jamais de fonction)

`besideObject`, `onObject`, `inRoom`, `seated`, `row`, `column`, `relative`
(personne, direction, distance facultative), `sameRoom`, `aloneWith`, `alone`,
`not`, `and`, `or`.

« À côté » = adjacent orthogonalement ET dans la même pièce, défini à un seul
endroit. Exemples de Valcourt :
- la victime : `and[column F, not besideObject fontaine]` ;
- Bastien : `and[seated, onObject fauteuil, inRoom bibliothèque]`.

### Fonctions

- `evaluateClue(puzzle, placement, personId)` : vrai, faux, ou indéterminé
  tant que le placement est partiel (utile au solveur et à « Vérifier »).
- `solve(puzzle)` : on traite d'abord la personne qui a le moins de cases
  possibles ; chaque placement retire sa ligne et sa colonne aux autres ;
  chaque indice est vérifié dès qu'il peut trancher, ceux de pièce
  (« seul avec ») quand la pièce est déterminée. Arrêt à 2 solutions.
- `findCulprit(puzzle, solution)` : la seule personne seule avec la victime
  dans une pièce ; erreur s'il y en a zéro ou plusieurs.
- `validatePuzzle(puzzle)` : données cohérentes (cases dans la grille, pièces
  connexes, ids référencés, initiales uniques puisque le pion les affiche,
  couleurs connues), solution unique, égale à `solution`, coupable unique.
- `nextHint(puzzle, placement, marks)`, du plus simple au plus fort :
  1. un pion mal placé (« Ce pion n'est pas à sa place ») ;
  2. un témoignage qui ne laisse qu'une case ;
  3. une ligne ou une colonne où une seule personne peut aller ;
  4. une case qui s'élimine ;
  5. l'absurde à un pas (« si X était en B3, Y n'aurait plus de place ») ;
  6. en dernier recours, « X est en C4 ».

  Chaque indice renvoie son texte et les cases à surligner. La chaîne complète
  sert aussi à estimer la difficulté, et plus tard au générateur.

### Tests (`node --test`)

Chaque type d'indice ; solveur (unicité, détection de deux solutions) ;
`findCulprit` (zéro, un, deux) ; `validatePuzzle` sur des enquêtes cassées
exprès ; `nextHint` sur Valcourt, qui se résout depuis une grille vide sans jamais
donner la réponse : Bastien, Dorian, Céleste, la victime, Eugénie, Agathe
(le prototype plaçait Agathe avant Eugénie, par l'absurde ; le moteur trouve
plus simple : seule Eugénie peut occuper la colonne B).

`tools/conviction-enquetes.mjs` tourne en CI.

## Interface (`conviction/ui/`)

- **Une partie = la liste de ses actions** (placer, retirer, barrer) : annuler
  et rétablir en découlent, la sauvegarde se fait à chaque action.
- Toucher-toucher comme le prototype, plus glisser-déposer en pointer events.
- Chronomètre en horodatage absolu, en pause sur `visibilitychange`.
- Compteur d'indices utilisés.
- Clavier : flèches, Entrée place, X barre, 1 à N choisit une personne.
- Textes dans `conviction/i18n/fr.js`.

### Reprise du prototype, et ce qui change

- **Gardé** : plan d'architecte (murs épais entre pièces, hachures des meubles
  bloquants, fond quadrillé), pions ronds à initiale, victime en pointillés,
  coordonnées « C2 » (lettre = colonne), aide des lignes et colonnes occupées,
  mode Barrer, zone d'état, accusation puis verdict, thèmes clair et sombre.
- **Contrastes** : l'initiale blanche sur l'or d'Agathe (`#c9971a`) donne
  2,65:1 pour 3:1 exigés, et l'or du thème sombre est plus clair encore. Il
  faut aussi 7 couleurs de pions (8×8) contre 5. Palette de 7 calculée pour
  passer dans les deux thèmes.
- **8×8 sur 360 px** : avec la marge et la colonne des numéros, une case fait
  38 px. En 8×8, le plan passe pleine largeur et les numéros entrent dans les
  cases, pour tenir les 44 px.
- **Petits textes** : noms de pièces (9 px) et légende (11 à 12 px) passent à
  14 px minimum.
- **Polices** : Big Shoulders Display, IBM Plex Sans et Mono (licence OFL),
  hébergées en woff2 latin, plus d'appel à Google Fonts.
- **Retiré** : le mot « Murdoku », les indices écrits à la main (remplacés par
  `nextHint`), le code `window.claude.hot`.
- À l'étape 3, **planche de captures prototype / nouvelle version** côte à
  côte, au format Pixel 9 et 360 × 640, clair et sombre, avant validation.

## Écrans

1. Accueil : nom, « Continuer l'enquête », « Toutes les enquêtes », règles,
   bouton **Installer** (avec les instructions iPhone).
2. Liste : difficulté, état (non commencée, en cours, résolue), temps record.
3. Jeu : voir plus haut.
4. Règles illustrées avec une mini-grille interactive.
5. Réglages : thème (système, clair, sombre), aide des lignes et colonnes,
   vibrations, réinitialiser la progression (en deux temps, annulable).

## PWA

Manifest complet (`display: standalone`, orientation `any`, icônes 192, 512,
maskable, apple-touch-icon tirées d'un SVG original : une loupe sur une
grille). Precache de tout, y compris les enquêtes. Toast « Nouvelle version
disponible · Recharger ». Banc Playwright : premier chargement, réseau coupé,
rechargement, partie jouable.

## Étapes

1. Plan + nom. ✅
2. Moteur, tests, conversion de Valcourt, script de validation. ✅
3. Écran de jeu, à parité avec le prototype, planche de captures. ✅
4. PWA : manifest, service worker, hors-ligne, installation, mises à jour.
5. Accueil, liste, règles, réglages, sauvegarde de la progression.
6. Les 5 nouvelles enquêtes (2 faciles 6×6, 2 moyennes 6×6 ou 7×7,
   1 difficile 8×8), toutes validées.
7. Finitions, Lighthouse (3 passages au moins), README.

Bonus après validation : `tools/conviction-generateur.mjs`.

Chaque étape finit par un commit et un résumé, puis attend la validation.
