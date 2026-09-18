const E = require('../circuit/moteur.js');
const S = require('fs');
const src = S.readFileSync(require('path').join(__dirname,'circuit-solveur.js'),'utf8');
const par = new Function('E', src.slice(src.indexOf('function par('), src.indexOf('// largeur minimale')) + '; return par;')(E);

function topo(tk) {
  const O = tk.outers[0];
  const trou = [], piste = [];
  for (let y = 0; y <= E.ROWS; y++) for (let x = 0; x <= E.COLS; x++) {
    if (E.onTrack(tk, x, y)) piste.push([x, y]);
    else if (x >= O[0] && x <= O[2] && y >= O[1] && y <= O[3]) trou.push([x, y]);
  }
  const k = p => p[0]+':'+p[1];
  const cx = (arr) => { const s = new Set(arr.map(k)); const v = new Set([k(arr[0])]); const st=[arr[0]];
    while(st.length){const [x,y]=st.pop(); for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=(x+a)+':'+(y+b); if(s.has(q)&&!v.has(q)){v.add(q);st.push([x+a,y+b]);}}}
    return v.size === arr.length; };
  let m = 99;
  for (let y=0;y<=E.ROWS;y++){let r=0;for(let x=0;x<=E.COLS;x++){if(E.onTrack(tk,x,y))r++;else{if(r>0&&r<m)m=r;r=0}}if(r>0&&r<m)m=r}
  for (let x=0;x<=E.COLS;x++){let r=0;for(let y=0;y<=E.ROWS;y++){if(E.onTrack(tk,x,y))r++;else{if(r>0&&r<m)m=r;r=0}}if(r>0&&r<m)m=r}
  const touche = trou.some(p=>p[0]===O[0]||p[0]===O[2]||p[1]===O[1]||p[1]===O[3]);
  return { trouConnexe: cx(trou), pisteConnexe: cx(piste), largeur: m, touche };
}

function course(ti, lvl, seed, pieges) {
  E.setPieges(!!pieges);
  let s = seed; const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff};
  const r = E.newRace(ti, 1);
  let coinces = 0, n = 0;
  while (r.winner === null && n < 300) {
    const q = E.aiChoice(r, lvl, rnd);
    if (q === null) { E.stuck(r); coinces++; } else E.play(r, q);
    E.nextTurn(r); n++;
  }
  return { fini: r.winner !== null, coups: r.winner !== null ? r.cars[r.winner].coups : null, coinces,
           crashes: r.cars[0].crashes + r.cars[1].crashes };
}

let fails = 0;
const check = (n, c) => { if (!c) { console.log('ECHEC: ' + n); fails++; } };

E.setPieges(false);
console.log('circuit'.padEnd(15),'largeur trou piste depart  options-depart  par');
const pars = [];
for (let i = 0; i < E.TRACKS.length; i++) {
  const tk = E.TRACKS[i], t = topo(tk);
  const r = E.newRace(i, 1);
  const o0 = E.choices(r).filter(c=>c.ok).length;
  r.turn = 1;
  const o1 = E.choices(r).filter(c=>c.ok).length;
  const p = par(tk); pars.push(p);
  // le par affiche au joueur doit etre celui que le solveur trouve
  check(tk.nom + ' : par affiche ' + tk.par + ', calcule ' + p, p === tk.par);
  check(tk.nom + ' : ilots d un seul bloc', t.trouConnexe);
  check(tk.nom + ' : ilots loin du bord', !t.touche);
  check(tk.nom + ' : piste d un seul tenant', t.pisteConnexe);
  check(tk.nom + ' : couloir de 5 cases au moins', t.largeur >= 5);
  console.log(tk.nom.padEnd(15), String(t.largeur).padEnd(7), String(t.trouConnexe).padEnd(4),
    String(t.pisteConnexe).padEnd(5), String(E.startCells(tk).map(c=>c.join(','))).padEnd(8),
    (o0+' et '+o1).padEnd(15), p);
}
console.log('pars =', JSON.stringify(pars));

console.log('\ncircuit'.padEnd(16),'niveau'.padEnd(11),'finies','coups-moy','coinces','sorties');
for (let i = 0; i < E.TRACKS.length; i++) {
  for (const lvl of ['tranquille','normal','rapide']) {
    let f=0,c=0,co=0,cr=0,N=10;
    for (let s=1;s<=N;s++){const r=course(i,lvl,s*7919,false); if(r.fini){f++;c+=r.coups;} co+=r.coinces; cr+=r.crashes;}
    check(E.TRACKS[i].nom + ' ' + lvl + ' : l ordinateur finit toutes ses courses', f === N);
    console.log(E.TRACKS[i].nom.padEnd(16), lvl.padEnd(11), (f+'/'+N).padEnd(6),
      (f?(c/f).toFixed(1):'-').padStart(9), String(co).padStart(7), String(cr).padStart(7));
  }
}
console.log('\navec pieges');
for (let i = 0; i < E.TRACKS.length; i++) {
  let f=0,co=0,N=10;
  for (let s=1;s<=N;s++){const r=course(i,'rapide',s*7919,true); if(r.fini)f++; co+=r.coinces;}
  check(E.TRACKS[i].nom + ' avec pieges : l ordinateur finit', f === N);
  console.log(E.TRACKS[i].nom.padEnd(16), 'finies', f+'/'+N, 'coinces', co);
}
console.log(fails === 0 ? 'CIRCUITS OK' : fails + ' ECHEC(S)');
process.exitCode = fails ? 1 : 0;
