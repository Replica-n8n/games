/* Les sons du jeu, fabriques en direct.

   ⚠️ AUCUN FICHIER. Tout est synthetise par l'API Web Audio : des oscillateurs,
   du bruit blanc, et des enveloppes. Zero octet a telecharger, ca marche hors
   ligne le premier jour, et ca respecte la regle du projet — aucune
   dependance, aucune etape de compilation.

   Regle de frontiere : ajouter un son doit couter un objet dans `VOIX`, et
   rien d'autre. Le reste du jeu ne connait que `Sons.jouer("nom")`.

   ⚠️ Un navigateur REFUSE de faire du son avant un geste de l'utilisateur.
   `Sons.reveiller()` s'appelle donc au clic sur « Jouer », pas au chargement :
   sinon le contexte reste endormi et le jeu est muet toute la partie sans que
   personne comprenne pourquoi.

   ⚠️ Et tout est plafonne. Une graine ramassee joue un son, et on en ramasse
   des dizaines par seconde : sans limite de voix ni repos par son, on obtient
   un grondement continu et le telephone rame. */

var Sons = (function(){
  "use strict";

  var CLE = "chevalier.muet.v1";

  var ctx = null;          /* le contexte audio, cree au premier geste */
  var maitre = null;       /* le volume general */
  var muet = false;
  var voix = 0;            /* combien de sons vivent en ce moment */
  var MAX_VOIX = 14;
  var derniers = {};       /* le dernier instant ou chaque son a ete joue */

  try{ muet = localStorage.getItem(CLE) === "1"; }catch(e){ muet = false; }

  /* ------------------------------------------------------ les briques */

  function enveloppe(depart, attaque, tenue, chute, force){
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, depart);
    g.gain.exponentialRampToValueAtTime(force, depart + attaque);
    g.gain.setValueAtTime(force, depart + attaque + tenue);
    g.gain.exponentialRampToValueAtTime(0.0001, depart + attaque + tenue + chute);
    return g;
  }

  /* une note : une forme d'onde qui glisse d'une hauteur a une autre */
  function note(o){
    var t = ctx.currentTime + (o.retard || 0);
    var osc = ctx.createOscillator();
    osc.type = o.forme || "sine";
    osc.frequency.setValueAtTime(o.de, t);
    if(o.a !== undefined){
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.a), t + o.duree);
    }
    var g = enveloppe(t, o.attaque || 0.005, o.tenue || 0,
                      o.duree, (o.force || 0.2));
    osc.connect(g).connect(maitre);
    osc.start(t);
    osc.stop(t + (o.attaque || 0.005) + (o.tenue || 0) + o.duree + 0.02);
    compter(osc);
  }

  /* du bruit : un choc, un souffle, une explosion */
  function bruit(o){
    var t = ctx.currentTime + (o.retard || 0);
    var duree = o.duree;
    var n = Math.max(1, Math.floor(ctx.sampleRate * (duree + 0.05)));
    var tampon = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = tampon.getChannelData(0);
    for(var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = tampon;
    var filtre = ctx.createBiquadFilter();
    filtre.type = o.type || "lowpass";
    filtre.frequency.setValueAtTime(o.de, t);
    if(o.a !== undefined) filtre.frequency.exponentialRampToValueAtTime(Math.max(40, o.a), t + duree);
    var g = enveloppe(t, o.attaque || 0.004, o.tenue || 0, duree, o.force || 0.2);
    src.connect(filtre).connect(g).connect(maitre);
    src.start(t);
    src.stop(t + duree + 0.05);
    compter(src);
  }

  /* ⚠️ Mesure en vrai navigateur : le compteur tombait a -3. `onended` peut
     se declencher plus d'une fois selon les navigateurs, et un compteur negatif
     rend le plafond INUTILE — il laisse passer tout ce qu'on veut. On garde
     donc un drapeau par source, et on ne descend jamais sous zero. */
  function compter(source){
    voix++;
    var fini = false;
    source.onended = function(){
      if(fini) return;
      fini = true;
      voix = Math.max(0, voix - 1);
    };
  }

  /* ------------------------------------------------------ le catalogue

     `repos` : le temps minimum entre deux fois le meme son. C'est ce qui
     empeche les graines de faire un grondement continu. */
  var VOIX = {
    graine:   { repos: 0.045, jouer: function(){
      /* une petite note claire, jamais deux fois la meme hauteur */
      var h = 880 * (1 + Math.random() * 0.35);
      note({ forme: "triangle", de: h, a: h * 1.5, duree: 0.07, force: 0.055 });
    }},

    tuee:     { repos: 0.03, jouer: function(){
      bruit({ de: 1800, a: 300, duree: 0.09, force: 0.10 });
    }},

    ramasse:  { repos: 0.05, jouer: function(){
      note({ forme: "sine", de: 660, a: 990, duree: 0.1, force: 0.11 });
      note({ forme: "sine", de: 990, a: 1320, duree: 0.12, force: 0.07, retard: 0.05 });
    }},

    /* ⚠️ Perdre un coeur doit s'entendre AU DESSUS de tout le reste : c'est la
       seule chose qu'un enfant doit remarquer meme s'il regarde ailleurs. */
    touche:   { repos: 0.2, devant: true, jouer: function(){
      note({ forme: "square", de: 320, a: 90, duree: 0.3, force: 0.24 });
      bruit({ de: 900, a: 120, duree: 0.22, force: 0.16 });
    }},

    niveau:   { repos: 0.3, devant: true, jouer: function(){
      [523, 659, 784, 1047].forEach(function(h, i){
        note({ forme: "triangle", de: h, duree: 0.16, force: 0.15, retard: i * 0.07 });
      });
    }},

    explosion:{ repos: 0.1, jouer: function(){
      bruit({ de: 1200, a: 60, duree: 0.5, force: 0.3 });
      note({ forme: "sine", de: 120, a: 40, duree: 0.4, force: 0.16 });
    }},

    tir:      { repos: 0.09, jouer: function(){
      note({ forme: "sawtooth", de: 420, a: 180, duree: 0.1, force: 0.06 });
    }},

    /* la glace : un frisson qui monte */
    gel:      { repos: 0.2, jouer: function(){
      [1568, 2093, 2637].forEach(function(h, i){
        note({ forme: "sine", de: h, a: h * 1.2, duree: 0.4, force: 0.07, retard: i * 0.05 });
      });
    }},

    piment:   { repos: 0.2, jouer: function(){
      bruit({ type: "bandpass", de: 700, a: 2200, duree: 0.45, force: 0.16 });
    }},

    aimant:   { repos: 0.3, jouer: function(){
      note({ forme: "sine", de: 220, a: 1320, duree: 0.45, force: 0.14 });
    }},

    /* ⚠️ La plus grosse fanfare du jeu, et la plus forte. Elle passe devant
       tout le reste : c'est le seul moment ou l'enfant devient invincible. */
    etoile:   { repos: 0.5, devant: true, jouer: function(){
      [523, 659, 784, 1047, 1319, 1568, 2093].forEach(function(h, i){
        note({ forme: "triangle", de: h, duree: 0.22, force: 0.3, retard: i * 0.07 });
      });
      /* et un accord tenu par dessous, pour qu'elle porte */
      [262, 330, 392].forEach(function(h){
        note({ forme: "sine", de: h, duree: 1.1, tenue: 0.35, force: 0.16, retard: 0.1 });
      });
    }},

    panier:   { repos: 0.15, jouer: function(){
      note({ forme: "sine", de: 784, a: 1175, duree: 0.16, force: 0.12 });
    }},

    /* ⚠️ Perdre un niveau d'arme doit sonner comme une perte, pas comme un
       degat : une note qui DESCEND, la seule du jeu. */
    malus:    { repos: 0.4, devant: true, jouer: function(){
      [784, 622, 466, 349].forEach(function(h, i){
        note({ forme: "sawtooth", de: h, duree: 0.16, force: 0.13, retard: i * 0.08 });
      });
    }},

    toile:    { repos: 0.2, jouer: function(){
      bruit({ type: "bandpass", de: 2600, a: 900, duree: 0.3, force: 0.12 });
    }},

    foudre:   { repos: 0.15, jouer: function(){
      bruit({ de: 5000, a: 200, duree: 0.55, force: 0.26 });
    }},

    /* l'arrivee de la reine : un grondement, et une note qui monte */
    boss:     { repos: 1, devant: true, jouer: function(){
      bruit({ de: 300, a: 60, duree: 1.4, force: 0.22 });
      note({ forme: "sawtooth", de: 70, a: 180, duree: 1.6, force: 0.16 });
      note({ forme: "square", de: 130, a: 110, duree: 1.4, force: 0.08, retard: 0.2 });
    }},

    victoire: { repos: 1, devant: true, jouer: function(){
      [523, 659, 784, 1047, 1319].forEach(function(h, i){
        note({ forme: "triangle", de: h, duree: 0.3, force: 0.2, retard: i * 0.12 });
      });
    }},

    mort:     { repos: 1, devant: true, jouer: function(){
      [392, 330, 262, 196].forEach(function(h, i){
        note({ forme: "sine", de: h, duree: 0.45, force: 0.18, retard: i * 0.16 });
      });
    }},

    /* ------------------------------------------------- ce que le joueur fait

       Ces sons-la partent a chaque coup d'arme. Ils sont donc COURTS et
       DISCRETS : un souffle d'epee qui dure un tiers de seconde a la cadence
       du niveau 6 deviendrait un grondement. */

    /* l'epee : un souffle d'air qui passe, aigu puis grave */
    epee:     { repos: 0.12, jouer: function(){
      bruit({ type: "bandpass", de: 2600, a: 500, duree: 0.16, force: 0.13 });
    }},

    /* l'arc : la corde qui claque, puis la fleche qui file */
    arc:      { repos: 0.1, jouer: function(){
      note({ forme: "triangle", de: 180, a: 60, duree: 0.07, force: 0.12 });
      bruit({ type: "highpass", de: 1800, a: 3000, duree: 0.1, force: 0.06 });
    }},

    /* le souffle du magicien : un rugissement qui s'ouvre */
    souffle:  { repos: 0.18, jouer: function(){
      bruit({ type: "lowpass", de: 400, a: 1600, duree: 0.42, force: 0.17 });
      note({ forme: "sawtooth", de: 90, a: 150, duree: 0.35, force: 0.07 });
    }},

    /* les piques : la terre qui tremble, puis qui craque */
    piques:   { repos: 0.14, jouer: function(){
      note({ forme: "sine", de: 70, a: 34, duree: 0.32, force: 0.24 });
      bruit({ type: "lowpass", de: 260, a: 70, duree: 0.3, force: 0.2 });
      bruit({ type: "highpass", de: 1400, a: 600, duree: 0.12, force: 0.08, retard: 0.16 });
    }},

    /* la chausse-trappe : le claquement sec d'un ressort d'acier */
    trappe:   { repos: 0.1, jouer: function(){
      note({ forme: "square", de: 1400, a: 420, duree: 0.05, force: 0.09 });
      bruit({ type: "highpass", de: 2400, a: 1200, duree: 0.09, force: 0.09 });
    }},

    /* ⚠️ le vent : il part a chaque COUPE, donc plusieurs fois par seconde
       quand on traverse un groupe. C'est le son le plus court et le plus
       discret du jeu, et son repos est le plus long des armes : un souffle
       tenu deviendrait un grondement de fond. */
    vent:     { repos: 0.22, jouer: function(){
      bruit({ type: "bandpass", de: 3200, a: 1400, duree: 0.14, force: 0.075 });
    }},

    /* la boule givree : un tintement de glace, tres court */
    givre:    { repos: 0.5, jouer: function(){
      note({ forme: "sine", de: 2093, a: 2637, duree: 0.22, force: 0.05 });
    }},

    /* ------------------------------------------------------- la roue

       ⚠️ Le cran, joue des dizaines de fois pendant que la roue ralentit, doit
       etre minuscule : c'est un tic, pas une note. Son repos est le plus court
       du jeu parce que c'est le rythme qui raconte le ralentissement. */
    cran:     { repos: 0.02, jouer: function(){
      bruit({ type: "bandpass", de: 2400, duree: 0.03, force: 0.07 });
    }},

    /* et la recompense, quand elle s'arrete sur l'arme */
    roue:     { repos: 0.5, devant: true, jouer: function(){
      [784, 1047, 1319].forEach(function(h, i){
        note({ forme: "triangle", de: h, duree: 0.3, tenue: 0.05, force: 0.2, retard: i * 0.09 });
      });
    }},

    meteo:    { repos: 1, jouer: function(){
      note({ forme: "sine", de: 440, a: 587, duree: 0.5, force: 0.07 });
    }}
  };

  /* --------------------------------------------------------- l'accueil */

  function reveiller(){
    if(ctx) { if(ctx.state === "suspended") ctx.resume(); return true; }
    var C = window.AudioContext || window.webkitAudioContext;
    if(!C) return false;                 /* pas de son : le jeu marche quand meme */
    try{
      ctx = new C();
      maitre = ctx.createGain();
      maitre.gain.value = muet ? 0 : 0.8;
      maitre.connect(ctx.destination);
      return true;
    }catch(e){
      ctx = null;
      return false;
    }
  }

  function jouer(nom){
    if(!ctx || muet) return false;
    var v = VOIX[nom];
    if(!v) return false;
    /* ⚠️ Le repos par son ET le plafond de voix. Sans eux, une bombe qui tue
       vingt bestioles lance vingt sons dans la meme image. */
    var t = ctx.currentTime;
    if(derniers[nom] !== undefined && t - derniers[nom] < v.repos) return false;
    /* ⚠️ Certains sons PASSENT DEVANT. La fanfare des cinq fruits sonnait au
       moment precis ou le chevalier balaye tout ce qu'il touche : elle partait
       vraiment, mais une rafale de sons de mort remplissait les quatorze voix
       et on ne l'entendait pas. Ce qui raconte quelque chose d'important ne se
       fait pas voler sa place par du bruit de fond. */
    if(!v.devant && voix >= MAX_VOIX) return false;
    derniers[nom] = t;
    try{ v.jouer(); }catch(e){ return false; }
    return true;
  }

  function reglerMuet(actif){
    muet = !!actif;
    try{
      if(muet) localStorage.setItem(CLE, "1");
      else localStorage.removeItem(CLE);
    }catch(e){}
    if(maitre) maitre.gain.value = muet ? 0 : 0.8;
    return muet;
  }

  return {
    CLE: CLE,
    VOIX: VOIX,
    reveiller: reveiller,
    jouer: jouer,
    muet: function(){ return muet; },
    reglerMuet: reglerMuet,
    voix: function(){ return voix; },
    pret: function(){ return !!ctx; }
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Sons;
if(typeof globalThis !== "undefined") globalThis.Sons = Sons;
