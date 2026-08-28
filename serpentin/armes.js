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

  var CATALOGUE = {
    epee: {
      nom: "Épée", emoji: "⚔️", dit: "Un grand moulinet devant toi",
      couleur: "#ffe57a", type: "moulinet",
      base: { degats: 2, recharge: 1.0, portee: 92, arc: 1.8, duree: 0.3 },
      parNiveau: { degats: 1, portee: 7, arc: 0.1, recharge: -0.05 }
    },
    bouclier: {
      nom: "Bouclier", emoji: "🛡️", dit: "Il tourne autour de toi",
      couleur: "#ffc94d", type: "orbite",
      base: { degats: 2, nombre: 1, rayon: 62, vitesse: 2.4, taille: 13, repos: 0.5 },
      parNiveau: { degats: 1, nombre: 0.5, rayon: 4, vitesse: 0.15 }
    },
    arc: {
      nom: "Arc", emoji: "🏹", dit: "Il vise la bestiole la plus proche",
      couleur: "#fff6d5", type: "fleche",
      base: { degats: 2, recharge: 0.9, vitesse: 420, portee: 340, taille: 6, perce: 1 },
      parNiveau: { degats: 1, recharge: -0.06, perce: 0.34 }
    }
  };

  var OBJETS = {
    bottes:    { nom: "Bottes", emoji: "👢",     dit: "Tu cours plus vite",        effet: "vitesse",  pas: 0.08 },
    gantelets: { nom: "Gantelets", emoji: "🧤",  dit: "Tes armes tapent plus fort", effet: "degats",  pas: 0.15 },
    longuevue: { nom: "Longue-vue", emoji: "🔭", dit: "Tes armes touchent plus loin", effet: "zone",  pas: 0.12 },
    sablier:   { nom: "Sablier", emoji: "⏳",    dit: "Tes armes vont plus vite",  effet: "recharge", pas: 0.10 },
    aimant:    { nom: "Pierre d'aimant", emoji: "🧲", dit: "Les graines viennent à toi", effet: "aimant", pas: 0.25 },
    heaume:    { nom: "Heaume", emoji: "⛑️",     dit: "Un cœur de plus",           effet: "coeur",    pas: 1 }
  };

  var MAX_OBJET_NIVEAU = 5;

  function valeur(def, cle, niveau){
    var b = def.base[cle];
    if(b === undefined) return 0;
    var p = def.parNiveau[cle] || 0;
    return b + p * (niveau - 1);
  }

  function creer(partie){
    var mesArmes = [];      /* { nom, def, niveau, prochainTir } */
    var mesObjets = [];     /* { nom, def, niveau } */
    var projectiles = [];
    var tampon = [];

    var moi = {
      armes: mesArmes,
      objets: mesObjets,
      projectiles: projectiles,
      donner: donner,
      donnerObjet: donnerObjet,
      propositions: propositions,
      appliquer: appliquer,
      multiplicateur: multiplicateur,
      pas: pas,
      dessiner: dessiner
    };
    return moi;

    /* ------------------------------------------------------- les objets */

    function multiplicateur(effet){
      var t = 1;
      for(var i = 0; i < mesObjets.length; i++){
        if(mesObjets[i].def.effet === effet) t += mesObjets[i].def.pas * mesObjets[i].niveau;
      }
      return t;
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

    function donnerObjet(nom){
      var o = trouver(mesObjets, nom);
      if(o){ if(o.niveau < MAX_OBJET_NIVEAU) o.niveau++; }
      else{
        if(mesObjets.length >= MAX_OBJETS) return null;
        o = { nom: nom, def: OBJETS[nom], niveau: 1 };
        mesObjets.push(o);
      }
      if(o.def.effet === "coeur"){
        partie.joueur.coeursMax = Moteur.REGLAGES.coeurs + coeursEnPlus();
        partie.joueur.coeurs++;
      }
      return o;
    }

    /* --------------------------------------------------- les trois cartes */

    function possibles(){
      var liste = [], nom;
      for(nom in CATALOGUE){
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
          zone = multiplicateur("zone"),
          recharge = multiplicateur("recharge");

      for(var i = 0; i < mesArmes.length; i++){
        var a = mesArmes[i], t = a.def.type;
        if(t === "orbite"){ orbite(a, dt, degats, zone); continue; }
        a.prochainTir -= dt * recharge;
        if(a.prochainTir > 0) continue;
        a.prochainTir = Math.max(0.15, valeur(a.def, "recharge", a.niveau));
        if(t === "moulinet") moulinet(a, degats, zone);
        else if(t === "fleche") fleche(a, degats, zone);
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
    function moulinet(a, degats, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var arc = valeur(a.def, "arc", a.niveau);
      var deg = valeur(a.def, "degats", a.niveau) * degats;
      var p = {
        forme: "arc", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: j.angle,
        portee: portee, arc: arc,
        vie: a.def.base.duree, duree: a.def.base.duree,
        touches: [],
        avance: function(p, dt){
          p.x = partie.joueur.x; p.y = partie.joueur.y;
          frapperSecteur(p, deg);
        }
      };
      projectiles.push(p);
      frapperSecteur(p, deg);
    }

    function frapperSecteur(p, deg){
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
        partie.blesser(b, deg);
      }
    }

    /* des boucliers qui tournent en permanence */
    function orbite(a, dt, degats, zone){
      a.tourne += valeur(a.def, "vitesse", a.niveau) * dt;
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var rayon = valeur(a.def, "rayon", a.niveau) * zone;
      var taille = a.def.base.taille;
      var deg = valeur(a.def, "degats", a.niveau) * degats;
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
        partie.voisines(g.x, g.y, taille + 24, tampon);
        for(var k = 0; k < tampon.length; k++){
          var b = tampon[k];
          if(!b.vivante) continue;
          var dx = b.x - g.x, dy = b.y - g.y, p = b.rayon + taille;
          if(dx * dx + dy * dy <= p * p){
            partie.blesser(b, deg);
            g.repos = a.def.base.repos;
            break;
          }
        }
      }
    }

    /* une fleche vers la bestiole la plus proche */
    function fleche(a, degats, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau);
      var cible = null, dm = portee * portee;
      partie.voisines(j.x, j.y, portee, tampon);
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante) continue;
        var dx = b.x - j.x, dy = b.y - j.y, d = dx * dx + dy * dy;
        if(d < dm){ dm = d; cible = b; }
      }
      var ang = cible ? Math.atan2(cible.y - j.y, cible.x - j.x) : j.angle;
      var deg = valeur(a.def, "degats", a.niveau) * degats;
      var perce = Math.max(1, Math.round(valeur(a.def, "perce", a.niveau)));
      var vitesse = a.def.base.vitesse;
      var taille = a.def.base.taille * zone;
      projectiles.push({
        forme: "fleche", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: ang, r: taille,
        vie: portee / vitesse, duree: portee / vitesse,
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
              partie.blesser(b, deg);
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
    CATALOGUE: CATALOGUE,
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
