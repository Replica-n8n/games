/* Échecs et Dames : service worker.
   ⚠️ Changer VERSION a chaque modification d'un fichier de la liste,
   sinon le telephone garde l'ancienne version en cache. */
var VERSION = "damier-v10";
/* Toutes nos apps partagent l'origine replica-n8n.github.io, donc le meme
   CacheStorage. Le cache porte le nom de l'app et de sa portee, et
   l'activation ne supprime QUE les siens : avant, chaque mise a jour du jeu
   effacait le hors ligne de GVT, de La Cour et de l'autre jeu. */
var PREFIXE = "echecs:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var ANCIENS = ['damier-', 'echecs-v'];
var SHELL = [
  "./",
  "./index.html",
  "./moteur-echecs.js",
  "./moteur-dames.js",
  "./polices/gelasio-400-latin.woff2",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png"
];

self.addEventListener("install", function(e){
  /* cache: "reload" : sans lui, addAll() peut remplir le nouveau cache avec
     les fichiers du cache HTTP, donc l'ancienne version.

     ⚠️ ET CA NE SUFFIT PAS : `reload` contourne le cache du TELEPHONE, pas
     celui des serveurs relais de GitHub Pages, qui gardent chaque fichier
     jusqu'a 10 minutes apres une publication. Le 2026-09-17, installee dans
     ces 10 minutes, la v77 du Chevalier a range l'`armes.js` de la v76 dans
     SON cache, et un fichier range la y reste jusqu'a la version suivante.
     Meme defaut ici. On demande donc chaque fichier avec la VERSION dans son
     adresse : pour les relais c'est une adresse jamais vue, ils vont la
     chercher a la source. On le range sous son nom propre. */
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

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){
        return (k.indexOf(PREFIXE) === 0 && k !== CACHE) ||
          ANCIENS.some(function(a){ return k.indexOf(a) === 0; });
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

  /* Navigation : le reseau d'abord, revalide (Pages garde le HTML 10 min en
     cache HTTP), la coquille hors ligne. */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(function(res){ return res.ok ? res : coquille().then(function(hit){ return hit || res; }); })
        .catch(coquille)
    );
    return;
  }

  /* Le reste : cache d'abord, dans NOTRE cache seulement. Un caches.match sans
     nom pouvait rendre le fichier d'une autre version ou d'une autre app, et
     une reponse en erreur n'est jamais gardee. */
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          if(res.ok && !new URL(req.url).search) c.put(req, res.clone()).catch(function(){});
          return res;
        });
      });
    })
  );
});
