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

/* ---------- les troupes (2026-11-18, maquette docs/maquettes/trone/troupes.html) ----------
   Le buste des figures, une coiffe et une arme par rang ; l'As est un animal, un par couleur
   (chien, pie, faucon, chat). Même espace de dessin que fig(), même cadrage sur la table. */
const AC = '#eef1fa', AM = '#b4bdd9', AF = '#8691b8', AS = '#5d6890', N = '#0b1626';
const B1 = '#c4925a', B2 = '#8a5a2a', B3 = '#5a3a1a';
const oeil = (x, y, r, iris = '#1a1210') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${iris}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.38}" fill="#fff"/>`;

const rangTroupe = (v) => { const n = v === 'A' ? 1 : +v; return n === 1 ? 0 : n <= 3 ? 1 : n <= 5 ? 2 : n <= 7 ? 3 : n <= 9 ? 4 : 5; };

/* ---------- le buste commun (repris de fig) ---------- */
function buste(p, T, acier) {
  if (acier) {
    p('M8 150L22 112L44 98L76 98L98 112L112 150Z', AM);
    p('M8 150L22 112L44 98L50 150Z', AC);
    p('M76 98L98 112L112 150L72 150Z', AF);
    p('M47 104H73L73 150H47Z', T.d); p('M60 104H73V150H60Z', T.c); p('M47 104H73V108H47Z', T.a);
  } else {
    p('M8 150L22 112L44 98L76 98L98 112L112 150Z', T.b);
    p('M8 150L22 112L44 98L50 150Z', T.c);
    p('M76 98L98 112L112 150L72 150Z', T.a);
    p('M48 100L60 112L72 100L60 106Z', T.d);
  }
  p('M52 84h16v16l-8 8-8-8Z', T.b);
}
function visage(p, T) {
  p('M42 50H78L80 70L70 90L60 96L50 90L40 70Z', T.d);
  p('M60 50H78L80 70L70 90L60 96Z', T.c);
  p('M40 70L50 90L53 76Z', T.e, 0.6);
  p('M60 62l5 16h-5Z', T.b);
  p('M43 57l15 4.500v2.500l-15-3.500ZM77 57l-15 4.500v2.500l15-3.500Z', T.a);
  p('M46 64l10 2-9 2.500ZM74 64l-10 2 9 2.500Z', T.L);
}

