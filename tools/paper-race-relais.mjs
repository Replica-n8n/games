// Paper Race : le relais en ligne, seul, sans navigateur.
// Usage : RELAIS=http://127.0.0.1:8787 node tools/paper-race-relais.mjs
//   (le relais tourne avec `npx wrangler dev` dans serveur-paper-race/)
// ou RELAIS=https://paper-race.<compte>.workers.dev pour la production.
const RELAIS = process.env.RELAIS || 'http://127.0.0.1:8787';
const ORIGINE = process.env.ORIGINE || 'https://replica-n8n.github.io';

let echecs = 0;
const verifier = (nom, ok, detail) => {
  console.log((ok ? 'ok    ' : 'ECHEC ') + nom + (!ok && detail !== undefined ? '  ' + JSON.stringify(detail) : ''));
  if (!ok) echecs++;
};
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
// ⚠️ contre le relais de PRODUCTION, un aller-retour prend bien plus longtemps
// qu'en local : sans ça, ces contrôles échouaient alors que tout marchait.
const LOIN = !/127\.0\.0\.1|localhost/.test(RELAIS);
const pause = (ms) => attendre(LOIN ? ms * 5 : ms);

// un client : garde tous les messages reçus
// regles : la version des règles que ce téléphone annonce (pr-4) ; sans, un téléphone d'avant
function client(code, jeton, regles) {
  const q = [jeton ? 'jeton=' + jeton : '', regles !== undefined ? 'regles=' + regles : ''].filter(Boolean).join('&');
  const ws = new WebSocket(RELAIS.replace(/^http/, 'ws') + `/salles/${code}/ws` + (q ? '?' + q : ''), { headers: { Origin: ORIGINE } });
  const recus = [];
  ws.addEventListener('message', (e) => recus.push(JSON.parse(e.data)));
  const ouvert = new Promise((ok, ko) => { ws.addEventListener('open', ok); ws.addEventListener('error', ko); });
  const ferme = new Promise((ok) => ws.addEventListener('close', (e) => ok(e.code)));
  return { ws, recus, ouvert, ferme, envoyer: (o) => ws.send(JSON.stringify(o)), dernier: (t) => recus.filter((m) => m.t === t).pop() };
}

const racine = await (await fetch(RELAIS + '/')).json();
verifier('le relais répond et dit sa version', /^pr-/.test(racine.paperRace || ''), racine);

const refus = await fetch(RELAIS + '/salles', { method: 'POST', headers: { Origin: 'https://ailleurs.example', 'content-type': 'application/json' }, body: JSON.stringify({ circuit: 'monza' }) });
verifier('un autre site ne peut pas créer de course', refus.status === 403, refus.status);

const cree = await (await fetch(RELAIS + '/salles', { method: 'POST', headers: { Origin: ORIGINE, 'content-type': 'application/json' }, body: JSON.stringify({ circuit: 'monza' }) })).json();
verifier('créer une course donne un code de 4 caractères et la place 0', /^[A-Z2-9]{4}$/.test(cree.code) && cree.siege === 0 && cree.jeton, cree);

const a = client(cree.code, cree.jeton); await a.ouvert; await pause(200);
const etatA = a.dernier('etat');
verifier('le créateur retrouve sa place et le circuit', etatA && etatA.siege === 0 && etatA.circuit === 'monza' && etatA.coups.length === 0, etatA);

const b = client(cree.code); await b.ouvert; await pause(200);
const etatB = b.dernier('etat');
verifier('le second arrivé prend la place 1 et reçoit son jeton', etatB && etatB.siege === 1 && /^[0-9a-f]{32}$/.test(etatB.jeton), etatB);
verifier('chacun sait que l autre est là', (a.dernier('presence') || {}).presents?.join() === 'true,true', a.dernier('presence'));

