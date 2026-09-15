# Le chevalier : les armes légendaires, et le Labo

## Pourquoi

« J'aimerais qu'on se sente puissant quand on a atteint le maximum d'une arme
ou d'un bonus. » Au niveau 6 il ne se passe rien : la carte cesse simplement
d'être proposée. Chaque arme au maximum gagne donc un **pouvoir en plus**, qui
se voit et qui dure jusqu'à la fin de la partie.

Hors champ, par décision : pierre d'aimant, heaume, longue-vue.

## Ce qui est commun

- **La carte du niveau 6 annonce le pouvoir**, en or : « Épée légendaire ·
  lance une salve d'énergie ». Une fonction que rien n'annonce n'existe pas.
- **Au choix de cette carte** : un anneau doré autour du perso et une fanfare,
  sans pause.
- **Chaque arme porte sa fiche `legendaire`** dans `armes.js` (nom, phrase,
  réglages). Le pouvoir et son dessin vivent dans `armes.js`, à côté de l'arme.
- **Un effet à la fois**, testé en jeu par elle avant le suivant. Ordre :
  épée, bouclier, arc, chausse-trappe, bottes, puis magicien, gantelets,
  sablier.
- **Chaque effet est mesuré** : un contrôle du moteur prouve le pouvoir, un
  banc vérifie qu'il n'écrase pas la difficulté.

## Les pouvoirs retenus

| Arme ou objet | Pouvoir au niveau max |
|---|---|
| ⚔️ Épée | un moulinet sur deux lance une salve d'énergie qui traverse |
| 🛡️ Bouclier | une bulle encaisse un coup sans perte de cœur, éclate en repoussant, revient après 20 s |
| 🏹 Arc | flèches de feu qui explosent à l'impact (petite zone) |
| 🪤 Chausse-trappe | à préciser au moment de la faire |
| 👢 Bottes | traînée de doubles bleu-violet quand on court, purement visuelle |
| magicien, gantelets, sablier | à préciser au moment de les faire |

## Épée légendaire (le premier)

- Un moulinet sur deux lance aussi un **croissant de lumière dorée** dans la
  direction du perso : vitesse 560, course 400 unités.
- Il **traverse** et blesse chaque bestiole **une seule fois**, à 60 % des
  dégâts du moulinet, avec un léger recul.
- Il grandit un peu en avançant et s'efface en fin de course.
- Contrôle : au niveau 6 une bestiole à 250 unités devant est touchée ; au
  niveau 5, non.

## Le Labo (mode test)

« Pour que je puisse tester l'épée max direct, pas attendre de jouer
normalement. »

- Bouton **🧪 Labo** dans le menu ⋯. Il ouvre un écran avec un interrupteur
  par arme (les 8) et par objet (les 6), plus **Invincible**.
- Allumé = donné au **niveau maximum**. Pas de limite de 4 dans le Labo.
- Ce qui est **à valider** porte une étiquette « à valider » et est allumé
  d'office : une liste `A_VALIDER` dans `index.html`, mise à jour à chaque
  livraison.
- **Lancer** démarre une partie dans le monde choisi, sans roue, qui ne
  compte pas dans les souvenirs (comme le mode boss).
- Invincible : le moteur ignore les coups (`partie.intouchable`).

## Vérifier

- `chevalier-moteur.mjs` : le pouvoir de chaque arme.
- `chevalier-labo.mjs` : le Labo s'ouvre, les interrupteurs donnent les armes
  au max, la partie ne compte pas, capture de l'effet.
- Banc de difficulté avant/après chaque pouvoir.
