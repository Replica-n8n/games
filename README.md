# Games

Des jeux à jouer sur le téléphone, un par dossier. Vanilla JS, aucune
dépendance, aucun outil de build. Chaque jeu est une PWA autonome qui
fonctionne hors ligne.

| Dossier | Jeu | Quoi |
|---|---|---|
| [`echecs/`](echecs/) | **Échecs et Dames** | Deux jeux dans une seule app. Joueur contre joueur sur un seul téléphone, règles complètes, pas d'adversaire artificiel, pas de chrono. |
| [`serpentin/`](serpentin/) | **Le chevalier** | Un « survivants » pour enfants : les armes frappent toutes seules, on ne contrôle que le déplacement. ⚠️ en construction. |
| [`paper-race/`](paper-race/) | **Paper Race** | Course vectorielle sur papier quadrillé, d'après *Racetrack* (Gardner, 1973). Un championnat de 7 circuits, du plus facile au plus dur, dont Monza, Montréal, Monaco et Spa adaptés au quadrillage. À deux sur un téléphone. |

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
- le circuit : <https://replica-n8n.github.io/games/paper-race/>

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

Un « survivants » pour enfants. On joue un chevalier, **on ne
contrôle que le déplacement**, les armes frappent toutes seules. Les bestioles
arrivent par vagues, on ramasse leurs graines, on monte de niveau et on choisit
entre trois cartes. Huit minutes.

### Trois mondes, tirés au sort

Chaque partie se joue dans **la prairie, l'île ou le volcan**, tiré au hasard.

| Monde | Le sol | Les obstacles |
|---|---|---|
| **La prairie** | herbe partout, la haie n'est qu'un anneau | buissons qu'on **traverse** en ralentissant |
| **L'île** | sable découpé au rivage, **la mer autour** | cocotiers, seul le pied du tronc **bloque** |
| **Le volcan** | roche découpée au cratère, **la lave autour** | gros rochers en trois familles, ils **bloquent** |

⚠️ **Le monde se choisit en Normal, et se tire au sort en Difficile.** Trois
pastilles sur l'écran de départ, une par monde, peintes à ses couleurs — le sol
au centre, la mer ou la lave en couronne — pour qu'on reconnaisse l'île avant de
lire son nom. Le choix est retenu d'une partie à l'autre, comme le personnage.
En Difficile les pastilles s'effacent et une ligne dit « Monde tiré au hasard » :
une rangée qui disparaît sans rien dire, l'enfant la cherche.

⚠️ **Tout passe sous les cocotiers, pas seulement le chevalier.** « Seul le perso
passait en dessous les palmiers, pas les bonus, ni les mobs. » Deux causes :
les graines et les objets n'étaient tout simplement pas regardés par le
deuxième passage ; et les bestioles l'étaient, mais seul `ctx.voile` était posé.
`chevalier()` écrit `globalAlpha` à sa première ligne et prenait donc bien le
voile ; un escargot qui ne touche jamais à `globalAlpha` se dessinait à
l'opacité *courante* — 1 — et se repeignait plein par-dessus le tronc qu'on
venait de redessiner. **Il faut les deux**, exactement comme `couche()` pour la
météo.

⚠️ **Rien de ce qu'on ramasse ne tombe dans un tronc.** Sur l'île et au volcan
les obstacles sont solides, et un objet tiré au hasard au pied d'un tronc
restait hors d'atteinte. Mesuré avant : **5 objets et graines sur 225**
mordaient sur un tronc ; après : aucun. Ils sont repoussés hors de l'obstacle ;
les troncs étant espacés d'au moins le diamètre du chevalier plus douze, ça ne
peut pas les coincer entre deux.

⚠️ **Les nuages ne clignotent plus au-dessus de la mer.** Le renvoi posait un
nuage sorti au point *opposé* — mais l'opposé d'un point hors de l'arène est hors
de l'arène : il repartait aussitôt, une image sur deux, pour toujours. Il ne
pouvait arriver là qu'en *naissant* dehors, tiré à 700 autour d'un chevalier qui
joue près du bord, c'est-à-dire tout le temps sur l'île. Mesuré avant, au bord :
**23 nuages sur 72 clignotaient, dont un 7 200 fois en deux minutes** ; après :
aucun. ⚠️ Le premier banc écrit pour chercher ce bug mettait le chevalier au
**centre** de l'arène — le seul endroit où il ne peut pas arriver — et répondait
« aucun nuage ne clignote ».

⚠️ **On passe DERRIÈRE les cocotiers et les rochers**, jamais dessus, et ce
qui est caché se redessine en transparence par-dessus — sinon on disparaît
jusqu'à neuf secondes d'affilée, mesuré. Ça vaut aussi pour les bestioles :
une menace invisible casserait la règle du préavis.

⚠️ **Toute écriture de `globalAlpha` se multiplie par `ctx.voile`.** C'est la
seule règle à retenir en dessinant, et elle a coûté cher : le fantôme posait
bien son 55 %, mais `chevalier()` finissait par `globalAlpha = 1` et
l'effaçait, si bien qu'on repassait opaque **par-dessus** le tronc. Le bug
qu'on croyait corrigé, en pire, puisqu'on payait un dessin de plus pour rien.

⚠️ **Le sol du volcan a été dessiné deux fois.** Le premier était un réseau de
fentes **claires** sur du presque noir : « on dirait une toile d'araignée » —
et c'est exactement le dessin des toiles de la reine. Ce qui sépare une roche
d'une toile n'est pas le motif mais le **sens du contraste** : une toile est un
fil clair sur du vide, une roche est une **dalle claire** que sa voisine borde
d'un joint sombre. On dessine donc les dalles, jamais les fentes.

La mer et la lave sont **décoratives** : c'est la bordure de l'arène qui
arrête, comme dans la prairie.

Deux capacités génériques rendent ces mondes possibles, et chaque monde décide
s'il s'en sert, pour qu'ajouter un monde ne coûte toujours qu'un objet dans
`mondes.js` :

- `solBorne` découpe le sol au rayon de l'arène, et `fond` devient le dehors.
  Sans lui il n'y a ni dedans ni dehors : `fond` et `sol` ne sont que les deux
  cases d'un damier peint partout.
- `obstaclesSolides` repousse le joueur au lieu de le ralentir. Il **ralentit
  aussi**, comme un buisson : sans ce frein, rendre un obstacle solide
  supprimait un coût et le volcan passait à 9 victoires sur 20.

