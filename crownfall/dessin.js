// Le dessin du jeu : palettes, symboles, les douze figures, les troupes, la salle.
// Repris de docs/maquettes/trone/commun.js (maquette A3, validée le 2026-11-14).
// Lettres de couleur du DESSIN : C Cœur, D Carreau, T Trèfle, P Pique (le moteur dit K pour Carreau).

export const S={
  P:{nom:'Pique',  t:['#1a1240','#33287a','#5648b8','#8f84e6','#cfc8ff'],L:'#f4f1ff'},
  C:{nom:'Cœur',   t:['#3d0a1c','#7a1230','#b8233f','#e8607a','#ffc4cb'],L:'#fff1ec'},
  D:{nom:'Carreau',t:['#4a2a08','#8a5a10','#c98f1a','#f0c040','#fff0b0'],L:'#fffbe6'},
  T:{nom:'Trèfle', t:['#0c2e22','#17503a','#2a8058','#5cba84','#c6f0d2'],L:'#f1fbea'}
};
export const RANG={R:'Roi',D:'Dame',V:'Valet'};
export const NOMS={RP:'David',RC:'Charles',RD:'César',RT:'Alexandre',DP:'Pallas',DC:'Judith',DD:'Rachel',DT:'Argine',VP:'Ogier',VC:'La Hire',VD:'Hector',VT:'Lancelot'};
export const PIP={
  C:c=>`<path fill="${c}" d="M12 21L3 11V6l4-3 5 4 5-4 4 3v5Z"/>`,
  D:c=>`<path fill="${c}" d="M12 2l8 10-8 10L4 12Z"/>`,
  T:c=>`<path fill="${c}" d="M12 2l4 3v4l-1 1 3-1 4 3v4l-4 3-4-2 2 5H8l2-5-4 2-4-3v-4l4-3 3 1-1-1V5Z"/>`,
  P:c=>`<path fill="${c}" d="M12 2l9 10v4l-4 3-4-2 2 5H9l2-5-4 2-4-3v-4Z"/>`
};
export const pip=(s,t=16,c)=>`<svg class="pip" width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">${PIP[s](c||S[s].t[2])}</svg>`;
export const ICO={
  epee:(c,t=16)=>`<svg class="pip" width="${t}" height="${t}" viewBox="0 0 24 24"><path fill="${c}" d="M12 1l2.400 3v11h-4.800V4ZM6 15h12v2.600H6ZM10.600 17.600h2.800V23h-2.800Z"/></svg>`,
  ecu:(c,t=16)=>`<svg class="pip" width="${t}" height="${t}" viewBox="0 0 24 24"><path fill="${c}" d="M3 3h18v10l-9 10-9-10Z"/></svg>`,
  soin:c=>`<svg class="pip" width="14" height="14" viewBox="0 0 24 24"><path fill="${c}" d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z"/></svg>`,
  pioche:c=>`<svg class="pip" width="14" height="14" viewBox="0 0 24 24"><path fill="${c}" opacity=".5" d="M3 6h12v16H3Z"/><path fill="${c}" d="M9 2h12v16H9Z"/></svg>`,
  fou:c=>`<svg class="pip" width="26" height="26" viewBox="0 0 24 24"><path fill="${c}" d="M6 21L7 11 2 5l8 4 2-6V21Z"/><path fill="${c}" opacity=".6" d="M18 21l-1-10 5-6-8 4-2-6V21Z"/><path fill="${c}" d="M4 20h16v3H4Z"/></svg>`
};
const LEVRES='M55 84l5-2 5 2-5 3Z', BOUCHE='M54 85h12l-3 2.500h-6Z', MOUST='M45 80L60 83L75 80L67 90L60 86L53 90Z';

/* Ce qui rend chaque figure unique : dos (derrière le buste) et face (par-dessus le visage).
   p(tracé, ton) ; a = le plus sombre … e = le plus clair, L = lumière. */
