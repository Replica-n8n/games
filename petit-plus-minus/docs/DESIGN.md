# Style visuel et mise en page

Reprend `DESIGN_TOKENS.md` du kit, corrigé par les mesures du 2026-09-25
(`OPTIMISATION.md` donne les chiffres). Ce qui est marqué ⚠️ n'est pas encore vérifié.

Doux, arrondi, pastel, jamais inquiétant. Pas d'émoji dans l'interface : icônes en
trait arrondi. **Thème clair seulement** : la crème pastel fait partie de l'identité,
et un jeu pour enfant en sombre changerait son ton. Donc `color-scheme: light` et un
seul `theme-color`.

## Couleurs

La palette du kit est l'échelle Tailwind (teal, orange, indigo, pink, blue en 700 et
900), pas des codes choisis à l'œil. **Tous les textes passent, de 5,2:1 à 13,6:1.** On
la garde, et on ne corrige que les quatre objets qui échouent au seuil de 3:1.

| Rôle | Hex |
|---|---|
| Fond crème (général) | `#FFF7EC` |
| Encre (texte principal) | `#2B2350` |
| Texte secondaire | `#4B4470` |
| Petit Plus / calme, principal | `#0F766E` (foncé `#134E4A`, fond `#E3F6EF`) |
| Petit Minus | `#7A5CA8` (foncé `#4C3A75`, fond arène `#F3E6FF`) |
| Action principale (orange) | `#C2410C` (ombre `#7C2D12`) |
| Accent titres | `#9A3412` |
| Étoiles | `#F2B233` **avec contour `#B45309`** (fond badge `#FDE7B0`) |
| Mode SOS (indigo apaisant) | fond `#EEF0FF`, principal `#4338CA`, texte `#312E81`, **bord de la bulle `#6366F1`** |
| Chasse aux trésors (bleu) | fond `#EAF1FF`, principal `#1D4ED8`, **gemme trouvée `#2563EB`** |
| Mémo (rose) | fond `#FFF1F6`, principal `#BE185D` |
| Message « essaie encore » | `#FDF1DC` |
| **Bord d'une carte non choisie** | **`#8B7BAE`** (au lieu de `#D8CCE8`) |

Les quatre corrections, mesurées :

| Objet | Kit | Corrigé |
|---|---|---|
| Étoile sur son badge | 1,54:1 | contour `#B45309` : 4,12:1 |
| Étoile sur crème | 1,77:1 | contour `#B45309` : 4,73:1 |
| Bord d'une carte météo non choisie | 1,53:1 | `#8B7BAE` : 3,79:1 |
| Bord de la bulle de respiration | 1,87:1 | `#6366F1` : 3,94:1 |
| Gemme trouvée (trésors) | 2,04:1 | `#2563EB` : 4,16:1 |

La bulle est le seul guide du SOS : un enfant qui ne la distingue pas du fond n'a plus
rien à suivre. Le choix sur la météo ne doit pas reposer que sur l'épaisseur du bord :
la carte choisie prend aussi un fond teinté et une coche.

Chaque paire de couleurs du tableau est recalculée par un script sans dépendance
(`tools/petit-plus-minus-contrastes.mjs`, à écrire à l'étape 1), et le texte posé sur
l'arène se mesure sur les pixels de la capture.

## Typographie

- Titres : **Baloo 2** 800. Texte : **Nunito** 700 et 800.
- Piste écartée pour l'instant : `serpentin/` utilise **Andika** pour le texte, dessinée
  pour les lecteurs débutants (a et g à une seule panse). Nunito est gardée parce que la
  maquette a été validée avec elle ; à rouvrir si l'enfant bute sur la lecture.
- **Hébergées dans le dossier** en woff2, sous-ensemble `latin` seul (il contient « œ »
  et les guillemets français), dans le cache du service worker. Les maquettes les
  chargeaient depuis Google Fonts : hors ligne, elles disparaissaient.
- **Jamais sous 14 px** (le kit disait 13, et la météo utilisait 12 px pour ses
  sous-titres « Je me sens bien » : ils passent à 14).
- Tailles en `rem`, pour suivre la taille de texte choisie sur le téléphone. ⚠️ Vérifier
  sur le Pixel ce que Chrome Android applique réellement à une PWA installée.
- `text-wrap: balance` sur les titres, `font-variant-numeric: tabular-nums` sur les
  compteurs.

## Espacement et formes

- **Une seule échelle** en variables : 4, 8, 12, 16, 24, 32 px.
- Rayons : boutons 16 à 20 px, cartes 18 à 22 px, arène 26 à 28 px, pastilles 999 px.
- **Cibles de 44 px minimum, 8 px entre deux cibles.** Les gemmes des trésors et les
  pastilles de progression restent petites à l'œil mais touchables sur 44 px.
- **L'action principale en bas, sous le pouce**, pleine largeur, 64 px de haut (le kit :
  56 à 60), ombre pleine de 4 à 5 px vers le bas (effet « bouton de jeu »), et **au
  moins 24 px d'air avant elle** (`.pousse{flex:1;min-height:24px}`).
  Sur la météo, le bouton « S'entraîner » ou « SOS Minus » descend donc de la carte de
  message vers le bas de l'écran.
