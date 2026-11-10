// DIG : range des captures de dig-essai.mjs côte à côte. node tools/dig-planche.mjs sortie.png a b c ...
const { chromium } = await import('file:///C:/Users/Julie/Claude - projet 1/vie/trophees-de-vie/node_modules/playwright/index.mjs');
import { fileURLToPath } from 'node:url';
const dos = fileURLToPath(new URL('./captures/dig/', import.meta.url)).split(String.fromCharCode(92)).join('/');
const [sortie, ...noms] = process.argv.slice(2);
const nav = await chromium.launch(); const p = await nav.newPage({ viewport: { width: noms.length * 330 + 10, height: 760 } });
const { writeFileSync } = await import('node:fs');
writeFileSync(dos + 'planche.html', `<body style="margin:0;background:#2a2119;display:flex;gap:10px;padding:10px;font:700 15px sans-serif;color:#fff">${noms.map((n, i) => `<div><div style="padding:0 0 6px">${i + 1}. ${n.split('=')[1] || n}</div><img src="${n.split('=')[0]}.png" style="width:320px;display:block;border-radius:10px"></div>`).join('')}</body>`);
await p.goto('file:///' + dos + 'planche.html');
await p.waitForTimeout(700); await p.screenshot({ path: dos + sortie }); await nav.close();
