# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Julie et ses proches, sur leur téléphone Android (Pixel 9a pour Julie), tenu en paysage, souvent à une main ou dans des moments courts. Pas de public large à conquérir : le jeu doit pourtant se comprendre sans que Julie l'explique, parce qu'elle le fait essayer à d'autres.

## Product Purpose

Un action-RPG 2D en vue de profil : une jeune requin-bouledogue mange, grandit (Bébé, Ado, Adulte, Ancienne), mute dans des grottes, terrasse trois alphas, force les verrous entre trois zones (Bayou des Crocs, Plage Dorée, Grand Large) et se venge du Capitaine Rustin. Titre provisoire « Teeth of the Ocean » (dossier `toto/`), prototype d'origine nommé « Mâchoires » ; aucun titre n'est définitif. Le succès : une session qu'on a envie de reprendre, où l'on sent qu'on devient le prédateur.

## Positioning

Inspiré de Maneater, mais en profil, jouable à un pouce, et porté par un narrateur de documentaire animalier pince-sans-rire. Ce n'est pas un jeu de score infini à la Hungry Shark : il y a une carte à clés (chaque verrou exige l'alpha de sa zone), une progression visible (le requin grossit, la caméra dézoome) et une fin.

## Operating Context

PWA installée depuis GitHub Pages (`replica-n8n.github.io/games/toto/`), hors ligne, sans compte. Tactile : glisser n'importe où pour nager, la morsure part seule au contact, les boutons en bas à droite servent aux actions spéciales (Foncer, Grotte), un bouton d'options met en pause. Clavier et manette possibles mais secondaires. Parties courtes, souvent interrompues : la sauvegarde n'a lieu que dans les grottes.

## Capabilities and Constraints

- Paysage seulement ; en portrait, on demande de tourner le téléphone.
- Vanilla JS, un seul `index.html` dessiné sur canvas, aucune dépendance ni étape de build, service worker maison, polices hébergées dans le dossier.
- Systèmes en place : croissance et niveaux, faim (« Ventre »), nutriments (protéines, lipides, minéraux, mutagène), 6 évolutions à 3 niveaux, infamie à 3 rangs avec bateaux de chasseurs et Rustin, trois alphas, écluse et digue, grottes (soin, sauvegarde, mutation).
- Undecided : son et vibrations (absents), musique, fin narrative au-delà de « Démo terminée ».

## Brand Commitments

- Le narrateur est l'identité du jeu : voix de documentaire animalier, flegmatique, légèrement cynique, phrases courtes à chute comique, jamais de vulgarité ni de « appuie sur X ».
- Sensation de prédateur avant le contenu : morsure, sprint et saut doivent être jouissifs.
- Pas de gore réaliste : sang cartoon en nuages, pas de démembrement. Pas de publicité ni de monétisation.
- Carte, histoire et fin ; progression par clés logiques, jamais par murs arbitraires.
- Nom, personnages et visuels 100 % originaux (Maneater n'est qu'une inspiration).
- Jamais de tiret cadratin dans les textes.

## Evidence on Hand

Le jeu en ligne et son code (`toto/index.html`), les répliques du narrateur (objet `N` du script), les décors dessinés (cyprès, cabanes, écluse, ville, port, phare), les captures `tools/captures/toto-*.png`. Aucun son, aucune illustration peinte, aucune donnée de joueurs.

## Product Principles

1. Une fonction que rien n'annonce n'existe pas : on l'annonce par un contrôle visible ou par le narrateur, pas par une notice.
2. Le jeu parle par sa voix : les consignes, objectifs et échecs passent par le narrateur quand c'est possible.
3. Le monde mène, l'interface s'efface : le HUD ne doit jamais masquer la chasse.
4. Chaque passage se mérite et se voit : zones, verrous, niveaux et mutations ont un signal clair.

## Accessibility & Inclusion

Texte de 14 px minimum, cibles de 44 px espacées de 8 px, contrastes calculés (4,5:1), `prefers-reduced-motion` respecté (secousses et flashs), ne jamais coder une information par la seule couleur.
