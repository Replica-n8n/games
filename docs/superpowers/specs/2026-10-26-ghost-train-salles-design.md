# Ghostel (Ghost Train 2) : l'hôtel en salles

Date : 2026-10-26. Branche `train-fantome`. Remplace la spec du 2026-10-24 pour tout
ce qui touche au décor, au déroulé et aux écrans ; le ton, la direction « Série B »,
le public 8+ et la difficulté unique restent.

## Pourquoi

Julie a joué la 1.6.0 : « les stages sont pauvres, on dirait la même texture qui se
répète ». Le couloir de raycaster ne donne ni lieux ni mise en scène. Elle a joué la
maquette des salles (`tools/poc/salles/`, page privée E1pVwtLDnPTes5uAmryuAi) et l'a
validée : « oublie le jeu actuel, je préfère les maquettes ». Décisions :

- **Plus de train ni de wagon** : tout l'écran est à la pièce. On glisse d'une salle
  à l'autre par un panoramique.
- **Oublier Halloween** : pas de citrouilles ni de date à tenir.
- **Le jeu actuel est abandonné** : le code du couloir (raycaster, rails, aiguillage,
  levier, portique, gare du quai de minuit, wagon, appareil) sort du jeu. Il reste
  dans l'historique git (dernier état : `fe28e3e`, version 1.6.0).

## Ce qu'on garde de la maquette

- Des pièces **peintes vues de face** en 320 x 180, en perspective vers un point de
  fuite, avec une lumière tramée (`peinture.js`), peintes UNE fois hors écran.
- Quatre **cachettes** par salle, qui préviennent 0,8 s avant de s'ouvrir (« ! » qui
  rebondit, halo, et un signe propre à la cachette : porte qui tremble, feu vert,
  éclair, couvercle qui saute).
- Un **décor qui se vise** : un objet qui tombe sur les fantômes (lustre, casseroles),
  un objet plein de pièces (vase, bocal).
- La **fausse alerte** (le chat noir, qu'on ne capture pas) et le **« BOU ! »**.
- Un fantôme qui arrive jusqu'à nous **frappe** : un cœur de moins, la bave verte.
- Le **rayon** qu'on garde appuyé, la **chauffe** et la surchauffe.
- **Le doigt vise 22 px au-dessus de lui** ; à la souris, le viseur est sous le curseur.

## Le manoir : 4 missions de 3 salles

Chaque mission a son geste (comme la 1.6.0) et finit par son boss dans la 3e salle.
Une salle dure 30 à 40 s ; une mission environ 2 min.

| Mission | Salles | Geste ajouté | Boss |
|---|---|---|---|
| 1. Le rez-de-chaussée | Salon, salle à manger, cuisine | viser le décor | le Majordome (assiettes) |
| 2. La bibliothèque | Bureau, bibliothèque, archives | le FLASH (révèle, étourdit, brise les protections) | le Bibliothécaire (livres en orbite) |
| 3. La salle de bal | Vestibule, salle de bal, kiosque | le RYTHME et la SUPER-attaque | le Chef d'orchestre |
| 4. Le grenier | Chambre, nursery, grenier | le SLAM | la Gouvernante (bouclier) |

Les 12 fantômes et boss déjà dessinés (Goule, Drap, Ombre, Livre, Saxophoniste, Crâne,
Majordome, Bibliothécaire, Chef, Gouvernante, Lumi) servent tels quels. Lumi revient
en mission 2 : le fantôme timide à NE PAS capturer (viseur rose).

## Les écrans

- **Titre** : le nom, « Toucher pour jouer », « Installer le jeu » tant que le jeu
  n'est pas installé, réglages.
- **Le plan du manoir** (remplace la gare) : la façade du manoir la nuit, quatre
  étages, une mission par étage ; on touche un étage éclairé, puis « Entrer ». Un
  étage pas encore ouvert reste noir avec un cadenas. Chaque mission montre sa
  meilleure note et ses pièces.
- **Pause**, **défaite** (rejouer, plan), **bilan** de mission (fantômes capturés,
  pièces, cœurs, note S/A/B/C, temps).
- **Réglages** repris de la 1.6.0 : volumes, gaucher, flashs réduits, secousses.

## Ce qui ne change pas

- PWA vanilla, modules ES, aucune dépendance ; `moteur/` PUR (aucun DOM, hasard à
  graine) qui tourne dans Node ; `contenu/` = données ; `ecran/` lit sans modifier.
- Robots expert et enfant, contrôle par salle : l'enfant capture au moins 80 % et la
  mission ne dépasse pas 15 % de défaites ; l'expert ne perd jamais.
- Une seule toile 320 x 180, jamais `putImageData` dessus (Android), boutons HTML
  transparents pour les menus.
- **Version 2.0.0** (majeur : la sauvegarde de la 1.x ne se lit plus, `v: 2`).

## Découpage en tranches

1. **Mission 1 jouable de bout en bout** : moteur des salles, salon, salle à manger,
   cuisine et Majordome, titre, plan du manoir, bilan, sauvegarde, PWA. Publiée en
   2.0.0 sur la même adresse.
2. Mission 2 (flash, Lumi). 3. Mission 3 (rythme, super). 4. Mission 4 (slam).
Chaque nouvelle salle et chaque écran se montrent sur une planche AVANT d'être codés.

## Points ouverts

- ✅ Le **nom** est tranché (2026-10-27) : **Ghostel** (ghost + hôtel, son idée). Le
  manoir devient un vieil hôtel hanté : le hall (réception, ascenseur), le restaurant, la
  cuisine, le maître d'hôtel ; enseigne au néon sur le toit. Le fantôme vert est l'**Ecto**
  (« une goule est un mort-vivant »). Le dossier et le cache gardent `ghost-train`.
- L'atelier d'améliorations et les secrets : plus tard (« on verra plus tard »).
