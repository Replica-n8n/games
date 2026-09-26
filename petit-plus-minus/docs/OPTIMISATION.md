# Optimisation du kit, 2026-09-25

Le kit sortait d'une conversation Claude Chat, pensé pour Expo. Voici ce qui a changé
pour en faire une PWA à la hauteur de nos autres apps, avec les mesures. Rien n'est
codé à ce stade.

## Mesuré

**Contrastes** (21 paires relevées dans les maquettes) : tous les textes passent, de
5,2:1 à 13,6:1. Cinq objets échouent au seuil de 3:1 : l'étoile (1,54 et 1,77), le bord
d'une carte météo non choisie (1,53), le bord de la bulle de respiration (1,87), la
gemme trouvée (2,04). Corrections chiffrées dans `DESIGN.md`.

**Hauteur des écrans à 360 px de large** (maquette sans hauteur fixe, rendue dans
Chromium ; police de repli, donc à quelques pour cent près) :

| Écran | Hauteur | Pixel 9 (732) | 360 × 640 |
|---|---|---|---|
| Accueil | 800 | dépasse de 68 | dépasse de 160 |
| Météo (avec message) | 755 | dépasse de 23 | dépasse de 115 |
| SOS (respiration) | 688 | tient | dépasse de 48 |
| Combat | 796 | dépasse de 64 | dépasse de 156 |
| Entraînement | 800 | dépasse de 68 | dépasse de 160 |
| Souffle | 824 | dépasse de 92 | dépasse de 184 |
| Victoire | 723 | tient | dépasse de 83 |
| Mémo | 438 | tient | tient |
| Trésors | empile ses 5 étapes, non mesurable tel quel | | |

Avec `overflow: hidden`, ce qui dépasse était **coupé** : sur ton Pixel, le bouton
« C'est parti ! » de l'accueil sortait de l'écran.

**Texte hors de `contenu.json`** : une cinquantaine de phrases des maquettes, dont
toutes les étapes du SOS, alors que le principe 6 du kit l'interdit.

## Changé

| Sujet | Kit | Optimisé | Pourquoi |
|---|---|---|---|
| Stack | Expo, React Native, stores | PWA vanilla dans `games/` | ton choix ; aucun build, hors ligne, Pages |
| Polices | Google Fonts | woff2 hébergés | hors ligne, elles disparaissaient |
| Mise en page | 390 × 844 fixe, `overflow: hidden` | `100svh`, défile si besoin, bloc < 700 px | 6 écrans sur 9 dépassent sur ton Pixel |
| Action principale | 56 à 60 px, parfois au milieu | 64 px, en bas, 24 px d'air avant | sous le pouce |
| Texte minimal | 13 px (12 px sur la météo) | 14 px, en `rem` | lisibilité, taille du téléphone |
| Animation de taille | ressort 500 à 600 ms | 500 ms, décélération, sans rebond | un rebond fait regrossir Minus |
| Animations réduites | non traité | bulle guidée par le mot et la teinte | l'outil de calme ne doit pas disparaître |
| Double appui au combat | non traité | choix bloqués pendant l'animation | compte une réponse de trop |
| Espace parent | « calcul ou appui long » | bouton visible + calcul | un appui long ne s'annonce pas |
| Données | « tout en local » | clés `ppm:`, `storage.persist()`, sauvegarde en fichier | même origine que les autres jeux ; seul filet |
| Confidentialité | promesse | politique de sécurité `default-src 'self'` | vérifiable, pas seulement promis |
| Mise à jour | non traité | patron `serpentin/sw.js`, diagnostic + « Réparer » | relais Pages, déjà payé sur le chevalier |
| Installation | stores | bouton parent + chemin du menu ⋮ | Chrome choisit seul quand proposer |
| Feuille de route | socle d'abord | maquette 360 px d'abord, SOS avant l'entraînement | montrer avant de coder ; le SOS sert seul |

## Tranché le 2026-09-25 (détails dans `GAME_DESIGN.md`)

1. Petit Plus est une fille (« grande et forte »).
2. Bouton « J'ai besoin de calme » sur l'accueil, qui ouvre le SOS en un appui.
3. Bonus de combat = niveau, plafonné à 4.
4. 10 étoiles par niveau.
5. Une seule collection : « Mes diplômes ».

## Gardé tel quel

Les 7 principes, le game design, les personnages, la palette (échelle Tailwind, textes
tous conformes), les rayons, les ombres de bouton, le ton du texte.
