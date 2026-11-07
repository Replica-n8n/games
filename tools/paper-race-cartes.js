// Paper Race 1.12.0 : les règles des cartes de pilotage (moteur.js), une par une.
// Rapide (Node, sans navigateur). Le banc de difficulté est paper-race-pilotage.js.
const E = require('../paper-race/moteur.js');
let echecs = 0;
const verifier = (nom, ok, detail) => { console.log((ok ? 'ok    ' : 'ECHEC ') + nom + (!ok && detail !== undefined ? '  ' + JSON.stringify(detail) : '')); if (!ok) echecs++; };
function alea(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const r = alea(42);
const voiture = (v, trail) => ({ v, trail: trail || [[0, 0]], p: [5, 5], dehors: false });

// le sens : vers la droite, devant = accélère, derrière = freine, en haut = gauche
const d = voiture([2, 0]);
verifier('vers la droite : devant accélère, derrière freine', E.piloteCategorie(d, 1, 0) === 'accel' && E.piloteCategorie(d, 1, 1) === 'accel' && E.piloteCategorie(d, -1, 0) === 'frein');
verifier('vers la droite : en haut = Gauche, en bas = Droite', E.piloteCategorie(d, 0, -1) === 'gauche' && E.piloteCategorie(d, 0, 1) === 'droite');
verifier('le point du milieu est toujours « tout droit »', E.piloteCategorie(d, 0, 0) === 'tout');
const arret = voiture([0, 0], [[3, 9], [3, 7], [3, 7]]);
verifier("à l'arrêt : le sens du dernier coup (vers le haut)", E.piloteCategorie(arret, 0, -1) === 'accel' && E.piloteCategorie(arret, -1, 0) === 'gauche');
verifier("au départ, sans coup joué : vers le haut", E.piloteCategorie(voiture([0, 0]), 0, -1) === 'accel');

// la main et le paquet
const jeu = E.piloteNouveau(r);
verifier('une main de 5 cartes, 21 en tout', jeu.main.length === 5 && jeu.main.length + jeu.paquet.length + jeu.defausse.length === 21 && jeu.temp === 0);
const opts9 = () => { const o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) o.push({ p: [5 + dx, 5 + dy], dx, dy, ok: true }); return o; };
const sans = { paquet: [], main: ['gauche', 'gauche', 'gauche', 'gauche', 'froid'], defausse: [], temp: 0, adrenaline: -1 };
let o = E.piloteMarquer(opts9(), d, sans);
verifier("sans la carte : le point se joue quand même et chauffe", o.filter(x => x.force).length === 7 && o.every(x => x.ok));
verifier('avec la carte : le point la porte', o.find(x => x.dx === 0 && x.dy === -1).carte === 'gauche');
const chaud = Object.assign({}, sans, { temp: E.PILOTE_SURCHAUFFE });
o = E.piloteMarquer(opts9(), d, chaud);
verifier('surchauffe : accélérer sans la carte est bloqué', o.filter(x => x.chaud && !x.ok).length === 3);
verifier('surchauffe : freiner et tourner restent permis, sans coût', o.filter(x => x.secours).length === 4 && !o.some(x => x.force));
const seulsDevant = opts9().map(x => Object.assign(x, { ok: E.piloteCategorie(d, x.dx, x.dy) === 'accel' }));
o = E.piloteMarquer(seulsDevant, d, chaud);
verifier("jamais coincé par une carte : si seuls les points d'accélération restent, ils se rouvrent", o.some(x => x.ok));
verifier('dehors : aucune carte ne compte', E.piloteMarquer(opts9(), Object.assign(voiture([0, 0]), { dehors: true }), sans).every(x => !x.force && !x.carte));

