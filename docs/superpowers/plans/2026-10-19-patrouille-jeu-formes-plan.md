# La Patrouille des Étoiles, le jeu complet en formes simples : plan

Plan tiré de [la spec](../specs/2026-10-17-patrouille-jouets-design.md), écrit le
2026-10-19 après la validation des trois POC par Julie :

| POC | Ce qu'elle a validé | Fichier |
|---|---|---|
| 1 | mécaniques de base, commande relative, boss en 2 phases | `patrouille/poc.html` |
| 2 | armes à munitions, bonus, tirs bleus et rouges, prisonniers, copain, robot, missions sur une carte avec « Continuer » | `patrouille/poc2.html` |
| 3 | un pilotage par véhicule (vitesse du doigt, élan, glisse), un trait par milieu | `patrouille/poc3.html` |

**Règle de tout ce plan : formes simples jusqu'au bout.** Ronds, carrés,
triangles, couleurs plates. Aucun dessin définitif : la direction B (« livre
illustré ») vient après, dans un plan à part. Chaque tranche se termine par une
version jouable sur son téléphone et attend son avis avant la suivante.

## Où vit le jeu, et quelle technique

- Dossier `patrouille/` du dépôt `games`, branche `patrouille`, worktree
  `games-patrouille/`. Rien ne part sur `main` (la prod) avant son « go prod ».
- **JavaScript sans build, en modules ES**, comme Pièce à conviction : aucune
  dépendance, servi tel quel par GitHub Pages.
- **Le moteur est pur, sans DOM ni canvas** (`patrouille/moteur/`). Il tourne donc
  dans Node : les tests et le robot joueur l'appellent directement, des dizaines
  de missions par seconde, sans navigateur. Le dessin (`patrouille/ecran/`) lit
  l'état du moteur et ne le modifie jamais.
- **Hasard à graine** (`moteur/hasard.js`) : une mission jouée avec la même graine
  et les mêmes gestes donne la même partie. Les bancs et l'équilibrage en
  dépendent ; `Math.random` est interdit dans le moteur.
- **Pas fixe à 60 images/s**, comme les POC ; vitesse x2 pour les essais.
- Types en JSDoc vérifiés par `tsc --checkJs` (`patrouille/jsconfig.json`), sans
  compilation, comme `conviction/`.
- Stockage : `localStorage`, clé `patrouille:sauvegarde`, chaque lecture et
  écriture protégée (try/catch) ; le jeu démarre avec un stockage vide, bloqué ou
  corrompu.
- Pour qu'elle joue sur son téléphone pendant la construction : chaque tranche est
  publiée en page privée (artifact à plusieurs fichiers), comme les POC.

## Architecture

```
patrouille/
  index.html  style.css          les écrans HTML (carte, Hangar, pause, bilan…)
  manifest.json  sw.js  icones/  PWA (sw.js porte VERSION, en x.y.z)
  moteur/                        pur, testable dans Node
    hasard.js                    générateur à graine
    partie.js                    état d'une mission, pas fixe, script de vagues, fin, bilan
    pilotage.js                  direct (avion) et élan (rover, sous-marin, vaisseau) ; zones
    tirs.js                      tir de base par module, 6 armes à munitions, tirs bleus et rouges
    ennemis.js                   les comportements communs (foncer, V, piquer, viser, étoile, porteur…)
    bonus.js                     cadeaux, porteurs, cages et astronautes, copain, robot de combat
    milieux.js                   feuillage, sol (rochers, sable mou, tremplins), courants et obscurité, attraction
    boss.js                      les 4 boss, phases, annonce
    progression.js               missions, déblocage, mission secrète, collection, Hangar, format de sauvegarde
  contenu/                       des données, pas de logique
    planetes.js                  les 4 planètes : module, couleurs provisoires, milieu, boss
    ennemis-jungle.js …          les 8 ennemis de chaque planète : comportement commun + réglages + forme
    missions-jungle.js …         les 6 missions de chaque planète : vagues minutées, cages, porteurs, copain, drapeau
  ecran/
    rendu.js                     formes simples (repris des POC), milieux, effets
    interface.js                 cœurs, cristaux, astronautes, arme, bonus, super, messages
    carte.js                     le système solaire en formes simples, chemins, bifurcation
    commandes.js                 doigt (commande relative), pause, visibilité
    ecrans.js                    menus HTML, Hangar, bilan, réglages des parents
  sauvegarde.js                  lecture et écriture protégées
```

Ce qui existe déjà dans `patrouille/` et ne fait pas partie du jeu :

- `poc.html`, `poc2.html`, `poc3.html` : déplacés dans `tools/poc/` à la tranche 1
  (les pages privées publiées restent valables) ;
- `dessin/` (les dessins des jouets, thème abandonné) et `polices/` : déplacés
  dans `tools/archive-jouets/` ; la police viendra avec la direction B.

## Contrôles (dans `tools/`)

Écrits **avant** le code de chaque tranche, vus rouges, puis verts.