/* ---------- les cinq soldats ---------- */
const SOLDATS = [
  null,
  { // 2-3 : le paysan, chapeau de paille, barbe de trois jours, fourche
    dos: (p) => { p('M95 24h4v130h-4Z', B2); p('M95 24h2v130h-2Z', B1); },
    face: (p, T) => {
      p('M42 72L50 88L60 94L70 88L78 72L80 76L70 93L60 99L50 93L40 76Z', T.b, 0.75);
      p('M54 85h12l-2 3h-8Z', T.a);
      p('M43 74a4 3 0 1 0 8 0a4 3 0 1 0-8 0ZM69 74a4 3 0 1 0 8 0a4 3 0 1 0-8 0Z', T.e, 0.45);
      p('M42 48L46 25L60 20L74 25L78 48L60 44Z', '#f0d78a'); p('M60 20L74 25L78 48L60 44Z', '#c9a24a');
      p('M43 40H77L78 46H42Z', T.b); p('M60 40H77L78 46H60Z', T.a);
      p('M22 53L60 43L98 53L60 61Z', '#f6e3a0'); p('M60 43L98 53L60 61Z', '#c9a24a');
      p('M22 53L18 57L26 55ZM98 53L102 58L94 55ZM34 57L32 62L38 58ZM84 58L87 63L81 59Z', '#c9a24a');
      p('M88 4h2.500v20h-2.500ZM95.500 0h3v24h-3ZM103 4h2.500v20H103ZM88 21h17.500v3.500H88Z', AM);
      p('M88 4h1.200v20H88ZM95.500 0h1.400v24h-1.400ZM103 4h1.200v20H103Z', AC);
    },
  },
  { // 4-5 : l'archer, capuche pointue, arc et carquois
    dos: (p, T, s) => {
      s.add('<path d="M28 -6Q2 50 28 106" fill="none" stroke="#5a3a1a" stroke-width="5"/><path d="M28 -6Q2 50 28 106" fill="none" stroke="#c4925a" stroke-width="2"/><path d="M28 -6V106" stroke="#f4ecd6" stroke-width="1"/>');
      p('M76 50L90 42L106 100L92 108Z', '#7a4a24'); p('M90 42L106 100L99 104L84 46Z', '#5a3418');
      p('M82 46L83 30L89 43ZM88 42L91 26L95 40ZM94 40L99 26L101 40Z', T.L); p('M86 44L89 30L89 43ZM92 41L95 28L95 40Z', T.e);
    },
    face: (p, T) => {
      p('M34 80L36 48L48 32L60 25L72 32L84 48L86 80L78 60L70 52H50L42 60Z', T.b);
      p('M60 25L72 32L84 48L86 80L78 60L70 52H60Z', T.a);
      p('M66 28L90 16L80 32Z', T.a); p('M66 28L90 16L76 26Z', T.b);
      p('M44 52H76L74 58H46Z', T.a, 0.75);
      p('M42 60L50 52H70L78 60L76 62L69 55H51L44 62Z', T.d);
      p('M55 85l5 1.500 5-1.500-5 2.500Z', T.a);
    },
  },
  { // 6-7 : le garde, chapel de fer sur une coiffe de mailles, moustache, hallebarde
    acier: 1,
    dos: (p) => { p('M97 14h3.500v140H97Z', B2); p('M97 14h1.500v140H97Z', B1); },
    avant: (p) => { p('M36 58L40 46H80L84 58V88L72 104H48L36 88Z', AF); p('M60 46H80L84 58V88L72 104H60Z', AS);
      for (let y = 60; y < 100; y += 6) p(`M38 ${y}H82V${y + 1.2}H38Z`, AS, 0.5); },
    face: (p, T) => {
      p('M46 79L60 82L74 79L69 87L60 84L51 87Z', T.a);
      p('M42 50L45 30L60 22L75 30L78 50Z', AC); p('M60 22L75 30L78 50H60Z', AM);
      p('M43 45H77V50H43Z', AF);
      p('M26 51L60 44L94 51L88 59L60 53L32 59Z', AM); p('M60 44L94 51L88 59L60 53Z', AF);
      p('M47 47a1.500 1.500 0 1 0 3 0a1.500 1.500 0 1 0-3 0ZM58.500 47a1.500 1.500 0 1 0 3 0a1.500 1.500 0 1 0-3 0ZM70 47a1.500 1.500 0 1 0 3 0a1.500 1.500 0 1 0-3 0Z', AC);
      p('M97 22L83 17L80 30L83 43L97 39Z', AC); p('M97 22L86 19L86 41L97 39Z', AM); p('M83 17L80 30L83 43L81 30Z', '#fff');
      p('M97 14L98.750-4L100.500 14Z', AC); p('M100.500 26L106 30L100.500 33Z', AM);
    },
  },
  { // 8-9 : le chevalier, heaume à visière, panache, épée droite
    acier: 1,
    dos: (p, T) => {
      p('M22-2L26-6L30-2V84H22Z', AC); p('M26-6L30-2V84H26Z', AM);
      p('M14 84H38V89H14Z', OR); p('M26 84H38V89H26Z', OR_F); p('M24 89h4v14h-4Z', B3);
      p('M22 103a4 4 0 1 0 8 0a4 4 0 1 0-8 0Z', OR);
    },
    face: (p, T) => {
      p('M58 30L62 10L76 0L100 2L86 9L98 16L80 20L68 30Z', T.c); p('M62 10L76 0L100 2L86 6L70 9Z', T.d); p('M68 30L80 20L98 16L84 22Z', T.b);
      p('M38 96L36 54L42 37L60 27L78 37L84 54L82 96L60 104Z', AM);
      p('M38 96L36 54L42 37L60 27V104Z', AC);
      p('M59 27h2v77h-2Z', AF);
      p('M42 58H78L77 64H43Z', N);
      p('M48 60.500h6v1.200h-6ZM66 60.500h6v1.200h-6Z', '#fff', 0.8);
      p('M66 74h3v3h-3ZM72 74h3v3h-3ZM66 80h3v3h-3ZM72 80h3v3h-3ZM66 86h3v3h-3ZM72 86h3v3h-3Z', N);
      p('M36 54L42 37L46 40L41 56Z', '#fff', 0.5);
    },
  },
  { // 10 : le champion, grand heaume couronné, bannière à son signe, manteau
    dos: (p, T, s, suit) => {
      p('M19-6h3.500v160H19Z', B2); p('M19-6h1.500v160H19Z', B1);
      p('M22.500 0H54L47 15L54 30H22.500Z', T.c); p('M22.500 0H54L47 15H22.500Z', T.d);
      s.add(pipEn(suit, 35, 15, 14, T.L));
      p('M18 112L28 84L44 98L36 150H10Z', T.a); p('M102 112L92 84L76 98L84 150H110Z', T.a);
    },
    face: (p, T, s, suit) => {
      p('M38 98V36H82V98L60 106Z', AM); p('M38 98V36H60V106Z', AC);
      p('M38 36L44 30H76L82 36Z', AC); p('M38 36H82V40H38Z', OR); p('M60 36H82V40H60Z', OR_F);
      p('M42 58H78V64H42Z', N); p('M58.500 64h3v16h-3Z', N);
      p('M48 60.500h6v1.200h-6ZM66 60.500h6v1.200h-6Z', '#fff', 0.8);
      p('M44 74h3v3h-3ZM44 80h3v3h-3ZM73 74h3v3h-3ZM73 80h3v3h-3Z', N);
      p('M38 32L35 12L46 20L53 7L60 17L67 7L74 20L85 12L82 32Z', OR); p('M60 17L67 7L74 20L85 12L82 32H60Z', OR_F);
      s.add(`<circle cx="60" cy="25" r="5" fill="${T.a}"/>` + pipEn(suit, 60, 25, 7, OR_C));
      p('M30 104L44 96L60 104L76 96L90 104L84 110L60 108L36 110Z', OR, 0.9);
    },
  },
];