⚠️ Les obstacles solides ne se chevauchent pas, et c'est une contrainte du
semis, pas du dessin. Repoussé hors d'un rocher, le chevalier atterrissait
dans le suivant qui le renvoyait dans le premier : coincé, mangé sur place,
une partie tombée à 25 secondes. Ils gardent maintenant au moins le diamètre
du chevalier d'écart, sinon ils formeraient un mur.

⚠️ Les bestioles, elles, ne sont pas bloquées : elles gardent leur évitement.
Le chevalier est donc arrêté par un rocher qu'un escargot longe.

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

### Une carte par niveau, toujours

Chaque montée de niveau arrête le jeu et demande de **choisir**. Aucune
amélioration n'est jamais appliquée en silence.

⚠️ **Ça ne l'a pas été pendant deux jours, et c'était une erreur de conception,
pas un accident.** J'avais mesuré qu'un tiers des montées arrivent à moins de
deux secondes de la précédente, et j'en avais conclu tout seul qu'il fallait
n'en demander qu'une et **offrir** les autres au hasard. Personne n'avait
demandé ça. En jeu : « à chaque niveau 3 et 4 j'ai une barre verte qui me dit
que j'ai gagné une amélioration alors que ce n'est pas celle que j'ai choisi ».
Elle cliquait sur *Arc*, et dans la même poignée de millisecondes une bannière
annonçait *Heaume*. Rien ne confirmait jamais son choix ; le seul retour qu'elle
recevait nommait autre chose.

Et ça tombait au pire endroit. Les trois premiers niveaux coûtent 6, 8 et 10
points ; les deux ou trois premières bestioles en laissent une vingtaine par
terre, ramassés en un seul passage. Les niveaux 2, 3 et 4 naissent donc souvent
**dans la même image** — ce ne sont pas des cas rares, ce sont les améliorations
qui décident de toute la partie, et c'étaient justement celles qu'on lui prenait.

Une grappe de trois niveaux montre donc trois écrans, séparés d'un quart de
seconde, et **l'écran dit où il en est** : « Choisis · 1 sur 3 ». Trois cartes
d'affilée sans explication ressemblent à un bug ; avec le compte, elles
ressemblent à un cadeau.

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

#### Chausse-trappe 🪤

Tu en sèmes derrière toi en marchant.

| Niveau | dégâts | ecart | taille | usages |
|---|---|---|---|---|
| 1 | 2.5 | 145 | 21 | 1 |
| 2 | 3.7 | 134 | 22.5 | 1.6 |
| 3 | 4.9 | 123 | 24 | 2.2 |
| 4 | 6.1 | 112 | 25.5 | 2.8 |
| 5 | 7.3 | 101 | 27 | 3.4 |
| 6 | 8.5 | 90 | 28.5 | 4 |

Ne bouge pas : durée (s) 7.

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

#### ⚠️ Le bouton « Installer » sait s'effacer, et revenir

Il disparaît une fois le jeu installé, et il **revient** si on le désinstalle.

**On ne retient rien.** Écrire « installé » dans `localStorage` aurait survécu
à la désinstallation : le bouton aurait disparu *pour toujours*, sans qu'aucune
manipulation ne le ramène. On redemande au navigateur **à chaque ouverture du
menu**, ce qui coûte une promesse et ne peut pas se tromper longtemps.

Trois signaux, du plus sûr au moins sûr :

1. **On tourne déjà dans l'application** (`display-mode: standalone`, ou
   `navigator.standalone` sur iOS). Proposer d'installer ce qui est ouvert n'a
   aucun sens.
2. **`getInstalledRelatedApps()`** — le seul qui réponde alors qu'on est dans un
   *onglet*. Il faut pour ça que le manifeste se déclare lui-même dans
   `related_applications`, avec son adresse absolue : sans cette déclaration la
   liste revient toujours vide et on ne détecte rien. Chromium seulement.
3. **`beforeinstallprompt`** : le recevoir *prouve* qu'on n'est pas installé, et
   Chrome le réémet après une désinstallation — c'est lui qui fait revenir le
   bouton. Son *absence*, elle, ne prouve rien : iOS n'en émet jamais, d'où
   l'astuce écrite en toutes lettres.

⚠️ **Ce qu'on a vu de nos yeux gagne sur ce qu'on redemande.** `appinstalled`
est un fait ; `getInstalledRelatedApps()` peut rendre une liste vide alors que
l'installation vient d'avoir lieu — c'est le cas dès qu'on n'est pas servi
depuis l'adresse du manifeste, donc de tous les contrôles locaux. Sans cette
priorité, le bouton se recachait puis réapparaissait à l'ouverture suivante du
menu, mesuré.

⚠️ **Dans le doute, on montre le bouton.** Un bouton en trop se ferme ; un
bouton manquant est une fonction qui n'existe pas pour le joueur.

### ⚠️ Le ciel se fond, il ne bascule pas

Des joueurs l'ont dit : passer du jour à la nuit en une seconde, ce n'est pas un
changement de temps, c'est un interrupteur. Le moteur garde donc **d'où l'on
vient** et un `fondu` de 0 à 1, et le dessin repasse chaque couche **deux
fois** — l'ancien ciel à `1 − fondu`, le nouveau à `fondu`. Le jour ne saute pas
à la nuit : il se couche. Pluie → neige donne brièvement les deux, ce qui
ressemble à du grésil.

**Aucun temps de `meteo.js` ne sait qu'une transition existe.** Ce qui rend ça
possible tient en une ligne : `ctx.voile`, posé le même jour pour les fantômes
derrière les cocotiers. Trois dessins de `meteo.js` écrivaient `globalAlpha` en
dur — la plaque de glace, l'éclair, les lucioles — et écrasaient sans lui
l'opacité du fondu.

**Ce qui se mesure monte avec l'image.** Le froid de la neige, la résistance de
la nuit, la fonte au soleil : tout est interpolé avec la même courbe. Sinon la
neige ralentirait tout le monde d'un coup pendant que le ciel est encore
clair — le jeu dirait une chose et l'image une autre, ce qui est exactement le
défaut qu'on corrige.

**Ce qui est discret attend la moitié du fondu** : une plaque de glace ne se
*pose* pas, un éclair ne s'arme pas, les ombres de nuages ne changent pas de
forme tant que le ciel est majoritairement l'ancien. Une plaque est là ou elle
n'est pas, ça ne se mélange pas. La *fonte*, elle, est continue et se mélange —
l'oublier a fait dire à un essai « en 2 s de soleil la glace n'a presque pas
fondu ».

