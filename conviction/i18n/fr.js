// Tous les textes de l'app, en français. Une traduction future = un fichier
// de plus avec les mêmes clés.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

/** « A », « A et B », « A, B et C ». @param {string[]} xs */
export const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);

/** « que Céleste », « qu'Eugénie ». @param {string} name */
export const que = (name) => (/^[aeiouyhàâéèêëîïôöûü]/i.test(name) ? `qu'${name}` : `que ${name}`);

/** Au-delà de 3 cases, on compte au lieu d'énumérer. @param {string[]} xs */
const few = (xs) => (xs.length > 3 ? `${xs.length} cases` : list(xs));

/** @param {number} k @param {string} one @param {string} many */
const agree = (k, one, many) => (k > 1 ? many : one);

/** @type {Record<FurnitureType, { name: string, the: string }>} */
export const FURNITURE_NAMES = {
  etagere: { name: 'Étagère', the: "l'étagère" },
  piano: { name: 'Piano', the: 'le piano' },
  cheminee: { name: 'Cheminée', the: 'la cheminée' },
  fourneau: { name: 'Fourneau', the: 'le fourneau' },
  table: { name: 'Table', the: 'la table' },
  plante: { name: 'Plante', the: 'la plante' },
  fontaine: { name: 'Fontaine', the: 'la fontaine' },
  fauteuil: { name: 'Fauteuil', the: 'le fauteuil' },
  canape: { name: 'Canapé', the: 'le canapé' },
  chaise: { name: 'Chaise', the: 'la chaise' },
  banc: { name: 'Banc', the: 'le banc' },
};

/** @param {'row' | 'col'} line @param {number} index */
export const lineName = (line, index) => (line === 'row' ? `la ligne ${index + 1}` : `la colonne ${String.fromCharCode(65 + index)}`);

export const HINT = {
  /** @param {string} a @param {string} b @param {string} line */
  conflict: (a, b, line) => `${a} et ${b} partagent ${line}. Une seule personne par ligne et par colonne.`,
  /** @param {string} name */
  wrong: (name) => `${name} n'est pas à sa place. Retirez ce pion et reprenez son témoignage.`,
  complete: 'Le plan est complet. Regardez qui partage une pièce avec la victime, et avec personne d\'autre.',
  /** @param {string} name @param {string} cell */
  onlyCell: (name, cell) => `${name} : une seule case du plan correspond à son témoignage, ${cell}.`,
  /** @param {string} name @param {number} k @param {string} cell */
  onlyFree: (name, k, cell) => `${name} : des ${k} cases de son témoignage, seule ${cell} a encore sa ligne et sa colonne libres.`,
  /** @param {string} name @param {string[]} cells */
  leaves: (name, cells) => `${name} : son témoignage laisse ${cells.length > 6 ? `${cells.length} cases` : list(cells)}.`,
  /** @param {string} cell */
  remains: (cell) => `Reste ${cell}.`,
  /** @param {string[]} cells */
  taken: (cells) => `${few(cells)} ${agree(cells.length, 'est', 'sont')} sur une ligne ou une colonne déjà prise.`,
  /** @param {string[]} cells */
  clash: (cells) => `${few(cells)} ${agree(cells.length, 'contredirait', 'contrediraient')} un autre témoignage.`,
  /** @param {string[]} cells @param {string} line @param {string} who */
  reserved: (cells, line, who) => `${few(cells)} ${agree(cells.length, 'est', 'sont')} sur ${line}, qui revient à ${who}.`,
  /** @param {string[]} cells @param {string} line @param {string} who */
  mustLine: (cells, line, who) => `${few(cells)} ${agree(cells.length, "n'est", 'ne sont')} pas sur ${line}, ${que(who)} doit occuper.`,
  /** @param {string[]} cells @param {string} who */
  absurd: (cells, who) => (cells.length > 3 ? `Sur ${cells.length} de ces cases` : `En ${list(cells)}`) + `, ${who} n'aurait plus de place.`,
  /** @param {string} who @param {string[]} cells @param {string} line */
  confined: (who, cells, line) => `Pour ${who}, il ne reste que ${list(cells)} : ${line} lui revient.`,
  /** @param {string} who @param {string} line @param {string} cell */
  onlyOneHere: (who, line, cell) => `Personne d'autre ${que(who)} ne peut occuper ${line}, et son témoignage n'y laisse plus que ${cell}.`,
  /** @param {string} who @param {string} line */
  onlyOne: (who, line) => `${who} est la seule personne qui peut encore occuper ${line}.`,
  /** @param {string} who @param {string} cell */
  reveal: (who, cell) => `${who} est en ${cell}.`,
};

