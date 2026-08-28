# Le survivants dans la prairie : plan d'implémentation

Plan tiré de [la spec du 2026-08-27](../specs/2026-08-27-survivants-prairie-design.md).
Remplace [le plan du serpent](2026-08-27-serpentin-prairie-plan.md), caduc au
delà de son étape 6.

Même dossier `games/serpentin/`, même adresse. Même règle qu'avant : **le
contrôle s'écrit avant le code qu'il contrôle**, et on change `VERSION` dans
`sw.js` à chaque étape.

## Étape 1 : la foule, et ce qu'elle coûte

**Rien d'autre ne s'écrit avant.** Le joueur, les bestioles qui le suivent, les
vagues, le plafond, les naissances. Aucune arme, aucun dégât, aucun HUD.

On garde du serpent : la coquille PWA, le canvas, la caméra, le manche
flottant, le semis d'obstacles, le bord qui fait glisser, le pilotage par
répulsions, le générateur à graine.

On jette : le corps en polyligne, tête contre corps, le boost et son bouton.

**Preuve** : `serpentin-images.mjs` mesure à **300 bestioles**, cinq fois le
plafond du jeu. Si le budget de 16,7 ms saute, grille spatiale ; s'il saute
encore, on baisse le plafond et on l'écrit dans la spec.

## Étape 2 : mourir, et les graines

Contact avec une bestiole : un cœur, puis **une seconde d'invincibilité**.
Bestiole tuée : elle lâche une **graine**, ramassée en passant, attirée par
l'aimant. Cinq cœurs perdus, la partie s'arrête.

**Preuve**, sans navigateur : un contact coûte un cœur et un seul, un deuxième
contact dans la seconde ne coûte rien, la graine se ramasse, l'aimant l'attire
à sa portée et pas au delà.

## Étape 3 : les armes

`armes.js`, **une définition par arme**. Épée, bouclier, arc pour commencer.
Elles frappent seules, chacune sa recharge, six niveaux.

Deux règles de lisibilité de la spec : **une famille de couleurs pour le
chevalier**, une autre pour les bestioles, et **40 projectiles au plus**.

**Preuve** : ajouter une quatrième arme ne doit toucher que `armes.js`. Sans
navigateur : chaque arme frappe à sa cadence, tue, et respecte son plafond de
projectiles.

## Étape 4 : monter de niveau

Assez de graines et **le jeu s'arrête** : trois cartes, une image et deux mots
chacune. Nouvelle arme, amélioration d'arme, ou objet. Quatre emplacements
d'armes, quatre d'objets.

**Preuve** : trois choix jamais identiques, jamais une arme déjà au maximum,
jamais une cinquième arme quand les quatre emplacements sont pris. Dans le
navigateur : le jeu est réellement arrêté pendant le choix.

## Étape 5 : le HUD et les huit minutes

Cœurs, quatre icônes d'armes en dessous, chronomètre, barre d'expérience.
Le chronomètre monte jusqu'à 8:00.

**Preuve** : profil Pixel 9, tout tient sur 360 points de large sans se
chevaucher.

## Étape 6 : les cinq bestioles

Abeille, hérisson, crapaud, pissenlit, et leur calendrier d'arrivée.
`bestioles.js`, **une définition par bestiole**.

**Preuve** : **au plus trois individus vivants** à l'écran, quoi qu'il arrive.
Et chaque attaque **prévient une seconde avant** : le hérisson se met en boule,
le crapaud gonfle, le pissenlit enfle. Ces deux règles se contrôlent sans
navigateur, elles ne sont pas décoratives.

## Étape 7 : la Reine

Le boss de la 8ᵉ minute, battable, et l'écran de victoire.

## Étape 8 : la progression permanente

`progression.js` : la table des 20 niveaux, les 6 quêtes, les 13 apparences,
avec les deux paliers réécrits par la spec.

## Étape 9 : régler, mesurer, mettre en ligne

Les valeurs se règlent en jouant. Puis les cinq contrôles, et le contrôle de ce
que GitHub Pages sert vraiment.

## Fini veut dire

- les cinq contrôles passent, et je montre leur sortie
- 60 images par seconde visées, jamais moins de 50, **mesuré**
- au plus trois individus à l'écran, prouvé par un contrôle
- le jeu se relance hors ligne
- zéro erreur console