⚠️ **Le fondu ne mange jamais plus du quart du temps qu'il amène.** Six
secondes fixes, c'était mesurable et c'était trop : les durées se tirent au
carré, donc elles s'entassent près de leur minimum, et une averse de douze
secondes passait la moitié de sa vie à monter en puissance. Mesuré : la médiane
de survie montait de 452 s à 514 s et **neuf** parties sur vingt étaient
gagnées, pour un plafond de huit. Une nuit de deux minutes garde ses six
secondes de crépuscule, une averse d'un quart de minute arrive en trois. Coût
résiduel assumé : la médiane reste à 501 s au lieu de 452, parce qu'un mauvais
temps qui arrive progressivement frappe forcément un peu moins.

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

**Répéter le combat.** Une rangée du menu, « Mode boss », donne un équipement
de fin de partie et fait venir un boss tout de suite — attendre huit minutes
pour essayer un boss n'est pas une façon de le régler.

⚠️ **Un bouton par boss, et il change de monde.** Il n'y en avait qu'un,
« Affronter la reine », et il invoquait le boss du monde *en cours* : pour voir
le crabe il fallait tomber sur l'île au tirage, et pour le dragon sur le
volcan. Les deux nouveaux boss étaient donc en pratique inatteignables — c'est
exactement ce que ce bouton existe pour éviter. La rangée se remplit depuis
`Mondes.tous` et le nom vient de la **bestiole** : ajouter un monde avec un
boss ajoute son bouton tout seul.

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

### Le chat géant 🐾

Trois pattes à allumer pendant la partie, puis un gros bouton patte qui bat en
bas à droite. On le touche : le jeu s'arrête, l'écran s'assombrit, un chat
géant surgit du bas de l'écran et **balaie tout d'un coup de patte**. Toutes
les bestioles meurent, toutes les graines de la carte volent vers le héros, et
la prairie **respire huit secondes** sans rien voir naître. **Une seule fois par
partie.** Rien ne se garde d'une partie à l'autre : c'est un jeu d'arcade.

| Patte | Condition | Normal | Difficile |
|---|---|---|---|
| ⚔️ Chasseur | tuer des bestioles | 300 | 80 |
| 🛡️ Intouchable | tenir sans coup, **sous la pression** | 30 s | 30 s |
| 🐱 Le chaton perdu | le retrouver sur la carte | apparaît à 3 min 30 | à 1 min 45 |

⚠️ **Toutes les conditions sont possibles dans toutes les parties.** Le lucane
n'apparaît qu'une partie sur deux, un orage peut ne jamais venir : une patte
qui dépend de la chance est perdue d'avance sans que l'enfant y soit pour rien.

⚠️ **Les chiffres sont mesurés.** Le Difficile a ses propres objectifs parce que
le joueur médian y **meurt vers 5 min** : un seul chiffre aurait rendu une
patte gratuite dans un mode ou impossible dans l'autre. Le joueur simulé invoque
le chat vers **4 min en Normal et 3 min en Difficile**.

⚠️ **30 s et non 45, et c'est elle qui l'a mesuré, pas le banc.** Le joueur
simulé tenait 45 s sous pression en une minute : il esquive très bien. Elle,
adulte, a été touchée quatre ou cinq fois et n'a eu le chat qu'à la fin. Sur ce
qui demande de l'adresse, le banc est trop fort pour représenter un enfant.

⚠️ **Trois coups de griffe, pas un.** « Un seul n'est pas impressionnant. »
Gauche, droite, puis le grand coup : chacun laisse trois entailles en fuseau
qui se croisent avec celles du coup d'avant, avec un flash et l'écran qui
tremble. Les bestioles ne meurent qu'au **troisième**, dans un nuage de fumée :
si tout mourait au premier, les deux suivants taperaient dans le vide.

⚠️ **La jauge « intouchable » ne monte que s'il y a au moins cinq bestioles à
moins de 300.** Sans cette règle, la première mesure la donnait à 45 s *pile*
dans vingt parties sur vingt : le début de partie est vide, la patte était
offerte. Elle retombe à zéro au moindre coup.

⚠️ **Le boss perd un quart de sa vie, jamais le dernier point.** Un chat qui le
tuerait d'un coup referait le « je l'ai tué sans rien faire » de la boule
givrée.

⚠️ **Le calme dure huit secondes, et la mesure l'a imposé.** À quatre secondes,
sur soixante parties, le joueur simulé qui invoquait le chat survivait **moins**
que celui qui ne l'invoquait jamais (407 s contre 479). L'ablation a trouvé la
cause : le **rappel des graines** fait tomber trois ou quatre niveaux d'un coup,
et la foule revenait pendant qu'on les encaissait. À huit secondes : 475 s et
autant de victoires qu'**sans** chat. Le chat ne rend pas la partie plus facile,
et surtout, il ne la rend pas plus dure.

Le chaton miaule en apparaissant, et une **flèche** au bord de l'écran le
désigne tant qu'on ne le voit pas : il naît entre 520 et 760 unités du héros,
presque toujours hors de l'écran, et jamais dans un tronc.

### Un boss par monde

À huit minutes, chaque monde invoque **le sien** — le moteur ne connaît aucun
des trois, il demande au monde.

| Monde | Boss | Son geste |
|---|---|---|
| la prairie | **La reine des toiles** | elle colle, et elle bondit |
| l'île | **Le roi crabe** | il abat sa pince, un anneau d'eau part de lui |
| le volcan | **Le dragon d'obsidienne** | il bondit, et la lave retombe partout |

⚠️ **La vague du crabe a une PORTE**, et c'est tout ce qu'il y a à lire. Elle
s'annonce une seconde avant : le même bleu profond que la vague, en pointillé,
sur tout le tour **sauf l'ouverture**, avec deux montants qui marquent ses
bords. La porte s'ouvre toujours à une coudée d'où l'on se tient — jamais sous
les pieds, jamais à l'opposé — donc il y a **toujours** une réponse, et elle
demande toujours de bouger.