export const QUI={
  RP:{ // David : le roi à la lyre, barbe en deux pointes
    dos:(p,T)=>{p('M40 52L30 98L46 86L44 62Z',T.b);p('M80 52L90 98L74 86L76 62Z',T.a);},
    face:(p,T)=>{p('M41 72L50 80L60 78L70 80L79 72L81 100L72 120L66 106L60 126L54 106L48 120L39 100Z',T.b);p('M60 78L70 80L79 72L81 100L72 120L66 106L60 126Z',T.a);p(MOUST,T.c);
      p('M38 52L35 28L45 40L52 24L60 38L68 24L75 40L85 28L82 52Z',T.L);p('M60 38L68 24L75 40L85 28L82 52H60Z',T.e);p('M37 45H83L82 52H38Z',T.a);p('M60 44l3 4-3 4-3-4Z',T.L);
      p('M84 94L88 134H104L108 94L102 98L100 126H92L90 98Z',T.L);p('M96 134h8l4-40-6 4-2 28h-4Z',T.e);p('M93.500 100h1v26h-1ZM96.500 100h1v26h-1Z',T.d);}},
  RC:{ // Charles : l'empereur, couronne fermée à croix, globe
    face:(p,T)=>{p('M40 70L50 80L60 78L70 80L80 70L83 100L72 114H48L37 100Z',T.b);p('M60 78L70 80L80 70L83 100L72 114H60Z',T.a);p(MOUST,T.c);p('M55 92h10l-5 4Z',T.a);
      p('M37 52V32H83V52Z',T.L);p('M60 32H83V52H60Z',T.e);p('M37 32L60 14L83 32H76L60 22L44 32Z',T.L);p('M60 14L83 32H76L60 22Z',T.e);p('M57.500 0h5v5h5v5h-5v8h-5v-8h-5V5h5Z',T.L);p('M44 38h6v8h-6ZM57 38h6v8h-6ZM70 38h6v8h-6Z',T.c);
      p('M30 116L44 98L60 112L76 98L90 116L60 126Z',T.L);p('M60 112L76 98L90 116L60 126Z',T.e);p('M40 108h3v4h-3ZM50 113h3v4h-3ZM67 113h3v4h-3ZM77 108h3v4h-3Z',T.a);
      p('M12 130L18 120H28L34 130L28 142H18Z',T.L);p('M23 120h5l6 10-6 12h-5Z',T.e);p('M12 129H34v3H12Z',T.c);p('M21.500 106h3v5h4v3h-4v6h-3v-6h-4v-3h4Z',T.L);}},
  RD:{ // César : lauriers, visage rasé, toge
    pip:'a',
    face:(p,T)=>{p('M40 56L43 40L60 33L77 40L80 56L74 50H46Z',T.b);p('M60 33L77 40L80 56L74 50H60Z',T.a);
      p('M38 62L33 52L41 54ZM38 51L35 41L43 45ZM42 42L42 32L49 38ZM50 36L52 27L58 34Z',T.L);p('M82 62L87 52L79 54ZM82 51L85 41L77 45ZM78 42L78 32L71 38ZM70 36L68 27L62 34Z',T.e);
      p('M60 60l7 18h-7Z',T.b);p(BOUCHE,T.a);p('M58 92h4l-2 3Z',T.b);
      p('M20 114L44 98L104 150H64Z',T.L);p('M44 98H76L104 150Z',T.e);p('M44 96l6 6-6 6-6-6Z',T.d);}},
  RT:{ // Alexandre : jeune conquérant, boucles et cornes de bélier
    doux:1,
    face:(p,T)=>{p('M38 64L36 44L46 32L60 28L74 32L84 44L82 64L76 52L60 47L44 52Z',T.b);p('M60 28L74 32L84 44L82 64L76 52L60 47Z',T.a);p('M46 32L53 40L44 45Z',T.c);
      p('M42 46L30 34L17 38L10 54L17 70L30 74L37 65L30 61L23 56L25 47L32 45L40 53Z',T.L);p('M17 38L10 54L17 70L30 74L37 65L30 61L23 56L25 47Z',T.e);
      p('M78 46L90 34L103 38L110 54L103 70L90 74L83 65L90 61L97 56L95 47L88 45L80 53Z',T.e);p('M103 38L110 54L103 70L90 74L83 65L90 61L97 56L95 47Z',T.d);p('M41 47H79V51H41Z',T.L);p(BOUCHE,T.a);
      p('M40 104H80L84 150H36Z',T.c);p('M60 104H80L84 150H60Z',T.b);p('M20 114L44 98L47 110L28 124Z',T.d);p('M100 114L76 98L73 110L92 124Z',T.c);}},
  DP:{ // Pallas : la déesse casquée, lance et collier d'écailles
    doux:1,
    dos:(p,T)=>{p('M42 56L34 112L46 102L47 62Z',T.a);p('M78 56L86 112L74 102L73 62Z',T.a);},
    face:(p,T)=>{p('M37 58L41 34L60 25L79 34L83 58L76 51H44Z',T.c);p('M60 25L79 34L83 58L76 51H60Z',T.b);p('M44 51H76L74 55H46Z',T.a);
      p('M54 27L44 8L58-2L78 2L94 22L96 44L84 28L70 20L60 25Z',T.L);p('M78 2L94 22L96 44L84 28L70 20Z',T.e);p(LEVRES,T.a);
      p('M40 100L46 110L53 102L60 114L67 102L74 110L80 100L84 112L60 124L36 112Z',T.L);p('M60 114L67 102L74 110L80 100L84 112L60 124Z',T.e);
      p('M102 28h3v122h-3Z',T.e);p('M103.500 4L109 28H98Z',T.L);}},
  DC:{ // Judith : turban, longue tresse, épée levée
    dos:(p,T)=>{p('M80 40L96 114L78 102L77 58Z',T.e);p('M40 66L32 80L38 86L30 100L36 106L30 120L42 112L44 96L40 90L46 80Z',T.a);},
    face:(p,T)=>{p('M36 56L40 36L60 26L80 36L84 56L72 48L60 52L48 48Z',T.L);p('M60 26L80 36L84 56L72 48L60 52Z',T.e);p('M40 36L60 44L80 36L60 40Z',T.d);p('M60 29l4 6-4 6-4-6Z',T.c);p(LEVRES,T.a);
      p('M46 100L60 116L74 100L60 106Z',T.L);
      p('M15 6L21 0L27 6V96H15Z',T.L);p('M21 0L27 6V96H21Z',T.e);p('M8 96H34V101H8Z',T.L);p('M18.500 101h5v18h-5Z',T.a);p('M13 104h16v10H13Z',T.d);}},
  DD:{ // Rachel : long voile, pièces au front, cruche
    doux:1,
    dos:(p,T)=>{p('M30 124L36 46L60 28L84 46L90 124L74 106V56H46v50Z',T.L);p('M60 28L84 46L90 124L74 106V56H60Z',T.e);},
    face:(p,T)=>{p('M40 58L44 44L60 38L76 44L80 58L60 50Z',T.L);p('M60 38L76 44L80 58L60 50Z',T.e);p('M46 54l3-3 3 3-3 3ZM57 52l3-3 3 3-3 3ZM68 54l3-3 3 3-3 3Z',T.b);
      p('M38 78l4 6-4 6-4-6Z',T.L);p('M82 78l4 6-4 6-4-6Z',T.e);p(LEVRES,T.a);
      p('M17 40h4v110h-4Z',T.e);p('M17 42V24L26 12L38 16L41 30L34 36L33 26L27 21L21 28V42Z',T.L);p('M26 12L38 16L41 30L34 36L33 26L27 21Z',T.e);p('M13 112h12v10H13Z',T.d);}},
  DT:{ // Argine : hennin et voile, grand col
    dos:(p,T)=>{p('M28 108L34 62L48 96Z',T.c);p('M92 108L86 62L72 96Z',T.b);p('M94-2L118 70L100 44Z',T.L,.85);},
    face:(p,T)=>{p('M41 52H79L96-4Z',T.b);p('M60 52H79L96-4Z',T.a);p('M52 37L84 17L82 22L54 41Z',T.d);p('M41 46H79L78 52H42Z',T.L);p('M60 46H79l-1 6H60Z',T.e);p(LEVRES,T.a);
      p('M46 100L60 116L74 100L60 106Z',T.L);p('M60 113l4 5-4 5-4-5Z',T.L);}},
  VP:{ // Ogier : le Danois, casque à cornes, moustache tressée, grande épée
    face:(p,T)=>{p('M39 58L42 36L60 26L78 36L81 58Z',T.c);p('M60 26L78 36L81 58H60Z',T.b);p('M39 54H81V58H39Z',T.a);p('M57 56h6v14l-3 4-3-4Z',T.c);
      p('M43 40L28 36L22 12L34 26L46 32Z',T.L);p('M77 40L92 36L98 12L86 26L74 32Z',T.e);
      p('M42 74L50 82L60 80L70 82L78 74L77 94L67 104H53L43 94Z',T.b);p('M60 80L70 82L78 74L77 94L67 104H60Z',T.a);
      p('M53 101H67L64 109H56Z',T.L);p('M60 101h7l-3 8h-4Z',T.e);p('M55 109H65V111.500H55Z',T.c);p('M56 112H64L62.500 119H57.500Z',T.L);p('M60 112h4l-1.500 7H60Z',T.e);p('M56.500 119H63.500V121.500H56.500Z',T.c);p('M57.500 122H62.500L60 132Z',T.L);
      p('M43 80L60 83L77 80L82 98L73 88L60 86L47 88L38 98Z',T.L);p('M60 83L77 80L82 98L73 88L60 86Z',T.e);
      p('M98 150L108 50L115 53L106 150Z',T.L);p('M108 50L112 40L115 53Z',T.e);}},
  VC:{ // La Hire : chaperon, balafre, masse d'armes
    dos:(p,T)=>{p('M82 42L106 54L112 96L100 74L86 62Z',T.c);},
    face:(p,T)=>{p('M34 74L38 42L60 28L82 42L86 74L78 56L60 49L42 56Z',T.b);p('M60 28L82 42L86 74L78 56L60 49Z',T.a);
      p('M30 112L44 96L52 108L60 98L68 108L76 96L90 112L80 124L70 114L60 126L50 114L40 124Z',T.c);p('M48 53h2.500l2.500 24h-2.500Z',T.L);p('M43 84L60 79L77 84L70 89L60 84L50 89Z',T.a);
      p('M19 84h4v66h-4Z',T.e);p('M21 58L31 72L21 86L11 72Z',T.L);p('M21 58L31 72L21 86Z',T.e);p('M7 72l4-3v6ZM35 72l-4-3v6ZM21 52l-3 6h6Z',T.L);}},
  VD:{ // Hector : casque à joues et cimier en éventail, bouclier rond
    face:(p,T)=>{p('M37 82L40 40L60 28L80 40L83 82L76 72V58L60 53L44 58V72Z',T.c);p('M60 28L80 40L83 82L76 72V58L60 53Z',T.b);
      p('M50 20H70L74 34H46Z',T.b);
      p('M28 34L38 10L60 2L82 10L92 34L78 24L60 20L42 24Z',T.L);p('M60 2L82 10L92 34L78 24L60 20Z',T.e);p('M48 8l2 12h-2ZM70 8l-2 12h2Z',T.d);p(BOUCHE,T.a);
      p('M14 108H30L40 118V134L30 144H14L4 134V118Z',T.c);p('M22 108H30L40 118V134L30 144H22Z',T.b);p('M22 118l8 8-8 8-8-8Z',T.L);}},
  VT:{ // Lancelot : cheveux longs, cercle au front, lance à fanion
    doux:1,
    dos:(p,T)=>{p('M38 52L42 36L60 29L78 36L82 52L90 108L74 98L76 60H44L46 98L30 108Z',T.L);p('M60 29L78 36L82 52L90 108L74 98L76 60H60Z',T.e);},
    face:(p,T)=>{p('M40 60L44 46L60 42L76 46L80 60L66 50L56 54Z',T.L);p('M60 42L76 46L80 60L66 50Z',T.e);p('M41 45H79V49H41Z',T.b);p('M60 43l3 4-3 4-3-4Z',T.d);
      p('M54 84L60 87L66 84L60 89Z',T.a);p('M44 98L60 114L76 98L60 104Z',T.L);
      p('M98 0h3v150h-3Z',T.e);p('M101 6L119 13L101 22Z',T.L);}}
};

