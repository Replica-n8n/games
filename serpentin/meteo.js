/* Le temps qu'il fait.

   Regle de frontiere : ajouter un temps doit couter un objet ici, et rien
   d'autre. Le moteur ne connait que le nom du temps courant et le tableau
   `bonus` qu'il pose ; il ne sait pas ce qu'est une goutte.

   Deux regles tenues ici, et elles ne sont pas decoratives :

   - **la nuit ne cache jamais une menace.** Le voile s'applique au SOL, sous
     les bestioles : le decor s'assombrit, ce qui peut tuer reste clair. Un
     enfant qui meurt de quelque chose qu'il n'a pas vu arrete de jouer.
   - **rien ne frappe sans prevenir.** La pluie et la nuit ne touchent a
     aucune regle. L'orage, quand il arrivera, devra annoncer sa foudre une
     seconde avant, comme le herisson et le crapaud. */

var Meteo = (function(){
  "use strict";

  /* ⚠️ Le temps ne tire plus au hasard dans un chapeau. Chaque temps dit ce
     qui peut le SUIVRE : l'orage vient apres des nuages ou de la pluie, jamais
     apres la neige, et le beau temps revient toujours par les nuages. Les
     durees sont tres larges et tirees au carre : une averse courte est
     frequente, une pluie qui dure toute la partie est rare mais possible. */

  /* Un bruit sans allocation : la meme goutte retombe toujours au meme
     endroit pour un indice donne, donc rien a stocker d'une image a l'autre. */
  function bruit(i){
    var x = Math.sin(i * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  /* Les icones du cadran. Dessinees ici : ajouter un temps ne doit toucher
     que ce fichier, son icone comprise. */
  function soleil(ctx, x, y, r, t){
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for(var i = 0; i < 8; i++){
      var a = i * (6.2832 / 8) + t * .25;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62);
      ctx.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.arc(x, y, r * .42, 0, 6.2832); ctx.fill();
  }

  function nuage(ctx, x, y, r, couleur){
    ctx.fillStyle = couleur;
    ctx.beginPath();
    ctx.arc(x - r * .32, y - r * .06, r * .34, 0, 6.2832);
    ctx.arc(x + r * .04, y - r * .26, r * .42, 0, 6.2832);
    ctx.arc(x + r * .4, y - r * .04, r * .32, 0, 6.2832);
    ctx.fill();
    ctx.fillRect(x - r * .64, y - r * .1, r * 1.3, r * .38);
  }

  var TEMPS = {
    beau: {
      nom: "beau",
      titre: "Beau temps",
      duree: [25, 160],
      suites: { nuageux: 5, pluie: 2, nuit: 2, neige: 1 },
      /* La glace fond au soleil, en unites de rayon par seconde. ⚠️ A 26 une
         plaque disparaissait en trois secondes : on ne voyait pas fondre, on
         voyait effacer. A 9, une grande plaque met un quart de minute. */
      fonte: 9,
      icone: function(ctx, x, y, r, t){ soleil(ctx, x, y, r, t); }
    },

    /* Nuageux : rien ne tombe, mais l'ombre des nuages passe sur le sol. */
    nuageux: {
      nom: "nuageux",
      titre: "Nuageux",
      duree: [20, 110],
      suites: { pluie: 5, beau: 4, orage: 2, nuit: 2, neige: 1 },
      fonte: 3,
      teinte: "rgba(60,72,96,.14)",
      icone: function(ctx, x, y, r){
        nuage(ctx, x, y, r * 1.1, "#dfe7f2");
        nuage(ctx, x - r * .3, y + r * .3, r * .8, "#b9c6da");
      },
      /* l'ombre des nuages, en coordonnees monde : elle glisse lentement */
      ombres: { nombre: 6, rayonMin: 85, rayonMax: 165, vitesse: 26 },
      /* ⚠️ Des ROND, pas un polygone. Trace en segments droits, l'ombre
         ressemblait a une plaque de verre posee sur l'herbe. Six disques qui
         se chevauchent dans un seul trace : aucune couture a l'interieur. */
      dessinerOmbre: function(ctx, o){
        ctx.fillStyle = "rgba(28,38,58,.17)";
        ctx.beginPath();
        for(var i = 0; i < 6; i++){
          var a = o.i + i * (6.2832 / 6);
          var d = o.r * (0.34 + 0.14 * Math.sin(o.i * 3 + i * 2.3));
          var r = o.r * (0.52 + 0.16 * Math.sin(o.i * 2 + i * 1.7));
          ctx.moveTo(o.x + Math.cos(a) * d + r, o.y + Math.sin(a) * d * .62);
          ctx.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d * .62, r, 0, 6.2832);
        }
        ctx.fill();
      }
    },

    pluie: {
      nom: "pluie",
      titre: "Pluie",
      duree: [12, 150],          /* une averse d'un quart de minute, ou toute la partie */
      suites: { orage: 4, nuageux: 4, beau: 2, neige: 2 },
      fonte: 4,
      /* le ciel se couvre, et la pluie tombe bien de quelque part : ses nuages
         passent leur ombre sur l'herbe, comme ceux de l'orage mais plus doux */
      teinte: "rgba(40,60,90,.20)",
      ombres: { nombre: 6, rayonMin: 100, rayonMax: 190, vitesse: 38 },
      dessinerOmbre: function(ctx, o){
        ctx.fillStyle = "rgba(22,32,56,.20)";
        ctx.beginPath();
        for(var i = 0; i < 6; i++){
          var a = o.i + i * (6.2832 / 6);
          var d = o.r * (0.34 + 0.14 * Math.sin(o.i * 3 + i * 2.3));
          var r = o.r * (0.52 + 0.16 * Math.sin(o.i * 2 + i * 1.7));
          ctx.moveTo(o.x + Math.cos(a) * d + r, o.y + Math.sin(a) * d * .62);
          ctx.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d * .62, r, 0, 6.2832);
        }
        ctx.fill();
      },
      icone: function(ctx, x, y, r){
        nuage(ctx, x, y - r * .14, r, "#cfe3f7");
        ctx.strokeStyle = "#7fc4ff";
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        for(var i = -1; i <= 1; i++){
          ctx.beginPath();
          ctx.moveTo(x + i * r * .34, y + r * .34);
          ctx.lineTo(x + i * r * .34 - r * .12, y + r * .78);
          ctx.stroke();
        }
      },
      devant: function(ctx, L, H, t){
        var n = 90;
        ctx.strokeStyle = "rgba(220,238,255,.55)";
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        for(var i = 0; i < n; i++){
          var vx = 40 + bruit(i) * 40;          /* la pluie penche */
          var vy = 620 + bruit(i + 7) * 260;
          var x = (bruit(i + 1) * L + t * vx) % (L + 60) - 30;
          var y = (bruit(i + 3) * H + t * vy) % (H + 40) - 20;
          var lg = 12 + bruit(i + 5) * 10;
          ctx.moveTo(x, y);
          ctx.lineTo(x - lg * (vx / vy), y + lg);
        }
        ctx.stroke();
      }
    },

    /* La neige. Elle tombe pour de vrai, et elle laisse des plaques de glace
       sur lesquelles le chevalier GLISSE : il garde son elan au lieu de
       tourner net. Elle ne coute aucun coeur, comme les buissons et la haie. */
    neige: {
      nom: "neige",
      titre: "Neige",
      duree: [25, 150],
      suites: { nuageux: 4, beau: 3, pluie: 2 },
      teinte: "rgba(214,232,255,.20)",
      adherence: 0.12,                 /* 1 = on tourne net, moins = on glisse */
      /* les bestioles ont froid : elles ralentissent, et ca se voit */
      ralentit: 0.55,
      halo: "rgba(150,210,255,.55)",
      icone: function(ctx, x, y, r){
        ctx.strokeStyle = "#dff1ff";
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        for(var i = 0; i < 3; i++){
          var a = i * (Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(a) * r * .82, y - Math.sin(a) * r * .82);
          ctx.lineTo(x + Math.cos(a) * r * .82, y + Math.sin(a) * r * .82);
          ctx.stroke();
          /* les barbules, pour que ce soit un flocon et pas une etoile */
          for(var k = -1; k <= 1; k += 2){
            var bx = x + Math.cos(a) * r * .5 * k, by = y + Math.sin(a) * r * .5 * k;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a + 2.2 * k) * r * .3, by + Math.sin(a + 2.2 * k) * r * .3);
            ctx.stroke();
          }
        }
      },
      /* ⚠️ La neige S'ACCUMULE : une plaque toutes les quatre secondes tant
         qu'il neige. Une averse courte laisse deux plaques, une tempete qui
         dure en couvre le terrain. Et elles fondent au soleil, elles ne
         disparaissent pas d'un coup. */
      plaques: { chaque: 4, max: 26, rayonMin: 60, rayonMax: 130 },
      /* la plaque, dessinee au sol par le monde qui la porte */
      dessinerPlaque: function(ctx, q){
        ctx.fillStyle = "rgba(196,228,255,.55)";
        ctx.beginPath();
        for(var i = 0; i < 9; i++){
          var a = q.i + i * (6.2832 / 9);
          var r = q.r * (0.82 + 0.18 * Math.sin(q.i * 3 + i * 2.1));
          var x = q.x + Math.cos(a) * r, y = q.y + Math.sin(a) * r * .62;
          if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.lineWidth = 3;
        ctx.stroke();
      },
      devant: function(ctx, L, H, t){
        ctx.fillStyle = "rgba(255,255,255,.9)";
        for(var i = 0; i < 110; i++){
          var vy = 90 + bruit(i) * 90;
          var lateral = Math.sin(t * .8 + i) * 26;
          var x = (bruit(i + 2) * L + lateral + L) % L;
          var y = (bruit(i + 4) * H + t * vy) % (H + 30) - 15;
          var r = 1.6 + bruit(i + 6) * 2.6;
          ctx.globalAlpha = .55 + bruit(i + 8) * .45;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },

    /* L'orage. La pluie, plus la foudre qui frappe les bestioles. Elle
       previent une seconde avant de tomber, avec sa marque au sol, comme le
       herisson et le crapaud, et pour la meme raison. Elle ne touche jamais
       le chevalier : c'est un cadeau, pas un piege. */
    orage: {
      nom: "orage",
      titre: "Orage",
      duree: [15, 70],
      suites: { pluie: 5, nuageux: 3 },
      fonte: 4,
      teinte: "rgba(30,40,70,.34)",
      /* ⚠️ Un orage a des nuages, par definition : sans leur ombre au sol, il
         n'etait qu'un voile sombre uniforme. Elles sont plus grosses, plus
         sombres et plus rapides que celles d'un simple ciel nuageux — c'est ce
         qui fait la difference entre « il fait gris » et « ca va tomber ». */
      ombres: { nombre: 7, rayonMin: 110, rayonMax: 210, vitesse: 54 },
      dessinerOmbre: function(ctx, o){
        ctx.fillStyle = "rgba(14,20,40,.24)";
        ctx.beginPath();
        for(var i = 0; i < 6; i++){
          var a = o.i + i * (6.2832 / 6);
          var d = o.r * (0.34 + 0.14 * Math.sin(o.i * 3 + i * 2.3));
          var r = o.r * (0.52 + 0.16 * Math.sin(o.i * 2 + i * 1.7));
          ctx.moveTo(o.x + Math.cos(a) * d + r, o.y + Math.sin(a) * d * .62);
          ctx.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d * .62, r, 0, 6.2832);
        }
        ctx.fill();
      },
      foudre: { chaque: 2.4, preavis: 1, rayon: 95, degats: 14 },
      icone: function(ctx, x, y, r){
        nuage(ctx, x, y - r * .3, r, "#9fb2cc");
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.moveTo(x + r * .16, y + r * .1);
        ctx.lineTo(x - r * .24, y + r * .5);
        ctx.lineTo(x + r * .02, y + r * .5);
        ctx.lineTo(x - r * .14, y + r * .96);
        ctx.lineTo(x + r * .34, y + r * .34);
        ctx.lineTo(x + r * .08, y + r * .34);
        ctx.closePath();
        ctx.fill();
      },
      dessinerFoudre: function(ctx, f, reste){
        /* la marque au sol, qui se resserre : on voit venir le coup */
        var part = Math.max(0, Math.min(1, 1 - reste));
        ctx.strokeStyle = "rgba(255,240,150,.9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.rayon, 0, 6.2832);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,240,150,.28)";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.rayon * part, 0, 6.2832);
        ctx.fill();
      },
      dessinerEclair: function(ctx, f, age){
        var a = Math.max(0, 1 - age * 4);
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#fff6c8";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(f.x - 22, f.y - 420);
        ctx.lineTo(f.x + 14, f.y - 240);
        ctx.lineTo(f.x - 16, f.y - 150);
        ctx.lineTo(f.x + 6, f.y - 40);
        ctx.lineTo(f.x, f.y);
        ctx.stroke();
        ctx.globalAlpha = a * .8;
        ctx.fillStyle = "#fff6c8";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.rayon * .8, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
      },
      devant: function(ctx, L, H, t){
        TEMPS.pluie.devant(ctx, L, H, t);
      }
    },

    nuit: {
      nom: "nuit",
      titre: "Nuit",
      duree: [40, 120],
      suites: { beau: 4, nuageux: 3, pluie: 2 },
      /* ⚠️ Ce voile est peint sur le SOL, avant les bestioles. Mais assombrir
         le sol ne suffit pas : mesure a l'appui, le contraste entre l'herbe et
         un escargot tombait de 91 a 13, et la bestiole disparaissait sans
         jamais avoir ete assombrie. D'ou `contour` : un liseré clair autour de
         chaque bestiole, qui la redetache du fond.

         ⚠️ C'est un TRAIT, et il tire vers le blanc chaud, pas un disque bleu
         pale : elle a pris le premier halo pour un effet de gel, et elle avait
         raison, c'etait exactement la meme image que la glace. Un trait dit
         « eclaire par la lune », un disque bleu dit « pris dans la glace ». */
      teinte: "rgba(8,14,42,.58)",
      /* ⚠️ Plus de `contour`. Il existait parce que le voile etait peint SOUS
         les bestioles : assombrir le sol seul faisait disparaitre l'escargot
         sans jamais l'assombrir, et il fallait le relisérer. Maintenant que le
         voile passe par dessus tout, le lisere serait recouvert de toute
         facon — et surtout on veut justement ne PAS voir ce qui est loin. */

      /* ⚠️ « La nuit n'apporte rien a part le changement de couleur. » Elle
         avait raison : un voile uniforme et quatorze points, ce n'est pas une
         nuit, c'est un filtre. Ce qui fait une nuit, c'est d'avoir une SOURCE
         DE LUMIERE : le personnage porte une lanterne, l'herbe s'eclaire
         autour de lui, et le noir se referme au loin.

         Un degrade radial, pas un `globalCompositeOperation` : celui-la a deja
         perce le canvas entier une fois. */
      dessinerVoile: function(ctx, g, d, h, b, joueur){
        /* ⚠️ « Presque tout l'ecran a peine visible, mais seulement autour du
           perso dans un rayon acceptable pour un enfant. » Le voile est un
           degrade TRANSPARENT AU CENTRE : l'herbe garde ses vraies couleurs
           autour de lui, et le noir se referme au loin. Peindre du noir puis
           rajouter de la lumiere chaude par dessus, comme au premier essai,
           donnait un rond ambre et pas une clairiere.

           Le rayon clair vaut environ 170 unites, soit toute la largeur de
           l'ecran : l'enfant voit venir ce qui arrive de gauche et de droite,
           et c'est le haut et le bas qui se perdent dans le noir. */
        var portee = 310;
        var v = ctx.createRadialGradient(joueur.x, joueur.y, 0,
                                         joueur.x, joueur.y, portee);
        v.addColorStop(0, "rgba(8,14,42,0)");
        v.addColorStop(0.40, "rgba(8,14,42,.06)");
        v.addColorStop(0.62, "rgba(10,16,46,.50)");
        v.addColorStop(1, "rgba(6,10,32,.93)");
        ctx.fillStyle = v;
        ctx.fillRect(g, h, d - g, b - h);

        /* un souffle de lumiere chaude tout pres de lui : sa lanterne */
        var l = ctx.createRadialGradient(joueur.x, joueur.y, 0,
                                         joueur.x, joueur.y, 130);
        l.addColorStop(0, "rgba(255,226,150,.16)");
        l.addColorStop(1, "rgba(255,214,120,0)");
        ctx.fillStyle = l;
        ctx.fillRect(joueur.x - 130, joueur.y - 130, 260, 260);
      },

      /* les graines brillent dans le noir : la nuit devient un moment ou l'on
         voit mieux ce qu'on ramasse, pas seulement moins bien le reste */
      lueurGraine: "rgba(255,209,102,.22)",
      icone: function(ctx, x, y, r){
        /* ⚠️ Un croissant se dessine en DEUX ARCS, jamais avec
           `globalCompositeOperation`, qui perce le canvas entier : la lune
           avait troue le cadran et le decor derriere. */
        ctx.fillStyle = "#ffe9a8";
        ctx.beginPath();
        ctx.arc(x - r * .1, y, r * .82, Math.PI * 0.42, Math.PI * 1.58);
        ctx.arc(x + r * .34, y, r * .78, Math.PI * 1.42, Math.PI * 0.58, true);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * .62, y + r * .58, r * .13, 0, 6.2832);
        ctx.fill();
      },
      devant: function(ctx, L, H, t){
        /* ⚠️ Des lucioles qui VIVENT : elles vont par petites bandes, elles
           respirent, et chacune porte son halo. Quatorze points fixes de deux
           pixels ne se voyaient pas. */
        for(var i = 0; i < 26; i++){
          var bande = Math.floor(i / 6);
          var cx = bruit(bande * 7 + 3) * L;
          var cy = bruit(bande * 7 + 5) * H;
          var tour = t * (.5 + bruit(i) * .5) + i * 1.3;
          var loin = 34 + bruit(i + 3) * 70;
          var x = (cx + Math.cos(tour) * loin + Math.sin(t * .27 + i) * 26 + L * 2) % L;
          var y = (cy + Math.sin(tour * .8) * loin * .7 + Math.cos(t * .21 + i * 2) * 22 + H * 2) % H;
          var bat = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.7);
          var taille = 2 + bruit(i + 9) * 2;
          ctx.globalAlpha = .10 + .22 * bat;
          ctx.fillStyle = "#ffe066";
          ctx.beginPath(); ctx.arc(x, y, taille * 2.2, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = .35 + .5 * bat;
          ctx.fillStyle = "#fff6c8";
          ctx.beginPath(); ctx.arc(x, y, taille, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  return { TEMPS: TEMPS };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Meteo;
if(typeof globalThis !== "undefined") globalThis.Meteo = Meteo;
