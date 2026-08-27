# Serpentin, la prairie : plan d'implémentation

Plan tiré de [la spec du 2026-08-27](../specs/2026-08-27-serpentin-prairie-design.md).
Neuf étapes. Chacune dit ce qu'on écrit, **la preuve qui doit passer avant de
continuer**, et si le jeu est jouable à la fin.

Règle de travail, la même qu'aux échecs : **le contrôle s'écrit avant le code
qu'il contrôle**. Un contrôle qui n'a jamais échoué ne prouve rien.

Après chaque étape : changer `VERSION` dans `serpentin/sw.js`, et un commit.

## Ce qui existe déjà et qu'on suit

- `games/echecs/` pour la forme d'un jeu : un dossier, un `index.html`, son
  `manifest.json`, son `sw.js`, ses deux icônes
- `tools/parcours.mjs` pour la forme d'un contrôle Playwright : profil de
  téléphone, capture des erreurs console, sortie en JSON, captures dans
  `tools/captures/`
- `tools/perft.js` pour la forme d'un contrôle sans navigateur

⚠️ Les fichiers du dépôt sont en CRLF. Ne pas écrire de code qui découpe sur
`\n` en supposant des fins de ligne Unix.

---

## Étape 1 : le squelette PWA

**But** : que le jeu existe sur le téléphone, vide mais installable, pour que
toutes les étapes suivantes s'essaient en vrai.

