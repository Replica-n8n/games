const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "echecs", "index.html"), "utf8");
const start = html.indexOf("/* ================= modele");
const end = html.indexOf("/* ================= interface");
if (start < 0 || end < 0) throw new Error("marqueurs introuvables");
const model = html.slice(start, end);
eval(model);

function perft(s, depth) {
  const moves = legalMoves(s);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) {
    const t = copy(s);
    playMove(t, m);
    n += perft(t, depth - 1);
  }
  return n;
}

const expected = [20, 400, 8902, 197281];
let ok = true;
for (let d = 1; d <= 4; d++) {
  const got = perft(newState(), d);
  const good = got === expected[d - 1];
  if (!good) ok = false;
  console.log("perft(" + d + ") = " + got + "  attendu " + expected[d - 1] + "  " + (good ? "OK" : "ECHEC"));
}

// position "kiwipete" : roques, en passant, clouages
function fromFen(fen) {
  const [pos, side, castle, ep] = fen.split(" ");
  const board = [];
  for (const row of pos.split("/")) {
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) board.push(null);
      else board.push(ch);
    }
  }
  const files = "abcdefgh";
  return {
    board,
    side,
    castle: { K: castle.includes("K"), Q: castle.includes("Q"), k: castle.includes("k"), q: castle.includes("q") },
    ep: ep === "-" ? -1 : (8 - +ep[1]) * 8 + files.indexOf(ep[0]),
    last: null, over: null, check: false
  };
}
const kiwi = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
const kiwiExp = [48, 2039, 97862];
for (let d = 1; d <= 3; d++) {
  const got = perft(fromFen(kiwi), d);
  const good = got === kiwiExp[d - 1];
  if (!good) ok = false;
  console.log("kiwipete(" + d + ") = " + got + "  attendu " + kiwiExp[d - 1] + "  " + (good ? "OK" : "ECHEC"));
}

// position 3 : en passant et echecs
const p3 = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1";
const p3Exp = [14, 191, 2812, 43238];
for (let d = 1; d <= 4; d++) {
  const got = perft(fromFen(p3), d);
  const good = got === p3Exp[d - 1];
  if (!good) ok = false;
  console.log("pos3(" + d + ") = " + got + "  attendu " + p3Exp[d - 1] + "  " + (good ? "OK" : "ECHEC"));
}

console.log(ok ? "\nTOUT EST VERT" : "\nDES TESTS ECHOUENT");
process.exit(ok ? 0 : 1);
