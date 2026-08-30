# Games

Des jeux à jouer sur le téléphone, un par dossier. Vanilla JS, aucune
dépendance, aucun outil de build. Chaque jeu est une PWA autonome qui
fonctionne hors ligne.

| Dossier | Jeu | Quoi |
|---|---|---|
| [`echecs/`](echecs/) | **Échecs et Dames** | Deux jeux dans une seule app. Joueur contre joueur sur un seul téléphone, règles complètes, pas d'adversaire artificiel, pas de chrono. |
| [`serpentin/`](serpentin/) | **Le chevalier** | Un « survivants » pour enfants : les armes frappent toutes seules, on ne contrôle que le déplacement. ⚠️ en construction. |

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
- le chevalier : <https://replica-n8n.github.io/games/serpentin/>

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

## Le chevalier

Un « survivants » pour enfants, dans la prairie. On joue un chevalier, **on ne
contrôle que le déplacement**, les armes frappent toutes seules. Les bestioles
arrivent par vagues, on ramasse leurs graines, on monte de niveau et on choisit
entre trois cartes. Huit minutes.

Clone sans publicité ni achat de **Vampire Survivors**, vérifié à la source
puis adapté : 8 minutes au lieu de 30, un boss battable au lieu du Faucheur
imbattable, cinq cœurs au lieu de points de vie chiffrés, aucune monnaie.

⚠️ **Le dossier s'appelle encore `serpentin/`** : il a contenu un jeu de
serpent, l'adresse était déjà en ligne, et une adresse ne se change pas pour
faire joli. Même raison que `echecs/`, qui contient aussi les dames.

**La cible est un enfant de 8 ans**, et trois règles en découlent, tirées de
mesures et pas d'une intuition :

- **au plus trois « individus » à l'écran** : à 8 ans on suit trois objets en
  mouvement, quatre chez l'adulte. Le reste est de la foule, et une foule se
  lit comme une texture
- **soixante bestioles au plafond**, pas les 300 du jeu de référence : l'écran
  du téléphone fait huit fois moins de surface qu'un écran de PC
- **une seconde de préavis** avant toute attaque : à 8 ans on réagit deux à
  trois fois plus lentement

Conception : [la spec](docs/superpowers/specs/2026-08-27-survivants-prairie-design.md)
et [le plan](docs/superpowers/plans/2026-08-27-survivants-prairie-plan.md).

### Les fichiers

| Fichier | Ce qu'il fait |
|---|---|
| `index.html` | l'écran, le HUD, les trois surcouches, le manche flottant |
| `moteur.js` | le monde, le chevalier, les vagues, les dégâts, les graines. Aucun DOM |
| `bestioles.js` | **une définition par bestiole** : ses chiffres et son dessin |
| `armes.js` | **une définition par arme** : sa portée, sa cadence, sa forme, son dessin |
| `mondes.js` | le décor d'un monde : couleurs, obstacles |
| `meteo.js` | **une définition par temps** : sa durée, ses suites, son voile et son dessin |
| `souvenirs.js` | ce que le jeu retient des parties précédentes, et rien d'autre |
| `sons.js` | **une définition par son**, fabriqué en direct : aucun fichier |

Règle de frontière : ajouter une arme, une bestiole, un monde ou un temps doit
coûter un objet dans **son** fichier, et rien d'autre.

### Ce que chaque niveau change

<!-- tableaux des armes : engendre par tools/chevalier-tableaux.mjs -->

**Les armes.** Quatre emplacements, six niveaux chacune.

#### Épée ⚔️

Un grand moulinet devant toi.

| Niveau | dégâts | délai (s) | portée | largeur (rad) |
|---|---|---|---|---|
| 1 | 3 | 0.9 | 96 | 2.7 |
| 2 | 4 | 0.85 | 103 | 2.8 |
| 3 | 5 | 0.8 | 110 | 2.9 |
| 4 | 6 | 0.75 | 117 | 3 |
| 5 | 7 | 0.7 | 124 | 3.1 |
| 6 | 8 | 0.65 | 131 | 3.2 |

Ne bouge pas : durée (s) 0.3.

#### Bouclier 🛡️

Il tourne autour de toi.

