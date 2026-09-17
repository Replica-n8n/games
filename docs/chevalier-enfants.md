# Le chevalier : est-il adapté aux enfants ?

Audit du 2026-09-17, sur la v80. Grilles utilisées : les 15 règles du
**Children's Code** (ICO, Royaume-Uni), les pièges de conception recensés par la
**5Rights Foundation**, et la règle des flashs **WCAG 2.3.1**. Chaque point dit
ce qui a été vérifié dans le code, pas supposé.

Légende : ✅ conforme · ⚠️ à corriger · 🟡 choix assumé, à garder en tête.

## Flashs et épilepsie photosensible

✅ **Aucun scénario ne dépasse 3 flashs par seconde.** Mesuré par
`tools/chevalier-flashs.mjs`, image par image à 60 i/s sur une horloge
contrôlée :

| Scénario | Flashs dans la pire seconde |
|---|---|
| Partie chargée (magicien, 40 bestioles) | 1 |
| Orage (foudre toutes les 2,4 s) | 2 |
| Fin de l'étoile d'invincibilité | 0 |
| Chat géant (trois griffes, grand flash) | 2 |
| Boss crabe / dragon / reine | 1 / 0 / 0 |

Le contrôle mord : un clignotement doré à 6 Hz injecté sur la fin de l'étoile
sort 7 flashs par seconde et fait échouer l'essai. Le rouge saturé est compté
à part, et reste à 0 partout.

## Données personnelles (Children's Code, règles 1 à 9)

- ✅ **Rien ne sort du téléphone.** Aucun `fetch` hors du service worker, qui
  ne charge que les fichiers du jeu. Pas de statistiques, pas de publicité,
  pas de compte.
- ✅ **Minimisation.** Le stockage local ne garde que cinq choses : la durée des
  parties (pour régler la difficulté de la suivante), le personnage, le monde,
  le son coupé ou non, et le mode essai. Aucune n'identifie l'enfant.
- ✅ **Aucune géolocalisation, notification, caméra, micro ni partage.**
- ✅ **Aucun profilage à des fins commerciales.** La difficulté s'adapte aux
  parties précédentes, mais seulement pour aider : elle facilite quand l'enfant
  meurt tôt.
- ✅ **Pas de contrôle parental nécessaire** : il n'y a rien à contrôler, ni
  achat, ni lien vers l'extérieur, ni échange avec d'autres joueurs.

## Conception manipulatrice (règle 13, 5Rights)

- ✅ **Une partie a une fin** : 8 minutes au plus, puis un écran de fin.
  « Rejouer » attend un appui, rien ne relance tout seul.
- ✅ **Pas de série à ne pas casser, pas de récompense quotidienne, pas de
  « reviens demain »**, pas de notification pour rappeler l'enfant.
- ✅ **Pas de monnaie, pas d'achat, pas de boutique.**
- 🟡 **La roue tire l'arme de départ au hasard.** C'est une mécanique de hasard,
  mais sans argent, sans rareté affichée et sans relance à acheter : ce n'est
  pas une loot box. À ne jamais coupler à une récompense rare ou à une attente.
- 🟡 **L'écran de fin dit « Perdu ».** Neutre et court, pas culpabilisant. Un ton
  plus encourageant (« Tu as tenu 3:12 ! ») serait dans l'esprit de Gentler
  Streak, sans être une obligation.

## Réglages et contenu

- ⚠️ **Le Labo est ouvert à tous** depuis le menu (« 🧪 Labo : tester les
  nouveautés »). C'est un outil de réglage pour l'adulte : il donne des armes
  au niveau maximum et fausse la partie. Un enfant qui tombe dessus ne sait
  plus ce qui est le vrai jeu. À cacher derrière un geste d'adulte (appui long,
  ou question simple) ou à retirer de la version en ligne.
- ⚠️ **« Réduire les animations » n'arrête pas les secousses d'écran.** La règle
  CSS coupe les transitions des panneaux, mais le chat géant secoue le canevas
  jusqu'à 12 px en JavaScript, sans regarder ce réglage. Un enfant sujet au mal
  des transports l'a peut-être activé exprès.
- ✅ **Violence dessinée et sans sang** : des bestioles fantaisistes qui
  disparaissent. Selon les critères PEGI, cela correspond en général à
  **PEGI 7** (auto-évaluation, pas une note officielle).
- ✅ **Lisible sans savoir lire** : armes, objets, mondes et pattes sont dessinés,
  la police Andika est faite pour les jeunes lecteurs, les cibles sont au pouce.
- ✅ **Le son se coupe** depuis le menu, et le choix est retenu.

## Corrigé en v82 (même jour)

1. ✅ Le Labo est caché : il n'apparaît qu'en tenant 2 secondes le numéro de
   version dans le menu. `chevalier-labo.mjs` vérifie qu'il est caché, qu'un
   appui court ne le montre pas, et qu'un appui de 2 secondes le montre.
2. ✅ « Réduire les animations » coupe les secousses du chat géant : 52 images
   secouées sur 3 secondes en temps normal, 0 avec le réglage.
3. ✅ L'écran de fin dit ce que l'enfant a réussi : « Tu as tenu 3:12 ! » au
   lieu de « Perdu ». Un chiffre vrai, pas un « bravo » gratuit.