export function fig(id,o={}){
  const suit=id[1], {t:[a,b,c,d,e],L}=S[suit], T={a,b,c,d,e,L}, q=QUI[id], full=!!o.full;
  let s='';
  const p=(pts,f,op)=>{s+=`<path d="${pts}" fill="${f}"${op?` opacity="${op}"`:''}/>`;};
  q.dos&&q.dos(p,T);
  const bas=full?'L118 226L2 226Z':'Z';
  p('M8 150L22 112L44 98L76 98L98 112L112 150'+bas,b);
  p(full?'M2 226L8 150L22 112L44 98L50 150L44 226Z':'M8 150L22 112L44 98L50 150Z',c);
  p(full?'M76 98L98 112L112 150L118 226L80 226L72 150Z':'M76 98L98 112L112 150L72 150Z',a);
  if(full) p('M50 150h20l8 76H42Z',a,.5);
  p('M52 84h16v16l-8 8-8-8Z',b);
  p('M42 50H78L80 70L70 90L60 96L50 90L40 70Z',d);
  p('M60 50H78L80 70L70 90L60 96Z',c);
  p('M40 70L50 90L53 76Z',e,.6);
  p('M60 62l5 16h-5Z',b);
  p(q.doux?'M44 58.500l13 2v2.500l-13-1.500ZM76 58.500l-13 2v2.500l13-1.500Z':'M43 57l15 4.500v2.500l-15-3.500ZM77 57l-15 4.500v2.500l15-3.500Z',a);
  p('M46 64l10 2-9 2.500ZM74 64l-10 2 9 2.500Z',L);
  q.face(p,T);
  s+=`<g transform="translate(51 127) scale(.75)">${PIP[suit](q.pip?T[q.pip]:L)}</g>`;
  return s;
}

