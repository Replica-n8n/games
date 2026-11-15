import { fig, trone } from '../crownfall/dessin.js';
import { writeFileSync } from 'node:fs';
// Judith (Dame de Cœur) dans l'arche de son trône, sur la nuit de la salle.
const dessin = (fond, k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${fond}"/>
  <g transform="translate(256 262) scale(${k}) translate(-256 -262)">
  <path d="M96 470V170L256 40L416 170V470Z" fill="#f0c040"/><path d="M256 40L416 170V470H256Z" fill="#c98f1a"/>
  <path d="M124 470V184L256 76L388 184V470Z" fill="#0b1626"/>
  <svg x="116" y="101" width="280" height="369" viewBox="0 -8 120 158">${fig('DC')}</svg>
  <path d="M60 470h392v22H60Z" fill="#2a5f8f"/></g></svg>`;
writeFileSync(new URL('../crownfall/icone.html', import.meta.url), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Icône de Crownfall</title><style>
html,body{margin:0;padding:0;background:#fff}
.icone,.masquable{width:512px;height:512px}
.icone svg,.masquable svg{display:block;width:512px;height:512px}
</style></head>
<body>
<!-- Judith, Dame de Cœur, dans l'arche dorée de son trône. Fabriqué par un script à partir
     de fig() de dessin.js (dessin statique : pas de module en file://). tools/chevalier-icones.mjs
     crownfall photographie .icone (192 et 512) et .masquable (512), dont le fond est le
     background_color du manifeste et le dessin tient dans le cercle central. -->
<div class="icone">${dessin('#0d1d33', 1)}</div>
<div class="masquable">${dessin('#0d1d33', .74)}</div>
</body></html>
`);
