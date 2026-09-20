/* Circuit quadrillé : service worker.
   ⚠️ Changer VERSION à chaque modification d'un fichier de SHELL, et la même
   dans ui.js : un essai de tools/paper-race-pwa.mjs compare les deux. */
var VERSION = "paper-race-v13";
/* Toutes nos apps partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage : le cache porte le nom du jeu et de sa portée, et
   l'activation ne supprime QUE les siens. */
var PREFIXE = "paper-race:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./moteur.js",
  "./sons.js",
  "./rendu.js",
  "./ui.js",
  "./qr.js",
  "./ligne.js",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png",
  "./polices/bricolage-800-latin.woff2",
  "./polices/karla-latin.woff2"
];

self.addEventListener("install", function(e){
  /* Chaque fichier est demandé avec la VERSION dans son adresse : les relais
     de GitHub Pages gardent un fichier jusqu'à 10 minutes après une
     publication, et `cache: "reload"` ne les contourne pas. Sans ça, un
     service installé juste après un envoi rangeait l'ANCIEN fichier dans le
     cache de la NOUVELLE version, pour de bon (vécu sur le Chevalier v77).
     On le range sous son nom propre. */
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

/* Le service dit sa version : le menu la compare à celle de la page, qui
   vient du réseau, et propose « Réparer » si elles diffèrent. */
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

  /* Le reste : cache d'abord, dans NOTRE cache seulement, avec repli sans
     paramètre pour une adresse en `?v=`. Une réponse en erreur n'est jamais
     gardée, et la copie se fait AVANT tout `then` (sinon « body already
     used » et rien n'est rangé). */
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        return hit || c.match(req, { ignoreSearch: true }).then(function(hit2){
          return hit2 || fetch(req).then(function(res){
            if(res.ok && !new URL(req.url).search) c.put(req, res.clone()).catch(function(){});
            return res;
          });
        });
      });
    })
  );
});