⚠️ **Un boss ne se fige jamais, il ralentit.** Même règle que le recul, et
trouvée de la même façon — en jouant : « une fois dans le cercle il ne bougeait
plus, je l'ai tué sans rien faire, mais j'ai un doute : peut-être était-il
ralenti par la glace de mes boules gelées ? ». C'était exactement ça. La boule
givrée de niveau 4 gèle **1,65 s** et peut refrapper toutes les **0,26 s** —
six fois plus de gel que de repos — et `bouger` sort *avant* `penserPour`, donc
une bestiole gelée ne bouge pas **et ne pense plus**. Mesuré : le boss passait
**92 % du combat figé** et lançait **zéro** vague. Une arme qui supprime
purement et simplement le boss n'est pas une arme, c'est un interrupteur. Il
reste **engourdi** aussi longtemps qu'il aurait été gelé, avec sa marque de
givre pour que ça se voie — sur les bestioles ordinaires, rien ne change.

⚠️ **Et il n'y a plus d'abri.** « Le crabe, une fois dans son cercle, il ne
fait plus rien, est-ce normal ? » Non. Mesuré en tenant le chevalier à distance
fixe pendant quarante secondes : 5 coups à 60 (le contact), 4 à partir de 130
(les vagues), et **zéro entre 84 et 116**. Une couronne d'une trentaine d'unités
où le boss ne pouvait strictement rien faire — on s'y plante et on le tape
jusqu'à la fin. C'était un reste de la version d'avant, où l'abri *était* la
parade. La vague part maintenant du bord de sa carapace, elle sort de **sous
lui**, et il n'existe plus un seul endroit où il est inoffensif. Une seule règle
à apprendre au lieu de deux. Un essai promène le chevalier à toutes les
distances utiles et refuse qu'une seule soit gratuite.

⚠️ **Elle n'en avait pas, et c'était une taxe, pas une attaque.** J'avais
construit l'inverse : une vague rapide dont la seule parade était de *courir
vers* le crabe. Je trouvais ça élégant. Mesuré après qu'elle l'a jouée : un
chevalier qui **fuit** prenait **4,2 cœurs sur 5** rien qu'à la vague et perdait
5 fois sur 5. Fuir ne *pouvait* pas marcher — le crabe avance à 120 contre 150,
on ne lui gagne que 30 unités par seconde, donc la vague naissait toujours sur
nous. Avec la porte : **1,0 cœur, et 3 combats gagnés sur 5**.

⚠️ **La lave du dragon reste au sol.** Chaque rocher a sa marque pendant une
seconde avant de tomber — le préavis vaut pour *chacun*, pas pour la salve —
puis il brûle douze secondes. L'arène rétrécit à chaque saut. Aucun autre boss
ne prend du terrain : les deux autres frappent.

⚠️ **Les rochers BRÛLENT une fois tombés**, ils ne rougeoient plus. Avant :
deux disques oranges qui battaient sur place — ça disait « chaud », pas
« feu ». Une chose qui brûle douze secondes au milieu de l'arène doit se lire
comme un danger vivant. Quatre langues qui montent, chacune à son rythme, un
cœur clair plus court que le corps orange, une lueur au sol et deux braises qui
s'élèvent. Les phases viennent de la position du rocher, jamais d'un tirage :
deux feux voisins ne battent pas ensemble, et le même feu garde son rythme d'une
image à l'autre — sinon il grelotte au lieu de brûler. **Coût mesuré : 1,31 ms
de dessin sans, 1,78 ms avec trente feux à l'écran**, pour un budget de 16,7.

⚠️ **Le dragon ne bougeait pas un cil.** « Dès qu'on le colle pour l'attaquer il
reste sur place et ne bouge plus, est-ce normal ? » Pour le moteur, oui :
mesuré, collé ou fui il parcourt les mêmes **2 677 unités en quarante secondes**
et lance les mêmes **sept salves**. Pour l'œil, non : *rien* sur lui ne bougeait
— mêmes ailes, même queue, même corps à chaque image. À 44 d'allure contre 150
au chevalier, ça ne se lit pas comme un dragon qui avance, ça se lit comme une
image collée au sol. Il respire donc, sa queue fouette, ses ailes battent et sa
braise s'avive avec son souffle.

⚠️ **Le dragon sautait sans quitter le sol.** Le moteur le faisait bien filer à
six fois sa vitesse pendant six dixièmes de seconde, mais rien ne le montrait :
même taille, même ombre, même position — une téléportation rapide, pas un bond.
Trois choses le disent : il **monte** et **grossit** (il se rapproche), son
**ombre reste au sol** et rétrécit (c'est elle qui prouve qu'il est en l'air, le
décalage seul ne prouve rien), et il **s'écrase** — une onde qui part de son
point de chute et un écrasement du corps. C'est le même vocabulaire que ses
météores, et c'est voulu : ce qui tombe du ciel dans ce monde a une ombre, une
chute et un impact.

⚠️ **La hauteur du bond se calcule dans `penser`, pas dans `dessiner`.** L'un
tourne sur l'horloge du jeu, qui s'arrête quand le jeu est gelé, l'autre sur
celle de l'affichage : calculer la même courbe des deux côtés, c'est garantir
qu'un jour elles ne diront plus la même chose.

⚠️ **On ne les voyait pas tomber.** « On voit juste un rond par terre. » Deux
causes, toutes deux dans le dessin : ils partaient de 75 unités du sol — sur une
seconde ça ne fait pas une chute, ça fait un point qui grossit — et ils étaient
bruns sur du basalte sombre, la même faute de contraste que la vague bleu pâle
sur le sable. Ce sont maintenant des **météores** : ils tombent de 300 en
**accélérant**, ils brûlent, un **fil** les relie à leur cible au sol (sinon on
ne sait pas quelle marque appartient à quel rocher quand il en tombe neuf), et
ils **s'écrasent** — éclair et couronne de débris. Mesuré : un chevalier qui
lit les marques passe de **3,6 cœurs à 0,6**, et de 0 à **3 combats gagnés sur
5**.

⚠️ **Dessins provisoires** pour le crabe et le dragon. Cinq maquettes ont été
refusées ; on a livré les mécaniques d'abord pour pouvoir les jouer, et les
dessins se reprendront le jeu sous les yeux.

### La salamandre

Une salamandre dort dans l'herbe. On la touche, elle se réveille et **court
toute seule** pendant dix secondes : elle fonce sur la bestiole la plus proche,
la traverse, en choisit une autre.

Elle ne mord pas — un allié qui frappe tout seul, le jeu en a déjà trois, le
Bouclier, la Boule givrée et l'Arc. Ce qui brûle, c'est sa **traînée de feu**,
et ce sont les bestioles qui viennent dedans (six points par seconde). Rien ne
peut la blessér : elle est en feu.

