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

  var TEMPS = {
    beau: {
      nom: "beau",
      titre: "Beau temps",
      poids: 30,
      duree: [40, 70]
    },

    pluie: {
      nom: "pluie",
      titre: "Pluie",
      poids: 35,
      duree: [30, 55],
      /* le ciel se couvre : le sol s'assombrit un peu, rien de plus */
      teinte: "rgba(40,60,90,.20)",
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

    nuit: {
      nom: "nuit",
      titre: "Nuit",
      poids: 35,
      duree: [35, 55],
      /* ⚠️ Ce voile est peint sur le SOL, avant les bestioles. Mais assombrir
         le sol ne suffit pas : mesure a l'appui, le contraste entre l'herbe et
         un escargot tombait de 91 a 13, et la bestiole disparaissait sans
         jamais avoir ete assombrie. D'ou `contour` : un halo clair pose
         derriere chaque bestiole, qui la redetache du fond. */
      teinte: "rgba(8,14,42,.58)",
      contour: "rgba(190,215,255,.55)",
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
