---
name: Teeth of the Ocean
description: Interface du jeu toto en panneaux de plage, signalisation de sécurité émaillée posée sur la chasse.
colors:
  jaune: "#F5B800"
  rouge: "#B3261E"
  bleu: "#1F5AA6"
  vert: "#1E7B4A"
  violet: "#5E3A8C"
  email: "#F3F1EA"
  encre: "#14263B"
  deep: "#04202E"
  blanc: "#FFFFFF"
typography:
  display:
    fontFamily: "'Big Shoulders Stencil', Impact, sans-serif"
    fontSize: "clamp(34px, min(8.5vw, 13vh), 72px)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Big Shoulders Stencil', Impact, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.05em"
  title:
    fontFamily: "'Big Shoulders Stencil', Impact, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "'Barlow Semi Condensed', system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.35
  label:
    fontFamily: "'Barlow Semi Condensed', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.05em"
  narration:
    fontFamily: "'Barlow Semi Condensed', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  xs: "2px"
  sm: "4px"
  plaque: "6px"
  rond: "50%"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
components:
  panneau-statut:
    backgroundColor: "{colors.jaune}"
    textColor: "{colors.encre}"
    rounded: "{rounded.plaque}"
    padding: "8px 12px"
    width: "196px"
  tableau:
    backgroundColor: "{colors.email}"
    textColor: "{colors.encre}"
    rounded: "{rounded.plaque}"
    padding: "12px 16px 14px"
  tableau-entete-info:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    typography: "{typography.headline}"
    padding: "10px 14px"
  tableau-entete-sur:
    backgroundColor: "{colors.vert}"
    textColor: "{colors.blanc}"
    typography: "{typography.headline}"
    padding: "10px 14px"
  tableau-entete-danger:
    backgroundColor: "{colors.rouge}"
    textColor: "{colors.blanc}"
    typography: "{typography.headline}"
    padding: "10px 14px"
  button-primary:
    backgroundColor: "{colors.encre}"
    textColor: "{colors.blanc}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-alt:
    backgroundColor: "transparent"
    textColor: "{colors.encre}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-foncer:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    typography: "{typography.label}"
    rounded: "{rounded.rond}"
    size: "92px"
  button-grotte:
    backgroundColor: "{colors.vert}"
    textColor: "{colors.blanc}"
    typography: "{typography.label}"
    rounded: "5px"
    padding: "0 14px 0 10px"
    height: "48px"
  button-pause:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.email}"
    rounded: "{rounded.plaque}"
    size: "48px"
  bande-objectif:
    backgroundColor: "{colors.email}"
    textColor: "{colors.encre}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    width: "164px"
---

# Design System: Teeth of the Ocean

## Overview

**Creative North Star: "Panneaux de plage"**

L'interface est faite des panneaux que les humains plantent sur la côte pour signaler la requin. Le monde dessiné sur canvas mène ; les panneaux HTML se posent dans les coins, s'effacent derrière la chasse et ne parlent que par le code de la signalisation de sécurité (ISO 7010) : jaune avertissement, rouge danger, bleu action obligatoire, vert zone sûre, violet drapeau « faune dangereuse ». Chaque couleur a un sens, et ce sens est toujours doublé d'un pictogramme ou d'un mot.

Les panneaux sont des plaques émaillées : aplat plein, filet intérieur à 3 px du bord, quatre rivets aux coins, légère ombre portée qui les décolle du décor. Les titres sont peints au pochoir, le reste est écrit dans une grotesque condensée de type routier. Les états s'écrivent sur le panneau lui-même (hachures d'alerte quand une jauge devient critique, secteur sombre qui se retire sur Foncer pendant la recharge) plutôt que dans un voyant ajouté.

Le système refuse le HUD de jeu mobile en cartes sombres translucides à un seul accent. Le narrateur, lui, n'est pas un panneau : c'est une voix off en sous-titre italique, blanc sur l'image.

