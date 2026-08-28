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
      poids: 30,
      duree: [40, 70],
      icone: function(ctx, x, y, r, t){ soleil(ctx, x, y, r, t); }
    },

    pluie: {
      nom: "pluie",
      titre: "Pluie",
      poids: 35,
      duree: [30, 55],
      /* le ciel se couvre : le sol s'assombrit un peu, rien de plus */
      teinte: "rgba(40,60,90,.20)",
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
      poids: 30,
      duree: [35, 55],
      teinte: "rgba(214,232,255,.20)",
      adherence: 0.12,                 /* 1 = on tourne net, moins = on glisse */
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
      plaques: { nombre: 14, rayonMin: 70, rayonMax: 130 },
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
      poids: 25,
      duree: [25, 40],
      teinte: "rgba(30,40,70,.34)",
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
      poids: 35,
      duree: [35, 55],
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
      contour: "rgba(255,244,214,.75)",
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
        /* quelques lucioles, pour que la nuit ait quelque chose a elle */
        ctx.fillStyle = "#ffe9a8";
        for(var i = 0; i < 14; i++){
          var x = (bruit(i) * L + Math.sin(t * .4 + i) * 40 + L) % L;
          var y = (bruit(i + 11) * H + Math.cos(t * .33 + i * 2) * 30 + H) % H;
          ctx.globalAlpha = .25 + .35 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7));
          ctx.beginPath();
          ctx.arc(x, y, 2.6, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  return { TEMPS: TEMPS };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Meteo;
if(typeof globalThis !== "undefined") globalThis.Meteo = Meteo;