export function trone(x,y,id,etat){
  const suit=id[1];
  const dedans = etat==='assis' ? `<svg x="5" y="6" width="40" height="46" viewBox="14 0 92 106">${fig(id)}</svg>`
    : `<g transform="translate(16 22) scale(.75)" opacity="${etat==='leve'?1:.5}">${PIP[suit](etat==='leve'?'#f0c040':'#3a5a80')}</g>`;
  return `<g transform="translate(${x} ${y})">
    <path d="M3 52V16L25-2L47 16V52Z" fill="${etat==='leve'?'#f0c040':'#2a5f8f'}"/><path d="M25-2L47 16V52H25Z" fill="${etat==='leve'?'#c98f1a':'#1f4a72'}"/>
    <path d="M7 52V18L25 4L43 18V52Z" fill="#0b1626"/>${dedans}</g>`;
}

/* ---------- les troupes : la silhouette dit la valeur ---------- */
export const TROUPES=[['As','Compagnon'],['2 · 3','Paysans'],['4 · 5','Archers'],['6 · 7','Gardes'],['8 · 9','Chevaliers'],['10','Champion']];
export function unite(val,suit,o={}){
  const {t:[a,b,c,d,e],L}=S[suit], w=o.w||56, n=val==='A'?1:+val;
  const rang=n===1?0:n<=3?1:n<=5?2:n<=7?3:n<=9?4:5;
  const AC='#e6ebf8',AM='#aab4d6',AF='#7f8bb3',N='#0b1626';
  let s=''; const p=(pts,f,op)=>{s+=`<path d="${pts}" fill="${f}"${op?` opacity="${op}"`:''}/>`;};
  const tunique=()=>{p('M6 84L14 56L32 50L50 56L58 84Z',c);p('M32 50L50 56L58 84H32Z',b);};
  const acier=()=>{p('M6 84L14 56L32 50L50 56L58 84Z',AF);p('M6 84L14 56L32 50L28 84Z',AM);};
  const visage=(y=30)=>{p(`M22 ${y}H42L40 ${y+16}L32 ${y+22}L24 ${y+16}Z`,d);p(`M32 ${y}H42L40 ${y+16}L32 ${y+22}Z`,c);p(`M25 ${y+7}h5v2h-5ZM34 ${y+7}h5v2h-5Z`,a);};
  if(rang===0){ // un loup
    p('M10 84L18 56L32 50L46 56L54 84Z',b);p('M32 50L46 56L54 84H32Z',a);
    p('M14 22L20 0L30 18H34L44 0L50 22L48 38L32 56L16 38Z',c);p('M32 18h2L44 0L50 22L48 38L32 56Z',b);
    p('M20 6l5 10-4 2ZM44 6l-5 10 4 2Z',e);p('M20 28l9 3-8 3ZM44 28l-9 3 8 3Z',L);p('M27 40H37L32 50Z',a);
  }else if(rang===1){ // chapeau de paille et fourche
    tunique();visage();
    p('M6 30L32 20L58 30L32 34Z',L);p('M32 20L58 30L32 34Z',e);p('M22 25L26 10H38L42 25L32 21Z',L);p('M32 10h6l4 15-10-4Z',e);
    p('M-3 12h2.500v72H-3Z',e);p('M-8 0h2.500v14H-8ZM-3 0h2.500v14H-3ZM2 0h2.500v14H2ZM-8 12h12.500v3H-8Z',L);
  }else if(rang===2){ // capuche et arc
    tunique();visage(32);
    p('M17 52L19 26L32 6L45 26L47 52L40 32H24Z',b);p('M32 6L45 26L47 52L40 32H32Z',a);
    p('M3 2L-6 43L3 84L0 43Z',L);p('M3 2h1v82H3Z',e,.7);
  }else if(rang===3){ // chapel de fer et hallebarde
    acier();p('M24 52H40V84H24Z',c);visage();
    p('M10 30L32 20L54 30L32 34Z',AM);p('M32 20L54 30L32 34Z',AF);p('M22 25L32 8L42 25L32 21Z',AC);p('M32 8l10 17-10-4Z',AM);
    p('M-3 8h2.500v76H-3Z',e);p('M-.500 10L12 17L-.500 28Z',AC);p('M-1.800-4L1 10H-4.500Z',AC);
  }else if(rang===4){ // heaume à panache
    p('M32 14L38-2L58 2L46 18Z',c);p('M38-2L58 2L46 10Z',d);acier();
    p('M16 48L18 22L32 12L46 22L48 48L32 54Z',AM);p('M16 48L18 22L32 12V54Z',AC);p('M20 31h24l-2 7H22Z',N);p('M31 38h2v12h-2Z',N,.5);
  }else{ // grand heaume couronné, cape et bannière
    p('M0 84L12 54L32 48L52 54L64 84Z',c);p('M32 48L52 54L64 84H32Z',b);
    p('M14 84L18 58L32 52L46 58L50 84Z',AM);p('M32 52L46 58L50 84H32Z',AF);
    p('M17 50V18H47V50L32 56Z',AM);p('M17 50V18H32V56Z',AC);p('M20 30H44V34H20Z',N);p('M30 22h4v24h-4Z',N);
    p('M17 18L15 4L24 11L32 0L40 11L49 4L47 18Z',L);p('M32 0L40 11L49 4L47 18H32Z',e);
    p('M-5-4h2.500v88H-5Z',e);p('M-2.500-2H13L9 7L13 16H-2.500Z',c);
  }
  p('M28 52h32v14L44 84L28 66Z',c);p('M28 52h16v32L28 66Z',d);
  if(o.nu) return `<svg width="${w}" height="${w*88/72}" viewBox="-8 -4 72 88">${s}<g transform="translate(35 57) scale(.75)">${PIP[suit](L)}</g></svg>`;
  return `<svg width="${w}" height="${w*88/72}" viewBox="-8 -4 72 88" style="${o.style||''}">${s}<text x="44" y="72" text-anchor="middle" font-family="Alegreya Sans,sans-serif" font-weight="800" font-size="18" fill="#fff" stroke="${a}" stroke-width="3.500" paint-order="stroke">${val}</text></svg>`;
}

