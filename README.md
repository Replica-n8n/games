# Games

Des jeux à jouer sur le téléphone, un par dossier. Vanilla JS, aucune
dépendance, aucun outil de build. Chaque jeu est une PWA autonome qui
fonctionne hors ligne.

| Dossier | Jeu | Quoi |
|---|---|---|
| [`echecs/`](echecs/) | **Échecs** | Joueur contre joueur sur un seul téléphone. Règles complètes, pas d'adversaire artificiel, pas de chrono. |

## Ajouter un jeu

Créer un dossier à la racine, avec son propre `index.html`, son `manifest.json`
et son `sw.js`. Les portées des service workers ne se chevauchent pas : chaque
jeu est isolé dans son sous-chemin. Ajouter ensuite une ligne dans le tableau
ci-dessus et une carte dans l'`index.html` racine.

## En ligne

GitHub Pages, branche `main`, dossier racine. Activé le 2026-08-27 :

- l'accueil : <https://replica-n8n.github.io/games/>
- les échecs : <https://replica-n8n.github.io/games/echecs/>

Vérifié servi : les six fichiers répondent 200 avec le bon type, le service
worker prend le contrôle au rechargement, et le jeu se relance **hors ligne**,
32 pièces à l'écran. `node tools/echecs-enligne.mjs` rejoue ce contrôle.

⚠️ Le service worker garde les fichiers en cache. Après chaque modification,
changer `VERSION` dans le `sw.js` du jeu concerné, sinon le téléphone continue
d'afficher l'ancienne version.

---

## Échecs

Un seul fichier, [`echecs/index.html`](echecs/index.html) : modèle de jeu et
interface, environ 600 lignes, sans dépendance.

**Installation** : le jeu garde sous la main l'invitation d'installation de
Chrome (`beforeinstallprompt`) et la propose dans les 3 points, « Installer le
jeu ». La bannière automatique du navigateur n'apparaît qu'une fois et jamais
si elle a été ignorée : compter dessus, c'est n'avoir aucune installation.
L'entrée disparaît une fois le jeu installé.

**Ce qui est joué** : tous les coups légaux, roque, prise en passant, échec,
mat, pat. Seule simplification assumée, la promotion donne toujours une dame.

**En échec, on ne reste pas coincé** : quand la pièce touchée ne peut pas
bouger, le jeu entoure celles qui peuvent parer l'échec, et le dit sous le
plateau. Un roi sans case n'est pas un mat : une autre pièce peut couper la
ligne ou prendre l'attaquant. `tools/echecs-parade.mjs` rejoue la position qui
a soulevé la question.

**L'écran** : une barre d'état en haut, un bandeau par joueur avec ses prises
et son avantage matériel, le plateau entre les deux. Deux surcouches, la même
mise en page : celle du départ avec « Commencer », celle de fin de partie avec
le roi couché, le résultat et « Recommencer ». La fin de partie s'affiche avec
900 ms de retard, pour laisser voir la position finale et le roi en échec. Les 3 points en haut à
droite ouvrent une feuille par le bas : annuler le dernier coup, choisir entre
un plateau qui pivote et un plateau fixe, recommencer la partie. Le choix du
plateau est retenu d'une partie à l'autre.

**Plateau qui pivote ou fixe** : pivoter n'a de sens que si les deux joueurs
regardent l'écran depuis le même côté, c'est à dire si on se passe le téléphone.
Assis face à face avec le téléphone posé à plat, la disposition par défaut est
déjà bonne pour les deux et pivoter éloignerait les pièces du joueur au trait.
D'où les deux options.

### Vérification

Le générateur de coups est vérifié par `perft` contre les valeurs de référence
connues : position de départ jusqu'à la profondeur 4 (197 281 coups), position
« kiwipete » jusqu'à 3, position 3 jusqu'à 4. Le script d'essai extrait le bloc
`modele` directement du HTML livré, il ne teste pas une copie.

Le parcours complet a été joué en Chromium, profil Pixel 7 : départ, coups
possibles, prise, rotation, les deux options de plateau, persistance du choix
après rechargement, mat. Zéro erreur console.

Les deux scripts sont dans [`tools/`](tools/) et se relancent depuis ce dossier :

```
cd tools
npm i playwright && npx playwright install chromium   # une seule fois
node perft.js
node echecs-pixel7.mjs
```

`perft.js` ne demande que Node. Les scripts Playwright affichent leurs mesures
en JSON et déposent leurs captures dans `tools/captures/` :

| Script | Ce qu'il contrôle |
|---|---|
| `perft.js` | le générateur de coups, contre les valeurs de référence |
| `echecs-pixel7.mjs` | le parcours complet, profil Pixel 7 |
| `echecs-parade.mjs` | la position où le roi est en échec sans case libre |
| `echecs-installation.mjs` | l'entrée « Installer le jeu » et le manifeste servi |
| `echecs-enligne.mjs` | ce que GitHub Pages sert vraiment, dont le hors ligne |
| `position.js` | analyse une position en FEN, coups légaux et cases du roi |
| `fait-artifact.js` | fabrique `echecs/artifact.html`, la version d'aperçu |
