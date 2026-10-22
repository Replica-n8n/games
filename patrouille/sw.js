/* Star Patrol : service worker. Patron de conviction/sw.js.
   ⚠️ VERSION n'existe QU'ICI. La changer à chaque modification d'un fichier de
   SHELL (code, style, mission), sinon le téléphone garde l'ancienne version.
   Trois chiffres, majeur.mineur.correctif (docs/patrouille-versions.md) : du
   nouveau = mineur, une correction = correctif. La carte l'affiche.
   tools/patrouille-pwa.mjs vérifie que SHELL contient tout ce que le jeu charge. */
var VERSION = "patrouille-1.4.2";
/* Tous nos jeux et apps partagent l'origine replica-n8n.github.io, donc le même
   CacheStorage : le cache porte le nom du jeu et de sa portée, et l'activation ne
   supprime QUE les siens. */
var PREFIXE = "patrouille:" + new URL(self.registration.scope).pathname + ":";
var CACHE = PREFIXE + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./jeu.js",
  "./sauvegarde.js",
  "./moteur/allies.js",
  "./moteur/bonus.js",
  "./moteur/boss.js",
  "./moteur/constantes.js",
  "./moteur/ennemis.js",
  "./moteur/hasard.js",
  "./moteur/milieux.js",
  "./moteur/partie.js",
  "./moteur/pilotage.js",
  "./moteur/progression.js",
  "./moteur/tirs.js",
  "./moteur/vagues.js",
  "./contenu/ennemis.js",
  "./contenu/missions-desert.js",
  "./contenu/missions-jungle.js",
  "./contenu/missions.js",
  "./contenu/planetes.js",
  "./ecran/carte.js",
  "./ecran/commandes.js",
  "./ecran/decor.js",
  "./ecran/hangar.js",
  "./ecran/interface.js",
  "./ecran/rendu.js",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-maskable-512.png"
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
     seulement. La copie (clone) se fait AVANT de rendre la réponse : faite plus
     tard, « body already used », en silence, et rien n'est rangé. */
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
