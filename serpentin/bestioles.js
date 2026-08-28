/* Les bestioles.

   Regle de frontiere : ajouter une bestiole doit couter un objet ici, et rien
   d'autre. Ses chiffres et son dessin sont au meme endroit.

   `individu: true` veut dire qu'elle demande d'etre suivie une par une. A
   8 ans on suit trois objets en mouvement, pas plus : le moteur n'en laisse
   donc jamais plus de trois vivantes en meme temps. Tout le reste est de la
   foule, et une foule se lit comme une texture, pas comme des individus.

   Couleurs : sombre et froid, toujours. Le chevalier et ses armes sont clairs
   et chauds. C'est ce qui garde la foule lisible quand l'ecran se remplit.

   ⚠️ Cette regle vaut aussi pour ce qu'elles LANCENT. Un projectile clair sur
   de l'herbe claire tue sans qu'on le voie venir, et c'est exactement ce qui
   est arrive. Un essai mesure l'ecart de luminance avec le sol. */

var Bestioles = (function(){
  "use strict";

  function corps(ctx, b, couleur, r){
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath(); ctx.arc(b.x, b.y + r * .35, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = couleur;
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
  }

  function yeux(ctx, b, r){
    var a = b.angle, e1 = a + 0.7, e2 = a - 0.7, d = r * .55, t = r * .26;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(b.x + Math.cos(e1) * d, b.y + Math.sin(e1) * d, t, 0, 6.2832);
    ctx.arc(b.x + Math.cos(e2) * d, b.y + Math.sin(e2) * d, t, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = "#11131f";
    ctx.beginPath();
    ctx.arc(b.x + Math.cos(e1) * d * 1.2, b.y + Math.sin(e1) * d * 1.2, t * .5, 0, 6.2832);
    ctx.arc(b.x + Math.cos(e2) * d * 1.2, b.y + Math.sin(e2) * d * 1.2, t * .5, 0, 6.2832);
    ctx.fill();
  }

  /* Le preavis : une bestiole ne frappe jamais sans prevenir. A 8 ans on
     reagit deux a trois fois plus lentement qu'un adulte, donc tout ce qui
     fait mal s'annonce au moins une seconde avant. */
  var PREAVIS = 1;

  /* ⚠️ TEMPORAIRE : toutes les bestioles arrivent des la premiere seconde,
     pour pouvoir les essayer sans jouer trois minutes. A remettre a `false`
     une fois le crapaud et le pissenlit juges.
     Les heures d'arrivee vraies restent ecrites dans chaque espece, et
     `reglerEssai` fait l'aller retour : les outils de mesure ont besoin de la
     vraie courbe, pas de celle de l'essai. */
  var ESSAI = true;

  function halo(ctx, b, couleur, r, force){
    ctx.globalAlpha = force;
    ctx.fillStyle = couleur;
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
  }

  var ESPECES = {
    escargot: {
      nom: "escargot",
      vie: 1, vitesse: 62, rayon: 11, xp: 1, individu: false, arrive: 0,
      couleur: "#33455e",
      dessiner: function(ctx, b){
        var r = b.rayon;
        corps(ctx, b, this.couleur, r);
        ctx.strokeStyle = "#93b4dd";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for(var i = 0; i < 22; i++){
          var a = i * .55, rr = r * .82 * (1 - i / 26);
          var x = b.x + Math.cos(a) * rr, y = b.y + Math.sin(a) * rr;
          if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        yeux(ctx, b, r);
      }
    },

    abeille: {
      nom: "abeille",
      vie: 1, vitesse: 108, rayon: 9, xp: 2, individu: false, arrive: 35,
      couleur: "#1c1a12",
      raie: "#ffd166",
      onde: { amplitude: 1.1, vitesse: 5 },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var bat = Math.abs(Math.sin(t * 22 + b.phase)) * .6 + .4;
        ctx.fillStyle = "rgba(235,245,255,.62)";
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.beginPath(); ctx.ellipse(-r * .2, -r * 1.1, r * .9, r * .5 * bat, -0.5, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-r * .2,  r * 1.1, r * .9, r * .5 * bat,  0.5, 0, 6.2832); ctx.fill();
        ctx.restore();
        corps(ctx, b, this.couleur, r);
        ctx.strokeStyle = this.raie;
        ctx.lineWidth = 3.2;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        for(var i = -1; i <= 1; i++){
          ctx.beginPath();
          ctx.moveTo(i * r * .45, -r * .8);
          ctx.lineTo(i * r * .45,  r * .8);
          ctx.stroke();
        }
        ctx.restore();
        yeux(ctx, b, r);
      }
    },

    /* Il fonce en ligne droite et ne corrige jamais : ca s'esquive. Mais il
       se met en boule et s'arrete une seconde avant de partir. */
    herisson: {
      nom: "herisson",
      /* Six points de vie, et une vitesse de 112 et pas 60 : a 60 il ne
         rattrapait JAMAIS un chevalier qui marche a 150, donc il ne se
         preparait jamais et sa charge n'existait pas. Mesure : 0 contact en
         quatre minutes de vraie partie. */
      vie: 6, vitesse: 96, rayon: 14, xp: 5, individu: true, arrive: 70,
      couleur: "#5a3a22",
      /* En boule, il encaisse : sinon il meurt pendant son preavis et sa
         charge n'arrive jamais. Mesure : contre un arc, zero charge en trente
         secondes, il mourait a 259 unites. */
      armure: function(b){
        return (b.etat === "prepare" || b.etat === "charge") ? 0.35 : 1;
      },
      penser: function(b, c){
        if(!b.etat) b.etat = "approche";
        b.vitesseFacteur = 1;
        if(b.etat === "approche"){
          b.immobile = false; b.angleImpose = null;
          /* Il se prepare de PRES : a 320 unites, sa ruee de 240 le laissait
             a 80 du chevalier, juste dans la portee des armes, immobile, et
             il y mourait sans jamais toucher. */
          if(c.distance < 210){ b.etat = "prepare"; b.jusqua = c.temps + PREAVIS; }
        }else if(b.etat === "prepare"){
          b.immobile = true;
          if(c.temps >= b.jusqua){
            b.etat = "charge";
            b.jusqua = c.temps + 1.3;      /* de quoi traverser, pas s'arreter devant */
            b.angleImpose = c.angleVersJoueur;
          }
        }else if(b.etat === "charge"){
          b.immobile = false;
          b.vitesseFacteur = 2.4;
          if(c.temps >= b.jusqua){ b.etat = "souffle"; b.jusqua = c.temps + 0.5; b.angleImpose = null; }
        }else{
          b.immobile = true;
          if(c.temps >= b.jusqua) b.etat = "approche";
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var boule = b.etat === "prepare";
        if(boule) halo(ctx, b, "#ff7a5c", r * (1.9 + .5 * Math.sin(t * 14)), .45);
        corps(ctx, b, this.couleur, r);
        /* les piquants, herisses quand il se prepare */
        ctx.strokeStyle = "#33200f";
        ctx.lineWidth = 3.4;
        ctx.lineCap = "round";
        var n = 10, long = boule ? r * 1.05 : r * .7;
        for(var i = 0; i < n; i++){
          var a = b.angle + i * (6.2832 / n);
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r * .55, b.y + Math.sin(a) * r * .55);
          ctx.lineTo(b.x + Math.cos(a) * (r * .55 + long), b.y + Math.sin(a) * (r * .55 + long));
          ctx.stroke();
        }
        if(!boule) yeux(ctx, b, r);
      }
    },

    /* Il ne bouge pas et crache. Il gonfle une seconde avant de tirer. */
    crapaud: {
      nom: "crapaud",
      vie: 6, vitesse: 0, rayon: 16, xp: 6, individu: true, arrive: 115,
      couleur: "#5e2a7a",
      penser: function(b, c){
        b.immobile = true;
        if(b.prochain === undefined) b.prochain = c.temps + 2;
        b.etat = (c.temps >= b.prochain - PREAVIS) ? "gonfle" : "calme";
        if(c.temps >= b.prochain){
          /* ⚠️ Sombre et froide, comme tout ce qui peut tuer. Elle etait vert
             clair : ecart de luminance de 22 avec l'herbe, quand chaque
             bestiole en a plus de 100. Elle etait la, on ne la voyait pas. */
          c.tirer(c.angleVersJoueur, 150, 10, 5, "#3b1550");
          b.prochain = c.temps + 2.8;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        var k = gonfle ? 1 + .16 * Math.sin(t * 12) : 1;
        if(gonfle) halo(ctx, b, "#c78bff", r * 2.1, .34);
        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath(); ctx.ellipse(b.x, b.y + r * .5, r * 1.05, r * .5, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = this.couleur;
        ctx.beginPath(); ctx.ellipse(b.x, b.y, r * 1.15 * k, r * .92 * k, 0, 0, 6.2832); ctx.fill();
        /* la gorge, qui enfle */
        ctx.fillStyle = gonfle ? "#c78bff" : "#6b3f96";
        ctx.beginPath(); ctx.ellipse(b.x, b.y + r * .3, r * .55 * k, r * .38 * k, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.x - r * .45, b.y - r * .55, r * .3, 0, 6.2832);
        ctx.arc(b.x + r * .45, b.y - r * .55, r * .3, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#11131f";
        ctx.beginPath();
        ctx.arc(b.x - r * .45, b.y - r * .55, r * .15, 0, 6.2832);
        ctx.arc(b.x + r * .45, b.y - r * .55, r * .15, 0, 6.2832);
        ctx.fill();
      }
    },

    /* Il s'approche et il enfle. Une seconde plus tard il eclate. */
    pissenlit: {
      nom: "pissenlit",
      vie: 3, vitesse: 78, rayon: 13, xp: 5, individu: true, arrive: 160,
      couleur: "#5b5470",
      penser: function(b, c){
        if(b.etat === "gonfle"){
          b.immobile = true;
          if(c.temps >= b.jusqua) c.exploser(130);
          return;
        }
        b.immobile = false;
        if(c.distance < 120){ b.etat = "gonfle"; b.jusqua = c.temps + PREAVIS; }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        var k = gonfle ? 1 + .55 * Math.sin(t * 16) * Math.sin(t * 16) : 1;
        if(gonfle) halo(ctx, b, "#ffd166", r * 3.2, .3);
        ctx.fillStyle = "rgba(0,0,0,.2)";
        ctx.beginPath(); ctx.arc(b.x, b.y + r * .4, r * .9, 0, 6.2832); ctx.fill();
        /* l'aigrette : des filaments tout autour */
        ctx.strokeStyle = "#dfe3f0";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        for(var i = 0; i < 14; i++){
          var a = i * (6.2832 / 14) + b.phase;
          ctx.beginPath();
          ctx.moveTo(b.x + Math.cos(a) * r * .4, b.y + Math.sin(a) * r * .4);
          ctx.lineTo(b.x + Math.cos(a) * r * 1.25 * k, b.y + Math.sin(a) * r * 1.25 * k);
          ctx.stroke();
        }
        ctx.fillStyle = this.couleur;
        ctx.beginPath(); ctx.arc(b.x, b.y, r * .55 * k, 0, 6.2832); ctx.fill();
        yeux(ctx, b, r * .7);
      }
    }
  };

  /* on garde l'heure vraie de chaque arrivee, pour pouvoir y revenir */
  for(var n in ESPECES) ESPECES[n].arriveVraie = ESPECES[n].arrive;

  function reglerEssai(actif){
    for(var m in ESPECES){
      ESPECES[m].arrive = actif ? 0 : ESPECES[m].arriveVraie;
    }
    return actif;
  }

  reglerEssai(ESSAI);

  return { ESPECES: ESPECES, reglerEssai: reglerEssai, ESSAI: ESSAI };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Bestioles;
if(typeof globalThis !== "undefined") globalThis.Bestioles = Bestioles;
