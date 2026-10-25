---
version: anydesign-1
name: Star Patrol, direction « livre illustré », monde Jungle
source: 4 références vues en images le 2026-10-22 (Henri Rousseau, jungles ; Le Chant de la mer, Cartoon Saloon ; aquarelles du Petit Prince, Saint-Exupéry ; Detana TwinBee, Konami)
captured_at: 2026-10-22
description: |
  Un album jeunesse peint à la gouache où l'on joue : feuillages de Rousseau en
  couches mates, papier crème du Petit Prince pour tout ce qui est interface, et la
  lisibilité franche de TwinBee pour ce qui se joue (tirs, cristaux, héros). Seul le
  jeu brille ; le décor est mat, éclairé par une seule lumière de matin.

colors:
  ink: "#1b1612"
  paper: "#f5ebd8"
  paper-shade: "#e4d7b8"
  sky-wash: "#cad9e8"
  leaf-deep: "#1a2725"
  leaf-dark: "#27332b"
  leaf-mid: "#3d6340"
  leaf-light: "#7a9a52"
  leaf-sun: "#b7c27a"
  ochre: "#776738"
  river: "#8fb9a8"
  flower-red: "#c8362b"
  flower-pink: "#e9a3a0"
  hero-wing: "#e0603a"
  bullet-blue: "#02a8e0"
  bullet-red: "#e8402a"
  crystal: "#8fe3ff"
  gold: "#f2b632"

typography:
  display:
    fontFamily: "Grandstander, Andika, sans-serif"
    fontSize: 44px
    fontWeight: 800
  label:
    fontFamily: "Grandstander, Andika, sans-serif"
    fontSize: 18px
    fontWeight: 700
  body:
    fontFamily: "Andika, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4

spacing:
  base: 4px
  scale: [4, 8, 12, 16, 24, 32]

rounded:
  paper-tag: 6px
  button: 16px
  disc: 9999px

components:
  paper-tag:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.paper-tag}"
    border: "2.5px solid {colors.ink}"
  button-gouache:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    border: "3px solid {colors.ink}"
  heart:
    backgroundColor: "{colors.flower-red}"
    border: "2.5px solid {colors.ink}"
  bullet-swallow:
    backgroundColor: "{colors.bullet-blue}"
  bullet-danger:
    backgroundColor: "{colors.bullet-red}"
  planet-watercolor:
    backgroundColor: "{colors.leaf-light}"
    rounded: "{rounded.disc}"
---

# Analyse de design : Star Patrol, Jungle « livre illustré »

> Analyse faite avec le skill `anydesign`.
> Date : 2026-10-22
> Accent : ambiance et reconstruction (une direction à peindre en canvas 2D)

---

## Source

- **Type de source** : images (4 captures de recherche Google Images, recadrées sur les œuvres)
- **Chemin** : captures de la session, couleurs mesurées par quantification des pixels (outil maison en Playwright, Pillow absent)
- **Méthode** : vue directe + mesure des couleurs dominantes
- **Limites** : vignettes de petite taille ; les couleurs de Rousseau et du Chant de la mer sont celles des reproductions en ligne, pas des originaux

Couleurs dominantes mesurées :

| Référence | Dominantes |
|---|---|
| Rousseau | `#1a2725` 8 %, `#242b28`, `#27332b`, `#293734`, ocres `#675937` `#776738` |
| Le Chant de la mer | encres `#030509` `#050816`, bleu-vert `#162737` `#0b2538`, brun `#351a18`, écume `#d9ece3` |
| Le Petit Prince | ciel `#cad9e8` 9 %, papier `#f5ebd8` 7 %, `#e4d7b8`, `#c7ba97` |
| TwinBee | bleus `#027dd8` `#01b2e3`, vert `#03e789`, clair `#f7f7fa`, peau `#e7b68a` |

---

## TL;DR

