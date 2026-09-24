# Paper Race, pas de contresens : plan d'implémentation

Plan tiré de [la spec du 2026-09-24](../specs/2026-09-24-paper-race-contresens-design.md).
Le contrôle s'écrit AVANT le code, on le voit rouge, puis vert.

1. **Moteur** : contrôles dans `tools/paper-race-moteur.js` (qui roule ne recule
   pas, à l'arrêt c'est permis, `REGLES === 3`), rouges ; puis `choices` et
   `REGLES`. Pars (`paper-race-circuits.js`), référence régénérée en prouvant
   que seules les courses où l'ordinateur reculait en roulant ont changé ;
   niveaux, difficulté, équité.
2. **Écran** : panneau sens interdit sur la piste (`rendu.js`), bouton du pavé
   et son nom (`ui.js`), ligne des règles (`index.html`). Contrôle navigateur
   `tools/paper-race-contresens.mjs` (pixels du panneau, nom du bouton, ligne
   des règles), vu rouge.
3. **Livraison v19** : tous les contrôles (UI, PWA, grille, pièges vus, coincé,
   en ligne contre le relais local puis la prod), `VERSION`, README, CLAUDE.md,
   push, prod, mémoire. Le relais ne change pas (pr-4 connaît déjà `regles`).