Chaque flammée vit trois secondes et demie, donc la traînée **lui survit** et
s'éteint par son bout le plus ancien : on voit sa route s'éteindre derrière
elle.

⚠️ Elle ne s'éloigne jamais de plus de 260 unités du chevalier, la moitié de
l'écran. Une aide qu'on ne voit pas n'existe pas.

⚠️ Elle remplace le **piment**, qui faisait semer le feu au chevalier lui-même
et récompensait donc sa course. C'est une entorse assumée à la règle « tout
objet sert le déplacement » : ce sont dix secondes de répit, et c'est le but.
Voir `docs/superpowers/specs/2026-08-31-salamandre-design.md`.

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
| `chevalier-labo.mjs` | le **Labo** du menu donne les armes et objets allumés au niveau max, sans limite de quatre ; ce qui est « à valider » est allumé d'office ; la carte du niveau max est dorée et annonce le pouvoir |
| `chevalier-pause.mjs` | le menu **arrête vraiment le jeu** et passe au dessus des cartes, de la roue et de la fin d'invocation ; l'explication du chat géant s'ouvre du départ et du menu |
| `chevalier-ecran.mjs` | un grand écran reste sous le **budget de pixels** et un téléphone garde toute sa finesse ; affiche les images par seconde des trois mondes sans les exiger |
| `chevalier-chat.mjs` | le chat géant dans le vrai navigateur : le bouton attend les trois pattes, le toucher arrête le jeu, l'écran se vide, les graines arrivent, et il ne sert qu'une fois |
| `chevalier-grappes.mjs` | qu'une grappe de niveaux montre **autant d'écrans que de niveaux**, que chaque écran dise « 1 sur 3 », et qu'au maximum rien ne s'ouvre ni ne reste en pause |
| `chevalier-parcours.mjs` | le parcours complet en Chromium, profil **Pixel 9** : jouer, se déplacer, tuer, monter de niveau avec le jeu **arrêté**, mourir |
| `chevalier-pwa.mjs` | la page s'ouvre, le service worker prend le contrôle, **le jeu se relance hors ligne**, et le bouton *Installer* s'efface une fois installé puis revient |
| `chevalier-enligne.mjs` | ce que **GitHub Pages sert vraiment**, dont le hors ligne |
| `chevalier-flashs.mjs` | compte les flashs image par image (orage, chat géant, boss, étoile) : jamais plus de 3 par seconde, règle WCAG 2.3.1 |
| `chevalier-icones.mjs` | refabrique les icônes des deux jeux (192, 512 et masquable) depuis `<jeu>/icone.html` |
| `coeurs.mjs` | distribue des parties indépendantes sur tous les cœurs de la machine |
| `serveur.mjs` | le serveur local partagé, parce qu'un service worker refuse `file://` |

### ⚠️ Pourquoi il ramait sur ordinateur, et plus sur téléphone

« Un PC d'aujourd'hui fait tourner des mondes ouverts en 3D, et un jeu 2D fait
ramer mon navigateur ? » La question était juste : ce n'était pas la machine,
c'était la façon de dessiner. Un jeu 3D prépare ses textures une fois et laisse
la carte graphique les recopier ; ce canvas repeignait **tout son écran depuis
zéro à chaque image**.

Mesuré sur un écran 1920×1080 en densité 2 (portable Retina, écran 4K à 200 %),
en retirant les couches une par une :

| | avant | après |
|---|---|---|
| prairie | 24-29 images/s | 56-61 |
| île | 23-24 | 43-47 |
| volcan | 18 | 50-56 |
| téléphone | 60 | 60, inchangé |

Deux causes, et aucune n'était celle qu'on croyait :

1. **Le nombre de pixels, pas le nombre de formes.** Le JavaScript du dessin
   prenait 1,4 ms en densité 1 comme en densité 2 ; mais la densité 2 peignait
   **8,3 millions de pixels** par image, huit fois un téléphone. D'où un
   **budget de 2,6 millions** : un grand écran est peint un peu moins fin et
   agrandi, le téléphone (1 million) ne change pas d'un pixel.
2. **Le décor fixe retracé à chaque image.** Retirer les rides du sable et les
   dalles du volcan rendait 60 images/s. Leur JavaScript était minuscule, leur
   *peinture* non : des centaines de formes semi-transparentes sous la découpe
   ronde de l'arène, pour un sol qui ne bouge pas. Un monde range ce décor dans
   `dessinerSol` (qui ne reçoit pas le temps), le jeu le peint **une fois par
   tuile de 512 unités**, bord de l'arène compris, puis recopie les tuiles. Ce
   qui s'anime (l'herbe, les braises) reste dans `dessinerDedans`. Les cocotiers
   de l'île (`obstaclesEnImages`) sont peints une fois chacun.

⚠️ **Deux fausses bonnes idées mesurées en chemin.** Mettre *tous* les
obstacles en image a fait tomber le volcan de 59 à 34 : les buissons et les
rochers ne coûtaient presque rien, et les cadres prévus pour un cocotier
coûtaient plus cher que de les dessiner. Et un plafond fixe de 40 images
gardées faisait **repeindre** à chaque image les buissons d'une prairie qui en
montre plus de quarante.

⚠️ **La caméra avance par pixels entiers**, et la densité est arrondie au
seizième : sinon deux tuiles voisines, posées à une position fractionnaire,
laissaient chacune un demi-pixel transparent, et la jointure se voyait comme un
fil clair dans le sol.

⚠️ **Mesurer avant/après dans la même minute.** La même version donnait 60 puis
38 images/s selon ce que faisait la machine au même moment. Les chiffres
ci-dessus alternent l'ancienne et la nouvelle version, deux fois chacune.

### ⚠️ Ce que la suite coûte, et pourquoi

**3 min 40 s en tout** (mesuré le 2026-09-03) : moteur 2 s, code mort, sorts et
tableaux instantanés, icônes 3 s, PWA 4 s, foule 5 s, **grappes 10 s**, revue
17 s, **difficulté 22 s**, **parcours 35 s**, **objets 54 s**, vues 68 s.

Elle en prenait **7 min 15** le matin même, et il a fallu répondre honnêtement à
« es-tu obligé de jouer des dizaines de vraies parties ? » avant de savoir quoi
accélérer.

