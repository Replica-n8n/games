/* Pièce à conviction : service worker. Patron de bataille/sw.js.
   ⚠️ VERSION n'existe QU'ICI. La changer à chaque modification d'un fichier de
   SHELL (code, style, enquête), sinon le téléphone garde l'ancienne version.
   tools/conviction-pwa.mjs vérifie que SHELL contient tout ce que le jeu charge. */
var VERSION = "conviction-5";
/* Tous nos jeux et apps partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage : le cache porte le nom du jeu et de sa portée, et l'activation ne
   supprime QUE les siens. */
var PREFIXE = "conviction:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./config.js",
  "./engine/board.js",
  "./engine/clues.js",
  "./engine/colors.js",
  "./engine/culprit.js",
  "./engine/decor.js",
  "./engine/furniture.js",
  "./engine/hint.js",
  "./engine/index.js",
  "./engine/solver.js",
  "./engine/validate.js",
  "./i18n/fr.js",
  "./ui/app.js",
  "./ui/buste.js",
  "./ui/game.js",
  "./ui/home.js",
  "./ui/icons.js",
  "./ui/portraits.js",
  "./ui/scene.js",
  "./ui/state.js",
  "./ui/storage.js",
  "./polices/atkinson-hyperlegible-400.woff2",
  "./polices/atkinson-hyperlegible-700.woff2",
  "./polices/bricolage-grotesque.woff2",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png",
  "./puzzles/blanc-couteaux-moyen.json",
  "./puzzles/blanc-glass-onion-difficile.json",
  "./puzzles/christie-dix-moyen.json",
  "./puzzles/christie-presbytere-facile.json",
  "./puzzles/christie-presbytere-moyen.json",
  "./puzzles/cluedo-tudor-difficile.json",
  "./puzzles/cluedo-tudor-moyen.json",
  "./puzzles/holmes-221b-facile.json",
  "./puzzles/holmes-221b-moyen.json",
  "./puzzles/holmes-baskerville-difficile.json",
  "./puzzles/holmes-baskerville-moyen.json",
  "./puzzles/index.json",
  "./puzzles/leroux-chambre-jaune-facile.json",
  "./puzzles/leroux-chambre-jaune-moyen.json",
  "./puzzles/poirot-nil-facile.json",
  "./puzzles/poirot-nil-moyen.json",
  "./puzzles/poirot-orient-express-difficile.json",
  "./puzzles/poirot-orient-express-moyen.json",
  "./puzzles/shakespeare-hamlet-facile.json",
  "./puzzles/shakespeare-macbeth-difficile.json",
  "./puzzles/shakespeare-macbeth-moyen.json",
  "./puzzles/valcourt.json",
  "./puzzles/westeros-pourpres-difficile.json",
  "./puzzles/westeros-pourpres-moyen.json",
  "./puzzles/westeros-rouges-difficile.json"
];

self.addEventListener("install", function(e){
  /* Chaque fichier est demandé avec la VERSION dans son adresse : les relais de
     GitHub Pages gardent un fichier ~10 min après une publication, et sans ça le
     nouveau service rangerait l'ANCIEN fichier pour de bon. On le range sous son
     nom propre. */
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(f){
        var frais = f + (f.indexOf("?") < 0 ? "?" : "&") + "v=" + encodeURIComponent(VERSION);
        return fetch(new Request(frais, { cache: "reload" })).then(function(res){
          if(!res.ok) throw new Error(f + " : " + res.status);
          return c.put(f, res);
        });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("message", function(e){
  if(e.data === "version" && e.ports && e.ports[0]) e.ports[0].postMessage(VERSION);
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){
        return k.indexOf(PREFIXE) === 0 && k !== CACHE;
      }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function coquille(){
  return caches.open(CACHE).then(function(c){ return c.match("./index.html"); });
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== location.origin) return;

  /* Navigation (l'accueil, ou ?enquete=…) : le réseau d'abord, revalidé (Pages
     garde le HTML 10 min en cache HTTP), la page du cache hors ligne : c'est la
     même pour toutes les enquêtes, seule l'adresse change. */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(function(res){ return res.ok ? res : coquille().then(function(hit){ return hit || res; }); })
        .catch(coquille)
    );
    return;
  }

  /* Le reste : cache d'abord, dans NOTRE cache seulement. La copie (clone) se
     fait AVANT de rendre la réponse : faite plus tard, « body already used », en
     silence, et rien n'est rangé. */
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return c.match(req, { ignoreSearch: true }).then(function(hit){
        return hit || fetch(req).then(function(res){
          if(res.ok && !new URL(req.url).search) c.put(req, res.clone()).catch(function(){});
          return res;
        });
      });
    })
  );
});
