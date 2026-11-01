# Ghostel : les sceaux remplacent le slam (4e étage)

Validé par Julie le 2026-11-01, après la maquette jouable (`tools/mockup-ghost-train-sceaux.html`).
Idée tirée de Ghostwire: Tokyo (les signes tracés de la main). Le slam ressemblait trop à la
pêche des boss : un geste par étage, celui des combles est désormais **tracer**.

## Le geste

1. On aspire un fantôme coriace comme ailleurs. À 35 % de sa vie, il est **sonné** : il se fige,
   la pièce s'assombrit, un sceau en pointillés apparaît sur lui, un point jaune qui brille
   et une flèche disent où commencer.
2. On pose le doigt sur le point et on suit le dessin **d'un seul trait**. Le tracé est
   indulgent (13 px de jeu autour du dessin) ; un trait ouvert se prend par l'un ou l'autre
   bout, un trait fermé (rond, triangle) dans les deux sens.
3. Lever le doigt efface le tracé ; on recommence tant qu'il reste du temps (barre sous le sceau).
4. Réussi : SCELLÉ, il est capturé (+2 pièces). Temps écoulé : le sceau se brise, il reprend
   70 % de sa vie et repart.
5. Le doigt trace là où il est (pas de décalage du viseur). S'il était déjà posé quand le sceau
   s'ouvre, il faut le lever d'abord.
6. Pendant le tracé, le reste de la salle avance au tiers de sa vitesse (fantômes, tirs,
   déroulé) : un peu de pression, mais on ne se fait pas toucher en dessinant.

## Qui en demande un

- Les coriaces seulement : drap, crâne, Ombre. Les ectos s'aspirent comme avant.
- Les formes durcissent avec la salle : chambre (trait, V), lingerie (V, Z, rond),
  combles (Z, rond, vague, triangle). 4,5 s pour tracer.
- **La Gouvernante** se pêche comme tous les boss ; quand la pêche est gagnée, au lieu de filer
  au piège, elle se débat : **trois sceaux d'affilée** (3,2 s chacun). Un raté = elle se libère
  comme une ligne cassée (un quart de sa vie, le combat reprend).

## Ce qui disparaît

Le slam entier : `SLAM`, la traction, la jauge orange, le demi-rayon sur les fantômes qui
luttent, le son `slam`, le compteur `slams`.

## Plus tard (demandé par Julie)

- La couleur des sceaux : le tracé aux couleurs du rayon (rose, cyan) « ne va pas avec le reste ».
  Le dessin est isolé dans une fonction de `scene.js` pour être repris après une maquette.
- Le cercle vert de la pêche n'est pas assez parlant : un nouveau joueur ne l'a pas compris seul.

## Révision du 2026-11-01 : les sceaux de sel (choisis par Julie)

Le laser ne venait de nulle part dans l'univers de l'hôtel (dans Ghostwire, les signes sont les
vrais gestes de l'exorcisme japonais, et la magie a la lumière des néons de Tokyo). Écartés par
elle : la craie, l'or, l'ectoplasme, le talisman, le néon, la planche de spiritisme, le sang (trop
pour un 8+), les simples enclos (« trop basiques »). Retenu : des signes d'alchimiste versés en
SEL autour du fantôme (un fantôme ne passe pas une ligne de sel), en grains fins d'un pixel.

| Salle | Sceaux | Traits |
|---|---|---|
| Chambre | feu (triangle), eau (triangle renversé) | 1 |
| Lingerie | étoile ; sel (cercle barré, son vrai signe en alchimie) | 1 ; 2 |
| Combles | air (triangle barré), pentacle, étoile | 2, 2, 1 |
| Gouvernante | pentacle, sel, air, trois d'affilée | 2 |

Deux traits : chaque trait a son point de départ numéroté ; lever le doigt efface le trait en
cours, jamais un trait fini. Le temps suit la longueur de sel à verser (2 s + 90 px/s, la
Gouvernante 110 px/s). Fermé, le sel s'illumine en bleu pâle ; raté, il s'éparpille.
