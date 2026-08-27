/* Moteur de dames internationales, le damier français : 10x10, 20 pions
   chacun, on ne joue que sur les cases sombres.

   Les règles qui comptent, et qui sont toutes appliquées :
   - la prise est obligatoire, et c'est la RAFLE LA PLUS LONGUE qui s'impose ;
   - le pion prend en avant comme en arrière, mais n'avance qu'en avant ;
   - la dame vole : elle glisse sur toute la diagonale, saute un pion adverse
     situé n'importe où devant elle et se pose n'importe où derrière lui ;
   - un pion déjà sauté ne peut pas être sauté deux fois et reste sur le
     damier jusqu'à la fin de la rafle, où il gêne le passage ;
   - un pion qui traverse la dernière rangée en cours de rafle sans s'y
     arrêter ne devient PAS dame.

   Le damier est un tableau de 100 cases, index 0 = coin haut gauche.
   Pièce : P pion blanc, D dame blanche, p pion noir, d dame noire. */
var MOTEUR_DAMES = (function(){
"use strict";

var N = 10;
var DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];

function dans(r, c){ return r >= 0 && r < N && c >= 0 && c < N; }
function sombre(i){ return ((Math.floor(i/N) + (i%N)) % 2) === 1; }
function estBlanc(p){ return p === "P" || p === "D"; }
function estDame(p){ return p === "D" || p === "d"; }
function camp(p){ return estBlanc(p) ? "blanc" : "noir"; }

function nouvelle(){
  var plateau = [];
  for(var i=0;i<N*N;i++) plateau.push(null);
  for(var j=0;j<N*N;j++){
    if(!sombre(j)) continue;
    var r = Math.floor(j/N);
    if(r < 4) plateau[j] = "p";
    else if(r > 5) plateau[j] = "P";
  }
  return { plateau:plateau, trait:"blanc", dernier:null };
}

function copie(e){
  return { plateau:e.plateau.slice(), trait:e.trait,
           dernier:e.dernier ? {de:e.dernier.de, vers:e.dernier.vers, etapes:e.dernier.etapes.slice()} : null };
}

/* Toutes les rafles possibles depuis la case i, la pièce étant déjà soulevée
   du damier. `deja` liste les pions sautés, qui restent en place et bloquent. */
function rafles(b, i, piece, deja){
  var out = [], r = Math.floor(i/N), c = i%N, d, dr, dc;

  for(d=0; d<4; d++){
    dr = DIRS[d][0]; dc = DIRS[d][1];

    if(!estDame(piece)){
      var vr = r+dr, vc = c+dc, ar = r+2*dr, ac = c+2*dc;
      if(!dans(ar, ac)) continue;
      var voisin = vr*N+vc, arrivee = ar*N+ac;
      if(!b[voisin] || camp(b[voisin]) === camp(piece)) continue;
      if(deja.indexOf(voisin) >= 0) continue;
      if(b[arrivee]) continue;
      ajouter(out, rafles(b, arrivee, piece, deja.concat([voisin])), arrivee, voisin);
      continue;
    }

    /* dame : on glisse sur les cases vides, puis on saute un pion adverse et
       on se pose sur n'importe quelle case vide derrière lui */
    var sr = r+dr, sc = c+dc;
    while(dans(sr, sc) && !b[sr*N+sc]){ sr += dr; sc += dc; }
    if(!dans(sr, sc)) continue;
    var saute = sr*N+sc;
    if(camp(b[saute]) === camp(piece) || deja.indexOf(saute) >= 0) continue;
    var pr = sr+dr, pc = sc+dc;
    while(dans(pr, pc) && !b[pr*N+pc]){
      var pose = pr*N+pc;
      ajouter(out, rafles(b, pose, piece, deja.concat([saute])), pose, saute);
      pr += dr; pc += dc;
    }
  }
  return out;
}

function ajouter(out, suites, arrivee, mange){
  if(suites.length === 0){
    out.push({ etapes:[arrivee], prises:[mange] });
    return;
  }
  for(var s=0; s<suites.length; s++)
    out.push({ etapes:[arrivee].concat(suites[s].etapes),
               prises:[mange].concat(suites[s].prises) });
}

function coups(e){
  var b = e.plateau, trait = e.trait, prises = [], simples = [], i, piece;

  for(i=0; i<N*N; i++){
    piece = b[i];
    if(!piece || camp(piece) !== trait) continue;
    b[i] = null;
    var seqs = rafles(b, i, piece, []);
    b[i] = piece;
    for(var s=0; s<seqs.length; s++)
      prises.push({ de:i, etapes:seqs[s].etapes, prises:seqs[s].prises });
  }

  /* prise obligatoire, et seulement les plus longues */
  if(prises.length){
    var max = 0;
    for(i=0;i<prises.length;i++) if(prises[i].prises.length > max) max = prises[i].prises.length;
    var gardees = [];
    for(i=0;i<prises.length;i++) if(prises[i].prises.length === max) gardees.push(prises[i]);
    return gardees;
  }

  for(i=0; i<N*N; i++){
    piece = b[i];
    if(!piece || camp(piece) !== trait) continue;
    var r = Math.floor(i/N), c = i%N;
    for(var d=0; d<4; d++){
      var dr = DIRS[d][0], dc = DIRS[d][1];
      if(!estDame(piece)){
        if(estBlanc(piece) ? dr !== -1 : dr !== 1) continue;
        var nr = r+dr, nc = c+dc;
        if(dans(nr, nc) && !b[nr*N+nc]) simples.push({ de:i, etapes:[nr*N+nc], prises:[] });
        continue;
      }
      var vr = r+dr, vc = c+dc;
      while(dans(vr, vc) && !b[vr*N+vc]){
        simples.push({ de:i, etapes:[vr*N+vc], prises:[] });
        vr += dr; vc += dc;
      }
    }
  }
  return simples;
}

function jouer(e, coup){
  var b = e.plateau, piece = b[coup.de], mangees = [];
  b[coup.de] = null;
  for(var i=0; i<coup.prises.length; i++){
    mangees.push(b[coup.prises[i]]);
    b[coup.prises[i]] = null;
  }
  var arrivee = coup.etapes[coup.etapes.length-1];
  b[arrivee] = piece;

  /* dame seulement si le pion S'ARRÊTE sur la dernière rangée */
  var r = Math.floor(arrivee/N);
  if(piece === "P" && r === 0) b[arrivee] = "D";
  if(piece === "p" && r === N-1) b[arrivee] = "d";

  e.dernier = { de:coup.de, vers:arrivee, etapes:coup.etapes.slice() };
  e.trait = e.trait === "blanc" ? "noir" : "blanc";
  return mangees;
}

function reste(e, camps){
  var n = 0;
  for(var i=0;i<N*N;i++) if(e.plateau[i] && camp(e.plateau[i]) === camps) n++;
  return n;
}

function vue(p){
  return { camp: camp(p), glyphe:"", dame: estDame(p) };
}

return {
  cle: "dames",
  nom: "Dames",
  taille: N,
  forme: "disque",
  toutesLesCases: false,
  caseJouable: sombre,

  nouvelle: nouvelle,
  copie: copie,
  trait: function(e){ return e.trait; },
  coups: coups,
  jouer: jouer,

  piece: function(e, i){ return e.plateau[i] ? vue(e.plateau[i]) : null; },
  vuePrise: vue,
  valeur: function(p){ return estDame(p) ? 3 : 1; },
  derniers: function(e){ return e.dernier ? [e.dernier.de, e.dernier.vers] : []; },

  alerte: function(){ return -1; },
  message: function(e){
    var qui = e.trait === "blanc" ? "blancs" : "noirs";
    var l = coups(e);
    if(l.length && l[0].prises.length)
      return "Aux " + qui + " : prise obligatoire";
    return "Aux " + qui + " de jouer";
  },
  aideBloquee: function(e){
    /* une pièce peut être immobile parce qu'une AUTRE doit prendre */
    var l = coups(e);
    return l.length > 0 && l[0].prises.length > 0;
  },
  motAide: function(n){
    return n === 1 ? "Une seule pièce peut prendre" : n + " pièces peuvent prendre";
  },

  fin: function(e){
    if(coups(e).length !== 0) return null;
    var perdant = e.trait;
    var gagnant = perdant === "blanc" ? "noirs" : "blancs";
    var sous = reste(e, perdant) === 0
      ? "Tous les pions " + (perdant === "blanc" ? "blancs" : "noirs") + " sont pris"
      : "Les " + (perdant === "blanc" ? "blancs" : "noirs") + " sont bloqués";
    return { titre:"Les " + gagnant + " gagnent", sous:sous, perdant:perdant };
  },
  glypheFin: function(fin){
    return '<span class="jeton-fin ' + (fin.perdant || "blanc") + '"></span>';
  },

  __essais: { nouvelle:nouvelle, copie:copie, coups:coups, jouer:jouer, sombre:sombre }
};
})();

if(typeof module !== "undefined") module.exports = MOTEUR_DAMES;