function soldatSVG(rang, suit) {
  const [a, b, c, d, e] = S[suit].t, T = { a, b, c, d, e, L: S[suit].L }, q = SOLDATS[rang];
  let s = ''; const p = (d0, f, op) => { s += `<path d="${d0}" fill="${f}"${op ? ` opacity="${op}"` : ''}/>`; };
  const ajout = { add: (h) => { s += h; } };
  q.dos && q.dos(p, T, ajout, suit);
  buste(p, T, q.acier);
  q.avant && q.avant(p, T);
  visage(p, T);
  q.face(p, T, ajout, suit);
  return s;
}

/* ---------- les quatre compagnons (l'As) ---------- */
function chien(p, T, s, suit) {
  const F = '#3e2614', M = '#7c4e2a', C = '#a8703e', K = '#dcae78';
  p('M96 102L104 84L106 66L100 68L98 84L90 98Z', M); p('M100 68L106 66L104 84Z', F);
  p('M70 106L72 80L88 80L98 106Z', M); p('M84 80L88 80L98 106H86Z', F);
  p('M40 106L44 72L56 60H72L80 74L84 106Z', C); p('M62 60H72L80 74L84 106H62Z', M);
  p('M50 70L56 64H68L72 74L68 96L60 102L52 96L48 80Z', K);
  p('M46 106L48 78H56L57 106Z', C); p('M61 106L62 80H70L71 106Z', M);
  p('M44 100h14v6H44ZM59 100h14v6H59Z', K); p('M50 102v4M53 102v4M65 102v4M68 102v4', K);
  s.add(`<path d="M48 101.500v4.500M52 101.500v4.500M63 101.500v4.500M67 101.500v4.500" stroke="${M}" stroke-width=".8"/>`);
  p('M46 62L74 62L76 68L44 68Z', T.b); p('M60 62L74 62L76 68H60Z', T.a);
  s.add(`<circle cx="60" cy="74" r="6.500" fill="${OR}"/><circle cx="60" cy="74" r="5" fill="${OR_F}"/>` + pipEn(suit, 60, 74, 7, T.L));
  p('M42 34L50 20L60 18L70 20L78 34L76 50L60 54L44 50Z', C); p('M60 18L70 20L78 34L76 50L60 54Z', M);
  p('M52 22L58 34L56 46L50 40Z', K, 0.5);
  p('M43 28L32 34L30 58L38 62L46 46Z', F); p('M77 28L88 34L90 58L82 62L74 46Z', F); p('M43 28L36 34L35 56L40 60Z', M);
  p('M50 46L70 46L69 58L60 63L51 58Z', K); p('M60 46L70 46L69 58L60 63Z', C);
  p('M55 49L65 49L63 54L60 55.500L57 54Z', '#1e120a'); p('M56.500 49.800h3l-1.200 1.400Z', '#fff', 0.7);
  s.add('<path d="M60 55.500v3M56 60q4 3 8 0" fill="none" stroke="#1e120a" stroke-width="1.300" stroke-linecap="round"/>');
  p('M58 61h4l-.500 4h-3Z', '#e8607a');
  p('M48 33h7l-1 2h-5ZM65 33h7l-1 2h-5Z', K, 0.7);
  s.add(oeil(52, 39, 3.300, '#2a1608') + oeil(68, 39, 3.300, '#2a1608'));
}
function pie(p, T, s, suit) {
  const NO = '#151a26', NO2 = '#2b3346', BL = '#eef1f6', BL2 = '#c3cad8', BLEU = '#2a4f86', BLEU2 = '#4f86c6', VERT = '#2f7f72';
  s.add(`<path d="M55 92v12M63 92v12" stroke="#2a2a30" stroke-width="2"/><path d="M50 105h9M59 105h9" stroke="#2a2a30" stroke-width="2" stroke-linecap="round"/>`);
  p('M72 84L106 102L104 108L68 92Z', BLEU); p('M74 86L106 102L104 105Z', VERT, 0.8);
  p('M44 62L56 50L72 54L82 70L76 90L58 96L46 86Z', NO);
  p('M47 66L59 61L70 69L68 88L57 93L48 83Z', BL); p('M59 61L70 69L68 88L57 93Z', BL2);
  p('M66 56L84 63L94 84L78 92L71 74Z', BLEU); p('M70 60L86 66L92 80L80 72Z', BLEU2, 0.7);
  p('M66 58L79 62L75 72L67 67Z', BL); p('M73 60L79 62L75 72Z', BL2);
  p('M44 36L55 27L66 29L71 41L65 54L50 54L43 45Z', NO); p('M55 27L66 29L71 41L60 34Z', NO2);
  p('M45 38L28 43L45 46Z', '#3c414c'); p('M45 38L28 43L45 42Z', '#5a606c');
  p('M28 33L35 42L28 51L21 42Z', OR); p('M28 33L35 42L28 51Z', OR_F); p('M26 38l2-2 2 2-2 2Z', OR_C);
  s.add(oeil(55, 38, 2.900, '#2a1608'));
}
function faucon(p, T, s, suit) {
  const D = '#3b332c', M = '#5e5246', C2 = '#857565', CR = '#efe3c8', CR2 = '#cdbf9e', J = '#f0c040', J2 = '#c98f1a';
  // de trois quarts, tourné vers la gauche (un faucon de face se lisait comme une chouette)
  p('M68 90L88 112L78 115L62 96Z', D); p('M70 92L86 110L82 111Z', C2);
  p('M14 98L106 93L106 100L14 105Z', B2); p('M14 102L106 97L106 100L14 105Z', B3);
  p('M54 42L74 48L86 72L82 96L64 98L58 70Z', M);
  p('M74 48L86 72L82 96L76 95L78 72Z', D);
  for (const y of [60, 70, 80, 90]) p(`M64 ${y}L80 ${y - 4}L81 ${y - 1}L65 ${y + 3}Z`, D, 0.55);
  p('M42 46L56 42L64 70L62 92L50 95L41 80L38 60Z', CR); p('M56 42L64 70L62 92L56 93L58 70Z', CR2);
  for (const [x, y] of [[44, 58], [51, 62], [45, 68], [53, 72], [46, 78], [54, 82], [49, 88]]) p(`M${x} ${y}l2.500-1.500 2.500 1.500-2.500 1.500Z`, D, 0.8);
  p('M47 92h7v6h-7ZM57 92h7v6h-7Z', J); p('M47 97l-2 3h3ZM50 98v3M57 97l-2 3h3ZM60 98v3', J2);
  s.add(`<path d="M52 98l-3 5M61 98l1 5" stroke="${T.c}" stroke-width="2"/>`);
  p('M45 101l4 10 4-10ZM58 101l4 10 4-10Z', T.c); p('M48 111l-1 3h2ZM61 111l-1 3h2Z', T.d);
  p('M36 28L44 17L58 16L66 24L65 40L57 48L43 49L36 40Z', M);
  p('M36 28L44 17L58 16L66 24L60 27L46 25Z', D);
  p('M38 37L49 34L57 46L44 49Z', CR); p('M57 26L65 28L64 40L58 45L54 34Z', C2);
  p('M47 30L53 32L52 47L46 44Z', D);
  p('M37 27L33 29L37 33Z', J);
  p('M37 28L29 31L27 38L31 36L37 35Z', '#4b5770'); p('M33 30L29 31L27 38L30 35Z', '#2f3850');
  s.add(`<circle cx="44" cy="29" r="4.300" fill="${J}"/>` + oeil(44, 29, 3, '#120c08'));
}
function chat(p, T, s, suit) {
  const G1 = '#dfe2ea', G2 = '#8e93a3', G3 = '#5f6474', R = '#363a46', ROSE = '#e8a0b0';
  p('M38 106L72 104L96 99L102 88L97 87L92 96L70 100L38 102Z', G3); p('M96 99L102 88L104 90L98 100Z', R);
  p('M44 104L46 76L56 62H68L76 74L82 104Z', G2); p('M62 62H68L76 74L82 104H64Z', G3);
  p('M46 84L52 82L50 86ZM45 92L52 90L50 94ZM78 84L72 82L74 86ZM79 92L72 90L74 94Z', R);
  p('M52 70L58 64H66L70 74L66 96L60 100L54 96L50 80Z', G1);
  p('M48 104L50 80H57V104Z', G2); p('M62 104V82H69L70 104Z', G3);
  p('M46 100h12v6H46ZM61 100h11v6H61Z', G1);
  s.add(`<path d="M50 102v4M54 102v4M65 102v4M68 102v4" stroke="${G2}" stroke-width=".8"/>`);
  p('M43 38L44 15L57 30Z', G2); p('M46.500 32L46.500 21L53 29.500Z', ROSE);
  p('M77 38L76 15L63 30Z', G3); p('M73.500 32L73.500 21L67 29.500Z', ROSE, 0.8);
  p('M41 40L48 29L60 27L72 29L79 40L79 52L70 60L60 62L50 60L41 52Z', G2);
  p('M60 27L72 29L79 40L79 52L70 60L60 62Z', G3);
  p('M57.500 29h1.800v8h-1.800ZM61 29h1.800v8H61ZM53 30l2 6h-1.800ZM67 30l-2 6h1.800Z', R);
  p('M41 46l6 1-6 2ZM79 46l-6 1 6 2Z', R);
  p('M51 48L60 45L69 48L67 56L60 60L53 56Z', G1);
  p('M57.500 49h5L60 52Z', ROSE);
  s.add(`<path d="M60 52v2.500M56.500 56q3.500 2.500 3.500-1.500q0 4 3.500 1.500" fill="none" stroke="${R}" stroke-width="1.100" stroke-linecap="round"/>`);
  s.add(`<path d="M50 52L36 50M50 54L36 56M70 52L84 50M70 54L84 56" stroke="${G1}" stroke-width=".7" opacity=".9"/>`);
  for (const x of [52, 68]) s.add(`<ellipse cx="${x}" cy="41" rx="3.800" ry="3.200" fill="#c9d256"/><ellipse cx="${x}" cy="41" rx="1.100" ry="2.800" fill="#14120c"/><circle cx="${x - 1.400}" cy="39.600" r="1" fill="#fff"/>`);
  p('M47 62L73 62L74 67L46 67Z', T.b); p('M60 62H73L74 67H60Z', T.a);
  s.add(`<circle cx="60" cy="72" r="5.500" fill="${OR}"/><circle cx="60" cy="72" r="4.200" fill="${OR_F}"/>` + pipEn(suit, 60, 72, 6, T.L));
}
const DESSIN_BETE = { C: chien, D: pie, T: faucon, P: chat };
function beteSVG(suit) {
  const [a, b, c, d, e] = S[suit].t, T = { a, b, c, d, e, L: S[suit].L };
  let s = ''; const p = (d0, f, op) => { s += `<path d="${d0}" fill="${f}"${op ? ` opacity="${op}"` : ''}/>`; };
  DESSIN_BETE[suit](p, T, { add: (h) => { s += h; } }, suit);
  return s;
}

