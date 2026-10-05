# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Julie et ses proches, sur leur téléphone Android (Pixel 9a pour Julie), tenu en PORTRAIT, à une main, dans des moments courts. Le jeu doit se comprendre sans qu'elle l'explique, parce qu'elle le fait essayer à d'autres.

## Product Purpose

La bataille que tout le monde connaît, mais les cartes se battent pour de vrai. 32 cartes partagées en deux paquets ; chaque mois, les cinq cartes du dessus de chaque camp entrent sur le tapis et se battent seules, colonne par colonne. Une carte vaincue change de camp. Une partie dure une année : douze mois, douze constellations, chacune change une règle. Le succès : une partie de quelques minutes qu'on relance, où l'on sent que placer ses cartes et lancer un arcane au bon moment a pesé.

## Positioning

Ni un jeu de cartes à collectionner, ni un auto-battler à boutique : un seul paquet de 32 cartes, aucune monnaie, aucune progression à acheter. Le hasard de la bataille reste, on y ajoute deux décisions lisibles (l'ordre des cartes, le moment de l'arcane).

## Operating Context

PWA installée depuis GitHub Pages (`replica-n8n.github.io/games/bataille/`), hors ligne, sans compte. Tactile seulement. Le pouce reste en bas de l'écran : les arcanes et l'action principale s'y trouvent, le ciel et le compte se lisent en haut.

## Capabilities and Constraints

- Né d'un prototype en paysage (un seul `index.html`, canvas vanilla) ; la version portrait est en maquette (`tools/mockup-bataille-portrait.html`), disposition A retenue le 2026-10-05 : tes cartes en bas, elles montent.
- Vanilla JS, aucune dépendance ni étape de build, service worker maison, polices hébergées dans le dossier.
- Systèmes en place : placement (échanger deux cartes), combat automatique, égalité qui appelle une carte de plus, douze règles de mois, sept arcanes, adversaire qui lance les siens.
- Undecided : direction visuelle (trois en maquette), son et vibrations, sauvegarde d'une partie en cours, placement à l'aveugle ou non.

## Brand Commitments

- Les cartes sont des personnages : des yeux, des jambes, une arme selon leur rang. C'est la signature du jeu, le reste de l'écran reste calme.
- Le ciel du mois se voit : la constellation et sa règle sont toujours à l'écran.
- Les cartes à jouer gardent leurs couleurs d'objet ; toutes les autres couleurs sont calculées (`tools/bataille-couleurs.mjs`).
- Pas de publicité, pas de monétisation, pas de compte.
- Jamais de tiret cadratin dans les textes.

## Evidence on Hand

Le prototype jouable (`bataille/index.html`), la maquette portrait et ses captures (`bataille/docs/`), les douze règles et les sept arcanes écrits dans le code. Aucun son, aucune donnée de joueurs, aucun équilibrage mesuré.

## Product Principles

1. Une règle se montre, elle ne s'explique pas : la règle du mois tient en une phrase, le reste se voit sur le tapis.
2. Ce qui se touche est en bas : aucune action au-dessus du tapis.
3. Un chiffre ne couvre jamais une jauge, une carte ne cache jamais sa rivale.
4. Chaque carte prise se voit changer de camp.

## Accessibility & Inclusion

Texte de 14 px minimum, cibles de 44 px espacées de 8 px, contrastes calculés (4,5:1 ; 3:1 pour le gros texte et les formes), `prefers-reduced-motion` et `prefers-reduced-transparency` respectés, aucune information portée par la seule couleur (les deux camps se distinguent aussi par leur côté de l'écran et le dos de leurs cartes).
