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
    /* virage : radians par seconde. C'est lui qui decide la largeur du
       virage, rayon = vitesse / virage. A 3,4 le cercle faisait 42 unites
       pour un serpent qui en fait 5, elle a trouve ca lent et large ;
       a 6 il fait 24, soit un demi tour en une demi seconde. */
    virage: 6,
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
    plancherBoost: 8,        // anneaux : en dessous, on ne peut plus foncer

    /* mourir : un serpent mort se transforme en fleurs, qui valent plus */
    espacementMort: 12,      // une fleur tous les 12 unites de corps
    rayonFleurMort: 5,
    pointsFleurMort: 3,
    gainFleurMort: 6,

    /* le buisson ne tue pas : il ralentit et coute un peu de longueur.
       Ecart assume au jeu d'origine : la cible a 8 ans, et toute mort doit
       venir d'une chose qu'on a vue bouger. */
    facteurBuisson: 0.6,
    dureeBuisson: 1,         // secondes de ralentissement, et delai avant de remordre
    coutBuisson: 0.05,       // part de la longueur perdue

    /* les adversaires */
    agressiviteBase: 0.15,       // part de chasseurs a score et niveau nuls
    agressiviteParScore: 6000,   // + 1 par tranche de ... points
    agressiviteParNiveau: 40,    // + 1 par tranche de ... niveaux
    vueBot: 460,             // au dela, un bot ne voit pas la fleur
    rechercheBot: 0.4,       // secondes entre deux recherches de fleur
    evitementBuisson: 90,    // distance a laquelle un bot s'ecarte d'un buisson
    evitementCorps: 110,     // ... d'un corps
    evitementBord: 220,      // ... de la haie
    peurPeureux: 300,        // le peureux fuit un plus gros a cette distance
    delaiNaissance: 1.5,     // secondes entre deux arrivees de bot
    loinDuJoueur: 520,       // un bot ne nait jamais plus pres que ca
    botCourt: 40,            // longueur d'un bot a la naissance : de ...
    botLong: 260             // ... a ...
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

    var niveau = options.niveau === undefined ? 1 : options.niveau;
    var avecBots = options.bots !== false && !!monde.bots;
    var premierRemplissage = true, prochaineNaissance = 0;

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
      niveau: niveau,
      alea: rnd,
      commander: commander,
      ajouter: ajouter,
      difficulte: difficulte,
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
        L: L, score: 0, teinte: 0,
        fonce: false, demandeFonce: false,
        vivant: true,
        ralentiJusqua: -1, dernierBuisson: -99,
        boite: { g: x, d: x, h: y, b: y },
        corps: [{ x: x, y: y }]
      };
    }

    /* Ajouter un serpent : les bots passeront par la, et les controles s'en
       servent pour poser deux serpents la ou ils veulent. */
    function ajouter(o){
      var s = neuf(o.x || 0, o.y || 0, o.angle || 0,
                   o.L === undefined ? anneaux(REGLAGES.longueurDepart) : o.L);
      s.teinte = o.teinte === undefined ? serpents.length : o.teinte;
      s.role = o.role || null;
      s.fleurCible = null;
      s.prochaineRecherche = 0;
      s.vise = s.angle;
      serpents.push(s);
      return s;
    }

    /* ------------------------------------------------------ la difficulte

       Elle monte pendant la partie avec le score, et d'une partie a l'autre
       avec le niveau du joueur. Le terme en niveau est indispensable : sans
       lui, un enfant de niveau 18, avec ses potions longues et son boost bon
       marche, trouverait la prairie vide de danger et arreterait de jouer. */
    function difficulte(){
      var d = monde.bots || { depart: 0, max: 0, parScore: 400 };
      return {
        cible: Math.min(d.max, d.depart + Math.floor(partie.score / d.parScore)),
        agressivite: Math.min(1, REGLAGES.agressiviteBase
          + partie.score / REGLAGES.agressiviteParScore
          + niveau / REGLAGES.agressiviteParNiveau)
      };
    }

    function peupler(){
      if(!avecBots) return;
      /* on oublie les morts : leur corps est deja devenu des fleurs */
      for(var i = serpents.length - 1; i >= 1; i--){
        if(!serpents[i].vivant) serpents.splice(i, 1);
      }
      var cible = difficulte().cible;
      if(serpents.length - 1 >= cible) return;
      if(premierRemplissage){
        while(serpents.length - 1 < cible) naitre();
        premierRemplissage = false;
        return;
      }
      if(partie.temps < prochaineNaissance) return;
      naitre();
      prochaineNaissance = partie.temps + REGLAGES.delaiNaissance;
    }

    function naitre(){
      var agr = difficulte().agressivite, x, y, essais = 0;
      do{
        var g = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (rayon - 120);
        x = Math.cos(g) * d;
        y = Math.sin(g) * d;
        essais++;
      }while(Math.hypot(x - joueur.x, y - joueur.y) < REGLAGES.loinDuJoueur && essais < 30);
      var role = rnd() < agr ? "chasseur" : (rnd() < 0.35 ? "peureux" : "brouteur");
      return ajouter({
        x: x, y: y,
        angle: rnd() * Math.PI * 2,
        L: REGLAGES.botCourt + rnd() * (REGLAGES.botLong - REGLAGES.botCourt),
        role: role,
        teinte: Math.floor(rnd() * 1000)
      });
    }

    /* ---------------------------------------------------------- les bots

       Un bot vise un point, et trois repulsions le detournent : les buissons,
       les corps, la haie. Le role ne change que le point vise. */
    function cerveau(s){
      if(!s.role) return;
      var vx = 0, vy = 0, n, cible = null;

      if(s.role === "chasseur" && joueur.vivant && s.L > joueur.L){
        cible = interception(s, joueur);
      }
      if(!cible){
        if(partie.temps >= s.prochaineRecherche){
          s.fleurCible = fleurProche(s);
          s.prochaineRecherche = partie.temps + REGLAGES.rechercheBot;
        }
        if(s.fleurCible) cible = s.fleurCible;
      }
      if(cible){
        vx = cible.x - s.x; vy = cible.y - s.y;
        n = Math.hypot(vx, vy) || 1;
        vx /= n; vy /= n;
      }else{
        vx = Math.cos(s.angle); vy = Math.sin(s.angle);
      }

      var i, o, dx, dy, d, portee, poids, r = rayonSerpent(s);

      /* les buissons */
      for(i = 0; i < obstacles.length; i++){
        o = obstacles[i];
        dx = s.x - o.x; dy = s.y - o.y;
        d = Math.hypot(dx, dy) || 1;
        portee = o.r + r + REGLAGES.evitementBuisson;
        if(d < portee){
          poids = (portee - d) / portee * 3;
          vx += dx / d * poids; vy += dy / d * poids;
        }
      }

      /* les corps : on ne regarde qu'un point sur six, ca suffit pour
         s'ecarter et ca coute six fois moins cher */
      for(i = 0; i < serpents.length; i++){
        var a = serpents[i];
        if(a === s || !a.vivant) continue;
        var peur = (s.role === "peureux" && a.L > s.L)
          ? REGLAGES.peurPeureux : REGLAGES.evitementCorps;
        if(s.x + peur < a.boite.g || s.x - peur > a.boite.d ||
           s.y + peur < a.boite.h || s.y - peur > a.boite.b) continue;
        for(var k = 0; k < a.corps.length; k += 6){
          dx = s.x - a.corps[k].x; dy = s.y - a.corps[k].y;
          d = Math.hypot(dx, dy) || 1;
          if(d >= peur) continue;
          poids = (peur - d) / peur * (s.role === "peureux" ? 3.5 : 2.2);
          vx += dx / d * poids; vy += dy / d * poids;
        }
      }

      /* la haie */
      d = Math.hypot(s.x, s.y);
      if(d > rayon - REGLAGES.evitementBord){
        poids = (d - (rayon - REGLAGES.evitementBord)) / REGLAGES.evitementBord * 4;
        vx -= s.x / (d || 1) * poids; vy -= s.y / (d || 1) * poids;
      }

      s.vise = Math.atan2(vy, vx);
    }

    /* viser devant la tete, pas la tete : c'est ce qui coupe la route */
    function interception(s, cible){
      var d = Math.hypot(cible.x - s.x, cible.y - s.y);
      var t = Math.min(2, d / REGLAGES.vitesse);
      return {
        x: cible.x + Math.cos(cible.angle) * REGLAGES.vitesse * t * 0.8,
        y: cible.y + Math.sin(cible.angle) * REGLAGES.vitesse * t * 0.8
      };
    }

    /* Viser la fleur la plus proche fait tourner en rond : avec cette densite
       elle est presque toujours DANS le cercle de virage, que le serpent ne
       peut pas resserrer, donc il l'orbite sans jamais l'atteindre. On ne vise
       donc que devant soi, et au dela du cercle de virage. Les fleurs d'a
       cote, il les mange en passant. */
    function fleurProche(s){
      var mini = REGLAGES.vitesse / REGLAGES.virage * 3;
      var meilleure = null, dm = REGLAGES.vueBot * REGLAGES.vueBot;
      for(var i = 0; i < fleurs.length; i++){
        var f = fleurs[i];
        var dx = f.x - s.x, dy = f.y - s.y, d = dx * dx + dy * dy;
        if(d >= dm || d < mini * mini) continue;
        if(Math.abs(normaliser(Math.atan2(dy, dx) - s.angle)) > 1.75) continue;
        dm = d; meilleure = f;
      }
      return meilleure;
    }

    function commander(ordre){
      ordre = ordre || {};
      if(ordre.angle !== undefined) joueur.vise = ordre.angle;
      joueur.demandeFonce = !!ordre.fonce;
    }

    function pas(dt){
      evenements.length = 0;
      partie.temps += dt;
      peupler();
      for(var i = 0; i < serpents.length; i++){
        var s = serpents[i];
        if(!s.vivant) continue;
        cerveau(s);
        tourner(s, dt);
        avancer(s, dt);
        bord(s);
        corps(s);
        buissons(s);
        manger(s);
      }
      collisions();
      if(!joueur.vivant) partie.fini = true;
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
      var lent = s.ralentiJusqua > partie.temps ? REGLAGES.facteurBuisson : 1;
      var v = REGLAGES.vitesse * (s.fonce ? REGLAGES.facteurBoost : 1) * lent;
      s.x += Math.cos(s.angle) * v * dt;
      s.y += Math.sin(s.angle) * v * dt;
      if(s.fonce) s.L = Math.max(plancher, s.L - REGLAGES.coutBoost * dt);
    }

    /* Le bord ne tue pas : on ramene le serpent sur la haie et on couche sa
       direction sur la tangente, donc il glisse. Le joueur garde la main :
       des qu'il vise vers l'interieur, `tourner` l'y ramene. */
    function bord(s){
      var max = rayon - rayonSerpent(s);
      var d = Math.hypot(s.x, s.y);
      if(d <= max) return;
      var a = Math.atan2(s.y, s.x);
      s.x = Math.cos(a) * max;
      s.y = Math.sin(a) * max;
      var t1 = normaliser(a + Math.PI / 2), t2 = normaliser(a - Math.PI / 2);
      s.angle = Math.abs(normaliser(t1 - s.angle)) < Math.abs(normaliser(t2 - s.angle)) ? t1 : t2;
      evenements.push({ type: "bord", serpent: s });
    }

    /* Le buisson ne tue pas non plus : il ralentit une seconde et coute 5 %
       de la longueur, une fois par seconde au plus. */
    function buissons(s){
      if(partie.temps - s.dernierBuisson < REGLAGES.dureeBuisson) return;
      var r = rayonSerpent(s);
      for(var i = 0; i < obstacles.length; i++){
        var o = obstacles[i], dx = o.x - s.x, dy = o.y - s.y, d = o.r + r;
        if(dx * dx + dy * dy <= d * d){
          s.dernierBuisson = partie.temps;
          s.ralentiJusqua = partie.temps + REGLAGES.dureeBuisson;
          s.L = Math.max(anneaux(2), s.L * (1 - REGLAGES.coutBuisson));
          evenements.push({ type: "buisson", serpent: s, obstacle: o });
          return;
        }
      }
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
      var reste = s.L, i, un, deux, seg;
      for(i = 1; i < s.corps.length; i++){
        un = s.corps[i - 1]; deux = s.corps[i];
        seg = Math.hypot(deux.x - un.x, deux.y - un.y);
        if(seg >= reste){
          var t = seg === 0 ? 0 : reste / seg;
          s.corps[i] = { x: un.x + (deux.x - un.x) * t, y: un.y + (deux.y - un.y) * t };
          s.corps.length = i + 1;
          break;
        }
        reste -= seg;
      }
      /* la boite du corps : elle evite d'examiner segment par segment deux
         serpents qui sont a l'autre bout de l'arene */
      var g = s.x, d = s.x, h = s.y, b = s.y, pt;
      for(i = 1; i < s.corps.length; i++){
        pt = s.corps[i];
        if(pt.x < g) g = pt.x;
        if(pt.x > d) d = pt.x;
        if(pt.y < h) h = pt.y;
        if(pt.y > b) b = pt.y;
      }
      s.boite.g = g; s.boite.d = d; s.boite.h = h; s.boite.b = b;
    }

    function manger(s){
      var portee = rayonSerpent(s) + REGLAGES.aspiration;
      /* a l'envers : une fleur de mort disparait au lieu de repousser */
      for(var i = fleurs.length - 1; i >= 0; i--){
        var f = fleurs[i];
        var dx = f.x - s.x, dy = f.y - s.y, d = portee + f.r;
        if(dx * dx + dy * dy > d * d) continue;
        if(f.mort){
          s.L += REGLAGES.gainFleurMort;
          s.score += REGLAGES.pointsFleurMort;
          if(s === joueur) partie.score += REGLAGES.pointsFleurMort;
          fleurs.splice(i, 1);
        }else{
          s.L += REGLAGES.gainFleur;
          s.score += REGLAGES.pointsFleur;
          if(s === joueur) partie.score += REGLAGES.pointsFleur;
          placer(f);
        }
        evenements.push({ type: "mange", serpent: s });
      }
    }

    /* ------------------------------------------------------------ mourir */

    /* distance d'un point au segment [a,b], au carre */
    function distanceSegment(px, py, ax, ay, bx, by){
      var vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
      var l = vx * vx + vy * vy;
      var t = l === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / l));
      var dx = px - (ax + vx * t), dy = py - (ay + vy * t);
      return dx * dx + dy * dy;
    }

    function teteContreCorps(a, b){
      var porte = rayonSerpent(a) + rayonSerpent(b);
      if(a.x + porte < b.boite.g || a.x - porte > b.boite.d ||
         a.y + porte < b.boite.h || a.y - porte > b.boite.b) return false;
      var carre = porte * porte;
      for(var i = 1; i < b.corps.length; i++){
        if(distanceSegment(a.x, a.y, b.corps[i - 1].x, b.corps[i - 1].y,
                           b.corps[i].x, b.corps[i].y) <= carre) return true;
      }
      return false;
    }

    /* Une tete dans le corps d'un autre, et c'est fini. Le cas face a face,
       ou chacun touche l'autre dans la meme image, se tranche par la
       longueur : le plus court meurt, sinon les deux. */
    function collisions(){
      var touche = [], i, j;
      for(i = 0; i < serpents.length; i++){
        touche[i] = null;
        if(!serpents[i].vivant) continue;
        for(j = 0; j < serpents.length; j++){
          if(i === j || !serpents[j].vivant) continue;
          if(teteContreCorps(serpents[i], serpents[j])){
            (touche[i] = touche[i] || []).push(j);
          }
        }
      }
      var meurt = [];
      for(i = 0; i < serpents.length; i++) meurt[i] = !!touche[i];
      for(i = 0; i < serpents.length; i++){
        if(!meurt[i] || !touche[i]) continue;
        for(var k = 0; k < touche[i].length; k++){
          j = touche[i][k];
          if(!meurt[j] || !touche[j] || touche[j].indexOf(i) < 0) continue;
          if(serpents[i].L > serpents[j].L) meurt[i] = false;
          else if(serpents[j].L > serpents[i].L) meurt[j] = false;
        }
      }
      for(i = 0; i < serpents.length; i++) if(meurt[i]) mourir(serpents[i]);
    }

    /* Un mort se repand en fleurs le long de son corps : c'est la recompense
       de celui qui l'a eu, et ca se voit de loin. */
    function mourir(s){
      s.vivant = false;
      s.fonce = false;
      var pas = REGLAGES.espacementMort, reste = 0;
      for(var i = 1; i < s.corps.length; i++){
        var a = s.corps[i - 1], b = s.corps[i];
        var seg = Math.hypot(b.x - a.x, b.y - a.y), t = reste;
        while(t < seg){
          var k = seg === 0 ? 0 : t / seg;
          fleurs.push({
            x: a.x + (b.x - a.x) * k,
            y: a.y + (b.y - a.y) * k,
            r: REGLAGES.rayonFleurMort,
            i: Math.floor(rnd() * 8),
            mort: true
          });
          t += pas;
        }
        reste = t - seg;
      }
      evenements.push({ type: "mort", serpent: s });
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
