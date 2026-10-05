---
name: La Bataille
description: Nuit claire. Le ciel du mois occupe tout l'écran, le tapis et les commandes sont des plaques de verre teinté posées dessus, et les cartes vivantes sont la seule chose vraiment colorée.
colors:
  ciel1: "#000644"
  ciel2: "#202a6b"
  texte: "#f4f2ff"
  texte2: "#caceff"
  marque: "#dfe0ff"
  lueur: "#008580"
  surface: "#111b5e"
  accent: "#feca63"
  surAccent: "#010c53"
  moi: "#feca63"
  lui: "#cdacff"
  luiPlein: "#a57ce5"
  choix: "#ffd790"
typography:
  display:
    fontFamily: "'Fraunces', Georgia, serif"
    fontWeight: 600
    fontSize: "36px (mois), 58px (titre), 30px (fin de mois), 22px (ruban)"
    lineHeight: 1
  body:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontWeight: 500
    fontSize: "15px (règle du mois, astuce), 14px (noms d'arcanes, camps)"
    lineHeight: 1.25
  chiffre:
    fontFamily: "'Outfit', system-ui, sans-serif"
    fontWeight: 700
    fontSize: "22px (compte), 17px et 20px (dégâts), 21px (action)"
rounded:
  pastille: "17px"
  arcane: "22px"
  tapis: "26px"
  page: "28px"
  action: "30px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "24px"
components:
  action:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surAccent}"
    rounded: "{rounded.action}"
    height: "60px"
  arcane:
    backgroundColor: "rgba(6,10,44,.66)"
    textColor: "{colors.texte}"
    rounded: "{rounded.arcane}"
    size: "92px × 86px"
  compte:
    backgroundColor: "rgba(6,10,44,.66)"
    rounded: "{rounded.pastille}"
    height: "34px"
---

# La Bataille : Nuit claire

Direction choisie par Julie le 2026-10-05, parmi trois maquettes
(`tools/mockup-bataille-portrait.html` : Le tapis, La lame, Nuit claire).

## Le monde

Une partie dure une année, et chaque mois a sa constellation. Le ciel n'est donc
pas un bandeau : il occupe tout l'écran, du haut jusque sous le pouce. Tout le
reste est posé dessus comme du verre teinté. Les cartes à jouer sont les seuls
objets opaques et colorés : c'est sur elles que l'œil doit tomber.

## La signature

Les cartes sont des personnages (yeux, jambes, une arme selon le rang). Rien
d'autre à l'écran ne cherche à être remarqué.

## Disposition (portrait, 360 de large, hauteur libre)

De haut en bas : le mois, sa règle en une phrase et sa constellation ; les douze
points de l'année ; le compte (une seule barre, les 32 cartes partagées) ; le
tapis à cinq colonnes, les cartes du Maudit en haut, les tiennes en bas ; puis
sous le pouce les arcanes, 24 px, et l'action principale.

## Règles

- **Couleurs** : celles de `:root` sortent de `tools/bataille-couleurs.mjs` (tons
  calculés, paires texte/fond contrôlées). Ne jamais en retoucher une à la main.
  Les cartes à jouer gardent leurs couleurs d'objet. L'or est à toi, le violet au
  Maudit, partout et seulement pour ça ; chaque camp se reconnaît aussi par son
  côté de l'écran et le dos de ses cartes.
- **Verre** : une plaque teintée, liseré sombre au bord, reflet sur l'arête du
  haut. **Aucun flou pendant le jeu** : il coûtait 15 images par seconde. Seuls
  les écrans de titre et de fin floutent, jeu à l'arrêt. Ce qui se pose sur le
  tapis (astuce, ruban, page de fin de mois) est presque opaque (classe `plein`).
  Sous `prefers-reduced-transparency` ou `prefers-contrast: more`, tout devient
  plein.
- **Formes** : tout est rond. Pas d'angle vif, pas d'ombre dure décalée.
- **Texte** : rien sous 14 px. Fraunces pour ce qui se lit comme un titre (mois,
  chiffres romains, ruban), Outfit pour tout le reste. Pas de phrase
  d'explication à l'écran titre ; la règle du mois tient en une phrase ; toucher
  un arcane hors combat dit ce qu'il fait.
- **Lisibilité du combat** : un chiffre de dégâts s'écrit à côté de la carte
  touchée, jamais sur une jauge ; la jauge de vie est du côté du camp de la
  carte ; une carte ne cache jamais sa rivale ; une carte tombée s'efface à
  moitié.
- **Ciel** : chaque constellation est la vraie figure du ciel (nord en haut, est à
  gauche), calculée par `tools/bataille-constellations.mjs`. Jamais dessinée à la main.
- **Mouvement** : 150 à 300 ms, décélération franche, jamais de rebond ; rien
  sous `prefers-reduced-motion`.
- **Cibles** : 44 px au moins, 8 px entre deux cibles, l'action principale fait
  60 px de haut sur toute la largeur.
