/* Serpentin : les mondes.

   Un monde, c'est tout ce qui distingue la prairie du volcan : le rayon de
   l'arene, la densite des fleurs, les couleurs, la forme des obstacles et les
   potions qu'on y trouve.

   Regle de frontiere : ajouter un monde doit couter un objet ICI et rien
   d'autre. Si un jour il faut toucher a moteur.js ou a index.html pour en
   ajouter un, c'est que quelque chose de propre a un monde a fuite ailleurs.

   Le moteur seme les obstacles a partir du descripteur `obstacles` avec sa
   propre graine : leurs positions doivent etre reproductibles. Leur dessin,
   lui, appartient au monde : c'est `dessinerObstacle`, en coordonnees monde. */

var Mondes = (function(){
  "use strict";

  var prairie = {
    nom: "prairie",
    titre: "La prairie",
    rayon: 1400,
    obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },

    /* `fond` remplit tout l'ecran, `sol` en repeint une case sur deux, et
       `solAlt` est l'autre case. Pour la prairie, solAlt VAUT fond : son
       rendu est donc exactement celui d'avant.
       Un monde qui pose `solBorne` fait decouper son sol au rayon de
       l'arene, et `fond` devient alors le DEHORS. La prairie ne le pose pas. */
    fond: "#83c766",
    solAlt: "#83c766",
    sol: "#76bc57",
    ligne: "#68ac4c",
    haie: "#3f8a3a",
    ombre: "rgba(0,0,0,.20)",

    /* Les bestioles ont leurs couleurs dans bestioles.js, le chevalier et ses
       armes dans armes.js : sombre et froid pour elles, clair et chaud pour
       lui, dans tous les mondes. Un monde ne decrit que son decor. */

    /* un buisson : cinq touffes et une eclaircie */
    dessinerObstacle: function(ctx, o, x, y, r){
      ctx.fillStyle = "rgba(0,0,0,.16)";
      ctx.beginPath();
      ctx.arc(x, y + r * .16, r * 1.02, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = "#3f8a3a";
      for(var k = 0; k < 5; k++){
        var a = o.i + k * 1.2566;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * .45, y + Math.sin(a) * r * .45, r * .56, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = "#57a94e";
      ctx.beginPath();
      ctx.arc(x - r * .2, y - r * .22, r * .4, 0, 6.2832);
      ctx.fill();
    }
  };


  /* ------------------------------------------------------------- l'ile */

  var ile = {
    nom: "ile",
    titre: "L'île",
    rayon: 1400,
    obstacles: { nombre: 55, rayonMin: 16, rayonMax: 24, loinDuCentre: 200 },
    obstaclesSolides: true,
    solBorne: true,

    fond: "#2E7D9B",              /* la mer : DECOR, la bordure arrete avant */
    solAlt: "#DFC996",
    sol: "#E7D3A4",
    ligne: "#CDB77F",
    haie: "#F1E7CC",              /* l'ecume du rivage */
    ombre: "rgba(0,0,0,.20)",

    /* Un cocotier fait six fois le rayon de son tronc en hauteur, donc plus
       que le chevalier, qui mesure 34 unites de large. C'est ce qui rend
       l'echelle credible en vue de dessus.
       ⚠️ Le tronc a une epaisseur de 2r : il REMPLIT le cercle qui bloque.
       Dessine plus fin, on butait sur du vide avant de toucher l'ecorce. */
    dessinerObstacle: function(ctx, o, x, y, r){
      var HAUTEUR = 6.0;
      var haut = y - r * HAUTEUR;

      ctx.fillStyle = "rgba(0,0,0,.18)";
      ctx.beginPath();
      ctx.ellipse(x + r * 1.5, y + r * .35, r * 2.6, r * .7, .35, 0, 6.2832);
      ctx.fill();

      ctx.strokeStyle = "#8A6A44";
      ctx.lineWidth = r * 1.95;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - r * 1.1, y - r * HAUTEUR * .55, x, haut);
      ctx.stroke();

      ctx.strokeStyle = "#9A7A50";
      ctx.lineWidth = r * 1.15;
      ctx.beginPath();
      ctx.moveTo(x - r * .55, y - r * HAUTEUR * .5);
      ctx.quadraticCurveTo(x - r * .75, y - r * HAUTEUR * .78, x, haut);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,.15)";
      ctx.lineWidth = Math.max(1, r * .14);
      for(var t = 0; t < 7; t++){
        var p = .12 + t * .12;
        var tx = x - Math.sin(p * 3.14) * r * 1.05;
        var ty = y + (haut - y) * p;
        var demi = r * (.95 - p * .35);
        ctx.beginPath();
        ctx.moveTo(tx - demi, ty);
        ctx.lineTo(tx + demi, ty);
        ctx.stroke();
      }

      var teintes = ["#2F7D46", "#3B9455", "#2A6E3E"];
      for(var k = 0; k < 9; k++){
        var a = o.i * .7 + k * (6.2832 / 9);
        var lg = r * (3.0 + ((k % 3) * .35));
        ctx.strokeStyle = teintes[k % 3];
        ctx.lineWidth = r * .62;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, haut);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * lg * .55, haut + Math.sin(a) * lg * .3 - r * 1.1,
          x + Math.cos(a) * lg,       haut + Math.sin(a) * lg * .6 + r * .9);
        ctx.stroke();
      }

      ctx.fillStyle = "#4AA463";
      ctx.beginPath();
      ctx.arc(x, haut, r * .62, 0, 6.2832);
      ctx.fill();

      ctx.fillStyle = "#6B4A2C";
      for(var n = 0; n < 3; n++){
        var an = o.i + n * 2.1;
        ctx.beginPath();
        ctx.arc(x + Math.cos(an) * r * .7, haut + Math.sin(an) * r * .45 + r * .55, r * .32, 0, 6.2832);
        ctx.fill();
      }
    }
  };

  /* ----------------------------------------------------------- le volcan */

  var volcan = {
    nom: "volcan",
    titre: "Le volcan",
    rayon: 1400,
    /* De GROS rochers, et moins nombreux : 45 blocs de 24 a 48 unites la ou
       la prairie seme 90 buissons de 16 a 30. Le chevalier fait 34 de large,
       donc les plus gros le depassent nettement. */
    obstacles: { nombre: 45, rayonMin: 24, rayonMax: 48, loinDuCentre: 200 },
    obstaclesSolides: true,
    solBorne: true,

    fond: "#C63C14",              /* la lave : DECOR, la bordure arrete avant */
    solAlt: "#332B2D",
    sol: "#3A3234",
    ligne: "#282122",
    haie: "#1C1718",              /* la levre du cratere */
    ombre: "rgba(0,0,0,.35)",

    /* Trois familles de rochers, tirees sur `o.i`. Une seule forme repetee
       quarante fois se voit tout de suite comme un motif ; trois familles
       plus une rotation et un aplatissement variables donnent un champ de
       pierres qui ne se repete pas a l'oeil. */
    dessinerObstacle: function(ctx, o, x, y, r){
      var famille = o.i % 3;
      var tourne = (o.i * 0.7) % 6.2832;
      var aplati = famille === 1 ? .62 : (famille === 2 ? 1.0 : .84);

      ctx.fillStyle = "rgba(0,0,0,.34)";
      ctx.beginPath();
      ctx.ellipse(x + r * .2, y + r * .3, r * 1.06, r * .8 * aplati, 0, 0, 6.2832);
      ctx.fill();

      function bloc(couleur, ech, dx, dy, cotes, graine){
        ctx.fillStyle = couleur;
        ctx.beginPath();
        for(var k = 0; k < cotes; k++){
          var a = tourne + k * (6.2832 / cotes);
          var bruit = ((k * 37 + graine * 61) % 100) / 100;
          var rr = r * ech * (.74 + bruit * .42);
          var px = x + dx + Math.cos(a) * rr;
          var py = y + dy + Math.sin(a) * rr * aplati;
          if(k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }

      if(famille === 2){
        bloc("#5A4E51", .70, -r * .32,  r * .12, 6, o.i);
        bloc("#6A5E61", .78,  r * .30, -r * .08, 7, o.i + 3);
        bloc("#867A7D", .40,  r * .18, -r * .30, 6, o.i + 9);
      }else{
        var cotes = famille === 1 ? 6 : 8;
        bloc("#6A5E61", 1.0, 0, 0, cotes, o.i);
        bloc("#867A7D", .60, -r * .18, -r * .22, cotes, o.i + 5);
        bloc("#A29699", .28, -r * .30, -r * .34, 5, o.i + 11);
      }

      /* la lave alentour leche le bas des pierres : sans ce lisere chaud, la
         roche pourrait etre de n'importe ou */
      ctx.strokeStyle = "rgba(214,84,26,.5)";
      ctx.lineWidth = Math.max(1.5, r * .1);
      ctx.beginPath();
      ctx.arc(x, y + r * .18 * aplati, r * .82, .5, 2.5);
      ctx.stroke();
    }
  };

  var tous = { prairie: prairie, ile: ile, volcan: volcan };

  return {
    prairie: prairie,
    ile: ile,
    volcan: volcan,
    tous: tous,
    liste: function(){ return Object.keys(tous).map(function(n){ return tous[n]; }); },
    ajouter: function(m){ tous[m.nom] = m; return m; }
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Mondes;
if(typeof globalThis !== "undefined") globalThis.Mondes = Mondes;
