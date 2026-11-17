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
const OR='#f0c040', OR_C='#fff0b0', OR_F='#c98f1a';

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
  RD:{ // César, d'après l'Auguste de Prima Porta : lauriers, cuirasse musclée sous le manteau agrafé
    antique:1,
    torse:(p,T)=>{p('M40 100H80L83 150H37Z',T.d);p('M60 100H80L83 150H60Z',T.c);
      p('M43 116L51 109L59 113V116L51 112L44 119Z',T.b);p('M77 116L69 109L61 113V116L69 112L76 119Z',T.a);
      p('M50 138h8v2h-8ZM62 138h8v2h-8ZM51 145h7v2h-7ZM62 145h7v2h-7Z',T.b);},
    devant:(p,T)=>{p('M70 100l6 6-6 6-6-6Z',OR);p('M70 103l3 3-3 3-3-3Z',OR_F);},
    face:(p,T)=>{p('M40 56L43 40L60 33L77 40L80 56L74 50H46Z',T.b);p('M60 33L77 40L80 56L74 50H60Z',T.a);
      p('M38 62L33 52L41 54ZM38 51L35 41L43 45ZM42 42L42 32L49 38ZM50 36L52 27L58 34Z',T.L);p('M82 62L87 52L79 54ZM82 51L85 41L77 45ZM78 42L78 32L71 38ZM70 36L68 27L62 34Z',T.e);
      p('M60 60l7 18h-7Z',T.b);p(BOUCHE,T.a);p('M58 92h4l-2 3Z',T.b);}},
  RT:{ // Alexandre, d'après la mosaïque d'Issos : tête nue en bataille, diadème à rubans, cuirasse de lin, sarisse
    doux:1,antique:1,
    dos:(p,T)=>{p('M42 50L28 58L24 72L32 64L44 54Z',OR_F);p('M42 53L34 70L30 86L38 74L45 56Z',OR);},
    torse:(p,T)=>{p('M41 100H79L81 150H39Z',T.L);p('M60 100H79L81 150H60Z',T.e);p('M41 142H79L80 150H40Z',T.d);p('M50 104L60 112L70 104L70 107L60 115L50 107Z',OR);},
    devant:(p,T,bas)=>{p(`M100 12h3v${bas-12}h-3Z`,T.e);p('M101.500 0L106 14H97Z',T.L);p(`M98 ${bas-4}h7v4h-7Z`,T.c);},
    face:(p,T)=>{p('M37 70L33 61L35 52L31 45L37 40L37 32L44 31L47 24L54 26L59 20L65 25L71 22L74 29L81 29L83 37L89 41L86 48L88 56L84 63L83 70L78 57L72 49L60 47L48 49L42 57Z',T.a);
      p('M44 33L50 30L49 37ZM56 27L62 25L60 32ZM67 28L73 31L67 35ZM37 44L42 41L41 48ZM80 41L85 45L79 47Z',T.b);
      p('M41 57L43 74L46 61Z',T.a);p('M79 57L77 74L74 61Z',T.a);
      p('M41 49H79L79 53H41Z',OR);p('M60 49H79V53H60Z',OR_F);p(BOUCHE,T.a);}},
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

/* Le signe porté sur la coiffe (x, y, taille) : couronne, diadème, casque. */
const COIFFE={
  RP:[[35,30,9],[52,27,9],[68,27,9],[85,30,9]], RC:[[47,42,9],[60,42,9],[73,42,9]], RD:[[60,31,11]], RT:[[60,51,7],[48,51,5],[72,51,5]],
  DP:[[64,36,9]], DC:[[60,35,10]], DD:[[49,54,6],[60,52,7],[71,54,6]], DT:[[60,49,7]],
  VP:[[60,43,8]], VC:[[60,40,8]], VD:[[60,13,8]], VT:[[60,47,6]]
};
const pipEn=(s,x,y,t,c)=>`<g transform="translate(${x-t/2} ${y-t/2}) scale(${t/24})">${PIP[s](c)}</g>`;

/* Une figure. Le palier se voit (maquette docs/maquettes/trone/figures-paliers.html,
   validée par Julie le 2026-11-16) : le Valet porte un tabard à son signe ; la Dame un
   manteau semé de son signe, un collier, une auréole ; le Roi une gloire de rayons, un
   manteau sombre semé d'or, l'hermine et un médaillon. Le signe est aussi sur la coiffe.
   Les antiques (César, Alexandre) n'ont pas d'hermine au col : leur cuirasse (torse) passe
   SOUS le manteau et ne se voit que dans son ouverture. */
