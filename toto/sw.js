/* toto : service worker. Patron de petit-plus-minus/sw.js.
   ⚠️ VERSION n'existe QU'ICI. La changer à chaque modification d'un fichier de
   SHELL, sinon le téléphone garde l'ancienne version. */
var VERSION = "toto-22";
/* Tous nos jeux et apps partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage : le cache porte le nom du jeu et de sa portée, et l'activation ne
   supprime QUE les siens. */
var PREFIXE = "toto:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./polices/bigshoulders-stencil-800-latin.woff2",
  "./polices/barlow-sc-500-latin.woff2",
  "./polices/barlow-sc-700-latin.woff2",
  "./polices/barlow-sc-500i-latin.woff2",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png"
];

self.addEventListener("install", function(e){
  /* Chaque fichier est demandé avec la VERSION dans son adresse : les relais de
     GitHub Pages gardent un fichier ~10 min après une publication, et sans ça le
     nouveau service rangerait l'ANCIEN fichier pour de bon (vécu sur le chevalier,
     v77). On le range sous son nom propre. */
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

  /* Navigation : le réseau d'abord, revalidé (Pages garde le HTML 10 min en
     cache HTTP), la coquille hors ligne. */
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