a.envoyer({ t: 'coup', n: 0, k: 7 }); await pause(200);
verifier('un coup est relayé aux deux', (b.dernier('coup') || {}).k === 7 && (a.dernier('coup') || {}).k === 7, b.recus);
b.envoyer({ t: 'coup', n: 0, k: 3 }); await pause(200);
verifier('un coup déjà joué est refusé, et l état renvoyé', b.dernier('etat').refuse === true && b.dernier('etat').coups.join() === '7', b.dernier('etat'));
a.envoyer({ t: 'coup', n: 1, k: 3 }); await pause(200);
verifier('on ne joue pas à la place de l autre', (a.dernier('etat') || {}).refuse === true, a.dernier('etat'));
b.envoyer({ t: 'coup', n: 1, k: 4 }); await pause(200);
verifier('chacun son tour', (a.dernier('coup') || {}).n === 1 && (a.dernier('coup') || {}).k === 4, a.dernier('coup'));

const intrus = client(cree.code); const codeIntrus = await intrus.ferme;
verifier('un troisième téléphone est refusé : la course est complète', codeIntrus === 4009 || (intrus.dernier('erreur') || {}).raison === 'complete', { codeIntrus, recus: intrus.recus });

b.ws.close(); await pause(300);
verifier('le départ de l un est annoncé à l autre', (a.dernier('presence') || {}).presents?.join() === 'true,false', a.dernier('presence'));
const b2 = client(cree.code, etatB.jeton); await b2.ouvert; await pause(200);
const etatB2 = b2.dernier('etat');
verifier('revenu avec son jeton, il retrouve sa place et la course', etatB2.siege === 1 && etatB2.coups.join() === '7,4', etatB2);

a.envoyer({ t: 'revanche', manche: 1 }); await pause(200);
const rev = b2.dernier('etat');
verifier('la revanche remet la course à zéro pour les deux', rev.revanche === true && rev.coups.length === 0 && rev.manche === 2, rev);
b2.envoyer({ t: 'revanche', manche: 1 }); await pause(200);
verifier('une revanche en double ne remet pas à zéro deux fois', b2.dernier('etat').manche === 2, b2.dernier('etat'));

const inconnue = client('ZZZZ'); const codeInconnu = await inconnue.ferme;
verifier('une course inconnue (ou expirée) est refusée proprement', codeInconnu === 4004, codeInconnu);

a.ws.close(); b2.ws.close();

