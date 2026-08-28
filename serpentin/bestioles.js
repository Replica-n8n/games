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
          var sorte = (b.tours % 4 === 0) ? "acide" : "glaire";
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
        var prochainAcide = ((b.tours || 0) + 1) % 4 === 0;
        if(gonfle) halo(ctx, b, prochainAcide ? "#c78bff" : "#8ce0b0", r * 2.2, .32);

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
        ctx.fillStyle = gonfle ? (prochainAcide ? "#8b3fd1" : "#8ce0b0") : "#0f3b2c";
        ctx.beginPath();
        ctx.ellipse(r * .92, -r * .05, r * .26 * enfle, r * .21 * enfle, 0, 0, 6.2832);
        ctx.fill();
        ctx.restore();

        yeux(ctx, { x: b.x + Math.cos(b.angle) * r * .62,
                    y: b.y + Math.sin(b.angle) * r * .62,
                    angle: b.angle }, r * .38);
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