- `node --test tools/patrouille-moteur.test.mjs` : pilotage (0 demi-tour au
  lâcher, dérive dans un courant, rocher qui bloque, saut qui protège),
  munitions et remplacement d'arme, durée des bonus, bleus avalés et rouges qui
  blessent, cages et remise à zéro à la mort, copain qui ouvre la mission secrète,
  robot qui encaisse 5 coups, drapeau du boss, déblocage dans l'ordre, sauvegarde
  vide, ancienne ou corrompue.
- `node tools/patrouille-missions.mjs` : chaque fiche de mission est valide
  (ennemis connus, cages déclarées, fin présente), et sa durée calculée tombe entre
  2 et 3 minutes (boss compris pour la mission du boss).
- `node tools/patrouille-robot.mjs` : le robot joue les 24 missions dans Node,
  plusieurs graines chacune, avec l'équipement qu'on peut s'offrir à ce stade.
  Il sort durée, coups encaissés, cristaux, astronautes délivrés. Sert à
  l'équilibrage ; un banc qui n'a jamais échoué ne prouve rien, on le fait échouer
  une fois exprès.
- `node tools/patrouille-ui.mjs` : captures de chaque écran au format Pixel 9
  (360×732) et 360×640, aucun chevauchement, textes de 14 px au moins, tirs lisibles
  (contraste mesuré sur les pixels), images/s avec la carte graphique.
- `node tools/patrouille-pwa.mjs` : installation, relance hors ligne réseau coupé,
  cache = dépôt, mise à jour prise sur la carte et jamais en pleine mission.
- `node --test tools/versions.test.mjs` : la version en trois chiffres.

## Tranches

### Tranche 1 : le socle, et les deux premières missions de la Jungle

1. Contrôles du moteur repris des bancs des POC (pilotage, tirs, bonus, cages),
   rouges.
2. `moteur/` écrit à partir du code des POC, découpé selon l'architecture,
   hasard à graine, pilotage à la vitesse du doigt (jamais de ressort).
3. `ecran/` minimal, carte avec la Jungle seule, sauvegarde, « Continuer ».
4. Missions Jungle 1 et 2, avec les ennemis qu'elles présentent.
5. Robot, captures, page privée publiée : **elle joue**.

### Tranche 2 : la Jungle complète

1. Les 8 ennemis de la Jungle, dont la plante cachée (annoncée par le tremblement).
2. Missions 3 à 5, la mission secrète et la mission du boss (drapeau, alerte).
3. Le Grand Caméléon : 2 phases, il disparaît dans le feuillage et se trahit.
4. Hangar, bilan, collection d'armes, copain, robot de combat, astronautes et
   collection du vaisseau-mère.
5. Robot sur les 6 missions, captures, page privée : **elle joue la Jungle en
   entier**. C'est le moment de juger la difficulté et le rythme d'une séance.

### Tranche 3 : le Désert (rover)

Milieu « sol » complet : rochers qui bloquent et abritent, sable mou, tremplins,
ennemis au sol qui défilent avec lui, taupe et scarabées qui jaillissent (toujours
annoncés). Le Scarabée géant et ses rochers qui roulent. 6 missions, robot,
page privée.

### Tranche 4 : l'Océan (sous-marin)

Défilement vers le bas, courants, obscurité qui grandit et phare, torpilles,
mines-bulles emportées par les courants, encre du calamar. Le Léviathan, plus
grand que l'écran. 6 missions, robot, page privée.

### Tranche 5 : la Ceinture (vaisseau) et la fin du jeu

Astéroïdes qui se cassent, planète qui attire, mine aimantée, comètes. Le Glouton
en boss final, puis la fin de l'histoire. 6 missions, robot, page privée : **le
jeu complet en formes simples**.

### Tranche 6 : équilibrage et finitions sans graphismes

- Équilibrage au robot puis par ses parties : durée des missions, coups reçus,
  munitions, prix du Hangar. La POC 2 était devenue trop facile avec les armes :
  l'objectif est qu'un enfant qui joue bien passe une mission du premier ou du
  deuxième coup, pas sans être touché.
- Réglages des parents, introduction en 3 images (formes simples), bouton
  « Installer », PWA hors ligne, version 1.0.0 dans `sw.js` et
  `docs/patrouille-versions.md`.
- Revue de code et audit avant de lui proposer la suite : le plan des graphismes
  (direction B), puis seulement l'entrée dans l'Arcade et la prod.

## À décider en cours de route (on lui demande au moment venu)

- **Le super-pouvoir de chaque module** (la spec le laisse ouvert). Pistes :
  avion, rafale qui balaie l'écran ; rover, turbo qui traverse tout ; sous-marin,
  onde sonar qui éclaire le noir et étourdit ; vaisseau, mini trou noir qui aspire
  les tirs.
- Le nom définitif du jeu : **Star Patrol**, choisi le 2026-10-21 (ex-« La Patrouille des Étoiles »).
- Sons : rien dans ce plan. Les sons de synthèse ont été refusés sur Pièce à
  conviction ; il faudra de vrais enregistrements libres de droits.

## Ce qui reste hors de ce plan

Les graphismes (direction B), l'entrée dans l'Arcade, la mise en prod, la
« Nuit noire » et le mode infini.