| Niveau | dégâts | nombre | rayon | rotation |
|---|---|---|---|---|
| 1 | 2 | 1 | 66 | 2.7 |
| 2 | 3 | 2 | 70 | 2.85 |
| 3 | 4 | 3 | 74 | 3 |
| 4 | 5 | 4 | 78 | 3.15 |
| 5 | 6 | 5 | 82 | 3.3 |
| 6 | 7 | 6 | 86 | 3.45 |

Ne bouge pas : taille 15, repos (s) 0.22.

#### Arc 🏹

Il vise la bestiole la plus proche.

| Niveau | dégâts | délai (s) | traverse | nombre |
|---|---|---|---|---|
| 1 | 2 | 0.9 | 1 | 1 |
| 2 | 3 | 0.84 | 1 | 2 |
| 3 | 4 | 0.78 | 2 | 3 |
| 4 | 5 | 0.72 | 2 | 4 |
| 5 | 6 | 0.66 | 2 | 5 |
| 6 | 7 | 0.6 | 3 | 6 |

Ne bouge pas : rotation 420, portée 340, taille 6.

#### Souffle 🔥

Tu craches le feu devant toi.

| Niveau | dégâts | délai (s) | portée | largeur (rad) |
|---|---|---|---|---|
| 1 | 3 | 1.1 | 132 | 1 |
| 2 | 4 | 1.04 | 144 | 1.08 |
| 3 | 5 | 0.98 | 156 | 1.16 |
| 4 | 6 | 0.92 | 168 | 1.24 |
| 5 | 7 | 0.86 | 180 | 1.32 |
| 6 | 8 | 0.8 | 192 | 1.4 |

Ne bouge pas : durée (s) 0.55.

#### Boule givrée ❄️

Elle tourne et gèle ce qu'elle touche.

| Niveau | dégâts | nombre | rayon | rotation | gele |
|---|---|---|---|---|---|
| 1 | 2 | 1 | 70 | 2.4 | 1.2 |
| 2 | 3 | 2 | 74 | 2.55 | 1.35 |
| 3 | 4 | 3 | 78 | 2.7 | 1.5 |
| 4 | 5 | 4 | 82 | 2.85 | 1.65 |
| 5 | 6 | 5 | 86 | 3 | 1.8 |
| 6 | 7 | 6 | 90 | 3.15 | 1.95 |

Ne bouge pas : taille 16, repos (s) 0.26.

#### Piques de terre ⛰️

La terre sort sous la bestiole.

| Niveau | dégâts | délai (s) | taille | nombre |
|---|---|---|---|---|
| 1 | 3 | 1.5 | 34 | 1 |
| 2 | 5 | 1.41 | 36 | 2 |
| 3 | 7 | 1.32 | 38 | 3 |
| 4 | 9 | 1.23 | 40 | 4 |
| 5 | 11 | 1.14 | 42 | 5 |
| 6 | 13 | 1.05 | 44 | 6 |

Ne bouge pas : portée 300, preavis 0.5, durée (s) 0.45.

#### Vent tranchant 🌬️

Cours ! Le vent coupe sur ton passage.

| Niveau | dégâts | largeur | durée (s) |
|---|---|---|---|
| 1 | 1.6 | 26 | 0.42 |
| 2 | 3.2 | 31 | 0.47 |
| 3 | 4.8 | 36 | 0.52 |
| 4 | 6.4 | 41 | 0.57 |
| 5 | 8 | 46 | 0.62 |
| 6 | 9.6 | 51 | 0.67 |

Ne bouge pas : repos (s) 0.6.

**Les objets.** Quatre emplacements, cinq niveaux chacun. Un objet
ne frappe jamais lui même : il améliore les armes que tu portes.

#### Bottes 👢

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +8 % de vitesse | 162 unités par seconde, au lieu de 150 |
| 2 | +16 % de vitesse | 174 unités par seconde, au lieu de 150 |
| 3 | +24 % de vitesse | 186 unités par seconde, au lieu de 150 |
| 4 | +32 % de vitesse | 198 unités par seconde, au lieu de 150 |
| 5 | +40 % de vitesse | 210 unités par seconde, au lieu de 150 |

#### Gantelets 🧤

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +1 dégât à chaque arme | l'épée fait 4 au lieu de 3, et le coup repousse à 24 au lieu de 10 |
| 2 | +2 dégâts à chaque arme | l'épée fait 5 au lieu de 3, et le coup repousse à 38 au lieu de 10 |
| 3 | +3 dégâts à chaque arme | l'épée fait 6 au lieu de 3, et le coup repousse à 52 au lieu de 10 |
| 4 | +4 dégâts à chaque arme | l'épée fait 7 au lieu de 3, et le coup repousse à 66 au lieu de 10 |
| 5 | +5 dégâts à chaque arme | l'épée fait 8 au lieu de 3, et le coup repousse à 80 au lieu de 10 |