/* ---------- pr-2 : de 2 à 6 places ---------- */
const creer = async (corps) => (await fetch(RELAIS + '/salles', { method: 'POST', headers: { Origin: ORIGINE, 'content-type': 'application/json' }, body: JSON.stringify(corps) })).json();
const mauvais = await fetch(RELAIS + '/salles', { method: 'POST', headers: { Origin: ORIGINE, 'content-type': 'application/json' }, body: JSON.stringify({ circuit: 'spa', places: 7 }) });
verifier('pr-2 : 7 places refusées', mauvais.status === 400, mauvais.status);
const six = await creer({ circuit: 'spa', places: 6, pieges: false });
const h = client(six.code, six.jeton); await h.ouvert; await pause(200);
const e0 = h.dernier('etat');
verifier('pr-2 : la salle dit ses 6 places, sans pièges, pas encore partie', e0.places === 6 && e0.pieges === false && e0.depart === null && e0.presents.length === 6, e0);
const j1 = client(six.code); await j1.ouvert;
const j2 = client(six.code); await j2.ouvert; await pause(250);
verifier('pr-2 : les arrivants prennent les places 1 et 2', j1.dernier('etat').siege === 1 && j2.dernier('etat').siege === 2, [j1.dernier('etat').siege, j2.dernier('etat').siege]);
j1.envoyer({ t: 'depart', manche: 1, grille: [0, 1, 2, 3, 4, 5] }); await pause(200);
verifier('pr-2 : seul l hôte lance la course', j1.dernier('etat').refuse === true && !j1.dernier('depart'), j1.dernier('etat'));
h.envoyer({ t: 'depart', manche: 1, grille: [0, 0, 1, 2, 3, 4] }); await pause(200);
verifier('pr-2 : une grille qui n est pas un tirage est refusée', h.dernier('etat').refuse === true, h.dernier('etat'));
h.envoyer({ t: 'coup', n: 0, k: 1, v: 0 }); await pause(200);
verifier('pr-2 : pas de coup avant le départ', (h.recus.filter((m) => m.t === 'etat').pop() || {}).refuse === true && !h.dernier('coup'));
h.envoyer({ t: 'depart', manche: 1, grille: [5, 4, 3, 2, 1, 0] }); await pause(200);
const dep = j2.dernier('depart');
verifier('pr-2 : départ relayé, places vides devenues fantômes', dep && dep.depart.grille.join() === '5,4,3,2,1,0' && dep.depart.fantomes.join() === '3,4,5', dep);
const tard = client(six.code); const codeTard = await tard.ferme;
verifier('pr-2 : on ne rejoint pas une course partie', codeTard === 4011, codeTard);
j1.envoyer({ t: 'coup', n: 0, k: 4, v: 2 }); await pause(200);
verifier('pr-2 : on ne joue pas la voiture d un autre', j1.dernier('etat').refuse === true && !j2.dernier('coup'), j1.dernier('etat'));
j1.envoyer({ t: 'coup', n: 0, k: 4, v: 3 }); await pause(200);
verifier('pr-2 : seul l hôte fait jouer les fantômes', j1.dernier('etat').refuse === true && !j2.dernier('coup'), j1.dernier('etat'));
h.envoyer({ t: 'coup', n: 0, k: 4, v: 3 }); await pause(200);
verifier('pr-2 : le coup d un fantôme par l hôte est relayé avec sa voiture', (j2.dernier('coup') || {}).v === 3 && j2.dernier('coup').k === 4, j2.dernier('coup'));
j1.envoyer({ t: 'coup', n: 1, k: 7, v: 1 }); await pause(200);
verifier('pr-2 : chacun joue sa voiture', (h.dernier('coup') || {}).v === 1 && h.dernier('coup').n === 1, h.dernier('coup'));
j2.envoyer({ t: 'coup', n: 2, k: 10, v: 1 }); await pause(200);
verifier('pr-2 : on ne fait pas abandonner un autre', j2.dernier('etat').refuse === true, j2.dernier('etat'));
h.envoyer({ t: 'coup', n: 2, k: 10, v: 2 }); await pause(200);
verifier('pr-2 : l hôte peut retirer un absent', (j1.dernier('coup') || {}).k === 10 && j1.dernier('coup').v === 2, j1.dernier('coup'));
j1.envoyer({ t: 'coup', n: 3, k: 11, v: 1 }); await pause(200);
verifier('pr-2 : un coup hors du pavé est refusé', j1.dernier('etat').refuse === true, j1.dernier('etat'));
h.envoyer({ t: 'revanche', manche: 1 }); await pause(200);
const r2 = j2.dernier('etat');
verifier('pr-2 : la revanche remet la grille à tirer', r2.revanche === true && r2.depart === null && r2.coups.length === 0 && r2.places === 6, r2);
/* ⚠️ celui qui REVIENT (rechargement) ne doit JAMAIS rater un coup. Le relais
   lisait l'état AVANT d'accepter la connexion : un coup joué entre les deux
   n'était ni dans l'état envoyé ni diffusé au revenant, qui restait un coup en
   retard pour toujours (vu en prod le 2026-09-19, sur un coup de fantôme). */
{
  const salle = await creer({ circuit: 'monzavrai', places: 4 });
  const hote = client(salle.code, salle.jeton); await hote.ouvert; await pause(200);
  const joueur = client(salle.code); await joueur.ouvert; await pause(300);
  const jetonJoueur = joueur.dernier('etat').jeton;
  hote.envoyer({ t: 'depart', manche: 1, grille: [0, 1, 2, 3] }); await pause(250);
  let n = 0, rates = 0, essais = 0;
  let revenant = joueur;
  for (let essai = 0; essai < 8; essai++) {
    revenant.ws.close(); await pause(120);
    hote.envoyer({ t: 'coup', n: n++, k: 4, v: 0 });            // un coup PENDANT qu'il revient
    revenant = client(salle.code, jetonJoueur);
    hote.envoyer({ t: 'coup', n: n++, k: 4, v: 2 });            // et un autre, juste après
    await revenant.ouvert; await pause(500);
    const e = revenant.dernier('etat');
    const vus = e.coups.length + revenant.recus.filter((m) => m.t === 'coup' && m.n >= e.coups.length).length;
    essais++;
    if (vus < n) rates++;
  }
  verifier('pr-3 : celui qui revient ne rate aucun coup joué pendant sa reconnexion', rates === 0, { rates, essais, n });
  revenant.ws.close(); hote.ws.close();
}

