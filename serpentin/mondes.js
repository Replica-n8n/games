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

  /* ⚠️ UN BRUIT ANCRE DANS LE MONDE, pas dans l'image. Une touffe d'herbe
     placee au hasard a chaque image nagerait sous les pieds du chevalier des
     qu'il avance. Celle-ci depend UNIQUEMENT des coordonnees de sa case : elle
     est donc toujours au meme endroit, sans qu'il faille garder une liste. */
  function bruit(x, y){
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  /* Parcourt les cases visibles, et rien d'autre. Le rectangle vient de la
     page : un monde ne dessine jamais ce qu'on ne voit pas. */
  function parCase(pas, g, d, h, b, faire){
    var x0 = Math.floor(g / pas) * pas, y0 = Math.floor(h / pas) * pas;
    for(var x = x0; x <= d + pas; x += pas){
      for(var y = y0; y <= b + pas; y += pas){
        faire(x, y, bruit(x, y), bruit(x + 7.3, y - 4.1));
      }
    }
  }

  var prairie = {
    nom: "prairie",
    titre: "La prairie",
    rayon: 1400,
    obstacles: { nombre: 90, rayonMin: 16, rayonMax: 30, loinDuCentre: 200 },

    /* `fond` remplit tout l'ecran, `sol` repeint le sol par dessus. Un monde
       qui pose `solBorne` fait decouper son sol au rayon de l'arene, et `fond`
       devient alors le DEHORS. La prairie ne le pose pas : son sol deborde. */
    fond: "#83c766",
    sol: "#76bc57",
    haie: "#3f8a3a",
    ombre: "rgba(0,0,0,.20)",

    /* Les bestioles ont leurs couleurs dans bestioles.js, le chevalier et ses
       armes dans armes.js : sombre et froid pour elles, clair et chaud pour
       lui, dans tous les mondes. Un monde ne decrit que son decor. */

    /* ⚠️ DE L'HERBE, et pas des buissons en miniature. Le damier tout seul
       donnait un tapis uniforme : « on dirait juste que tu as mis du vert ».
       Ce sont des BRINS — trois traits fins qui se courbent — et non des
       touffes rondes, parce qu'une touffe ronde et verte, c'est deja le
       buisson, qui lui RALENTIT quand on le traverse. Ce qui ne fait rien ne
       doit jamais ressembler a ce qui fait quelque chose.
       Ils ondulent tres lentement : assez pour que la prairie soit vivante,
       pas assez pour attirer l'oeil pendant qu'une bestiole approche. */
    dessinerDedans: function(ctx, g, d, h, b, t){
      /* ⚠️ Plus sombre que le premier essai (#69b352) : « je la vois presque
         pas ». A neuf points de luminance du sol, elle etait un souffle ; a
         vingt-cinq, c'est de l'herbe. Elle reste plus claire que le buisson,
         qui lui ralentit — ce qui fait quelque chose doit rester le plus
         marque. */
      ctx.strokeStyle = "#4f9a3c";
      ctx.lineCap = "round";
      parCase(78, g, d, h, b, function(x, y, a, c){
        var px = x + a * 78, py = y + c * 78;
        var vent = Math.sin(t * 0.7 + px * 0.01) * 2.2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(var k = -1; k <= 1; k++){
          var base = px + k * 5;
          ctx.moveTo(base, py + 4);
          ctx.quadraticCurveTo(base + k * 2 + vent * .5, py - 3,
                               base + k * 4 + vent, py - 9 - (k === 0 ? 3 : 0));
        }
        ctx.stroke();
      });
    },

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
    /* on passe DERRIERE : six fois le rayon du tronc, la hauteur du cocotier */
    obstaclesHauts: true,
    hauteurObstacle: 6.0,

    fond: "#2E7D9B",              /* la mer : DECOR, la bordure arrete avant */
    sol: "#E7D3A4",
    haie: "#F1E7CC",              /* l'ecume du rivage */
    ombre: "rgba(0,0,0,.20)",

    /* ⚠️ LE SABLE. Sans le damier, l'ile devenait un aplat beige ou plus rien
       ne defilait quand on avance : c'est exactement ce que le damier cachait.
       Des RIDES, comme le ressac en laisse, plus quelques coquillages. Les
       rides sont orientees toutes pareil, en arcs paralleles : c'est ce qui
       fait un bord de mer et pas un desert. */
    dessinerDedans: function(ctx, g, d, h, b, t){
      ctx.strokeStyle = "rgba(186,158,106,.55)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      parCase(86, g, d, h, b, function(x, y, a, c){
        var px = x + a * 86, py = y + c * 86;
        ctx.beginPath();
        ctx.moveTo(px - 26, py + 5);
        ctx.quadraticCurveTo(px, py - 7 - a * 5, px + 26, py + 5);
        ctx.stroke();
      });
      /* les coquillages : rares, un sur cinq cases, et jamais deux pareils */
      parCase(190, g, d, h, b, function(x, y, a, c){
        if(a < .55) return;
        var px = x + a * 190, py = y + c * 190;
        var r = 6 + c * 4;
        ctx.fillStyle = c > .5 ? "#F6EBD6" : "#EBD7B6";
        ctx.beginPath();
        ctx.arc(px, py, r, Math.PI * .1, Math.PI * 1.05);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(180,150,104,.6)";
        ctx.lineWidth = 1.4;
        for(var k = -1; k <= 1; k++){
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + k * r * .55, py + r * .8);
          ctx.stroke();
        }
      });
    },

    /* ⚠️ LA MER, et plus un aplat bleu : « on dirait juste que tu as mis du
       bleu ». Trois couches, de la plus lente a la plus vive :

         - des BANDES sombres qui derivent : c'est ce qui donne une profondeur,
           et une mer plate n'en a aucune ;
         - des CRETES d'ecume, courtes, decalees d'une rangee a l'autre pour
           qu'aucune ne s'aligne avec sa voisine ;
         - les memes cretes une seconde fois, plus pales et plus lentes, pour
           que la houle n'ait pas une seule cadence.

       Tout derive vers la droite ET monte legerement : deux mouvements
       differents se lisent comme de l'eau, un seul se lit comme un tapis qui
       defile. */
    dessinerDehors: function(ctx, g, d, h, b, t){
      /* les bandes profondes */
      ctx.fillStyle = "rgba(18,72,96,.30)";
      var haut = Math.floor((h - 120) / 120) * 120;
      for(var y = haut; y < b + 120; y += 120){
        var glisse = Math.sin(t * .25 + y * .01) * 26;
        ctx.beginPath();
        ctx.ellipse((g + d) / 2 + glisse, y + 30, (d - g), 26, 0, 0, 6.2832);
        ctx.fill();
      }
      /* les cretes */
      ctx.lineCap = "round";
      for(var couche = 0; couche < 2; couche++){
        ctx.strokeStyle = couche ? "rgba(255,255,255,.20)" : "rgba(226,244,250,.42)";
        ctx.lineWidth = couche ? 3 : 4;
        var vitesse = couche ? 9 : 17;
        parCase(96, g, d, h, b, function(x, y, a, c){
          if(a < (couche ? .55 : .35)) return;
          var px = x + ((a * 96 + t * vitesse) % 96);
          var py = y + c * 96 - (t * vitesse * .18) % 96;
          var lg = 16 + a * 20;
          ctx.beginPath();
          ctx.moveTo(px - lg, py);
          ctx.quadraticCurveTo(px, py - 7 - a * 4, px + lg, py);
          ctx.stroke();
        });
      }
    },

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
    /* un rocher est bas, mais on passe derriere lui quand meme : sinon le
       chevalier lui marche sur le dessus */
    obstaclesHauts: true,
    hauteurObstacle: 1.3,

    fond: "#C63C14",              /* la lave : DECOR, la bordure arrete avant */
    sol: "#3A3234",
    haie: "#1C1718",              /* la levre du cratere */
    ombre: "rgba(0,0,0,.35)",

    /* ⚠️ LE BASALTE. Sans le damier, le volcan devenait un aplat presque noir,
       le pire des trois : plus aucun repere pour juger une distance ni sentir
       qu'on avance. Une roche refroidie se lit a ses FENTES — un reseau de
       craquelures claires — et aux braises qui n'ont pas fini de s'eteindre au
       fond. Les braises pulsent tres lentement : le sol du volcan est encore
       chaud, et ca doit se sentir sans que rien ne bouge vraiment. */
    dessinerDedans: function(ctx, g, d, h, b, t){
      /* ⚠️ UN RESEAU, pas des etoiles. Premier essai : trois branches partant
         d'un meme point, repetees par case — ca donnait un semis de petits Y
         qui ne se touchaient jamais, et une roche craquelee, ce sont des
         fentes qui SE REJOIGNENT. Chaque case relie donc son point a celui de
         sa voisine de droite et de celle du dessous : le maillage se ferme
         tout seul, et il reste ancre dans le monde puisque les deux points
         viennent du meme bruit. */
      var P = 74;
      ctx.strokeStyle = "rgba(96,84,86,.7)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      parCase(P, g, d, h, b, function(x, y, a, c){
        var px = x + 12 + a * (P - 24), py = y + 12 + c * (P - 24);
        var dx = x + P + 12 + bruit(x + P, y) * (P - 24);
        var dy = y + 12 + bruit(x + P + 7.3, y - 4.1) * (P - 24);
        var bx = x + 12 + bruit(x, y + P) * (P - 24);
        var by = y + P + 12 + bruit(x + 7.3, y + P - 4.1) * (P - 24);
        ctx.moveTo(px, py); ctx.lineTo(dx, dy);
        ctx.moveTo(px, py); ctx.lineTo(bx, by);
      });
      ctx.stroke();
      /* les braises au fond des fentes */
      parCase(155, g, d, h, b, function(x, y, a, c){
        if(a < .42) return;
        var px = x + a * 155, py = y + c * 155;
        var pouls = .35 + .3 * Math.sin(t * 1.1 + a * 9);
        ctx.globalAlpha = pouls;
        ctx.fillStyle = "#B8481E";
        ctx.beginPath();
        ctx.ellipse(px, py, 12 + c * 8, 4 + c * 3, a * 3, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = pouls * .8;
        ctx.fillStyle = "#E8823A";
        ctx.beginPath();
        ctx.ellipse(px, py, 6 + c * 4, 2 + c * 1.5, a * 3, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    },

    /* ⚠️ LA LAVE, et plus un aplat rouge : « on dirait juste que tu as mis du
       rouge ». Quatre couches :

         - une croute sombre qui derive lentement, en plaques : c'est elle qui
           fait que la lave a une SURFACE et pas seulement une couleur ;
         - des veines claires entre les plaques, la ou la croute se fend ;
         - des BULLES qui grossissent, blanchissent, puis crevent — chacune sur
           son propre cycle, tire de sa case, sinon elles battraient ensemble
           comme un clignotant ;
         - des VOLUTES de fumee qui montent et s'effacent, en gris chaud.

       Une bulle qui creve ne laisse rien : la lave est du DECOR, elle est
       hors de l'arene et ne touche jamais personne. */
    dessinerDehors: function(ctx, g, d, h, b, t){
      /* ⚠️ LA CROUTE, EN PETITES PLAQUES. Premier essai : des ellipses de 50 a
         86 unites sur une grille de 150. Capture a l'appui, ca ne faisait pas
         une surface, ca faisait de gros pates sombres poses sur du rouge. Une
         croute se lit a son ECHELLE : beaucoup de petites plaques serrees,
         separees par des fentes claires. */
      ctx.fillStyle = "rgba(52,24,16,.36)";
      parCase(64, g, d, h, b, function(x, y, a, c){
        var px = x + a * 64 + Math.sin(t * .12 + a * 6) * 5;
        var py = y + c * 64 + Math.cos(t * .1 + c * 6) * 4;
        ctx.beginPath();
        ctx.ellipse(px, py, 13 + a * 11, 9 + c * 8, a * 3, 0, 6.2832);
        ctx.fill();
      });
      /* les fentes, la ou la croute se rompt : c'est par la qu'on voit le feu */
      ctx.strokeStyle = "rgba(255,206,110,.55)";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      parCase(64, g, d, h, b, function(x, y, a, c){
        if(a < .45) return;
        var px = x + c * 64, py = y + a * 64;
        ctx.beginPath();
        ctx.moveTo(px - 16, py);
        ctx.quadraticCurveTo(px, py + (c - .5) * 20, px + 18, py + 3);
        ctx.stroke();
      });
      /* les bulles : chacune sur son cycle */
      parCase(110, g, d, h, b, function(x, y, a, c){
        var cycle = 2.2 + a * 2.4;
        var m = ((t + a * 9.7) % cycle) / cycle;      /* 0 -> 1, puis elle creve */
        var px = x + a * 110, py = y + c * 110;
        var r = 4 + m * (7 + c * 8);
        if(m < .82){
          ctx.globalAlpha = .5 + m * .45;
          ctx.fillStyle = "#FF8A2B";
          ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = .45 + m * .5;
          ctx.fillStyle = "#FFD98A";
          ctx.beginPath(); ctx.arc(px - r * .25, py - r * .25, r * .45, 0, 6.2832); ctx.fill();
        }else{
          /* elle creve : un anneau qui s'ouvre et disparait */
          var ouvre = (m - .82) / .18;
          ctx.globalAlpha = (1 - ouvre) * .7;
          ctx.strokeStyle = "#FFD98A";
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(px, py, r * (1 + ouvre * 1.4), 0, 6.2832); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
      /* ⚠️ LES VOLUTES DE FUMEE. Premier essai : une par case de 230, a 30 %
         d'opacite — sur la capture, il n'y en avait pas une seule de visible.
         Une case de 160, quatre bouffees par volute et deux fois plus opaque :
         la fumee doit se voir, c'est ce qui a ete demande. Elle monte, elle
         s'ecarte, elle palit ; chaque volute a son propre cycle, tire de sa
         case, sinon elles souffleraient toutes ensemble. */
      parCase(160, g, d, h, b, function(x, y, a, c){
        var cycle = 5 + a * 4;
        var m = ((t + c * 11.3 + a * 3.1) % cycle) / cycle;
        var px = x + a * 160 + Math.sin(t * .5 + a * 5) * 14;
        var py = y + c * 160 - m * 130;
        for(var k = 0; k < 4; k++){
          /* elle nait en montant, elle meurt en s'ecartant */
          ctx.globalAlpha = Math.min(1, m * 4) * (1 - m) * .62 * (1 - k * .16);
          /* ⚠️ CENDRE CLAIRE, pas gris chaud. Au premier essai la fumee etait
             #7B655E : posee a faible opacite sur du rouge, elle rendait exactement
             la meme teinte brune que la croute, et sur la capture on ne
             distinguait pas l'une de l'autre. Une fumee se voit parce qu'elle
             est PLUS CLAIRE que ce qui brule. */
          ctx.fillStyle = k < 2 ? "#CFC3BC" : "#E4DCD6";
          ctx.beginPath();
          ctx.arc(px + Math.sin(m * 4 + k * 1.3) * (8 + k * 6), py - k * 20,
                  8 + m * 20 + k * 4, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
    },

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
