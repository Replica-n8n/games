# La technique : PWA vanilla

Remplace la section « Stack recommandée » du kit (Expo, React Native, Zustand,
AsyncStorage, Jest). Le jeu est une PWA sans dépendance ni build, servie par GitHub
Pages depuis `games/`, comme les autres jeux du dépôt.

| Le kit prévoyait | Ici |
|---|---|
| Expo + TypeScript, Expo Router | JS vanilla, une page, des `<section>` qui alternent |
| `react-native-svg` | SVG insérés dans la page (pas en `<img>`, pour les animer) |
| `react-native-reanimated` | transitions CSS sur `transform` |
| Zustand + AsyncStorage | un module `js/etat.js` + `localStorage` |
| `@expo-google-fonts` | woff2 hébergés dans `polices/` |
| Jest + RNTL | `node --test` pour la logique, Playwright (Chromium, Pixel 9) pour les écrans |
| `expo-haptics` | `navigator.vibrate` |
| `expo-av` (voix off) | ⚠️ `speechSynthesis`, voix locales du téléphone, à vérifier hors ligne |
| Stores iOS / Android | installation depuis Chrome, rien à publier |

## Structure

```
games/petit-plus-minus/
  index.html            une page ; chaque écran est une <section>
  contenu.json          TOUT le texte destiné à l'enfant
  manifest.json, sw.js, icônes
  css/jeu.css           variables du thème (DESIGN.md) puis écrans
  polices/              Baloo 2, Nunito (woff2, latin)
  personnages/          les 3 SVG sources
  js/contenu.js         chargement et vérification de contenu.json
  js/jeu.js             logique PURE : combat, étoiles, niveaux, plafond, dates
  js/etat.js            lecture et écriture du stockage
  js/personnages.js     insertion et taille des personnages
  js/app.js             navigation et écrans
  tests/*.test.js       node --test
  docs/
tools/petit-plus-minus-*.mjs   bancs Playwright (au niveau de games/, comme les autres)
```

`js/jeu.js` ne touche ni au DOM ni au stockage : il se charge dans Node et se teste
sans navigateur.

## Le contenu

- `contenu.json` est dans le cache du service worker, chargé au démarrage.
- `contenu.js` **vérifie sa forme** : 4 niveaux de météo, chaque phrase du SOS désigne
  une paire qui existe, les paramètres du combat sont des nombres cohérents. Si un
  parent ou un psychologue a cassé le fichier en le relisant, l'app affiche la clé
  fautive au lieu de planter en silence.
- **Aucun texte pour l'enfant dans le code.** Le kit n'y arrive pas encore : une
  cinquantaine de phrases des maquettes (titres du SOS, fin des trésors, boutons, badges…)
  ne sont pas dans `contenu.json`. Elles y entrent **mot pour mot**
  au fil des écrans, et un contrôle cherche les chaînes françaises restées dans `js/`.

## Stockage

- **Toutes les apps de `replica-n8n.github.io` partagent le même `localStorage`.**
  Chaque clé commence donc par `ppm:`. Jamais de `localStorage.clear()`.
- Une clé `ppm:donnees` porte un numéro de format. On ajoute des champs, on n'en
  renomme aucun.
- Tout ce qui est daté l'est en instant absolu (`Date.now()`), le jour local se
  calcule à l'usage.
- `navigator.storage.persist()` est demandé à l'installation, pour que Chrome n'efface
  pas la progression quand le téléphone manque de place.
- Sauvegarde et restauration par fichier dans l'espace parent.

## Confidentialité, garantie par le navigateur

Le kit promet « aucune donnée ne quitte l'appareil ». On le rend vérifiable : la page
porte une politique de sécurité (`Content-Security-Policy`) qui **interdit toute
requête hors du dossier du jeu** (`default-src 'self'`). Même une erreur future ne
pourrait rien envoyer ailleurs. Pas de compte, pas d'analytics, pas de police
distante.

## Service worker

Copier le patron de `serpentin/sw.js`, qui a déjà payé ses erreurs :

- **Une seule constante `VERSION`**, dans `sw.js`. Le service la donne à la page par
  message ; la page ne la recopie pas.
- Cache nommé `petit-plus-minus:<portée>:VERSION` (comme `chevalier:`), et on ne
  supprime **que** les caches de ce préfixe (les autres jeux vivent sur la même origine).
- **Tout fichier que la page demande doit être dans `SHELL`.** Un oubli ne se voit pas
  en ligne : le service range le fichier au vol. Mais un téléphone qui installe le jeu
  et passe aussitôt hors ligne ne l'aurait pas. Le banc le contrôle.
- À l'installation, chaque fichier est demandé avec `?v=VERSION` : sans ça, les relais
  de GitHub Pages servent l'ancien fichier pendant ~10 min et le nouveau service le
  range pour de bon.
- `res.clone()` **avant** tout `then`, sinon rien n'est rangé, en silence.
- La navigation passe par le réseau en `cache: 'no-cache'`, avec repli sur le cache
  hors ligne. Tout élément ajouté au HTML reste facultatif pour le JS (HTML et JS
  peuvent arriver de deux versions différentes).
- La ligne de diagnostic et « Réparer la mise à jour » sont dans l'espace parent.

## Installation

C'est le parent qui installe. Bouton « Installer le jeu » dans l'espace parent quand
Chrome envoie `beforeinstallprompt`, et **toujours** le chemin de repli écrit à côté
(menu ⋮, « Ajouter à l'écran d'accueil ») : sur le Pixel, Chrome choisit seul le moment
de proposer. Sur iPhone : « Partager, puis Sur l'écran d'accueil ».
Jamais de bandeau d'installation devant l'enfant.

## Vérifier

Chaque contrôle doit savoir échouer : on le prouve une fois en injectant un défaut.

- `node --test petit-plus-minus/tests/` : combat (la meilleure phrase, la même pensée
  qui revient, la victoire), plafond quotidien et passage de minuit, niveaux, bonus,
  vérification de `contenu.json` sur un fichier volontairement cassé.
- Banc Playwright, Chromium au format **Pixel 9 et 360 × 640** : parcours accueil,
  météo, SOS ; action principale visible sans défiler ; animations réduites ; **hors
  ligne** ; cache installé comparé octet par octet au dépôt ; aucune requête hors de
  l'origine.
- Contrastes calculés pour le tableau de `DESIGN.md`, mesurés sur les pixels pour ce
  qui est posé sur l'arène.
- Lighthouse (3 passages) avant la mise en ligne.
- `/code-review` avant de pousser, puis vérification sur la production.