#### Longue-vue 🔭

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +12 % de portée | l'épée porte à 108, au lieu de 96 |
| 2 | +24 % de portée | l'épée porte à 119, au lieu de 96 |
| 3 | +36 % de portée | l'épée porte à 131, au lieu de 96 |
| 4 | +48 % de portée | l'épée porte à 142, au lieu de 96 |
| 5 | +60 % de portée | l'épée porte à 154, au lieu de 96 |

#### Sablier ⏳

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +10 % de cadence | l'épée frappe toutes les 0.82 s, au lieu de 0.9 |
| 2 | +20 % de cadence | l'épée frappe toutes les 0.75 s, au lieu de 0.9 |
| 3 | +30 % de cadence | l'épée frappe toutes les 0.69 s, au lieu de 0.9 |
| 4 | +40 % de cadence | l'épée frappe toutes les 0.64 s, au lieu de 0.9 |
| 5 | +50 % de cadence | l'épée frappe toutes les 0.6 s, au lieu de 0.9 |

#### Pierre d'aimant 🧲

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +35 % de portée | les graines viennent de 128 unités, au lieu de 95 |
| 2 | +70 % de portée | les graines viennent de 162 unités, au lieu de 95 |
| 3 | +105 % de portée | les graines viennent de 195 unités, au lieu de 95 |
| 4 | +140 % de portée | les graines viennent de 228 unités, au lieu de 95 |
| 5 | +175 % de portée | les graines viennent de 261 unités, au lieu de 95 |

#### Heaume ⛑️

| Niveau | Effet | Ce que ça donne |
|---|---|---|
| 1 | +1 cœur | 6 cœurs au lieu de 5, et tous remplis |
| 2 | +2 cœurs | 7 cœurs au lieu de 5, et tous remplis |
| 3 | +3 cœurs | 8 cœurs au lieu de 5, et tous remplis |
| 4 | +4 cœurs | 9 cœurs au lieu de 5, et tous remplis |
| 5 | +5 cœurs | 10 cœurs au lieu de 5, et tous remplis |
<!-- fin des tableaux -->
### Régler en jouant

Toutes les valeurs sont dans `REGLAGES`, en tête de
[`serpentin/moteur.js`](serpentin/moteur.js). Elles se règlent en jouant, pas
sur le papier, et **elles ne se changent plus par l'adresse** : le paramètre
d'URL servait au jeu de serpent, il n'a plus d'usage ici, et il permettait de
figer l'onglet avec un réglage à zéro.

### Le son

⚠️ **Aucun fichier.** Tout est synthétisé par l'API Web Audio — des
oscillateurs, du bruit blanc filtré, des enveloppes. Zéro octet à télécharger,
ça marche hors ligne dès la première visite, et ça respecte la règle du projet :
aucune dépendance, aucune étape de compilation. Dix-neuf sons, un objet chacun
dans `VOIX`.

⚠️ Un navigateur **refuse** de faire du son avant un geste : le réveil se fait
au clic sur « Jouer », pas au chargement. Sinon le contexte reste endormi et le
jeu est muet toute la partie sans que personne comprenne pourquoi.

⚠️ Et tout est **plafonné** : un repos par son (45 ms pour une graine) et
quatorze voix au maximum. Mesuré en poussant : 1 200 tentatives lancées dans la
même image, 7 jouées, 1 193 refusées. Sans ces deux limites, une bombe qui tue
vingt bestioles lance vingt sons d'un coup.

Un contrôle relie les deux bouts : **chaque événement du moteur doit avoir son
son**, et chaque son doit être joué par quelqu'un. Il a trouvé tout de suite que
figer toute la prairie dix secondes se faisait dans le silence complet.

L'interrupteur **Son / Muet** est dans le menu et se garde d'une fois sur
l'autre. Sans navigateur — ou sans API audio — le module ne casse rien : le jeu
marche, sans bruit.

### L'interrupteur « Difficile »

Dans le menu, deux modes : **Normal** et **Difficile**. Le second fait arriver
toutes les bestioles dès la première seconde, et fait tourner le ciel toutes
les 30 s.

