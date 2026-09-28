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

## 3. L'habit, façon Maneater (révisé le 2026-09-28)

Première version rejetée par Julie : toutes les mutations et marques s'empilaient,
la requin « ressemblait à un espadon ». Comme dans Maneater, chaque mutation clé est
un habit complet, et on choisit dans la grotte lequel porter (les autres gardent
leurs effets). La première mutation clé achetée s'enfile d'elle-même.

- Os (Dunkleosteus) : corps gris clair, casque d'os sur la tête, lames d'os au lieu
  de dents, plaques le long du dos, balafre plus marquée.
- Ombre : noir violacé à larges rayures, yeux violets, museau en plaque violette
  pointue, crocs de vampire ; au niveau 3, liseré violet et traînée d'encre.
- Bio-électrique : bleu néon, veines lumineuses, halo ; tentacules de méduse en
  éventail derrière l'œil à partir du niveau 2.
- Organes : seuls le sonar (une onde) et l'estomac (ventre plus rond) se voient.

## 4. Palmarès (nouvel onglet de la grotte)

Un tableau des records de la plage. Chaque exploit a trois paliers, bronze, argent et
or, écrits en toutes lettres, pas seulement en couleur. Chaque palier débloque une
réplique inédite du narrateur ; l'or dépose aussi un trophée à l'entrée des grottes
(les marques portées sur la requin ont été abandonnées).

| Exploit | Mesure | Bronze / Argent / Or | Trophée (or) |
|---|---|---|---|
| Mangeuse d'hommes | humains mangés | 5 / 25 / 100 | bouée de sauvetage |
| Haute voltige | hauteur de saut hors de l'eau | 120 / 250 / 400 | planche de surf cassée |
| Casse-coques | bateaux coulés | 1 / 5 / 15 | hélice de bateau |
| Gloutonne | créatures mangées | 50 / 250 / 1000 | montagne d'arêtes |
| Chasseuse d'alphas | alphas terrassés | 1 / 2 / 3 | mâchoire d'alpha |
| Fantôme | chasseurs semés en profondeur | 1 / 5 / 15 | harpon tordu |
| Toréro | esquives parfaites | 1 / 10 / 30 | casquette de chasseur |

- Les trophées obtenus sont listés dans l'onglet Palmarès et posés sur le sol autour
  de chaque grotte.
- En jeu, un palier atteint donne un panonceau « Palmarès : Haute voltige, argent »
  et la réplique du narrateur.
- Les compteurs sont sauvegardés à part des grottes (un exploit n'est jamais perdu
  par une mort). Sauvegarde versionnée : une ancienne partie démarre à zéro exploit.
- La liste est une table de données : ajouter un exploit ou une zone ne demande que
  d'y ajouter une ligne.