export const POUV={C:c=>ICO.soin(c),D:c=>ICO.pioche(c),P:c=>ICO.ecu(c,14),T:()=>'×2'};
export const rayons=(s,ou='50% 55%')=>`repeating-conic-gradient(from 9deg at ${ou},${S[s].t[2]} 0 18deg,${S[s].t[1]} 18deg 36deg)`;
export const MOT={C:'Soin',D:'Pioche',P:'Bouclier',T:'Double'};
/* la carte en grand : rayons, symbole en fond, personnage, bandeau du pouvoir */
export function carteGrande(v,s,figure,force){
  const {t:[a,b,c,d,e],L}=S[s];
  const art = figure
    ? `<svg class="perso" width="132" height="150" viewBox="0 -14 120 136"><path d="M42 14H78L106 42V80L78 108H42L14 80V42Z" fill="${a}" opacity=".92" stroke="${L}" stroke-width="2"/><path d="M48 24H72L96 48V74L72 98H48L24 74V48Z" fill="none" stroke="${d}" stroke-width="1.500" opacity=".7"/>${fig(figure)}</svg>`
    : `<svg class="fond" width="124" height="124" viewBox="0 0 24 24">${PIP[s](a)}</svg>${unite(v,s,{w:104,nu:1}).replace('<svg','<svg class="perso"')}`;
  return `<div class="cg" style="background:${rayons(s,'50% 44%')}">${art}<i class="cadre" style="border-color:${L}"></i>
    <div class="idx" style="background:${a};color:${L}">${v}${pip(s,18,L)}</div>
    <div class="ban" style="background:${a};color:${L}">${figure?ICO.epee(L,14)+force+' · ':''}${s==='T'?'×2 ':s==='C'?ICO.soin(L):s==='D'?ICO.pioche(L):ICO.ecu(L,14)}${MOT[s]}</div></div>`;
}


