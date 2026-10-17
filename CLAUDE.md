# games

Un jeu PWA par dossier (`echecs/`, `serpentin/`, `paper-race/`). Vanilla JS, **aucune
dépendance, aucun outil de build**. Servi par GitHub Pages sur `main` :
`https://replica-n8n.github.io/games/<jeu>/`.

Le `README.md` décrit les jeux, leurs règles et leur état. Ce fichier ne le
répète pas : il donne ce qu'il faut savoir pour y toucher sans rien casser.

## Invariants

- **Les numéros de version ont trois chiffres, `majeur.mineur.correctif`**
  (depuis le 2026-10-17 ; avant, un compteur de publications que Julie a refusé :
  « v82 » faisait croire à 82 changements majeurs). Du nouveau = mineur, une
  correction ou une retouche = correctif, majeur = une ancienne sauvegarde ne
  marcherait plus. Le numéro nomme aussi le cache : il augmente à CHAQUE
  publication, au moins du correctif. Chaque jeu raconte les siens dans
  `docs/<jeu>-versions.md` (l'ancien compteur y est en face) ; ajouter la ligne
  en même temps que le numéro, `node --test tools/versions.test.mjs` refuse un
  numéro sans trois chiffres ou que le fichier ne raconte pas, et compare les
  témoins ci-dessous. Le préfixe ne change pas (`chevalier-`, `damier-`, `ppm-`,
  `V` pour la Bataille…) : le cache reste rangé sous le même nom.
- **`VERSION` existe en DEUX exemplaires pour `serpentin/`** : dans `sw.js`,
  qui nomme le cache, et dans `index.html`, qui l'affiche dans le menu. Les
  changer **toutes les deux** à chaque modification d'un fichier de `SHELL`,
  sinon le téléphone continue d'afficher l'ancienne version. ⚠️ Elles ont
  dérivé de trois crans le 2026-09-02 : `sw.js` à `v52`, la page à `v49` : le
  cache se mettait bien à jour, mais le seul endroit où lire ce qui tourne
  mentait. Un essai de `chevalier-moteur.mjs` les compare. Ce n'est pas une
  deuxième source mais un TÉMOIN, gardé exprès : la page vient du réseau, les
  scripts du cache, et le menu propose « Réparer » quand le service ne dit pas
  comme la page. Le menu affiche « Version x.y.z ».
- **`paper-race/` : le dessin est dans `rendu.js`, le jeu dans `ui.js`** (scripts
  classiques : ils partagent leurs noms globaux, et `rendu.js` se charge AVANT
  `ui.js` car il donne `$`, le canevas et `render()`. Les branchements de
  « Revoir la course » attendent `brancherRevue()`, appelé par `ui.js`, sinon ils
  s'exécuteraient avant que `ui.js` existe).
- **`paper-race/` : `VERSION` en deux exemplaires** aussi, dans `sw.js` et en tête
  de `ui.js` (même rôle de témoin : `ui.js` vient du cache).
  `tools/paper-race-pwa.mjs` les compare, vérifie que chaque `$('id')` de `ui.js`
  existe dans le HTML, et compare le cache installé au dépôt.
- **`paper-race/` : son `CLAUDE.md` d'origine est devenu cette section.** Ce qui
  est fragile : la carte d'avancement (`champ`, `avanceDe`) ne doit JAMAIS
  revenir à une mesure angulaire (l'ordinateur se garait dans les virages
  larges) ; dans `aiChoice` la survie est un FILTRE, jamais un objectif
  (sinon l'arrêt devient le plus sûr) ; les îlots d'un circuit forment un seul
  bloc loin du bord, couloir de 5 cases ; le décor se dessine une fois
  (`terrain = null` pour l'invalider). Le quadrillage reste comptable : pas de
  perspective sur la surface de jeu. Volontairement absents : défi quotidien,
  classement, série de jours, éditeur de circuit.
- **`paper-race/` : l'ordre de `TRACKS` EST le championnat** (`ORDRE` dans
  `moteur.js`), rangé par difficulté mesurée ; `paper-race-difficulte.js
  --controle` échoue s'il ne l'est plus. Les sauvegardes et réglages désignent
  un circuit par son `id`, jamais par son numéro (l'ordre a changé en v4). Un
  tracé ajouté passe `paper-race-circuits.js` : pas de raccourci, par exact.
- **`paper-race/` : les pièges se posent sur une ligne droite, avant un
  virage**, sur toute la largeur de la piste (dans un virage, ils sont mortels).
  Après tout changement de piège ou de niveau : recalculer les pars
  (`paper-race-circuits.js` les vérifie) et relancer `paper-race-niveaux.js`.
- **`paper-race/` : un piège se DESSINE, il ne se devine pas.** Un joueur n'avait
  pas compris que le bleu voulait dire mouillé. `formes.js` (géométrie PURE,
  requérable en Node comme `moteur.js`) donne le contour ; `dessinPiege` de
  `rendu.js` dessine la flaque, la tache d'huile et les chevrons, et sert AUSSI
  aux vignettes de la feuille des règles, pour que les deux ne divergent jamais.
  Le contour ENGLOBE toujours la zone (`tools/paper-race-pieges.js` le mesure
  hors navigateur) : plus petit, il ferait croire qu'on passe à côté. Les mots
  des pièges vivent dans `MOTS` (`ui.js`) et sont les mêmes dans les règles, en
  visant et une fois dedans. `#zonemsg` est une pastille POSÉE sur le plateau :
  la remettre dans la colonne ferait sauter le plateau quand elle apparaît.
  `tools/paper-race-pieges-vus.mjs` mesure tout ça dans le navigateur.
- **`paper-race/` : l'upgrade graphique se fait par étapes** (méthode de toto) :
  `tools/paper-race-planche.mjs avant|apres` fait les gros plans sans interface,
  la planche avant/après et mesure les images/s AVEC la carte graphique. Le
  bord de piste (vibreurs, gravier, pneus, cases de grille) est dessiné UNE fois
  dans le décor ; les vibreurs des vrais tracés suivent le bord exact (segments
  décalés + arcs), jamais un masque « large moins étroit » (éclats, coutures).
  Le ralenti repeint le décor dans une `fenetre` (v24) : toute toile du décor
  passe par `neuf()` et se pose avec `coller()`, jamais un `drawImage` direct,
  sinon le ralenti décale ou floute ce morceau. Une seule monoplace,
  `dessineVoiture`, pour le plateau et le ralenti.
- **`paper-race/` : une règle de coup vit à DEUX endroits** : `choices` (ce que le
  joueur peut jouer) et `suivants` (ce que le fantôme PRÉVOIT). Les oublier l'un
  sans l'autre, c'est un fantôme qui compte sur un coup interdit et sort de la
  piste (vu en v19 avec le contresens : ordre du championnat cassé). On ne recule
  JAMAIS (`progress` négative), même à l'arrêt (v20). Une voiture sortie est
  `dehors` : sa position est dans l'herbe, son `retour` (dernière case de route)
  porte l'avancement (`baseDe`) ; elle ne peut que revenir sur une case voisine
  d'elle ET du retour.
- **`paper-race/` : `REGLES` (dans `moteur.js`) est la version des RÈGLES**, pas
  du code. À augmenter à CHAQUE règle qui change le résultat d'un coup : en
  ligne, chaque téléphone rejoue la course avec son propre moteur, et le relais
  (pr-4) refuse de mélanger deux versions dans une salle. L'oublier, c'est deux
  écrans qui divergent pour de bon dès qu'un téléphone n'est pas à jour. 2 = v17
  (coincé en roulant, la voiture file dans le mur au lieu de s'arrêter net). 3 = v19
  (pas de contresens) ; 4 = v20 (dans le mur pour de vrai, pas de recul à l'arrêt).
- **`paper-race/` : le seul accès réseau est la course EN LIGNE** (`ligne.js`,
  relais `serveur-paper-race/`). Seul, à deux sur un téléphone, le
  championnat : hors ligne, toujours. Le relais ne connaît pas les règles, il
  ordonne les coups ; un coup = une case du pavé (0 à 8) ou 9 (« coincé »).
  Relais pr-4 : la salle retient `regles`, un téléphone d'une autre version est
  refusé (code 4026, et le message `erreur` « version » part AVANT la fermeture,
  qui peut traîner 10 s). Relais pr-3 : le WebSocket s'accepte AVANT de lire l'état (sinon un coup joué
  entre les deux est perdu pour celui qui se connecte), et un client qui voit un
  numéro de coup en avance reprend le fil auprès du relais.
  Relais pr-2 (v9) : 2 à 6 places, un coup = { v : voiture, k : 0-9, 10 abandon } ;
  il vérifie QUI joue quelle voiture, pas à qui c'est le tour : chaque téléphone
  ignore pareil un coup hors tour. Les fantômes en ligne sont calculés par
  l'hôte seul. Une salle sans `places` est une salle v7 : le relais la sert
  encore aux vieux téléphones (ne pas retirer ce code de `worker.js`), mais le
  jeu ne sait plus la jouer depuis la v18 et la quitte avec le message de version.
  Toute règle ajoutée au moteur doit rester sans hasard, sinon les deux
  téléphones ne verraient plus la même course. Déployer le relais AVANT de
  publier un jeu qui s'en sert.
- **`paper-race/` : le championnat crée ses courses SANS options**
  (`newRace(ti, 1, 'joueur')`) : c'est la course de la v7, et
  `paper-race-reference.js --controle` vérifie que les courses classiques (330 depuis v11)
  restent identiques. Les courses à plusieurs passent `regles: 'grille'`. Dans
  le moteur, une autre voiture se trouve par `bloqueur` et les tours par
  `nextTurn` : plus jamais `1 - turn`. À plus de deux voitures, seulement les
  grands circuits (`pelotonPermis`). Les couleurs de voiture se recalculent avec
  `paper-race-couleurs.mjs`, jamais à l'œil.
- **`paper-race/` : un tracé qui porte le nom d'un vrai lieu doit lui ressembler.**
  Les vrais tracés se construisent avec `tools/paper-race-traces.js` depuis
  `tools/donnees/circuits/` (MIT, garder la licence), jamais à la main ; un
  circuit dessiné à la main prend un nom inventé. Ajouter un circuit : l'insérer
  dans `ORDRE` à sa place MESURÉE, donner `par` et `parSans` (le solveur), et ne
  jamais changer l'`id` d'un circuit existant (records et sauvegardes y tiennent).
- **Le dossier `echecs/` garde son nom** alors qu'il contient aussi les dames :
  l'adresse était déjà installée sur des téléphones, la renommer casserait ces
  installations.
- **Coquille et moteurs sont interchangeables** : `moteur-echecs.js` et
  `moteur-dames.js` exposent la même API publique (`nouvelle`, `coups`,
  `jouer`, `fin`, `piece`, `forme`, `trait`…), et l'interface appelle l'un ou
  l'autre sans savoir lequel. Ajouter une méthode à un moteur sans l'ajouter à
  l'autre casse ce contrat. Seul le bloc `__essais`, réservé aux scripts
  `perft`, porte les noms internes de chaque moteur et diffère volontairement.
- Chaque jeu est autonome (`index.html`, `manifest.json`, `sw.js`), les portées
  de service worker ne se chevauchent pas.
- **`petit-plus-minus/` a son propre `CLAUDE.md`** (principes du jeu pour enfant,
  invariants, contrôles) : le lire avant d'y toucher. `VERSION` n'y existe qu'une
  fois, dans `sw.js`.
- **`toto/`** : le prototype « Mâchoires » (un seul `index.html`, canvas
  vanilla) rendu installable. `VERSION` n'existe qu'une fois, dans `sw.js`.
  Aucun titre n'est définitif : il vit dans `<title>`, le `<h1>` et le
  manifeste, rien d'autre ne le nomme. Le `CLAUDE.md` apporté avec le POC
  (Phaser, TypeScript, Vite) ne s'applique PAS : c'est une PWA comme les autres.
  Identité « Panneaux de plage » : lire `toto/PRODUCT.md` et `toto/DESIGN.md`
  avant de toucher à l'interface (une couleur de sécurité = un seul sens, jamais
  sans pictogramme ou mot, rien sous 14 px). Bancs : `toto-pwa.mjs` (`--enligne`
  pour la prod), `toto-maj.mjs` (mise à jour prise à l'écran titre, jamais en
  pleine partie ; animations réduites), `toto-ui.mjs` (captures de chaque état).
  La carte du fichier est plus bas (« Carte de `toto/index.html` »).
- **`bataille/`** : « La Bataille, cartes vivantes », né d'un POC en paysage, joué
  en PORTRAIT depuis `bataille-2` (un seul `index.html`, canvas vanilla).
  `VERSION` n'existe qu'une fois, dans `sw.js` (`Vx.y.z` : le « V » est son choix,
  les trois chiffres aussi ; `serveur-bataille/` accepte `V12` et `V1.5.1`, il faut
  donc le redéployer AVANT de publier un jeu à trois chiffres, sinon ses mesures sont
  refusées sans bruit). Lire `bataille/PRODUCT.md` et
  `bataille/DESIGN.md` avant de toucher à l'interface (direction « Nuit claire »).
  Ce qui est fragile : **aucun flou (`backdrop-filter`) pendant le jeu**, il coûtait
  15 images/s même loin de la toile ; la toile `#jeu` ne couvre que le tapis et le
  décor se peint une fois par mois (`peindreDecor`) ; les dos de cartes et les
  chiffres de dégâts sont des vignettes (`dos`, `chiffre`), jamais redessinés à
  chaque image. Les couleurs de `:root` sont écrites par `bataille-couleurs.mjs`,
  qui échoue si elles diffèrent. Une carte se range du côté de SON camp par rapport
  à sa cible et ne la cache jamais. La partie se retient au début de chaque mois à
  partir du deuxième (`bataille-partie`). Bancs : `bataille-ui.mjs` (une année
  entière sur deux hauteurs d'écran, 32 cartes à chaque fin de mois, contrastes sur
  les pixels, images/s avec la carte graphique), `bataille-pwa.mjs` (réseau coupé
  juste après l'installation), `bataille-couleurs.mjs`. **Les constellations sont
  les vraies** : le bloc `/*CIEL*/` est écrit par `bataille-constellations.mjs`
  depuis `tools/donnees/constellations/` (d3-celestial, licence BSD à garder), nord
  en haut et est à gauche ; `--controle` échoue si le jeu en porte d'autres,
  `--planche` les compare à celles du POC, qui étaient inventées. Le bouton
  **Une règle de mois doit se VOIR** : les cartes qu'elle avantage portent une
  étoile d'or (`favori`), les flèches du Sagittaire volent avant de blesser
  (`fleches`), un soin ou un coup doublé s'écrit. `bataille-pouvoirs.mjs` fige le
  hasard et mesure l'effet de chacun des douze mois ; toute nouvelle règle y entre.
  Le ruban d'annonce recouvre la pastille du compte, jamais le tapis.
  **Les atouts sont LE jeu depuis V12** (rogue-lite) : entre deux mois, un atout parmi
  trois, valable le mois suivant ; le Maudit en tire un. `?classique` rend la
  bataille d'avant : c'est l'adresse des bancs `bataille-ui`, `bataille-equilibre` et
  des robots. Un atout ne dure JAMAIS plus d'un mois : gardé toute l'année, même 4 %
  de soin font gagner à coup sûr (`docs/recherche-roguelite.md`). Bancs :
  `bataille-essai.mjs`, `bataille-equilibre.mjs --recompenses`.
  **Mesures et réglage automatique** : à la fin d'une année, le jeu envoie UNE fiche
  anonyme au compteur `serveur-bataille/` (Cloudflare,
  `bataille-mesures.jfrxdi0zz.workers.dev`), qui RÈGLE TOUT SEUL : vie du Maudit
  (`f`) et force de chaque atout (`s`), par petits pas, puis ARRÊTE de mesurer
  (stable, ou plafond) et répond 410 ; le jeu se tait alors. Seuils dans `REGLE`,
  décisions dans `regler` (pure, banc `bataille-reglage.mjs`). ⚠️ Décision de Julie :
  les joueurs ne sont pas prévenus, et ça ne tient QUE parce que rien ne désigne un
  joueur ou un téléphone. N'ajouter AUCUN identifiant, même aléatoire, sans lui en
  reparler. Après un changement de règles ou d'atouts : augmenter `SERIE` dans
  `worker.js` (la mesure repart) et déployer le compteur AVANT le jeu
  (`npx -y wrangler@4 deploy`). Après toute retouche de `worker.js` par script :
  `node --check`. Les robots et les bancs n'envoient rien (`bataille-mesures.mjs`).
  **Les arcanes s'expliquent** : le « i » au bout de la main (hors combat) ouvre la
  fiche (`ouvrirFiche`), écrite depuis `desc` et `quand` de `ARCANA` ; en combat le
  ruban dit ce que l'arcane vient de faire. **Équilibrage** : `bataille-equilibre.mjs`
  fait jouer des années entières à trois robots avec le vrai moteur, sans dessin
  (crochets `gele`, `pas`, `lance`, `suivant`). Mesuré le 2026-10-05 sur 1 500
  années chacun : à armes égales 53 %, sans jamais lancer d'arcane 14 %, en les
  lançant bien 61 % ; la main de départ pèse (37 % à 69 %). Relancer ce banc après
  tout changement de règle, d'arcane ou de chiffre de combat.
  « Installer le jeu » est sur l'écran titre tant que le jeu n'est pas installé
  (règle pour TOUTES les apps). La maquette des trois
  directions reste dans `tools/mockup-bataille-portrait.html`.

- **`conviction/`** : « Pièce à conviction », puzzle de placement et d'enquête
  (plan détaillé : `docs/conviction-plan.md`, prototype validé :
  `docs/conviction-poc-valcourt.html`). Le nom ne vit que dans
  `i18n/fr.js` (`appName`), le manifest et le `<title>` ; « Murdoku », le jeu
  qui l'a inspiré, n'apparaît JAMAIS dans l'app. Le moteur (`conviction/engine/`)
  est pur, sans DOM, en modules ES typés par JSDoc : `tsc --checkJs` le vérifie
  sans rien compiler (`npx -y -p typescript@5.9.3 tsc -p conviction/jsconfig.json`).
  Une enquête est un JSON déclaratif (`conviction/puzzles/`, listé dans
  `index.json`) ; ses indices n'ont jamais de fonction. « À côté » = voisin
  orthogonal ET même pièce, défini une seule fois (`board.js`). Toute enquête
  ajoutée passe `node tools/conviction-enquetes.mjs` (solution unique, égale
  à `solution`, coupable unique) ; la CI `.github/workflows/conviction.yml`
  le relance avec `node --test tools/conviction-moteur.test.mjs`, sans rien
  publier. Les textes (indices compris) vivent dans `conviction/i18n/fr.js`.
  `nextHint` ne propose JAMAIS une case fausse : le test le vérifie depuis
  toutes les grilles partielles justes de Valcourt.
  **Direction « Maquette »** (choisie par Julie le 2026-10-14 sur la planche
  `docs/conviction-directions.png`) : la maison vue de dessus sur un socle
  sombre, identique dans les deux thèmes (seul l'habillage autour suit le
  téléphone). Chaque pièce porte un sol (`material` : parquet, tapis…,
  liste dans `engine/decor.js`, dessin dans `style.css`, classes `sol-*` avec
  une couleur de fond moyenne pour que les contrastes se mesurent). Chaque
  personne a un `look` (peau, cheveux, chapeau, tenue, détails) dessiné par
  `ui/buste.js` ; la validation refuse une valeur inconnue. Notes au
  crayon (action `note`) : poser quelqu'un efface ses notes et celles de sa
  ligne, de sa colonne et de sa case. Le témoignage de la personne choisie
  s'éclaire sur le plan (réglage `light`) : une LECTURE, pas une déduction,
  les lignes prises ne comptent pas.
  **Les enquêtes sont générées** depuis des histoires (`tools/conviction-histoires.mjs` :
  décor, personnes et visages, coupable, pièce du crime, intro, dénouement) par
  `node tools/conviction-generateur.mjs [histoire]` (`engine/generate.js`) :
  placement, témoignages ajoutés jusqu'à l'unicité puis retirés s'ils ne servent
  à rien, difficulté MESURÉE (`classify` sur la chaîne d'indices), graine écrite
  dans le JSON (même graine = même enquête). Le français des témoignages vit
  dans `i18n/temoignages.js` ; après l'avoir retouché : `--textes` réécrit les
  phrases sans tout recalculer, et un test refuse un texte périmé. Règles du
  générateur : le coupable ne dit jamais qu'il était dans la pièce du crime,
  jamais de lien direct coupable-victime, jamais ligne ET colonne pour une même
  personne, une personne citée une seule fois par témoignage. Initiales uniques
  par enquête (les notes au crayon les affichent). Valcourt reste écrit à la
  main (pas de graine, le générateur n'y touche pas). Une 8×8 se cherche en
  minutes, et en difficile 400 graines n'ont rien donné (2026-10-14) : « Ils
  étaient dix » n'existe qu'en moyen, la lancer en arrière-plan.
  **Textes pour un enfant de 8 ans** (2026-10-16) : les directions se disent
  comme sur le plan, le point cardinal entre parenthèses (« plus à droite
  (à l'est) », « juste au-dessus (au nord) ») ; « Le corps était », jamais
  « gisait » ; une boussole N, E, S, O qui chevauche le coin du plan (hors
  de `.maquette`, qui rogne ; la rangée A, B, C… est rehaussée), dessinée en
  trait (un `<text>` SVG comptait comme texte de 5,6 px pour le banc).
  ⚠️ À 7-8 personnes la rangée de visages DÉFILE : le visage choisi y est
  ramené à l'écran, un fondu signale la suite, et le message dit qui reste
  à placer. Julie ne pouvait pas accuser : la victime, 7e visage, restait
  cachée à droite (le banc vérifie le dernier visage à l'écran). Un pion qui
  respecte son témoignage sans être à sa case a son propre message d'indice
  (« reprenez son témoignage » faisait croire à une contradiction).
  **Les invités de l'Arcade** (2026-10-16) : « L'affaire du papillon » (les
  bestioles du chevalier dans la forêt) et « Mystère au large » (créatures du
  golfe + Rustin, Jade la baigneuse, Gédéon le chasseur de baleines). Les
  créatures ont leur dessin (`ui/bete.js`, `look.espece`), de PROFIL tournées
  à droite (Julie a refusé les portraits de face), sauf le papillon (de face,
  ses ailes ne se lisaient pas). Ailerons vers l'arrière ! Deux versions
  refusées avant : des humains dans un château (« rester dans le même
  univers »), puis des créatures de face. 8×8 à 8 personnes : introuvable,
  rester en 7×7 ; le crime au port (au large : trop rare pour le générateur).
  ⭐ **Standing des portraits = la BASE** (validé par Julie le 2026-10-16) :
  tout nouveau personnage humain = `buste()` + un costume (`ui/costumes.js`,
  `look.perso`), jamais un dessin à plat (jugé « bas de gamme »). Les
  non-humains (`ui/onepiece.js`, `ui/bete.js`) au même niveau : reflets,
  ombres, détails. Toujours d'après des IMAGES vues. Vitrine de référence :
  `docs/conviction-onepiece-vitrine.png`.
  **One Piece** (2026-10-16) : « La mort du roi Cobra » (Rêverie, moyen, coupable
  Imu) et « La mort de Vegapunk » (Egghead, difficile, coupable York). Un
  `look.perso` est validé contre `LOOK.perso` (`engine/decor.js`) ; `buste()`
  envoie vers `onepiece()` un personnage sans costume (Imu, Shaka, les robots,
  `look` sans `skin`). Un test vérifie que costumes + dessins = la liste.
  Personne ne s'assoit sur le trône vide : pas de siège dans cette pièce.
  Captures en jeu : `tools/mockup-conviction-onepiece-jeu.mjs`.
  **Espaces insécables** (2026-10-16) : avant ; : ! ? » et après «, sinon le
  signe peut commencer une ligne (vu dans un verdict). Fait à UN endroit,
  `i18n/typo.js` : `affine()` enveloppe HINT, UI, SCENE, TUTO et chaque
  enquête au chargement (`app.js`) ; les guillemets des `<q>` sont dans
  `style.css`. Les JSON gardent des espaces ordinaires. Le banc
  `conviction-enquetes-ui.mjs` (`<id>` pour une seule enquête) refuse une
  espace ordinaire dans le texte affiché ; un banc qui compare un texte
  écrit `\s` devant ces signes.
  **Décors À THÈME** (2026-10-17, direction validée par Julie sur
  `docs/conviction-themes.png`, d'après Murdoku) : chaque univers a SES sols
  et SES objets, jamais ceux des maisons (Egghead avait carrelage et
  tomettes : « une ville futuriste avec des pièces normales »). Trois outils :
  (1) cases HORS PLAN, « . » dans `layout` : la forme du lieu ; `board.hors`,
  bloquées, d'aucune pièce, jamais « à côté » ; `dehors` (nuages,
  nuit-etoilee, mer) dit ce qu'on y voit ; la validation refuse un meuble
  dessus et une ligne ou colonne toute hors plan. (2) GRAND meuble :
  `{ type, cells, grand: true }` = UN objet sur un rectangle (sans `grand`,
  `cells` reste une liste de meubles séparés, Valcourt en dépend) ; sa taille
  de dessin est dans `TAILLE` (`ui/icons.js`). (3) Noms des pièces écrits SUR
  le plan, au pied de leur rangée la plus large, sans en sortir (`--run`) ;
  le banc des enquêtes le mesure. Le nom cité par le témoignage passe en jaune.
  Un nouvel univers = ses sols (`MATERIALS` + `style.css`) et ses objets
  (`furniture.js`, `fr.js`, `icons.js`), dessinés d'après ses images.
  **Mythologies** (2026-10-17) : « Le coffre d'Osiris » (Égypte, facile,
  coupable Seth), domaine public. Dieux à tête d'animal (Anubis, Thot, Seth)
  de PROFIL dans `ui/egypte.js`, comme la peinture égyptienne ; Isis,
  Nephthys, Osiris = bustes + costumes (`egyptienne()` dans `costumes.js`).
  Fiche : `docs/conviction-egypte-personnages.md`, planche
  `docs/conviction-egypte.png`. Un meuble peut changer sa préposition
  (`sur` dans `FURNITURE_NAMES` : « assise DANS la barque »).
  **Tutoriel joué** (`ui/tuto.js`) : Valcourt, première visite, après le
  dossier : 4 bulles qui ATTENDENT le geste (choisir, placer), « Passer »
  toujours là ; rangé sous `tuto`. Les bancs le passent (`fermerDossier`).
  **Aveux** : une réplique par enquête dans `tools/conviction-aveux.mjs`,
  recopiée par `--looks` ; la chute de la scène fait parler le coupable.
  **Trophées** (`ui/trophees.js`) : gagnés au verdict (partie) ou sur
  l'accueil (collections, et les records d'avant) ; vitrine sous les rayons.
  **Sons** : ESSAYÉS en synthèse Web Audio (CLAC des barreaux, tampon) et
  REFUSÉS par Julie (« on ne reconnaît pas la grille ou le tampon »,
  2026-10-16) : retirés (`ba27b7e` les contient). Un vrai son demandera de
  vrais enregistrements (libres de droits), pas de la synthèse.
  **Générateur sur tous les cœurs** (`conviction-generateur-travail.mjs`) :
  8×8 moyenne en 22 s au lieu de 78. ⚠️ Une 8×8 DIFFICILE reste introuvable
  (0 sur 4 000 graines, 2026-10-16) : ce n'est pas la vitesse, le comptage
  des solutions plafonné à 12 rend la recherche aveugle sur une grande
  grille aux indices faibles ; 4 morceaux par personne ou un plafond à 80 ne
  suffisent pas. Il faudrait un autre algorithme, pas plus de graines.
  Accueil (`ui/home.js`) = « le bureau du détective » (choisi par Julie le
  2026-10-16 parmi 3 directions, `docs/conviction-accueil.png` ; l'accueil en
  fiches était « austère ») : en haut UNE enquête conseillée (la dernière en
  cours, sinon la première jouable non résolue) avec son plan et la victime en
  polaroïd ; dessous un rayon par collection, une chemise cartonnée PAR
  CHAPITRE qui ouvre l'enquête. Un chapitre 2 reste SCELLÉ (cire) tant que le
  1 n'est pas résolu, et dit pourquoi si on le touche. Le bureau reste sombre
  dans les deux thèmes (c'est un objet, comme le socle du plan).
  Jeu : en-tête d'une rangée (retour, titre, chapitre · niveau · chrono ·
  indices, dossier, « ⋯ ») ; l'histoire, tous les témoignages, la légende et
  les règles vivent dans le DOSSIER (`<dialog id="dossier">`), ouvert seul à
  la première visite (« pourquoi scroller pour lire l'histoire ? »). Bustes
  PARTOUT (`buste(p, '', true)` = cadré visage pour pions et vignettes).
  Meubles (`ui/icons.js`, carré de 48, planche `docs/conviction-meubles.png`) :
  ce qui est DEBOUT se dessine de face (armure, tonneau, armoire, sièges),
  vu de dessus l'armure et le tonneau ressemblaient à des roues (Julie). Pas
  de dégradés SVG (un même dessin revient des dizaines de fois). Sols : une
  texture SVG par case dans `style.css` (avant/après `docs/conviction-decors.png`).
  Banc de TOUTES les enquêtes au doigt : `tools/conviction-enquetes-ui.mjs`
  (`--planche` refait `docs/conviction-histoires.png`). Les vrais noms des
  œuvres protégées (Poirot, Christie, Trône de fer) sont un choix de Julie
  (2026-10-14), prévenue du risque de demande de retrait ; les intrigues sont
  les nôtres, aucun texte des livres n'est recopié.
  **Installable** (étape 4) : `VERSION` n'existe que dans `conviction/sw.js`
  (`conviction-1.8.0` : trois chiffres, majeur.mineur.correctif, historique
  dans `docs/conviction-versions.md` ; un compteur `conviction-19` jusqu'au
  2026-10-17, que Julie a refusé), à augmenter à chaque modification d'un fichier de SHELL ;
  le générateur réécrit seul la liste des enquêtes de SHELL. Une nouvelle
  version ne recharge JAMAIS la page : un bandeau propose « Recharger ». Banc :
  `tools/conviction-pwa.mjs` (`--enligne` pour la production) ; il lit le cache
  depuis un onglet à part, car un cache ouvert dans une page bloque sa
  suppression, et `waitForFunction` ne patiente pas sur une promesse.
  Interface (`conviction/ui/`) : une partie = la liste de ses actions
  (`state.js`, testé par `conviction-partie.test.mjs`) ; annuler, rétablir et
  la sauvegarde en découlent, « Recommencer » est une action et s'annule. Le
  chronomètre part au premier geste et s'arrête quand la page est cachée. Le
  plan est construit UNE fois, chaque rendu met à jour les cases existantes
  (focus clavier, animation du pion). Toucher un visage le choisit
  TOUJOURS (le désélectionner vidait la bulle au premier geste). Une puce
  posée porte un point NEUTRE : le vert (juste) et le rouge (contredit)
  n'arrivent qu'après « Vérifier », qui nomme les personnes contredites ; une
  coche verte sur un pion faux trompait. Jamais d'opacité sur une puce.
  **Les murs ne sont PAS des bordures de case** (`.ombre::before`, à cheval
  sur la limite) : une bordure mangeait l'intérieur et les cases contre un mur
  étaient plus petites (surlignage jaune inégal, vu par Julie). Les motifs de
  sol sont en % de la case, pour que les joints tombent pareil partout ;
  `conviction-enquetes-ui.mjs` vérifie cases et lueurs de même taille.
  Témoignage éclairé : Facile seulement par défaut (réglage `light: 'auto'`).
  Plan juste : outils effacés sauf « ⋯ », pièce de la victime éclairée,
  accusation amenée à l'écran ; un innocent accusé compte dans le bilan
  (`game.wrong`). À 7-8 personnes, les visages défilent sur une rangée. Banc :
  `tools/conviction-ui.mjs` (`--planche` refait `docs/conviction-planche-etape3.png`),
  qui mesure les contrastes EN COMPTANT l'opacité et ne parle pas au réseau.
  **Chapitres** : deux difficultés d'une histoire = deux chapitres qui se
  suivent (`CHAPITRES` et `suite()` dans `conviction-histoires.mjs`) : le
  coupable du 1er sort, sa victime aussi, quelqu'un d'autre meurt, autre
  coupable, autre pièce, même décor. Julie trouvait deux variantes « même
  histoire, mêmes gens, même coupable » sans intérêt (2026-10-15).
  `--looks` recopie visages et tenues des histoires sans tout recalculer.
  Moyen Âge (Westeros, Macbeth, Hamlet) : `pourpoint` ou `tunique`, JAMAIS
  costume-cravate (vu par Julie).
  **Scène d'accusation** (`ui/scene.js`, maquette validée :
  `docs/conviction-scene.png`) : plein écran, le cri, la preuve, la chute, les
  barreaux ; un innocent proteste. Toucher avance, « Passer », Échap ; rien ne
  bouge en animations réduites. Les gros plans sont des BUSTES (`ui/buste.js`,
  carré de 120, contour d'un seul tenant, planche :
  `node tools/mockup-conviction-bustes.mjs <png> "s=160&k=10"`)  ; `portraits.js` est SUPPRIMÉ (2026-10-16).
  ⚠️ Un visage = un dessin NEUF à chaque copie : une copie partagée mettait
  les mêmes identifiants de dégradés dans la page, et dès que la première
  était cachée (pion déplacé) les autres visages devenaient NOIRS. Le banc
  `conviction-ui.mjs` vérifie qu'aucun identifiant n'est en double.
  **Taille du texte** : texte en rem (`<meta name="text-scale">` pour Android,
  `-apple-system-body` pour iOS) ; le plan garde ses px (étiquettes, notes).
  Vérifié à 130 % et 200 % : aucun défilement horizontal, les rangées d'outils
  se replient. Transition de page entre accueil et enquête : ESSAYÉE puis retirée (Chrome lève « ViewTransition opt-in disabled » à l'arrivée sur l'enquête, banc arcade en échec).

## L'arcade (la page d'accueil)

`index.html` à la racine est une app installable, « Arcade », qui réunit les jeux :
UNE installation, tous les jeux hors ligne (voulu par Julie le 2026-10-05,
direction « mosaïque »).

- **Elle ne contient aucun jeu.** Elle enregistre elle-même le service de chaque
  jeu (`register('./<jeu>/sw.js', {scope})`), et chacun range ses propres fichiers.
  Les jeux restent autonomes : mêmes adresses, mêmes caches, mêmes mises à jour,
  et chacun reste installable seul.
- **Son service (`sw.js` racine) ne répond QUE pour la page d'accueil**, ses polices
  et les icônes des jeux. Tout autre fichier d'un dossier de jeu appartient au
  service de ce jeu : sans cette garde, hors ligne, l'arcade servirait sa propre
  page à la place d'un jeu.
- **« hors ligne » ne s'affiche que si son propre service est actif aussi.** Une
  faute de syntaxe dans `sw.js` l'empêchait de s'enregistrer sans rien dire, et la
  page annonçait quand même que tout était prêt.
- **La grande tuile est le dernier jeu joué** (`arcade-dernier`). L'arcade partage
  l'adresse des jeux, donc elle peut lire leurs sauvegardes (`encours`).
- **Petit Plus contre Petit Minus n'y entre JAMAIS** (dit par Julie) : c'est un
  outil pour un enfant, il garde sa propre icône et son adresse.
- `VERSION` (`arcade-x.y.z`) n'existe que dans le `sw.js` racine. Banc :
  `arcade-pwa.mjs` (`--enligne` pour la production).

## Carte de `toto/index.html`

Un seul fichier d'environ 3 000 lignes : pour s'y retrouver, chercher le NOM de
fonction ou de table, jamais un numéro de ligne. Chaque système, où il vit, et le
banc qui le vérifie (tous dans `tools/`).

- **Monde dehors** : `WORLD`, `FP`/`floorY` (le fond), `GATES` (écluse, digue,
  barrière), `GROTTOS`. **Les zones se déclarent dans `ZL`** : `zoneAt`, `zw`,
  `zoneFill` et tous les tableaux par zone (`DEEP`, `SPAWN`, `N.zone`) suivent ;
  ajouter une zone = une limite dans `ZL` et une entrée de plus dans chacun.
  Chaque verrou exige l'alpha de SA zone. Bancs `toto-golfe`, `toto-cadres`.
- **La requin** : `updPlayer` (nage, faim, pression, portes, parois), `bite` et
  `preyInMouth` (morsure automatique au contact), `dash`, `taille` (+4 % par
  niveau), `drawShark` (habits `HAB`, 4e niveau propre à chaque habit). Mutations
  `EVOS`, `cost`, `evMax` (4e niveau après le Grand Bassin), bonus d'habit
  `HABIT_BONUS`/`habitPorte`. Bancs `toto-requin`, `toto-bonus`, `toto-niveaux`.
- **Bêtes et alphas** : `TYPES`, `mkEnt`, `updEnt` puis `bossAI` (cercle,
  élan, charge, étourdi, se débat), `BOSSES` (un alpha d'intérieur a `lieu` et
  `tile`), `hurt`/`kill`, `facteurAlpha`. Une bête plus petite que `.75 × P.r`
  est AVALÉE d'un coup : tout ce qui doit survivre à son apparition doit être
  plus gros, ou `intouchable` un instant. Bancs `toto-boss`, `toto-bestiaire`.
- **Intérieurs** (épave, égouts, Grand Bassin, labo) : `PLANS` (plans en grille,
  lettre par lettre, `portes` lettre -> [lieu, arrivée]), `creerInt`, `allerA`,
  `passerBreche`, `murInt`/`resoudreMurs`, `peuplerInt`, `drawInterieur`,
  `noirInt`/`lueursInt`. Chaque plan se vérifie atteignable (BFS) avant d'être
  collé. Bancs `toto-epave`, `toto-veuve`, `toto-egouts`.
- **Ce qui se casse** : `CASSABLES` (grille et vitre à la morsure d'os ;
  bocaux, cuves, vitre du Spécimen au SPRINT), `briser`, `sprintCasse`,
  `ancre` (les coups se comptent par objet, pas par case). Ce qui est cassé et
  qui ouvre un passage est sauvé dans `P.monde.casse`.
- **Grand Bassin** : `VAGUES` (25 vagues nommées, puis 11 à 25 en boucle),
  `lancerVague`, `updArene`, décor `bassinFond`/`bassinDessus`, public
  `spectateur`/`drawVitre`. Bancs `toto-arene`, `toto-aquarium`.
- **Labo et Spécimen Zéro** : `drawLabo` (cuves `EXPOS`, `CAPTIFS`),
  `alerter`/`gardes`, `updLabo`, `specimen` (3 phases : vitre, miroir de
  l'habit, plafond qui descend et alliés), `updOnde`/`drawOnde`, `finJeu`.
  Banc `toto-labo` (robot équipé en fin de partie, 4es niveaux).
- **Les géants** (ni proies ni ennemis, aucun objectif ne les annonce) : la Grande
  Blanche pendue à la jetée du port (`POTENCE`, `potence`, `drawBlanche`) et le
  mégalodon qui passe au fond du golfe sombre (`megaZone`, `updGeants`, `drawMega`,
  dessiné AVANT le sol pour passer derrière le relief ; sa forme `megaForme` est
  le contour de notre requin, d'un seul trait). Le narrateur n'en parle qu'une
  fois (`P.vus.blanche`, `P.vus.mega`, sauvés). Banc `toto-geants`.
- **Narrateur** : `N` (répliques, souvent des listes), `dire(sujet)` (au hasard,
  jamais deux fois de suite, délai par sujet dans `DELAI`), `say`, `sayApres`.
  Objectifs `OBJ` et `objectiveId` (`objectiveId(true)` = l'étape de l'histoire,
  sans « muter », pour le guidage).
- **Palmarès** : `EXPLOITS`, `exploit`, `TROPHEES`/`drawTrophees`, sauvé à part
  dans `toto-palmares` : une mort ne l'efface jamais, une NOUVELLE PARTIE si
  (`nouvellePartie`, après confirmation). Bancs `toto-nouvelle`, `toto-trophees`.
- **Interface** : `updHud`, `renderEvo` (habits en cartes), `onglet`
  (Mutations, Nutriments, Palmarès), `drawMini`. Bancs `toto-ui`,
  `toto-nutriments`, `toto-habits-grotte`.
- **La boucle** : `frame` relance `requestAnimationFrame` EN PREMIER (une
  erreur dans une image ne fige plus le jeu). Jamais de `ctx.filter` (images de
  300 ms) : un voile clair pour les flashs. Images/s : `toto-decor` (avec la
  carte graphique). Chasse aux bugs : `toto-chaos` (robot au hasard partout).

## Vérifier

Les contrôles vivent dans `tools/`, en Node, sans rien à installer :

```bash
node tools/perft.js
node tools/perft-dames.js
```

`perft` compte les coups légaux à plusieurs profondeurs et les compare à des
références connues : c'est ce qui prouve un moteur, pas une partie jouée à la
main. Les scripts `chevalier-*.mjs` et `echecs-*.mjs` couvrent le reste
(parcours, PWA en ligne, difficulté, icônes).

**Un service worker refuse `file://`.** Toute vérification passe donc par
`tools/serveur.mjs`, qui sert le dépôt sur `127.0.0.1`.

**Rien ne se règle au jugé.** Une difficulté, une vitesse, un équilibrage se
mesurent avec un banc. Et un banc ment tant qu'on n'a pas vérifié où il pose
sa cible : contrôler le banc avant de croire ses chiffres.

## Ajouter un jeu

Un dossier à la racine avec ses `index.html`, `manifest.json` et `sw.js`,
**plus** une ligne dans le tableau du `README.md`, une ligne dans `JEUX` de
l'`index.html` racine (nom, couleur du jeu, couleur de son texte), son icône dans
`SHELL` du `sw.js` racine, et `VERSION` de l'arcade augmentée. `arcade-pwa.mjs`
attend la liste des jeux : l'y ajouter aussi. Sa version commence à `1.0.0`, avec
son `docs/<jeu>-versions.md` et une ligne dans `JEUX` de `tools/versions.test.mjs`.

## Écriture

Textes en français. Les messages de commit disent **ce qui cassait** avant de
dire ce qui change.