- `[hidden]{display:none !important}` : une classe qui pose `display` bat l'attribut.

## Tenir dans l'écran

Le kit est dessiné en 390 × 844 avec `overflow: hidden`. **Sur ton Pixel (360 × 732
utiles), 6 écrans sur 9 dépassent, et le trop-plein serait coupé, pas défilé.** À
360 × 640, 8 sur 9.

Règles :

- Écran d'action : `min-height: 100svh`, jamais `overflow: hidden` sur la page. Si le
  texte est grand (réglage du téléphone), l'écran défile au lieu de couper la consigne.
- Un bloc `@media (max-height: 700px)` resserre : titres plus petits, arène plus basse,
  espaces de l'échelle un cran en dessous.
- Mesures à tenir, format Pixel 9 et 360 × 640 : l'action principale visible sans
  défiler sur chaque écran d'usage (accueil, météo, SOS, combat, souffle).
- Météo : cartes de 148 px à 732 et de 116 px sous 700 px, Minus de 48 à 88 px puis de
  32 à 56 px. Dans la maquette (92 px), les cornes du Minus « Énorme » sortaient de sa
  carte : le banc le mesure maintenant.
- Accueil : le titre sur 2 lignes (« Petit Plus / contre Petit Minus ») au lieu de 3,
  l'arène de 300 à 240 px. Trésors : une seule étape visible à la fois (la maquette les
  empile).

## Mouvement

- **Une seule signature : Minus rétrécit, Petit Plus grandit.** 500 ms, décélération
  franche `cubic-bezier(.25,1,.5,1)`, **sans rebond** (le kit disait « ressort
  léger » : un rebond fait regrossir Minus une fraction de seconde, exactement ce qu'il
  ne faut pas montrer). Ancrée en bas : `transform-origin: bottom center`.
- Tout le reste de l'interface : 150 à 300 ms, même courbe.
- Bulle de respiration : échelle 0,62 → 1 → 0,62 sur 8 s, boucle. C'est du contenu, pas
  de l'interface : sa durée ne suit pas la règle des 300 ms.
- Mode SOS : aucune animation rapide, aucun rebond, aucun son.
- **`prefers-reduced-motion`** : les tailles changent tout de suite ; la bulle ne
  bouge plus, le rythme passe par le mot et la teinte (voir `GAME_DESIGN.md`).
- ⚠️ Un élément recréé par `innerHTML` naît à son état final et sa transition ne joue
  jamais : les personnages sont créés une fois et on anime **les mêmes** éléments.

## Retour au geste

- Vibration brève (`navigator.vibrate(15)`) sur « super efficace » et sur une gemme
  trouvée. Aucune vibration dans le SOS. ⚠️ N'existe pas sur iPhone : jamais le seul
  signal.
- Aucun son par défaut.

## Accessibilité

- Chaque bouton a un nom lisible ; les cartes de la météo portent `aria-pressed` ; les
  jauges du combat ont un `aria-label` qui dit l'état (« Taille de Minus : moyen »).
- Une zone `role="status"` annonce les messages du combat et du mémo (vidée puis
  réécrite, pour qu'un même message soit relu).
- `:focus-visible` visible partout.
- Les personnages sont décoratifs (`aria-hidden`), leur état est dit par le texte.