// jouer
const j2 = { paquet: ['accel', 'accel', 'accel'], main: ['gauche', 'frein', 'froid', 'droite', 'droite'], defausse: [], temp: 2, adrenaline: -1 };
let res = E.piloteJouer(j2, { carte: 'gauche' }, voiture([3, 0]), r);
verifier('la carte jouée part et on repioche', res.carte === 'gauche' && j2.defausse.includes('gauche') && j2.main.length === 5 && j2.temp === 2);
res = E.piloteJouer(j2, { force: true, cat: 'accel' }, voiture([1, 0]), r);
verifier("un point forcé : +1, et pas de refroidissement le coup qu'on paie", res.force && !res.refroidi && j2.temp === 3);
res = E.piloteJouer(j2, { cat: 'tout' }, voiture([1, 0]), r);
verifier('rouler à 1 refroidit d\'un cran', res.refroidi && j2.temp === 2);
res = E.piloteJouer(j2, null, voiture([0, 0]), r);
verifier('coincé (aucun point) : la voiture arrêtée refroidit', res.refroidi && j2.temp === 1);
const j3 = { paquet: ['accel'], main: ['froid', 'frein', 'frein', 'frein', 'frein'], defausse: [], temp: 3, adrenaline: -1 };
verifier('Refroidir : -2, la carte part', E.piloteRefroidir(j3, r) === 2 && j3.temp === 1 && !j3.main.includes('froid') && j3.main.length === 5);
const j4 = { paquet: [], main: ['froid'], defausse: [], temp: 0, adrenaline: -1 };
verifier('Refroidir un moteur froid : rien ne se passe, la carte reste', E.piloteRefroidir(j4, r) === 0 && j4.main.includes('froid'));

// mille coups : aucune carte ne se perd ni ne se crée
const j5 = E.piloteNouveau(r); let ok = true;
for (let i = 0; i < 1000; i++) {
  const cat = ['accel', 'frein', 'gauche', 'droite', 'tout'][Math.floor(r() * 5)];
  const x = j5.main.includes(cat) ? { carte: cat, cat } : { force: cat !== 'tout' && j5.temp < 5, cat };
  E.piloteJouer(j5, x, voiture([Math.floor(r() * 3), 0]), r);
  if (r() < 0.2) E.piloteRefroidir(j5, r);
  if (j5.main.length + j5.paquet.length + j5.defausse.length !== 21 || j5.main.length !== 5 || j5.temp < 0 || j5.temp > 5) ok = false;
}
verifier('mille coups : toujours 21 cartes, 5 en main, température entre 0 et 5', ok, j5);

// l'adrénaline, sur une vraie course à deux
const ti = E.TRACKS.findIndex(t => t.id === 'monza');
const race = E.newRace(ti, 1, 'joueur');
race.cars[0].arc = 3; race.cars[1].arc = 10; race.cars[0].v = [0, -2]; race.cars[1].v = [0, -2];
const j6 = { paquet: [], main: [], defausse: [], temp: 3, adrenaline: -1 };
verifier('derrière : refroidit une fois', E.piloteAdrenaline(race, 0, j6) && j6.temp === 2);
verifier('pas deux fois dans le même coup (rechargement, annuler)', !E.piloteAdrenaline(race, 0, j6) && j6.temp === 2);
race.cars[0].coups++;
verifier('au coup suivant, encore', E.piloteAdrenaline(race, 0, j6) && j6.temp === 1);
verifier('devant : pas d\'adrénaline', !E.piloteDerriere(race, 1));
const gp = E.newRace(ti, 1, 'tour', { n: 4, regles: 'grille', grille: [0, 1, 2, 3] });
gp.cars[0].arc = 1; gp.cars[1].arc = 9;
verifier("à plus de deux voitures : pas d'adrénaline (l'aspiration fait ce travail)", !E.piloteDerriere(gp, 0));
verifier('élan : +1 dans le sens de la marche', E.piloteElan([3, -1]) + '' === '4,-1' && E.piloteElan([0, -2]) + '' === '0,-3' && E.piloteElan([-1, -1]) + '' === '-2,-1');
verifier('les règles en ligne ne changent pas (REGLES = 4)', E.REGLES === 4);

console.log(echecs ? `${echecs} ECHEC(S)` : 'CARTES OK');
process.exit(echecs ? 1 : 0);
