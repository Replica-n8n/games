# À faire à la reprise : relecture complète, puis la météo

Écrit le 2026-08-27 avant la coupure de quota. Elle veut, à son réveil :
**tout propre, plus de bug trouvé par hasard**, et une **météo dynamique**.

## État au moment de la coupure

Tout est vert et poussé, `439e547` :

| Contrôle | Résultat |
|---|---|
| `chevalier-moteur.mjs` | 30 essais, 0 raté |
| `chevalier-parcours.mjs` | vert, profil Pixel 9 |
| `chevalier-difficulte.mjs` | médiane 480 s, la pire arme 190 s, 14 victoires sur 18 |
| `chevalier-foule.mjs` | 0,34 ms à 60 bestioles, 2,49 ms à 300 |
| `chevalier-pwa.mjs` | se relance hors ligne |
| `chevalier-enligne.mjs` | à relancer après le prochain push |

## 1. La relecture, d'abord

**Avant d'écrire la météo.** Ajouter du code sur une base non relue, c'est
ajouter des bugs qu'on trouvera par hasard, ce qu'elle refuse explicitement.

Dans cet ordre :

1. `/code-review high` sur la branche, puis lire chaque trouvaille une par une
   et la vérifier avant de la corriger. Ne rien corriger sur la foi d'un
   rapport : recalculer.
2. `/security-review` sur les changements. Le jeu ne parle à personne, mais le
   service worker et le stockage méritent un regard.
3. Une passe à la main sur les trois pièges déjà rencontrés, parce qu'ils sont
   sournois et qu'ils ont mordu trois fois :
   - toute déclaration après un `return` (un essai le garde déjà pour
     `moteur.js`, **l'étendre à `armes.js`**)
   - tout essai qui pourrait passer sans rien prouver : valeur `NaN`, partie
     finie, jeu en pause, mesure qui ne joue pas
   - toute valeur réglée qui n'est lue par personne. **L'aimant et les bottes
     n'ont rien fait pendant des heures.** Vérifier une par une que chaque
     entrée de `REGLAGES`, de `CATALOGUE` et de `OBJETS` est réellement lue.
4. Vérifier que les frontières tiennent encore : ajouter une arme ne doit
   toucher que `armes.js`, une bestiole que `bestioles.js`, un monde que
   `mondes.js`.

## 2. La météo

Nouveauté demandée. Aléatoire, elle change pendant la partie.

| Temps | Ce que ça change |
|---|---|
| **Beau** | rien, l'état par défaut |
| **Pluie** | l'écran s'assombrit un peu, des gouttes tombent. Rien de mécanique |
| **Orage** | la pluie, plus **la foudre qui frappe les bestioles**. Un éclair prévient une seconde avant de tomber, comme tout le reste |
| **Neige** | des flocons, et des **plaques de glace** au sol : le chevalier y glisse et tourne moins bien |
| **Nuit** | tout s'assombrit, le chevalier et les objets gardent un halo |

Trois règles à ne pas casser :

- **la foudre prévient**, une seconde, avec sa marque au sol. Même règle que le
  hérisson, le crapaud et le pissenlit, et pour la même raison : à 8 ans on
  réagit deux à trois fois plus lentement
- **la nuit ne doit jamais cacher une menace.** Si on assombrit, les bestioles
  gardent leur contour clair, sinon on meurt de quelque chose qu'on n'a pas vu
- **la glace fait glisser, elle ne tue pas.** Comme les buissons et la haie

Où ça vit : un fichier **`meteo.js`**, une définition par temps, avec ses
effets et son dessin. Même règle de frontière que les autres : ajouter un
temps ne doit toucher que ce fichier.

Ce que le moteur devra exposer pour ça, sans rien savoir d'un flocon :

- `partie.meteo` : le temps courant, et depuis quand
- un tableau `bonus` déjà en place, à étendre : `adherence` (la glace),
  `visibilite` (la nuit)
- une façon de frapper une bestiole depuis l'extérieur, déjà là : `blesser`

Essais à écrire **avant** le code :

- la foudre ne tombe jamais sans avoir prévenu une seconde
- sur la glace, le chevalier tourne moins bien, mais ne perd aucun cœur
- le temps change tout seul, et jamais deux fois de suite le même
- la nuit, on voit encore les bestioles (contrôle de contraste, pas d'avis)
- `chevalier-foule.mjs` repasse : les gouttes et les flocons sont nombreux, et
  c'est exactement le genre de chose qui coûte cher pour rien

## 3. Ne pas oublier

- changer `VERSION` dans `sw.js` à chaque livraison
- relancer les cinq contrôles, puis `chevalier-enligne.mjs` après le push
- si la météo coûte plus de 1 ms par image, la simplifier tout de suite