**Key Characteristics:**
- Couleurs de sécurité à sens fixe, jamais décoratives, toujours doublées d'un pictogramme ou d'un mot.
- Plaques émaillées opaques : filet intérieur, rivets, ombre douce ; aucun verre, aucune transparence de carte.
- Pochoir pour nommer, grotesque condensée pour lire, italique pour la voix off.
- Pictogrammes dessinés en SVG, un seul dessin par idée, réutilisé partout.
- L'état s'écrit sur le panneau (hachures, secteur de recharge, soulignement ondulé du manque).

## Colors

Une palette de signalisation : cinq encres de sécurité saturées sur un émail blanc cassé et une encre marine, au-dessus d'une eau très sombre.

### Primary
- **Jaune avertissement** (`jaune`) : le panneau de statut (stade, niveau, jauges, nutriments), l'écran titre en panneau triangulaire, la bande hachurée de l'objectif, le premier drapeau d'infamie, l'objectif rappelé en pause, l'anneau de focus clavier. Le texte posé dessus est toujours l'encre marine.

### Secondary
- **Bleu obligation** (`bleu`) : ce que le joueur peut ou doit faire. Foncer (panneau rond), Pause (carré), en-tête des avis (pause, tourner le téléphone), texte et pictogramme de l'aide de premier contact sur émail.
- **Vert zone sûre** (`vert`) : la grotte et rien d'autre. Bouton Grotte, en-tête du tableau de mutation.
- **Rouge danger** (`rouge`) : la vie, le boss (étiquette « Danger » et sa barre), la mort (« Plage fermée »), les ressources qui manquent, le deuxième drapeau d'infamie, les hachures critiques.

### Tertiary
- **Violet faune dangereuse** (`violet`) : réservé au troisième drapeau du mât d'infamie, le rang où la côte se déclare en danger.

### Neutral
- **Émail** (`email`) : fond des tableaux d'affichage, du plan, de la bande d'objectif, de la barre de boss, de l'aide ; mât et anneau intérieur de Foncer.
- **Encre marine** (`encre`) : tout le texte sur émail et sur jaune, bouton principal, pastille « Mutation possible », contour des drapeaux, jauge Ventre. Sert aussi de `theme-color`.
- **Eau profonde** (`deep`) : fond de page sous le canvas.
- **Blanc pur** (`blanc`) : texte sur les aplats bleu, vert et rouge, sous-titres du narrateur, bouton posé dans un en-tête coloré.

### Named Rules
**The Code de sécurité Rule.** Une couleur de sécurité signifie toujours la même chose (jaune = attention et statut, rouge = danger et perte, bleu = action, vert = refuge, violet = alerte maximale). Ne jamais la choisir pour son allure.

**The Jamais seule Rule.** Aucune information ne repose sur la couleur seule : chaque aplat porte un pictogramme ou un mot, chaque jauge porte son nom écrit, chaque manque est dit (« manque 8 ») et souligné d'une vague.

**The Émail opaque Rule.** Les panneaux sont des aplats pleins. Les seules transparences admises sont le voile des tableaux (`rgba(4,20,32,.62)`), les pistes de jauge et le secteur de recharge.

## Typography

**Display Font:** Big Shoulders Stencil 800 (avec Impact, sans-serif)
**Body Font:** Barlow Semi Condensed 500, 700 et 500 italique (avec system-ui, sans-serif)

**Character:** Le pochoir est la peinture des panneaux officiels ; la condensée est le lettrage routier, dense et lisible d'un coup d'œil sur un téléphone en paysage. Les deux polices sont hébergées dans `polices/` pour s'afficher pareil hors ligne.

### Hierarchy
- **Display** (800, clamp(34px, min(8.5vw, 13vh), 72px), 0,9, capitales) : le titre du jeu sur le panneau d'avertissement de l'écran titre.
- **Headline** (800, 26px, 1, capitales, 0,05em) : en-têtes des tableaux (« Avis : pause », « Grotte : zone sûre », « Plage fermée »).
- **Title** (800, 20px, 1, capitales, 0,04em) : le stade sur le panneau de statut. L'étiquette « Danger » du boss (16px) et les textes flottants majeurs du canvas suivent la même voix.
- **Body** (500, 15px, 1,35, 62ch au plus) : paragraphes des tableaux, sous-titre du titre, réserves de la grotte.
- **Label** (700, 14px, capitales et 0,05em sur les boutons) : noms des jauges, nutriments, coûts, boutons, bande d'objectif. Les chiffres passent en `tabular-nums`.
- **Narration** (500 italique, 16px, 1,3) : sous-titres du narrateur, blanc avec ombre portée, centrés en haut.

