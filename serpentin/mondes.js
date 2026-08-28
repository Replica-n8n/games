/* Serpentin : les mondes.

   Un monde, c'est tout ce qui distingue la prairie du volcan : le rayon de
   l'arene, la densite des fleurs, les couleurs, la forme des obstacles et les
   potions qu'on y trouve.

   Regle de frontiere : ajouter un monde doit couter un objet ICI et rien
   d'autre. Si un jour il faut toucher a moteur.js ou a index.html pour en
   ajouter un, c'est que quelque chose de propre a un monde a fuite ailleurs.

   Le moteur seme les obstacles a partir du descripteur `obstacles` avec sa
   propre graine : leurs positions doivent etre reproductibles. Leur dessin,
   lui, appartient au monde : c'est `dessinerObstacle`, en coordonnees ecran. */

var Mondes = (function(){
  "use strict";

  var prairie = {
    nom: "prairie",
    titre: "La prairie",
    rayon: 1400,
    fleurs: 1600,
    obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },
    bots: { depart: 8, max: 22, parScore: 400 },

    fond: "#83c766",
    sol: "#76bc57",
    ligne: "#68ac4c",
    haie: "#3f8a3a",
    ombre: "rgba(0,0,0,.20)",

    couleursFleurs: ["#fff6ad", "#ffffff", "#ff9ecb", "#ffd166",
                     "#fff6ad", "#ffffff", "#ffd166", "#ff9ecb"],
    couleurJoueur: "#2f7de0",
    ventreJoueur: "#7fc0ff",
    couleursBots: ["#e8493f", "#8e4ec6", "#f08a24", "#e0457b", "#1fa4a0"],

    potions: ["feu", "fantome", "aimant"],

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

  var tous = { prairie: prairie };

  return {
    prairie: prairie,
    tous: tous,
    liste: function(){ return Object.keys(tous).map(function(n){ return tous[n]; }); },
    ajouter: function(m){ tous[m.nom] = m; return m; }
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Mondes;
if(typeof globalThis !== "undefined") globalThis.Mondes = Mondes;