Il est né comme un mode d'essai — attendre six minutes pour rencontrer la
limace n'est pas une façon d'essayer un jeu — et il s'est avéré être exactement
un mode difficile. Dans le code il garde son nom d'origine, `essai`, parce que
la clé du stockage s'appelle déjà comme ça : renommer la clé ferait perdre son
choix à qui l'a déjà fait.

⚠️ Il lève **les deux portes**. Certaines bestioles n'attendent pas l'heure mais
la puissance (la limace, au niveau 6) : remettre les heures à zéro sans lever
`arriveNiveau` donnerait un mode « tout voir » sans limace.

⚠️ Et une partie difficile **ne compte pas** dans les souvenirs qui règlent la
difficulté. Sans cette règle, trois parties où l'on meurt en une minute
feraient croire au jeu que l'enfant n'y arrive pas, et adouciraient le vrai jeu
pour de bon.

Le mode se garde d'une fois sur l'autre et se **voit** pendant la partie, une
pastille « DIFFICILE » sous le bouton du menu : sans marque, on rejoue trois
parties en se demandant pourquoi le jeu est devenu injouable.

`?mesure=1` reste : il affiche les images par seconde, le nombre de bestioles
et le coût du moteur et du dessin, sur le vrai téléphone.

### Le temps qu'il fait

Six temps, et ce qui compte n'est pas leur liste : c'est qu'ils **s'enchaînent**.
Chaque temps déclare dans `meteo.js` ce qui peut le suivre, avec un poids.
L'orage arrive après des nuages ou de la pluie, jamais après la neige ; le beau
temps revient en général par les nuages. Un essai rejoue douze parties et
vérifie qu'aucune transition ne sort de ce que le temps précédent autorisait.

Les durées vont du très court au très long — la pluie tient entre 12 et 150
secondes — et le tirage est **au carré** : une averse brève est fréquente, une
pluie qui dure toute la partie est rare mais possible.

Le sol garde la mémoire du ciel :

- la **neige s'accumule**, une plaque toutes les quatre secondes tant qu'elle
  tombe, jusqu'à vingt-six. Une averse en laisse deux, une tempête en couvre le
  terrain ;
- les plaques sont semées **là où l'enfant joue** (entre 180 et 800 unités de
  lui). Semées sur toute l'arène, elles tombaient toutes à plus de 500 : il
  neigeait, et on ne glissait jamais ;
- quand le soleil revient, la glace **fond** — elle rétrécit de neuf unités par
  seconde, et on glisse encore dessus tant qu'elle est là ;
- sous la neige, les bestioles avancent à 55 % de leur vitesse, avec un halo
  bleu qui le dit sans un mot ;
- les nuages promènent leur **ombre** sur l'herbe — et pas seulement quand il
  fait « nuageux » : la **pluie** et l'**orage** ont les leurs aussi, plus
  grosses, plus sombres et plus rapides. Une pluie tombe bien de quelque part ;
- ⚠️ **le voile de la nuit passe PAR DESSUS TOUT**, pas sur le sol. Une
  `teinte` (pluie, orage, nuageux) se pose sous les bestioles — le décor
  s'assombrit, jamais ce qui peut tuer. Un `voile` (la nuit) se pose après tout
  le monde : graines et bestioles comprises, on ne voit que ce qui est dans la
  clairière. Peint sur le sol, il laissait une bestiole parfaitement visible à
  l'autre bout d'un écran censé être noir ;