/* Une troupe (As à 10), cadrée comme les figures sur la table. */
export function troupe(v,suit,w=50,o={}){
  const r=rangTroupe(v), corps=r===0?beteSVG(suit):soldatSVG(r,suit);
  return `<svg${o.cls?` class="${o.cls}"`:''} width="${w}" height="${(w*112/92).toFixed(1)}" viewBox="14 -6 92 112" aria-hidden="true">${corps}</svg>`;
}

export const POUV={C:c=>ICO.soin(c),D:c=>ICO.pioche(c),P:c=>ICO.ecu(c,14),T:()=>'×2'};
export const rayons=(s,ou='50% 55%')=>`repeating-conic-gradient(from 9deg at ${ou},${S[s].t[2]} 0 18deg,${S[s].t[1]} 18deg 36deg)`;
export const MOT={C:'Soin',D:'Pioche',P:'Bouclier',T:'Double'};
/* la carte en grand : rayons, symbole en fond, personnage, bandeau du pouvoir */
export function carteGrande(v,s,figure,force){
  const {t:[a,b,c,d,e],L}=S[s];
  const art = figure
    ? `<svg class="perso" width="132" height="150" viewBox="0 -14 120 136"><path d="M42 14H78L106 42V80L78 108H42L14 80V42Z" fill="${a}" opacity=".92" stroke="${L}" stroke-width="2"/><path d="M48 24H72L96 48V74L72 98H48L24 74V48Z" fill="none" stroke="${d}" stroke-width="1.500" opacity=".7"/>${fig(figure)}</svg>`
    : `<svg class="fond" width="124" height="124" viewBox="0 0 24 24">${PIP[s](a)}</svg>${troupe(v,s,104,{cls:'perso'})}`;
  return `<div class="cg" style="background:${rayons(s,'50% 44%')}">${art}<i class="cadre" style="border-color:${L}"></i>
    <div class="idx" style="background:${a};color:${L}">${v}${pip(s,18,L)}</div>
    <div class="ban" style="background:${a};color:${L}">${figure?ICO.epee(L,14)+force+' · ':''}${s==='T'?'×2 ':s==='C'?ICO.soin(L):s==='D'?ICO.pioche(L):ICO.ecu(L,14)}${MOT[s]}</div></div>`;
}


