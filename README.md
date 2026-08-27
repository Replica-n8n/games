# Games

Des jeux à jouer sur le téléphone, un par dossier. Vanilla JS, aucune
dépendance, aucun outil de build. Chaque jeu est une PWA autonome qui
fonctionne hors ligne.

| Dossier | Jeu | Quoi |
|---|---|---|
| [`echecs/`](echecs/) | **Échecs et Dames** | Deux jeux dans une seule app. Joueur contre joueur sur un seul téléphone, règles complètes, pas d'adversaire artificiel, pas de chrono. |
| [`serpentin/`](serpentin/) | **Serpentin** | Un serpent dans la prairie, contre des adversaires artificiels. Sans publicité, sans achat. ⚠️ en construction, étape 1 sur 9. |

⚠️ Le dossier s'appelle encore `echecs/` : l'adresse était déjà en ligne et
installée quand les dames sont arrivées, la renommer aurait cassé les
installations existantes.

## Ajouter un jeu

Créer un dossier à la racine, avec son propre `index.html`, son `manifest.json`
et son `sw.js`. Les portées des service workers ne se chevauchent pas : chaque
jeu est isolé dans son sous-chemin. Ajouter ensuite une ligne dans le tableau
ci-dessus et une carte dans l'`index.html` racine.

## En ligne

GitHub Pages, branche `main`, dossier racine. Activé le 2026-08-27 :

- l'accueil : <https://replica-n8n.github.io/games/>
- les échecs : <https://replica-n8n.github.io/games/echecs/>
- Serpentin : <https://replica-n8n.github.io/games/serpentin/>

Vérifié servi : les six fichiers répondent 200 avec le bon type, le service
worker prend le contrôle au rechargement, et le jeu se relance **hors ligne**,
32 pièces à l'écran. `node tools/echecs-enligne.mjs` rejoue ce contrôle.

⚠️ Le service worker garde les fichiers en cache. Après chaque modification,
changer `VERSION` dans le `sw.js` du jeu concerné, sinon le téléphone continue
d'afficher l'ancienne version.

---

## Échecs et Dames

Une seule app, deux jeux. L'écran d'accueil propose le jeu au lieu d'un bouton
« Commencer », et les 3 points permettent d'en changer en cours de route. Le
dernier jeu choisi est retenu d'une fois sur l'autre.

| Fichier | Rôle |
|---|---|
| [`echecs/index.html`](echecs/index.html) | la coquille : plateau, bandeaux joueurs, menu, surcouches |
| [`echecs/moteur-echecs.js`](echecs/moteur-echecs.js) | les règles des échecs |
| [`echecs/moteur-dames.js`](echecs/moteur-dames.js) | les règles des dames internationales |

La coquille ne connaît aucune règle. Elle demande au moteur la taille du damier,
ce qu'il y a sur chaque case, les coups possibles, et le texte à afficher.
Ajouter un troisième jeu, c'est écrire un troisième moteur et une carte de plus
sur l'écran d'accueil.

## Dames

Dames internationales, le damier français : 10x10, 20 pions chacun, on ne joue
que sur les cases sombres. Toutes les règles qui comptent sont appliquées :
prise obligatoire et **rafle la plus longue imposée**, pion qui prend en avant
comme en arrière, dame qui vole sur toute la diagonale, pion déjà sauté qui ne
peut pas l'être deux fois et qui gêne le passage jusqu'à la fin de la rafle,
promotion seulement si le pion **s'arrête** sur la dernière rangée.

Une rafle se joue case par case : on touche la pièce, puis chaque case
d'arrivée. Le pion reste visible à son point de départ tant que la rafle n'est
pas finie, les cases déjà parcourues sont marquées, et les pions qui vont
tomber sont cerclés de rouge.

Vérifié par `tools/perft-dames.js` contre les valeurs de référence de la FMJD,
jusqu'à six coups : 9, 81, 658, 4265, 27117, 167140. Si ces six nombres tombent
juste, la prise maximale, le vol de la dame et la règle du pion déjà sauté sont
correctes.

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
| `parcours.mjs` | le parcours complet des DEUX jeux, profil Pixel 7 |
| `perft-dames.js` | les dames, contre les valeurs de référence de la FMJD |
| `echecs-parade.mjs` | la position où le roi est en échec sans case libre |
| `echecs-enligne.mjs` | ce que GitHub Pages sert vraiment, dont le hors ligne |
| `position.js` | analyse une position en FEN, coups légaux et cases du roi |
| `fait-artifact.js` | fabrique `echecs/artifact.html`, la version d'aperçu |

---

## Serpentin

Clone sans publicité ni achat de **Sneak.io** (Play Store), qui est lui même un
clone de slither.io. Un serpent dans la prairie : on mange des fleurs, on
s'allonge, on essaie de faire mourir les autres et de récolter ce qu'ils
laissent.

**La cible est un enfant de 8 ans**, et ça tranche les règles : seuls les
serpents tuent. Les buissons ralentissent, le bord fait glisser. Toute mort
vient d'une chose qu'on a vue bouger.

Conception : [la spec](docs/superpowers/specs/2026-08-27-serpentin-prairie-design.md)
et [le plan](docs/superpowers/plans/2026-08-27-serpentin-prairie-plan.md).

**État : étape 4 sur 9.** Ça se joue au pouce, et c'est essayé sur un vrai Pixel 9a. La coquille PWA, le moteur des
règles, la prairie, le manche flottant et le bouton pour foncer. Il manque
encore la mort, les adversaires, les potions et la progression : on ne peut ni
mourir ni perdre pour l'instant.

| Script de `tools/` | Ce qu'il contrôle |
|---|---|
| `serpentin-pwa.mjs` | la page s'ouvre, le service worker prend le contrôle, et **le jeu se relance hors ligne**. Sert le dépôt sur `127.0.0.1`, parce qu'un service worker refuse `file://` |
| `serpentin-moteur.mjs` | les règles, **sans navigateur** : déplacement, virage, longueur du corps, fleurs, boost et son plancher, et la même graine qui redonne la même partie |
| `serpentin-pixel9.mjs` | le parcours en Chromium, profil **Pixel 9** (360 x 732 points CSS, plus étroit que le 9a, donc plus dur pour le HUD). Contrôle de frontière : un monde inconnu injecté à chaud doit s'afficher sans qu'on touche à l'affichage |
| `serpentin-icones.mjs` | refabrique les deux icônes à partir de `serpentin/icone.html` |
| `serpentin-enligne.mjs` | ce que **GitHub Pages sert vraiment** : les huit fichiers, le jeu qui tourne, et le relancement hors ligne |
| `serveur.mjs` | le serveur local partagé par les contrôles, parce qu'un service worker refuse `file://` |

### Régler en jouant

Toutes les valeurs du jeu sont dans `REGLAGES`, en tête de
[`serpentin/moteur.js`](serpentin/moteur.js). N'importe laquelle se remplace
par un paramètre d'adresse, pour comparer sur le téléphone sans republier :

```
https://replica-n8n.github.io/games/serpentin/?virage=8&vitesse=170
```

`virage` est la vitesse de rotation en radians par seconde, et c'est elle qui
décide la largeur du virage : rayon = `vitesse / virage`. À 3,4 le cercle
faisait 42 unités pour un serpent qui en fait 5, jugé lent et large au premier
essai sur le Pixel 9a. À 6 il fait 24, soit un demi tour en une demi seconde.