/** Textes de l'interface. `data-t="cle"` dans le HTML les reçoit au démarrage. */
export const UI = {
  dossier: 'Dossier',
  temps: 'Temps',
  indices: 'Indices',
  difficulte: 'Difficulté',
  /** @type {Record<string, string>} */
  niveaux: { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' },
  /** @param {number} n */
  taille: (n) => `Plan ${n} × ${n} · une personne par ligne et par colonne`,
  personneAPlacer: 'Personne à placer',
  mode: 'Mode',
  placer: 'Placer',
  crayon: 'Crayon',
  plus: 'Plus',
  barrer: 'Barrer',
  annuler: 'Annuler',
  retablir: 'Rétablir',
  indice: 'Indice',
  verifier: 'Vérifier',
  recommencer: 'Recommencer',
  temoignages: 'Témoignages',
  legende: 'Légende du plan',
  pieces: 'Pièces',
  meubles: 'Meubles',
  siege: 'siège',
  regles: "Règles de l'enquête",
  /** @param {string[]} blocking @param {string[]} seats */
  reglesListe: (blocking, seats) => [
    'Chaque ligne et chaque colonne contient exactement une personne.',
    `Personne ne peut se tenir sur un meuble hachuré${blocking.length ? ` : ${list(blocking)}` : ''}.`,
    `Les sièges${seats.length ? ` (${list(seats)})` : ''} peuvent être occupés. « Assis » veut dire sur un siège.`,
    "« À côté de » veut dire sur une case voisine, en haut, en bas, à gauche ou à droite, et dans la même pièce. Les murs épais séparent les pièces.",
    'Le coupable est la seule personne qui se trouve seule avec la victime dans une pièce.',
  ],
  aPlacer: 'à placer',
  conflit: 'conflit',
  /** @type {Record<string, string>} */
  verifie: { true: '✓', false: '✗', null: '?' },
  /**
   * @param {string} cell @param {string} room @param {string | null} furniture @param {string | null} who
   * @param {boolean} marked @param {string[]} notes @param {boolean} lit
   */
  caseLabel: (cell, room, furniture, who, marked, notes, lit) =>
    [cell, room, furniture, who ?? (marked ? 'barrée' : null), notes.length ? `notes : ${list(notes)}` : null, lit ? 'correspond au témoignage' : null].filter(Boolean).join(', '),
  accuser: 'Désignez le coupable',
  /** @param {string} victim */
  accuserQuestion: (victim) => `Le plan est complet et cohérent. Quelle personne se trouvait seule avec ${victim} dans une pièce ?`,
  gagne: 'Affaire classée',
  perdu: 'Un innocent en prison',
  /** @param {string} who @param {string} room @param {string} victim */
  perduTexte: (who, room, victim) => `${who} était dans la pièce « ${room} », loin de ${victim}. Regardez la pièce où se trouve la victime.`,
  // Messages d'état
  depart: 'Choisissez une personne, puis touchez une case du plan.',
  /** @param {string} who */
  ou: (who) => `Où était ${who} ? Touchez une case du plan.`,
  /** @param {string} who @param {string} cell */
  place: (who, cell) => `${who} est en ${cell}.`,
  /** @param {string} who */
  retire: (who) => `${who} : pion retiré. Choisissez une nouvelle case.`,
  /** @param {string} the */
  bloque: (the) => `Personne ne peut se tenir sur ${the}.`,
  choisirDabord: "Choisissez d'abord une personne.",
  retirerDabord: "Retirez d'abord le pion avant de barrer cette case.",
  /** @param {string} who */
  conflitPose: (who) => `${who} partage une ligne ou une colonne avec quelqu'un. Une seule personne par ligne et par colonne.`,
  complet: 'Le plan est cohérent. Désignez maintenant le coupable.',
  incoherent: 'Tout le monde est placé, mais au moins un témoignage n\'est pas respecté. Essayez « Vérifier ».',
  modePlacer: 'Mode placer : choisissez une personne, puis une case.',
  modeCrayon: 'Mode crayon : choisissez une personne, puis notez les cases où elle pourrait être.',
  /** @param {string} who */
  noter: (who) => `Crayon : touchez les cases où ${who} pourrait être. Touchez encore pour effacer.`,
  /** @param {string} who @param {number} k */
  eclaire: (who, k) => (k === 1 ? `${who} : 1 case correspond à son témoignage.` : `${who} : ${k} cases correspondent à son témoignage.`),
  occupee: "Cette case est occupée : retirez d'abord le pion.",
  modeBarrer: 'Mode barrer : touchez une case pour noter que personne n\'y est.',
  rien: 'Aucun pion sur le plan pour l\'instant.',
  /** @param {number} ok @param {number} open */
  verifOk: (ok, open) => `${ok} témoignage${ok > 1 ? 's' : ''} respecté${ok > 1 ? 's' : ''}${open ? `, ${open} encore à confirmer` : ''}. Aucune ligne ni colonne en double.`,
  /** @param {number} bad @param {boolean} conflicts */
  verifKo: (bad, conflicts) => `${bad} témoignage${bad > 1 ? 's' : ''} contredit${bad > 1 ? 's' : ''}${conflicts ? ', et des personnes partagent une ligne ou une colonne' : ''}.`,
  verifConflits: 'Des personnes partagent une ligne ou une colonne.',
  recommence: 'Plan effacé. « Annuler » le remet tel quel.',
  annule: 'Action annulée.',
  retabli: 'Action rétablie.',
  rienAAnnuler: 'Rien à annuler.',
  rienARetablir: 'Rien à rétablir.',
  introuvable: "Cette enquête est introuvable.",
};
