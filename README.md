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

Ne bouge pas : taille 15, repos (s) 0.35.

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

Le mode d'essai (`ESSAI` en tête de
[`serpentin/bestioles.js`](serpentin/bestioles.js), qui fait arriver toutes les
bestioles dès la première seconde) est **remis à `false`** : le jeu suit à
nouveau ses vraies heures d'arrivée.

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
- les nuages promènent leur **ombre** sur l'herbe.

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
