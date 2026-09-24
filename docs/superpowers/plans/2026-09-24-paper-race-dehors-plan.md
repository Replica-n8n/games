# Paper Race, dehors pour de vrai et plus de demi-tour : plan

Plan tiré de [la spec](../specs/2026-09-24-paper-race-dehors-design.md). Le contrôle
d'abord, vu rouge, puis le code.

1. **Moteur** : contrôles (Montréal dehors, retour, avancement ; recul à l'arrêt
   interdit sauf case sans avant), rouges ; puis `play` (branche sortie),
   `choices`, `suivants`, `REGLES = 4`. Pars, niveaux, ordre, équité, référence.
2. **Écran** : pastille « Hors piste », contrôles navigateur `paper-race-coince.mjs`
   (dehors, retour seul proposé) et `paper-race-contresens.mjs` (à l'arrêt aussi),
   vus rouges.
3. **Livraison v20** : batterie complète, relais local puis prod, README, CLAUDE.md,
   mémoire.
