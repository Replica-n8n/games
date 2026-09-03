# La salamandre remplace le piment

*Le chevalier — 2026-08-31*

## Ce qu'on change, et pourquoi

Le **piment** est un objet au sol qui, pendant dix secondes, fait semer du feu
**au chevalier lui-même** : la traînée sort de ses pieds et brûle ce qui entre
dedans. Il récompense donc la course.

Il est remplacé par une **salamandre**, qui fait exactement la même chose —
même feu, mêmes chiffres — mais **court toute seule**. Le chevalier peut
souffler pendant qu'elle travaille.

⚠️ **C'est une entorse assumée**, et elle est écrite ici pour qu'on s'en
souvienne. En concevant l'épouvantail le 2026-09-02, on a écarté « un compagnon
qui se bat » avec deux arguments, dont : *« il aurait surtout été le premier
objet à rendre le déplacement moins important, puisqu'on peut rester dans un
coin pendant qu'il travaille »*. La salamandre fait précisément cela. Elle a été
choisie en connaissance de cause : **ce sont dix secondes de répit, et c'est le
but**. Si un jour le jeu paraît mou, c'est le premier endroit où regarder.

Le second argument, en revanche, tient toujours et contraint le design :
« un allié qui frappe tout seul » existe déjà trois fois (Bouclier, Boule
givrée, Arc). **La salamandre ne frappe donc pas.**

## L'objet au sol

Dans `SORTES`, `piment` devient `salamandre`, **au même poids de 20** : aucune
autre sorte ne change de fréquence, et l'équilibre du sol reste celui qui a été
mesuré.

Elle dort roulée en boule : corps orange, ventre jaune, yeux fermés, deux ou
trois braises qui montent doucement.

⚠️ **Une bestiole immobile dans l'herbe peut se lire comme un ennemi** — le
crapaud en est une. Trois choses l'en séparent :

1. la règle de couleur du jeu, *menaces sombres et froides, ce qui aide clair et
   chaud* : le crapaud est violet sombre, la salamandre orange vif ;
2. l'anneau doré que portent tous les objets à ramasser ;
3. les braises qui montent, qui disent « elle dort » et non « elle guette ».

## Ce qu'elle fait, réveillée

Dix secondes (`dureeSalamandre: 10`, la durée du piment). Elle apparaît là où on
l'a touchée.

- Elle vise **la bestiole vivante la plus proche**, court vers elle, la traverse,
  en choisit une autre.
- **Elle n'inflige aucun dégât au contact.** Ce qui brûle est sa traînée :
  mêmes braises qu'aujourd'hui, `feuVie` 3,5 s, `feuRayon` 26, `degatsFeu` 6 par
  seconde, les plus vieilles effacées en premier.
- **Rien ne peut la blesser** : elle est en feu. Aucun état d'échec.
- Son feu ne blesse pas le chevalier, comme celui du piment aujourd'hui.

Plusieurs salamandres peuvent coexister si deux sont ramassées coup sur coup :
la liste n'a pas de cas particulier, et deux traînées valent mieux qu'une
exception à écrire.

## La laisse

⚠️ **Une aide qu'on ne voit pas n'existe pas.** Le papillon a coûté deux
allers-retours pour cette raison exacte : il naissait normalement mais ne
s'approchait jamais à moins de 158 unités, hors de portée et hors du champ.

La salamandre ne s'éloigne donc **jamais de plus de 260 unités** du chevalier —
la moitié de la largeur de l'écran. Si la bestiole la plus proche est au-delà,
elle tourne autour de lui en attendant plutôt que de partir.

**Contrôle :** elle est à l'écran plus de 90 % de sa vie.

## La fin

Au bout des dix secondes elle ralentit, son feu s'éteint, elle s'efface dans une
volée de braises. On ne peut pas la perdre.

## Où elle vit

Dans `moteur.js`, une liste `salamandres`, exactement comme `epouvantails` —
**pas dans `bestioles.js`**, qui est le bestiaire des menaces et dont les essais
(couleurs froides, heures d'arrivée espacées de quinze secondes, plafond de trois
individus) ne la concernent pas. Le moteur possède déjà `feux` : les émettre
depuis elle plutôt que depuis le chevalier est une ligne.

Le son du piment devient celui de la salamandre : une voix dans `VOIX`, pas deux.

⚠️ **Quatrième objet en mouvement à suivre**, alors que la règle du jeu en
autorise trois — le plafond qui vient de ce qu'un enfant de huit ans sait
suivre. L'entorse est bornée : elle est chaude, claire, alliée, et elle ne dure
que dix secondes.

## Ce qu'on mesure avant de dire que c'est bon

1. **Elle pose autant de feu** qu'un chevalier qui court en portait aujourd'hui.
   Sinon le piment aurait été affaibli en douce sous couvert de le remplacer.
2. **Elle reste visible** : plus de 90 % de sa vie dans le champ.
3. **L'équilibrage**, en mesure appariée avec et sans, sur deux familles de
   graines — la méthode de l'épouvantail, celle qui a montré qu'il raccourcissait
   les parties d'une minute. Un banc déterministe relancé à l'identique ne dit
   rien de sa propre dispersion.

## Ce qui n'est pas dans ce lot

- Le sol saturé 263 s sur 410 (sept objets pour quatre places).
- Le crapaud, qui occupe 0,84 place d'individu sur 3 à lui seul.

Ces deux points sont ouverts et demandent une décision, pas une réparation.