export function fig(id,o={}){
  const r=id[0], suit=id[1], {t:[a,b,c,d,e],L}=S[suit], T={a,b,c,d,e,L}, q=QUI[id], full=!!o.full;
  const roi=r==='R', antique=!!q.antique, Y=full?226:150;
  let s='';
  const p=(pts,f,op)=>{s+=`<path d="${pts}" fill="${f}"${op?` opacity="${op}"`:''}/>`;};
  if(roi){
    let ray='';
    for(let i=0;i<18;i++){
      const a0=i/18*Math.PI*2, R2=i%2?58:70, pt=(an,R)=>`${(60+Math.cos(an)*R).toFixed(1)} ${(58+Math.sin(an)*R).toFixed(1)}`;
      ray+=`M${pt(a0-.09,30)}L${pt(a0,R2)}L${pt(a0+.09,30)}Z`;
    }
    p(ray,OR,.45);s+=`<circle cx="60" cy="58" r="34" fill="none" stroke="${OR_C}" stroke-width="2" opacity=".5"/>`;
  }else if(r==='D'){
    s+=`<circle cx="60" cy="58" r="40" fill="${L}" opacity=".08"/><circle cx="60" cy="58" r="40" fill="none" stroke="${L}" stroke-width="1.6" opacity=".45"/>`;
  }
  q.dos&&q.dos(p,T);
  const bas=full?'L118 226L2 226Z':'Z';
  p('M8 150L22 112L44 98L76 98L98 112L112 150'+bas,b);
  p(full?'M2 226L8 150L22 112L44 98L50 150L44 226Z':'M8 150L22 112L44 98L50 150Z',c);
  p(full?'M76 98L98 112L112 150L118 226L80 226L72 150Z':'M76 98L98 112L112 150L72 150Z',a);
  if(full) p('M50 150h20l8 76H42Z',a,.5);
  if(q.torse){
    q.torse(p,T);
    if(full){p('M40 150H80L81 176H39Z',id==='RT'?L:d);[42,49,56,63,70].forEach(x=>p(`M${x+4} 152h1.6v24h-1.6Z`,a,.5));}
  }
  if(r==='V'){
    p(`M47 104H73L${full?'76 '+Y+'H44':'73 '+Y+'H47'}Z`,d);p(`M60 104H73L${full?'76 '+Y+'H60':'73 '+Y+'H60'}Z`,c);p('M47 104H73V108H47Z',a);
    if(full) s+=pipEn(suit,60,178,18,a);
  }else{
    const fond=roi?a:b, fond2=roi?b:c, bord=roi?OR:L;
    p(`M44 98L22 112L8 150L${full?'2 '+Y+'H42L46 150':'6 '+Y+'H44'}L52 104Z`,fond2);
    p(`M76 98L98 112L112 150L${full?'118 '+Y+'H78L74 150':'114 '+Y+'H76'}L68 104Z`,fond);
    const ptsG=full?(roi?[[22,128],[14,160],[30,158],[10,194],[26,190],[38,214],[18,216]]:[[20,140],[16,186],[32,206]]):(roi?[[22,128],[16,144]]:[[20,138]]);
    s+=`<g opacity="${roi?.8:.75}">${[...ptsG,...ptsG.map(([x,y])=>[120-x,y])].map(([x,y])=>pipEn(suit,x,y,roi?11:10,roi?OR:L)).join('')}</g>`;
    p(`M52 104L46 150L${full?'42 '+Y+'H46L50 150':'44 '+Y+'H48'}L55 105Z`,bord,roi?1:.7);
    p(`M68 104L74 150L${full?'78 '+Y+'H74L70 150':'76 '+Y+'H72'}L65 105Z`,bord,roi?.85:.55);
    if(roi&&full){
      p('M2 212H42L41 226H2Z','#f4f1ff');p('M78 212H118V226H79Z','#dfe3f2');
      [8,20,32,86,98,110].forEach(x=>p(`M${x} 216l2 5-2 3-2-3Z`,'#14213a'));
    }
    if(roi&&!antique){
      p('M24 108L44 96L60 106L76 96L96 108L92 120L76 110L60 120L44 110L28 120Z','#f4f1ff');p('M60 106L76 96L96 108L92 120L76 110L60 120Z','#dfe3f2');
      [34,46,74,86].forEach(x=>p(`M${x} 108l2 5-2 3-2-3Z`,'#14213a'));
      s+=`<path d="M46 112L60 132L74 112" fill="none" stroke="${OR}" stroke-width="2.5"/><circle cx="60" cy="136" r="9" fill="${OR}"/><circle cx="60" cy="136" r="7" fill="${a}"/>${pipEn(suit,60,136,10,OR)}`;
    }else if(!roi){
      s+=`<path d="M48 104L60 118L72 104" fill="none" stroke="${L}" stroke-width="1.8" opacity=".9"/><circle cx="60" cy="119" r="2.6" fill="${L}"/>`;
    }
  }
  p('M52 84h16v16l-8 8-8-8Z',b);
  p('M42 50H78L80 70L70 90L60 96L50 90L40 70Z',d);
  p('M60 50H78L80 70L70 90L60 96Z',c);
  p('M40 70L50 90L53 76Z',e,.6);
  p('M60 62l5 16h-5Z',b);
  p(q.doux?'M44 58.500l13 2v2.500l-13-1.500ZM76 58.500l-13 2v2.500l13-1.500Z':'M43 57l15 4.500v2.500l-15-3.500ZM77 57l-15 4.500v2.500l15-3.500Z',a);
  p('M46 64l10 2-9 2.500ZM74 64l-10 2 9 2.500Z',L);
  q.face(p,T);
  q.devant&&q.devant(p,T,Y);
  s+=(COIFFE[id]||[]).map(([x,y,t])=>pipEn(suit,x,y,t,roi?OR:r==='D'?OR_C:L)).join('');
  if(!roi) s+=`<g transform="translate(51 127) scale(.75)">${PIP[suit](q.pip?T[q.pip]:L)}</g>`;
  else if(antique) s+=`<circle cx="60" cy="124" r="9" fill="${OR}"/><circle cx="60" cy="124" r="7" fill="${a}"/>${pipEn(suit,60,124,10,OR)}`;
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