// ⚠️ le jeu ne joue plus ces salles depuis la v18, mais le relais les sert encore
// aux vieux téléphones : ce contrôle reste, comme le code du relais
const v7 = await creer({ circuit: 'ovale' });
const w = client(v7.code, v7.jeton); await w.ouvert; await pause(200);
verifier('pr-2 : une salle sans places reste une salle v7', w.dernier('etat').places === undefined && w.dernier('etat').presents.length === 2, w.dernier('etat'));
for (const c of [h, j1, j2, w]) c.ws.close();

// ---- pr-4 : une salle ne mélange pas deux versions des règles ----
// ⚠️ Chaque téléphone rejoue la course avec son moteur : en v16 un « coincé »
// laisse la voiture sur place, en v17 elle file dans le mur. Mélangés, les écrans
// divergeraient pour de bon.
{
  // Refusé = le relais dit « version » et ne donne AUCUNE place. ⚠️ On ne compte pas
  // sur la fermeture : elle arrive 10 s après le refus en local (mesuré), et un relais
  // qui accepte à tort laissait ce contrôle attendre sans fin (bloqué, pas rouge).
  const refuse = async (c) => {
    await c.ouvert.catch(() => { }); await pause(600);
    const r = { erreur: c.dernier('erreur'), place: (c.dernier('etat') || {}).siege };
    c.ws.close();
    return r;
  };
  const neuve = await creer({ circuit: 'monza', places: 2, regles: 2 });
  const h4 = client(neuve.code, neuve.jeton, 2); await h4.ouvert; await pause(200);
  verifier('pr-4 : le créateur entre avec ses règles, la salle les dit', (h4.dernier('etat') || {}).regles === 2, h4.dernier('etat'));
  const vieux = await refuse(client(neuve.code));
  verifier('pr-4 : un téléphone d avant (sans version) est refusé', vieux.erreur?.raison === 'version' && vieux.erreur?.regles === 2 && vieux.place === undefined, vieux);
  const autre = await refuse(client(neuve.code, undefined, 1));
  verifier('pr-4 : un téléphone d une autre version est refusé', autre.erreur?.raison === 'version' && autre.place === undefined, autre);
  const pareil = client(neuve.code, undefined, 2); await pareil.ouvert; await pause(200);
  verifier('pr-4 : la même version entre, à la place 1', (pareil.dernier('etat') || {}).siege === 1, pareil.dernier('etat'));
  const ancienne = await creer({ circuit: 'monza', places: 2 });
  const jeune = await refuse(client(ancienne.code, undefined, 2));
  verifier('pr-4 : une salle d avant refuse un téléphone récent', jeune.erreur?.raison === 'version' && jeune.erreur?.regles === 1 && jeune.place === undefined, jeune);
  const pair = client(ancienne.code, ancienne.jeton); await pair.ouvert; await pause(200);
  verifier('pr-4 : une salle d avant garde ses téléphones d avant', (pair.dernier('etat') || {}).siege === 0, pair.dernier('etat'));
  const nul = await fetch(RELAIS + '/salles', { method: 'POST', headers: { Origin: ORIGINE, 'content-type': 'application/json' }, body: JSON.stringify({ circuit: 'monza', regles: 'x' }) });
  verifier('pr-4 : une version illisible est refusée', nul.status === 400, nul.status);
  for (const c of [h4, pareil, pair]) c.ws.close();
}
console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nRELAIS OK');
process.exit(echecs ? 1 : 0);
