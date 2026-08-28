/* Le moteur.

   Il ne connait ni le DOM, ni les couleurs, ni le doigt : il tient le monde et
   les regles, rien d'autre. C'est ce qui permet de le controler dans Node en
   une seconde, avec tools/serpentin-moteur.mjs.

   Le decor est dans mondes.js, les armes dans armes.js, l'affichage dans
   index.html.

   Toutes les valeurs chiffrees sont ici, dans REGLAGES, et nulle part
   ailleurs. Elles se reglent en jouant, pas sur le papier. */

var Moteur = (function(){
  "use strict";

  var REGLAGES = {
    /* le monde */
    rayonArene: 1400,
    duree: 480,              // 8 minutes

    /* le chevalier */
    vitesse: 150,            // unites par seconde
    rayonJoueur: 17,
    coeurs: 5,
    invincibilite: 1,        // secondes apres un coup

    /* la foule.
       60 et pas 300 : l'ecran du telephone fait huit fois moins de surface
       qu'un ecran de PC. Et au plus 3 individus, parce qu'a 8 ans on suit
       trois objets en mouvement, pas plus. */
    plafond: 60,
    plafondIndividus: 3,
    parMinute: 8,            // bestioles de plus a chaque minute
    departFoule: 20,
    naissanceLoin: 300,      // elles naissent juste hors de vue
    naissanceTresLoin: 460,
    separation: 26,          // elles ne se marchent pas dessus

    /* les graines */
    rayonGraine: 5,
    aimant: 95,              // portee de ramassage
    vitesseGraine: 260,

    /* l'experience */
    xpBase: 6,               // pour le niveau 2
    xpFacteur: 1.28,         // chaque niveau coute 28 % de plus

    /* le decor, repris du serpent */
    evitementBuisson: 70,
    facteurBuisson: 0.6,
    dureeBuisson: 1
  };

  /* Les bestioles vivent dans bestioles.js : chiffres et dessin au meme
     endroit. Le moteur ne garde qu'un secours minimal, pour qu'un controle
     puisse le charger seul. */
  var ESPECES = (typeof Bestioles !== "undefined" && Bestioles.ESPECES) || {
    escargot: { nom: "escargot", vie: 1, vitesse: 42, rayon: 11, xp: 1,
                individu: false, arrive: 0 }
  };

  var MONDE_PAR_DEFAUT = { nom: "vide", rayon: REGLAGES.rayonArene, obstacles: [] };

  /* Un generateur a graine plutot que Math.random : sans lui, un controle qui
     echoue n'est pas rejouable, et une partie ne peut pas etre reproduite. */
  function alea(graine){
    var e = (graine >>> 0) || 1;
    return function(){
      e ^= e << 13; e >>>= 0;
      e ^= e >> 17;
      e ^= e << 5;  e >>>= 0;
      return e / 4294967296;
    };
  }

  function normaliser(a){
    return ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  }

  /* combien d'experience pour passer au niveau suivant */
  function coutNiveau(niveau){
    return Math.round(REGLAGES.xpBase * Math.pow(REGLAGES.xpFacteur, niveau - 1));
  }

  function creer(options){
    options = options || {};
    var monde = options.monde || MONDE_PAR_DEFAUT;
    var rayon = monde.rayon || REGLAGES.rayonArene;
    var rnd = alea(options.graine === undefined ? 1 : options.graine);
    var avecFoule = options.foule !== false;

    var evenements = [];
    var bestioles = [];
    var graines = [];
    var obstacles = semer(monde.obstacles);

    var joueur = {
      x: 0, y: 0, angle: 0, vise: 0, avance: false,
      coeurs: REGLAGES.coeurs, coeursMax: REGLAGES.coeurs,
      invincibleJusqua: 0, vivant: true,
      ralentiJusqua: -1, dernierBuisson: -99,
      rayon: REGLAGES.rayonJoueur
    };

    /* la grille : sans elle, 300 bestioles font 90 000 comparaisons par image
       rien que pour ne pas se marcher dessus */
    var CASE = 70, grille = new Map();
    /* ⚠️ declare ICI et pas plus bas : tout ce qui suit `return partie` n'est
       jamais execute, seules les fonctions y sont remontees. */
    var tampon = [];

    var partie = {
      monde: monde,
      rayon: rayon,
      joueur: joueur,
      bestioles: bestioles,
      graines: graines,
      obstacles: obstacles,
      evenements: evenements,
      temps: 0,
      duree: REGLAGES.duree,
      xp: 0, niveau: 1, xpNiveau: 0, xpProchain: coutNiveau(1),
      tues: 0,
      fini: false, gagne: false,
      alea: rnd,
      commander: commander,
      pas: pas,
      naitre: naitre,
      difficulte: difficulte,
      voisines: voisines,
      blesser: blesser
    };
    return partie;

    /* ---------------------------------------------------------- le decor */

    function semer(descripteur){
      if(!descripteur) return [];
      if(Array.isArray(descripteur)) return descripteur.slice();
      var loin = descripteur.loinDuCentre || 0, liste = [];
      for(var i = 0; i < descripteur.nombre; i++){
        var g = rnd() * Math.PI * 2;
        var d = loin + Math.sqrt(rnd()) * Math.max(0, rayon - 80 - loin);
        liste.push({
          x: Math.cos(g) * d,
          y: Math.sin(g) * d,
          r: descripteur.rayonMin + rnd() * (descripteur.rayonMax - descripteur.rayonMin),
          i: rnd() * Math.PI * 2
        });
      }
      return liste;
    }

    /* ------------------------------------------------------- la grille */

    function cle(x, y){
      return (Math.floor(x / CASE) * 73856093) ^ Math.floor(y / CASE);
    }

    function poser(){
      grille.clear();
      for(var i = 0; i < bestioles.length; i++){
        var b = bestioles[i], k = cle(b.x, b.y), liste = grille.get(k);
        if(!liste) grille.set(k, liste = []);
        liste.push(b);
      }
    }

    /* toutes les bestioles a portee, sans parcourir les 300 */
    function voisines(x, y, portee, sortie){
      sortie.length = 0;
      var c = Math.ceil(portee / CASE);
      for(var i = -c; i <= c; i++){
        for(var j = -c; j <= c; j++){
          var liste = grille.get(cle(x + i * CASE, y + j * CASE));
          if(!liste) continue;
          for(var k = 0; k < liste.length; k++) sortie.push(liste[k]);
        }
      }
      return sortie;
    }

    /* ------------------------------------------------------ les vagues */

    function difficulte(){
      var minute = Math.floor(partie.temps / 60);
      return {
        minute: minute,
        cible: Math.min(REGLAGES.plafond, REGLAGES.departFoule + minute * REGLAGES.parMinute),
        especes: Object.keys(ESPECES).filter(function(n){
          return partie.temps >= ESPECES[n].arrive;
        })
      };
    }

    function individusVivants(){
      var n = 0;
      for(var i = 0; i < bestioles.length; i++) if(bestioles[i].espece.individu) n++;
      return n;
    }

    function naitre(nom){
      var e = ESPECES[nom];
      if(!e) return null;
      /* le plafond des trois individus n'est pas une decoration : c'est ce
         qu'un enfant de 8 ans peut suivre en meme temps */
      if(e.individu && individusVivants() >= REGLAGES.plafondIndividus) return null;
      var g = rnd() * Math.PI * 2;
      var d = REGLAGES.naissanceLoin + rnd() * (REGLAGES.naissanceTresLoin - REGLAGES.naissanceLoin);
      var x = joueur.x + Math.cos(g) * d, y = joueur.y + Math.sin(g) * d;
      var dc = Math.hypot(x, y);
      if(dc > rayon - 40){ x = x / dc * (rayon - 40); y = y / dc * (rayon - 40); }
      var b = {
        espece: e, nom: nom,
        x: x, y: y, angle: g + Math.PI,
        vie: e.vie + Math.floor(partie.temps / 120),
        rayon: e.rayon,
        phase: rnd() * Math.PI * 2,
        vivante: true
      };
      bestioles.push(b);
      return b;
    }

    function peupler(){
      if(!avecFoule) return;
      var d = difficulte();
      if(bestioles.length >= d.cible || !d.especes.length) return;
      var manque = Math.min(4, d.cible - bestioles.length);   /* pas tout d'un coup */
      for(var i = 0; i < manque; i++){
        naitre(d.especes[Math.floor(rnd() * d.especes.length)]);
      }
    }

    /* ------------------------------------------------------ le chevalier */

    function commander(ordre){
      ordre = ordre || {};
      if(ordre.angle !== undefined) joueur.vise = ordre.angle;
      joueur.avance = !!ordre.avance;
    }

    function bougerJoueur(dt){
      if(!joueur.vivant) return;
      if(joueur.avance) joueur.angle = joueur.vise;
      var lent = joueur.ralentiJusqua > partie.temps ? REGLAGES.facteurBuisson : 1;
      var v = joueur.avance ? REGLAGES.vitesse * lent : 0;
      joueur.x += Math.cos(joueur.angle) * v * dt;
      joueur.y += Math.sin(joueur.angle) * v * dt;
      /* la haie ne blesse pas : on glisse le long */
      var max = rayon - joueur.rayon, d = Math.hypot(joueur.x, joueur.y);
      if(d > max){
        joueur.x = joueur.x / d * max;
        joueur.y = joueur.y / d * max;
      }
      /* les buissons ne blessent pas non plus : ils ralentissent */
      if(partie.temps - joueur.dernierBuisson >= REGLAGES.dureeBuisson){
        for(var i = 0; i < obstacles.length; i++){
          var o = obstacles[i], dx = o.x - joueur.x, dy = o.y - joueur.y;
          var p = o.r + joueur.rayon;
          if(dx * dx + dy * dy <= p * p){
            joueur.dernierBuisson = partie.temps;
            joueur.ralentiJusqua = partie.temps + REGLAGES.dureeBuisson;
            evenements.push({ type: "buisson" });
            break;
          }
        }
      }
    }

    /* ------------------------------------------------------ les bestioles */

    function bouger(b, dt){
      var dx = joueur.x - b.x, dy = joueur.y - b.y;
      var n = Math.hypot(dx, dy) || 1;
      var vx = dx / n, vy = dy / n;

      /* l'abeille ondule : c'est ce qui la rend reconnaissable de loin */
      if(b.espece.onde){
        var o = b.espece.onde;
        var lat = Math.sin(partie.temps * o.vitesse + b.phase) * o.amplitude;
        var px = -vy, py = vx;          /* la perpendiculaire, avant de toucher a vx */
        vx += px * lat; vy += py * lat;
      }

      /* elles ne se marchent pas dessus */
      voisines(b.x, b.y, REGLAGES.separation, tampon);
      for(var i = 0; i < tampon.length; i++){
        var a = tampon[i];
        if(a === b) continue;
        var sx = b.x - a.x, sy = b.y - a.y, d = Math.hypot(sx, sy);
        if(d > 0.001 && d < REGLAGES.separation){
          var p = (REGLAGES.separation - d) / REGLAGES.separation * 1.4;
          vx += sx / d * p; vy += sy / d * p;
        }
      }

      /* les buissons */
      for(var k = 0; k < obstacles.length; k++){
        var ob = obstacles[k];
        var ox = b.x - ob.x, oy = b.y - ob.y, od = Math.hypot(ox, oy) || 1;
        var portee = ob.r + b.rayon + REGLAGES.evitementBuisson;
        if(od < portee){
          var poids = (portee - od) / portee * 2;
          vx += ox / od * poids; vy += oy / od * poids;
        }
      }

      var m = Math.hypot(vx, vy) || 1;
      b.angle = Math.atan2(vy, vx);
      b.x += vx / m * b.espece.vitesse * dt;
      b.y += vy / m * b.espece.vitesse * dt;

      var dc = Math.hypot(b.x, b.y), max = rayon - b.rayon;
      if(dc > max){ b.x = b.x / dc * max; b.y = b.y / dc * max; }
    }

    function blesser(b, degats){
      b.vie -= degats;
      if(b.vie > 0) return false;
      b.vivante = false;
      partie.tues++;
      graines.push({
        x: b.x, y: b.y,
        valeur: b.espece.xp,
        r: REGLAGES.rayonGraine,
        attiree: false
      });
      evenements.push({ type: "tuee", bestiole: b });
      return true;
    }

    function contact(){
      if(!joueur.vivant || partie.temps < joueur.invincibleJusqua) return;
      voisines(joueur.x, joueur.y, joueur.rayon + 24, tampon);
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante) continue;
        var dx = b.x - joueur.x, dy = b.y - joueur.y, p = b.rayon + joueur.rayon;
        if(dx * dx + dy * dy <= p * p){
          joueur.coeurs--;
          /* une seconde d'invincibilite : sans elle, entrer dans un groupe
             coute cinq coeurs en un dixieme de seconde */
          joueur.invincibleJusqua = partie.temps + REGLAGES.invincibilite;
          evenements.push({ type: "touche", bestiole: b });
          if(joueur.coeurs <= 0){
            joueur.coeurs = 0;
            joueur.vivant = false;
            partie.fini = true;
            evenements.push({ type: "mort" });
          }
          return;
        }
      }
    }

    /* ------------------------------------------------------- les graines */

    function ramasser(dt){
      var portee = REGLAGES.aimant;
      for(var i = graines.length - 1; i >= 0; i--){
        var g = graines[i];
        var dx = joueur.x - g.x, dy = joueur.y - g.y, d = Math.hypot(dx, dy);
        if(d < portee) g.attiree = true;
        if(g.attiree && d > 0.001){
          var v = REGLAGES.vitesseGraine * dt;
          g.x += dx / d * v; g.y += dy / d * v;
        }
        if(d <= joueur.rayon + g.r){
          gagnerXp(g.valeur);
          graines.splice(i, 1);
        }
      }
    }

    function gagnerXp(n){
      partie.xp += n;
      partie.xpNiveau += n;
      while(partie.xpNiveau >= partie.xpProchain){
        partie.xpNiveau -= partie.xpProchain;
        partie.niveau++;
        partie.xpProchain = coutNiveau(partie.niveau);
        evenements.push({ type: "niveau", niveau: partie.niveau });
      }
    }

    /* ----------------------------------------------------------- la boucle */

    function pas(dt){
      evenements.length = 0;
      if(partie.fini) return evenements;
      partie.temps += dt;

      peupler();
      poser();
      bougerJoueur(dt);

      for(var i = 0; i < bestioles.length; i++){
        if(bestioles[i].vivante) bouger(bestioles[i], dt);
      }
      contact();
      ramasser(dt);

      /* on retire les mortes apres coup, jamais pendant le parcours */
      for(var j = bestioles.length - 1; j >= 0; j--){
        if(!bestioles[j].vivante) bestioles.splice(j, 1);
      }

      if(partie.temps >= partie.duree && !partie.fini){
        partie.fini = true;
        partie.gagne = true;
        evenements.push({ type: "victoire" });
      }
      return evenements;
    }
  }

  return {
    REGLAGES: REGLAGES,
    ESPECES: ESPECES,
    MONDE_PAR_DEFAUT: MONDE_PAR_DEFAUT,
    coutNiveau: coutNiveau,
    creer: creer
  };
})();

/* utilisable des deux cotes : dans la page, et dans Node pour les controles */
if(typeof module !== "undefined" && module.exports) module.exports = Moteur;
if(typeof globalThis !== "undefined") globalThis.Moteur = Moteur;