- la **nuit** n'est plus un filtre bleu. Le voile est un dégradé **transparent
  au centre** : l'herbe garde ses vraies couleurs dans un rayon de 170 unités
  autour du personnage — toute la largeur de l'écran, pour qu'un enfant voie
  venir ce qui arrive des côtés — et le noir se referme au loin (luminance 166
  sur lui, 22 en bas de l'écran, contre 178 en plein jour). Les graines luisent
  dans l'herbe, les lucioles vont par bandes, et sa lanterne pose une flaque de
  lumière chaude à ses pieds.

⚠️ Les **buissons** se dessinent AVANT le voile : dessinés après, ils restaient
vert vif en pleine nuit pendant que l'herbe autour virait au noir. Les graines
et les objets, eux, restent au-dessus — ce qu'on ramasse doit se voir.

⚠️ En mode **Difficile**, chaque temps ne dure que 30 s : voir la neige
s'entasser puis fondre au soleil demandait sinon de jouer longtemps et d'avoir
de la chance.

### La reine des toiles, le boss de fin

À **huit minutes**, on ne gagne plus parce que le chronomètre tombe à zéro —
c'était un anticlimax après huit minutes de jeu, et la demande d'origine était
« huit minutes qui finissent par un boss battable ». La prairie se vide, les
vagues s'arrêtent, et une araignée couronnée arrive. On gagne en la battant.

Elle a deux attaques, jamais mélangées, chacune annoncée une seconde avant :
elle **crache une toile** là où le chevalier va, et elle **se jette** en avant,
tout droit, donc esquivable.

⚠️ **Sa vie n'est pas un chiffre choisi.** Mesure du 2026-08-28 : à huit
minutes, les dégâts par seconde vont de **8 à 42** selon l'équipement, un
rapport de un à cinq. Une vie fixe donnerait dix secondes de combat à l'un et
cinquante à l'autre. Le moteur regarde donc les dégâts des soixante dernières
secondes et vise un combat de trente secondes, entre 220 et 1700 points de vie.

⚠️ **Un boss ne recule pas.** Ni sous les coups, ni sous l'onde de montée de
niveau, ni sous le choc anti-enchaînement. Mesure avant correction : frappée par
trois armes, la reine était repoussée de **879 unités en vingt secondes** —
autant que ce qu'elle parcourait. Elle n'arrivait jamais, et son bond était
annulé au moment même où il partait. Quand elle touche le chevalier, c'est **lui**
qui est projeté en arrière : le choc doit bien écarter quelqu'un, sinon on
ressort de l'invincibilité dans le même tas.

Mesuré après : le combat dure **20 s** avec l'équipement de répétition.

⚠️ **La toile colle mais n'immobilise jamais pour rien** : pousser le manche
l'use trois fois et demie plus vite que le temps. L'enfant se débat et s'en
sort, au lieu de regarder sa mort arriver. Et une barre de vie remplace le
chronomètre : sans elle, on tape trente secondes sans savoir si on avance, et
un boss devient un mur.

⚠️ Les outils de mesure ont dû être corrigés en même temps : ils coupaient la
partie à huit minutes pile, donc ils tuaient le combat en cours et comptaient
une défaite à chaque fois.

**Répéter le combat.** Un bouton du menu, « Affronter la reine », donne un
équipement de fin de partie et fait venir la reine tout de suite — attendre
huit minutes pour essayer un boss n'est pas une façon de le régler.

⚠️ Il passe une force explicite de 20 dégâts par seconde, la mesure du joueur
« normal » à huit minutes. Sans elle, le moteur lirait les dégâts de la dernière
minute — qui n'existe pas — et donnerait à la reine sa vie minimale, donc un
combat de dix secondes qui ne prouverait rien. Et cette partie **ne compte pas**
dans les souvenirs : on y arrive avec un équipement qu'on n'a pas gagné.

### Le lucane, le demi-boss

Un gros **lucane** bleu, à deux minutes et demie. Il n'est pas fait pour
surprendre, il est fait pour se **voir** : deux fois et demie plus large que
tout le reste.

⚠️ Avant, c'était un bloc de pierre sans espèce, et elle a demandé « c'est quel
insecte ? » — la meilleure preuve qu'un demi-boss qui ne ressemble à rien de
vivant n'appartient pas à la prairie.
Il avance à 30 quand le chevalier court à 150, donc on peut l'ignorer et
s'occuper des autres — à 8 ans on ne gère pas deux urgences à la fois.

Ses 90 points de vie ne sont pas devinés. Les dégâts réels du chevalier ont été
mesurés arme par arme et niveau par niveau (de 1,4 à 15 points par seconde) :
90 points, c'est de quinze à vingt-cinq secondes d'acharnement au milieu d'une
partie. Il tombe en **douze graines** éparpillées plutôt qu'en une seule, parce
qu'une seule graine de quarante ne se voit pas.

Ce sont ses **pinces** qui portent la menace : elles s'écartent une seconde
avant qu'il frappe, comme le hérisson se met en boule. Le coup part ensuite en
six éclats lents, et on peut passer entre eux.

### Deux personnages

Avant la roue, l'enfant choisit : **Chevalier** ou **Magicien**. Le choix se
garde d'une fois sur l'autre. La roue tire ensuite parmi les armes de **ce**
personnage — un magicien ne commence jamais avec une épée.

| Chevalier | Magicien | Ce qui change vraiment |
|---|---|---|
| ⚔️ Épée | 🔥 Souffle | l'épée balaie **large et court** (2,7 rad, 96) ; le souffle **long et fin** (1,0 rad, 132) et il brûle tant qu'il dure au lieu de toucher une fois |
| 🛡️ Bouclier | ❄️ Boule givrée | même force, mais la boule **reprend son souffle** plus longtemps entre deux coups (0,55 s contre 0,35). Ce délai paie le **gel** : une bestiole gelée ne pense plus, donc elle ne prépare plus sa charge |
| 🏹 Arc | ⛰️ Piques de terre | l'arc empile ses flèches sur la même bestiole ; les piques sortent **du sol sous des bestioles différentes**, après un préavis où la terre tremble |

⚠️ Les chiffres ne sont pas devinés. `tools/chevalier-sorts.mjs` mesure les
dégâts par seconde de chaque paire, à trois niveaux et à deux distances, et
refuse un écart de plus de 40 %. Il vérifie aussi que le souffle **échange**
vraiment sa portée contre sa largeur, au lieu de gagner sur les deux tableaux.

Mesuré en parties entières : médiane 410 s pour le chevalier, 364 s pour le
magicien. Le magicien est un peu plus dur — il faut rester tourné vers ce qu'on
brûle.

Le seul geste que le moteur a dû apprendre est `partie.geler(bestiole, durée)`,
exactement comme il savait déjà `partie.blesser`.

### Ce qui reste après le coup

Un sort qui ne fait que des dégâts à l'instant du contact n'a pas d'identité ;
ce qui **dure**, si.

| | Ce qui reste |
|---|---|
| 🔥 Le souffle | la bestiole **brûle** : 1 point de vie par seconde pendant 3 s, même sortie du cône. C'est ce qui achève les grosses |
| ❄️ La boule givrée | elle gèle, puis laisse un **engourdissement** de 3 s à 45 % de vitesse. Sans lui, la bestiole repartait à pleine vitesse dès le dégel et le sort n'avait servi qu'une seconde |

### La limace, le contre-poids

⚠️ Sa demande : « à un certain niveau de puissance on roule sur le jeu, il faut
contrebalancer ça ». Tout le reste du jeu se résout en tapant plus fort. La
limace, non : elle vise le **sol** devant le chevalier, et ce qu'elle laisse
s'évite au lieu de se tuer.

Deux crachats, que l'enfant doit distinguer d'un coup d'œil :

| | Couleur | Ce que ça fait |
|---|---|---|
| la glaire | **bleue**, ridée, qui brille | on avance à moitié vitesse tant qu'on patauge |
| l'acide | violette, qui bouillonne | **une arme perd un niveau**, une seule fois, puis la flaque disparaît. Pendant les 90 s de repos, elle freine comme la glaire et **reste au sol** |

⚠️ Les deux mettent **0,7 s à s'étaler**, et pendant ce temps elles ne touchent
personne. Sans ce délai, le crachat visant 90 unités devant le chevalier était
consommé à la seconde où il touchait le sol : jamais évitable, jamais vu.

⚠️ Et elles sont dessinées **écrasées, cerclées et brillantes**. Tracées en
ronds verts qui se chevauchent, elles étaient la copie exacte d'un buisson —
même construction, même vert — et passaient pour du décor.

⚠️ Elle n'attend pas l'**heure**, elle attend la **puissance** : niveau 6, et
jamais avant deux minutes. Un enfant qui peine ne la rencontre jamais, et c'est
exactement le but. Mesure : elle apparaît dans 83 % des parties simulées.

⚠️ Et l'acide a un **repos de 90 secondes**. Sans lui, la mesure donnait 6,3
armes rétrogradées par partie : une taxe, pas un événement, et l'enfant ne
verrait que sa puissance fondre. Avec, c'est 1,2 par partie.

Le rétrogradage se **voit**, trois signaux en même temps : la pastille de l'arme
touchée clignote en rouge, une flèche vers le bas en monte, et une bannière dit
laquelle et à quel niveau elle tombe. Jamais en dessous du niveau 1, et jamais
une arme retirée : un enfant qui perd son arme d'un coup n'a plus rien pour se
défendre et ne comprend pas pourquoi.

### Le piment

Un piment ramassé au sol allume le chevalier pendant dix secondes. Il ne frappe
pas : il laisse une **traînée de feu derrière lui**, et ce sont les bestioles
qui viennent dedans (six points par seconde). Rien ne se pose s'il reste
immobile, sinon le piment deviendrait un bouclier fixe.

Chaque flammée vit trois secondes et demie, donc la traînée **survit au piment**
et s'éteint par son bout le plus ancien : on voit sa propre route s'éteindre
derrière soi.

### Ce que le jeu retient

`souvenirs.js` garde une seule mesure, invisible : la durée des douze dernières
parties. Rien ne sort du téléphone.

Elle règle la partie suivante, **dans les deux sens** :

| Médiane des parties | Réglage | Ce qui change |
|---|---|---|
| moins de 2 min | +2 | 6 bestioles de moins, objets 8 s plus tôt, grosses bêtes à 64 % de vie |
| moins de 4 min | +1 | 3 de moins, objets 4 s plus tôt, 82 % de vie |
| 4 à 5 min 40 | 0 | le jeu normal |
| plus de 5 min 40 | −1 | 3 de plus, objets 4 s plus tard, 118 % de vie |
| plus de 7 min 10 | −2 | 6 de plus, objets 8 s plus tard, 136 % de vie |

⚠️ Elle ne savait qu'**adoucir** jusqu'au 2026-08-28. Une métrique à sens unique
laisse le jeu devenir facile et ennuyeux dès qu'on progresse, et c'est
exactement ce qui est arrivé.

⚠️ Et une mesure surprenante : sur 75 parties simulées par palier, l'effet sur la
survie **n'est pas monotone**. Moins de bestioles, c'est aussi moins de graines,
donc moins d'expérience et des armes plus faibles. Adoucir le jeu affaiblit le
chevalier. Le mécanisme est prouvé (foule, vie, rythme des objets), son effet
net sur la durée ne l'est pas — à juger sur un enfant, pas sur un joueur simulé.

Enfin, l'écart entre deux fruits vise **60 % de la durée médiane** : un fruit qui
arrive à la septième minute quand on meurt à la troisième n'existe pas.

### Les contrôles

| Script de `tools/` | Ce qu'il contrôle |
|---|---|
| `chevalier-moteur.mjs` | les règles, **sans navigateur** : l'invincibilité, les cinq cœurs, les graines, l'aimant, les objets au sol, l'onde de la montée de niveau, le préavis du hérisson, le plafond de trois individus, les trois cartes sans doublon |
| `chevalier-difficulte.mjs` | fait **jouer dix-huit parties entières** par un joueur simulé qui fuit et ramasse, une série par arme de départ, et garde un plancher de survie |
| `chevalier-mort.mjs` | cherche le **code mort** : un réglage que personne ne lit, une fonction que personne n'appelle |
| `chevalier-tableaux.mjs` | réécrit les tableaux d'armes de ce README **depuis le code**, pour qu'ils ne puissent ni mentir ni vieillir |
| `chevalier-foule.mjs` | ce que coûte la foule, moteur seul, à 60, 150 et **300 bestioles** |
| `chevalier-parcours.mjs` | le parcours complet en Chromium, profil **Pixel 9** : jouer, se déplacer, tuer, monter de niveau avec le jeu **arrêté**, mourir |
| `chevalier-pwa.mjs` | la page s'ouvre, le service worker prend le contrôle, et **le jeu se relance hors ligne** |
| `chevalier-enligne.mjs` | ce que **GitHub Pages sert vraiment**, dont le hors ligne |
| `chevalier-icones.mjs` | refabrique les deux icônes depuis `serpentin/icone.html` |
| `serveur.mjs` | le serveur local partagé, parce qu'un service worker refuse `file://` |

Ce que chacun coûte, pour savoir lequel relancer et lequel réserver aux
réglages : moteur 1 s, code mort et tableaux instantanés, foule 4 s, PWA 4 s,
parcours 28 s, **difficulté 43 s**. Le dernier joue quinze parties entières,
c'est de loin le plus cher, et il tourne à 30 pas par seconde plutôt que 60
pour cette raison.

### Ce que ça coûte

Moteur seul, mesuré : **0,27 ms par image à 60 bestioles**, **1,77 ms à 300**,
pour un budget de 16,7 ms à 60 images par seconde. Le jeu en affiche 60.
