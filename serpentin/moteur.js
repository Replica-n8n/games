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
    /* 1 s ne suffisait pas : dans un groupe, on reperdait un coeur des la
       fin du delai sans avoir eu le temps de sortir. */
    invincibilite: 1.8,      // secondes apres un coup
    reculChoc: 90,           // le choc repousse les bestioles autour

    /* la foule.
       60 et pas 300 : l'ecran du telephone fait huit fois moins de surface
       qu'un ecran de PC. Et au plus 3 individus, parce qu'a 8 ans on suit
       trois objets en mouvement, pas plus. */
    plafond: 60,
    plafondIndividus: 3,
    parMinute: 6,            // bestioles de plus a chaque minute
    departFoule: 12,
    premiereVague: 2,        // secondes pendant lesquelles elles naissent plus pres
    naissanceLoin: 380,      // elles naissent hors de vue, pas dessus
    naissanceTresLoin: 520,
    separation: 26,          // elles ne se marchent pas dessus

    /* Les objets au sol : ils donnent le rythme. Sans eux, une partie n'est
       qu'une longue montee de tension sans respiration. */
    objetChaque: 20,         // secondes entre deux objets
    premierObjet: 12,        // le premier arrive tot, sinon on ne sait pas que ca existe
    objetsAuSol: 4,
    rayonObjet: 12,
    dureeGel: 10,            // secondes de glace
    degatsBombe: 8,
    /* la bombe ne tue pas dans la meme image : les bestioles rougissent, on
       voit le souffle passer, et elles tombent ensuite */
    dureeBrulure: 0.35,
    dureeExplosion: 0.5,
    rayonBombe: 420,
    /* le coffre repand ses graines par terre : les ramasser fait partie du
       plaisir, un chiffre qui monte tout seul n'en donne aucun */
    grainesCoffre: 14,
    valeurGraineCoffre: 2,
    eparpillementCoffre: 130,

    /* La montee de niveau souffle ce qui est autour, avant les cartes.
       ⚠️ Elle POUSSE, elle ne teleporte pas : a 370 unites, une bestiole
       sortait de l'ecran (on en voit 180 sur les cotes) et avait l'air de
       mourir sans laisser de graine. Repousse ne veut pas dire tue. */
    ondeNiveau: 330,
    dureeOnde: 0.55,
    pousseeOnde: 520,        // unites par seconde au depart de la poussee
    dureePoussee: 0.45,      // et elle s'eteint en un peu moins d'une demi seconde

    /* Les cinq fruits et legumes a reunir. Le message est discret : on les
       ramasse, et quand on a les cinq on devient invincible quelques
       secondes. Manger des fruits et des legumes rend plus fort. */
    legumeChaque: 26,        // secondes entre deux apparitions
    dureeEtoile: 9,          // secondes d'invincibilite une fois les cinq reunis

    /* Le piment. Il ne frappe pas : il laisse le feu DERRIERE soi, et ce sont
       les bestioles qui viennent dedans. ⚠️ Le feu au sol vit plus longtemps
       que le piment lui-meme, et la trainee s'efface par le bout le plus
       vieux : on doit voir sa route s'eteindre derriere soi. */
    dureePiment: 10,         // secondes ou le chevalier seme du feu
    feuChaque: 0.07,         // une flammee tous les sept centiemes de course
    feuVie: 3.5,             // ce qui la fait durer plus que le piment
    feuRayon: 26,
    degatsFeu: 6,            // par seconde, a ce qui reste dedans

    /* ⚠️ LE CONTRE-POIDS. Passe un certain niveau de puissance, on roule sur
       le jeu : les bestioles meurent avant d'arriver et plus rien ne menace.
       Ce qu'il fallait n'est pas plus de degats, c'est autre chose que des
       degats. La limace crache au sol, et ce qu'elle laisse ne se tue pas :
       ca s'evite. */
    volCrachat: 0.8,         // secondes de vol, en cloche
    dureeFlaque: 9,          // secondes ou la flaque reste
    rayonFlaque: 46,
    freinFlaque: 0.5,        // ce qu'il reste de vitesse dans la glaire
    /* ⚠️ Mesure : sans repos, l'acide retrogradait 6,3 armes par partie. C'est
       une taxe, pas un evenement, et un enfant ne verrait que sa puissance
       fondre sans comprendre. Une seule arme perdue toutes les quatre-vingt-dix
       secondes, quoi qu'il arrive. */
    reposMalus: 90,

    /* ⚠️ LE BOSS DE FIN. Sa vie n'est pas un chiffre choisi : elle est CALCULEE
       sur ce que le joueur fait vraiment. Mesure du 2026-08-28 : a huit
       minutes, les degats par seconde vont de 8 a 42 selon l'equipement, un
       rapport de un a cinq. Une vie fixe donnerait dix secondes de combat a
       l'un et cinquante a l'autre. On regarde donc les degats des soixante
       dernieres secondes et on vise un combat de trente secondes. */
    bossVise: 30,            // secondes de combat visees
    bossVieMin: 220,
    bossVieMax: 1700,
    bossFenetre: 60,         // sur combien de secondes on juge sa force
    bossEspece: "araignee",
    preavisBoss: 2.5,        // le temps de la voir arriver avant qu'elle attaque

    /* la toile : elle colle, mais on s'en arrache en poussant */
    /* ⚠️ « La toile ne colle pas assez longtemps, a peine 1 s, augmente a 4. »
       Ce qu'elle mesurait, c'est la duree EN SE DEBATTANT : 2,2 s divisees par
       un effort de 3,4 donnaient 0,65 s. Pour arriver aux quatre secondes
       demandees en se debattant, il faut donc huit secondes de base et un
       effort de deux. Se debattre divise le temps par deux — ca reste payant,
       et on n'est jamais immobile pour rien. */
    dureeToile: 8,           // si on ne fait rien
    effortToile: 2,          // pousser divise le temps par deux
    rayonToile: 58,
    /* ⚠️ Le temps qu'une flaque met a s'etaler, et pendant lequel elle ne
       touche personne. Sans lui, la flaque visait 90 unites devant le
       chevalier : elle etait consommee a la seconde ou elle touchait le sol,
       donc jamais evitable et jamais VUE. « J'ai vu des crachats tomber a
       terre mais jamais apparaitre en flaque. » */
    eclosionFlaque: 0.7,

    /* les graines */
    rayonGraine: 5,
    aimant: 95,              // portee de ramassage
    vitesseGraine: 260,

    /* l'experience */
    xpBase: 6,               // pour le niveau 2
    xpFacteur: 1.28,         // chaque niveau coute 28 % de plus

    /* le temps qu'il fait : il change tout seul, jamais deux fois de suite
       le meme. Beau au depart, le temps de comprendre le jeu. */
    meteoDepart: 30,
    /* le cadran annonce le temps qui vient, une seconde avant qu'il arrive :
       la meme regle que tout ce qui frappe dans ce jeu */
    preavisMeteo: 1,
    dureeEclair: 0.35,       // combien de temps on voit l'eclair apres le coup

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

  /* Les temps vivent dans meteo.js, comme les bestioles dans bestioles.js.
     Le moteur ne connait que leur nom, leur poids et leur duree. */
  var TEMPS = (typeof Meteo !== "undefined" && Meteo.TEMPS) || {
    beau: { nom: "beau", titre: "Beau temps", poids: 1, duree: [40, 70] }
  };

  var MONDE_PAR_DEFAUT = { nom: "vide", rayon: REGLAGES.rayonArene, obstacles: [] };

  /* Ce qu'on trouve au sol, et a quelle frequence. Declare ici, au niveau du
     module : dans `creer`, tout ce qui suit `return partie` n'est jamais
     execute, et une constante y devient silencieusement `undefined`. */
  /* les cinq du panier, dans l'ordre ou on les montre */
  var LEGUMES = ["carotte", "tomate", "brocoli", "pomme", "raisin"];

  var SORTES = [
    { sorte: "coeur", poids: 38 },
    { sorte: "coffre", poids: 24 },
    { sorte: "bombe",  poids: 20 },
    { sorte: "glace",  poids: 18 },
    { sorte: "piment", poids: 20 },
    /* ⚠️ A ne pas confondre avec la « pierre d'aimant » des cartes de niveau,
       qui augmente la PORTEE pour toujours. Celui-ci est un objet au sol, a
       usage unique : il appelle TOUTES les graines de la carte d'un coup. */
    { sorte: "aimant", poids: 16 }
  ];

  /* Un generateur a graine plutot que Math.random : sans lui, un controle qui
     echoue n'est pas rejouable, et une partie ne peut pas etre reproduite. */
  function alea(graine){
    var e = (graine >>> 0) || 1;
    function suivant(){
      e ^= e << 13; e >>>= 0;
      e ^= e >> 17;
      e ^= e << 5;  e >>>= 0;
      return e / 4294967296;
    }
    /* ⚠️ On chauffe le generateur. Sans ces tours a vide, deux graines
       voisines donnent presque la meme premiere valeur : l'arme de depart
       tiree au premier appel etait toujours la meme. */
    for(var i = 0; i < 16; i++) suivant();
    return suivant;
  }

  /* combien d'experience pour passer au niveau suivant */
  function coutNiveau(niveau){
    /* jamais zero : `gagnerXp` boucle tant que l'experience suffit, et un cout
       nul ferait tourner cette boucle a l'infini. Un reglage passe par
       l'adresse (?xpBase=0) suffisait a figer l'onglet. */
    return Math.max(1, Math.round(REGLAGES.xpBase * Math.pow(REGLAGES.xpFacteur, niveau - 1)));
  }

  function creer(options){
    options = options || {};
    var monde = options.monde || MONDE_PAR_DEFAUT;
    var rayon = monde.rayon || REGLAGES.rayonArene;
    var rnd = alea(options.graine === undefined ? 1 : options.graine);
    var avecFoule = options.foule !== false;
    /* `aide` va de -2 a 2 : ce que les parties precedentes ont appris. Le
       moteur ne sait pas d'ou ca vient, il applique. Positif = plus doux,
       negatif = plus serre. Les trois reglages qui s'en servent (la foule, le
       rythme des objets, la vie des bestioles) marchent deja dans les deux
       sens : il suffisait d'ouvrir la borne. */
    var aide = Math.max(-2, Math.min(2, options.aide || 0));
    var legumeChaque = options.legumeChaque || REGLAGES.legumeChaque;
    /* ⚠️ En mode « Tout voir », chaque temps dure le meme court moment. Une
       tempete de neige dure entre 25 et 150 s et n'arrive qu'une fois de temps
       en temps : « je ne suis pas tombe dessus pour verifier les tas qui
       s'accumulent ». Voir la neige s'entasser PUIS fondre au soleil demandait
       de jouer longtemps et d'avoir de la chance. */
    var dureeMeteo = options.dureeMeteo || 0;

    var evenements = [];
    var bestioles = [];
    var graines = [];
    var objets = [];
    var tirs = [];           /* ce que les bestioles envoient */
    var explosions = [];     /* ce qui vient de souffler, pour l'affichage */
    var crachats = [];       /* en vol, ils ne touchent rien */
    var flaques = [];        /* au sol, ils attendent */
    var prochainObjet = REGLAGES.premierObjet;
    var prochaineFoudre = 0;
    var prochainePlaque = 0;
    var prochainFeu = 0;
    var prochainMalus = 0;
    /* un seau par seconde, sur une minute : de quoi savoir ce que le joueur
       fait comme degats sans garder l'historique de toute la partie */
    var seaux = new Array(60);
    for(var si = 0; si < 60; si++) seaux[si] = 0;
    var seauCourant = 0;
    var feuX = 0, feuY = 0;
    var prochainLegume = legumeChaque;
    var obstacles = semer(monde.obstacles);

    var joueur = {
      x: 0, y: 0, angle: 0, vise: 0, avance: false,
      coeurs: REGLAGES.coeurs, coeursMax: REGLAGES.coeurs,
      invincibleJusqua: 0, vivant: true,
      vx: 0, vy: 0,
      ralentiJusqua: -1, dernierBuisson: -99, freineJusqua: -1,
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
      objets: objets,
      panier: {},            /* les fruits et legumes deja reunis */
      feux: [],              /* la trainee de feu, la plus vieille en tete */
      crachats: crachats,    /* ce qui vole en cloche vers le sol */
      flaques: flaques,      /* ce qui attend par terre : glaire, ou acide */
      freineJusqua: -1,      /* tant qu'il patauge dans la glaire */
      boss: null,            /* la reine, une fois les huit minutes passees */
      bossVaincu: false,
      toiles: [],            /* ce qui colle au sol */
      colleJusqua: -1,       /* tant qu'il est pris dedans */
      pimentJusqua: -1,
      etoileJusqua: -1,      /* les cinq reunis : invincible, et on tue au contact */
      tirs: tirs,
      onde: null,
      explosions: explosions,
      /* Ce que les objets du chevalier ajoutent. Le moteur ne sait pas ce
         qu'est une paire de bottes : il lit un tableau que les armes
         remplissent a chaque image. */
      bonus: { aimant: 1, vitesse: 1 },
      obstacles: obstacles,
      evenements: evenements,
      temps: 0,
      /* L'horloge des bestioles, qui ne tourne PAS pendant le gel. Leurs
         minuteries sont en temps absolu : avec `temps`, une bestiole gelee
         dix secondes reprenait son attaque a la seconde ou la glace fondait,
         sans le preavis d'une seconde que la spec impose. */
      tempsActif: 0,
      meteo: { nom: "beau", debut: 0, jusqua: REGLAGES.meteoDepart },
      meteoProchaine: null,  /* ce que le cadran annonce, avant que ca arrive */
      plaques: [],           /* la glace au sol : elle s'accumule, puis elle fond */
      ombres: [],            /* l'ombre des nuages qui passe sur le sol */
      foudres: [],           /* ce qui va tomber, et ce qui vient de tomber */
      duree: REGLAGES.duree,
      gelJusqua: -1,
      xp: 0, niveau: 1, xpNiveau: 0, xpProchain: coutNiveau(1),
      aide: aide,           /* ce que les parties precedentes ont appris */
      tues: 0,
      fini: false, gagne: false,
      alea: rnd,
      commander: commander,
      pas: pas,
      naitre: naitre,
      difficulte: difficulte,
      changerMeteo: changerMeteo,
      /* geler une bestiole, comme `blesser` la blesse : le moteur fournit le
         geste, l'arme decide quand s'en servir */
      forceDuJoueur: forceDuJoueur,
      invoquerBoss: invoquerBoss,
      geler: function(b, duree){
        if(!b || !b.vivante) return false;
        b.geleJusqua = Math.max(b.geleJusqua, partie.temps + duree);
        return true;
      },
      froid: froid,
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

    /* ⚠️ Pas de OU exclusif ici : avec un indice negatif il retourne les bits
       hauts, et 1196 des 2601 cases de l'arene se confondaient deux a deux.
       Une multiplication et une addition donnent une cle unique tant que
       |cy| reste sous 2^22, ce qui laisse de la marge pour n'importe quelle
       arene. */
    function cle(x, y){
      return Math.floor(x / CASE) * 8388608 + Math.floor(y / CASE);
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

    /* ------------------------------------------------------- le temps

       Il change tout seul, et jamais deux fois de suite le meme : sinon on ne
       remarque pas qu'il a change. */
    function tirerUnTemps(){
      /* Chaque temps dit ce qui peut le suivre. L'orage arrive apres les
         nuages ou la pluie, pas apres la neige ; le soleil revient par les
         nuages. Sans `suites`, on retombe sur n'importe quoi d'autre. */
      var t = TEMPS[partie.meteo.nom], suites = t && t.suites;
      var noms = Object.keys(TEMPS).filter(function(n){
        return n !== partie.meteo.nom && (!suites || suites[n] > 0) && TEMPS[n];
      });
      if(!noms.length){
        noms = Object.keys(TEMPS).filter(function(n){ return n !== partie.meteo.nom; });
      }
      if(!noms.length) return null;
      var total = 0, i;
      for(i = 0; i < noms.length; i++) total += (suites && suites[noms[i]]) || 1;
      var d = rnd() * total;
      for(i = 0; i < noms.length; i++){
        d -= (suites && suites[noms[i]]) || 1;
        if(d <= 0) return noms[i];
      }
      return noms[noms.length - 1];
    }

    /* Le cadran annonce d'abord, le ciel change ensuite. On voit le temps
       tourner avant de le subir, comme le herisson se met en boule avant de
       charger. */
    function tournerLeTemps(){
      if(!partie.meteoProchaine &&
         partie.temps >= partie.meteo.jusqua - REGLAGES.preavisMeteo){
        var choisi = tirerUnTemps();
        if(!choisi) return;
        partie.meteoProchaine = { nom: choisi, quand: partie.meteo.jusqua };
        evenements.push({ type: "meteo annoncee", nom: choisi });
      }
      if(partie.meteoProchaine && partie.temps >= partie.meteoProchaine.quand){
        var nom = partie.meteoProchaine.nom;
        partie.meteoProchaine = null;
        changerMeteo(nom);
      }
    }

    /* Un seul chemin pour changer le temps : celui qui seme aussi ce que le
       temps pose au sol. Un raccourci qui ne passait pas par la a fait croire
       que la neige n'avait pas de plaques de glace. */
    function changerMeteo(nom){
      var t = TEMPS[nom];
      if(!t) return partie.meteo;
      var bornes = t.duree || [40, 60];
      /* ⚠️ Tirage AU CARRE : une averse courte est frequente, une pluie qui
         dure toute la partie est rare mais possible. Un tirage plat donnait
         toujours a peu pres la meme duree, et le temps semblait mecanique. */
      var part = rnd(); part = part * part;
      var combien = dureeMeteo || (bornes[0] + part * (bornes[1] - bornes[0]));
      partie.meteo = {
        nom: nom,
        debut: partie.temps,
        jusqua: partie.temps + combien
      };
      /* ⚠️ On ne balaye PAS la glace au sol : elle doit fondre, pas
         disparaitre a la seconde ou le soleil revient. */
      prochainePlaque = t.plaques ? partie.temps + t.plaques.chaque : 0;
      partie.ombres.length = 0;
      if(t.ombres){
        for(var k = 0; k < t.ombres.nombre; k++){
          /* les ombres aussi vivent la ou il joue : une ombre a l'autre bout
             de l'arene ne passe sur personne */
          var g = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 700;
          partie.ombres.push({
            x: joueur.x + Math.cos(g) * d, y: joueur.y + Math.sin(g) * d,
            r: t.ombres.rayonMin + rnd() * (t.ombres.rayonMax - t.ombres.rayonMin),
            i: rnd() * Math.PI * 2,
            a: rnd() * Math.PI * 2
          });
        }
      }
      partie.foudres.length = 0;
      partie.meteoProchaine = null;
      prochaineFoudre = t.foudre ? partie.temps + t.foudre.chaque : 0;
      evenements.push({ type: "meteo", nom: nom });
      return partie.meteo;
    }

    /* ⚠️ Le sol garde la memoire du ciel. La neige POSE une plaque toutes les
       quatre secondes tant qu'elle tombe : une averse en laisse deux, une
       tempete en couvre le terrain. Et quand le soleil revient, les plaques
       FONDENT, elles retrecissent jusqu'a disparaitre. C'est ce qui fait que
       le temps raconte quelque chose au lieu de se remplacer. */
    function vieDuSol(dt){
      var t = TEMPS[partie.meteo.nom];

      if(t && t.plaques && partie.temps >= prochainePlaque &&
         partie.plaques.length < t.plaques.max){
        prochainePlaque = partie.temps + t.plaques.chaque;
        /* ⚠️ AUTOUR DU CHEVALIER, pas n'importe ou. Semees sur toute l'arene
           de 1400, neuf plaques tombaient toutes a plus de 500 de lui : il
           neigeait et on ne glissait jamais. La neige tombe partout, mais on
           ne la pose que la ou il joue. */
        var g = rnd() * Math.PI * 2, d = 180 + Math.sqrt(rnd()) * 620;
        var r = t.plaques.rayonMin + rnd() * (t.plaques.rayonMax - t.plaques.rayonMin);
        var px = joueur.x + Math.cos(g) * d, py = joueur.y + Math.sin(g) * d;
        var dc = Math.hypot(px, py), bord = rayon - 120;
        if(dc > bord){ px = px / dc * bord; py = py / dc * bord; }
        partie.plaques.push({
          x: px, y: py,
          r: 0, rPlein: r, i: rnd() * Math.PI * 2,
          /* ⚠️ La plaque porte SON adherence. Sinon, des que le soleil
             revient, on cesse de glisser sur une glace encore visible. */
          adherence: t.adherence || 1
        });
      }

      var fonte = (t && t.fonte) || 0;
      for(var i = partie.plaques.length - 1; i >= 0; i--){
        var q = partie.plaques[i];
        if(q.rPlein === undefined) q.rPlein = q.r;
        if(fonte > 0){
          q.r -= fonte * dt;
          if(q.r <= 8){ partie.plaques.splice(i, 1); continue; }
        }else if(q.r < q.rPlein){
          q.r = Math.min(q.rPlein, q.r + 60 * dt);    /* elle finit de se former */
        }
      }

      if(t && t.ombres){
        for(var j = 0; j < partie.ombres.length; j++){
          var o = partie.ombres[j];
          o.x += Math.cos(o.a) * t.ombres.vitesse * dt;
          o.y += Math.sin(o.a) * t.ombres.vitesse * dt;
          o.i += dt * .2;
          if(Math.hypot(o.x, o.y) > rayon + o.r){   /* sortie d'un cote, elle rentre par l'autre */
            o.x = -o.x; o.y = -o.y;
          }
        }
      }
    }

    /* ⚠️ La trainee de feu. On ne la pose QUE si le chevalier bouge : sinon
       une flaque grossit sous ses pieds et le piment devient un bouclier
       immobile. Les flammees sont rangees de la plus vieille a la plus jeune,
       donc la trainee s'eteint par le bout le plus ancien, tout seul. */
    function semerLeFeu(dt){
      var feux = partie.feux;
      for(var i = 0; i < feux.length; i++){
        if(partie.temps - feux[i].ne < REGLAGES.feuVie) break;
      }
      if(i > 0) feux.splice(0, i);          /* les plus vieilles d'abord */

      if(partie.temps >= partie.pimentJusqua) return;
      if(partie.temps < prochainFeu) return;
      var bouge = Math.hypot(joueur.x - feuX, joueur.y - feuY) > 6;
      prochainFeu = partie.temps + REGLAGES.feuChaque;
      if(!bouge) return;
      feuX = joueur.x; feuY = joueur.y;
      feux.push({ x: joueur.x, y: joueur.y, ne: partie.temps,
                  tourne: rnd() * Math.PI * 2 });
    }

    /* Ce qui traverse le feu brule. Une bestiole ne prend qu'une flammee a la
       fois : sans ca, une trainee dense la tuerait cent fois plus vite au
       milieu qu'au bord, et le piment serait ingerable a regler. */
    function brulerDansLeFeu(dt){
      if(!partie.feux.length) return;
      var r = REGLAGES.feuRayon;
      for(var i = bestioles.length - 1; i >= 0; i--){
        var b = bestioles[i];
        if(!b.vivante || partie.temps < b.arrivee) continue;
        for(var k = 0; k < partie.feux.length; k++){
          var f = partie.feux[k];
          var dx = b.x - f.x, dy = b.y - f.y, p = r + b.rayon;
          if(dx * dx + dy * dy <= p * p){
            blesser(b, REGLAGES.degatsFeu * dt);
            break;
          }
        }
      }
    }

    /* Le vol en cloche, puis la flaque. Rien ne blesse : la glaire freine, et
       l'acide retrograde une arme. C'est une perte de LIBERTE et de PUISSANCE,
       pas de vie, et ca ne se resout pas en tapant plus fort. */
    function volerLesCrachats(dt){
      for(var i = crachats.length - 1; i >= 0; i--){
        var c = crachats[i];
        var part = (partie.temps - c.ne) / REGLAGES.volCrachat;
        if(part >= 1){
          crachats.splice(i, 1);
          flaques.push({
            x: c.butX, y: c.butY, r: REGLAGES.rayonFlaque,
            sorte: c.sorte, ne: partie.temps, i: rnd() * Math.PI * 2
          });
          evenements.push({ type: "flaque", sorte: c.sorte, x: c.butX, y: c.butY });
          continue;
        }
        c.x = c.depX + (c.butX - c.depX) * part;
        c.y = c.depY + (c.butY - c.depY) * part;
        /* la hauteur ne sert qu'au dessin : on la donne, on ne la calcule pas
           deux fois */
        c.haut = Math.sin(part * Math.PI) * 42;
      }
    }

    function vivreLesFlaques(dt){
      for(var i = flaques.length - 1; i >= 0; i--){
        var f = flaques[i];
        if(partie.temps - f.ne > REGLAGES.dureeFlaque){ flaques.splice(i, 1); continue; }
        /* elle s'etale d'abord, et pendant ce temps elle ne touche personne :
           c'est ce qui la rend evitable, et ce qui la rend visible */
        if(partie.temps - f.ne < REGLAGES.eclosionFlaque) continue;
        if(!joueur.vivant) continue;
        var dx = joueur.x - f.x, dy = joueur.y - f.y;
        if(dx * dx + dy * dy > f.r * f.r) continue;
        if(f.sorte === "acide" && partie.temps >= prochainMalus){
          /* ⚠️ Elle ne prend QU'UNE FOIS, et elle disparait : sinon rester
             coince dedans deux secondes couterait cinq niveaux d'un coup. */
          flaques.splice(i, 1);
          prochainMalus = partie.temps + REGLAGES.reposMalus;
          evenements.push({ type: "malus", x: f.x, y: f.y });
        }else{
          /* ⚠️ Y COMPRIS L'ACIDE PENDANT SON REPOS. Avant, il etait supprime
             sans le moindre effet : on marchait dans du violet et il ne se
             passait rien, ni degat, ni signe, ni flaque. Une chose qui ne fait
             rien du tout n'aurait pas du etre dessinee. Il freine, comme la
             glaire, et il reste au sol. */
          joueur.freineJusqua = partie.temps + 0.35;
        }
      }
      partie.freineJusqua = joueur.freineJusqua;
    }

    /* ⚠️ LA TOILE. Elle colle, mais on N'EST JAMAIS IMMOBILISE POUR RIEN :
       pousser le manche use la toile trois fois et demie plus vite que le
       temps. L'enfant se debat et s'en sort, au lieu de regarder sa mort
       arriver — c'est le meme souci que la flaque qui ralentit, en pire, parce
       qu'ici on ne bouge plus du tout. */
    function vivreLesToiles(dt){
      for(var i = partie.toiles.length - 1; i >= 0; i--){
        var t = partie.toiles[i];
        t.reste -= dt;
        if(t.reste <= 0){ partie.toiles.splice(i, 1); continue; }
        if(!joueur.vivant) continue;
        var dx = joueur.x - t.x, dy = joueur.y - t.y;
        if(dx * dx + dy * dy > t.r * t.r) continue;
        /* elle se defait plus vite si on pousse */
        var effort = joueur.avance ? REGLAGES.effortToile : 1;
        t.reste -= dt * (effort - 1);
        joueur.colleJusqua = partie.temps + 0.12;
      }
      partie.colleJusqua = joueur.colleJusqua;
    }

    /* Les bestioles ont froid : sous la neige elles avancent au ralenti, et
       un halo bleu le dit sans un mot. */
    function froid(){
      var t = TEMPS[partie.meteo.nom];
      return (t && t.ralentit) || 1;
    }

    /* Le chevalier glisse-t-il ? 1 = il tourne net, moins = il garde son
       elan. La neige pose des plaques, et une plaque ne blesse pas : elle
       fait glisser, comme le buisson ralentit. */
    function adherence(){
      if(!partie.plaques.length) return 1;
      for(var i = 0; i < partie.plaques.length; i++){
        var q = partie.plaques[i];
        if(!q.adherence || q.adherence >= 1) continue;
        var dx = joueur.x - q.x, dy = joueur.y - q.y;
        if(dx * dx + dy * dy <= q.r * q.r) return q.adherence;
      }
      return 1;
    }

    /* La foudre. Elle previent une seconde avant de tomber, comme tout ce qui
       frappe, et elle ne touche jamais le chevalier. */
    function tonnerre(){
      var t = TEMPS[partie.meteo.nom];
      if(!t || !t.foudre){ if(partie.foudres.length) partie.foudres.length = 0; return; }
      var f = t.foudre;
      if(prochaineFoudre && partie.temps >= prochaineFoudre && bestioles.length){
        prochaineFoudre = partie.temps + f.chaque;
        var cible = bestioles[Math.floor(rnd() * bestioles.length)];
        partie.foudres.push({
          x: cible.x, y: cible.y, rayon: f.rayon,
          tombe: partie.temps + f.preavis, frappee: false
        });
        evenements.push({ type: "foudre annoncee" });
      }
      for(var i = partie.foudres.length - 1; i >= 0; i--){
        var e = partie.foudres[i];
        if(!e.frappee && partie.temps >= e.tombe){
          e.frappee = true;
          for(var k = 0; k < bestioles.length; k++){
            var b = bestioles[k];
            if(!b.vivante) continue;
            if(Math.hypot(b.x - e.x, b.y - e.y) > e.rayon) continue;
            blesser(b, f.degats);
          }
          evenements.push({ type: "foudre", x: e.x, y: e.y });
        }
        if(e.frappee && partie.temps > e.tombe + REGLAGES.dureeEclair){
          partie.foudres.splice(i, 1);
        }
      }
    }

    /* ------------------------------------------------------ les vagues */

    function difficulte(){
      var minute = Math.floor(partie.temps / 60);
      return {
        minute: minute,
        /* trois bestioles de moins par niveau d'aide */
        cible: Math.max(4, Math.min(REGLAGES.plafond,
          REGLAGES.departFoule + minute * REGLAGES.parMinute - aide * 3)),
        especes: Object.keys(ESPECES).filter(function(n){
          /* ⚠️ Le boss ne nait JAMAIS dans une vague : il est invoque, une
             seule fois, quand le chronometre arrive au bout. */
          if(ESPECES[n].boss) return false;
          if(partie.temps < ESPECES[n].arrive) return false;
          /* ⚠️ Certaines n'attendent pas l'HEURE, elles attendent la
             PUISSANCE. « A un certain niveau on roule sur le jeu, il faut
             contrebalancer ca » : le contre-poids doit donc arriver quand la
             puissance arrive, pas a une heure fixe. Un enfant qui peine ne le
             rencontre jamais, et c'est voulu. */
          if(ESPECES[n].arriveNiveau && partie.niveau < ESPECES[n].arriveNiveau) return false;
          return true;
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
      /* La toute premiere vague arrive plus pres : sinon les cinq premieres
         secondes sont vides, et un enfant qui lance une partie doit avoir
         quelque chose a taper tout de suite. */
      var d = partie.temps < REGLAGES.premiereVague
        ? 230 + rnd() * 110
        : REGLAGES.naissanceLoin + rnd() * (REGLAGES.naissanceTresLoin - REGLAGES.naissanceLoin);
      var x = joueur.x + Math.cos(g) * d, y = joueur.y + Math.sin(g) * d;
      var dc = Math.hypot(x, y);
      if(dc > rayon - 40){ x = x / dc * (rayon - 40); y = y / dc * (rayon - 40); }
      /* Elle encaisse un coup de plus toutes les deux minutes, et l'aide
         tiree des parties precedentes lui en retire : sur une bete a un point
         de vie ca ne change rien, sur le lucane ca fait toute la difference
         entre un exploit et un mur. */
      var saVie = Math.max(1, Math.round(
        (e.vie + Math.floor(partie.temps / 120)) * (1 - aide * 0.18)));
      var b = {
        espece: e, nom: nom,
        x: x, y: y, angle: g + Math.PI,
        vie: saVie,
        vieMax: saVie,
        rayon: e.rayon,
        phase: rnd() * Math.PI * 2,
        pousseeX: 0, pousseeY: 0, pousseeJusqua: -1,
        geleJusqua: -1,        /* gelee toute seule, par un sort */
        reposOrbite: -1,       /* ⚠️ le repos appartient a la BESTIOLE, pas a
                                  l'arme : sinon un bouclier qui vient de
                                  frapper traverse la suivante sans rien lui
                                  faire */
        vivante: true
      };
      bestioles.push(b);
      return b;
    }

    function peupler(){
      if(!avecFoule) return;
      /* pendant le combat de boss, plus rien ne nait : elle est seule en face */
      if(partie.boss) return;
      var d = difficulte();
      if(bestioles.length >= d.cible || !d.especes.length) return;
      var manque = Math.min(4, d.cible - bestioles.length);   /* pas tout d'un coup */
      for(var i = 0; i < manque; i++){
        /* ⚠️ On ne tire que parmi les especes qui peuvent VRAIMENT naitre :
           une naissance refusee par le plafond des individus comptait comme
           une naissance, et la foule restait sous sa cible tout du long. */
        var libres = d.especes.filter(function(n){
          return !ESPECES[n].individu || individusVivants() < REGLAGES.plafondIndividus;
        });
        if(!libres.length) return;
        naitre(libres[Math.floor(rnd() * libres.length)]);
      }
    }

    /* Ce que le joueur inflige par seconde, vu sur la derniere minute. */
    function forceDuJoueur(){
      var total = 0;
      for(var i = 0; i < seaux.length; i++) total += seaux[i];
      return total / REGLAGES.bossFenetre;
    }

    /* `force` : les degats par seconde a prendre pour calibrer la reine. Sans
       elle, on lit ceux de la derniere minute — c'est le cas normal. On la
       passe quand on saute directement au combat, ou il n'y a pas de derniere
       minute a lire. */
    function invoquerBoss(force){
      var e = ESPECES[REGLAGES.bossEspece];
      if(!e) return null;
      /* la prairie se vide : le combat doit etre lisible, et a huit minutes un
         enfant n'a plus la tete a suivre trente bestioles ET une reine */
      for(var i = bestioles.length - 1; i >= 0; i--){
        bestioles[i].vivante = false;
        bestioles.splice(i, 1);
      }
      tirs.length = 0;
      crachats.length = 0;

      var b = naitre(REGLAGES.bossEspece);
      if(!b) return null;
      if(force === undefined || force === null) force = forceDuJoueur();
      b.vie = Math.max(REGLAGES.bossVieMin,
              Math.min(REGLAGES.bossVieMax, Math.round(force * REGLAGES.bossVise)));
      b.vieMax = b.vie;
      b.arrivee = partie.temps + REGLAGES.preavisBoss;
      /* elle arrive de loin, et bien en vue */
      var g = rnd() * Math.PI * 2;
      b.x = joueur.x + Math.cos(g) * 300;
      b.y = joueur.y + Math.sin(g) * 300;
      var dc = Math.hypot(b.x, b.y), bord = rayon - 120;
      if(dc > bord){ b.x = b.x / dc * bord; b.y = b.y / dc * bord; }
      partie.boss = b;
      evenements.push({ type: "boss", vie: b.vie, force: Math.round(force * 10) / 10 });
      return b;
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
      if(joueur.freineJusqua > partie.temps) lent *= REGLAGES.freinFlaque;
      /* colle : il ne se deplace plus, mais il continue de tourner et de
         frapper — on ne lui retire jamais tout */
      if(joueur.colleJusqua > partie.temps) lent = 0;
      var v = joueur.avance ? REGLAGES.vitesse * lent * partie.bonus.vitesse : 0;
      var cx = Math.cos(joueur.angle) * v, cy = Math.sin(joueur.angle) * v;
      var prise = adherence();
      if(prise >= 1){
        /* sol normal : il part et s'arrete net, c'est le controle qu'elle a
           valide, on n'y touche pas */
        joueur.vx = cx; joueur.vy = cy;
      }else{
        /* sur la glace il garde son elan */
        var k = Math.min(1, prise * 14 * dt);
        joueur.vx += (cx - joueur.vx) * k;
        joueur.vy += (cy - joueur.vy) * k;
      }
      joueur.x += joueur.vx * dt;
      joueur.y += joueur.vy * dt;
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

    /* Ce qu'une bestiole peut faire, et rien de plus. Son comportement est
       ecrit dans bestioles.js, le moteur ne fait que le servir. */
    function penserPour(b, dt){
      if(!b.espece.penser) return;
      var dx = joueur.x - b.x, dy = joueur.y - b.y;
      var c = {
        temps: partie.tempsActif,
        dt: dt,
        distance: Math.hypot(dx, dy),
        angleVersJoueur: Math.atan2(dy, dx),
        /* ou il est et ou il va : viser le SOL demande de savoir viser devant
           lui, pas seulement dans sa direction */
        joueurX: joueur.x, joueurY: joueur.y, joueurAngle: joueur.angle,
        tirer: function(angle, vitesse, rayon, vie, couleur){
          tirs.push({
            x: b.x + Math.cos(angle) * (b.rayon + rayon),
            y: b.y + Math.sin(angle) * (b.rayon + rayon),
            vx: Math.cos(angle) * vitesse, vy: Math.sin(angle) * vitesse,
            r: rayon, vie: vie, couleur: couleur || "#9ad7ff"
          });
          evenements.push({ type: "tir", bestiole: b });
        },
        /* ⚠️ Cracher n'est pas tirer. Un tir touche ce qu'il croise ; un
           crachat ne touche RIEN en vol, il retombe et attend par terre. La
           bestiole dit ou elle vise, le moteur fait le reste : c'est la
           frontiere habituelle. */
        cracher: function(x, y, sorte){
          crachats.push({
            depX: b.x, depY: b.y, x: b.x, y: b.y,
            butX: x, butY: y,
            ne: partie.temps, sorte: sorte
          });
          evenements.push({ type: "crachat", sorte: sorte });
        },
        /* poser une toile a un endroit : elle colle qui marche dedans */
        toiler: function(x, y){
          partie.toiles.push({ x: x, y: y, r: REGLAGES.rayonToile,
                               reste: REGLAGES.dureeToile,
                               plein: REGLAGES.dureeToile,
                               i: rnd() * Math.PI * 2 });
          evenements.push({ type: "toile", x: x, y: y });
        },
        exploser: function(portee){
          if(Math.hypot(joueur.x - b.x, joueur.y - b.y) <= portee) toucherJoueur(b);
          explosions.push({ x: b.x, y: b.y, rayon: portee, debut: partie.temps,
                            duree: REGLAGES.dureeExplosion });
          evenements.push({ type: "explosion", x: b.x, y: b.y, rayon: portee });
          blesser(b, 9999);
        }
      };
      b.espece.penser(b, c);
    }

    function bouger(b, dt){
      if(partie.temps < partie.gelJusqua) return;   /* la glace, pour tout le monde */
      /* ⚠️ Et le gel d'UNE SEULE bestiole, celui des sorts. Il s'arrete au
         meme endroit que le gel general : elle ne bouge plus, elle ne pense
         plus, donc elle ne prepare rien pendant ce temps. */
      if(partie.temps < b.geleJusqua) return;
      /* soufflee par l'onde : elle part en arriere, de moins en moins vite,
         et reprend sa route ensuite */
      if(b.pousseeJusqua > partie.temps){
        var reste = (b.pousseeJusqua - partie.temps) / REGLAGES.dureePoussee;
        b.x += b.pousseeX * reste * dt;
        b.y += b.pousseeY * reste * dt;
        var dp = Math.hypot(b.x, b.y), maxp = rayon - b.rayon;
        if(dp > maxp){ b.x = b.x / dp * maxp; b.y = b.y / dp * maxp; }
        return;
      }
      penserPour(b, dt);
      if(!b.vivante || b.immobile) return;
      if(b.angleImpose !== null && b.angleImpose !== undefined){
        /* il fonce tout droit et ne corrige pas : c'est ce qui rend la charge
           esquivable */
        b.angle = b.angleImpose;
        var vitc = b.espece.vitesse * (b.vitesseFacteur || 1) * froid();
        b.x += Math.cos(b.angle) * vitc * dt;
        b.y += Math.sin(b.angle) * vitc * dt;
        var dcc = Math.hypot(b.x, b.y), maxc = rayon - b.rayon;
        if(dcc > maxc){ b.x = b.x / dcc * maxc; b.y = b.y / dcc * maxc; }
        return;
      }
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
      var vit = b.espece.vitesse * (b.vitesseFacteur || 1) * froid();
      b.x += vx / m * vit * dt;
      b.y += vy / m * vit * dt;

      var dc = Math.hypot(b.x, b.y), max = rayon - b.rayon;
      if(dc > max){ b.x = b.x / dc * max; b.y = b.y / dc * max; }
    }

    /* `depuis` : d'ou vient le coup, et avec quelle force. Un coup qui
       repousse se voit tout de suite, meme quand la bestiole meurt en un
       coup ; sans ca, taper plus fort n'a aucun effet visible. */
    function blesser(b, degats, depuis){
      /* ⚠️ UN BOSS NE RECULE PAS. Mesure : frappee par trois armes, la reine
         etait repoussee de 879 unites en vingt secondes — autant que ce qu'elle
         parcourait. Elle n'arrivait jamais, et son bond etait annule au moment
         meme ou il partait : « elle ne saute jamais et a chaque coup recu elle
         recule ». Les deux plaintes n'avaient qu'une cause. */
      if(depuis && depuis.force && !b.espece.boss){
        var dx = b.x - depuis.x, dy = b.y - depuis.y, d = Math.hypot(dx, dy) || 1;
        b.x += dx / d * depuis.force;
        b.y += dy / d * depuis.force;
        var dc = Math.hypot(b.x, b.y), max = rayon - b.rayon;
        if(dc > max){ b.x = b.x / dc * max; b.y = b.y / dc * max; }
      }
      /* certaines bestioles encaissent mieux dans certains etats : le
         herisson en boule, par exemple. La regle appartient a l'espece, le
         moteur ne fait que la demander. */
      var pris = degats * (b.espece.armure ? b.espece.armure(b) : 1);
      seaux[seauCourant] += Math.max(0, Math.min(pris, b.vie));
      b.vie -= pris;
      if(b.vie > 0) return false;
      b.vivante = false;
      partie.tues++;
      /* ⚠️ Plus elle a encaisse de coups, plus elle rapporte. Sa vie monte
         d'un point toutes les deux minutes, sa recompense suit : sinon un
         escargot de la septieme minute demande cinq coups et rapporte autant
         que celui de la premiere.
         Et une grosse bete peut demander a payer en PLUSIEURS graines : douze
         graines a ramasser se sentent comme un exploit, une seule graine de
         quarante ne se voit pas. */
      var gain = b.espece.xp + Math.max(0, (b.vieMax || b.espece.vie) - b.espece.vie);
      var combien = Math.max(1, b.espece.graines || 1);
      for(var gi = 0; gi < combien; gi++){
        var ga = rnd() * Math.PI * 2;
        var gl = combien === 1 ? 0 : 20 + Math.sqrt(rnd()) * (b.rayon + 30);
        graines.push({
          x: b.x + Math.cos(ga) * gl,
          y: b.y + Math.sin(ga) * gl,
          /* ⚠️ Mesure du 2026-08-28, 75 parties par palier : adoucir a fond
             DESSERVAIT le chevalier (425 s a l'aide 2 contre 456 s sans aide).
             Moins de bestioles, c'est moins de graines, donc moins
             d'experience et des armes plus faibles. On rend en valeur ce qu'on
             a retire en nombre. */
          valeur: Math.max(1, Math.round(gain / combien * (1 + Math.max(0, aide) * 0.3))),
          r: REGLAGES.rayonGraine,
          attiree: false
        });
      }
      evenements.push({ type: "tuee", bestiole: b });
      return true;
    }

    /* un coup, d'ou qu'il vienne : contact, bulle ou explosion */
    function toucherJoueur(source){
      if(!joueur.vivant || partie.temps < joueur.invincibleJusqua) return false;
      /* les cinq fruits et legumes reunis : rien ne l'atteint */
      if(partie.temps < partie.etoileJusqua) return false;
      joueur.coeurs--;
      joueur.invincibleJusqua = partie.temps + REGLAGES.invincibilite;
      /* le choc repousse ce qui est colle : sans ca, on ressort du delai
         d'invincibilite dans le meme tas et on reperd un coeur aussitot */
      voisines(joueur.x, joueur.y, REGLAGES.reculChoc, tampon);
      for(var k = 0; k < tampon.length; k++){
        var a = tampon[k];
        var ax = a.x - joueur.x, ay = a.y - joueur.y, ad = Math.hypot(ax, ay) || 1;
        if(ad > REGLAGES.reculChoc) continue;
        if(a.espece.boss){
          /* ⚠️ UN BOSS NE RECULE PAS, MEME LA. Ce choc existe pour qu'on ne
             ressorte pas de l'invincibilite dans le meme tas ; il faut donc
             bien que quelqu'un s'ecarte. Contre la reine, c'est LE CHEVALIER
             qui est projete en arriere — elle, elle avance. */
          joueur.x -= ax / ad * ((REGLAGES.reculChoc - ad) + 20);
          joueur.y -= ay / ad * ((REGLAGES.reculChoc - ad) + 20);
          var dj = Math.hypot(joueur.x, joueur.y), maxj = rayon - joueur.rayon;
          if(dj > maxj){ joueur.x = joueur.x / dj * maxj; joueur.y = joueur.y / dj * maxj; }
          continue;
        }
        a.x += ax / ad * ((REGLAGES.reculChoc - ad) + 20);
        a.y += ay / ad * ((REGLAGES.reculChoc - ad) + 20);
      }
      evenements.push({ type: "touche", bestiole: source || null });
      if(joueur.coeurs <= 0){
        joueur.coeurs = 0;
        joueur.vivant = false;
        partie.fini = true;
        evenements.push({ type: "mort" });
      }
      return true;
    }

    function bougerTirs(dt){
      /* la glace fige tout, y compris ce qui est deja en l'air : une bulle
         lancee par un crapaud fige continuait sa route et coutait un coeur */
      if(partie.temps < partie.gelJusqua) return;
      for(var i = tirs.length - 1; i >= 0; i--){
        var t = tirs[i];
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.vie -= dt;
        var dx = t.x - joueur.x, dy = t.y - joueur.y, p = t.r + joueur.rayon;
        if(dx * dx + dy * dy <= p * p){
          toucherJoueur(null);
          tirs.splice(i, 1);
          continue;
        }
        if(t.vie <= 0 || Math.hypot(t.x, t.y) > rayon) tirs.splice(i, 1);
      }
    }

    function contact(){
      if(!joueur.vivant) return;
      if(partie.temps < joueur.invincibleJusqua && partie.temps >= partie.etoileJusqua) return;
      voisines(joueur.x, joueur.y, joueur.rayon + 24, tampon);
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante) continue;
        var dx = b.x - joueur.x, dy = b.y - joueur.y, p = b.rayon + joueur.rayon;
        if(dx * dx + dy * dy > p * p) continue;
        if(partie.temps < partie.etoileJusqua){
          /* en etoile, c'est lui qui les balaye */
          blesser(b, 9999);
          continue;
        }
        toucherJoueur(b);
        return;
      }
    }

    /* ------------------------------------------------------- les graines */

    function ramasser(dt){
      var portee = REGLAGES.aimant * partie.bonus.aimant;
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

    /* Les objets au sol. Une fraise n'est ramassee que s'il manque un coeur :
       marcher dessus a cinq coeurs ne la gaspille pas, on revient la chercher.
       Les trois autres agissent tout de suite et disparaissent. */
    function tirerSorte(){
      var total = 0, i;
      for(i = 0; i < SORTES.length; i++) total += SORTES[i].poids;
      var d = rnd() * total;
      for(i = 0; i < SORTES.length; i++){
        d -= SORTES[i].poids;
        if(d <= 0) return SORTES[i].sorte;
      }
      return SORTES[0].sorte;
    }

    /* Un fruit ou un legume qui manque au panier, de temps en temps, n'importe
       ou sur la carte. */
    function semerLegume(){
      if(partie.temps < prochainLegume) return;
      /* ⚠️ Mesure : au bout de 400 s il y avait SIX pommes, quatre carottes et
         quatre tomates au sol en meme temps. On ne regardait que le panier,
         jamais ce qui trainait deja : tant qu'un fruit n'etait pas ramasse, on
         en resemait un pareil toutes les vingt-six secondes. */
      var dejaLa = {};
      for(var oi = 0; oi < objets.length; oi++) dejaLa[objets[oi].sorte] = true;
      var manquants = LEGUMES.filter(function(n){
        return !partie.panier[n] && !dejaLa[n];
      });
      if(!manquants.length) return;
      prochainLegume = partie.temps + legumeChaque;
      var quoi = manquants[Math.floor(rnd() * manquants.length)];
      var g = rnd() * Math.PI * 2, d = 200 + rnd() * 260;
      var x = joueur.x + Math.cos(g) * d, y = joueur.y + Math.sin(g) * d;
      var dc = Math.hypot(x, y), max = rayon - 60;
      if(dc > max){ x = x / dc * max; y = y / dc * max; }
      objets.push({ sorte: quoi, x: x, y: y, r: REGLAGES.rayonObjet, ne: partie.temps });
      evenements.push({ type: "legume", sorte: quoi });
    }

    function semerObjet(){
      /* ⚠️ Le plafond ne compte QUE les objets. Les fruits et legumes attendent
         d'etre trouves et restent au sol longtemps : comptes ensemble, ils
         bouchaient la place. Mesure : le sol etait plein 329 s sur 417, et il
         ne tombait que deux coeurs par partie au lieu d'une vingtaine. */
      var poses = 0;
      for(var oi = 0; oi < objets.length; oi++){
        if(LEGUMES.indexOf(objets[oi].sorte) < 0) poses++;
      }
      if(partie.temps < prochainObjet || poses >= REGLAGES.objetsAuSol) return;
      /* et des objets plus souvent : quatre secondes de moins par niveau */
      prochainObjet = partie.temps + Math.max(8, REGLAGES.objetChaque - aide * 4);
      var g = rnd() * Math.PI * 2, d = 180 + rnd() * 200;
      var x = joueur.x + Math.cos(g) * d, y = joueur.y + Math.sin(g) * d;
      var dc = Math.hypot(x, y), max = rayon - 60;
      if(dc > max){ x = x / dc * max; y = y / dc * max; }
      objets.push({ sorte: tirerSorte(), x: x, y: y, r: REGLAGES.rayonObjet, ne: partie.temps });
      evenements.push({ type: "objet" });
    }

    function ramasserObjets(){
      for(var i = objets.length - 1; i >= 0; i--){
        var o = objets[i];
        var dx = o.x - joueur.x, dy = o.y - joueur.y, p = o.r + joueur.rayon;
        if(dx * dx + dy * dy > p * p) continue;
        if(o.sorte === "coeur"){
          if(joueur.coeurs >= joueur.coeursMax) continue;   /* il attend */
          joueur.coeurs++;
        }else if(LEGUMES.indexOf(o.sorte) >= 0){
          partie.panier[o.sorte] = true;
          evenements.push({ type: "panier", sorte: o.sorte });
          if(LEGUMES.every(function(n){ return partie.panier[n]; })){
            /* les cinq reunis : invincible, et on tue au contact */
            partie.etoileJusqua = partie.temps + REGLAGES.dureeEtoile;
            partie.panier = {};
            evenements.push({ type: "etoile" });
          }
        }else if(o.sorte === "coffre"){
          /* il repand ses graines par terre : le plaisir est de les ramasser */
          for(var n = 0; n < REGLAGES.grainesCoffre; n++){
            var ang = rnd() * Math.PI * 2;
            var loin = 30 + Math.sqrt(rnd()) * REGLAGES.eparpillementCoffre;
            graines.push({
              x: o.x + Math.cos(ang) * loin,
              y: o.y + Math.sin(ang) * loin,
              valeur: REGLAGES.valeurGraineCoffre,
              r: REGLAGES.rayonGraine,
              attiree: false
            });
          }
        }else if(o.sorte === "bombe"){
          exploser(o.x, o.y, REGLAGES.rayonBombe, REGLAGES.degatsBombe);
        }else if(o.sorte === "glace"){
          partie.gelJusqua = partie.temps + REGLAGES.dureeGel;
        }else if(o.sorte === "aimant"){
          /* on ne les teleporte pas : on les APPELLE. Voir toute la prairie
             converger vers soi est la moitie du plaisir, et ca dit ce que
             l'objet vient de faire. */
          for(var ga = 0; ga < graines.length; ga++) graines[ga].attiree = true;
          evenements.push({ type: "aimant", combien: graines.length });
        }else if(o.sorte === "piment"){
          partie.pimentJusqua = partie.temps + REGLAGES.dureePiment;
          evenements.push({ type: "piment" });
        }else{
          /* ⚠️ Une sorte inconnue reste au sol. Avant, elle etait avalee en
             silence : un objet mal nomme disparaissait sans rien faire, et
             c'est exactement ce qui est arrive a la fraise devenue coeur. */
          continue;
        }
        objets.splice(i, 1);
        evenements.push({ type: "ramasse", sorte: o.sorte });
      }
    }

    /* Une explosion : on la voit passer, et ce qu'elle touche rougit avant de
       tomber. Tuer dans la meme image ne se voit pas. */
    function exploser(x, y, portee, degats){
      explosions.push({ x: x, y: y, rayon: portee, debut: partie.temps,
                        duree: REGLAGES.dureeExplosion });
      for(var i = 0; i < bestioles.length; i++){
        var b = bestioles[i];
        if(!b.vivante || b.brule) continue;
        if(Math.hypot(b.x - x, b.y - y) > portee) continue;
        b.brule = partie.temps + REGLAGES.dureeBrulure;
        b.degatsBrulure = degats;
      }
      evenements.push({ type: "explosion", x: x, y: y, rayon: portee });
    }

    function brulures(){
      for(var i = bestioles.length - 1; i >= 0; i--){
        var b = bestioles[i];
        if(!b.brule || partie.temps < b.brule) continue;
        b.brule = 0;
        blesser(b, b.degatsBrulure || 1);
      }
      for(var k = explosions.length - 1; k >= 0; k--){
        if(partie.temps - explosions[k].debut > explosions[k].duree) explosions.splice(k, 1);
      }
    }

    /* La montee de niveau souffle ce qui est autour : on ne revient pas d'un
       ecran de choix pour se faire manger dans la seconde. */
    function souffler(){
      partie.onde = { debut: partie.temps, duree: REGLAGES.dureeOnde, rayon: REGLAGES.ondeNiveau };
      for(var i = 0; i < bestioles.length; i++){
        var b = bestioles[i];
        var dx = b.x - joueur.x, dy = b.y - joueur.y, d = Math.hypot(dx, dy) || 1;
        if(d > REGLAGES.ondeNiveau) continue;
        /* une poussee qui s'eteint, pas un saut : on la VOIT partir, et elle
           reste a l'ecran */
        /* et l'onde de montee de niveau ne la souffle pas non plus : elle
           balaie la foule, pas la reine */
        if(b.espece.boss) continue;
        b.pousseeX = dx / d * REGLAGES.pousseeOnde;
        b.pousseeY = dy / d * REGLAGES.pousseeOnde;
        b.pousseeJusqua = partie.temps + REGLAGES.dureePoussee;
        b.etat = null;              /* la charge du herisson est annulee */
        b.angleImpose = null;
        b.immobile = false;
      }
      for(var k = tirs.length - 1; k >= 0; k--){
        if(Math.hypot(tirs[k].x - joueur.x, tirs[k].y - joueur.y) < REGLAGES.ondeNiveau){
          tirs.splice(k, 1);
        }
      }
      evenements.push({ type: "onde" });
    }

    function gagnerXp(n){
      partie.xp += n;
      partie.xpNiveau += n;
      while(partie.xpNiveau >= partie.xpProchain){
        partie.xpNiveau -= partie.xpProchain;
        partie.niveau++;
        partie.xpProchain = coutNiveau(partie.niveau);
        souffler();
        evenements.push({ type: "niveau", niveau: partie.niveau });
      }
    }

    /* ----------------------------------------------------------- la boucle */

    function pas(dt){
      evenements.length = 0;
      if(partie.fini) return evenements;
      partie.temps += dt;
      if(partie.temps >= partie.gelJusqua) partie.tempsActif += dt;
      /* le seau de la seconde en cours */
      var seau = Math.floor(partie.temps) % 60;
      if(seau !== seauCourant){ seauCourant = seau; seaux[seauCourant] = 0; }

      tournerLeTemps();
      vieDuSol(dt);
      semerLeFeu(dt);
      brulerDansLeFeu(dt);
      volerLesCrachats(dt);
      vivreLesFlaques(dt);
      vivreLesToiles(dt);
      tonnerre();
      peupler();
      poser();
      bougerJoueur(dt);

      for(var i = 0; i < bestioles.length; i++){
        if(bestioles[i].vivante) bouger(bestioles[i], dt);
      }
      bougerTirs(dt);
      brulures();
      contact();
      ramasser(dt);
      semerObjet();
      semerLegume();
      ramasserObjets();

      /* on retire les mortes apres coup, jamais pendant le parcours */
      for(var j = bestioles.length - 1; j >= 0; j--){
        if(!bestioles[j].vivante) bestioles.splice(j, 1);
      }

      /* ⚠️ A huit minutes, on ne gagne plus parce que le chronometre tombe a
         zero : c'etait un anticlimax. La reine arrive, et on gagne en la
         battant. C'etait la demande d'origine — « huit minutes qui finissent
         par un boss battable » — et elle avait attendu jusqu'ici. */
      if(partie.temps >= partie.duree && !partie.fini && !partie.boss && !partie.bossVaincu){
        invoquerBoss();
      }
      if(partie.boss && !partie.boss.vivante){
        partie.boss = null;
        partie.bossVaincu = true;
        partie.fini = true;
        partie.gagne = true;
        evenements.push({ type: "victoire" });
      }
      return evenements;
    }
  }

  return {
    REGLAGES: REGLAGES,
    LEGUMES: LEGUMES,
    SORTES: SORTES,
    ESPECES: ESPECES,
    MONDE_PAR_DEFAUT: MONDE_PAR_DEFAUT,
    coutNiveau: coutNiveau,
    creer: creer
  };
})();

/* utilisable des deux cotes : dans la page, et dans Node pour les controles */
if(typeof module !== "undefined" && module.exports) module.exports = Moteur;
if(typeof globalThis !== "undefined") globalThis.Moteur = Moteur;
