/* Les icônes des jeux, redessinées (2026-10-05) sur la recette de celle de La
   Bataille, la seule qui donnait envie : le HÉROS du jeu, vivant (des yeux, un
   geste), cerné d'un trait sombre épais, sur la couleur de son monde.
   Chaque dessin tient dans un carré de 512 ; `fond` est aussi le background_color
   de l'icône « maskable ». tools/icones-jeux.mjs s'en sert pour la planche et
   pour écrire <jeu>/icone.html. */

const K = "#120c08";
const trait = `stroke="${K}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"`;
const oeil = (x, y, r, dx = 3, dy = 2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.25}" fill="#fff" stroke="${K}" stroke-width="7"/><circle cx="${x + dx}" cy="${y + dy}" r="${r * 0.5}" fill="${K}"/>`;

export const ICONES = {
  serpentin: {
    nom: "Le chevalier", fond: "#5fae45",
    dessin: `
    <g fill="none" stroke="#3f8a33" stroke-width="9" stroke-linecap="round"><path d="M40 96l8-34M62 98v-38M84 96l-8-34M420 420l8-34M442 422v-38M464 420l-8-34M60 250l6-26M78 252v-30M430 150l6-26M448 152v-30"/></g>
    <ellipse cx="290" cy="462" rx="120" ry="20" fill="rgba(0,0,0,.2)"/>
    <path d="M250 262L176 440h170z" fill="#d8342c" ${trait}/>
    <path d="M256 380v64M330 380v64" stroke="${K}" stroke-width="34" stroke-linecap="round"/><path d="M256 380v60M330 380v60" stroke="#7a4a26" stroke-width="18" stroke-linecap="round"/>
    <rect x="228" y="250" width="132" height="150" rx="40" fill="#f6efe0" ${trait}/><path d="M294 288l26 32-26 32-26-32z" fill="#f2b632" stroke="${K}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M352 292L414 224" stroke="${K}" stroke-width="40" stroke-linecap="round"/><path d="M352 292L414 224" stroke="#f6efe0" stroke-width="20" stroke-linecap="round"/>
    <g transform="translate(418 220) rotate(-62)"><path d="M12 -15L150 -15L178 0L150 15L12 15Z" fill="#e6ecf5" ${trait}/><rect x="-8" y="-40" width="22" height="80" rx="8" fill="#f2b632" ${trait}/></g>
    <circle cx="418" cy="220" r="20" fill="#f6efe0" stroke="${K}" stroke-width="10"/>
    <path d="M290 110C292 52 366 38 404 72C362 72 336 92 324 124Z" fill="#e8452c" ${trait}/>
    <circle cx="292" cy="186" r="84" fill="#f2b632" ${trait}/><path d="M218 150a84 84 0 01148 0" fill="none" stroke="#ffd96b" stroke-width="10" stroke-linecap="round"/>
    <rect x="232" y="166" width="120" height="62" rx="28" fill="#2a1c12" stroke="${K}" stroke-width="8"/>
    ${oeil(266, 198, 15)}${oeil(318, 198, 15)}<path d="M246 172l34 10M338 172l-34 10" stroke="${K}" stroke-width="9" stroke-linecap="round"/>
    <path d="M186 452H74c-40 0-52-44-26-70l10 40c22 8 44 10 64 10z" fill="#5f74ad" ${trait}/>
    <path d="M58 392L42 338M82 392L92 336" stroke="${K}" stroke-width="10" stroke-linecap="round"/>${oeil(40, 330, 11, -2, 2)}${oeil(94, 328, 11, -2, 2)}
    <circle cx="138" cy="398" r="60" fill="#3a4f8f" ${trait}/><path d="M138 362a36 36 0 11-36 36 24 24 0 1124 24 12 12 0 11-12-12" fill="none" stroke="#a9bdf2" stroke-width="10" stroke-linecap="round"/>`,
  },
  toto: {
    nom: "Teeth of the Ocean", fond: "#063246",
    dessin: `
    <circle cx="390" cy="110" r="70" fill="#0b4f6c"/><g fill="#bfeff0"><circle cx="70" cy="90" r="9"/><circle cx="118" cy="150" r="6"/><circle cx="452" cy="250" r="8"/><circle cx="60" cy="300" r="5"/></g>
    <path d="M150 330C118 262 104 214 70 180C128 190 186 226 214 272Z" fill="#5f7686" ${trait}/>
    <path d="M92 512C98 330 222 156 410 92C436 214 410 370 300 512Z" fill="#7d93a3" ${trait}/>
    <path d="M196 512C214 400 300 280 404 184C410 316 376 420 300 512Z" fill="#eef3f6"/>
    <path d="M232 262C290 222 366 204 404 150C416 236 388 322 318 362C282 340 250 304 232 262Z" fill="#a8211b" ${trait}/>
    <path d="M250 304c20 22 44 40 68 52c20-12 38-30 52-52c-40 14-80 14-120 0z" fill="#e2574c"/>
    <g fill="#fff" stroke="${K}" stroke-width="6" stroke-linejoin="round"><path d="M244 258l22 30 12-38zM282 240l20 32 14-40zM320 224l18 32 16-40zM358 204l14 32 18-38z"/><path d="M262 312l24-4-8 26zM300 338l22-12 0 30zM344 330l16-20 10 30z"/></g>
    ${oeil(250, 196, 17, 4, 3)}<path d="M222 172l48 6" stroke="${K}" stroke-width="12" stroke-linecap="round"/>
    <path d="M168 372l44 30M184 344l44 30" stroke="#d8342c" stroke-width="14" stroke-linecap="round"/>
    <path d="M0 452Q64 420 128 452T256 452T384 452T512 452V512H0Z" fill="#0b6e8f"/><path d="M0 452Q64 420 128 452T256 452T384 452T512 452" fill="none" stroke="#bfeff0" stroke-width="12" stroke-linecap="round"/>
    <g fill="#bfeff0" stroke="${K}" stroke-width="6"><circle cx="86" cy="400" r="14"/><circle cx="40" cy="356" r="9"/><circle cx="436" cy="398" r="16"/><circle cx="474" cy="344" r="10"/></g>`,
  },
  "paper-race": {
    nom: "Paper Race", fond: "#f6efdc",
    dessin: `
    <g stroke="#a9c4e8" stroke-width="3">${[64, 128, 192, 256, 320, 384, 448].map((v) => `<path d="M${v} 0V512M0 ${v}H512"/>`).join("")}</g>
    <path d="M64 448L128 384L192 384L256 320" fill="none" stroke="#1b2a4a" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 20"/>
    <g fill="#1b2a4a"><circle cx="64" cy="448" r="13"/><circle cx="128" cy="384" r="13"/><circle cx="192" cy="384" r="13"/></g>
    <circle cx="448" cy="128" r="26" fill="none" stroke="#e03a2b" stroke-width="9" stroke-dasharray="14 10"/><path d="M372 204l52-52m0 0h-34m34 0v34" fill="none" stroke="#e03a2b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(262 300) rotate(-45)">
      <ellipse cx="0" cy="26" rx="150" ry="70" fill="rgba(27,42,74,.14)"/>
      <rect x="-150" y="-78" width="34" height="156" rx="10" fill="#1b2a4a" ${trait}/><rect x="118" y="-70" width="30" height="140" rx="10" fill="#1b2a4a" ${trait}/>
      <g fill="${K}"><rect x="-116" y="-98" width="76" height="44" rx="16"/><rect x="-116" y="54" width="76" height="44" rx="16"/><rect x="52" y="-92" width="68" height="40" rx="15"/><rect x="52" y="52" width="68" height="40" rx="15"/></g>
      <path d="M-128 -46H50C100 -40 150 -18 160 0C150 18 100 40 50 46H-128Z" fill="#e03a2b" ${trait}/>
      <path d="M-110 -20H40M-110 20H40" stroke="#ff8a70" stroke-width="8" stroke-linecap="round"/>
      <circle cx="-26" cy="0" r="40" fill="#1b2a4a" stroke="${K}" stroke-width="10"/><circle cx="-22" cy="0" r="26" fill="#ffd75e" stroke="${K}" stroke-width="8"/><path d="M-10 -14a22 22 0 010 28" fill="none" stroke="#1b2a4a" stroke-width="9" stroke-linecap="round"/>
    </g>`,
  },
  echecs: {
    nom: "Échecs et Dames", fond: "#7a5232",
    dessin: `
    <g fill="#d9b98a"><rect x="0" y="0" width="128" height="128"/><rect x="256" y="0" width="128" height="128"/><rect x="128" y="128" width="128" height="128"/><rect x="384" y="128" width="128" height="128"/><rect x="0" y="256" width="128" height="128"/><rect x="256" y="256" width="128" height="128"/><rect x="128" y="384" width="128" height="128"/><rect x="384" y="384" width="128" height="128"/></g>
    <ellipse cx="236" cy="452" rx="150" ry="24" fill="rgba(0,0,0,.28)"/>
    <path d="M150 400C156 322 214 296 204 236C176 250 140 246 128 222C150 160 212 102 286 98L298 56L330 104C392 144 380 306 322 400Z" fill="#f6efe0" ${trait}/>
    <path d="M300 130c26 40 30 90 16 140M286 98l-22 24" fill="none" stroke="#cdbf9f" stroke-width="10" stroke-linecap="round"/>
    <rect x="118" y="396" width="236" height="52" rx="18" fill="#f6efe0" ${trait}/>
    ${oeil(240, 168, 17, 4, 2)}<path d="M212 142l46 8" stroke="${K}" stroke-width="11" stroke-linecap="round"/><path d="M146 216c8 6 18 8 28 6" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/>
    <path d="M326 392v34c0 22 144 22 144 0v-34z" fill="#8f1d17" ${trait}/><ellipse cx="398" cy="392" rx="72" ry="26" fill="#c8362b" ${trait}/>
    <path d="M354 372l-8-58 34 28 18-40 18 40 34-28-8 58c-28 12-60 12-88 0z" fill="#f2b632" ${trait}/>`,
  },
};

export function page(id) {
  const { nom, fond, dessin } = ICONES[id];
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Icône de ${nom}</title><style>
html,body{margin:0;padding:0;background:#fff}
.icone,.masquable{width:512px;height:512px}
.icone svg,.masquable svg{display:block;width:512px;height:512px}
</style></head>
<body>
<!-- Écrit par tools/icones-jeux.mjs depuis tools/icones-dessins.mjs : ne pas le
     retoucher à la main. tools/chevalier-icones.mjs photographie .icone (192 et
     512) et .masquable (512), dont le fond est EXACTEMENT le background_color à
     donner au manifeste et dont le dessin tient dans le cercle central. -->
<div class="icone"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${fond}"/>${dessin}
</svg></div>
<div class="masquable"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${fond}"/>
  <g transform="translate(256 256) scale(.72) translate(-256 -256)"><clipPath id="c"><rect width="512" height="512" rx="60"/></clipPath><g clip-path="url(#c)"><rect width="512" height="512" fill="${fond}"/>${dessin}</g></g>
</svg></div>
</body></html>
`;
}
