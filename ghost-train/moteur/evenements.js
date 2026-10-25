// Ce que la partie raconte à l'écran et au son, et les « moments » de la mission.
// Un moment (« goule », « surchauffe », « aiguillage »…) déclenche une fois par
// mission la réplique de la cheffe et la consigne qui lui correspondent ; la
// consigne s'efface dès que son moment de fin arrive.

/** @param {any} p @param {any} ev */
export function evt(p, ev) { p.evenements.push(ev); }

/** @param {any} p @param {string} nom */
export function son(p, nom) { p.evenements.push({ type: 'son', nom }); }

/** @param {any} p @param {string} nom */
export function moment(p, nom) {
  if (p.consigne && p.consigne.fin === nom) p.consigne = null;
  if (p.vus.has(nom)) return;
  p.vus.add(nom);
  const M = p.mission;
  const c = M.consignes && M.consignes[nom];
  if (c) p.consigne = { texte: c.texte, fin: c.fin };
  const r = M.radio && M.radio[nom];
  if (r) evt(p, { type: 'radio', texte: r });
}