### Named Rules
**The Pochoir nomme Rule.** Le pochoir est réservé à ce qui nomme : titre, en-tête de tableau, stade, « Danger ». Jamais pour une phrase ni pour un chiffre qu'on lit en jouant.

**The Plancher 14 Rule.** Aucun texte HTML sous 14px. Le canvas garde ses enseignes de décor en 12px (Barlow 700), qui font partie du monde et non de l'interface.

## Layout

Surface paysage à un pouce, pensée pour environ 756x308 à 915x412 CSS. Le HUD occupe les deux coins hauts, les actions le coin bas droit, et le centre reste à la chasse.

- **En haut à gauche :** le panneau de statut jaune (196px, 178px sous 640px de large), trois jauges en grille (nom 74px, barre 9px de haut), puis les quatre nutriments.
- **À sa droite :** le mât d'infamie (34x118), absent tant que l'infamie est nulle.
- **En haut à droite :** Pause (48px) puis le plan de la côte (156x44), et dessous la bande d'objectif (164px).
- **En haut au centre :** les sous-titres du narrateur, largeur `max(220px, 100vw - 520px)` pour ne jamais toucher les coins.
- **En bas au centre :** la barre de boss, `min(400px, 50vw)`.
- **En bas à droite :** Grotte puis Foncer, séparés de 12px.
- **Tableaux :** centrés sur un voile, `min(600px, 100%)` (640px pour le titre), hauteur limitée à l'écran avec défilement du corps.

Rythme d'espacement sur quatre pas : `e1` 4px, `e2` 8px, `e3` 12px, `e4` 16px. Toutes les marges de bord ajoutent `env(safe-area-inset-*)`. En portrait sur écran tactile, un tableau bleu demande de tourner le téléphone.

## Elevation & Depth

Système presque plat : les panneaux sont des aplats opaques, décollés du décor par une ombre douce unique. Aucune ombre dure décalée, aucun verre.

### Shadow Vocabulary
- **Plaque** (`box-shadow: 0 2px 6px rgba(0,0,0,.35)`) : panneau de statut, plan, Pause, bande d'objectif, barre de boss.
- **Bouton d'action** (`box-shadow: 0 2px 8px rgba(0,0,0,.4)`) : Foncer et Grotte, un cran plus haut pour le pouce.
- **Tableau** (`box-shadow: 0 6px 24px rgba(0,0,0,.45)`) : tableaux d'affichage au-dessus du voile.
- **Voix off** (`text-shadow: 0 1px 2px #000, 0 2px 10px rgba(0,0,0,.8)`) : lisibilité du narrateur sur n'importe quel décor.

### Named Rules
**The Posé, pas flottant Rule.** Une plaque est vissée sur la scène : ombre courte et sombre, jamais de halo coloré ni de lévitation au survol.

## Shapes

Des plaques rectangulaires aux angles à peine arrondis (6px), un filet intérieur de 1,5px en couleur du texte à 55 % d'opacité et à 3px du bord (rayon 4px), et quatre rivets de 1,6px à 7px des coins. Les petites pièces descendent à 4px (boutons, bande d'objectif, barre de boss), 3px (pastilles) et 2px (pistes de jauge). Seul Foncer est rond, comme le panneau d'obligation, avec un anneau émail de 3px en retrait de 6px. Les drapeaux du mât sont des flammes à queue d'aronde, contour encre.

Motifs récurrents : hachures d'alerte à -45° (jaune et encre, 5px et 5px) sur la bande d'objectif, hachures rouge et encre sur une jauge critique, pointillés encre et émail (9px et 2px) sur la Croissance.

