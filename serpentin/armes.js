/* Les armes et les objets du chevalier.

   Regle de frontiere : ajouter une arme doit couter un objet dans CATALOGUE et
   rien d'autre. Ni moteur.js, ni index.html ne doivent savoir qu'une epee
   existe. C'est pour ca que le dessin de chaque forme est ici aussi.

   Les armes frappent seules : l'enfant ne les suit pas, elles ne mangent pas
   les trois objets qu'il peut suivre en meme temps. En revanche elles peuvent
   casser la lisibilite de la foule, d'ou deux regles tenues ici :
   - le chevalier et ses armes en clair et chaud, les bestioles en sombre
   - peu d'effets gros plutot que beaucoup de petits, et 40 projectiles au plus */

var Armes = (function(){
  "use strict";

  var MAX_ARMES = 4, MAX_OBJETS = 4, MAX_NIVEAU = 6, MAX_PROJECTILES = 40;

  /* ⚠️ DEUX PERSONNAGES, DEUX CATALOGUES. Le chevalier a des armes, le
     magicien a des sorts, et ce ne sont pas les memes gestes : le souffle
     remplace l'epee mais brule devant lui au lieu de trancher, la boule
     givree remplace le bouclier mais GELE au lieu de seulement frapper, et
     les piques remplacent les fleches mais sortent du sol.

     La regle de frontiere tient toujours : ajouter un sort coute un objet
     dans ce fichier, et rien d'autre. Le seul geste que le moteur a du
     apprendre est `partie.geler(bestiole, duree)`, exactement comme il savait
     deja `partie.blesser`. */
  var PERSOS = {
    chevalier: {
      nom: "Chevalier", emoji: "🛡️",
      dit: "Il frappe fort et de près",
      armes: ["epee", "bouclier", "arc"]
    },
    magicien: {
      nom: "Magicien", emoji: "🧙",
      dit: "Il gèle, il brûle, il fait sortir la terre",
      armes: ["souffle", "givre", "piques"]
    }
  };

  var CATALOGUE = {
    epee: {
      nom: "Épée", emoji: "⚔️", dit: "Un grand moulinet devant toi",
      couleur: "#ffe57a", type: "moulinet",
      base: { degats: 3, recharge: 0.9, portee: 96, arc: 2.7, duree: 0.3 },
      parNiveau: { degats: 1, portee: 7, arc: 0.1, recharge: -0.05 }
    },
    bouclier: {
      nom: "Bouclier", emoji: "🛡️", dit: "Il tourne autour de toi",
      couleur: "#ffc94d", type: "orbite",
      /* un bouclier de plus a chaque niveau : c'est ce qu'on attend en le
         montant, et ca se voit tout de suite */
      base: { degats: 2, nombre: 1, rayon: 66, vitesse: 2.7, taille: 15, repos: 0.35 },
      parNiveau: { degats: 1, nombre: 1, rayon: 4, vitesse: 0.15 }
    },
    arc: {
      nom: "Arc", emoji: "🏹", dit: "Il vise la bestiole la plus proche",
      couleur: "#fff6d5", type: "fleche",
      /* une fleche de plus a chaque niveau, et chacune sur une bestiole
         DIFFERENTE : trois fleches dans le meme escargot ne servent a rien */
      base: { degats: 2, recharge: 0.9, vitesse: 420, portee: 340, taille: 6,
              perce: 1, nombre: 1 },
      /* l'ordre compte : `resume` ne garde que les deux premiers */
      parNiveau: { degats: 1, nombre: 1, recharge: -0.06, perce: 0.34 }
    },

    /* ------------------------------------------------- les sorts du magicien

       Ils repondent un pour un aux armes du chevalier, mais aucun ne se joue
       pareil. Leurs chiffres ne sont pas devines : ils sont regles pour rendre
       les memes degats par seconde que l'arme qu'ils remplacent, mesure faite
       par tools/chevalier-sorts.mjs. */

    souffle: {
      nom: "Souffle", emoji: "🔥", dit: "Tu craches le feu devant toi",
      couleur: "#ff9f1c", type: "cone",
      /* plus large et plus long que l'epee, mais il faut rester tourne vers
         la bestiole : le feu ne coupe pas, il brule le temps qu'il dure */
      /* ⚠️ Regle sur la mesure, pas au jugé : a 2 de base il rendait 56 % de
         plus que l'epee au niveau 6. Sa vraie difference n'est pas la force,
         c'est la FORME — il porte plus loin (132 contre 96) mais son secteur
         est trois fois plus etroit (1,0 contre 2,7 radians). Long et fin
         contre court et large. */
      base: { degats: 3, recharge: 1.1, portee: 132, arc: 1.0, duree: 0.55 },
      parNiveau: { degats: 1, portee: 12, arc: 0.08, recharge: -0.06 }
    },

    givre: {
      nom: "Boule givrée", emoji: "❄️", dit: "Elle tourne et gèle ce qu'elle touche",
      couleur: "#9ad7ff", type: "orbite",
      /* ⚠️ Elle frappe MOINS fort que le bouclier, et c'est voulu : ce qu'elle
         apporte n'est pas des degats, c'est du temps. Une bestiole gelee ne
         pense plus, donc elle ne prepare plus sa charge. */
      /* elle frappe aussi fort que le bouclier mais REPREND SON SOUFFLE plus
         longtemps entre deux coups (0,55 s contre 0,35) : c'est ce delai qui
         paye le gel */
      base: { degats: 2, nombre: 1, rayon: 70, vitesse: 2.4, taille: 16,
              repos: 0.55, gele: 1.2 },
      parNiveau: { degats: 1, nombre: 1, rayon: 4, vitesse: 0.15, gele: 0.15 }
    },

    piques: {
      nom: "Piques de terre", emoji: "⛰️", dit: "La terre sort sous la bestiole",
      couleur: "#c08a4a", type: "piques",
      /* elles sortent SOUS la bestiole la plus proche, apres un preavis : on
         voit la terre trembler avant que ca pique, comme tout le reste */
      /* ⚠️ Deux points de degats par niveau, pas un : l'arc empile ses fleches
         sur la MEME bestiole quand il n'y en a qu'une, alors qu'une pique par
         bestiole ne sert a rien sur une cible seule. Mesure : a un seul
         ennemi, les piques rendaient 43 % de moins que l'arc au niveau 6. */
      base: { degats: 3, recharge: 1.5, portee: 300, taille: 34, nombre: 1,
              preavis: 0.5, duree: 0.45 },
      parNiveau: { degats: 2, nombre: 1, recharge: -0.09, taille: 2 }
    }
  };

  var OBJETS = {
    bottes:    { nom: "Bottes", emoji: "👢",     dit: "Tu cours plus vite",        effet: "vitesse",  pas: 0.08 },
    /* A plat, pas en pourcentage : les bestioles gagnent 1 point de vie
       toutes les deux minutes, donc +1 degat garde le coup fatal. En
       pourcentage, la carte ne changeait rien pendant les premieres minutes,
       ou tout meurt deja en un coup. */
    gantelets: { nom: "Gantelets", emoji: "🧤",  dit: "+1 dégât, et ça repousse", effet: "degats", plat: true, pas: 1, recul: 14 },
    longuevue: { nom: "Longue-vue", emoji: "🔭", dit: "Tes armes touchent plus loin", effet: "zone",  pas: 0.12 },
    sablier:   { nom: "Sablier", emoji: "⏳",    dit: "Tes armes vont plus vite",  effet: "recharge", pas: 0.10 },
    aimant:    { nom: "Pierre d'aimant", emoji: "🧲", dit: "Les graines viennent de plus loin", effet: "aimant", pas: 0.35 },
    heaume:    { nom: "Heaume", emoji: "⛑️",     dit: "Un cœur de plus, et tous remplis",           effet: "coeur",    pas: 1 }
  };

  var MAX_OBJET_NIVEAU = 5;

  /* Ce que le niveau suivant apporte, en clair. Genere depuis `parNiveau` et
     `pas` : ajouter une arme n'oblige a rien ecrire de plus, et le texte ne
     peut pas mentir sur les chiffres puisqu'il en sort. */
  var MOTS = {
    degats:   function(v){ return v > 0 ? "+" + arrondi(v) + " dégât" : ""; },
    /* l'ordre compte : les deux premieres retenues sont celles qu'on lit */
    portee:   function(v){ return v > 0 ? "+" + arrondi(v) + " de portée" : ""; },
    arc:      function(v){ return v > 0 ? "balaye plus large" : ""; },
    recharge: function(v){ return v < 0 ? "frappe plus souvent" : ""; },
    nombre:   function(v, def){
      if(v <= 0) return "";
      var quoi = def.type === "orbite" ? (def.base.gele ? "boule" : "bouclier")
               : (def.type === "fleche" ? "flèche"
               : (def.type === "piques" ? "pique" : ""));
      return "+" + arrondi(v) + (quoi ? " " + quoi : " de plus");
    },
    rayon:    function(v){ return v > 0 ? "tourne plus loin" : ""; },
    vitesse:  function(v){ return v > 0 ? "tourne plus vite" : ""; },
    perce:    function(v){ return v > 0 ? "traverse plus de bestioles" : ""; }
  };

  var MOTS_OBJETS = {
    vitesse:  "Tu cours plus vite",
    degats:   "+1 dégât à chacune de tes armes",
    zone:     "Tes armes touchent plus loin",
    recharge: "Tes armes frappent plus souvent",
    aimant:   "Les graines viennent de plus loin",
    coeur:    "+1 cœur, et tous remplis"
  };

  function arrondi(v){
    return Math.round(v * 100) / 100;
  }

  /* le texte d'une carte : ce que CE niveau change, pas ce que l'arme fait */
  function resume(choix){
    if(!choix) return "";
    if(choix.sorte === "objet"){
      return MOTS_OBJETS[choix.def.effet] || choix.def.dit;
    }
    if(choix.niveau <= 1) return choix.def.dit;
    var bouts = [];
    for(var cle in choix.def.parNiveau){
      var mot = MOTS[cle];
      if(!mot) continue;
      var texte = mot(choix.def.parNiveau[cle], choix.def);
      if(texte) bouts.push(texte);
    }
    /* deux choses au plus : a 8 ans, une carte se lit en deux secondes */
    return bouts.length ? bouts.slice(0, 2).join(", ") : choix.def.dit;
  }

  /* Le tableau d'un objet, niveau par niveau, en valeurs CONCRETES.
     « +12 % de zone » ne dit rien ; « la portee de l'epee passe de 96 a 107 »
     se comprend. Les valeurs de reference viennent du moteur et de l'epee,
     pas d'un chiffre recopie a la main. */
  function progressionObjet(nom){
    var o = OBJETS[nom], lignes = [];
    var R = (typeof Moteur !== "undefined" && Moteur.REGLAGES) || {};
    var epee = CATALOGUE.epee;
    var base = { vitesse: R.vitesse || 150, aimant: R.aimant || 95, coeurs: R.coeurs || 5 };
    for(var n = 1; n <= MAX_OBJET_NIVEAU; n++){
      var mult = 1 + (o.plat ? 0 : o.pas * n);
      var ligne = { niveau: n };
      if(o.effet === "vitesse"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de vitesse";
        ligne.concret = Math.round(base.vitesse * mult) + " unités par seconde, au lieu de " + base.vitesse;
      }else if(o.effet === "aimant"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de portée";
        ligne.concret = "les graines viennent de " + Math.round(base.aimant * mult) +
                        " unités, au lieu de " + base.aimant;
      }else if(o.effet === "degats"){
        /* pas « a plat » : le mot ne dit rien a qui ne code pas. On donne le
           nombre ajoute, et le resultat sur une arme connue. */
        var d = o.pas * n;
        ligne.effet = "+" + d + " dégât" + (d > 1 ? "s" : "") + " à chaque arme";
        ligne.concret = "l'épée fait " + (epee.base.degats + o.pas * n) +
                        " au lieu de " + epee.base.degats +
                        ", et le coup repousse à " + (10 + (o.recul || 0) * n) + " au lieu de 10";
      }else if(o.effet === "zone"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de portée";
        ligne.concret = "l'épée porte à " + Math.round(epee.base.portee * mult) +
                        ", au lieu de " + epee.base.portee;
      }else if(o.effet === "recharge"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de cadence";
        ligne.concret = "l'épée frappe toutes les " +
                        (Math.round(epee.base.recharge / mult * 100) / 100) +
                        " s, au lieu de " + epee.base.recharge;
      }else if(o.effet === "coeur"){
        ligne.effet = "+" + n + " cœur" + (n > 1 ? "s" : "");
        ligne.concret = (base.coeurs + n) + " cœurs au lieu de " + base.coeurs + ", et tous remplis";
      }
      lignes.push(ligne);
    }
    return lignes;
  }

  /* le tableau complet d'une arme, niveau par niveau, pour la documentation */
  function progression(nom){
    var def = CATALOGUE[nom], lignes = [];
    for(var n = 1; n <= MAX_NIVEAU; n++){
      var ligne = { niveau: n };
      for(var cle in def.base){
        var v = valeur(def, cle, n);
        /* `nombre` et `perce` sont arrondis a l'usage : le tableau doit
           montrer ce qui se passe vraiment, pas la valeur brute */
        if(cle === "nombre" || cle === "perce") v = Math.max(1, Math.round(v));
        ligne[cle] = arrondi(v);
      }
      lignes.push(ligne);
    }
    return lignes;
  }

  function valeur(def, cle, niveau){
    var b = def.base[cle];
    if(b === undefined) return 0;
    var p = def.parNiveau[cle] || 0;
    return b + p * (niveau - 1);
  }

  function creer(partie, perso){
    var monPerso = PERSOS[perso] ? perso : "chevalier";
    var mesArmes = [];      /* { nom, def, niveau, prochainTir } */
    var mesObjets = [];     /* { nom, def, niveau } */
    var projectiles = [];
    var tampon = [];

    var moi = {
      perso: monPerso,
      /* ⚠️ Ce que ce personnage peut apprendre. Sans ce filtre, les cartes de
         montee de niveau proposeraient une epee a un magicien. */
      catalogue: PERSOS[monPerso].armes,
      armes: mesArmes,
      objets: mesObjets,
      projectiles: projectiles,
      donner: donner,
      donnerObjet: donnerObjet,
      retrograder: retrograder,
      propositions: propositions,
      appliquer: appliquer,
      multiplicateur: multiplicateur,
      aPlat: aPlat,
      recul: recul,
      pas: pas,
      dessiner: dessiner
    };
    return moi;

    /* ------------------------------------------------------- les objets */

    function multiplicateur(effet){
      var t = 1;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.effet === effet && !o.def.plat) t += o.def.pas * o.niveau;
      }
      return t;
    }

    /* ce qui s'ajoute a plat, et non en pourcentage */
    function aPlat(effet){
      var t = 0;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.effet === effet && o.def.plat) t += o.def.pas * o.niveau;
      }
      return t;
    }

    /* la force du recul, qui monte avec les gantelets */
    function recul(){
      var t = 10;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.recul) t += o.def.recul * o.niveau;
      }
      return t;
    }

    /* Le moteur ne connait pas les objets du chevalier : on lui pose sur la
       table ce qui le concerne. Sans ca, l'aimant et les bottes ne font rien
       du tout, ce qui etait le cas. Pose des qu'un objet est donne, pas a
       l'image suivante : un objet doit agir tout de suite. */
    function poserLesBonus(){
      partie.bonus.aimant = multiplicateur("aimant");
      partie.bonus.vitesse = multiplicateur("vitesse");
    }

    function coeursEnPlus(){
      var n = 0;
      for(var i = 0; i < mesObjets.length; i++){
        if(mesObjets[i].def.effet === "coeur") n += mesObjets[i].niveau;
      }
      return n;
    }

    /* ------------------------------------------------- avoir et ameliorer */

    function trouver(liste, nom){
      for(var i = 0; i < liste.length; i++) if(liste[i].nom === nom) return liste[i];
      return null;
    }

    function donner(nom){
      var a = trouver(mesArmes, nom);
      if(a){ if(a.niveau < MAX_NIVEAU) a.niveau++; return a; }
      if(mesArmes.length >= MAX_ARMES) return null;
      a = { nom: nom, def: CATALOGUE[nom], niveau: 1, prochainTir: 0, tourne: 0 };
      mesArmes.push(a);
      return a;
    }

    /* ⚠️ Retrograder : l'acide de la limace fait perdre UN niveau. C'est le
       seul endroit du jeu ou l'on recule, donc il doit se voir : la fonction
       rend ce qu'elle a touche, et l'affichage s'en sert pour le montrer.

       Jamais en dessous du niveau 1, et jamais une arme retiree : perdre son
       arme d'un coup serait incomprehensible pour un enfant, et le laisserait
       sans rien pour se defendre. Si tout est deja au niveau 1, on retrograde
       un objet a la place ; si tout est au plus bas, il ne se passe rien, et
       c'est tres bien. */
    function retrograder(tirage){
      var au = function(n){ return Math.floor((tirage ? tirage() : Math.random()) * n); };
      var hauts = mesArmes.filter(function(a){ return a.niveau > 1; });
      if(hauts.length){
        var a = hauts[au(hauts.length)];
        a.niveau--;
        return { quoi: "arme", nom: a.nom, emoji: a.def.emoji,
                 titre: a.def.nom, niveau: a.niveau };
      }
      var objets = mesObjets.filter(function(o){ return o.niveau > 1; });
      if(objets.length){
        var o = objets[au(objets.length)];
        o.niveau--;
        poserLesBonus();
        return { quoi: "objet", nom: o.nom, emoji: o.def.emoji,
                 titre: o.def.nom, niveau: o.niveau };
      }
      return null;
    }

    function donnerObjet(nom){
      var o = trouver(mesObjets, nom);
      if(o){ if(o.niveau < MAX_OBJET_NIVEAU) o.niveau++; }
      else{
        if(mesObjets.length >= MAX_OBJETS) return null;
        o = { nom: nom, def: OBJETS[nom], niveau: 1 };
        mesObjets.push(o);
      }
      poserLesBonus();
      if(o.def.effet === "coeur"){
        partie.joueur.coeursMax = Moteur.REGLAGES.coeurs + coeursEnPlus();
        /* et TOUS les coeurs se remplissent. Un coeur de plus quand il t'en
           reste deux ne recompense rien : c'est le seul moment du jeu ou on
           repart entier, et ca doit se sentir. */
        partie.joueur.coeurs = partie.joueur.coeursMax;
        partie.joueur.invincibleJusqua = partie.temps + Moteur.REGLAGES.invincibilite;
      }
      return o;
    }

    /* --------------------------------------------------- les trois cartes */

    function possibles(){
      var liste = [], nom, n;
      /* ⚠️ Seulement ce que CE personnage peut apprendre : sans ce filtre, on
         proposerait une epee a un magicien. */
      for(n = 0; n < moi.catalogue.length; n++){
        nom = moi.catalogue[n];
        var a = trouver(mesArmes, nom);
        if(a){
          if(a.niveau < MAX_NIVEAU){
            liste.push({ sorte: "arme", nom: nom, def: CATALOGUE[nom], niveau: a.niveau + 1 });
          }
        }else if(mesArmes.length < MAX_ARMES){
          liste.push({ sorte: "arme", nom: nom, def: CATALOGUE[nom], niveau: 1 });
        }
      }
      for(nom in OBJETS){
        var o = trouver(mesObjets, nom);
        if(o){
          if(o.niveau < MAX_OBJET_NIVEAU){
            liste.push({ sorte: "objet", nom: nom, def: OBJETS[nom], niveau: o.niveau + 1 });
          }
        }else if(mesObjets.length < MAX_OBJETS){
          liste.push({ sorte: "objet", nom: nom, def: OBJETS[nom], niveau: 1 });
        }
      }
      return liste;
    }

    /* Trois cartes, jamais deux fois la meme, jamais une arme deja au maximum,
       jamais une cinquieme arme quand les quatre places sont prises. */
    function propositions(combien){
      var reste = possibles(), sortie = [];
      combien = combien || 3;
      while(sortie.length < combien && reste.length){
        var i = Math.floor(partie.alea() * reste.length);
        sortie.push(reste.splice(i, 1)[0]);
      }
      return sortie;
    }

    function appliquer(choix){
      if(!choix) return null;
      return choix.sorte === "arme" ? donner(choix.nom) : donnerObjet(choix.nom);
    }

    /* ----------------------------------------------------------- frapper */

    function pas(dt){
      var j = partie.joueur;
      if(partie.fini) return;

      var degats = multiplicateur("degats"),
          plus = aPlat("degats"),
          force = recul(),
          zone = multiplicateur("zone"),
          recharge = multiplicateur("recharge");

      poserLesBonus();

      for(var i = 0; i < mesArmes.length; i++){
        var a = mesArmes[i], t = a.def.type;
        if(t === "orbite"){ orbite(a, dt, degats, plus, force, zone); continue; }
        a.prochainTir -= dt * recharge;
        if(a.prochainTir > 0) continue;
        a.prochainTir = Math.max(0.15, valeur(a.def, "recharge", a.niveau));
        if(t === "moulinet") moulinet(a, degats, plus, force, zone);
        else if(t === "fleche") fleche(a, degats, plus, force, zone);
        else if(t === "cone") cone(a, degats, plus, force, zone);
        else if(t === "piques") piques(a, degats, plus, force, zone);
      }

      for(var k = projectiles.length - 1; k >= 0; k--){
        var p = projectiles[k];
        p.vie -= dt;
        if(p.avance) p.avance(p, dt);
        if(p.vie <= 0) projectiles.splice(k, 1);
      }
    }

    function place(){
      return projectiles.length < MAX_PROJECTILES;
    }

    /* un grand arc devant le chevalier, qui touche tout le secteur une fois */
    function moulinet(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var arc = valeur(a.def, "arc", a.niveau);
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var p = {
        forme: "arc", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: j.angle,
        portee: portee, arc: arc,
        vie: a.def.base.duree, duree: a.def.base.duree,
        touches: [],
        avance: function(p, dt){
          p.x = partie.joueur.x; p.y = partie.joueur.y;
          frapperSecteur(p, deg, force);
        }
      };
      projectiles.push(p);
      frapperSecteur(p, deg, force);
    }

    function frapperSecteur(p, deg, force){
      partie.voisines(p.x, p.y, p.portee + 30, tampon);
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante || p.touches.indexOf(b) >= 0) continue;
        var dx = b.x - p.x, dy = b.y - p.y;
        var d = Math.hypot(dx, dy);
        if(d > p.portee + b.rayon) continue;
        var ecart = Math.abs(((Math.atan2(dy, dx) - p.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if(ecart > p.arc / 2) continue;
        p.touches.push(b);
        partie.blesser(b, deg, { x: p.x, y: p.y, force: force });
      }
    }

    /* des boucliers qui tournent en permanence */
    function orbite(a, dt, degats, plus, force, zone){
      a.tourne += valeur(a.def, "vitesse", a.niveau) * dt;
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var rayon = valeur(a.def, "rayon", a.niveau) * zone;
      var taille = a.def.base.taille;
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var j = partie.joueur;
      a.gardes = a.gardes || [];
      while(a.gardes.length < combien) a.gardes.push({ repos: 0 });
      a.gardes.length = combien;
      for(var i = 0; i < combien; i++){
        var g = a.gardes[i];
        var ang = a.tourne + i * (Math.PI * 2 / combien);
        g.x = j.x + Math.cos(ang) * rayon;
        g.y = j.y + Math.sin(ang) * rayon;
        g.r = taille;
        g.couleur = a.def.couleur;
        g.repos -= dt;
        if(g.repos > 0) continue;
        /* il frappe TOUT ce qu'il touche, pas la premiere bestiole venue :
           entoure, un bouclier qui n'en tue qu'une ne sert a rien */
        partie.voisines(g.x, g.y, taille + 30, tampon);
        var aFrappe = false;
        for(var k = 0; k < tampon.length; k++){
          var b = tampon[k];
          if(!b.vivante) continue;
          var dx = b.x - g.x, dy = b.y - g.y, p = b.rayon + taille;
          if(dx * dx + dy * dy > p * p) continue;
          partie.blesser(b, deg, { x: g.x, y: g.y, force: force });
          /* ⚠️ Ce que la boule givree apporte n'est pas des degats, c'est du
             TEMPS : une bestiole gelee ne pense plus, donc elle ne prepare
             plus sa charge. Le gel monte avec le niveau. */
          if(a.def.base.gele) partie.geler(b, valeur(a.def, "gele", a.niveau));
          aFrappe = true;
        }
        if(aFrappe) g.repos = a.def.base.repos;
      }
    }

    /* Une fleche par niveau, chacune sur une bestiole differente. */
    /* ⚠️ LE SOUFFLE. Comme le moulinet, il balaie un secteur devant le
       personnage, mais il DURE : il brule tant qu'il souffle, et il frappe a
       chaque image ce qui entre dedans. Un coup d'epee touche une fois ; le
       feu touche tant qu'on reste devant. */
    function cone(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var arc = valeur(a.def, "arc", a.niveau);
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var p = {
        forme: "cone", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: j.angle,
        portee: portee, arc: arc,
        vie: a.def.base.duree, duree: a.def.base.duree,
        touches: [],
        avance: function(p, dt){
          /* il suit le personnage ET son regard : on choisit ce qu'on brule */
          p.x = partie.joueur.x; p.y = partie.joueur.y;
          p.angle = partie.joueur.angle;
          /* ⚠️ On oublie ce qu'on a deja touche a chaque image : sinon le feu
             ne brulerait qu'une fois, et ce serait un coup d'epee orange. */
          p.touches.length = 0;
          frapperSecteur(p, deg * dt * 2.2, force * 0.3);
        }
      };
      projectiles.push(p);
    }

    /* ⚠️ LES PIQUES DE TERRE. Elles sortent SOUS la bestiole, apres un preavis
       pendant lequel la terre tremble : c'est la regle de tout le jeu, rien ne
       frappe sans prevenir. Une pique par bestiole differente, comme les
       fleches : trois piques dans le meme escargot ne servent a rien. */
    function piques(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var taille = valeur(a.def, "taille", a.niveau) * zone;
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      partie.voisines(j.x, j.y, portee, tampon);
      var cibles = [];
      for(var i = 0; i < tampon.length && cibles.length < combien; i++){
        var b = tampon[i];
        if(!b.vivante || partie.temps < b.arrivee) continue;
        var dx = b.x - j.x, dy = b.y - j.y;
        if(dx * dx + dy * dy > portee * portee) continue;
        cibles.push(b);
      }
      for(var k = 0; k < cibles.length; k++){
        if(!place()) return;
        projectiles.push({
          forme: "pique", couleur: a.def.couleur,
          x: cibles[k].x, y: cibles[k].y, r: taille,
          vie: a.def.base.preavis + a.def.base.duree,
          duree: a.def.base.preavis + a.def.base.duree,
          preavis: a.def.base.preavis,
          degats: deg, force: force, frappe: false,
          avance: function(p, dt){
            if(p.frappe) return;
            /* elle sort quand le preavis est passe, et frappe UNE fois */
            if(p.vie > p.duree - p.preavis) return;
            p.frappe = true;
            partie.voisines(p.x, p.y, p.r + 40, tampon);
            for(var m = 0; m < tampon.length; m++){
              var c = tampon[m];
              if(!c.vivante) continue;
              var ex = c.x - p.x, ey = c.y - p.y, q = c.rayon + p.r;
              if(ex * ex + ey * ey > q * q) continue;
              partie.blesser(c, p.degats, { x: p.x, y: p.y, force: p.force });
            }
          }
        });
      }
    }

    function fleche(a, degats, plus, force, zone){
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau);
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var perce = Math.max(1, Math.round(valeur(a.def, "perce", a.niveau)));
      var vitesse = a.def.base.vitesse;
      var taille = a.def.base.taille * zone;

      /* les `combien` plus proches, sans doublon */
      partie.voisines(j.x, j.y, portee, tampon);
      var vues = [];
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante) continue;
        var dx = b.x - j.x, dy = b.y - j.y, d = dx * dx + dy * dy;
        if(d > portee * portee) continue;
        vues.push({ b: b, d: d });
      }
      vues.sort(function(x, y){ return x.d - y.d; });

      var tirs = Math.min(combien, Math.max(1, vues.length));
      for(var k = 0; k < tirs; k++){
        if(!place()) return;
        var cible = vues[k] ? vues[k].b : null;
        var ang = cible ? Math.atan2(cible.y - j.y, cible.x - j.x)
                        : j.angle + (k - tirs / 2) * 0.25;
        lancerFleche(j, ang, deg, perce, vitesse, taille, a.def.couleur, force);
      }
    }

    function lancerFleche(j, ang, deg, perce, vitesse, taille, couleur, force){
      projectiles.push({
        forme: "fleche", couleur: couleur,
        x: j.x, y: j.y, angle: ang, r: taille,
        vie: 340 / vitesse, duree: 340 / vitesse,
        touches: [],
        avance: function(p, dt){
          p.x += Math.cos(p.angle) * vitesse * dt;
          p.y += Math.sin(p.angle) * vitesse * dt;
          partie.voisines(p.x, p.y, taille + 24, tampon);
          for(var i = 0; i < tampon.length; i++){
            var b = tampon[i];
            if(!b.vivante || p.touches.indexOf(b) >= 0) continue;
            var dx = b.x - p.x, dy = b.y - p.y, q = b.rayon + taille;
            if(dx * dx + dy * dy <= q * q){
              p.touches.push(b);
              partie.blesser(b, deg, { x: p.x, y: p.y, force: force });
              if(p.touches.length >= perce) p.vie = 0;
            }
          }
        }
      });
    }

    /* ---------------------------------------------------------- le dessin */

    function dessiner(ctx){
      var i, k;
      for(i = 0; i < projectiles.length; i++){
        var p = projectiles[i];
        if(p.forme === "arc"){
          ctx.globalAlpha = Math.max(0, p.vie / p.duree) * .85;
          ctx.fillStyle = p.couleur;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, p.portee, p.angle - p.arc / 2, p.angle + p.arc / 2);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }else if(p.forme === "cone"){
          /* trois langues de feu emboitees, de la plus large a la plus claire */
          /* ⚠️ Assez OPAQUE pour rester du feu : a 30 % sur de l'herbe verte,
             l'orange virait a l'olive et on ne lisait plus une flamme. */
          var part = Math.max(0, p.vie / p.duree);
          var teintes = ["#d9330c", "#ff7a18", "#ffe066"];
          for(k = 0; k < 3; k++){
            ctx.globalAlpha = (.62 + k * .12) * (0.45 + 0.55 * part);
            ctx.fillStyle = teintes[k];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, p.portee * (1 - k * 0.26),
                    p.angle - p.arc / 2 * (1 - k * 0.18),
                    p.angle + p.arc / 2 * (1 - k * 0.18));
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }else if(p.forme === "pique"){
          var reste = p.duree - p.vie;
          if(reste < p.preavis){
            /* le preavis : la terre tremble et se fendille */
            var pr = reste / p.preavis;
            ctx.globalAlpha = .35 + .35 * pr;
            ctx.strokeStyle = "#6b4a22";
            ctx.lineWidth = 3;
            for(k = 0; k < 5; k++){
              var ak = k * 1.257 + p.x * 0.01;
              ctx.beginPath();
              ctx.moveTo(p.x + Math.cos(ak) * p.r * .2, p.y + Math.sin(ak) * p.r * .12);
              ctx.lineTo(p.x + Math.cos(ak) * p.r * pr, p.y + Math.sin(ak) * p.r * .6 * pr);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }else{
            /* les pointes sorties */
            var sortie = Math.min(1, (reste - p.preavis) / 0.12);
            ctx.fillStyle = "rgba(0,0,0,.2)";
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 4, p.r, p.r * .45, 0, 0, 6.2832);
            ctx.fill();
            for(k = 0; k < 6; k++){
              var a2 = k * 1.047 + 0.3;
              var dx2 = Math.cos(a2) * p.r * .55, dy2 = Math.sin(a2) * p.r * .32;
              var h = p.r * (0.7 + 0.3 * Math.sin(k * 2.1)) * sortie;
              ctx.fillStyle = k % 2 ? "#c08a4a" : "#9c6a33";
              ctx.beginPath();
              ctx.moveTo(p.x + dx2 - p.r * .16, p.y + dy2);
              ctx.lineTo(p.x + dx2 + p.r * .16, p.y + dy2);
              ctx.lineTo(p.x + dx2, p.y + dy2 - h);
              ctx.closePath();
              ctx.fill();
            }
          }
        }else if(p.forme === "fleche"){
          ctx.fillStyle = p.couleur;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.r * 2.4, -p.r * .5, p.r * 4.8, p.r);
          ctx.beginPath();
          ctx.moveTo(p.r * 2.6, 0);
          ctx.lineTo(p.r * 1.1, -p.r * 1.3);
          ctx.lineTo(p.r * 1.1, p.r * 1.3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      for(i = 0; i < mesArmes.length; i++){
        var a = mesArmes[i];
        if(!a.gardes) continue;
        for(k = 0; k < a.gardes.length; k++){
          var g = a.gardes[k];
          if(g.x === undefined) continue;
          ctx.fillStyle = "rgba(0,0,0,.2)";
          ctx.beginPath(); ctx.arc(g.x, g.y + 2, g.r, 0, 6.2832); ctx.fill();
          ctx.fillStyle = g.couleur;
          ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.2832); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.55)";
          ctx.beginPath(); ctx.arc(g.x - g.r * .3, g.y - g.r * .3, g.r * .38, 0, 6.2832); ctx.fill();
        }
      }
    }
  }

  return {
    resume: resume,
    progression: progression,
    progressionObjet: progressionObjet,
    CATALOGUE: CATALOGUE,
    PERSOS: PERSOS,
    OBJETS: OBJETS,
    MAX_ARMES: MAX_ARMES,
    MAX_OBJETS: MAX_OBJETS,
    MAX_NIVEAU: MAX_NIVEAU,
    MAX_OBJET_NIVEAU: MAX_OBJET_NIVEAU,
    MAX_PROJECTILES: MAX_PROJECTILES,
    creer: creer
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Armes;
if(typeof globalThis !== "undefined") globalThis.Armes = Armes;