/* ---------- la salle du trône (piste A, choisie par Julie le 2026-11-18 sur
   docs/maquettes/trone/decors-planche.png) : elle change avec le palier, on monte vers
   le trône. Contre les Valets la salle de garde, contre les Dames la galerie aux
   tapisseries, contre les Rois (et sur l'accueil) la grande salle au tapis rouge.
   Les douze trônes, l'avancement de la partie, sont les mêmes partout. ---------- */
// La scène fait 424 de haut depuis 1.5.0 (392 avant) : le sol a grandi, pas le mur.
const W = 360, H = 424;
const COUL = { C: ['#7a1230', '#b8233f', '#ffc4cb'], D: ['#8a5a10', '#c98f1a', '#fff0b0'], T: ['#17503a', '#2a8058', '#c6f0d2'], P: ['#33287a', '#5648b8', '#cfc8ff'] };
const r = (n) => Math.round(n * 10) / 10;

/* La salle de garde : les trônes dans un grand bureau de bois (2026-11-18, Julie : « on dirait
   une étagère »). Le bureau d'une rangée passe DEVANT ses trônes, la rangée du dessous devant lui.
   Marbre et bleu ont été essayés dans les deux autres salles et refusés. */
const BOIS = { dessus: '#a8743c', face: '#7a4e26', ombre: '#5a3a1a', lisere: '#c4925a', panneau: '#3a2614' };
// Julie (2026-11-19) : un grand bureau, mais les visages ENTIERS comme avant. Le plateau
// passe sous le trône (y+50), la façade descend jusqu'à la rangée suivante (pas de 66) ; le
// bureau des valets, lui, descend jusqu'au sol (BAS_MEUBLE). Un panneau plein derrière
// les rangées en fait un seul meuble (sans lui, ce sont des étagères). Une plaque à son
// signe devant chaque siège.
const RANGS_TRONES = [['R', 10], ['D', 76], ['V', 142]], BAS_MEUBLE = 232;
function dosMeuble(b) {
  const y0 = RANGS_TRONES[0][1] + 50, y1 = BAS_MEUBLE;
  return `<path d="M40 ${y0}h280v${y1 - y0}H40Z" fill="${b.panneau}"/><path d="M40 ${y0}h280v${y1 - y0}H40Z" fill="${b.face}" opacity=".55"/>`
    + `<path d="M180 ${y0}h140v${y1 - y0}H180Z" fill="#0b1626" opacity=".18"/>`;
}
function bureau(y, b, sieges, bas) {
  const h = bas - (y + 55);
  let pan = '', plaques = '';
  sieges.forEach(([s], i) => {
    const x = 65 + i * 60;
    pan += `M${x + 1} ${y + 57}h48v${h - 4}h-48Z`;
    plaques += `<path d="M${x + 15} ${y + 57}h20v9h-20Z" fill="${b.lisere}"/>${pipEn(s, x + 25, y + 61.5, 6.5, b.panneau)}`;
  });
  return `<path d="M34 ${y + 50}h292l-6 5H40Z" fill="${b.dessus}"/><path d="M40 ${y + 55}h280v${h}H40Z" fill="${b.face}"/><path d="M180 ${y + 55}h140v${h}H180Z" fill="${b.ombre}"/>`
    + `<path d="${pan}" fill="${b.panneau}" opacity=".35"/><path d="M40 ${y + 55}h280v1.500H40Z" fill="${b.lisere}"/>${plaques}`
    + `<path d="M40 ${bas}h280v2H40Z" fill="#0b1626" opacity=".4"/>`;
}
/* Galerie et grande salle gardent les rebords de la 1.6.1 (Julie, 2026-11-19 : « que le
   bureau en bois, pas les autres ») : trois gradins, rangées en 40, 96, 152. */