**Non, presque rien ne joue en temps réel.** Les bancs sans navigateur font
tourner le moteur en boucle serrée : `chevalier-difficulte.mjs` simule vingt
parties de huit minutes — 160 minutes de jeu — en 22 secondes, soit **plus de
quatre cents fois le temps réel**. Les accélérer davantage n'aurait aucun
sens : ils sont limités par le processeur, pas par une horloge.

Ce qui a vraiment fait gagner du temps, dans l'ordre :

- **Les parties se jouent sur tous les cœurs** (`coeurs.mjs`). Elles sont
  indépendantes, et elles occupaient un seul cœur pendant que les sept autres
  regardaient. Objets 172 → 54 s, difficulté 53 → 22 s, **aux mêmes chiffres à
  la décimale près** — c'est ça qui prouve que le découpage ne change rien.
- **Les grappes s'injectent au lieu de se mériter.** `chevalier-grappes` tenait
  le manche une minute en espérant tomber sur des grappes ; il pose maintenant
  une graine qui vaut trois niveaux, exactement comme le tas laissé par les
  deux premières bestioles. 54 → 10 s, et déterministe au passage.
- **`jeu.accelerer(n)`** fait avancer le moteur de n pas par image dessinée. Le
  seul endroit de la suite où l'on *attend* du temps de jeu est la chasse au
  niveau de `chevalier-parcours` : 56 → 35 s.

⚠️ **Ce n'est pas une horloge accélérée, ce sont plus de pas par image.**
Accéléré, le pas est **fixe à 1/60 s** : sinon il vaudrait le temps réel de
l'image — qui s'allonge justement parce qu'on fait douze pas — et le banc
mesurerait un jeu plus grossier que celui qui tourne sur le téléphone.

⚠️ **`chevalier-foule.mjs` ne doit jamais s'en servir** : il mesure des
millisecondes par image, et douze pas dans une image donneraient douze fois le
vrai chiffre.

### Ce que ça coûte

Moteur seul, mesuré : **0,27 ms par image à 60 bestioles**, **1,77 ms à 300**,
pour un budget de 16,7 ms à 60 images par seconde. Le jeu en affiche 60.

---

## Paper Race

Course vectorielle sur papier quadrillé, d'après *Racetrack* (Martin Gardner,
*Scientific American*, janvier 1973). Deux enfants sur un même téléphone, ou un
enfant contre le fantôme. À partir de 8 ans.

Chaque coup, la voiture refait le même trajet qu'au coup d'avant, et on choisit
un des neuf points autour de l'arrivée : devant on accélère, derrière on freine,
sur le côté on tourne. Sortir de la piste n'élimine pas, on repart à l'arrêt.
Deux voitures ne se touchent jamais : prendre la corde oblige l'autre à passer
large. Chaque circuit affiche son **par**, le tour parfait calculé par un
solveur.

Arrivé le 2026-09-18 comme une preuve de concept (« Paper Race ») en un seul fichier construit
par un script. Ici il n'y a plus de construction : `index.html` charge trois
scripts classiques qui partagent leurs noms globaux.

| Fichier | Rôle |
|---|---|
| [`paper-race/moteur.js`](paper-race/moteur.js) | les règles, les circuits, l'ordinateur. Aucun DOM, se charge aussi dans Node |
| [`paper-race/sons.js`](paper-race/sons.js) | les sons, synthétisés par Web Audio : aucun fichier |
| [`paper-race/ui.js`](paper-race/ui.js) | le plateau, les écrans, annuler, la sauvegarde, le clavier, l'installation |

**Ce qui a changé en devenant une PWA** : service worker et manifeste,
polices hébergées (Bricolage Grotesque et Karla, 63 Ko), palette calculée à
partir du bleu du stylo et thème sombre (le plateau reste une feuille claire,
c'est un objet), **annuler le dernier coup** (en solo, le coup et la réponse du
fantôme), **la course survit** à un rechargement, un écran éteint ou une
application tuée, **jouable au clavier** (pavé numérique 1 à 9, flèches,
Entrée, Ctrl+Z), des vignettes dessinées pour reconnaître chaque circuit, et les
règles derrière le bouton « ? » au lieu d'un paragraphe sur l'accueil.

⚠️ **Le pavé est dans le repère de l'écran, pas de la voiture.** Son nom lu à
voix haute, lui, dépend de la vitesse : « vers le haut » accélère une voiture
qui monte et freine une voiture qui descend. La preuve de concept disait
toujours « Accélérer » pour la rangée du haut.

### Le championnat (v4)

Seul, on court un **championnat** rangé du plus facile au plus dur (sept
manches en v4, onze depuis la v11 : voir plus bas). Un
circuit s'ouvre dès qu'on a *fini* le précédent, gagné ou pas. Chaque circuit
garde ton meilleur tour et une **médaille** face au par : bronze pour avoir
fini, argent à 30 % du par, or à 10 %. À deux, on court librement sur ce qui
est ouvert. Aucune série, aucun rendez-vous : rien ne se perd si on ne vient pas.

⚠️ **En championnat, la course va jusqu'à TON arrivée.** Avant, elle s'arrêtait
au premier arrivé : si le fantôme passait la ligne d'abord, on ne finissait
jamais son tour, donc on n'aurait jamais ouvert le circuit suivant. Le fantôme
arrivé quitte la piste (il ne bloque plus) et s'efface.

**Les vrais circuits sont des TRACÉS** : une ligne centrale et une
demi-largeur, au lieu de rectangles. Le moteur n'a appris qu'à répondre
« ce point est-il sur la piste ? » ; la carte d'avancement, l'ordinateur et le
solveur du par suivent tels quels.

⚠️ **Un virage plus petit que la piste disparaît** : au prototype, on passait
tout droit à travers les chicanes de Monza, et Monza n'était plus qu'un ovale.
Chaque virage est donc exagéré. Et deux bouts de piste à moins de
`2 x demi + 2` cases ouvrent un raccourci (la Rascasse touchait la ligne droite
des stands) : `paper-race-circuits.js` le refuse.