/* ---------- la salle du trône : trois gradins de quatre trônes ----------
   ch = { R: [[couleur, état] × 4], D: [...], V: [...] }, état : assis | vide | leve.
   o.clair : la lumière du milieu plus forte (victoire). */
export function decor(ch,o={}){
  let t='';
  [['R',40],['D',96],['V',152]].forEach(([r,y])=>{
    t+=`<path d="M48 ${y+52}h264l-6 8H54Z" fill="#2a5f8f"/><path d="M180 ${y+52}h132l-6 8H180Z" fill="#1f4a72"/>`;
    ch[r].forEach(([s,e],i)=>{t+=trone(65+i*60,y,r+s,e);});
  });
  const fen=x=>`<path d="M${x} 190V50l17-28 17 28v140Z" fill="#0b1626"/><path d="M${x+4} 186V52l13-22 13 22v134Z" fill="#fff0b0"/><path d="M${x+17} 30l13 22v134H${x+17}Z" fill="#f0c040"/><path d="M${x+15} 30h4v156h-4ZM${x+4} 96h26v4H${x+4}ZM${x+4} 140h26v4H${x+4}Z" fill="#0b1626"/>`;
  return `<svg class="abs salle" width="360" height="392" viewBox="0 0 360 392" aria-hidden="true">
    <rect width="360" height="214" fill="#17365a"/>
    <path d="M0 0h360v30L180 0Z" fill="#10263f"/><path d="M0 0h70v214H0Z" fill="#10263f" opacity=".5"/><path d="M290 0h70v214h-70Z" fill="#10263f" opacity=".5"/>
    ${fen(8)}${fen(318)}
    <rect y="214" width="360" height="178" fill="#1f4a72"/><path d="M0 214h360v14H0Z" fill="#10263f"/>
    <path d="M12 190h26L150 392H-60Z" fill="#fff0b0" opacity=".12"/><path d="M322 190h26L420 392H210Z" fill="#fff0b0" opacity=".12"/>
    <path d="M0 300L360 270V392H0Z" fill="#10263f" opacity=".35"/>
    <path d="M148 214h64l60 178H88Z" fill="#10263f"/><path d="M180 214h32l60 178h-92Z" fill="#0b1626"/>
    <path d="M150 0h60l70 392H80Z" fill="#fff0b0" opacity="${o.clair?.26:.1}"/><path d="M110 372L180 340L250 372L180 392Z" fill="#fff0b0" opacity=".16"/>
    <path d="M148 214h5L96 392h-8ZM212 214h-5l57 178h8Z" fill="#f0c040"/>${t}</svg>`;
}

export function medaille(m,t=40,eteinte){
  const c={or:['#fff0b0','#f0c040','#c98f1a'],argent:['#f4f7ff','#c3cbe2','#8f9abf'],bronze:['#f2c4a0','#d08a5a','#8a5030']}[m];
  return `<svg class="pip medaille" width="${t}" height="${t*1.25}" viewBox="0 0 40 50" opacity="${eteinte?.3:1}" aria-hidden="true"><path d="M10 0h8l4 22h-8Z" fill="#b8233f"/><path d="M30 0h-8l-4 22h8Z" fill="#7a1230"/><path d="M12 20H28L38 30V40L28 50H12L2 40V30Z" fill="${c[1]}"/><path d="M20 20h8l10 10v10L28 50h-8Z" fill="${c[2]}"/><path d="M14 26H26L32 32V38L26 44H14L8 38V32Z" fill="${c[0]}"/><path d="M20 26h6l6 6v6l-6 6h-6Z" fill="${c[1]}"/></svg>`;
}

/* L'écu de la riposte, à remplir. */
export const ECU='M8 6H132V64L70 130L8 64Z';