const RANGS_GRADINS = [['R', 40], ['D', 96], ['V', 152]];
function rebords(dessus, dessous, face) {
  return RANGS_GRADINS.map(([, y]) => `<path d="M48 ${y + 52}h264l-6 8H54Z" fill="${dessus}"/><path d="M180 ${y + 52}h132l-6 8H180Z" fill="${dessous}"/>${face ? `<path d="M54 ${y + 60}h252v3H54Z" fill="${face}"/>` : ''}`).join('');
}
/* appareil de pierre : rangs de blocs décalés */
function pierres(x0, y0, x1, y1, h, l, c, op = 1) {
  let d = '';
  for (let y = y0, k = 0; y < y1; y += h, k++) {
    d += `M${x0} ${y}H${x1}v1.300H${x0}Z`;
    for (let x = x0 + (k % 2 ? l / 2 : 0); x < x1; x += l) d += `M${x} ${y}h1.300v${Math.min(h, y1 - y)}H${x}Z`;
  }
  return `<path d="${d}" fill="${c}" opacity="${op}"/>`;
}
/* sol en perspective vers (180, 140) : lignes de fuite et rangs */
const fuite = (x, y) => 180 + (x - 180) * (y - 140) / (H - 140);
function lattes(c, n = 13, larg = 46) {
  let d = '';
  for (let i = -n; i <= n; i++) { const xb = 180 + i * larg; d += `M${r(fuite(xb, 214))} 214L${xb} ${H}L${xb + 1.6} ${H}L${r(fuite(xb + 1.6, 214)) + 0.3} 214Z`; }
  return `<path d="${d}" fill="${c}"/>`;
}
function damier(c1, c2) {
  const ys = [214, 222, 232, 245, 262, 284, 312, 350, 392, H];
  let a = '', b = '';
  for (let k = 0; k < ys.length - 1; k++) {
    for (let i = -9; i < 9; i++) {
      const xa = 180 + i * 40, xb = xa + 40, y0 = ys[k], y1 = ys[k + 1];
      const pts = `M${r(fuite(xa, y0))} ${y0}L${r(fuite(xb, y0))} ${y0}L${r(fuite(xb, y1))} ${y1}L${r(fuite(xa, y1))} ${y1}Z`;
      if ((i + k) % 2) a += pts; else b += pts;
    }
  }
  return `<path d="${a}" fill="${c1}"/><path d="${b}" fill="${c2}"/>`;
}
let nTorche = 0;
const torche = (x, y, id = 'torche' + (++nTorche)) => `<radialGradient id="${id}"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <circle cx="${x}" cy="${y - 10}" r="46" fill="url(#${id})"/>
  <path d="M${x - 2} ${y}h4l-1 22h-2Z" fill="#5a3a1a"/><path d="M${x - 6} ${y + 14}h12v3H${x - 6}Z" fill="#2a2a30"/>
  <path d="M${x - 5} ${y}h10l-2 5h-6Z" fill="#3a2a20"/>
  <path d="M${x} ${y - 22}C${x + 9} ${y - 10} ${x + 7} ${y} ${x} ${y}C${x - 7} ${y} ${x - 9} ${y - 10} ${x} ${y - 22}Z" fill="#f07a20"/>
  <path d="M${x} ${y - 14}C${x + 5} ${y - 6} ${x + 4} ${y} ${x} ${y}C${x - 4} ${y} ${x - 5} ${y - 6} ${x} ${y - 14}Z" fill="#fff0b0"/>`;