**L'ordre est MESURÉ**, pas deviné : `paper-race-difficulte.js` compte les
freinages du tour parfait, plus trois fois les accidents d'un joueur correct.
⚠️ Une première mesure (les coups perdus par l'ordinateur « tranquille »)
classait La croix comme le plus facile : cet ordinateur est lent partout, elle
mesurait sa prudence. Mesuré, Monza est le plus simple des vrais circuits (11
freinages) mais le plus punitif ; Spa le plus dur (22).

**Un grand circuit se joue avec une caméra** qui suit la voiture, un peu devant
elle, à l'échelle d'un petit circuit, et une **mini-carte** du circuit entier.
Le décor d'un tracé se peint au trait en une seule toile, à 2 pixels par point
au plus : une toile par étape de dessin coûtait des dizaines de Mo.

### La course en ligne (v6)

Deux téléphones, chacun chez soi. On choisit « En ligne », puis un circuit :
une salle d'attente montre un **lien à envoyer** et un **QR code** à faire
scanner. L'autre touche le lien, les feux partent sur les deux téléphones, et
chacun joue à son tour. On ne tape jamais de code.

Un **relais** (`serveur-paper-race/`, un Cloudflare Worker) garde la liste des
coups et vérifie que chacun joue à son tour ; il ne connaît pas les règles.
Chaque téléphone rejoue les coups avec le même moteur : un coup n'est que le
numéro d'une des neuf cases du pavé. Ni compte, ni nom, ni discussion ; une
course s'efface après 24 h sans un coup.

Un rechargement, un écran éteint, une coupure réseau : on revient là où on en
était (« Reconnexion… »). Pas d'« Annuler » en ligne : l'autre a peut-être déjà
vu le coup. En fin de course, « Revanche » remet tout à zéro pour les deux.

⚠️ **C'est le seul endroit du jeu qui touche au réseau.** Seul, à deux sur un
téléphone et le championnat restent hors ligne.

⚠️ Au premier essai, un lien d'invitation n'était jamais lu : l'initialisation
de `ui.js` appelait une fonction de `ligne.js`, chargé APRÈS lui. Le démarrage
en ligne vit donc à la fin de `ligne.js`.

### Les pièges reviennent, et le fantôme a trois vrais niveaux (v7)

Un joueur a fini tous les circuits en or ; un autre ne voyait aucune différence
entre « normal » et « vite ». Mesuré : il y avait 1 à 4 coups d'écart sur 40 à
60, c'était vrai.

- **Les pièges** (huile : la vitesse ne change plus ; piste mouillée : on ne
  fait que freiner ; accélérateur : une case de plus) sont de retour, sur les
  petits circuits comme sur les vrais : pluie avant Eau Rouge, aspiration dans
  Kemmel, huile avant la Parabolique… Ils font partie du circuit, le par les
  compte.
- ⚠️ **Un piège se pose sur une ligne droite, avant un virage.** Posé DANS un
  virage, il est mortel : sur l'huile on ne tourne pas. Au premier essai, le
  fantôme prudent piétinait sans fin devant ces flaques.
- ⚠️ **À l'arrêt sur un piège, on repart doucement.** Avant, une voiture arrêtée
  sur l'huile ou le mouillé ne pouvait plus JAMAIS repartir (défaut d'origine).
- **Les niveaux du fantôme** : une limite de vitesse (tranquille 2 cases,
  normal 3, vite sans limite) et un fantôme normal parfois « distrait », qui
  prend alors son deuxième meilleur coup. `paper-race-niveaux.js` vérifie
  que chaque niveau reste à au moins 10 % du suivant, sur chaque circuit.
- **Les médailles sont plus dures** : or à 5 % du par, argent à 20 %. Elles
  repartent de zéro (les pars ont changé) ; les circuits déjà finis restent
  ouverts.

### Courses de 2 à 6 voitures (v8)

Entre deux fantômes identiques, celui qui jouait en premier gagnait 71 % des
duels. La conception, les mesures et ce qui a été refusé :
`docs/superpowers/specs/2026-09-19-paper-race-grille-design.md`.

- **Grand Prix** (Seul, puis Grand Prix) : le joueur contre 1 à 5 fantômes.
  **« À deux »** suit les mêmes règles. Le **championnat** ne change pas : ses
  pars, ses médailles et ses records restent ceux de la v7.
- **Les règles** : grille tirée au sort, ordre qui tourne à chaque tour de jeu
  (à trois voitures et plus ; à deux on alterne, voir v15), aspiration (+1 de
  vitesse à 2 cases derrière une voiture, dans le même sens), blocage par la
  première voiture rencontrée, et photo-finish quand plusieurs voitures passent
  la ligne dans le même tour de jeu. Mesuré : 13 à 21 % par place à six.
- ⚠️ **À plus de deux, seulement les grands circuits.** Les petits font 5 cases
  de large : la voiture à la corde du premier virage y gagne 50 à 60 % des
  courses à 4, quelle que soit la règle (grille serrée et deux tours essayés).
- **Six couleurs calculées** par `tools/paper-race-couleurs.mjs` (texte blanc
  lisible, distinctes pour les trois daltonismes), et un numéro sur chaque
  voiture dès trois.

### En ligne à six, pièges en option, revoir la course (v9)

- **En ligne, de 2 à 6 places** (relais `pr-2`). Le créateur choisit le nombre
  de places, le circuit et les pièges ; à deux, la course part quand l'autre
  arrive, comme avant ; à plus, il peut « Démarrer maintenant » et les places
  vides roulent en fantômes, calculés par SON téléphone. Pendant que les autres
  jouent, on prépare son coup : il part tout seul à son tour. Un joueur absent
  depuis une minute quand vient son tour est arrêté par le créateur ; sa voiture
  reste un obstacle. Les salles créées par la v8 se jouent encore à deux.
- **Les pièges en option** en Grand Prix, à deux et en ligne. Le championnat les
  garde toujours : ses pars et ses médailles sont calculés avec.
- **Revoir la course** : toutes les voitures avancent ensemble, coup par coup,
  à ½×, 1× ou 2× ; pause, coup précédent ou suivant, curseur, et la vitesse de
  ta voiture à chaque coup. Des joueurs voulaient voir où ils perdaient des coups.

### À deux on alterne, et le drapeau se voit (v15)

Deux retours d'elle, tous deux justes :

- ⚠️ **À deux, chacun devait jouer deux fois de suite.** Ce n'était pas une règle
  voulue : l'ordre qui tourne décale d'un cran la voiture qui commence à chaque
  tour de jeu, ce qui donne `0 1 | 1 0 | 0 1` à DEUX voitures seulement. À trois
  et plus, personne ne joue deux fois de suite. À deux, on alterne donc, et
  l'équité tient au tirage au sort de la grille : mesuré, 46 % / 54 % par joueur
  avec le tirage, contre 59 % / 40 % sans lui (le banc échoue alors).
