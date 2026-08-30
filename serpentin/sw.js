/* Serpentin : service worker minimal.
   ⚠️ Changer VERSION a chaque modification d'un fichier de la liste,
   sinon le telephone garde l'ancienne version en cache. */
var VERSION = "chevalier-v45";
var SHELL = [
  "./",
  "./index.html",
  "./moteur.js",
  "./mondes.js",
  "./bestioles.js",
  "./meteo.js",
  "./souvenirs.js",
  "./sons.js",
  "./armes.js",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* cache d'abord, reseau en secours */
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        var clone = res.clone();
        caches.open(VERSION).then(function(c){ c.put(e.request, clone); });
        return res;
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
