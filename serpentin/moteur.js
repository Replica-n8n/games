/* Serpentin : le moteur.

   Il ne connait ni le DOM, ni les couleurs, ni le doigt : il tient le monde et
   les regles, rien d'autre. C'est ce qui permet de le controler dans Node en
   une seconde, avec tools/serpentin-moteur.mjs.

   Le decor et les couleurs sont dans mondes.js, l'affichage dans index.html.

   Toutes les valeurs chiffrees sont ici, dans REGLAGES, et nulle part
   ailleurs. Elles se reglent en jouant, pas sur le papier. */

var Moteur = (function(){
  "use strict";

  var REGLAGES = {
    /* le monde */
    rayonArene: 1400,        // unites
    fleurs: 450,             // presentes en meme temps

    /* le serpent */
    longueurDepart: 10,      // anneaux
    uniteParAnneau: 12,      // unites de longueur pour un anneau
    vitesse: 144,            // unites par seconde, soit 2,4 par image a 60 i/s
    virage: 3.4,             // radians par seconde
    echantillon: 6,          // distance entre deux points du corps
    rayonBase: 4,            // rayon du serpent : base ...
    rayonParUnite: 0.012,    // ... plus la longueur, ...
    rayonMax: 14,            // ... jusqu'a ce plafond

    /* manger */
    gainFleur: 2,            // unites de longueur par fleur
    pointsFleur: 1,
    aspiration: 2,           // marge de ramassage autour du serpent

    /* foncer */
    facteurBoost: 1.9,
    coutBoost: 10,           // unites de longueur par seconde, soit 1 par 100 ms
    plancherBoost: 8         // anneaux : en dessous, on ne peut plus foncer
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

  function rayonSerpent(s){
    return REGLAGES.rayonBase +
           Math.min(REGLAGES.rayonMax, s.L * REGLAGES.rayonParUnite);
  }

  function anneaux(n){ return n * REGLAGES.uniteParAnneau; }

  function creer(options){
    options = options || {};
    var monde = options.monde || MONDE_PAR_DEFAUT;
    var rayon = monde.rayon || REGLAGES.rayonArene;
    var rnd = alea(options.graine === undefined ? 1 : options.graine);
    var nbFleurs = options.fleurs === undefined
      ? (monde.fleurs === undefined ? REGLAGES.fleurs : monde.fleurs)
      : options.fleurs;

    var evenements = [];
    var fleurs = [];
    for(var i = 0; i < nbFleurs; i++) fleurs.push(placer({}));
    var obstacles = semer(monde.obstacles);

    var joueur = neuf(0, 0, 0, anneaux(REGLAGES.longueurDepart));
    var serpents = [joueur];

    var partie = {
      monde: monde,
      rayon: rayon,
      joueur: joueur,
      serpents: serpents,
      fleurs: fleurs,
      obstacles: obstacles,
      evenements: evenements,
      score: 0,
      temps: 0,
      fini: false,
      alea: rnd,
      commander: commander,
      pas: pas
    };
    return partie;

    function placer(f){
      var d = Math.sqrt(rnd()) * (rayon - 20), g = rnd() * Math.PI * 2;
      f.x = Math.cos(g) * d;
      f.y = Math.sin(g) * d;
      f.r = 3 + rnd() * 2;
      f.i = Math.floor(rnd() * 8);   /* variante, l'affichage en tire sa couleur */
      return f;
    }

    /* Les obstacles viennent d'un descripteur du monde, semes avec la graine
       de la partie : leurs positions doivent etre reproductibles. Le monde ne
       dit que combien et quelle taille, jamais ou. */
    function semer(descripteur){
      if(!descripteur) return [];
      if(Array.isArray(descripteur)) return descripteur.slice();
      var loin = descripteur.loinDuCentre || 0;
      var liste = [];
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

    function neuf(x, y, angle, L){
      return {
        x: x, y: y, angle: angle, vise: angle,
        L: L, score: 0,
        fonce: false, demandeFonce: false,
        vivant: true,
        corps: [{ x: x, y: y }]
      };
    }

    function commander(ordre){
      ordre = ordre || {};
      if(ordre.angle !== undefined) joueur.vise = ordre.angle;
      joueur.demandeFonce = !!ordre.fonce;
    }

    function pas(dt){
      evenements.length = 0;
      partie.temps += dt;
      for(var i = 0; i < serpents.length; i++){
        var s = serpents[i];
        if(!s.vivant) continue;
        tourner(s, dt);
        avancer(s, dt);
        corps(s);
        manger(s);
      }
      return evenements;
    }

    function tourner(s, dt){
      var d = normaliser(s.vise - s.angle);
      var max = REGLAGES.virage * dt;
      s.angle = normaliser(s.angle + Math.max(-max, Math.min(max, d)));
    }

    function avancer(s, dt){
      var plancher = anneaux(REGLAGES.plancherBoost);
      s.fonce = s.demandeFonce && s.L > plancher;
      var v = REGLAGES.vitesse * (s.fonce ? REGLAGES.facteurBoost : 1);
      s.x += Math.cos(s.angle) * v * dt;
      s.y += Math.sin(s.angle) * v * dt;
      if(s.fonce) s.L = Math.max(plancher, s.L - REGLAGES.coutBoost * dt);
    }

    /* Le corps est une polyligne : la tete suit le serpent a chaque image, un
       point de plus est pose tous les `echantillon`, et la queue est coupee a
       la longueur exacte. */
    function corps(s){
      s.corps[0].x = s.x;
      s.corps[0].y = s.y;
      var suivant = s.corps[1];
      if(!suivant ||
         Math.hypot(s.x - suivant.x, s.y - suivant.y) >= REGLAGES.echantillon){
        s.corps.unshift({ x: s.x, y: s.y });
      }
      var reste = s.L;
      for(var i = 1; i < s.corps.length; i++){
        var a = s.corps[i - 1], b = s.corps[i];
        var seg = Math.hypot(b.x - a.x, b.y - a.y);
        if(seg >= reste){
          var t = seg === 0 ? 0 : reste / seg;
          s.corps[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          s.corps.length = i + 1;
          return;
        }
        reste -= seg;
      }
    }

    function manger(s){
      var portee = rayonSerpent(s) + REGLAGES.aspiration;
      for(var i = 0; i < fleurs.length; i++){
        var f = fleurs[i];
        var dx = f.x - s.x, dy = f.y - s.y, d = portee + f.r;
        if(dx * dx + dy * dy <= d * d){
          s.L += REGLAGES.gainFleur;
          s.score += REGLAGES.pointsFleur;
          if(s === joueur) partie.score += REGLAGES.pointsFleur;
          placer(f);
          evenements.push({ type: "mange", serpent: s });
        }
      }
    }
  }

  return {
    REGLAGES: REGLAGES,
    MONDE_PAR_DEFAUT: MONDE_PAR_DEFAUT,
    creer: creer,
    rayonSerpent: rayonSerpent,
    anneaux: anneaux
  };
})();

/* utilisable des deux cotes : dans la page, et dans Node pour les controles */
if(typeof module !== "undefined" && module.exports) module.exports = Moteur;
if(typeof globalThis !== "undefined") globalThis.Moteur = Moteur;