- **Le banc d'équité mesure maintenant deux familles de circuits**, et dit la
  vérité sur chacune : sur les 4 circuits DESSINÉS, l'ordre qui tourne sert
  (pole 18 % contre 29 % avec l'ordre fixe, qui fait échouer le banc) ; sur les
  4 VRAIS tracés, plus ouverts, les deux ordres se valent. La règle est gardée
  pour les premiers.
- ⚠️ **Le drapeau de victoire ne se voyait pas** quand « Réduire les animations »
  est activé (iOS, Android) : il restait 60 ms à l'écran. C'est une image, pas
  une animation : il reste maintenant affiché 900 ms. Mesuré : 40 ms avant,
  900 ms après.
- ⚠️ Au passage, le contrôle « chaque icône du manifeste est dans le cache »,
  ajouté la veille, **échouait toujours** (il comparait `./icone.png` à
  `icone.png`) : je l'avais cru bon sans vérifier où il posait sa cible.

### L'audit, et ce qu'il a trouvé (v13, v14, relais pr-3)

- ⚠️ **Le relais faisait rater un coup à celui qui revient.** Il lisait l'état de
  la course AVANT d'accepter la connexion : un coup joué entre les deux n'était
  ni dans l'état envoyé, ni diffusé à ce téléphone, qui restait en retard pour
  toujours. Il accepte maintenant la connexion d'abord, et le client reprend le
  fil dès qu'un numéro de coup arrive en avance.
- ⚠️ **Toucher la carte ne choisissait plus de point sur un petit circuit**
  depuis la v12 (le suivi du doigt ne démarrait que là où la carte se déplace).
- `sonVictoire` ne servait à personne ; l'icône maskable du manifeste n'était
  pas dans le cache hors ligne.
- **Le dessin sort de `ui.js`** dans `rendu.js` (2086 lignes → 958 + 1141).
- **`tools/paper-race-ui.mjs`** : l'audit UI/UX mesuré (contraste réel de chaque
  texte, 44 px, 8 px entre cibles, focus en tabulant, encoche, animations
  réduites), clair et sombre, sur sept écrans. Prouvé en y injectant des défauts.
- ⚠️ **Les contrôles en ligne mentaient de deux façons** : ils comparaient les
  écrans en plein vol et attendaient des délais fixes. Contre le vrai relais,
  ils échouaient alors que tout marchait. Ils attendent maintenant que tout le
  monde soit à jour, et plus longtemps quand le relais est loin.

### Les vrais tracés (v11)

Un joueur a remarqué que notre « Spa » ressemblait au Red Bull Ring. Il avait
raison, et les trois autres « vrais » circuits ne ressemblaient pas plus aux
originaux : ils avaient été dessinés à la main.

- **Les quatre vrais tracés** (Spa, Monza, Monaco, Montréal) viennent de
  [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (licence MIT,
  © Tomislav Bacinger, copie dans `tools/donnees/circuits/`).
  `tools/paper-race-traces.js` les tourne (le départ doit monter), les met à
  l'échelle et les « gonfle » : deux bouts de piste trop proches se repoussent
  jusqu'à 7 cases, chaque point restant attaché à sa place réelle. Les épingles
  s'élargissent, la forme reste.
- **Les pièges** sont posés là où le solveur montre qu'ils pèsent sur le tour
  parfait, jamais dans un virage.
- **Les anciens circuits restent**, sous des noms inventés (Le canal, L'échelle,
  La baie, Le fer à cheval) : les records des joueurs y sont attachés.
- **Onze manches**, dans l'ordre mesuré par `paper-race-difficulte.js`. ⚠️ Un
  circuit déjà fini reste ouvert même si un circuit neuf s'intercale avant lui.
- **Un par sans pièges** pour chaque circuit : sans pièges (option hors
  championnat), le tour parfait n'est pas le même, et le par affiché suit.

### La carte qu'on déplace, l'aide en option (v12)

- **Faire glisser la carte au doigt** pendant son tour, sur un grand circuit :
  on voit le virage qui arrive, donc on sait s'il faut freiner. La carte revient
  sur sa voiture dès qu'on choisit son point. Un message le dit une fois, à la
  première course sur un grand circuit.
- **L'aide au prochain coup** (les points d'où l'on repartira) se coupe dans les
  réglages. Elle aide les enfants ; un joueur qui la trouve trop bavarde peut la
  cacher.

### Vérification

```
node tools/paper-race-moteur.js     # invariants du moteur, courses ordinateur contre ordinateur
node tools/paper-race-circuits.js   # topologie (dont raccourcis), par recalculés, l'ordinateur finit partout
node tools/paper-race-difficulte.js --controle  # l'ordre du championnat suit la difficulté mesurée
node tools/paper-race-niveaux.js     # les trois niveaux du fantôme restent nettement séparés
node tools/paper-race-reference.js --controle  # le championnat : 330 courses classiques identiques à la référence
node tools/paper-race-traces.js     # des vrais tracés aux tracés jouables (sans raccourci)
node tools/paper-race-equite.js      # à plusieurs, aucune place ne gagne trop (échoue avec --ordre fixe)
node tools/paper-race-couleurs.mjs --controle  # les six couleurs de voiture restent lisibles et distinctes
node tools/paper-race-grille.mjs     # à deux, Grand Prix à 6, reprise, anciennes sauvegardes, iPhone, revoir, pièges
node tools/paper-race-ligne-plusieurs.mjs  # en ligne à 3 + 1 fantôme, coup préparé, départ d un joueur, salle v8
node tools/paper-race-pwa.mjs       # parcours complet Pixel 9 et 360 x 640, clair et sombre, hors ligne
node tools/paper-race-ui.mjs        # l audit UI/UX mesuré : contraste réel, 44 px, 8 px, focus au clavier, encoche
node tools/paper-race-installer.mjs  # le bouton d installation fait quelque chose : iPhone, Instagram, Android
node tools/paper-race-relais.mjs     # le relais seul (wrangler dev en local, ou RELAIS=... pour la prod)
node tools/paper-race-ligne.mjs      # deux téléphones de bout en bout, avec le relais local
node tools/paper-race-enligne.mjs   # ce que GitHub Pages sert : cache installé = commit publié, hors ligne
```

Les deux premiers **échouaient en silence** dans la preuve de concept : ils
affichaient leurs résultats sans jamais rendre un code d'erreur. Ils le font
maintenant, et un par faux fait échouer `paper-race-circuits`.

