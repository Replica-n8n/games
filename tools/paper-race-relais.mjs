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

// un client : garde tous les messages reçus
function client(code, jeton) {
  const ws = new WebSocket(RELAIS.replace(/^http/, 'ws') + `/salles/${code}/ws` + (jeton ? '?jeton=' + jeton : ''), { headers: { Origin: ORIGINE } });
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

const a = client(cree.code, cree.jeton); await a.ouvert; await attendre(200);
const etatA = a.dernier('etat');
verifier('le créateur retrouve sa place et le circuit', etatA && etatA.siege === 0 && etatA.circuit === 'monza' && etatA.coups.length === 0, etatA);

const b = client(cree.code); await b.ouvert; await attendre(200);
const etatB = b.dernier('etat');
verifier('le second arrivé prend la place 1 et reçoit son jeton', etatB && etatB.siege === 1 && /^[0-9a-f]{32}$/.test(etatB.jeton), etatB);
verifier('chacun sait que l autre est là', (a.dernier('presence') || {}).presents?.join() === 'true,true', a.dernier('presence'));

a.envoyer({ t: 'coup', n: 0, k: 7 }); await attendre(200);
verifier('un coup est relayé aux deux', (b.dernier('coup') || {}).k === 7 && (a.dernier('coup') || {}).k === 7, b.recus);
b.envoyer({ t: 'coup', n: 0, k: 3 }); await attendre(200);
verifier('un coup déjà joué est refusé, et l état renvoyé', b.dernier('etat').refuse === true && b.dernier('etat').coups.join() === '7', b.dernier('etat'));
a.envoyer({ t: 'coup', n: 1, k: 3 }); await attendre(200);
verifier('on ne joue pas à la place de l autre', (a.dernier('etat') || {}).refuse === true, a.dernier('etat'));
b.envoyer({ t: 'coup', n: 1, k: 4 }); await attendre(200);
verifier('chacun son tour', (a.dernier('coup') || {}).n === 1 && (a.dernier('coup') || {}).k === 4, a.dernier('coup'));

const intrus = client(cree.code); const codeIntrus = await intrus.ferme;
verifier('un troisième téléphone est refusé : la course est complète', codeIntrus === 4009 || (intrus.dernier('erreur') || {}).raison === 'complete', { codeIntrus, recus: intrus.recus });

b.ws.close(); await attendre(300);
verifier('le départ de l un est annoncé à l autre', (a.dernier('presence') || {}).presents?.join() === 'true,false', a.dernier('presence'));
const b2 = client(cree.code, etatB.jeton); await b2.ouvert; await attendre(200);
const etatB2 = b2.dernier('etat');
verifier('revenu avec son jeton, il retrouve sa place et la course', etatB2.siege === 1 && etatB2.coups.join() === '7,4', etatB2);

a.envoyer({ t: 'revanche', manche: 1 }); await attendre(200);
const rev = b2.dernier('etat');
verifier('la revanche remet la course à zéro pour les deux', rev.revanche === true && rev.coups.length === 0 && rev.manche === 2, rev);
b2.envoyer({ t: 'revanche', manche: 1 }); await attendre(200);
verifier('une revanche en double ne remet pas à zéro deux fois', b2.dernier('etat').manche === 2, b2.dernier('etat'));

const inconnue = client('ZZZZ'); const codeInconnu = await inconnue.ferme;
verifier('une course inconnue (ou expirée) est refusée proprement', codeInconnu === 4004, codeInconnu);

a.ws.close(); b2.ws.close();
console.log(echecs ? `\n${echecs} ECHEC(S)` : '\nRELAIS OK');
process.exit(echecs ? 1 : 0);