Le décor est une jungle de Rousseau vue d'en haut, en couches de feuilles plates et mates,
avec beaucoup de verts sombres et quelques fleurs rouges. Toute l'interface est du papier
crème cerné d'encre, comme une page d'album. Le jeu (héros, tirs, cristaux) emprunte à
TwinBee des couleurs franches et c'est la seule chose qui brille. À retenir : le fond n'est
plus jamais bleu nuit, et l'interface n'est plus jamais un panneau sombre arrondi.

---

## 1. Identité visuelle

### 1.1 Description de surface

**Personnalité** : peint à la main, chaleureux, foisonnant, lisible, malicieux.

**Ambiance** : la jungle d'un livre qu'on lit le soir, mais en plein matin.

**Références** : Rousseau (feuillages en couches), Cartoon Saloon (formes rondes, papier,
palettes limitées par scène), Le Petit Prince (papier, petites planètes à l'aquarelle),
TwinBee (lisibilité arcade, ciel de jour).

**Densité** : décor dense, interface minimale.

**Public** : enfants de 8 ans et plus, et les parents qui regardent par-dessus l'épaule.

**Confiance** : ✅ élevée (références choisies et vues)

### 1.2 Voix / atmosphère

Ce design croit qu'un enfant mérite un vrai livre illustré, pas une interface de
tableau de bord. Le décor prend son temps : des dizaines de feuilles, chacune avec sa
nervure claire, comme Rousseau qui peignait feuille par feuille. L'interface, elle, se
fait oublier : des étiquettes de papier, écrites à l'encre, posées sur la page.

La lisibilité du jeu ne se négocie pas. Tout ce qui peut toucher ou être ramassé se
détache du décor par la couleur (bleu, rouge, cristal), par la lumière (seul le jeu
brille) et par le contour d'encre. Le décor n'a jamais de contour noir : c'est ce qui
sépare le monde de ce qui s'y passe.

### 1.3 La signature

**Le papier crème cerné d'encre.** Une étiquette de papier aux bords irréguliers, un
trait d'encre de 2,5 px et une écriture ronde : on reconnaît Star Patrol à ça, sur
chaque écran, même sans décor.

---

## 2. Système (tokens)

### 2.1 Couleurs

- `{colors.ink}` : tous les contours du JEU et de l'interface, jamais du décor.
- `{colors.paper}`, `{colors.paper-shade}` : fond des étiquettes, de la carte et du Hangar.
- `{colors.sky-wash}` : lavis de ciel sur la carte.
- Feuillage, du fond vers le devant : `{colors.leaf-deep}`, `{colors.leaf-dark}`,
  `{colors.leaf-mid}`, `{colors.leaf-light}`, `{colors.leaf-sun}` ; `{colors.ochre}`
  pour les troncs et les feuilles mortes ; `{colors.river}` pour la rivière.
- Fleurs, seules touches vives du décor : `{colors.flower-red}`, `{colors.flower-pink}`.
- Jeu : `{colors.hero-wing}` (l'avion, complémentaire du vert), `{colors.bullet-blue}`
  (tir à avaler), `{colors.bullet-red}` (tir qui blesse), `{colors.crystal}`, `{colors.gold}`.

Confiance : ✅ pour les couleurs mesurées, ⚠️ pour `{colors.hero-wing}` et `{colors.gold}`, choisis.

### 2.2 Typographie

- **Grandstander** (Google Fonts, licence OFL) pour les titres et les étiquettes : ronde et
  manuscrite, sans être une police de bande dessinée.
- **Andika** (SIL, licence OFL) pour les textes : dessinée pour les enfants qui apprennent
  à lire (a et g à un étage, i et l bien distincts).

Confiance : ⚠️ choix de direction, à valider sur téléphone.

### 2.3 Espacement

Base de 4 px, et 16 px de marge sur les côtés du téléphone.

### 2.4 Rayons

Les étiquettes ont des coins presque droits (`{rounded.paper-tag}`) avec un bord irrégulier ;
seuls les boutons d'action sont arrondis (`{rounded.button}`).

### 2.5 Élévation

- Niveau 0 : le décor, mat, sans ombre ni contour.
- Niveau 1 : le jeu, contour d'encre et halo de sa propre couleur.
- Niveau 2 : l'interface sur papier, ombre d'encre décalée de 3 px, comme un papier découpé posé sur la page.

### 2.6 Bordures

Encre de 2,5 à 3 px, jamais de bordure grise de 1 px.

### 2.7 Accessibilité

Encre sur papier : contraste d'environ 16:1. Les tirs se distinguent aussi par la forme
(bleu = bulle claire au cœur blanc, rouge = boule cerclée sombre), pas seulement par la couleur.

---

## 3. Composants

### 3.1 Composants courants

#### paper-tag

étiquette de papier (compte de cristaux, munitions, nom de mission).
#### button-gouache

bouton d'action, jaune gouache cerné d'encre, ombre décalée.
#### heart

cœur rouge gouache avec reflet ; le cœur perdu reste dessiné, en contour seul.

### 3.2 Composants signature

#### bullet-swallow

Le tir bleu, à avaler pour charger le super : bulle claire au cœur blanc.

#### bullet-danger

Le tir rouge, qui blesse : boule cerclée sombre. Avec le héros, ce sont les seuls éléments très saturés de l'écran.
#### planet-watercolor

une planète de la carte, peinte à l'aquarelle (bord plus foncé là où l'eau sèche), avec sa silhouette (arbres de la Jungle, dunes, vagues, cailloux).

---

## 4. Mise en page

### 4.1 Grille

Écran de jeu de 360 × 640 ; l'interface tient en deux bandes, en haut (cœurs, cristaux, pause) et en bas à droite (super-pouvoir, sous le pouce).

### 4.2 Composition

Le décor laisse un couloir plus calme au centre, là où le joueur pilote ; la densité monte sur les bords.

### 4.3 Responsive

Le jeu garde son format et s'agrandit sans déformation ; les cibles tactiles font au moins 44 px.

### 4.4 Images

Tout est peint en canvas par le code (aucune image téléchargée), avec un grain de papier
calculé une fois.

---

## 5. Reconstruction

### Pile technique

Canvas 2D vanilla, comme le jeu. Le décor se peint UNE fois par morceau de défilement dans
une toile à part (règle de La Bataille et de Paper Race : jamais de redessin de chaque
feuille à chaque image), puis se colle.

### Gains rapides

Passer le fond du bleu nuit au feuillage ; remplacer les panneaux sombres par du papier
crème ; ajouter le grain.

### Points délicats

- Le grain et les couches de feuilles coûtent cher : les peindre une fois, mesurer les
  images par seconde AVEC la carte graphique.
- Les tirs doivent rester lisibles sur le vert le plus clair (`{colors.leaf-sun}`).

### Confiance

Couleurs ✅, typographie ⚠️, performances ❓ (à mesurer).

---

## 6. À faire et à ne pas faire

### Do

À faire :


- Cerner d'encre tout ce qui se joue, et rien du décor.
- Garder le décor mat : la lumière et le halo sont réservés au héros, aux tirs, aux cristaux.
- Une seule lumière par planète (Jungle : soleil du matin, en haut à gauche).
- Écrire l'interface sur du papier crème, en Grandstander.

### Don't

À ne pas faire :


- Jamais de fond bleu nuit uni ni de panneau sombre arrondi (le look « IA »).
- Jamais de néon dans la Jungle (réservé à la Ceinture d'astéroïdes).
- Jamais de bordure grise fine ni de dégradé violet-bleu.
- Jamais recopier une œuvre de référence : on reprend sa façon de peindre, pas ses motifs.

---

## 7. Questions ouvertes

- Les deux polices sur un vrai téléphone, au soleil.
- Le coût du décor peint en images par seconde sur le Pixel.
- Le même papier convient-il au Désert, à l'Océan et à la Ceinture, ou chacun a-t-il le sien ?

---

## 8. Fichiers liés

- Maquette : `tools/mockup-patrouille-jungle.html`.