const poussiere = (n, couleur, graine = 3) => { let s = '', g = graine; const h = () => (g = (g * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) s += `<circle cx="${r(130 + h() * 100)}" cy="${r(20 + h() * 300)}" r="${r(0.6 + h() * 1.2)}" fill="${couleur}" opacity="${r(0.25 + h() * 0.5)}"/>`; return s; };

/* ---------------- A · la salle qui change avec le palier ---------------- */
const CADRE = `<path d="M148 214h64l68 ${H - 214}H80Z" fill="#10263f" opacity=".85"/><path d="M180 214h32l68 ${H - 214}H180Z" fill="#0b1626" opacity=".85"/><path d="M148 214h5L88 ${H}h-8ZM212 214h-5l65 ${H - 214}h8Z" fill="#f0c040"/>`;
function salleGarde() { // contre les Valets : la salle de garde
  return `<rect width="${W}" height="214" fill="#2b405e"/>${pierres(0, 0, W, 214, 15, 34, '#1e2f48')}
    <path d="M0 0h360v24L180 4Z" fill="#162740"/>
    ${torche(24, 104)}${torche(336, 104)}
    <path d="M10 150L38 206M38 150L10 206" stroke="#8a5a2a" stroke-width="3"/><path d="M8 144l3 8-5-1ZM40 144l-3 8 5-1Z" fill="#c3cbe2"/>
    <circle cx="24" cy="180" r="13" fill="#5a3a1a"/><circle cx="24" cy="180" r="10" fill="#8a5a2a"/><circle cx="24" cy="180" r="3.500" fill="#c3cbe2"/>
    <path d="M326 146h20v62h-20Z" fill="#3a2a20"/><path d="M329 150h4v54h-4ZM335 150h4v54h-4ZM341 150h3v54h-3Z" fill="#8a5a2a"/><path d="M328 146l3-8 3 8ZM334 146l3-10 3 10ZM340 146l2.500-8 2.500 8Z" fill="#c3cbe2"/>
    <rect y="214" width="${W}" height="${H - 214}" fill="#3b2a1e"/>${lattes('#2a1d14')}
    <path d="M0 214h360v10H0Z" fill="#1b130d"/>
    <path d="M0 300L360 270V${H}H0Z" fill="#0b0805" opacity=".25"/>
    <path d="M110 404L180 372L250 404L180 ${H}Z" fill="#ffb347" opacity=".08"/>${CADRE}`;
}
function galerieDames() { // contre les Dames : la galerie aux tapisseries
  const tap = (x, s) => { const [f, m, c] = COUL[s]; return `<path d="M${x} 14h18v150l-9 10-9-10Z" fill="${m}"/><path d="M${x + 9} 14h9v150l-9 10Z" fill="${f}"/>
    <path d="M${x + 2} 22h14v2H${x + 2}ZM${x + 2} 150h14v2H${x + 2}Z" fill="${c}" opacity=".7"/>${pipEn(s, x + 9, 50, 12, c)}${pipEn(s, x + 9, 120, 8, c)}
    <path d="M${x - 2} 10h22v5H${x - 2}Z" fill="#f0c040"/>`; };
  return `<rect width="${W}" height="214" fill="#1f3a62"/>
    <path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `M${i * 45} 0h1.500v214H${i * 45}Z`).join('')}" fill="#17304f"/>
    <path d="M0 0h360v24L180 4Z" fill="#162a48"/><path d="M0 196h360v18H0Z" fill="#17304f"/><path d="M0 196h360v2H0Z" fill="#f0c040" opacity=".5"/>
    ${tap(3, 'C')}${tap(25, 'D')}${tap(317, 'T')}${tap(339, 'P')}
    <rect y="214" width="${W}" height="${H - 214}" fill="#1d3358"/>${damier('#2a4a7a', '#5d74a0')}
    <path d="M0 214h360v8H0Z" fill="#132542"/>
    <path d="M0 214h360v${H - 214}H0Z" fill="#0b1626" opacity=".35"/>
    ${CADRE}<path d="M150 0h60l70 ${H}H80Z" fill="#fff0b0" opacity=".07"/>
    ${rebords('#dfe5f2', '#a9b4cc', '#7f8bb3')}`;
}
function grandeSalle(clair) { // contre les Rois : la grande salle, tapis jusqu'à l'estrade
  const fen = (x) => `<path d="M${x} 190V50l17-28 17 28v140Z" fill="#0b1626"/><path d="M${x + 4} 186V52l13-22 13 22v134Z" fill="#fff0b0"/><path d="M${x + 17} 30l13 22v134H${x + 17}Z" fill="#f0c040"/><path d="M${x + 15} 30h4v156h-4ZM${x + 4} 96h26v4H${x + 4}ZM${x + 4} 140h26v4H${x + 4}Z" fill="#0b1626"/>`;
  return `<rect width="${W}" height="214" fill="#17365a"/>
    <path d="M0 0h360v30L180 0Z" fill="#10263f"/><path d="M0 0h70v214H0Z" fill="#10263f" opacity=".5"/><path d="M290 0h70v214h-70Z" fill="#10263f" opacity=".5"/>
    ${fen(8)}${fen(318)}
    <path d="M60 0h8v214h-8ZM292 0h8v214h-8Z" fill="#f0c040" opacity=".6"/>
    <rect y="214" width="${W}" height="${H - 214}" fill="#1f4a72"/>${pierres(0, 214, W, H, 22, 60, '#173a5e', 0.6)}<path d="M0 214h360v14H0Z" fill="#10263f"/>
    <path d="M12 190h26L150 ${H}H-60Z" fill="#fff0b0" opacity=".12"/><path d="M322 190h26L420 ${H}H210Z" fill="#fff0b0" opacity=".12"/>
    <path d="M150 214h60l74 ${H - 214}H76Z" fill="#7a1230"/><path d="M180 214h30l74 ${H - 214}H180Z" fill="#5a0c22"/>
    <path d="M150 214h4L82 ${H}h-6ZM210 214h-4l72 ${H - 214}h6Z" fill="#f0c040"/>
    <path d="M140 214h80v-8h-80Z" fill="#f0c040"/><path d="M180 206h40v8h-40Z" fill="#c98f1a"/>
    <path d="M150 0h60l70 ${H}H80Z" fill="#fff0b0" opacity="${clair ? 0.26 : 0.12}"/>${poussiere(26, '#fff0b0')}
    ${rebords('#2a5f8f', '#1f4a72', '#f0c040')}`;
}

/* ch = { R: [[couleur, état] × 4], D: [...], V: [...] }, état : assis | vide | leve.
   o.palier : V, D ou R (la grande salle par défaut) ; o.clair : plus de lumière (victoire). */
const FONDS={};
export function decor(ch,o={}){
  let t='';
  const bu=BOIS;
  if(o.palier==='V'){ // le grand bureau, dans la salle de garde seulement
    t+=dosMeuble(bu);
    RANGS_TRONES.forEach(([r,y],k)=>{ch[r].forEach(([s,e],i)=>{t+=trone(65+i*60,y,r+s,e);});t+=bureau(y,bu,ch[r],k<2?RANGS_TRONES[k+1][1]:BAS_MEUBLE);});
    t+=`<path d="M30 ${BAS_MEUBLE+2}h300l12 8H18Z" fill="#0b1626" opacity=".3"/>`;
  } else RANGS_GRADINS.forEach(([r,y])=>{ch[r].forEach(([s,e],i)=>{t+=trone(65+i*60,y,r+s,e);});});
  // Le fond ne dépend que du palier et de la lumière : construit une fois, puis réutilisé
  // (decor est rappelé à chaque carte touchée).
  const cle=(o.palier||'R')+(o.clair?'+':'');
  const fond=FONDS[cle]||(FONDS[cle]=o.palier==='V'?salleGarde():o.palier==='D'?galerieDames():grandeSalle(o.clair));
  return `<svg class="abs salle" width="360" height="${H}" viewBox="0 0 360 ${H}" aria-hidden="true">${fond}${t}</svg>`;
}

export function medaille(m,t=40,eteinte){
  const c={or:['#fff0b0','#f0c040','#c98f1a'],argent:['#f4f7ff','#c3cbe2','#8f9abf'],bronze:['#f2c4a0','#d08a5a','#8a5030']}[m];
  return `<svg class="pip medaille" width="${t}" height="${t*1.25}" viewBox="0 0 40 50" opacity="${eteinte?.3:1}" aria-hidden="true"><path d="M10 0h8l4 22h-8Z" fill="#b8233f"/><path d="M30 0h-8l-4 22h8Z" fill="#7a1230"/><path d="M12 20H28L38 30V40L28 50H12L2 40V30Z" fill="${c[1]}"/><path d="M20 20h8l10 10v10L28 50h-8Z" fill="${c[2]}"/><path d="M14 26H26L32 32V38L26 44H14L8 38V32Z" fill="${c[0]}"/><path d="M20 26h6l6 6v6l-6 6h-6Z" fill="${c[1]}"/></svg>`;
}

/* L'écu de la riposte, à remplir. */
export const ECU='M8 6H132V64L70 130L8 64Z';
