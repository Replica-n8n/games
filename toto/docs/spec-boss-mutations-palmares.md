# Spec : boss mérités, mutations visibles, palmarès

Écrite le 2026-09-28 à partir des retours de Julie après son essai de la v7.

## 1. Boss : quatre règles (toutes choisies par Julie)

Mesure avant changement (`tools/toto-boss.mjs`, requin collée au boss sans nager) :
Ti-Croc tué en 18 s par un Bébé niveau 1, 0 % de vie perdue ; Matriarche en 14 s,
0 à 13 %. Cause : la gueule de la requin porte plus loin que celle de l'alpha.

- **Riposte équitable** : l'alpha mord jusqu'à la portée de la gueule de la requin.
  Rester collé coûte de la vie.
- **Il se débat** : collée plus de 2 s (compteur qui se vide quand on s'écarte),
  l'alpha tremble 0,5 s (annoncé), puis se débat : dégâts doublés et forte projection.
- **Esquive parfaite** : foncer à travers l'alpha pendant sa charge l'étourdit 2 s ;
  les morsures sur un alpha étourdi font double dégâts. Le narrateur le salue.
- **Écart de niveau** : chaque alpha a un niveau conseillé (Ti-Croc 5, Lame-d'Argent 8,
  Matriarche 12). En dessous, les morsures perdent 15 % par niveau manquant (plancher
  35 %). La barre du boss affiche « niv. 5 conseillé » tant qu'on est en dessous.

Objectif mesuré après changement : rester collé fait perdre plus de la moitié de la
vie ou tue ; un Bébé ne bat pas Ti-Croc en restant collé ; une esquive parfaite
double les dégâts pendant 2 s.

## 2. Mutations clés mises en avant

- Grotte : Mâchoire en os, Nageoires d'ombre et Queue bio-électrique passent en tête,
  plus grandes, avec l'alpha vaincu qui les a données et ce qu'elles ouvrent
  (« ouvre la digue du port »).
- HUD : « Mutation clé possible » quand l'une d'elles est payable, et une réplique
  du narrateur dédiée.

## 3. Chaque mutation se voit sur la requin, par niveau

- Mâchoire en os : mâchoire ivoire et crocs visibles en permanence, plus nombreux par
  niveau ; au niveau 3, une arête d'os au-dessus de l'œil.
- Nageoires d'ombre : nageoires plus sombres et plus longues par niveau.
- Queue bio-électrique : arcs plus nombreux, rayures lumineuses sur la queue.
- Corps renforcé : plaques sur le dos, une rangée de plus par niveau.
- Estomac d'acier : ventre plus rond.
- Sonar : une onde discrète part du museau toutes les 2 s (fixe en animations réduites).

## 4. Palmarès (nouvel onglet de la grotte)

Un tableau des records de la plage. Chaque exploit a trois paliers, bronze, argent et
or, écrits en toutes lettres, pas seulement en couleur. Chaque palier débloque une
réplique inédite du narrateur ; l'or débloque aussi une marque à porter sur la requin.

| Exploit | Mesure | Bronze / Argent / Or | Marque (or) |
|---|---|---|---|
| Mangeuse d'hommes | humains mangés | 5 / 25 / 100 | dent en or |
| Haute voltige | hauteur de saut hors de l'eau | 120 / 250 / 400 | hameçon planté dans la nageoire |
| Casse-coques | bateaux coulés | 1 / 5 / 15 | morceau de filet à la queue |
| Gloutonne | créatures mangées | 50 / 250 / 1000 | cicatrices de griffes |
| Chasseuse d'alphas | alphas terrassés | 1 / 2 / 3 | tatouage d'ancre |
| Fantôme | chasseurs semés en profondeur | 1 / 5 / 15 | cicatrice de harpon |
| Toréro | esquives parfaites | 1 / 10 / 30 | balafre en croix |

- Les marques se portent ou non : chaque marque obtenue est une ligne nommée avec
  une coche (pas un interrupteur).
- En jeu, un palier atteint donne un panonceau « Palmarès : Haute voltige, argent »
  et la réplique du narrateur.
- Les compteurs sont sauvegardés à part des grottes (un exploit n'est jamais perdu
  par une mort). Sauvegarde versionnée : une ancienne partie démarre à zéro exploit.
- La liste est une table de données : ajouter un exploit ou une zone ne demande que
  d'y ajouter une ligne.
