import { nomCourt } from '../engine/decor.js';
// Tous les textes de l'app, en français. Une traduction future = un fichier
// de plus avec les mêmes clés.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

/** « A », « A et B », « A, B et C ». @param {string[]} xs */
export const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);

// Un nom dans une phrase : « Colonel Moran » devient « le colonel Moran »
// après une préposition, et les voyelles s'élident (« qu'Eugénie »).
const TITRES = [['Colonel ', 'le colonel '], ['Général ', 'le général '], ['Juge ', 'le juge '], ['Professeur ', 'le professeur '], ['Princesse ', 'la princesse '], ['Dr ', 'le Dr ']];
/** Le nom tel qu'on le dit au milieu d'une phrase. @param {string} name */
export const np = (name) => { for (const [t, a] of TITRES) if (name.startsWith(t)) return a + name.slice(t.length); return name; };
const voyelle = (/** @type {string} */ s) => /^[aeiouyhàâéèêëîïôöûü]/i.test(s);
/** Nom court sous un visage (engine/decor.js). */
export const court = nomCourt;
/** « que Céleste », « qu'Eugénie », « que le colonel Moran ». @param {string} name */
export const que = (name) => { const n = np(name); return voyelle(n) ? `qu'${n}` : `que ${n}`; };
/** « de Céleste », « d'Irene », « du colonel Moran ». @param {string} name */
export const de = (name) => { const n = np(name); return n.startsWith('le ') ? `du ${n.slice(3)}` : voyelle(n) ? `d'${n}` : `de ${n}`; };
/** « à Céleste », « au colonel Moran ». @param {string} name */
export const a = (name) => { const n = np(name); return n.startsWith('le ') ? `au ${n.slice(3)}` : `à ${n}`; };

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
  bureau: { name: 'Bureau', the: 'le bureau' },
  tonneau: { name: 'Tonneau', the: 'le tonneau' },
  coffre: { name: 'Coffre', the: 'le coffre' },
  armure: { name: 'Armure', the: "l'armure" },
  statue: { name: 'Statue', the: 'la statue' },
  armoire: { name: 'Armoire', the: "l'armoire" },
  comptoir: { name: 'Comptoir', the: 'le comptoir' },
  lit: { name: 'Lit', the: 'le lit' },
  banquette: { name: 'Banquette', the: 'la banquette' },
  trone: { name: 'Trône', the: 'le trône' },
  transat: { name: 'Transat', the: 'le transat' },
  tabouret: { name: 'Tabouret', the: 'le tabouret' },
  tapis: { name: 'Tapis', the: 'le tapis' },
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
  reserved: (cells, line, who) => `${few(cells)} ${agree(cells.length, 'est', 'sont')} sur ${line}, qui revient ${a(who)}.`,
  /** @param {string[]} cells @param {string} line @param {string} who */
  mustLine: (cells, line, who) => `${few(cells)} ${agree(cells.length, "n'est", 'ne sont')} pas sur ${line}, ${que(who)} doit occuper.`,
  /** @param {string[]} cells @param {string} who */
  absurd: (cells, who) => (cells.length > 3 ? `Sur ${cells.length} de ces cases` : `En ${list(cells)}`) + `, ${np(who)} n'aurait plus de place.`,
  /** @param {string} who @param {string[]} cells @param {string} line */
  confined: (who, cells, line) => `Pour ${np(who)}, il ne reste que ${list(cells)} : ${line} lui revient.`,
  /** @param {string} who @param {string} line @param {string} cell */
  onlyOneHere: (who, line, cell) => `Personne d'autre ${que(who)} ne peut occuper ${line}, et son témoignage n'y laisse plus que ${cell}.`,
  /** @param {string} who @param {string} line */
  onlyOne: (who, line) => `${who} est la seule personne qui peut encore occuper ${line}.`,
  /** @param {string} who @param {string} cell */
  reveal: (who, cell) => `${who} est en ${cell}.`,
};

