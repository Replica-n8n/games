/* Les bestioles.

   Regle de frontiere : ajouter une bestiole doit couter un objet ici, et rien
   d'autre. Ses chiffres et son dessin sont au meme endroit.

   `individu: true` veut dire qu'elle demande d'etre suivie une par une. A
   8 ans on suit trois objets en mouvement, pas plus : le moteur n'en laisse
   donc jamais plus de trois vivantes en meme temps. Tout le reste est de la
   foule, et une foule se lit comme une texture, pas comme des individus.

   Couleurs : sombre et froid, toujours. Le chevalier et ses armes sont clairs
   et chauds. C'est ce qui garde la foule lisible quand l'ecran se remplit. */

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

  var ESPECES = {
    escargot: {
      nom: "escargot",
      vie: 1, vitesse: 62, rayon: 11, xp: 1, individu: false, arrive: 0,
      couleur: "#3f4a6b",
      dessiner: function(ctx, b){
        var r = b.rayon;
        corps(ctx, b, this.couleur, r);
        /* la coquille : une spirale, ca se reconnait de loin */
        ctx.strokeStyle = "#8fa2d6";
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
      vie: 1, vitesse: 108, rayon: 9, xp: 2, individu: false, arrive: 60,
      couleur: "#2f5d63",
      onde: { amplitude: 1.1, vitesse: 5 },
      dessiner: function(ctx, b, t){
        var r = b.rayon;
        /* les ailes, qui battent */
        var bat = Math.abs(Math.sin(t * 22 + b.phase)) * .6 + .4;
        ctx.fillStyle = "rgba(210,235,240,.55)";
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.beginPath(); ctx.ellipse(-r * .2, -r * 1.1, r * .9, r * .5 * bat, -0.5, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-r * .2,  r * 1.1, r * .9, r * .5 * bat,  0.5, 0, 6.2832); ctx.fill();
        ctx.restore();
        corps(ctx, b, this.couleur, r);
        /* les rayures */
        ctx.strokeStyle = "#16323a";
        ctx.lineWidth = 2.2;
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
    }
  };

  return { ESPECES: ESPECES };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Bestioles;
if(typeof globalThis !== "undefined") globalThis.Bestioles = Bestioles;
