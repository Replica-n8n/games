// Dessins des meubles et des flèches d'annulation.

/** @typedef {import('../engine/types.js').FurnitureType} FurnitureType */

const S = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';

// Meubles d'une maquette, dans un carré de 48, contour sombre d'un seul
// tenant, volumes en aplats (clair dessus, sombre dessous) : pas de dégradés,
// car un même dessin revient des dizaines de fois dans la page. Ce qui est
// debout (armure, tonneau, armoire, sièges) est vu de face : vu de dessus,
// l'armure et le tonneau ressemblaient à des roues (vu par Julie). Ce qui est
// bas (table, lit, tapis, fontaine, piano) reste vu de dessus.
const T = '#2b1d17';
const L = ` stroke="${T}" stroke-width="1.4" stroke-linejoin="round"`;
const l = (/** @type {number} */ w = 1) => ` stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const BOIS = '#9a6538', BOIS_C = '#b98450', BOIS_F = '#6e4426', BOIS_FF = '#4f2f18';
const LIVRES = ['#b23a2a', '#2f6b8a', '#d9a13b', '#3f7a4a', '#7a4fb5', '#c2452a', '#e2d6bd', '#2f4b62'];

/** Une rangée de livres sur une étagère. @param {number} y bas de l'étagère @param {number} graine */
const livres = (y, graine) => {
  let x = 8, h = '', k = graine;
  while (x < 38) {
    const w = 2.6 + (k % 3) * 0.7, haut = 8 + ((k * 7) % 4);
    h += `<rect x="${x}" y="${y - haut}" width="${w}" height="${haut}" fill="${LIVRES[k % LIVRES.length]}"${l(0.6)}/>`;
    x += w + 0.4; k += 3;
  }
  return h;
};

/** @type {Record<FurnitureType, string>} */
const PATHS = {
  // Bibliothèque vue de face : deux rayons de livres.
  etagere: `<rect x="5" y="4" width="38" height="40" rx="1.5" fill="${BOIS_F}"${L}/><rect x="7.5" y="7" width="33" height="15" fill="${BOIS_FF}"/><rect x="7.5" y="25" width="33" height="15" fill="${BOIS_FF}"/>`
    + livres(22, 1) + livres(40, 4) + `<path d="M7.5 22h33M7.5 40h33" stroke="${BOIS_C}" stroke-width="1.6"/><path d="M5 4h38" stroke="${BOIS_C}" stroke-width="1"/>`,
  // Fauteuil de face : dossier, accoudoirs, coussin.
  fauteuil: `<path d="M10 22V10c0-4 3-6 14-6s14 2 14 6v12z" fill="#7a2f3a"${L}/><path d="M14 10c3-2 17-2 20 0" stroke="#a5495a" stroke-width="1.6" fill="none"/>`
    + `<rect x="5" y="19" width="9" height="20" rx="4" fill="#64242e"${L}/><rect x="34" y="19" width="9" height="20" rx="4" fill="#64242e"${L}/><rect x="12" y="24" width="24" height="13" rx="3" fill="#a5495a"${L}/><path d="M14 27h20" stroke="#c46a7a" stroke-width="1.4"/>`
    + `<path d="M9 39v5M39 39v5" ${l(2.4)}/>`,
  // Piano à queue vu de dessus : caisse noire, couvercle, clavier.
  piano: `<path d="M6 6h24c8 0 12 5 12 11 0 6-5 7-5 13s4 6 4 10c0 3-2 4-5 4H6z" fill="#17171a"${L}/><path d="M10 9h19c6 0 9 4 9 8" stroke="#4a4a52" stroke-width="1.4" fill="none"/>`
    + `<rect x="6" y="6" width="6" height="38" fill="#f4f1ea"${l(1)}/>` + [10, 15, 20, 25, 30, 35, 40].map((y) => `<rect x="6" y="${y - 1.2}" width="3.6" height="2.4" fill="#141414"/>`).join(''),
  // Canapé de face.
  canape: `<rect x="6" y="9" width="36" height="16" rx="4" fill="#2f4b62"${L}/><rect x="3" y="19" width="8" height="19" rx="3.5" fill="#26405a"${L}/><rect x="37" y="19" width="8" height="19" rx="3.5" fill="#26405a"${L}/>`
    + `<rect x="10" y="24" width="14" height="12" rx="2.5" fill="#56789a"${L}/><rect x="24" y="24" width="14" height="12" rx="2.5" fill="#56789a"${L}/><path d="M12 27h10M26 27h10" stroke="#7d9bba" stroke-width="1.4"/><path d="M8 38v5M40 38v5" ${l(2.4)}/>`,
  // Cheminée de face : manteau de pierre, foyer, bûches, flammes.
  cheminee: `<rect x="3" y="5" width="42" height="7" rx="1" fill="#b4ada3"${L}/><rect x="6" y="12" width="36" height="32" fill="#9a938a"${L}/><path d="M12 44V22c0-4 3-6 12-6s12 2 12 6v22z" fill="#231d1a"${L}/>`
    + `<path d="M6 20h6M6 28h6M6 36h6M36 20h6M36 28h6M36 36h6" stroke="#7d776f" stroke-width="1"/>`
    + `<path d="M15 41l18-3M15 38l18 3" ${l(3)} stroke="#6e4426"/>`
    + `<path d="M24 38c-5 0-7-3-7-6 0-4 5-5 6-10 3 3 8 5 8 10 0 3-2 6-7 6z" fill="#f08a2c"/><path d="M24 38c-2.4 0-3.4-1.6-3.4-3.2 0-2 2.4-2.8 3.2-5.2 1.6 1.6 3.6 2.8 3.6 5.2 0 1.6-1 3.2-3.4 3.2z" fill="#ffd36b"/>`,
  // Fourneau en fonte : plaques dessus, four devant.
  fourneau: `<rect x="4" y="4" width="40" height="22" rx="2" fill="#4a4e52"${L}/>` + [[14, 12], [34, 12], [14, 20], [34, 20]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.4" fill="#1c1e20" stroke="#7a7f84" stroke-width="1"/>`).join('')
    + `<rect x="4" y="26" width="40" height="18" rx="2" fill="#33363a"${L}/><rect x="10" y="30" width="28" height="11" rx="1.5" fill="#1c1e20" stroke="#7a7f84" stroke-width="1"/><path d="M15 33h18" stroke="#c9ced4" stroke-width="1.6" stroke-linecap="round"/>`,
  // Table vue de dessus : plateau, nappe, assiettes, bougeoir.
  table: `<rect x="3" y="9" width="42" height="30" rx="3" fill="${BOIS}"${L}/><path d="M3 16h42M3 24h42M3 32h42" stroke="${BOIS_F}" stroke-width=".8"/><rect x="14" y="9" width="20" height="30" fill="#efe7d6" stroke="#cfc4ad" stroke-width=".8"/>`
    + [[9, 16], [9, 32], [39, 16], [39, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#f7f4ee"${l(0.8)}/><circle cx="${x}" cy="${y}" r="2" fill="none" stroke="#c9c2b4" stroke-width=".6"/>`).join('')
    + `<circle cx="24" cy="24" r="3.2" fill="#c9a24a"${l(0.8)}/><circle cx="24" cy="24" r="1.2" fill="#fff3c4"/>`,
  // Chaise de face.
  chaise: `<rect x="14" y="4" width="20" height="20" rx="2" fill="${BOIS_F}"${L}/><path d="M18 8v13M24 8v13M30 8v13" stroke="${BOIS_C}" stroke-width="1.6"/><rect x="11" y="23" width="26" height="7" rx="2" fill="${BOIS}"${L}/><path d="M14 30v14M34 30v14" ${l(2.6)}/><path d="M14 30v14M34 30v14" stroke="${BOIS_F}" stroke-width="1.2"/>`,
  // Plante en pot, de face.
  plante: `<path d="M24 30C18 24 9 24 6 16c7 0 13 4 18 10" fill="#3a6e2f"${l(1)}/><path d="M24 30c6-6 15-6 18-14-7 0-13 4-18 10" fill="#3a6e2f"${l(1)}/><path d="M24 30C20 22 21 10 24 4c3 6 4 18 0 26" fill="#4f8a3f"${l(1)}/>`
    + `<path d="M24 30c-3-5-11-9-15-6 4 1 10 3 15 6M24 30c3-5 11-9 15-6-4 1-10 3-15 6" fill="#6aa84f"${l(0.8)}/>`
    + `<path d="M13 30h22l-3 14H16z" fill="#b4562e"${L}/><rect x="11" y="28" width="26" height="5" rx="1.5" fill="#c96a3c"${L}/>`,
  // Fontaine de face : bassin de pierre, vasque, jets d'eau.
  fontaine: `<path d="M4 34h40l-3 10H7z" fill="#b9b3a8"${L}/><path d="M4 34c0-3 2-4 4-4h32c2 0 4 1 4 4z" fill="#cfc9be"${L}/><path d="M8 33h32" stroke="#4f9cc0" stroke-width="2.4"/>`
    + `<path d="M21 30V20h6v10z" fill="#b9b3a8"${L}/><path d="M13 20c0-3 5-4 11-4s11 1 11 4c0 2-5 3-11 3s-11-1-11-3z" fill="#cfc9be"${L}/><path d="M16 19.5c3 1 13 1 16 0" stroke="#4f9cc0" stroke-width="1.8"/>`
    + `<path d="M24 16V6M24 8c-4 0-7 3-8 8M24 8c4 0 7 3 8 8M15 21c-3 1-5 5-6 9M33 21c3 1 5 5 6 9" stroke="#5aa6c8" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="24" cy="5" r="1.6" fill="#8fcde6"/>`,
  // Banc de bois, de face.
  banc: `<rect x="3" y="12" width="42" height="7" rx="1.5" fill="${BOIS}"${L}/><rect x="3" y="22" width="42" height="8" rx="1.5" fill="${BOIS_C}"${L}/><path d="M3 26h42" stroke="${BOIS}" stroke-width=".8"/><path d="M8 30v12M40 30v12M8 19v3M40 19v3" ${l(2.8)}/><path d="M8 30v12M40 30v12" stroke="${BOIS_F}" stroke-width="1.4"/>`,
  // Bureau vu de dessus : papiers, encrier, plume, lampe.
  bureau: `<rect x="2" y="8" width="44" height="32" rx="2" fill="${BOIS_F}"${L}/><rect x="4" y="10" width="40" height="28" fill="#2f5a3a"/><rect x="8" y="14" width="15" height="19" fill="#f4ecd8"${l(0.8)} transform="rotate(-7 15 23)"/><path d="M10 18h10M10 21h9M10 24h10M10 27h7" stroke="#8a7f6a" stroke-width=".8" transform="rotate(-7 15 23)"/>`
    + `<circle cx="32" cy="29" r="3" fill="#1c1c22"${l(0.8)}/><path d="M33 28l8-11" stroke="#f2efe9" stroke-width="1.6" stroke-linecap="round"/><circle cx="37" cy="16" r="4.6" fill="#e9c46a"${l(0.8)}/><circle cx="37" cy="16" r="2" fill="#fff3c4"/>`,
  // Tonneau de face : douelles et cercles de fer.
  tonneau: `<path d="M12 5h24c3 6 3 32 0 38H12c-3-6-3-32 0-38z" fill="#9a6538"${L}/><path d="M18 5c-1.6 8-1.6 30 0 38M24 5v38M30 5c1.6 8 1.6 30 0 38" stroke="${BOIS_F}" stroke-width="1"/>`
    + `<path d="M10.4 13h27.2M10.4 35h27.2" stroke="#4a4f57" stroke-width="2.6"/><path d="M10.4 13h27.2M10.4 35h27.2" stroke="#8a9099" stroke-width="1"/><ellipse cx="24" cy="5.5" rx="12" ry="2" fill="${BOIS_C}"${l(1)}/>`,
  // Coffre de face : couvercle bombé, ferrures, serrure.
  coffre: `<path d="M5 20c0-8 8-12 19-12s19 4 19 12z" fill="#8a5a33"${L}/><rect x="5" y="20" width="38" height="22" rx="1.5" fill="#7a4a26"${L}/><path d="M12 9.5V42M36 9.5V42" stroke="#4a4f57" stroke-width="2.4"/><path d="M5 20h38" stroke="#4a4f57" stroke-width="2"/>`
    + `<rect x="20" y="17" width="8" height="10" rx="1.5" fill="#d9b45a"${l(0.8)}/><circle cx="24" cy="21.5" r="1.3" fill="${T}"/><path d="M24 22v2.6" stroke="${T}" stroke-width="1"/>`,
  // Armure de face sur son socle : heaume à visière, épaulières, cuirasse.
  armure: `<g transform="translate(24 24) scale(1.12) translate(-24 -25)"><rect x="12" y="42" width="24" height="4" rx="1" fill="${BOIS_F}"${L}/><path d="M20 30v12M28 30v12" ${l(4)}/><path d="M20 30v12M28 30v12" stroke="#a9b0b8" stroke-width="2.4"/>`
    + `<path d="M13 18c0-3 4-5 11-5s11 2 11 5l-2 14H15z" fill="#a9b0b8"${L}/><path d="M24 15v16" stroke="#7d848c" stroke-width="1"/><path d="M17 22c4 2 10 2 14 0" stroke="#d9dde2" stroke-width="1.2" fill="none"/><rect x="15" y="29" width="18" height="3.5" rx="1" fill="#6e4426"${l(0.8)}/>`
    + `<ellipse cx="10.5" cy="18" rx="5.5" ry="4.5" fill="#8a9099"${L}/><ellipse cx="37.5" cy="18" rx="5.5" ry="4.5" fill="#8a9099"${L}/><path d="M8 21l-1.5 12M40 21l1.5 12" ${l(4)}/><path d="M8 21l-1.5 12M40 21l1.5 12" stroke="#a9b0b8" stroke-width="2.4"/>`
    + `<path d="M17 9c0-5 3-7 7-7s7 2 7 7v4H17z" fill="#c4cad1"${L}/><path d="M19 8h10" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/><path d="M24 2c2-2 6-1 7 2" stroke="#b23a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  // Buste romain couronné de laurier sur une colonne cannelée : le buste
  // blanc sur un socle rond évoquait des toilettes (vu par Julie).
  statue: `<rect x="12" y="43" width="24" height="4" rx="1" fill="#a39d93"${L}/><path d="M17.5 32h13v11h-13z" fill="#cfc9be"${L}/><path d="M20.8 33v9M24 33v9M27.2 33v9" stroke="#a39d93" stroke-width="1"/><rect x="14.5" y="29.5" width="19" height="3.5" rx="1" fill="#e6e2da"${L}/>`
    // La toge drapée sur l'épaule.
    + `<path d="M11 29.5c0-5.5 5-8.5 13-8.5s13 3 13 8.5z" fill="#ece8e1"${L}/><path d="M14 23.5c5 2 10 4 14 6M18 22c4 2.5 8 5 10.5 7.5" stroke="#bdb7ad" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M21.5 18.5h5v3.5h-5z" fill="#e2ded6"/>`
    // La tête : visage, boucles, couronne de laurier qui fait le tour du front.
    + `<path d="M18 11.5c0-4.6 2.7-7.5 6-7.5s6 2.9 6 7.5c0 4.2-2.6 7.5-6 7.5s-6-3.3-6-7.5z" fill="#f2efe9"${L}/>`
    + [[19.3, 6.8], [21.4, 4.9], [24, 4.2], [26.6, 4.9], [28.7, 6.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="#dcd7cf" stroke="#bdb7ad" stroke-width=".6"/>`).join('')
    + `<path d="M18.4 9.6c3.6-1.8 7.6-1.8 11.2 0" stroke="#4f7d3a" stroke-width="1.1" fill="none"/>`
    + [[18.9, 9.3, -35], [20.8, 8.4, -20], [22.8, 7.9, -8], [25.2, 7.9, 8], [27.2, 8.4, 20], [29.1, 9.3, 35]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="1.7" ry=".85" fill="#6aa04e" stroke="#2f4f22" stroke-width=".4" transform="rotate(${a} ${x} ${y})"/>`).join('')
    + `<path d="M21.2 11.6c.6-.4 1.4-.4 2 0M24.8 11.6c.6-.4 1.4-.4 2 0" stroke="#9a948a" stroke-width=".8" fill="none" stroke-linecap="round"/><path d="M24 12.2v3.2h1.1" stroke="#b9b3a8" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22.6 16.6h2.8" stroke="#b9b3a8" stroke-width=".8" stroke-linecap="round"/>`,
  // Armoire de face : deux portes à panneaux, corniche, pieds.
  armoire: `<rect x="5" y="2" width="38" height="5" rx="1" fill="${BOIS_FF}"${L}/><rect x="7" y="7" width="34" height="35" fill="${BOIS_F}"${L}/><path d="M24 7v35" stroke="${T}" stroke-width="1.2"/>`
    + `<rect x="10" y="10" width="11" height="13" rx="1" fill="#80522f" stroke="${BOIS_FF}" stroke-width="1"/><rect x="27" y="10" width="11" height="13" rx="1" fill="#80522f" stroke="${BOIS_FF}" stroke-width="1"/><rect x="10" y="26" width="11" height="13" rx="1" fill="#80522f" stroke="${BOIS_FF}" stroke-width="1"/><rect x="27" y="26" width="11" height="13" rx="1" fill="#80522f" stroke="${BOIS_FF}" stroke-width="1"/>`
    + `<circle cx="21.6" cy="24.5" r="1.2" fill="#d9b45a"/><circle cx="26.4" cy="24.5" r="1.2" fill="#d9b45a"/><path d="M9 42v4M39 42v4" ${l(2.6)}/>`,
  // Comptoir de face, bouteilles et verres dessus.
  comptoir: `<rect x="2" y="22" width="44" height="22" rx="1.5" fill="${BOIS_F}"${L}/><rect x="2" y="19" width="44" height="5" rx="1.5" fill="${BOIS_C}"${L}/><path d="M13 26v16M24 26v16M35 26v16" stroke="${BOIS_FF}" stroke-width="1"/>`
    + `<path d="M8 19v-9l1.5-2V4h2v4l1.5 2v9z" fill="#3f7a4a"${l(0.8)}/><path d="M16 19v-7l1.4-2V6h1.8v4l1.4 2v7z" fill="#8a2f2a"${l(0.8)}/><path d="M28 12h6l-1 7h-4z" fill="#c8e0e8"${l(0.8)}/><path d="M37 13h5l-.8 6h-3.4z" fill="#e9c46a"${l(0.8)}/>`,
  // Lit vu de dessus : tête de lit, oreillers, couverture repliée.
  lit: `<rect x="7" y="2" width="34" height="44" rx="3" fill="${BOIS_F}"${L}/><rect x="9" y="7" width="30" height="37" rx="2" fill="#efe9dc"/><rect x="10.5" y="8.5" width="13" height="9" rx="2" fill="#fbf8f2" stroke="#cfc6b4" stroke-width="1"/><rect x="24.5" y="8.5" width="13" height="9" rx="2" fill="#fbf8f2" stroke="#cfc6b4" stroke-width="1"/>`
    + `<rect x="9" y="20" width="30" height="24" rx="1.5" fill="#6f87a8"${l(0.8)}/><rect x="9" y="20" width="30" height="5" fill="#e3ddd0"/><path d="M14 30l6 6M26 30l6 6M14 38l4 4" stroke="#5a7090" stroke-width="1"/>`,
  // Banquette capitonnée, de face.
  banquette: `<rect x="4" y="12" width="40" height="13" rx="4" fill="#5a2222"${L}/><rect x="2" y="22" width="44" height="14" rx="4" fill="#7a2c2c"${L}/>` + [10, 18, 26, 34, 42].map((x) => `<circle cx="${x - 2}" cy="18.5" r="1" fill="#3a1414"/>`).join('')
    + `<path d="M5 26h38" stroke="#9a4040" stroke-width="1.4"/><path d="M8 36v7M40 36v7" ${l(2.6)}/>`,
  // Trône de face : haut dossier doré, coussin rouge.
  trone: `<path d="M11 30V8l4-5 4 4 5-5 5 5 4-4 4 5v22z" fill="#c9a24a"${L}/><path d="M15 28V11c3-2 15-2 18 0v17z" fill="#8a2f3a"${l(1)}/><circle cx="24" cy="8" r="1.8" fill="#b8323a"/>`
    + `<rect x="7" y="27" width="34" height="9" rx="2" fill="#c9a24a"${L}/><rect x="11" y="27" width="26" height="6" rx="2" fill="#a5495a"${l(0.8)}/><rect x="5" y="22" width="6" height="16" rx="2" fill="#b08a3a"${L}/><rect x="37" y="22" width="6" height="16" rx="2" fill="#b08a3a"${L}/><path d="M10 38v7M38 38v7" ${l(2.8)}/>`,
  // Transat vu de dessus : toile rayée sur cadre de bois.
  transat: `<rect x="12" y="2" width="24" height="44" rx="3" fill="${BOIS}"${L}/><rect x="15" y="5" width="18" height="38" fill="#f4f2ee"/>` + [7, 15, 23, 31, 39].map((y) => `<rect x="15" y="${y}" width="18" height="4" fill="#2f6b8a"/>`).join('') + `<path d="M12 22h24" stroke="${BOIS_F}" stroke-width="1.4"/>`,
  // Tabouret de face : assise ronde, trois pieds.
  tabouret: `<path d="M16 22l-4 22M32 22l4 22M24 22v22" ${l(2.8)}/><path d="M16 22l-4 22M32 22l4 22M24 22v22" stroke="${BOIS}" stroke-width="1.4"/><path d="M14 34h20" stroke="${BOIS_F}" stroke-width="1.6"/>`
    + `<ellipse cx="24" cy="20" rx="13" ry="5" fill="${BOIS_C}"${L}/><ellipse cx="24" cy="19" rx="9" ry="2.6" fill="#c99862"/>`,
  // Tapis à motif et franges.
  tapis: `<rect x="5" y="9" width="38" height="30" rx="1" fill="#8c2f3c"${L}/><rect x="9" y="13" width="30" height="22" fill="none" stroke="#e6c46e" stroke-width="1.4"/><path d="M24 16l7 8-7 8-7-8z" fill="#e6c46e"${l(0.8)}/><circle cx="24" cy="24" r="2" fill="#2f4b62"/>`
    + `<path d="M7 9V5M11 9V5M15 9V5M19 9V5M23 9V5M27 9V5M31 9V5M35 9V5M39 9V5M7 43v-4M11 43v-4M15 43v-4M19 43v-4M23 43v-4M27 43v-4M31 43v-4M35 43v-4M39 43v-4" stroke="#e9dcc0" stroke-width="1.2"/>`,
};

/** @param {FurnitureType} type @param {string} [cls] */
export const furnitureIcon = (type, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 48 48" aria-hidden="true">${PATHS[type]}</svg>`;

/** Flèches d'annuler et de rétablir. */
export const UNDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" ${S} stroke-width="2"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" ${S} stroke-width="2"/></svg>`;
export const REDO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5" ${S} stroke-width="2"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" ${S} stroke-width="2"/></svg>`;