/** Textes de l'interface. `data-t="cle"` dans le HTML les reçoit au démarrage. */
export const UI = {
  appName: 'Pièce à conviction',
  installer: "Installer l'app",
  aideIphone: 'Touchez Partager, puis « Sur l’écran d’accueil ».',
  aideAutre: 'Ouvrez le menu du navigateur, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
  nouvelleVersion: 'Nouvelle version disponible',
  recharger: 'Recharger',
  /** @param {string} v */
  version: (v) => `Version ${v}`,
  reprendre: 'Reprendre',
  conseillee: 'Enquête conseillée',
  sonActif: 'Son : activé',
  sonCoupe: 'Son : coupé',
  trophees: 'Trophées',
  /** @param {number} n */
  nouveauxTrophees: (n) => (n > 1 ? `${n} nouveaux trophées` : 'Nouveau trophée'),
  toutClasse: 'Toutes les affaires sont classées',
  rejouer: 'Rejouer',
  ouvrirDossier: 'Ouvrir le dossier',
  reprendreEnquete: "Reprendre l'enquête",
  scelle: 'scellé',
  /** @param {number} k @param {number} n */
  surN: (k, n) => `${k} sur ${n}`,
  /** @param {number} k @param {number} n */
  affairesClassees: (k, n) => `${k} affaire${k > 1 ? 's' : ''} classée${k > 1 ? 's' : ''} sur ${n}`,
  /** @param {number} k */
  apresChap: (k) => `Après le<br>chap. ${k}`,
  /** @param {number} k @param {string} titre */
  scelleTexte: (k, titre) => `Scellé : résolvez d'abord le chapitre ${k} de « ${titre} », l'histoire se suit.`,
  ouvrirEnquete: "Ouvrir l'enquête",
  retourPlan: 'Retour au plan',
  fermer: 'Fermer',
  classee: 'Classée',
  sansCollection: 'Enquêtes',
  /** @param {number} k @param {number} n */
  compte: (k, n) => `${k} sur ${n} résolue${k > 1 ? 's' : ''}`,
  enCours: 'En cours',
  dossier: 'Dossier',
  temps: 'Temps',
  indices: 'Indices',
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
  accuserQuestion: (victim) => `Le plan est complet et cohérent. Quelle personne se trouvait seule avec ${np(victim)} dans une pièce ?`,
  /** @param {number} n */
  chapitre: (n) => `Chapitre ${n}`,
  gagne: 'Affaire classée',
  /** @param {string} time @param {number} hints @param {number} [wrong] */
  bilan: (time, hints, wrong = 0) => `Résolue en ${time}, ${hints ? `${hints} indice${hints > 1 ? 's' : ''}` : 'sans indice'}${wrong ? `, ${wrong} innocent${wrong > 1 ? 's' : ''} accusé${wrong > 1 ? 's' : ''}` : ''}`,
  /** @param {string} time */
  record: (time) => `record ${time}`,
  suivante: 'Enquête suivante',
  toutes: 'Toutes les enquêtes',
  perdu: 'Un innocent en prison',
  /** @param {string} who @param {string} room @param {string} victim */
  perduTexte: (who, room, victim) => `${who} était ${room}, loin ${de(victim)}. Regardez qui partage la pièce de la victime.`,
  // Messages d'état
  depart: 'Choisissez une personne, puis touchez une case du plan.',
  /** @param {string} who */
  ou: (who) => `Où était ${np(who)} ? Touchez une case du plan.`,
  /** @param {string} who @param {string} cell @param {string} [ou] la pièce, comme dans la cuisine */
  place: (who, cell, ou) => `${who} est en ${cell}${ou ? `, ${ou}` : ''}.`,
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
  noter: (who) => `Crayon : touchez les cases où ${np(who)} pourrait être. Touchez encore pour effacer.`,
  /** @param {string} who @param {number} k */
  eclaire: (who, k) => (k === 1 ? `${who} : 1 case correspond à son témoignage.` : `${who} : ${k} cases correspondent à son témoignage.`),
  occupee: "Cette case est occupée : retirez d'abord le pion.",
  modeBarrer: 'Mode barrer : touchez une case pour noter que personne n\'y est.',
  rien: 'Aucun pion sur le plan pour l\'instant.',
  /** @param {number} ok @param {number} open */
  verifOk: (ok, open) => `${ok} témoignage${ok > 1 ? 's' : ''} respecté${ok > 1 ? 's' : ''}${open ? `, ${open} encore à confirmer` : ''}. Aucune ligne ni colonne en double.`,
  /** @param {string[]} noms @param {boolean} conflicts */
  verifKo: (noms, conflicts) => `${noms.length > 1 ? 'Témoignages contredits' : 'Témoignage contredit'} : ${list(noms)}${conflicts ? ". Et des personnes partagent une ligne ou une colonne" : ''}.`,
  verifConflits: 'Des personnes partagent une ligne ou une colonne.',
  recommence: 'Plan effacé. « Annuler » le remet tel quel.',
  annule: 'Action annulée.',
  retabli: 'Action rétablie.',
  rienAAnnuler: 'Rien à annuler.',
  rienARetablir: 'Rien à rétablir.',
  introuvable: "Cette enquête est introuvable.",
};

/** Une majuscule en tête de phrase. @param {string} s */
const maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** La scène d'accusation (ui/scene.js). */
export const SCENE = {
  titre: 'Accusation',
  innocent: 'Un innocent accusé',
  cri: 'Je vous<br>accuse&nbsp;!',
  seuls: 'seuls',
  /** @param {string} who @param {string} victim @param {string} room @param {boolean} [femmes] */
  preuve: (who, victim, room, femmes = false) => `${maj(np(who))} et ${np(victim)} étaient ${femmes ? 'seules' : 'seuls'} ${room}.`,
  faits: 'Ce qui s’est passé',
  clac: 'CLAC&nbsp;!',
  /** @param {string} who @param {boolean} fem */
  verrous: (who, fem) => `${maj(np(who))} est ${fem ? 'mise' : 'mis'} sous les verrous.`,
  /** @param {string} room */
  proteste: (room) => `Moi ? J'étais ${room} ! Vous n'avez rien compris.`,
  /** @param {string} victim */
  innocentTexte: (victim) => `Regardez qui partage la pièce ${de(victim)}. Ce faux pas comptera dans le bilan.`,
  continuer: 'Continuer',
  passer: 'Passer',
  classer: "Classer l'affaire",
  reflechir: 'Réfléchir encore',
};

/** Le tutoriel joué de la première enquête (ui/tuto.js). {premier} = le premier témoin. */
export const TUTO = {
  temoins: 'Voici les témoins. Touchez <b>{premier}</b> pour lire son témoignage.',
  placer: "Voici son témoignage. Sur le plan, les cases <b>éclairées en jaune</b> lui correspondent : touchez-en une.",
  regle: "Une seule personne par <b>ligne</b> et par <b>colonne</b>. Placez chacun d'après son témoignage ; le coupable sera celui qui était seul avec la victime.",
  aide: 'Bloqué ? <b>Indice</b> explique la prochaine déduction, <b>Vérifier</b> dit si un témoignage est contredit.',
  compris: 'Compris',
  aVous: 'À vous de jouer',
  passer: 'Passer',
};
