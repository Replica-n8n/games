// Crownfall : les effets de pouvoir (maquette docs/maquettes/trone/effets.html,
// choisis par Julie le 2026-11-17 : Trèfle A, Cœur B, Carreau, Sans effet).
// Tout se joue dans une couche posée par-dessus l'écran (#fx) : rien ici ne
// touche à l'état du jeu, seulement à ce qu'on voit pendant l'animation.
import { S, PIP, pip, ICO } from './dessin.js';

/* ------------------------------------------------------------ outils */
export function outils({ cadre, ecranEl, LENT }) {
  let fx = document.getElementById('fx');
  if (!fx) {
    fx = document.createElement('div');
    fx.id = 'fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.style.cssText = 'position:absolute;left:0;top:0;width:360px;height:732px;z-index:40;pointer-events:none;overflow:hidden';
    cadre.insertBefore(fx, document.getElementById('couche'));
  }
  const k = () => cadre.getBoundingClientRect().width / 360;
  const rel = (el) => {
    const b = cadre.getBoundingClientRect(), r = el.getBoundingClientRect(), e = k();
    const x = (r.left - b.left) / e, y = (r.top - b.top) / e, w = r.width / e, h = r.height / e;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  };
  const poser = (html, css) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;' + css;
    d.innerHTML = html;
    fx.appendChild(d);
    return d;
  };
  const anim = (el, kf, o) => el.animate(kf, { fill: 'forwards', ...o, duration: (o.duration || 300) * LENT, delay: (o.delay || 0) * LENT }).finished.catch(() => {});
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms * LENT));
  const q = (s) => ecranEl.querySelector(s);
  const vider = () => { fx.innerHTML = ''; };
  return { fx, rel, poser, anim, attendre, q, vider, ecranEl, reduit: LENT < 1 };
}

const etoile = (c1, c2, t = 136) => `<svg width="${t}" height="${t}" viewBox="-68 -68 136 136"><path d="M0-64L14-20L58-34L26 0L58 34L14 20L0 64L-14 20L-58 34L-26 0L-58-34L-14-20Z" fill="${c1}"/><path d="M0-36L8-11L33-19L15 0L33 19L8 11L0 36L-8 11L-33 19L-15 0L-33-19L-8-11Z" fill="${c2}"/></svg>`;
const chiffre = (txt, taille, couleur, ombre = '#0b1626') =>
  `<div class="gothique" style="font-size:${taille}px;line-height:1;color:${couleur};text-shadow:0 3px 0 ${ombre},0 0 18px ${ombre}">${txt}</div>`;
const dos = (w = 52) => `<div class="coin" style="width:${w}px;height:${w * 1.5}px;background:repeating-linear-gradient(45deg,#1f4a72 0 6px,#17365a 6px 12px);box-shadow:inset 0 0 0 3px #f0c040;display:flex;align-items:center;justify-content:center">${pip('D', w * 0.4, '#f0c040')}</div>`;

function centreEnnemi(T) {
  const en = T.q('.ennemi');
  return en ? T.rel(en) : { cx: 180, cy: 300, x: 130, y: 210, w: 100, h: 180 };
}
async function boum(T, en, { c1 = '#f0c040', c2 = '#fff', echelle = 1, secousse = 4 } = {}) {
  const b = T.poser(etoile(c1, c2), `left:${en.cx - 68}px;top:${en.cy - 68}px;z-index:3`);
  const e = T.q('.ennemi');
  if (e && !T.reduit) T.anim(e, [{ transform: 'none' }, { transform: `translateX(${secousse}px)` }, { transform: `translateX(-${secousse}px)` }, { transform: 'none' }], { duration: 260, fill: 'none' });
  await T.anim(b, [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: `scale(${echelle}) rotate(20deg)`, opacity: 1, offset: 0.5 }, { transform: `scale(${echelle * 1.1}) rotate(30deg)`, opacity: 0 }], { duration: 420, easing: 'ease-out' });
  b.remove();
}
function secouer(T, f = 7, ms = 380) {
  if (T.reduit) return Promise.resolve();
  return T.anim(T.ecranEl, [0, 1, 2, 3, 4, 5].map((i) => ({ transform: i === 5 ? 'none' : `translate(${(i % 2 ? -1 : 1) * f}px,${(i % 3 - 1) * f / 2}px)` })), { duration: ms, fill: 'none' });
}
async function eclair(T, couleur, fort = 0.35) {
  const f = T.poser('', `inset:0;background:${couleur};z-index:1`);
  await T.anim(f, [{ opacity: 0 }, { opacity: T.reduit ? fort / 3 : fort, offset: 0.25 }, { opacity: 0 }], { duration: 420 });
  f.remove();
}
export function texte(T, html) {
  const a = T.q('.apercu');
  if (!a) return;
  a.innerHTML = html;
  T.anim(a, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 250, fill: 'none' });
}
const compteur = (el, n) => { if (el && el.childNodes[1]) el.childNodes[1].textContent = n; };
const bondir = (T, el) => { if (el) T.anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 260, fill: 'none' }); };

