/* Ghost Train : service worker. Patron de patrouille/sw.js.
   ⚠️ VERSION n'existe QU'ICI. La changer à chaque modification d'un fichier de
   SHELL (code, style, mission), sinon le téléphone garde l'ancienne version.
   Trois chiffres, majeur.mineur.correctif (docs/ghost-train-versions.md) : du
   nouveau = mineur, une correction = correctif. Les réglages l'affichent.
   tools/ghost-train-pwa.mjs vérifie que SHELL contient tout ce que le jeu charge. */
var VERSION = "ghost-train-1.4.0";
/* Tous nos jeux partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage : le cache porte le nom du jeu et de sa portée, et l'activation ne
   supprime QUE les siens. */
var PREFIXE = "ghost-train:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./app.js",
  "./entrees.js",
  "./sauvegarde.js",
  "./son.js",
  "./moteur/actions.js",
  "./moteur/constantes.js",
  "./moteur/evenements.js",
  "./moteur/fantomes.js",
  "./moteur/hasard.js",
  "./moteur/joueur.js",
  "./moteur/notes.js",
  "./moteur/partie.js",
  "./moteur/progression.js",
  "./moteur/projection.js",
  "./moteur/rail.js",
  "./contenu/especes.js",
  "./contenu/missions.js",
  "./contenu/textes.js",
  "./ecran/decor.js",
  "./ecran/dessins.js",
  "./ecran/menus.js",
  "./ecran/police.js",
  "./ecran/scene.js",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png"
];

self.addEventListener("install", function(e){
  /* Chaque fichier est demandé avec la VERSION dans son adresse : les relais de
     GitHub Pages gardent un fichier ~10 min après une publication, et sans ça le
     nouveau service rangerait l'ANCIEN fichier pour de bon. */
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

  /* Navigation : le réseau d'abord, revalidé (Pages garde le HTML 10 min en cache
     HTTP), la page du cache hors ligne. */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(function(res){ return res.ok ? res : coquille().then(function(hit){ return hit || res; }); })
        .catch(coquille)
    );
    return;
  }

  /* Le reste (dont les modules ES du jeu) : cache d'abord, dans NOTRE cache
     seulement. La copie se fait AVANT de rendre la réponse. */
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
