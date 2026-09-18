# Le relais de Paper Race

Un Cloudflare Worker et un Durable Object qui relaient les coups d'une course
EN LIGNE entre deux téléphones. Il ne connaît pas les règles : il garde la
liste des coups, vérifie que chacun joue à son tour, et la renvoie aux deux.
Chaque téléphone rejoue les coups avec `paper-race/moteur.js`.

- **Rien sur les joueurs** : ni nom, ni compte, ni discussion. Une course tient
  dans un code de 4 caractères et s'efface après 24 h sans un coup.
- **Seuls nos sites** peuvent s'en servir (`ORIGINES` dans `worker.js`).
- **Plan gratuit** : les Durable Objects en SQLite y sont inclus. Une course de
  50 coups coûte une centaine de requêtes ; le plafond gratuit est de 100 000
  par jour.

## Tester en local

```bash
cd serveur-paper-race
npx wrangler dev --port 8787
```

Puis, depuis `games/` : `node tools/paper-race-relais.mjs` (le relais seul) et
`node tools/paper-race-ligne.mjs` (deux téléphones de bout en bout). Servi sur
`127.0.0.1`, le jeu parle au relais local tout seul.

## Déployer

Une seule fois, se connecter au compte Cloudflare (une page s'ouvre, on
autorise) :

```bash
npx wrangler login
```

Puis, à chaque modification :

```bash
cd serveur-paper-race
npx wrangler deploy
```

L'adresse est `https://paper-race.jfrxdi0zz.workers.dev`, écrite dans
`paper-race/ligne.js` (`RELAIS`). ⚠️ Changer `WORKER_VERSION` dans `worker.js`
à chaque modification, et vérifier en production :
`RELAIS=https://paper-race.jfrxdi0zz.workers.dev node tools/paper-race-relais.mjs`.

⚠️ **Déployer le relais AVANT de publier un jeu qui s'en sert** : sinon
« Créer la course en ligne » répond « Pas de réseau ».
