/* Moteur d'échecs. Règles complètes : roque, prise en passant, échec, mat,
   pat. Seule simplification assumée, la promotion donne toujours une dame.
   Vérifié par tools/perft.js contre les valeurs de référence connues.

   Le plateau est un tableau de 64 cases, index 0 = a8, 63 = h1.
   Une pièce est une lettre FEN, majuscule pour les blancs. */
var MOTEUR_ECHECS = (function(){
"use strict";

var VS = "︎"; /* force le rendu texte, pas emoji */
var GLYPH = {k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
var VALUE = {p:1,n:3,b:3,r:5,q:9,k:0};
var START = "rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR";

function newState(){
  return {
    board: START.split("").map(function(c){ return c === "." ? null : c; }),
    side: "w",
    castle: {K:true,Q:true,k:true,q:true},
    ep: -1,
    last: null,
    over: null,
    result: null,
    check: false
  };
}
function isW(p){ return p && p === p.toUpperCase(); }
function sideOf(p){ return isW(p) ? "w" : "b"; }
function copy(s){
  return {
    board: s.board.slice(),
    side: s.side,
    castle: {K:s.castle.K,Q:s.castle.Q,k:s.castle.k,q:s.castle.q},
    ep: s.ep,
    last: s.last,
    over: s.over,
    result: s.result,
    check: s.check
  };
}

var SLIDE = {r:[[1,0],[-1,0],[0,1],[0,-1]],
             b:[[1,1],[1,-1],[-1,1],[-1,-1]],
             q:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]};
var JUMP = {n:[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
            k:[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]};

function gen(s, side, attacksOnly){
  var b = s.board, out = [];
  for(var r=0;r<8;r++) for(var c=0;c<8;c++){
    var from = r*8+c, p = b[from];
    if(!p || sideOf(p) !== side) continue;
    var t = p.toLowerCase();
    if(t === "p"){
      var dir = side === "w" ? -1 : 1;
      var promoRow = side === "w" ? 0 : 7;
      for(var k=0;k<2;k++){
        var dc = k === 0 ? -1 : 1;
        var nr = r+dir, nc = c+dc;
        if(nr<0||nr>7||nc<0||nc>7) continue;
        var to = nr*8+nc;
        if(attacksOnly){ out.push({from:from,to:to}); continue; }
        if(b[to] && sideOf(b[to]) !== side) out.push({from:from,to:to,promo:nr===promoRow});
        else if(s.ep === to) out.push({from:from,to:to,ep:true});
      }
      if(attacksOnly) continue;
      var one = (r+dir)*8+c;
      if(r+dir>=0 && r+dir<8 && !b[one]){
        out.push({from:from,to:one,promo:(r+dir)===promoRow});
        var startRow = side === "w" ? 6 : 1;
        var two = (r+2*dir)*8+c;
        if(r === startRow && !b[two]) out.push({from:from,to:two,dbl:true});
      }
      continue;
    }
    if(JUMP[t]){
      var js = JUMP[t];
      for(var i=0;i<js.length;i++){
        var jr = r+js[i][0], jc = c+js[i][1];
        if(jr<0||jr>7||jc<0||jc>7) continue;
        var jt = jr*8+jc;
        if(b[jt] && sideOf(b[jt]) === side) continue;
        out.push({from:from,to:jt});
      }
    }
    if(SLIDE[t]){
      var ds = SLIDE[t];
      for(var d=0;d<ds.length;d++){
        var rr = r+ds[d][0], cc = c+ds[d][1];
        while(rr>=0 && rr<8 && cc>=0 && cc<8){
          var st = rr*8+cc;
          if(b[st]){
            if(sideOf(b[st]) !== side) out.push({from:from,to:st});
            break;
          }
          out.push({from:from,to:st});
          rr += ds[d][0]; cc += ds[d][1];
        }
      }
    }
    if(t === "k" && !attacksOnly){
      var home = side === "w" ? 60 : 4;
      var foe = side === "w" ? "b" : "w";
      if(from === home && !attacked(s, home, foe)){
        var rightsK = side === "w" ? s.castle.K : s.castle.k;
        var rightsQ = side === "w" ? s.castle.Q : s.castle.q;
        if(rightsK && !b[home+1] && !b[home+2] &&
           !attacked(s, home+1, foe) && !attacked(s, home+2, foe))
          out.push({from:from,to:home+2,castle:"K"});
        if(rightsQ && !b[home-1] && !b[home-2] && !b[home-3] &&
           !attacked(s, home-1, foe) && !attacked(s, home-2, foe))
          out.push({from:from,to:home-2,castle:"Q"});
      }
    }
  }
  return out;
}

function attacked(s, sq, bySide){
  var m = gen(s, bySide, true);
  for(var i=0;i<m.length;i++) if(m[i].to === sq) return true;
  return false;
}
function kingSq(s, side){
  var target = side === "w" ? "K" : "k";
  for(var i=0;i<64;i++) if(s.board[i] === target) return i;
  return -1;
}
function inCheck(s, side){
  var ks = kingSq(s, side);
  return ks >= 0 && attacked(s, ks, side === "w" ? "b" : "w");
}

function playMove(s, m){
  var b = s.board, p = b[m.from], captured = b[m.to];
  b[m.to] = p; b[m.from] = null;
  if(m.ep){
    var epSq = m.to + (sideOf(p) === "w" ? 8 : -8);
    captured = b[epSq];
    b[epSq] = null;
  }
  if(m.promo) b[m.to] = sideOf(p) === "w" ? "Q" : "q";
  if(m.castle){
    var home = sideOf(p) === "w" ? 60 : 4;
    if(m.castle === "K"){ b[home+1] = b[home+3]; b[home+3] = null; }
    else { b[home-1] = b[home-4]; b[home-4] = null; }
  }
  if(p === "K"){ s.castle.K = false; s.castle.Q = false; }
  if(p === "k"){ s.castle.k = false; s.castle.q = false; }
  if(m.from === 63 || m.to === 63) s.castle.K = false;
  if(m.from === 56 || m.to === 56) s.castle.Q = false;
  if(m.from === 7  || m.to === 7)  s.castle.k = false;
  if(m.from === 0  || m.to === 0)  s.castle.q = false;
  s.ep = m.dbl ? (m.from + m.to)/2 : -1;
  s.last = {from:m.from, to:m.to};
  s.side = s.side === "w" ? "b" : "w";
  return captured;
}

function legalMoves(s){
  var pseudo = gen(s, s.side, false), out = [];
  for(var i=0;i<pseudo.length;i++){
    var t = copy(s);
    playMove(t, pseudo[i]);
    if(!inCheck(t, s.side)) out.push(pseudo[i]);
  }
  return out;
}

/* ---------- adaptateur : ce que l'interface attend d'un jeu ---------- */
var CAMP = {w:"blanc", b:"noir"};
var COTE = {blanc:"w", noir:"b"};

function pieceVue(p){
  return { camp: CAMP[sideOf(p)], glyphe: GLYPH[p.toLowerCase()] + VS, dame: false };
}

return {
  cle: "echecs",
  nom: "Échecs",
  taille: 8,
  forme: "glyphe",
  toutesLesCases: true,

  nouvelle: newState,
  copie: copy,
  trait: function(e){ return CAMP[e.side]; },

  coups: function(e){
    var l = legalMoves(e), out = [], i, m, mange;
    for(i=0;i<l.length;i++){
      m = l[i];
      /* la prise en passant n enleve pas la piece de la case d arrivee :
         on la signale pour que l interface entoure le bon pion */
      mange = m.ep ? [m.to + (sideOf(e.board[m.from]) === "w" ? 8 : -8)] : [];
      out.push({de:m.from, etapes:[m.to], prises:mange, brut:m});
    }
    return out;
  },
  jouer: function(e, coup){
    var pris = playMove(e, coup.brut);
    return pris ? [pris] : [];
  },

  piece: function(e, i){ return e.board[i] ? pieceVue(e.board[i]) : null; },
  vuePrise: function(p){ return { camp: CAMP[sideOf(p)], glyphe: GLYPH[p.toLowerCase()] + VS, dame:false }; },
  valeur: function(p){ return VALUE[p.toLowerCase()]; },
  derniers: function(e){ return e.last ? [e.last.from, e.last.to] : []; },

  alerte: function(e){
    return inCheck(e, e.side) ? kingSq(e, e.side) : -1;
  },
  message: function(e){
    if(inCheck(e, e.side)) return "Échec au roi " + (e.side === "w" ? "blanc" : "noir");
    return "Aux " + (e.side === "w" ? "blancs" : "noirs") + " de jouer";
  },
  aideBloquee: function(e){ return inCheck(e, e.side); },
  motAide: function(n){
    return n === 1 ? "Une seule pièce peut parer l'échec" : n + " pièces peuvent parer l'échec";
  },

  fin: function(e){
    if(legalMoves(e).length !== 0) return null;
    if(inCheck(e, e.side)){
      var gagnant = e.side === "w" ? "noirs" : "blancs";
      return { titre:"Échec et mat", sous:"Les " + gagnant + " gagnent", perdant: CAMP[e.side] };
    }
    return { titre:"Pat", sous:"Aucun coup possible, partie nulle", perdant:null };
  },
  glypheFin: function(fin){
    if(!fin.perdant) return '<span class="roi-couche blanc">' + GLYPH.k + VS + '</span>'
                          + '<span class="roi-couche noir">' + GLYPH.k + VS + '</span>';
    return '<span class="roi-couche ' + fin.perdant + '">' + GLYPH.k + VS + '</span>';
  },

  /* pour tools/perft.js */
  __essais: { newState:newState, copy:copy, playMove:playMove, legalMoves:legalMoves,
              inCheck:inCheck, kingSq:kingSq, sideOf:sideOf }
};
})();

if(typeof module !== "undefined") module.exports = MOTEUR_ECHECS;