On écrit `serpentin/index.html` (un canvas plein écran, fond de prairie, rien
d'autre), `manifest.json`, `sw.js` (copie de celui des échecs, `VERSION =
"serpentin-v1"`), `icone.html` puis les deux PNG, la carte dans l'`index.html`
racine, la ligne dans le tableau du `README.md`.

**Preuve** : la page s'ouvre, le service worker prend le contrôle au
rechargement, et **elle se relance en mode avion**. Un `manifest.json` présent
ne prouve rien, c'est le relancement hors ligne qui prouve.

Pas encore jouable.

## Étape 2 : le noyau du moteur

**But** : un monde qui tourne sans écran.

`tools/serpentin-moteur.mjs` **d'abord**, avec les cas de la spec qui ne
demandent que le déplacement : le serpent avance dans la direction visée, il
s'allonge de 2 unités par fleur, le score monte de 1, la fleur réapparaît
ailleurs, la longueur ne dépasse pas ce qui a été mangé.

Puis `serpentin/moteur.js` :

```
Moteur.creer({ monde, graine })   -> partie
partie.commander({ angle, fonce })
partie.pas(dt)                     -> avance d'une image
partie.serpents / .fleurs / .potions / .score / .fini / .evenements
```

Aucun accès au DOM. Un générateur aléatoire à graine (xorshift, quelques
lignes) plutôt que `Math.random`, sinon un contrôle qui échoue n'est pas
rejouable. En pied de fichier, les deux lignes qui rendent le fichier
utilisable des deux côtés :

```js
if (typeof module !== "undefined") module.exports = Moteur;
if (typeof globalThis !== "undefined") globalThis.Moteur = Moteur;
```

**Preuve** : `node tools/serpentin-moteur.mjs` passe. Toutes les valeurs
chiffrées viennent de l'objet `REGLAGES` en tête de fichier, aucune n'est
écrite en dur ailleurs.

Pas encore jouable.

## Étape 3 : la prairie s'affiche

**But** : voir le monde.

`serpentin/mondes.js` : un objet `prairie` avec le fond, la couleur du sol, la
haie, les couleurs des fleurs, celles des serpents, la liste des obstacles à
semer, et les potions autorisées. **Rien de ce qui est propre à la prairie ne
doit se retrouver dans `moteur.js` ni dans `index.html`.**

Dans `index.html` : la boucle d'affichage, la caméra qui suit la tête, le
damier du sol, la haie du bord, les buissons, les fleurs, les serpents dessinés
en polyligne à bouts ronds avec les deux yeux.

**Preuve** : `tools/serpentin-pixel9.mjs`, profil Pixel 9, capture d'écran, et
zéro erreur console. Contrôle de frontière : ajouter un faux deuxième monde
dans `mondes.js` et vérifier qu'il s'affiche **sans toucher aux deux autres
fichiers**, puis le retirer. Si ça demande de modifier `moteur.js`, la
frontière est mal placée et on la corrige tout de suite.

Le serpent bouge tout seul. Pas encore jouable au doigt.

## Étape 4 : les contrôles

**But** : le pouce dirige.

Manche flottant : le doigt se pose dans la moitié basse, le cercle apparaît
là, la direction suit le tirage. Bouton pour foncer en bas à droite, maintenu,
cible d'au moins 44 px, visible en permanence.

**Preuve** : dans `serpentin-pixel9.mjs`, un vrai glisser tactile
(`touchscreen.tap` et `mouse.move` en mode tactile) change bien l'angle du
serpent, et maintenir le bouton fait **baisser la longueur** et monter la
vitesse. On lit l'état du moteur depuis la page, on ne se fie pas à la capture.

**Jouable pour la première fois.** Point d'arrêt : à essayer sur le Pixel 9a
avant de continuer.

## Étape 5 : mourir

**But** : les collisions et la fin de partie.

Dans `moteur.js` : tête contre corps d'un autre égale mort, corps contre tête
égale survie, le mort se transforme en fleurs, le buisson ralentit à 60 %
pendant une seconde et coûte 5 % de la longueur au plus une fois par seconde,
le bord fait glisser sur la tangente.

Dans `index.html` : un écran de fin minimal, le score et un gros bouton
**Rejouer**.

**Preuve** : quatre cas ajoutés à `serpentin-moteur.mjs`, posés à la main sans
aléatoire : la mort tête contre corps, la survie corps contre tête, le buisson
qui ralentit **sans tuer**, le bord qui fait glisser **sans tuer**. Ces deux
derniers sont les écarts assumés de la spec : s'ils cassent un jour, il faut
que ce soit un contrôle qui le dise, pas un enfant.

## Étape 6 : les adversaires

**But** : une arène vivante.

Les trois comportements (brouteur, chasseur, peureux), le nombre de bots
`8 + score / 400` plafonné à 22, l'agressivité
`min(1 ; 0,15 + score / 6000 + niveau / 40)`.

**Preuve** : dans `serpentin-moteur.mjs`, un chasseur placé devant un joueur
plus petit lui coupe la route en moins de N images, un peureux placé devant un
plus gros s'en éloigne. Et `tools/serpentin-images.mjs` mesure les images par
seconde avec 22 serpents et 450 fleurs sur le profil Pixel 9.

**Si on est sous 50 images par seconde, on baisse le plafond de serpents ici,
et on l'écrit dans la spec.** On ne continue pas en espérant que ça passera.

## Étape 7 : les potions

**But** : le sel du jeu pour un enfant.

Apparition toutes les 20 secondes environ, trois au plus, disparition à 25
secondes. Feu, fantôme, aimant. Un seul effet à la fois, 10 secondes, anneau
qui se vide autour de la tête et couleur du serpent qui change. Les bots les
ignorent dans cette version.

**Preuve** : dans `serpentin-moteur.mjs`, l'effet expire à 10 secondes pile,
une deuxième potion remplace la première et repart de 10, le feu tue au contact
sans mourir, le fantôme traverse sans mourir, l'aimant attire les fleurs à 160
unités et pas à 200. Dans `serpentin-pixel9.mjs`, une potion ramassée pour de
vrai et l'anneau visible sur la capture.

## Étape 8 : la progression

**But** : que finir une partie serve à quelque chose.

`serpentin/progression.js` : l'expérience, la table des 20 niveaux, les
plafonds, les six quêtes, les treize serpents, la lecture et l'écriture de la
clé `serpentin.v1`. Aucun accès au DOM non plus, mêmes deux lignes de pied de
fichier.

Les écrans : départ (titre, serpent qui ondule, gros bouton **Jouer**, entrées
Serpents et Quêtes, **aucune phrase d'explication**), fin de partie (score,
expérience gagnée, barre qui se remplit sous les yeux, ce qui vient d'être
débloqué, gros bouton **Rejouer**), menu 3 points (recommencer, choisir son
serpent, installer le jeu, effacer la progression).

L'installation reprend le mécanisme des échecs : garder `beforeinstallprompt`
sous la main et le proposer depuis le menu.

Les paliers 5, 10 et 15 affichent « bientôt ».

**Preuve** : `tools/serpentin-progression.mjs` sans navigateur, la table entière
niveau par niveau, les plafonds qui ne sont pas dépassés, chaque quête qui se
déclenche sur son cas et pas sur un autre, la relecture après écriture. Et dans
`serpentin-pixel9.mjs` : une partie jouée, mourir, l'expérience gagnée à
l'écran, le rechargement de la page, l'expérience toujours là.

## Étape 9 : régler, mesurer, mettre en ligne

**But** : que ce soit un jeu, pas une démonstration technique.

Jouer et régler les valeurs de `REGLAGES` : vitesse, coût du boost, densité des
fleurs, nombre de buissons, agressivité. Ces valeurs ne se règlent pas sur le
papier.

Puis le contrôle complet, dans cet ordre :

| Contrôle | Ce qu'il prouve |
|---|---|
| `node tools/serpentin-moteur.mjs` | les règles, sans navigateur |
| `node tools/serpentin-progression.mjs` | l'expérience, les quêtes, le stockage |
| `node tools/serpentin-pixel9.mjs` | le parcours complet, profil Pixel 9 |
| `node tools/serpentin-images.mjs` | les images par seconde à 22 serpents |
| `node tools/serpentin-enligne.mjs` | ce que GitHub Pages sert vraiment, dont le relancement hors ligne |

Enfin `git push`, et le contrôle en ligne. Rappel du dépôt : pas de `gh` CLI
sur la machine, mais `git push` passe.

**Le dernier contrôle, c'est un enfant de 8 ans avec le téléphone dans la
main.** Tout ce qui précède ne fait que rendre ce moment possible.

---

## Fini veut dire

- les cinq contrôles ci-dessus passent, et je montre leur sortie
- 60 images par seconde visées, jamais moins de 50, mesuré et pas supposé
- le jeu se relance hors ligne après installation
- aucune requête réseau pendant une partie
- zéro erreur console sur le parcours complet
- `README.md` et l'`index.html` racine à jour

## Ce que je ne fais pas dans ce plan

Le volcan, le château, le vaisseau, les dangers vivants, le son, le
multijoueur. Ils viendront après le premier essai réel, et l'ordre dépendra de
ce que l'enfant aura trouvé ennuyeux.
