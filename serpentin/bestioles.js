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
  var ESSAI = false;

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
      dessiner: function(ctx, b, t){
        /* ⚠️ « On ne sait pas vraiment ce que c'est. » C'etait une bille avec
           une spirale peinte dessus : ni corps, ni antennes, rien qui depasse.
           Ce qui fait lire un escargot, ce sont trois choses — un CORPS qui
           sort devant la coquille, deux ANTENNES a boules, et la BAVE derriere.
           Mockup compare a quatre pistes avant de choisir celle-ci. */
        var r = b.rayon;

        /* la bave, derriere : elle se voit avant le reste, de loin */
        ctx.fillStyle = "rgba(226,255,242,.45)";
        for(var v = 0; v < 3; v++){
          var dv = r * (1.7 + v * .72);
          ctx.beginPath();
          ctx.ellipse(b.x - Math.cos(b.angle) * dv, b.y - Math.sin(b.angle) * dv,
                      r * .28, r * (.19 - v * .04), b.angle, 0, 6.2832);
          ctx.fill();
        }

        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .45, r * 1.2, r * .4, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* le pied, qui depasse devant et derriere la coquille */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(r * .1, r * .16, r * 1.2, r * .48, 0, 0, 6.2832);
        ctx.fill();
        /* la tete, relevee */
        ctx.beginPath();
        ctx.arc(r * .98, -r * .06, r * .4, 0, 6.2832);
        ctx.fill();

        /* la coquille, en spirale nette et bien ronde */
        ctx.fillStyle = "#24344a";
        ctx.beginPath();
        ctx.arc(-r * .28, -r * .2, r * .8, 0, 6.2832);
        ctx.fill();
        ctx.strokeStyle = "#93a9c9";
        ctx.lineWidth = Math.max(1.6, r * .15);
        ctx.lineCap = "round";
        ctx.beginPath();
        for(var i = 0; i < 26; i++){
          var a = i * .34, rr = r * .1 + i * r * .025;
          var px = -r * .28 + Math.cos(a) * rr, py = -r * .2 + Math.sin(a) * rr;
          if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        /* les deux antennes, avec leur boule au bout : c'est ce qui manquait */
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = Math.max(1.6, r * .15);
        for(var c = -1; c <= 1; c += 2){
          var bouge = Math.sin(t * 2.4 + (c > 0 ? 0 : 1.3)) * r * .08;
          ctx.beginPath();
          ctx.moveTo(r * 1.02, c * r * .1);
          ctx.quadraticCurveTo(r * 1.5, c * r * .5, r * 1.62, c * r * .82 + bouge);
          ctx.stroke();
          ctx.fillStyle = "#11131f";
          ctx.beginPath();
          ctx.arc(r * 1.62, c * r * .82 + bouge, r * .15, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = this.couleur;
        }
        ctx.restore();

        yeux(ctx, { x: b.x + Math.cos(b.angle) * r * .95,
                    y: b.y + Math.sin(b.angle) * r * .95,
                    angle: b.angle }, r * .62);
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
        /* ⚠️ « On dirait un oursin. » C'etait une boule marron avec douze
           piquants droits plantes tout autour, dans toutes les directions. Un
           herisson, ce n'est pas ca : c'est un MUSEAU CLAIR devant, un dos
           couvert de piquants COUCHES vers l'arriere, et des pattes.
           Mockup compare a quatre pistes avant de choisir.

           Il garde ses deux etats : en marche il montre son museau, en boule il
           n'a plus que ses piquants, dresses et serres. */
        var r = b.rayon;
        var boule = b.etat === "prepare" || b.etat === "charge";
        if(b.etat === "prepare") halo(ctx, b, "#ff7a5c", r * (1.9 + .5 * Math.sin(t * 14)), .45);

        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .5, r * 1.1, r * .4, 0, 0, 6.2832);
        ctx.fill();

        if(boule){
          /* enroule : plus de museau, plus de pattes, des piquants dresses */
          ctx.strokeStyle = "#2e1c0e";
          ctx.lineWidth = Math.max(2, r * .15);
          ctx.lineCap = "round";
          for(var i = 0; i < 22; i++){
            var a = b.angle + i * .2856;
            var lg = 1.15 + (i % 3) * .12;
            ctx.beginPath();
            ctx.moveTo(b.x + Math.cos(a) * r * .78, b.y + Math.sin(a) * r * .78);
            ctx.lineTo(b.x + Math.cos(a) * r * lg, b.y + Math.sin(a) * r * lg);
            ctx.stroke();
          }
          ctx.fillStyle = this.couleur;
          ctx.beginPath(); ctx.arc(b.x, b.y, r * .88, 0, 6.2832); ctx.fill();
          ctx.strokeStyle = "#3a2412";
          ctx.lineWidth = Math.max(1.5, r * .09);
          for(var k = 0; k < 3; k++){
            ctx.beginPath();
            ctx.arc(b.x - Math.cos(b.angle) * r * .12, b.y - Math.sin(b.angle) * r * .12,
                    r * (.3 + k * .22), b.angle - 1.9, b.angle + 1.1);
            ctx.stroke();
          }
          return;
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* les pattes, courtes, sous le corps */
        ctx.strokeStyle = "#3a2412";
        ctx.lineWidth = Math.max(2, r * .16);
        ctx.lineCap = "round";
        for(var q = 0; q < 2; q++){
          var px = -r * .5 + q * r * .7;
          var bouge = Math.sin(t * 6 + q * 2.1) * r * .08;
          ctx.beginPath();
          ctx.moveTo(px, r * .55);
          ctx.lineTo(px - r * .12, r * .95 + bouge);
          ctx.stroke();
        }

        /* le museau clair, devant : c'est lui qui dit « herisson » */
        ctx.fillStyle = "#8a6240";
        ctx.beginPath();
        ctx.ellipse(r * .82, r * .12, r * .48, r * .34, -.15, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#1a1008";
        ctx.beginPath(); ctx.arc(r * 1.22, r * .16, r * .13, 0, 6.2832); ctx.fill();

        /* le dos */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(-r * .12, -r * .05, r * .92, r * .78, 0, 0, 6.2832);
        ctx.fill();

        /* ⚠️ Les piquants COUCHES vers l'arriere, avec la pointe CLAIRE : la
           nuit, tout devient sombre, et un piquant entierement noir sur un dos
           noir ne se lit plus. */
        for(var m = 0; m < 14; m++){
          var an = 1.1 + m * .32;
          var bx = -r * .12 + Math.cos(an) * r * .55;
          var by = -r * .05 + Math.sin(an) * r * .48;
          ctx.strokeStyle = "#2e1c0e";
          ctx.lineWidth = Math.max(1.6, r * .14);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - r * .42, by - r * .18);
          ctx.stroke();
          ctx.strokeStyle = "#c9a678";
          ctx.lineWidth = Math.max(1, r * .09);
          ctx.beginPath();
          ctx.moveTo(bx - r * .28, by - r * .12);
          ctx.lineTo(bx - r * .44, by - r * .19);
          ctx.stroke();
        }

        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(r * .55, -r * .18, r * .17, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "#11131f";
        ctx.beginPath(); ctx.arc(r * .6, -r * .18, r * .09, 0, 6.2832); ctx.fill();
        ctx.restore();
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
        /* ⚠️ « Ils font pale figure. » C'etait une bosse violette avec deux
           yeux poses dessus. Un crapaud, c'est ASSIS : deux pattes avant au
           sol, deux cuisses repliees derriere, et des yeux a fleur de tete.
           Mockup compare a quatre pistes avant de choisir.

           ⚠️ Il ne tourne PAS avec son angle. Il est vu de face, et une vue de
           face qui pivote donne une bete couchee sur le cote. Il est immobile
           de toute facon : ce qui dit ou il vise, c'est sa bulle. */
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        var enfle = gonfle ? 1 + .1 * Math.sin(t * 16) : 1;
        if(gonfle) halo(ctx, b, "#c78bff", r * 2.1, .34);

        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .55, r * 1.2, r * .42, 0, 0, 6.2832);
        ctx.fill();

        /* les cuisses repliees, derriere */
        ctx.fillStyle = "#4a1f63";
        for(var c = -1; c <= 1; c += 2){
          ctx.beginPath();
          ctx.ellipse(b.x + c * r * .82, b.y + r * .18, r * .42, r * .58,
                      c * .5, 0, 6.2832);
          ctx.fill();
        }

        /* le corps */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, r * 1.02, r * .82, 0, 0, 6.2832);
        ctx.fill();

        if(gonfle){
          /* la gorge deborde sous le menton : le preavis d'une seconde */
          ctx.fillStyle = "#c78bff";
          ctx.beginPath();
          ctx.ellipse(b.x, b.y + r * .42, r * .72 * enfle, r * .58 * enfle, 0, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.beginPath();
          ctx.ellipse(b.x - r * .22, b.y + r * .3, r * .2, r * .13, -.4, 0, 6.2832);
          ctx.fill();
        }else{
          ctx.fillStyle = "#7a3f9e";
          ctx.beginPath();
          ctx.ellipse(b.x, b.y + r * .34, r * .68, r * .42, 0, 0, 6.2832);
          ctx.fill();
        }

        /* les pattes avant, posees au sol */
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = Math.max(2, r * .17);
        ctx.lineCap = "round";
        for(var d = -1; d <= 1; d += 2){
          var ecart = gonfle ? .72 : .52;
          ctx.beginPath();
          ctx.moveTo(b.x + d * r * (ecart - .12), b.y + r * .5);
          ctx.lineTo(b.x + d * r * ecart, b.y + r * .95);
          ctx.stroke();
          if(!gonfle){
            ctx.fillStyle = this.couleur;
            for(var o = -1; o <= 1; o++){
              ctx.beginPath();
              ctx.ellipse(b.x + d * r * ecart + o * r * .13, b.y + r * 1.02,
                          r * .09, r * .06, 0, 0, 6.2832);
              ctx.fill();
            }
          }
        }

        /* les yeux, en boules posees sur le crane */
        ctx.fillStyle = "#8b4fb0";
        ctx.beginPath();
        ctx.arc(b.x - r * .42, b.y - r * .62, r * (gonfle ? .34 : .32), 0, 6.2832);
        ctx.arc(b.x + r * .42, b.y - r * .62, r * (gonfle ? .34 : .32), 0, 6.2832);
        ctx.fill();
        if(gonfle){
          /* il plisse les yeux : il pousse */
          ctx.fillStyle = "#11131f";
          ctx.beginPath();
          ctx.ellipse(b.x - r * .42, b.y - r * .62, r * .22, r * .09, 0, 0, 6.2832);
          ctx.ellipse(b.x + r * .42, b.y - r * .62, r * .22, r * .09, 0, 0, 6.2832);
          ctx.fill();
        }else{
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(b.x - r * .42, b.y - r * .66, r * .2, 0, 6.2832);
          ctx.arc(b.x + r * .42, b.y - r * .66, r * .2, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = "#11131f";
          ctx.beginPath();
          ctx.arc(b.x - r * .42, b.y - r * .66, r * .1, 0, 6.2832);
          ctx.arc(b.x + r * .42, b.y - r * .66, r * .1, 0, 6.2832);
          ctx.fill();
        }
      }
    },

    /* Il s'approche et il enfle. Une seconde plus tard il eclate. */
    pissenlit: {
      nom: "pissenlit",
      vie: 3, vitesse: 78, rayon: 13, xp: 5, individu: true, arrive: 150,
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
        /* ⚠️ « On dirait une mini boule de pique, on ne sait pas que c'est une
           plante. » Ce qui manquait n'etait pas la couleur, c'etait la TIGE et
           les FEUILLES : une bestiole qui flotte se lit comme un animal. La
           tige l'accroche au sol, et l'aigrette porte de vraies akenes au bout
           de chaque filament au lieu de traits nus. */
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        var k = gonfle ? 1 + .55 * Math.sin(t * 16) * Math.sin(t * 16) : 1;
        if(gonfle) halo(ctx, b, "#ffd166", r * 3.2, .3);

        /* ⚠️ La tete est PORTEE, pas centree : c'est le decalage vers le haut,
           plus la tige en dessous, qui font lire une plante. Centree sur son
           pied, elle redevient une boule de pique. */
        var haut = b.y - r * .75;
        var pied = b.y + r * 1.55;
        var penche = Math.sin(t * 1.6 + b.phase) * r * .16;

        ctx.fillStyle = "rgba(0,0,0,.2)";
        ctx.beginPath();
        ctx.ellipse(b.x, pied, r * 1.1, r * .3, 0, 0, 6.2832);
        ctx.fill();

        /* les feuilles dentelees, largement etalees au pied */
        ctx.fillStyle = "#33512c";
        for(var f = -1; f <= 1; f += 2){
          ctx.beginPath();
          ctx.moveTo(b.x, pied - r * .1);
          ctx.quadraticCurveTo(b.x + f * r * 1.4, pied - r * .5,
                               b.x + f * r * 2, pied + r * .1);
          ctx.quadraticCurveTo(b.x + f * r * 1.2, pied + r * .35, b.x, pied);
          ctx.fill();
        }

        /* la tige : c'est elle qui dit « plante » */
        ctx.strokeStyle = "#3f6136";
        ctx.lineWidth = Math.max(3, r * .24);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(b.x, pied);
        ctx.quadraticCurveTo(b.x + penche, b.y + r * .3, b.x + penche, haut + r * .45);
        ctx.stroke();

        /* l'aigrette : chaque filament porte son akene au bout */
        ctx.strokeStyle = "#cfd4e6";
        ctx.lineWidth = 1.6;
        for(var i = 0; i < 12; i++){
          var a = i * (6.2832 / 12) + b.phase;
          var loin = r * 1.3 * k;
          var bx = b.x + penche + Math.cos(a) * loin, by = haut + Math.sin(a) * loin;
          ctx.beginPath();
          ctx.moveTo(b.x + penche + Math.cos(a) * r * .35, haut + Math.sin(a) * r * .35);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.fillStyle = "#eef1f8";
          ctx.beginPath();
          ctx.arc(bx, by, 2.4, 0, 6.2832);
          ctx.fill();
        }

        /* le coeur sombre, avec sa collerette */
        ctx.fillStyle = this.couleur;
        ctx.beginPath(); ctx.arc(b.x + penche, haut, r * .58 * k, 0, 6.2832); ctx.fill();
        /* la collerette verte sous la tete, la ou la tige la rejoint */
        ctx.fillStyle = "#3f6136";
        ctx.beginPath();
        ctx.ellipse(b.x + penche, haut + r * .45, r * .3, r * .16, 0, 0, 6.2832);
        ctx.fill();
        yeux(ctx, { x: b.x + penche, y: haut, angle: b.angle }, r * .62);
      }
    },

    /* ⚠️ LE LUCANE. Le demi-boss. Il n'est pas fait pour surprendre, il est
       fait pour se VOIR : deux fois et demie plus large que tout le reste,
       donc menacant sans qu'on ait rien a expliquer. Il est lent au point
       qu'on peut l'ignorer et s'occuper des autres, et c'est voulu : a 8 ans
       on ne gere pas deux urgences a la fois. Sa vie n'est pas devinee, elle
       est mesuree sur les degats reels du chevalier : de quinze a vingt-cinq
       secondes d'acharnement a la cadence du milieu de partie.

       ⚠️ Avant, c'etait un bloc de pierre sans espece, et elle a demande
       « c'est quel insecte ? ». Un demi-boss qui ne ressemble a rien de vivant
       n'appartient pas a la prairie. Ce sont ses PINCES qui portent la
       menace : elles s'ecartent une seconde avant qu'il frappe. */
    /* ⚠️ LA LIMACE. Le contre-poids de la puissance. Tout le reste du jeu se
       resout en tapant plus fort ; elle, non. Elle vise le SOL a cote du
       chevalier, et ce qu'elle laisse s'evite au lieu de se tuer.

       Deux crachats, et l'enfant doit les distinguer d'un coup d'oeil :
       - la GLAIRE, verte, freine de moitie tant qu'on patauge dedans ;
       - l'ACIDE, violet, retrograde une arme d'un niveau, une seule fois,
         puis disparait.
       L'acide sort une fois sur trois : perdre un niveau doit rester un
       evenement, pas une taxe. */
    /* ⚠️ LE PAPILLON. Il ne cherche pas a te toucher : il te tourne autour et
       laisse derriere lui une TRAINEE de nuees toxiques. C'est la premiere
       bestiole qui te prend du terrain au lieu de te prendre en chasse, et
       c'est ce qui la rend penible d'une facon neuve : on peut la tuer, mais
       ce qu'elle a deja pose reste.

       Trois choix qui tiennent ensemble :
       - il VOLE EN ZIGZAG (une onde large et lente), donc sa trainee fait des
         boucles au lieu d'une ligne droite. Une ligne droite se contourne d'un
         pas de cote ; une boucle enferme.
       - il est RAPIDE, et ca n'allait pas de soi. Au premier jet il volait a 58,
         parce qu'une bestiole qui seme des degats et qui va vite ne se fuit pas,
         elle se subit. Sauf que le chevalier court a 150 : « le papillon
         n'apparait jamais, meme en difficile quand ils sont tous la des le
         debut ». Mesure sur quatre parties entieres : il naissait bien, autant
         que le lucane, mais il ne s'approchait JAMAIS a moins de 158 unites —
         hors de portee de toute arme — et posait ses nuees la ou l'enfant etait
         deja passe. Il tenait une des trois places d'individus pendant 194
         secondes sans jamais rien faire. A 118 il rejoint, il pose devant, et
         il finit par mourir : la place se libere.
       - il ne pose RIEN pendant sa premiere seconde de vie, et chaque nuee met
         encore une seconde a s'ouvrir : il n'apparait jamais un poison
         instantane sous les pieds de l'enfant.

       Ses ailes sont VERTES comme ses nuees : c'est ce qui dit, sans un mot,
       que les deux vont ensemble. Le corps reste sombre et froid, comme toutes
       les menaces. */
    papillon: {
      nom: "papillon",
      /* ⚠️ VINGT POINTS DE VIE, pas quatre. Mesure : a quatre, il mourait au
         premier coup, et comme il occupe une des TROIS places d'individus, il
         volait sa place au lucane — 90 points de vie — a chaque fois. Resultat
         mesure : le magicien passait de 447 a 516 secondes de mediane. Une
         bestiole de plus rendait le jeu PLUS FACILE. A vingt, il faut s'en
         occuper, et il a le temps de poser deux ou trois nuees.
         Trois graines a la mort, comme les grosses : douze graines a ramasser
         se sentent comme un exploit, une seule ne se voit pas. */
      /* ⚠ 135 s, et non 200 : mesure du 2026-08-31, il n'etait vu que dans une
         partie sur deux. Il n'etait pourtant PAS prive de place — il naissait
         deux fois par partie, autant que le lucane — mais il vit douze
         secondes la ou le crapaud en vit cent trente, et sa fenetre s'ouvrait
         a 200 s pour une partie qui en dure 410 en moyenne. L'avancer double
         cette fenetre : deux parties sur trois le voient.
         Ni 150 ni 168 : un essai refuse deux arrivees a moins de quinze
         secondes l'une de l'autre, et le pissenlit tient 150, le lucane 175.
         Entre les deux il n'y a pas la place ; 135 la trouve avant. */
      vie: 20, vitesse: 118, rayon: 17, xp: 16, graines: 3, individu: true, arrive: 135,
      /* ⚠️ TROIS essais de couleur avant celle-ci, et les deux garde-fous ont
         mordu a tour de role : #241638 etait a 39 de l'abeille, #4a1f6e a 26 du
         crapaud, et le bleu-vert #1f7f8f n'avait que 58 d'ecart de luminance
         avec l'herbe — trop peu pour se detacher. Le coin sombre et froid de la
         palette est plein : escargot, abeille, limace, lucane, crapaud, reine y
         sont deja.
         Ce violet vif, lui, est a 82 de la bestiole la plus proche et a 110 de
         l'herbe. Et il se justifie : un insecte qui porte du poison s'annonce
         par des couleurs criardes, c'est vrai chez les vraies betes aussi. */
      couleur: "#9b1fb0",
      aile: "#701583",
      ailePale: "#a8f05a",
      onde: { amplitude: 1.5, vitesse: 2.2 },
      penser: function(b, c){
        if(b.prochaine === undefined) b.prochaine = c.temps + 1.4;
        /* il gonfle avant de lacher : le preavis sur la bestiole, en plus de
           celui de la nuee elle-meme */
        b.etat = (c.temps >= b.prochaine - PREAVIS) ? "gonfle" : "vole";
        if(c.temps >= b.prochaine){
          c.embrumer();
          b.prochaine = c.temps + 3.2;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        /* ⚠️ Le halo du preavis porte LA MEME couleur que ses nuees. Il etait
           reste vert quand tout le reste est passe au lilas : sur la capture,
           le papillon avait une tache verte et un halo vert au milieu d'une
           fumee noire, et plus rien ne se repondait. Mais PAS le meme lilas que
           les bouffees : pose sur sa propre nuee, il noyait l'insecte. Presque
           blanc, il annonce sans effacer. */
        if(gonfle) halo(ctx, b, "#f6dcff", r * (2 + .35 * Math.sin(t * 13)), .26);

        ctx.fillStyle = "rgba(0,0,0,.2)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .75, r * .9, r * .3, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        /* les quatre ailes battent : deux grandes devant, deux petites
           derriere, et elles se referment ensemble */
        var bat = .35 + .65 * Math.abs(Math.sin(t * 7 + b.phase));
        for(var c2 = -1; c2 <= 1; c2 += 2){
          ctx.fillStyle = this.aile;
          ctx.beginPath();
          ctx.ellipse(r * .25, c2 * r * .95 * bat, r * .95, r * .78 * bat,
                      c2 * .45, 0, 6.2832);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(-r * .62, c2 * r * .8 * bat, r * .6, r * .55 * bat,
                      -c2 * .4, 0, 6.2832);
          ctx.fill();
          /* les taches pales, qui disent quelle couleur il empoisonne */
          ctx.fillStyle = this.ailePale;
          ctx.beginPath();
          ctx.ellipse(r * .45, c2 * r * 1.05 * bat, r * .3, r * .24 * bat,
                      c2 * .45, 0, 6.2832);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(-r * .05, c2 * r * .78 * bat, r * .16, r * .13 * bat,
                      c2 * .45, 0, 6.2832);
          ctx.fill();
        }
        /* le corps, sombre et segmente */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(-r * .1, 0, r * .82, r * .26, 0, 0, 6.2832);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * .62, 0, r * .3, 0, 6.2832);
        ctx.fill();
        /* les antennes, en massue comme celles d'un vrai papillon */
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = Math.max(1.5, r * .1);
        for(var a2 = -1; a2 <= 1; a2 += 2){
          ctx.beginPath();
          ctx.moveTo(r * .78, a2 * r * .12);
          ctx.quadraticCurveTo(r * 1.25, a2 * r * .45, r * 1.35, a2 * r * .78);
          ctx.stroke();
          ctx.fillStyle = this.couleur;
          ctx.beginPath();
          ctx.ellipse(r * 1.36, a2 * r * .82, r * .13, r * .09, a2 * .6, 0, 6.2832);
          ctx.fill();
        }
        ctx.restore();
        yeux(ctx, { x: b.x + Math.cos(b.angle) * r * .62,
                    y: b.y + Math.sin(b.angle) * r * .62,
                    angle: b.angle }, r * .34);
      }
    },

    limace: {
      nom: "limace",
      vie: 5, vitesse: 26, rayon: 23, xp: 9, individu: true,
      /* ⚠️ Elle attend la PUISSANCE, pas l'heure : niveau 6, et jamais avant
         deux minutes. Le chevalier qui peine ne la voit jamais. */
      arrive: 120, arriveNiveau: 6,
      couleur: "#1f6b52",
      penser: function(b, c){
        if(b.prochain === undefined){ b.prochain = c.temps + 3; b.tours = 0; }
        b.etat = (c.temps >= b.prochain - PREAVIS) ? "gonfle" : "rampe";
        if(c.temps >= b.prochain){
          b.tours = (b.tours || 0) + 1;
          /* ⚠️ Un sur trois, pas un sur quatre. Mesure : a un sur quatre il n y
             avait que 18 % de crachats violets, et « je n en vois plus, que des
             bleues ». Le repos de 90 s limite deja les vraies pertes d arme —
             raréfier la flaque en plus la rendait invisible. */
          var sorte = (b.tours % 3 === 0) ? "acide" : "glaire";
          /* elle vise LA OU IL VA, pas la ou il est : sinon il suffit
             d'avancer tout droit pour ne jamais rien recevoir */
          var devant = 90;
          c.cracher(c.joueurX + Math.cos(c.joueurAngle) * devant,
                    c.joueurY + Math.sin(c.joueurAngle) * devant, sorte);
          b.prochain = c.temps + 8;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var gonfle = b.etat === "gonfle";
        var enfle = gonfle ? 1 + .12 * Math.sin(t * 15) : 1;
        var prochainAcide = ((b.tours || 0) + 1) % 3 === 0;
        if(gonfle) halo(ctx, b, prochainAcide ? "#c78bff" : "#7fe6ff", r * 2.2, .32);

        ctx.fillStyle = "rgba(0,0,0,.22)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .5, r * 1.15, r * .4, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        /* ⚠️ Des formes SIMPLES qui se chevauchent, pas une silhouette
           dessinee au trait : trace d'un seul geste pointu, elle se lisait
           comme une feuille. Un gros pain arrondi, une tete bombee devant, une
           queue effilee derriere. */
        ctx.fillStyle = this.couleur;
        /* la queue, effilee vers l'arriere */
        ctx.beginPath();
        ctx.ellipse(-r * .82, 0, r * .48, r * .3 * enfle, 0, 0, 6.2832);
        ctx.fill();
        /* le corps : un pain bien rond */
        ctx.beginPath();
        ctx.ellipse(-r * .05, -r * .02, r * .85, r * .5 * enfle, 0, 0, 6.2832);
        ctx.fill();
        /* la tete, bombee et relevee */
        ctx.beginPath();
        ctx.arc(r * .68, -r * .1, r * .42 * enfle, 0, 6.2832);
        ctx.fill();
        /* ⚠️ La bave DERRIERE elle. Vue de dessus, une limace n'a ni ventre
           ni dos : ce qui la designe, c'est la trace luisante qu'elle laisse.
           Un « pied » pale dessine sous le corps etait de la pensee de profil,
           et de dessus ca ressemblait a la moitie claire d'une feuille. */
        ctx.fillStyle = "rgba(226,255,242,.45)";
        for(var v = 0; v < 3; v++){
          ctx.beginPath();
          ctx.ellipse(-r * (1.5 + v * .62), Math.sin(t * 1.2 + v) * r * .1,
                      r * .26, r * (.2 - v * .04), 0, 0, 6.2832);
          ctx.fill();
        }
        /* le manteau bombe sur le dos, avec son anneau */
        ctx.fillStyle = "#2e8f6c";
        ctx.beginPath();
        ctx.ellipse(-r * .18, -r * .14 * enfle, r * .46, r * .3, 0, 0, 6.2832);
        ctx.fill();
        ctx.strokeStyle = "#0f3b2c";
        ctx.lineWidth = Math.max(1.5, r * .07);
        ctx.beginPath();
        ctx.ellipse(-r * .18, -r * .14 * enfle, r * .28, r * .18, 0, 0, 6.2832);
        ctx.stroke();
        /* les deux tentacules */
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = r * .16;
        ctx.lineCap = "round";
        for(var k = -1; k <= 1; k += 2){
          ctx.beginPath();
          ctx.moveTo(r * .78, k * r * .22);
          ctx.quadraticCurveTo(r * 1.15, k * r * .55, r * 1.18, k * r * .82);
          ctx.stroke();
          ctx.fillStyle = "#0f3b2c";
          ctx.beginPath();
          ctx.arc(r * 1.18, k * r * .82, r * .13, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = this.couleur;
        }
        /* la bouche, qui gonfle avant de cracher, de la couleur de ce qui vient */
        ctx.fillStyle = gonfle ? (prochainAcide ? "#8b3fd1" : "#7fe6ff") : "#0f3b2c";
        ctx.beginPath();
        ctx.ellipse(r * .92, -r * .05, r * .26 * enfle, r * .21 * enfle, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();

        yeux(ctx, { x: b.x + Math.cos(b.angle) * r * .62,
                    y: b.y + Math.sin(b.angle) * r * .62,
                    angle: b.angle }, r * .38);
      }
    },

    /* ⚠️ LA REINE DES TOILES. Le boss de fin, a huit minutes. Avant elle, on
       gagnait parce que le chronometre tombait a zero : un anticlimax apres
       huit minutes de jeu.

       Une araignee fait peur, et c'est assume — mais elle est dessinee RONDE,
       avec de grands yeux et une couronne, pas avec des poils et des crochets.
       On veut « la reine du jardin », pas un cauchemar.

       Sa vie n'est pas ecrite ici : le moteur la calcule sur les degats que le
       joueur a vraiment faits dans la derniere minute (voir `invoquerBoss`).
       A huit minutes, deux enfants peuvent avoir un rapport de un a cinq en
       puissance ; un chiffre fixe donnerait dix secondes de combat a l'un et
       cinquante a l'autre.

       Deux attaques, jamais melangees, chacune annoncee une seconde avant :
       - elle CRACHE UNE TOILE la ou le joueur va ; elle colle, mais on s'en
         arrache en poussant ;
       - elle SE JETTE en avant, tout droit, donc esquivable. */
    araignee: {
      nom: "araignee", titre: "La reine des toiles",
      vie: 400, vitesse: 46, rayon: 62, xp: 120, graines: 30,
      individu: true, boss: true, arrive: 480,
      couleur: "#5c1f4a",
      penser: function(b, c){
        if(b.prochain === undefined){ b.prochain = c.temps + 2.2; b.tours = 0; }
        /* elle recule un peu quand on est colle a elle : une reine ne se laisse
           pas mordre les pattes sans bouger */
        b.etat = (c.temps >= b.prochain - PREAVIS)
          ? ((b.tours % 2) ? "saute" : "toile")
          : "marche";

        if(b.saut !== undefined && c.temps < b.saut){
          /* ⚠️ Pendant le bond, l'etat doit dire BOND : calcule plus haut, il
             retombait sur « marche » des que le prochain coup etait programme,
             donc le dessin ne montrait rien et le bond passait inapercu. */
          b.etat = "bond";
          b.angleImpose = b.angleSaut;
          b.vitesseFacteur = 6.4;
          return;
        }
        b.angleImpose = null;
        b.vitesseFacteur = 1;

        if(c.temps >= b.prochain){
          if(b.tours % 2){
            /* le bond : tout droit, donc on peut s'ecarter */
            b.angleSaut = c.angleVersJoueur;
            b.saut = c.temps + 0.55;
            b.prochain = c.temps + 4.2;
          }else{
            /* la toile, la ou il va */
            var devant = 70;
            c.toiler(c.joueurX + Math.cos(c.joueurAngle) * devant,
                     c.joueurY + Math.sin(c.joueurAngle) * devant);
            b.prochain = c.temps + 3.4;
          }
          b.tours++;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var toile = b.etat === "toile", saute = b.etat === "saute" || b.etat === "bond";
        var enVol = b.etat === "bond";
        var bat = 1 + .06 * Math.sin(t * 3);
        if(toile) halo(ctx, b, "#dff2ff", r * 1.5 + Math.sin(t * 14) * 5, .3);
        if(saute) halo(ctx, b, "#ff9f6b", r * 1.5 + Math.sin(t * 16) * 6, .32);
        /* en plein bond, une trainee derriere elle : on voit d'ou elle vient */
        if(enVol){
          ctx.globalAlpha = .3;
          ctx.fillStyle = "#ffd9c0";
          for(var tr = 1; tr <= 3; tr++){
            ctx.beginPath();
            ctx.ellipse(b.x - Math.cos(b.angle) * r * tr * .55,
                        b.y - Math.sin(b.angle) * r * tr * .55,
                        r * (.8 - tr * .16), r * (.7 - tr * .14), 0, 0, 6.2832);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = "rgba(0,0,0,.28)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .5, r * .95, r * .38, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* les huit pattes, repliees quand elle va bondir */
        var repli = saute ? .62 : 1;
        ctx.strokeStyle = "#241a36";
        ctx.lineWidth = r * .1;
        ctx.lineCap = "round";
        for(var k = 0; k < 4; k++){
          for(var c2 = -1; c2 <= 1; c2 += 2){
            var base = (k - 1.5) * r * .3;
            var ouvre = (0.5 + k * 0.28) * repli;
            var bouge = Math.sin(t * 3 + k * 1.4 + (c2 > 0 ? 0 : 1.6)) * r * .08;
            ctx.beginPath();
            ctx.moveTo(base, c2 * r * .42);
            ctx.quadraticCurveTo(base + r * .18, c2 * r * (.42 + ouvre * .5),
                                 base - r * .25, c2 * r * (.5 + ouvre) + bouge);
            ctx.stroke();
          }
        }

        /* l'abdomen, gros et rond, puis le cephalothorax */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(-r * .42, 0, r * .68 * bat, r * .6 * bat, 0, 0, 6.2832);
        ctx.fill();
        /* le sablier clair sur le dos, comme une vraie */
        ctx.fillStyle = "#c9a0ff";
        ctx.beginPath();
        ctx.moveTo(-r * .42, -r * .34);
        ctx.lineTo(-r * .22, 0);
        ctx.lineTo(-r * .42, r * .34);
        ctx.lineTo(-r * .62, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#4a3670";
        ctx.beginPath();
        ctx.ellipse(r * .3, 0, r * .42, r * .38, 0, 0, 6.2832);
        ctx.fill();

        /* les grands yeux : c'est eux qui la rendent reine et pas cauchemar */
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(r * .5, -r * .18, r * .15, 0, 6.2832);
        ctx.arc(r * .5, r * .18, r * .15, 0, 6.2832);
        ctx.arc(r * .28, -r * .3, r * .08, 0, 6.2832);
        ctx.arc(r * .28, r * .3, r * .08, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#11131f";
        ctx.beginPath();
        ctx.arc(r * .56, -r * .18, r * .08, 0, 6.2832);
        ctx.arc(r * .56, r * .18, r * .08, 0, 6.2832);
        ctx.fill();

        /* les cheliceres, qui s'ecartent avant de cracher */
        ctx.strokeStyle = "#241a36";
        ctx.lineWidth = r * .11;
        var ecart = toile ? .34 : .16;
        for(var m = -1; m <= 1; m += 2){
          ctx.beginPath();
          ctx.moveTo(r * .6, m * r * .12);
          ctx.quadraticCurveTo(r * .82, m * r * ecart, r * .74, m * r * (ecart + .16));
          ctx.stroke();
        }
        ctx.restore();

        /* ⚠️ LA COURONNE, dessinee hors rotation : elle doit rester droite,
           sinon elle tourne avec la bete et ne se lit plus comme une couronne. */
        var cy = b.y - r * .86;
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.moveTo(b.x - r * .42, cy + r * .2);
        ctx.lineTo(b.x - r * .42, cy - r * .1);
        ctx.lineTo(b.x - r * .21, cy + r * .06);
        ctx.lineTo(b.x, cy - r * .26);
        ctx.lineTo(b.x + r * .21, cy + r * .06);
        ctx.lineTo(b.x + r * .42, cy - r * .1);
        ctx.lineTo(b.x + r * .42, cy + r * .2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff5d73";
        ctx.beginPath();
        ctx.arc(b.x, cy + r * .04, r * .07, 0, 6.2832);
        ctx.fill();
      }
    },

    /* ------------------------------------------------- LE CRABE GEANT

       Le boss de l'ile. Son geste : il leve sa grosse pince une seconde, puis
       l'abat — un anneau d'eau part de lui et s'elargit jusqu'a 420 unites.

       ⚠️ La parade est l'inverse du reflexe : il faut COURIR VERS LUI. Pres
       du crabe la vague est deja passee ; a mi-distance on la prend en pleine
       course. C'est la seule attaque du jeu ou fuir est le mauvais choix, et
       c'est ce qui la rend interessante a apprendre.

       ⚠️ DESSIN PROVISOIRE. Cinq maquettes ont ete refusees ; on a decide de
       livrer les MECANIQUES d'abord et de reprendre les dessins ensuite, le
       jeu sous les yeux. Il emprunte donc la construction de la reine — grosse
       masse, gros yeux blancs, pattes en arcs — avec ses couleurs a lui et sa
       couronne de corail. */
    crabe: {
      nom: "crabe", titre: "Le roi crabe",
      /* ⚠️ 120, ET PAS 40. Mesure : a 40, un chevalier qui court a 150 lui
         echappait pour toujours, filait au bord de l'arene, et AUCUN anneau ne
         l'atteignait plus — sa portee est de 460. Un boss qu'on bat en
         s'eloignant n'est pas un boss ; c'est exactement la lecon du papillon,
         qui ne rejoignait jamais personne. A 120 il reste sur vous, et
         l'anneau redevient la question. */
      vie: 400, vitesse: 120, rayon: 66, xp: 120, graines: 30,
      individu: true, boss: true, arrive: 480,
      /* ⚠️ ROUGE BRIQUE, et pas le bleu du premier jet : a #2C4A63 il n'etait
         qu'a DIX de l'escargot, et un essai refuse deux bestioles qui se
         ressemblent. L'inventaire des couleurs du jeu donne le rouge sombre
         comme la region la plus libre — a 80 de la bestiole la plus proche.
         Il reste sombre (luminance 67 contre 178 pour l'herbe et 212 pour le
         sable), donc il ne bascule pas du cote clair et chaud du heros, et il
         ne se confond pas avec le feu, qui est orange vif. */
      couleur: "#A82828",
      penser: function(b, c){
        if(b.prochain === undefined) b.prochain = c.temps + 3;
        b.etat = (c.temps >= b.prochain - PREAVIS) ? "leve" : "marche";
        if(c.temps >= b.prochain){
          c.anneau();
          b.prochain = c.temps + 4;
          b.etat = "abat";
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var leve = b.etat === "leve";
        if(leve) halo(ctx, b, "#9AD3F0", r * 1.45 + Math.sin(t * 14) * 5, .3);

        ctx.fillStyle = "rgba(0,0,0,.26)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .48, r * 1.0, r * .38, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* les huit pattes, en arcs epais comme celles de la reine */
        ctx.strokeStyle = "#5A1414";
        ctx.lineWidth = r * .1;
        ctx.lineCap = "round";
        for(var k = 0; k < 4; k++){
          for(var c2 = -1; c2 <= 1; c2 += 2){
            var base = (k - 1.5) * r * .28;
            var bouge = Math.sin(t * 3 + k * 1.4 + (c2 > 0 ? 0 : 1.6)) * r * .07;
            ctx.beginPath();
            ctx.moveTo(base, c2 * r * .4);
            ctx.quadraticCurveTo(base + r * .2, c2 * r * .78,
                                 base - r * .2, c2 * r * 1.05 + bouge);
            ctx.stroke();
          }
        }

        /* la grosse pince, levee avant de frapper */
        var haut = leve ? -r * .5 : 0;
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = r * .2;
        ctx.beginPath();
        ctx.moveTo(r * .3, -r * .3);
        ctx.lineTo(r * .78, -r * .62 + haut);
        ctx.stroke();
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(r * .95, -r * .78 + haut, r * .34, r * .26, -.5, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#5A1414";
        ctx.beginPath();
        ctx.ellipse(r * 1.12, -r * .95 + haut, r * .2, r * .07,
                    -.5 - (leve ? .5 : 0), 0, 6.2832);
        ctx.fill();
        /* la petite, de l'autre cote */
        ctx.strokeStyle = this.couleur;
        ctx.lineWidth = r * .11;
        ctx.beginPath();
        ctx.moveTo(r * .3, r * .3);
        ctx.lineTo(r * .66, r * .5);
        ctx.stroke();
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(r * .76, r * .58, r * .17, r * .13, .5, 0, 6.2832);
        ctx.fill();

        /* la carapace, et l'eventail clair du dos */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * .78, r * .66, 0, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#E8A45C";
        ctx.beginPath();
        ctx.moveTo(-r * .5, 0);
        ctx.quadraticCurveTo(0, -r * .45, r * .3, 0);
        ctx.quadraticCurveTo(0, r * .45, -r * .5, 0);
        ctx.closePath();
        ctx.fill();

        /* les gros yeux, comme ceux de la reine : c'est le signe du bestiaire */
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(r * .46, -r * .2, r * .16, 0, 6.2832);
        ctx.arc(r * .46, r * .2, r * .16, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#11131f";
        ctx.beginPath();
        ctx.arc(r * .52, -r * .2, r * .085, 0, 6.2832);
        ctx.arc(r * .52, r * .2, r * .085, 0, 6.2832);
        ctx.fill();

        /* la couronne de corail : son accessoire de boss */
        ctx.fillStyle = "#F0D8A8";
        for(var m = -1; m <= 1; m++){
          ctx.save();
          ctx.translate(-r * .55, m * r * .3);
          ctx.rotate(m * .4);
          ctx.fillRect(-r * .26, -r * .05, r * .3, r * .1);
          ctx.beginPath(); ctx.arc(-r * .3, -r * .1, r * .1, 0, 6.2832); ctx.fill();
          ctx.beginPath(); ctx.arc(-r * .34, r * .08, r * .08, 0, 6.2832); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    },

    /* ----------------------------------------------------- LE DRAGON

       Le boss du volcan. Son geste : il se ramasse une seconde, ses braises
       s'intensifient, il BONDIT sur le joueur, et a l'atterrissage une dizaine
       de rochers de lave pleuvent sur l'arene.

       ⚠️ Chaque rocher previent une seconde avec son ombre au sol : la regle
       du preavis tient pour CHACUN, pas pour la salve. Et un rocher tombe
       reste au sol et brule vingt-cinq secondes : l'arene retrecit a chaque
       saut. Aucun autre boss ne prend du terrain — la reine et le crabe
       frappent, celui-ci enleve de la place.

       ⚠️ DESSIN PROVISOIRE, comme le crabe. */
    dragon: {
      nom: "dragon", titre: "Le dragon d'obsidienne",
      vie: 400, vitesse: 44, rayon: 64, xp: 120, graines: 30,
      individu: true, boss: true, arrive: 480,
      /* ⚠️ OBSIDIENNE, presque noire. Au premier jet il etait a #2E2430, soit
         36 de l'abeille, et un essai refuse deux bestioles qui se ressemblent.
         L'inventaire ne laissait libre que le bleu-violet ; celui-ci est pris
         tres sombre pour une deuxieme raison, celle-la mesuree : le basalte de
         son monde est deja sombre (luminance 51), donc un dragon de luminance
         moyenne s'y noierait. A 21, il s'en detache par le BAS — et c'est sa
         fissure de lave, orange vif, qui porte la chaleur. */
      couleur: "#161046",
      penser: function(b, c){
        if(b.prochain === undefined) b.prochain = c.temps + 3;
        b.etat = (c.temps >= b.prochain - PREAVIS) ? "ramasse" : "marche";

        if(b.saut !== undefined && c.temps < b.saut){
          b.etat = "bond";
          b.angleImpose = b.angleSaut;
          b.vitesseFacteur = 6.0;
          return;
        }
        /* il vient d'atterrir : la lave retombe */
        if(b.saut !== undefined && !b.tombe){
          b.tombe = true;
          c.pluie(6);
        }
        b.angleImpose = null;
        b.vitesseFacteur = 1;

        if(c.temps >= b.prochain){
          b.angleSaut = c.angleVersJoueur;
          b.saut = c.temps + 0.6;
          b.tombe = false;
          b.prochain = c.temps + 6;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var pret = b.etat === "ramasse", vol = b.etat === "bond";
        var vif = pret || vol ? 1 : .72;
        if(pret) halo(ctx, b, "#FF7A2B", r * 1.5 + Math.sin(t * 15) * 6, .3);

        ctx.fillStyle = "rgba(0,0,0,.3)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .5, r * (vol ? .6 : .95), r * .36, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* la queue */
        ctx.strokeStyle = this.couleur;
        ctx.lineCap = "round";
        ctx.lineWidth = r * .24;
        ctx.beginPath();
        ctx.moveTo(-r * .5, 0);
        ctx.quadraticCurveTo(-r * 1.2, r * .3, -r * 1.5, -r * .1);
        ctx.stroke();

        /* les ailes, courtes et collees au corps */
        var ouvre = pret ? .6 : (vol ? 1.15 : .9);
        for(var c2 = -1; c2 <= 1; c2 += 2){
          ctx.fillStyle = "#3A2456";
          ctx.beginPath();
          ctx.moveTo(-r * .2, c2 * r * .3);
          ctx.quadraticCurveTo(r * .3 * ouvre, c2 * r * 1.15 * ouvre,
                               -r * .35, c2 * r * 1.2 * ouvre);
          ctx.quadraticCurveTo(-r * .6, c2 * r * .7, -r * .3, c2 * r * .3);
          ctx.closePath();
          ctx.fill();
        }

        /* le corps */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(-r * .1, 0, r * .68, r * .5, 0, 0, 6.2832);
        ctx.fill();
        /* la fissure de lave, du crane a la queue : son seul motif */
        ctx.strokeStyle = "#FF7A2B";
        ctx.globalAlpha = vif;
        ctx.lineCap = "round";
        ctx.lineWidth = r * .16;
        ctx.beginPath();
        ctx.moveTo(r * .3, -r * .06);
        ctx.quadraticCurveTo(-r * .2, r * .12, -r * .7, -r * .04);
        ctx.stroke();
        ctx.globalAlpha = 1;

        /* la tete, et les deux cornes epaisses */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(r * .5, 0, r * .38, r * .32, 0, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#8A7A5A";
        for(var m = -1; m <= 1; m += 2){
          ctx.beginPath();
          ctx.moveTo(r * .38, m * r * .2);
          ctx.quadraticCurveTo(r * .2, m * r * .68, r * .5, m * r * .82);
          ctx.quadraticCurveTo(r * .42, m * r * .44, r * .56, m * r * .18);
          ctx.closePath();
          ctx.fill();
        }
        /* la gueule, qui rougeoie avant le saut */
        if(pret || vol){
          ctx.fillStyle = "#FF7A2B";
          ctx.beginPath();
          ctx.ellipse(r * .82, 0, r * .16, r * .1, 0, 0, 6.2832);
          ctx.fill();
        }
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(r * .58, -r * .16, r * .14, 0, 6.2832);
        ctx.arc(r * .58, r * .16, r * .14, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = pret ? "#FF7A2B" : "#3A1200";
        ctx.beginPath();
        ctx.arc(r * .63, -r * .16, r * .075, 0, 6.2832);
        ctx.arc(r * .63, r * .16, r * .075, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      }
    },

    lucane: {
      nom: "lucane",
      vie: 90, vitesse: 30, rayon: 50, xp: 40, graines: 12,
      individu: true, arrive: 175,
      couleur: "#1a3f8f",
      penser: function(b, c){
        if(b.prochain === undefined) b.prochain = c.temps + 6;
        b.etat = (c.temps >= b.prochain - PREAVIS) ? "pince" : "marche";
        if(c.temps >= b.prochain){
          for(var k = 0; k < 6; k++){
            c.tirer(b.angle + k * (6.2832 / 6), 118, 12, 4.5, "#0e2454");
          }
          b.prochain = c.temps + 7;
        }
      },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        var ouvert = b.etat === "pince";
        /* les pinces s'ecartent, et elles tremblent juste avant le coup */
        var ecart = ouvert ? 1.05 + .18 * Math.sin(t * 16) : 0.42;
        if(ouvert) halo(ctx, b, "#7ba4ff", r * 1.7 + Math.sin(t * 14) * 4, .3);

        ctx.fillStyle = "rgba(0,0,0,.26)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + r * .5, r * .9, r * .4, 0, 0, 6.2832);
        ctx.fill();

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        /* les six pattes, trois de chaque cote */
        ctx.strokeStyle = "#0e2454";
        ctx.lineWidth = r * .13;
        ctx.lineCap = "round";
        for(var k = 0; k < 3; k++){
          var px = r * (.35 - k * .42);
          var lever = Math.sin(t * 7 + k * 2.1) * r * .1;
          ctx.beginPath();
          ctx.moveTo(px, -r * .5);
          ctx.lineTo(px - r * .2, -r * .95 + lever);
          ctx.moveTo(px, r * .5);
          ctx.lineTo(px - r * .2, r * .95 - lever);
          ctx.stroke();
        }

        /* les elytres : le dos bombe, fendu au milieu */
        ctx.fillStyle = this.couleur;
        ctx.beginPath();
        ctx.ellipse(-r * .12, 0, r * .78, r * .62, 0, 0, 6.2832);
        ctx.fill();
        ctx.strokeStyle = "#0e2454";
        ctx.lineWidth = Math.max(2, r * .07);
        ctx.beginPath();
        ctx.moveTo(-r * .85, 0);
        ctx.lineTo(r * .5, 0);
        ctx.stroke();
        /* un reflet, pour que la carapace brille */
        ctx.fillStyle = "rgba(140,180,255,.35)";
        ctx.beginPath();
        ctx.ellipse(-r * .3, -r * .28, r * .32, r * .16, -.4, 0, 6.2832);
        ctx.fill();

        /* le corselet, puis la tete */
        ctx.fillStyle = "#2c58b8";
        ctx.beginPath();
        ctx.ellipse(r * .5, 0, r * .3, r * .42, 0, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#0e2454";
        ctx.beginPath();
        ctx.arc(r * .82, 0, r * .27, 0, 6.2832);
        ctx.fill();

        /* ⚠️ LES PINCES : c'est elles qui previennent. Deux cornes courbes
           qui s'ouvrent une seconde avant le coup. */
        ctx.strokeStyle = ouvert ? "#7ba4ff" : "#0e2454";
        ctx.lineWidth = r * .13;
        for(var c = -1; c <= 1; c += 2){
          ctx.beginPath();
          ctx.moveTo(r * .95, c * r * .18);
          /* elles s'ecartent, puis le bout crochete vers l'interieur : c'est
             ce crochet qui fait lire une PINCE et pas une antenne */
          ctx.quadraticCurveTo(r * 1.45, c * r * (.15 + .58 * ecart),
                               r * 1.82, c * r * (.05 + .34 * ecart));
          ctx.stroke();
        }

        /* les yeux, clairs sur la tete sombre */
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(r * .82, -r * .16, r * .1, 0, 6.2832);
        ctx.arc(r * .82, r * .16, r * .1, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = "#11131f";
        ctx.beginPath();
        ctx.arc(r * .88, -r * .16, r * .05, 0, 6.2832);
        ctx.arc(r * .88, r * .16, r * .05, 0, 6.2832);
        ctx.fill();

        ctx.restore();
      }
    }
  };

  /* on garde l'heure vraie de chaque arrivee, pour pouvoir y revenir */
  for(var n in ESPECES){
    ESPECES[n].arriveVraie = ESPECES[n].arrive;
    ESPECES[n].arriveNiveauVrai = ESPECES[n].arriveNiveau || 0;
  }

  /* ⚠️ L'essai doit lever LES DEUX portes. Certaines bestioles n'attendent pas
     l'heure mais la PUISSANCE (la limace, au niveau 6) : remettre leur heure a
     zero sans lever `arriveNiveau` les laisse invisibles, et le mode d'essai
     mentirait sur ce qu'il montre. */
  function reglerEssai(actif){
    for(var m in ESPECES){
      ESPECES[m].arrive = actif ? 0 : ESPECES[m].arriveVraie;
      ESPECES[m].arriveNiveau = actif ? 0 : ESPECES[m].arriveNiveauVrai;
    }
    return actif;
  }

  reglerEssai(ESSAI);

  return { ESPECES: ESPECES, reglerEssai: reglerEssai, ESSAI: ESSAI };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Bestioles;
if(typeof globalThis !== "undefined") globalThis.Bestioles = Bestioles;