/* ------------------------------------------------------------ Trèfle : le double coup */
// Le premier coup est déjà à l'écran (`.chiffre-coup` = la valeur jouée) ; le
// trèfle frappe une DEUXIÈME fois, puis les deux chiffres fusionnent.
export async function trefle(T, { valeur, total, barre }) {
  const en = centreEnnemi(T);
  await T.attendre(380);
  const n1 = T.q('.chiffre-coup');
  // Le premier chiffre reste à l'écran jusqu'à la fusion (son animation CSS l'effaçait).
  if (n1) { n1.style.animation = 'none'; n1.style.opacity = '1'; }
  const tr = T.poser(`<svg width="220" height="220" viewBox="0 0 24 24">${PIP.T('#5cba84')}</svg>`, `left:${en.cx - 110}px;top:${en.cy - 120}px;z-index:1`);
  T.anim(tr, [{ transform: 'scale(.2) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1.2) rotate(0)', opacity: 0.85, offset: 0.45 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 900, easing: 'ease-out' });
  const x2 = T.poser(chiffre('×2', 84, '#c6f0d2', '#0c2e22'), `left:${Math.max(4, en.cx - 150)}px;top:${en.cy - 80}px;z-index:5`);
  await T.anim(x2, [{ transform: 'scale(3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 230, easing: 'ease-in' });
  eclair(T, '#5cba84', 0.4);
  secouer(T, 6);
  boum(T, en, { c1: '#5cba84', c2: '#f1fbea', echelle: 1.35, secousse: 8 });
  const n2 = T.poser(chiffre(String(valeur), 54, '#c6f0d2', '#0c2e22'), `left:212px;top:${en.cy - 10}px;z-index:4`);
  T.anim(n2, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250 });
  barre();
  await T.attendre(450);
  if (n1) T.anim(n1, [{ transform: 'none', opacity: 1 }, { transform: 'translate(-20px,40px) scale(.6)', opacity: 0 }], { duration: 260 });
  T.anim(n2, [{ transform: 'none', opacity: 1 }, { transform: 'translate(-20px,-20px) scale(.6)', opacity: 0 }], { duration: 260 });
  T.anim(x2, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 });
  await T.attendre(200);
  const n = T.poser(chiffre(String(total), 92, '#f0c040', '#17503a'), `left:${Math.min(250, en.cx - 10)}px;top:${en.cy - 60}px;z-index:6`);
  secouer(T, 9, 420);
  T.anim(n, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.35)', opacity: 1, offset: 0.5 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'ease-out' });
  texte(T, `<span style="color:#c6f0d2">${valeur} × 2 = ${total} dégâts</span>`);
  await T.attendre(1100);
  await T.anim(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  [tr, x2, n2, n].forEach((x) => x.remove());
}

/* ------------------------------------------------------------ Sans effet : le pouvoir se brise */
// s : lettre du DESSIN (C, D, T, P) de la couleur dont la figure ne craint rien.
export async function immun(T, { s, phrase }) {
  const en = centreEnnemi(T);
  const clair = S[s].t[3], fonce = S[s].t[2];
  const signe = T.poser(`<svg width="54" height="54" viewBox="0 0 24 24">${PIP[s](clair)}</svg>`, `left:${en.cx - 27}px;top:${en.cy + 30}px;z-index:5`);
  const aura = T.poser('', `left:${en.cx - 78}px;top:${en.cy - 104}px;width:156px;height:200px;border-radius:50%;box-shadow:0 0 0 5px ${clair},0 0 30px 10px ${fonce}88 inset;z-index:3`);
  T.anim(aura, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300 });
  await T.anim(signe, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'translateY(-20px) scale(1.2)', opacity: 1, offset: 0.4 }, { transform: 'translateY(-96px) scale(1)', opacity: 1 }], { duration: 900, easing: 'ease-in' });
  signe.remove();
  eclair(T, fonce, 0.25);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5;
    const m = T.poser(`<svg width="14" height="14" viewBox="0 0 10 10"><path d="M0 0L10 3L3 10Z" fill="${clair}"/></svg>`, `left:${en.cx - 7}px;top:${en.cy - 70}px;z-index:5`);
    T.anim(m, [{ transform: 'none', opacity: 1 }, { transform: `translate(${Math.cos(a) * 70}px,${Math.sin(a) * 50 + 60}px) rotate(${i * 90}deg)`, opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.2,.6,.4,1)' }).then(() => m.remove());
  }
  T.anim(aura, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300 });
  const puce = [...T.ecranEl.querySelectorAll('.puce')].find((p) => /sans effet/.test(p.textContent));
  if (puce) T.anim(puce, [{ transform: 'scale(1)', boxShadow: 'inset 0 0 0 2px #f0c040' }, { transform: 'scale(1.2)', boxShadow: `inset 0 0 0 3px ${clair}` }, { transform: 'scale(1)', boxShadow: 'inset 0 0 0 2px #f0c040' }], { duration: 400, iterations: 3, fill: 'none' });
  texte(T, phrase);
  await T.attendre(1300);
  await T.anim(aura, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
  aura.remove();
}

/* ------------------------------------------------------------ Cœur : le grand retour */
// La défausse s'étale au milieu : les soignées s'allument d'un cœur et filent
// sous la taverne, les autres retournent à la défausse.
export async function coeur(T, { defausse, soignees, carte }) {
  const tav = T.q('#pTaverne'), def = T.q('#pDefausse');
  if (!tav || !def || !soignees.length) return;
  const rt = T.rel(tav), rd = T.rel(def);
  let nt = Number(tav.childNodes[1].textContent);
  const n = soignees.length;
  const voile = T.poser('', 'inset:0;background:#081325;z-index:1');
  T.anim(voile, [{ opacity: 0 }, { opacity: 0.82 }], { duration: 300 });
  const titre = T.poser(`<div class="gothique" style="font-size:30px;color:#fff0b0;text-align:center">Soin ${n}</div><div style="text-align:center;color:#ffc4cb;font-weight:700">la défausse rend ${n} carte${n > 1 ? 's' : ''} à la taverne</div>`, 'left:0;right:0;top:96px;z-index:3');
  T.anim(titre, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  // La défausse en grille : 7 par rangée, plus petites si elle est grosse.
  const tout = defausse, cols = 7, w = tout.length > 21 ? 34 : 40, h = w * 1.5, pas = w + 6, y0 = 170;
  const rangees = Math.ceil(tout.length / cols);
  const pasY = Math.min(h + 8, (560 - y0 - h) / Math.max(1, rangees - 1));
  const pos = (i) => {
    const r = Math.floor(i / cols), dansR = Math.min(cols, tout.length - r * cols);
    return { x: 180 - (dansR * pas - 6) / 2 + (i % cols) * pas, y: y0 + r * pasY };
  };
  const cartes = tout.map((id, i) => {
    const p = pos(i);
    const c = T.poser(`<div style="width:52px;transform:scale(${w / 52});transform-origin:top left">${carte(id)}</div>`, `left:${p.x}px;top:${p.y}px;width:${w}px;height:${h}px;z-index:4`);
    T.anim(c, [{ transform: `translate(${rd.cx - p.x - w / 2}px,${rd.cy - p.y - h / 2}px) scale(.4)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: Math.min(i, 20) * 40, easing: 'ease-out' });
    return c;
  });
  await T.attendre(500 + Math.min(tout.length, 20) * 40);
  for (const id of soignees) {
    const c = cartes[tout.indexOf(id)];
    if (!c) continue;
    c.style.filter = 'drop-shadow(0 0 7px #ff8da0)';
    c.insertAdjacentHTML('beforeend', `<div style="position:absolute;left:${w / 2 - 9}px;top:-14px">${pip('C', 18, '#ff8da0')}</div>`);
    T.anim(c, [{ transform: 'none' }, { transform: 'translateY(-12px)' }], { duration: 200, easing: 'ease-out' });
    await T.attendre(Math.max(60, 140 - n * 8));
  }
  await T.attendre(450);
  texte(T, `<span style="color:#ffc4cb">${ICO.soin('#ffc4cb')} ${n} carte${n > 1 ? 's' : ''} repart${n > 1 ? 'ent' : ''} sous la taverne</span>`);
  await Promise.all(tout.map(async (id, i) => {
    const c = cartes[i], soin = soignees.includes(id), p = pos(i);
    const cible = soin ? rt : rd;
    await T.attendre(soin ? soignees.indexOf(id) * 90 : 200);
    await T.anim(c, [{ transform: soin ? 'translateY(-12px)' : 'none', opacity: 1 }, { transform: `translate(${cible.cx - p.x - w / 2}px,${cible.cy - p.y - h / 2 + (soin ? 10 : 0)}px) scale(.5,${soin ? 0.25 : 0.5})`, opacity: 0 }], { duration: 650, easing: 'ease-in' });
    if (soin) { compteur(tav, ++nt); bondir(T, tav); }
    c.remove();
  }));
  compteur(def, tout.length - n); bondir(T, def);
  await Promise.all([voile, titre].map((x) => T.anim(x, [{ opacity: x === voile ? 0.82 : 1 }, { opacity: 0 }], { duration: 350 })));
  voile.remove(); titre.remove();
}

/* ------------------------------------------------------------ Carreau : la pioche */
// Les cartes tirées sont déjà dans la main, cachées : elles sortent de la
// taverne dos tourné, volent à leur place et se retournent.
export async function carreau(T, { tirees, bloquees, raison, x }) {
  const tav = T.q('#pTaverne');
  if (!tav) return;
  let nt = Number(tav.childNodes[1].textContent);
  const rt = T.rel(tav);
  texte(T, `<span style="color:#fff0b0">Pioche ${x}</span>`);
  for (const [i, id] of tirees.entries()) {
    const vraie = T.q(`.main [data-carte="${id}"]`);
    if (!vraie) continue;
    const r = T.rel(vraie);
    const c = T.poser(dos(52), `left:${rt.cx - 26}px;top:${rt.y}px;z-index:4`);
    compteur(tav, --nt); bondir(T, tav);
    const fin = `translate(${r.x - rt.cx + 26}px,${r.y - rt.y}px)`;
    await T.anim(c, [{ transform: 'scale(.5) rotate(10deg)' }, { transform: `${fin} rotate(-6deg)`, offset: 0.8 }, { transform: fin }], { duration: 340, easing: 'ease-out' });
    await T.anim(c, [{ transform: `${fin} scaleX(1)` }, { transform: `${fin} scaleX(0)` }], { duration: 90 });
    c.remove();
    vraie.style.visibility = '';
    T.anim(vraie, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1.1)' }, { transform: 'none' }], { duration: 160, fill: 'none' });
    for (let j = 0; j < 5; j++) {
      const p = T.poser(pip('D', 12, '#f0c040'), `left:${r.cx - 6}px;top:${r.cy - 6}px;z-index:5`);
      const a = (j / 5) * Math.PI * 2 + i;
      T.anim(p, [{ transform: 'none', opacity: 1 }, { transform: `translate(${Math.cos(a) * 40}px,${Math.sin(a) * 40}px) scale(.4)`, opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => p.remove());
    }
  }
  // Seules les cartes reçues se montrent (Julie, 2026-11-17 : les cartes en trop qui
  // repartaient à la taverne gênaient) ; une ligne dit pourquoi il y en a moins.
  if (bloquees > 0) {
    texte(T, `<span style="color:#fff0b0">Pioche ${x} : ${tirees.length} carte${tirees.length > 1 ? 's' : ''}, ${raison === 'pleine' ? 'la main est pleine' : 'la taverne est vide'}</span>`);
    await T.attendre(1100);
  } else {
    await T.attendre(400);
  }
}

/* ------------------------------------------------------------ Pique : la palissade */
// Choisie par Julie le 2026-11-17 (maquette docs/maquettes/trone/pique.html, piste B) :
// le grand écu violet se confondait avec l'écu de la riposte. Des piques jaillissent
// devant la figure, elle bute dessus, et la palissade RESTE à ses pieds jusqu'à sa chute.
const VIO = '#8f84e6', VIO_C = '#cfc8ff', VIO_F = '#33287a', SOL = 386;
const piqueSVG = (h) => `<svg width="${Math.round(h / 4)}" height="${h}" viewBox="-4 0 30 120"><path d="M9.500 26h3v94h-3Z" fill="#c9b78a"/><path d="M11 26h1.500v94H11Z" fill="#6b5a3a" opacity=".5"/><g transform="translate(-4 -2) scale(1.25)">${PIP.P(VIO)}</g><path d="M11 3l6 7v2l-6-4Z" fill="${VIO_C}" opacity=".6"/></svg>`;
// Place de la i-ème pique sur n, centrée sous la figure.
const placePique = (i, n, large) => ({ x: 180 + (n > 1 ? -large / 2 + i * (large / (n - 1)) : 0) - 15, r: (i - (n - 1) / 2) * 4 });

// La palissade plantée, telle que l'écran la dessine tant que le bouclier tient.
// Une pique par point jusqu'à 9 : au-delà, la pastille donne le nombre.
export function palissadeHTML(bouclier) {
  if (!bouclier) return '';
  const n = Math.min(bouclier, 9);
  return `<div class="abs" id="palissade" aria-hidden="true" style="left:0;top:0;z-index:1;pointer-events:none">${Array.from({ length: n }, (_, i) => {
    const h = Math.round((104 + (i % 2) * 14) * 0.7), p = placePique(i, n, 112);
    return `<div style="position:absolute;left:${p.x + 15 - h / 8}px;top:${SOL - h + 8}px;transform-origin:50% 100%;transform:rotate(${p.r}deg)">${piqueSVG(h)}</div>`;
  }).join('')}</div>`;
}

// x : la valeur jouée ; total : le bouclier après ; attaque : celle de la figure.
export async function pique(T, { x, total, attaque }) {
  const en = centreEnnemi(T);
  const vieille = T.q('#palissade');
  if (vieille) vieille.style.visibility = 'hidden';
  const n = Math.min(x, 10), large = 144;
  // Le compteur se pose devant les piles : elles s'effacent le temps de l'effet.
  const piles = T.q('#pTaverne')?.parentElement;
  if (piles) T.anim(piles, [{ opacity: 1 }, { opacity: 0.15 }], { duration: 200 });
  const piques = [];
  const nb = T.poser('', `left:${en.cx + 40}px;top:${en.cy - 34}px;z-index:6;text-align:center`);
  for (let i = 0; i < n; i++) {
    const h = 104 + (i % 2) * 14, p = placePique(i, n, large);
    const el = T.poser(piqueSVG(h), `left:${p.x}px;top:${SOL - h + 14}px;z-index:5;transform-origin:50% 100%;transform:rotate(${p.r}deg)`);
    piques.push({ el, p });
    T.anim(el, [{ transform: `rotate(${p.r}deg) translateY(${h}px)`, clipPath: 'inset(0 0 100% 0)' }, { transform: `rotate(${p.r}deg) translateY(-8px)`, clipPath: 'inset(0 0 0 0)', offset: 0.8 }, { transform: `rotate(${p.r}deg)`, clipPath: 'inset(0 0 0 0)' }], { duration: 260, easing: 'ease-out' });
    const poussiere = T.poser('', `left:${p.x - 6}px;top:${SOL + 2}px;width:34px;height:10px;border-radius:50%;background:#c9b78a;z-index:4`);
    T.anim(poussiere, [{ transform: 'scale(.3)', opacity: 0.8 }, { transform: 'scale(1.6,1)', opacity: 0 }], { duration: 400 }).then(() => poussiere.remove());
    // Le compteur suit les points, même quand il y a moins de piques que de points.
    nb.innerHTML = `<div class="gothique" style="font-size:22px;color:${VIO_C};text-shadow:0 2px 0 #0b1626">Bouclier</div>${chiffre(String(Math.round((i + 1) * x / n)), 56, VIO_C, VIO_F)}`;
    await T.attendre(130);
  }
  texte(T, `<span style="color:${VIO_C}">Une palissade de ${x} pique${x > 1 ? 's' : ''} devant elle</span>`);
  await T.attendre(300);
  // Elle s'élance et bute.
  const fig = T.q('.ennemi');
  if (fig && !T.reduit) await T.anim(fig, [{ transform: 'none' }, { transform: 'translateY(26px) scale(1.1)' }], { duration: 220, easing: 'ease-in', fill: 'none' });
  eclair(T, VIO, 0.3);
  piques.forEach(({ el, p }, i) => T.anim(el, [{ transform: `rotate(${p.r}deg)` }, { transform: `rotate(${p.r + (i % 2 ? 6 : -6)}deg)` }, { transform: `rotate(${p.r}deg)` }], { duration: 260 }));
  if (fig && !T.reduit) await T.anim(fig, [{ transform: 'translateY(26px) scale(1.1)' }, { transform: 'translateY(-10px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out', fill: 'none' });
  else await T.attendre(380);
  const reste = Math.max(0, attaque - total);
  texte(T, `<span style="color:${VIO_C}">Son attaque : ${attaque} − ${total} = ${reste}, jusqu'à sa chute</span>`);
  await T.attendre(700);
  // La palissade se range à ses pieds, plus basse.
  T.anim(nb, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  if (piles) T.anim(piles, [{ opacity: 0.15 }, { opacity: 1 }], { duration: 300 });
  await Promise.all(piques.map(({ el, p }) => T.anim(el, [{ transform: `rotate(${p.r}deg)` }, { transform: `rotate(${p.r}deg) scale(.7)`, opacity: 0.8 }], { duration: 400, easing: 'ease-out' })));
}
