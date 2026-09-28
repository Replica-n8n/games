# Petit Plus contre Petit Minus

Jeu PWA pour aider un enfant d'environ 8 ans à apprivoiser son anxiété. L'anxiété est
**Petit Minus** (petit démon violet, grognon mais pas effrayant) ; les ressources de
l'enfant, **Petit Plus** (petite fée à baguette étoile). Rien à voir avec l'app
« Petits plus » (dépôt `petits-plus`) : ne jamais mélanger les deux.

Lire avant toute fonctionnalité :

- `docs/GAME_DESIGN.md` : le pourquoi de chaque mécanique, et les décisions tranchées **[tranché]**
  (ne pas les rouvrir en codant) ;
- `docs/DESIGN.md` : couleurs corrigées, tailles, mise en page, mouvement ;
- `docs/PWA.md` : structure, stockage, service worker, vérifications ;
- `docs/OPTIMISATION.md` : ce qui a changé par rapport au kit d'origine, et pourquoi ;
- `docs/PHRASES.md` : **avant de toucher à une phrase ou un thème** : les règles d'écriture
  vérifiées sur sources, les thèmes éteints par défaut, et pourquoi ;
- `docs/maquettes-kit/` : les maquettes du kit (390 × 844). Elles appellent un
  `support.js` absent et ne s'affichent pas : lire leur HTML comme référence de mise
  en page, pas comme code.

## Principes non négociables

1. **Le but est que l'enfant n'ait plus besoin du jeu.** Aucune mécanique qui pousse à
   jouer plus longtemps pour jouer.
2. **Pas de dark patterns.** Pas de séries perdues, pas de notification, pas de Minus
   qui grossit quand l'enfant ne joue pas, pas de punition. Une mauvaise réponse aide
   « un peu », jamais sanctionnée.
3. **Le SOS est calme** : ni score, ni étoile, ni chrono, ni vibration, animations
   lentes, et le rappel « tu peux aller voir un adulte » toujours visible.
4. **Une boîte à outils, pas une partie** (pivot du 2026-09-27, après le test de
   l'enfant) : l'accueil propose tous les outils au même niveau, l'enfant choisit. Pas
   d'étoiles, de niveaux ni de diplômes. Une phrase à lire à la fois, 12 mots au plus, et
   aucun texte à lire pendant un exercice du corps (bougie, robot).
5. **Rien ne quitte le téléphone**, et la page l'interdit (`default-src 'self'`). Pas de
   compte, pas d'analytics, pas de police distante.
6. **Tout le texte destiné à l'enfant est dans `contenu.json`**, jamais dans `js/`.
7. **Accessible** : 44 px, contrastes calculés, libellés sur chaque bouton, texte ≥ 14 px,
   `prefers-reduced-motion` respecté sans que la bulle de respiration perde son rôle.

## Invariants techniques

- **`VERSION` n'existe qu'une fois, dans `sw.js`.** La page la demande au service
  (`window.ppm.versionDuService()`). La changer à chaque modification d'un fichier de
  `SHELL`, et tout fichier nouveau que la page charge va dans `SHELL`.
- Cache `petit-plus-minus:<portée>:VERSION` ; ne supprimer que les caches de ce préfixe.
- Les textes arrivent par `data-texte="chemin.dans.contenu"` : aucun texte dans `js/`
  (sauf `contenu.js`, pour l'adulte qui relit, et `demo.js`, l'atelier).
- Clés de stockage préfixées `ppm:` (même origine que les autres jeux).
- `js/jeu.js` reste PUR (ni DOM, ni stockage) : il se teste dans Node.
- Les personnages sont créés une fois et on anime les MÊMES éléments.

## Vérifier

```bash
npm test
```

(depuis `petit-plus-minus/`) : logique pure, vérification de `contenu.json` sur des
fichiers cassés exprès, contrastes recalculés depuis `css/jeu.css`, aucune phrase
dans `js/`.

```bash
node petit-plus-minus-pwa.mjs
```

(depuis `tools/`) : Chromium au format Pixel 9, polices, textes, 732 et 640 px,
service worker, cache comparé octet par octet au dépôt, hors ligne, aucune requête
hors du site, contenu cassé, Minus qui rétrécit les pieds au sol, animations
réduites. Chaque contrôle a été vu échouer sur un défaut injecté.
`node petit-plus-minus-icones.mjs` refait les icônes depuis le SVG de Petit Plus.
`demo.html` est un atelier (hors du jeu et du cache) pour voir les tailles et la bulle.

En ligne depuis le 2026-09-26 : <https://replica-n8n.github.io/games/petit-plus-minus/>.
`node petit-plus-minus-enligne.mjs` (depuis `tools/`) vérifie la production.

## Façon de travailler

Répondre et commenter en français, sans tiret cadratin. Petites étapes vérifiables ;
montrer une capture du comportement avant de coder une règle et avant de livrer.
Travail sur la branche `petit-plus-minus`, rien sur `main` sans accord.