## Components

### Buttons
Des panneaux qu'on presse : aplats pleins, capitales espacées, retour tactile par écrasement.
- **Shape :** coins de 4px sur les tableaux, 5px pour Grotte, 6px pour Pause, rond pour Foncer.
- **Primaire :** encre marine, texte blanc, 44px de haut au moins, 18px de marge latérale.
- **Alternatif :** transparent, texte encre, contour intérieur de 2px en encre.
- **Désactivé :** encre à 14 % en fond, texte encre à 78 %.
- **Dans un en-tête coloré :** blanc, texte encre (« Ressortir »).
- **Focus :** anneau jaune de 3px décalé de 3px. **Actif :** `scale(.95)` sur les boutons d'action.

### Foncer (signature)
Panneau rond d'obligation de 92px, bleu, anneau émail intérieur, pictogramme double chevron de 32px au-dessus du mot. La recharge est un secteur conique encre à 62 % qui se retire.

### Cards / Containers
- **Panneau de statut :** plaque jaune rivetée, texte encre.
- **Tableau d'affichage :** plaque émail rivetée, en-tête en aplat de couleur de sécurité avec pictogramme 30px et titre au pochoir, corps en 12px et 16px de marge.
- **Plan :** plaque émail à filet, 4px de marge, carte en canvas.
- **Écran titre :** tableau jaune en ligne, triangle d'avertissement dessiné en SVG à gauche (aileron sur vagues).

### Jauges
Piste encre à 22 %, 9px, coins de 2px ; remplissage rouge (Vie), encre (Ventre) ou pointillé encre et émail (Croissance), transition 0,15s. Sous le seuil critique, le remplissage passe aux hachures rouge et encre.

### Bande d'objectif
Émail, 14px gras, avec une tranche hachurée jaune et encre de 12px à gauche. Un nouvel objectif tombe de 8px en 0,35s.

### Mât d'infamie
Mât émail ; chaque rang hisse un drapeau plein (jaune, rouge, violet) ; le drapeau suivant monte le long du mât à 55 % d'opacité, contour pointillé, selon l'infamie.

### Mutation (grotte)
Lignes séparées par un filet encre à 18 % ; nom 16px gras, niveau « 0 / 3 », description 14px, coûts à pictogramme. Une ressource qui manque passe au rouge et dit « manque N » souligné d'une vague. Les mutations verrouillées tiennent en une ligne avec un cadenas.

### Pictogrammes
Sprite SVG unique (`symbol`, viewBox 24), dessinés en plein, `fill: currentColor`, taille à `1em` : protéines, lipides, minéraux, mutagène, pause, foncer, grotte, cadenas, info, croix, doigt, aileron.

## Do's and Don'ts

### Do:
- **Do** donner à chaque couleur de sécurité son seul sens, et la doubler d'un pictogramme SVG ou d'un mot.
- **Do** construire tout nouveau panneau comme une plaque émaillée : aplat opaque, coins de 6px, filet intérieur, rivets, ombre `0 2px 6px rgba(0,0,0,.35)`.
- **Do** écrire l'état sur le panneau (hachures, secteur, soulignement ondulé) plutôt qu'ajouter un voyant.
- **Do** réserver le pochoir à ce qui nomme et garder tout texte HTML à 14px au moins, cibles à 44px au moins.
- **Do** ajouter un pictogramme au sprite existant, un dessin par idée, plutôt qu'un caractère ou une icône externe.
- **Do** couper animations et transitions sous `prefers-reduced-motion`.

### Don't:
- **Don't** revenir au HUD de jeu mobile en cartes sombres translucides à un seul accent.
- **Don't** poser du verre, du flou ou une carte semi-transparente sur la chasse.
- **Don't** mettre le narrateur dans un panneau : il reste une voix off en sous-titre.
- **Don't** employer le vert hors de la grotte ni le violet hors du troisième drapeau.
- **Don't** charger une police depuis un CDN : tout est dans `polices/`.
