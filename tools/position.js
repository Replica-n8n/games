const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "echecs", "index.html"), "utf8");
eval(html.slice(html.indexOf("/* ================= modele"), html.indexOf("/* ================= interface")));

const FILES = "abcdefgh";
const nom = i => FILES[i % 8] + (8 - Math.floor(i / 8));
function fromFen(fen){
  const [pos, side, castle, ep] = fen.split(" ");
  const board = [];
  for (const row of pos.split("/")) for (const ch of row) {
    if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) board.push(null); else board.push(ch);
  }
  return { board, side,
    castle:{K:castle.includes("K"),Q:castle.includes("Q"),k:castle.includes("k"),q:castle.includes("q")},
    ep: ep === "-" ? -1 : (8 - +ep[1]) * 8 + FILES.indexOf(ep[0]),
    last:null, over:null, result:null, check:false };
}

// position lue sur la capture : trait aux noirs, roi f7 en echec
const s = fromFen("2b2b2/5k2/7r/1PP2P1p/1pBQ2nP/rn2R3/8/2B1K3 b - - 0 1");

console.log("noirs en echec :", inCheck(s, "b"));
const lm = legalMoves(s);
console.log("coups legaux des noirs :", lm.length);
console.log(lm.map(m => s.board[m.from] + " " + nom(m.from) + "->" + nom(m.to)).join("  "));

const roi = kingSq(s, "b");
const duRoi = lm.filter(m => m.from === roi);
console.log("coups du ROI :", duRoi.length);

// pourquoi chaque case du roi est refusee
const r = Math.floor(roi/8), c = roi%8;
for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
  const nr = r+dr, nc = c+dc;
  if (nr<0||nr>7||nc<0||nc>7) continue;
  const to = nr*8+nc;
  if (s.board[to] && sideOf(s.board[to]) === "b") { console.log("  " + nom(to) + " : piece noire dessus"); continue; }
  const t = copy(s); playMove(t, {from:roi, to});
  console.log("  " + nom(to) + " : " + (inCheck(t,"b") ? "encore en echec" : "LIBRE"));
}
