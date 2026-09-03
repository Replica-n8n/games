/* Les armes et les objets du chevalier.

   Regle de frontiere : ajouter une arme doit couter un objet dans CATALOGUE et
   rien d'autre. Ni moteur.js, ni index.html ne doivent savoir qu'une epee
   existe. C'est pour ca que le dessin de chaque forme est ici aussi.

   Les armes frappent seules : l'enfant ne les suit pas, elles ne mangent pas
   les trois objets qu'il peut suivre en meme temps. En revanche elles peuvent
   casser la lisibilite de la foule, d'ou deux regles tenues ici :
   - le chevalier et ses armes en clair et chaud, les bestioles en sombre
   - peu d'effets gros plutot que beaucoup de petits, et 40 projectiles au plus */

var Armes = (function(){
  "use strict";

  var MAX_ARMES = 4, MAX_OBJETS = 4, MAX_NIVEAU = 6, MAX_PROJECTILES = 40;

  /* ⚠️ DEUX PERSONNAGES, DEUX CATALOGUES. Le chevalier a des armes, le
     magicien a des sorts, et ce ne sont pas les memes gestes : le souffle
     remplace l'epee mais brule devant lui au lieu de trancher, la boule
     givree remplace le bouclier mais GELE au lieu de seulement frapper, et
     les piques remplacent les fleches mais sortent du sol.

     La regle de frontiere tient toujours : ajouter un sort coute un objet
     dans ce fichier, et rien d'autre. Le seul geste que le moteur a du
     apprendre est `partie.geler(bestiole, duree)`, exactement comme il savait
     deja `partie.blesser`. */
  var PERSOS = {
    chevalier: {
      nom: "Chevalier", emoji: "🛡️",
      dit: "Il frappe fort et de près",
      armes: ["epee", "bouclier", "arc", "trappe"]
    },
    magicien: {
      nom: "Magicien", emoji: "🧙",
      dit: "Il gèle, il brûle, il fait sortir la terre",
      armes: ["souffle", "givre", "piques", "vent"]
    }
  };

  var CATALOGUE = {
    epee: {
      nom: "Épée", emoji: "⚔️", dit: "Un grand moulinet devant toi",
      couleur: "#ffe57a", type: "moulinet", son: "epee",
      base: { degats: 3, recharge: 0.9, portee: 96, arc: 2.7, duree: 0.3 },
      parNiveau: { degats: 1, portee: 7, arc: 0.1, recharge: -0.05 }
    },
    bouclier: {
      nom: "Bouclier", emoji: "🛡️", dit: "Il tourne autour de toi",
      /* ⚠️ ACIER, plus or : « jaune on dirait une part de pizza ». La couleur
         sert aussi a la part de la roue du destin et a la pastille du haut de
         l'ecran, donc elle change partout d'un coup. */
      couleur: "#dfe6f2", type: "orbite", forme: "bouclier",
      /* un bouclier de plus a chaque niveau : c'est ce qu'on attend en le
         montant, et ca se voit tout de suite */
      /* ⚠️ Le repos appartient desormais a la BESTIOLE, plus au bouclier : une
         meme bestiole ne peut etre frappee que toutes les 0,22 s, mais chaque
         nouvelle est touchee tout de suite. Contre une seule cible c'est moins
         fort qu'avant, contre une foule c'est bien plus — et c'est ce qu'on
         attend d'un bouclier qui tourne. */
      base: { degats: 2, nombre: 1, rayon: 66, vitesse: 2.7, taille: 15, repos: 0.22 },
      parNiveau: { degats: 1, nombre: 1, rayon: 4, vitesse: 0.15 }
    },
    arc: {
      nom: "Arc", emoji: "🏹", dit: "Il vise la bestiole la plus proche",
      couleur: "#fff6d5", type: "fleche", son: "arc",
      /* une fleche de plus a chaque niveau, et chacune sur une bestiole
         DIFFERENTE : trois fleches dans le meme escargot ne servent a rien */
      base: { degats: 2, recharge: 0.9, vitesse: 420, portee: 340, taille: 6,
              perce: 1, nombre: 1 },
      /* l'ordre compte : `resume` ne garde que les deux premiers */
      parNiveau: { degats: 1, nombre: 1, recharge: -0.06, perce: 0.34 }
    },

    /* ----------------------------------------------- LA CHAUSSE-TRAPPE

       La quatrieme arme du chevalier, sa reponse au vent du magicien : elle
       aussi ne travaille QUE si l'on se deplace, mais a l'envers. Le vent
       coupe au moment du passage et ne laisse rien ; la trappe reste, et
       mord CE QUI VIENT DERRIERE. On seme, puis on attire.

       ⚠️ Elle BLESSE, elle n'immobilise pas : arreter une bestiole, la toile
       de la reine le fait deja, et un piege qui retient sans tuer ne permet
       pas de progresser quand la roue le donne en premiere arme.

       ⚠️ La montee en puissance joue sur TROIS choses, et pas seulement les
       degats, parce qu'a huit ans il faut que monter se VOIE :
         - `degats` : elle mord plus fort ;
         - `ecart` : la distance entre deux trappes, qui diminue — le sol est
           visiblement de plus en plus seme ;
         - `usages` : combien de bestioles DIFFERENTES une meme trappe peut
           mordre avant de casser. C'est ce qui la fait passer d'un piege a
           escargot isole a une arme de foule.
       Une meme bestiole n'est jamais mordue deux fois par la meme trappe. */
    trappe: {
      nom: "Chausse-trappe", emoji: "🪤", dit: "Tu en sèmes derrière toi en marchant",
      couleur: "#dfe6f2", type: "trappe", son: "trappe",
      /* ⚠️ Regle sur la mesure. Au premier jet elle rendait 3,8 / 11,1 /
         36,8 degats par seconde aux niveaux 1, 3 et 6 contre 2,6 / 7,7 / 15,9
         pour la moyenne des trois autres armes du chevalier : plus du double
         au niveau 6. Et ce banc ne voit qu'UNE cible, donc il ne mesure meme
         pas `usages`, qui est toute sa valeur en foule. On la regle donc
         volontairement un peu SOUS la moyenne : 2,6 / 6,0 / 14,2. */
      base: { degats: 2.5, ecart: 145, duree: 7, taille: 21, usages: 1 },
      parNiveau: { degats: 1.2, ecart: -11, usages: 0.6, taille: 1.5 }
    },

    /* ------------------------------------------------- les sorts du magicien

       Ils repondent un pour un aux armes du chevalier, mais aucun ne se joue
       pareil. Leurs chiffres ne sont pas devines : ils sont regles pour rendre
       les memes degats par seconde que l'arme qu'ils remplacent, mesure faite
       par tools/chevalier-sorts.mjs. */

    souffle: {
      nom: "Souffle", emoji: "🔥", dit: "Tu craches le feu devant toi",
      couleur: "#ff9f1c", type: "cone", son: "souffle",
      /* plus large et plus long que l'epee, mais il faut rester tourne vers
         la bestiole : le feu ne coupe pas, il brule le temps qu'il dure */
      /* ⚠️ Regle sur la mesure, pas au jugé : a 2 de base il rendait 56 % de
         plus que l'epee au niveau 6. Sa vraie difference n'est pas la force,
         c'est la FORME — il porte plus loin (132 contre 96) mais son secteur
         est trois fois plus etroit (1,0 contre 2,7 radians). Long et fin
         contre court et large. */
      base: { degats: 3, recharge: 1.1, portee: 132, arc: 1.0, duree: 0.55 },
      parNiveau: { degats: 1, portee: 12, arc: 0.08, recharge: -0.06 }
    },

    givre: {
      nom: "Boule givrée", emoji: "❄️", dit: "Elle tourne et gèle ce qu'elle touche",
      couleur: "#9ad7ff", type: "orbite", forme: "boule", son: "givre",
      /* ⚠️ Elle frappe MOINS fort que le bouclier, et c'est voulu : ce qu'elle
         apporte n'est pas des degats, c'est du temps. Une bestiole gelee ne
         pense plus, donc elle ne prepare plus sa charge. */
      /* elle frappe aussi fort que le bouclier mais REPREND SON SOUFFLE plus
         longtemps entre deux coups (0,55 s contre 0,35) : c'est ce delai qui
         paye le gel */
      base: { degats: 2, nombre: 1, rayon: 70, vitesse: 2.4, taille: 16,
              repos: 0.26, gele: 1.2 },
      parNiveau: { degats: 1, nombre: 1, rayon: 4, vitesse: 0.15, gele: 0.15 }
    },

    piques: {
      nom: "Piques de terre", emoji: "⛰️", dit: "La terre sort sous la bestiole",
      couleur: "#c08a4a", type: "piques", son: "piques",
      /* elles sortent SOUS la bestiole la plus proche, apres un preavis : on
         voit la terre trembler avant que ca pique, comme tout le reste */
      /* ⚠️ Deux points de degats par niveau, pas un : l'arc empile ses fleches
         sur la MEME bestiole quand il n'y en a qu'une, alors qu'une pique par
         bestiole ne sert a rien sur une cible seule. Mesure : a un seul
         ennemi, les piques rendaient 43 % de moins que l'arc au niveau 6. */
      base: { degats: 3, recharge: 1.5, portee: 300, taille: 34, nombre: 1,
              preavis: 0.5, duree: 0.45 },
      parNiveau: { degats: 2, nombre: 1, recharge: -0.09, taille: 2 }
    },

    /* ------------------------------------------------------------ LE VENT

       ⚠️ La quatrieme magie, et la seule arme du jeu qui depende du
       DEPLACEMENT. Elle a ete cherchee longtemps parce que trois idees plus
       evidentes ont ete ecartees pour de bonnes raisons :

         - repousser ou aspirer les bestioles : « si on a le vent en premiere
           magie au debut de partie il faut etre capable de tuer les mobs pour
           progresser ». La roue peut la donner en premier ; une magie qui ne
           tue pas rendrait les premieres minutes injouables.
         - une tornade qui fait des degats : « ca ressemblera au pouvoir de
           terre ». Une zone qui frappe autour d'un point, on l'a deja.
         - une trainee laissee derriere soi : c'est la salamandre, exactement
           (le piment a l'epoque, meme chose).

       Ce qu'elle fait est different des trois : elle coupe A L'INSTANT OU L'ON
       PASSE, elle ne laisse rien au sol, et sa force est proportionnelle a la
       vitesse reelle du personnage. A l'arret elle ne fait rien du tout ; en
       pleine course elle fauche. C'est la seule arme qui recompense le geste
       que l'enfant fait deja tout le temps — fuir — et la seule que les bottes
       rendent plus forte. En echange, la glaire, la flaque et la toile la
       reduisent en meme temps qu'elles le ralentissent.

       Ses chiffres sont regles sur la mesure, pas au juge : voir
       tools/chevalier-sorts.mjs, qui a du apprendre a faire COURIR le joueur —
       un banc immobile mesurait zero et concluait que l'arme etait inutile. */
    vent: {
      nom: "Vent tranchant", emoji: "🌬️", dit: "Cours ! Le vent coupe sur ton passage",
      couleur: "#dff4ff", type: "sillage", son: "vent",
      /* `degats` par coup, `repos` par bestiole : une meme bestiole ne peut
         etre coupee que toutes les 0,4 s, mais chacune a le sien — comme les
         boucliers, et pour la meme raison. `duree` est l'age de la trainee,
         donc sa LONGUEUR depend de la vitesse : c'est ce qui fait que rester
         immobile ne rend rien. */
      /* ⚠️ Chiffres REGLES SUR LA MESURE, deux fois. Au premier jet il rendait
         5,0 / 12,0 / 22,5 par seconde aux niveaux 1, 3 et 6, contre 2,6 / 7,5 /
         15,3 pour la moyenne des trois autres sorts : une fois et demie trop
         fort. Un coup toutes les six dixiemes plutot que toutes les quatre, et
         1,6 degat de base, le ramenent a 2,6 / 7,8 / 15,6 — a moins de 5 %. */
      base: { degats: 1.6, repos: 0.6, largeur: 26, duree: 0.42 },
      parNiveau: { degats: 1.6, largeur: 5, duree: 0.05 }
    }
  };

  var OBJETS = {
    bottes:    { nom: "Bottes", emoji: "👢",     dit: "Tu cours plus vite",        effet: "vitesse",  pas: 0.08 },
    /* A plat, pas en pourcentage : les bestioles gagnent 1 point de vie
       toutes les deux minutes, donc +1 degat garde le coup fatal. En
       pourcentage, la carte ne changeait rien pendant les premieres minutes,
       ou tout meurt deja en un coup. */
    gantelets: { nom: "Gantelets", emoji: "🧤",  dit: "+1 dégât, et ça repousse", effet: "degats", plat: true, pas: 1, recul: 14 },
    longuevue: { nom: "Longue-vue", emoji: "🔭", dit: "Tes armes touchent plus loin", effet: "zone",  pas: 0.12 },
    sablier:   { nom: "Sablier", emoji: "⏳",    dit: "Tes armes vont plus vite",  effet: "recharge", pas: 0.10 },
    aimant:    { nom: "Pierre d'aimant", emoji: "🧲", dit: "Les graines viennent de plus loin", effet: "aimant", pas: 0.35 },
    heaume:    { nom: "Heaume", emoji: "⛑️",     dit: "Un cœur de plus, et tous remplis",           effet: "coeur",    pas: 1 }
  };

  var MAX_OBJET_NIVEAU = 5;

  /* Ce que le niveau suivant apporte, en clair. Genere depuis `parNiveau` et
     `pas` : ajouter une arme n'oblige a rien ecrire de plus, et le texte ne
     peut pas mentir sur les chiffres puisqu'il en sort. */
  var MOTS = {
    degats:   function(v){ return v > 0 ? "+" + arrondi(v) + " dégât" : ""; },
    /* l'ordre compte : les deux premieres retenues sont celles qu'on lit */
    portee:   function(v){ return v > 0 ? "+" + arrondi(v) + " de portée" : ""; },
    arc:      function(v){ return v > 0 ? "balaye plus large" : ""; },
    recharge: function(v){ return v < 0 ? "frappe plus souvent" : ""; },
    nombre:   function(v, def){
      if(v <= 0) return "";
      var quoi = def.type === "orbite" ? (def.base.gele ? "boule" : "bouclier")
               : (def.type === "fleche" ? "flèche"
               : (def.type === "piques" ? "pique" : ""));
      return "+" + arrondi(v) + (quoi ? " " + quoi : " de plus");
    },
    rayon:    function(v){ return v > 0 ? "tourne plus loin" : ""; },
    vitesse:  function(v){ return v > 0 ? "tourne plus vite" : ""; },
    perce:    function(v){ return v > 0 ? "traverse plus de bestioles" : ""; },
    largeur:  function(v){ return v > 0 ? "souffle plus large" : ""; },
    duree:    function(v){ return v > 0 ? "la trainée est plus longue" : ""; },
    ecart:    function(v){ return v < 0 ? "tu en sèmes plus souvent" : ""; },
    usages:   function(v){ return v > 0 ? "chacune mord plus de bestioles" : ""; }
  };

  var MOTS_OBJETS = {
    vitesse:  "Tu cours plus vite",
    degats:   "+1 dégât à chacune de tes armes",
    zone:     "Tes armes touchent plus loin",
    recharge: "Tes armes frappent plus souvent",
    aimant:   "Les graines viennent de plus loin",
    coeur:    "+1 cœur, et tous remplis"
  };

  function arrondi(v){
    return Math.round(v * 100) / 100;
  }

  /* le texte d'une carte : ce que CE niveau change, pas ce que l'arme fait */
  function resume(choix){
    if(!choix) return "";
    if(choix.sorte === "objet"){
      return MOTS_OBJETS[choix.def.effet] || choix.def.dit;
    }
    if(choix.niveau <= 1) return choix.def.dit;
    var bouts = [];
    for(var cle in choix.def.parNiveau){
      var mot = MOTS[cle];
      if(!mot) continue;
      var texte = mot(choix.def.parNiveau[cle], choix.def);
      if(texte) bouts.push(texte);
    }
    /* deux choses au plus : a 8 ans, une carte se lit en deux secondes */
    return bouts.length ? bouts.slice(0, 2).join(", ") : choix.def.dit;
  }

  /* Le tableau d'un objet, niveau par niveau, en valeurs CONCRETES.
     « +12 % de zone » ne dit rien ; « la portee de l'epee passe de 96 a 107 »
     se comprend. Les valeurs de reference viennent du moteur et de l'epee,
     pas d'un chiffre recopie a la main. */
  function progressionObjet(nom){
    var o = OBJETS[nom], lignes = [];
    var R = (typeof Moteur !== "undefined" && Moteur.REGLAGES) || {};
    var epee = CATALOGUE.epee;
    var base = { vitesse: R.vitesse || 150, aimant: R.aimant || 95, coeurs: R.coeurs || 5 };
    for(var n = 1; n <= MAX_OBJET_NIVEAU; n++){
      var mult = 1 + (o.plat ? 0 : o.pas * n);
      var ligne = { niveau: n };
      if(o.effet === "vitesse"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de vitesse";
        ligne.concret = Math.round(base.vitesse * mult) + " unités par seconde, au lieu de " + base.vitesse;
      }else if(o.effet === "aimant"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de portée";
        ligne.concret = "les graines viennent de " + Math.round(base.aimant * mult) +
                        " unités, au lieu de " + base.aimant;
      }else if(o.effet === "degats"){
        /* pas « a plat » : le mot ne dit rien a qui ne code pas. On donne le
           nombre ajoute, et le resultat sur une arme connue. */
        var d = o.pas * n;
        ligne.effet = "+" + d + " dégât" + (d > 1 ? "s" : "") + " à chaque arme";
        ligne.concret = "l'épée fait " + (epee.base.degats + o.pas * n) +
                        " au lieu de " + epee.base.degats +
                        ", et le coup repousse à " + (10 + (o.recul || 0) * n) + " au lieu de 10";
      }else if(o.effet === "zone"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de portée";
        ligne.concret = "l'épée porte à " + Math.round(epee.base.portee * mult) +
                        ", au lieu de " + epee.base.portee;
      }else if(o.effet === "recharge"){
        ligne.effet = "+" + Math.round(o.pas * n * 100) + " % de cadence";
        ligne.concret = "l'épée frappe toutes les " +
                        (Math.round(epee.base.recharge / mult * 100) / 100) +
                        " s, au lieu de " + epee.base.recharge;
      }else if(o.effet === "coeur"){
        ligne.effet = "+" + n + " cœur" + (n > 1 ? "s" : "");
        ligne.concret = (base.coeurs + n) + " cœurs au lieu de " + base.coeurs + ", et tous remplis";
      }
      lignes.push(ligne);
    }
    return lignes;
  }

  /* le tableau complet d'une arme, niveau par niveau, pour la documentation */
  function progression(nom){
    var def = CATALOGUE[nom], lignes = [];
    for(var n = 1; n <= MAX_NIVEAU; n++){
      var ligne = { niveau: n };
      for(var cle in def.base){
        var v = valeur(def, cle, n);
        /* `nombre` et `perce` sont arrondis a l'usage : le tableau doit
           montrer ce qui se passe vraiment, pas la valeur brute */
        if(cle === "nombre" || cle === "perce") v = Math.max(1, Math.round(v));
        ligne[cle] = arrondi(v);
      }
      lignes.push(ligne);
    }
    return lignes;
  }

  function valeur(def, cle, niveau){
    var b = def.base[cle];
    if(b === undefined) return 0;
    var p = def.parNiveau[cle] || 0;
    return b + p * (niveau - 1);
  }

  function creer(partie, perso){
    var monPerso = PERSOS[perso] ? perso : "chevalier";
    var mesArmes = [];      /* { nom, def, niveau, prochainTir } */
    var mesObjets = [];     /* { nom, def, niveau } */
    var projectiles = [];
    var tampon = [];

    var moi = {
      perso: monPerso,
      /* ⚠️ Ce que ce personnage peut apprendre. Sans ce filtre, les cartes de
         montee de niveau proposeraient une epee a un magicien. */
      catalogue: PERSOS[monPerso].armes,
      armes: mesArmes,
      objets: mesObjets,
      projectiles: projectiles,
      donner: donner,
      donnerObjet: donnerObjet,
      retrograder: retrograder,
      propositions: propositions,
      appliquer: appliquer,
      multiplicateur: multiplicateur,
      aPlat: aPlat,
      recul: recul,
      pas: pas,
      dessiner: dessiner
    };
    return moi;

    /* ------------------------------------------------------- les objets */

    function multiplicateur(effet){
      var t = 1;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.effet === effet && !o.def.plat) t += o.def.pas * o.niveau;
      }
      return t;
    }

    /* ce qui s'ajoute a plat, et non en pourcentage */
    function aPlat(effet){
      var t = 0;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.effet === effet && o.def.plat) t += o.def.pas * o.niveau;
      }
      return t;
    }

    /* la force du recul, qui monte avec les gantelets */
    function recul(){
      var t = 10;
      for(var i = 0; i < mesObjets.length; i++){
        var o = mesObjets[i];
        if(o.def.recul) t += o.def.recul * o.niveau;
      }
      return t;
    }

    /* Le moteur ne connait pas les objets du chevalier : on lui pose sur la
       table ce qui le concerne. Sans ca, l'aimant et les bottes ne font rien
       du tout, ce qui etait le cas. Pose des qu'un objet est donne, pas a
       l'image suivante : un objet doit agir tout de suite. */
    function poserLesBonus(){
      partie.bonus.aimant = multiplicateur("aimant");
      partie.bonus.vitesse = multiplicateur("vitesse");
    }

    function coeursEnPlus(){
      var n = 0;
      for(var i = 0; i < mesObjets.length; i++){
        if(mesObjets[i].def.effet === "coeur") n += mesObjets[i].niveau;
      }
      return n;
    }

    /* ------------------------------------------------- avoir et ameliorer */

    function trouver(liste, nom){
      for(var i = 0; i < liste.length; i++) if(liste[i].nom === nom) return liste[i];
      return null;
    }

    function donner(nom){
      var a = trouver(mesArmes, nom);
      if(a){ if(a.niveau < MAX_NIVEAU) a.niveau++; return a; }
      if(mesArmes.length >= MAX_ARMES) return null;
      a = { nom: nom, def: CATALOGUE[nom], niveau: 1, prochainTir: 0, tourne: 0 };
      mesArmes.push(a);
      return a;
    }

    /* ⚠️ Retrograder : l'acide de la limace fait perdre UN niveau. C'est le
       seul endroit du jeu ou l'on recule, donc il doit se voir : la fonction
       rend ce qu'elle a touche, et l'affichage s'en sert pour le montrer.

       Jamais en dessous du niveau 1, et jamais une arme retiree : perdre son
       arme d'un coup serait incomprehensible pour un enfant, et le laisserait
       sans rien pour se defendre. Si tout est deja au niveau 1, on retrograde
       un objet a la place ; si tout est au plus bas, il ne se passe rien, et
       c'est tres bien. */
    function retrograder(tirage){
      var au = function(n){ return Math.floor((tirage ? tirage() : Math.random()) * n); };
      var hauts = mesArmes.filter(function(a){ return a.niveau > 1; });
      if(hauts.length){
        var a = hauts[au(hauts.length)];
        a.niveau--;
        return { quoi: "arme", nom: a.nom, emoji: a.def.emoji,
                 titre: a.def.nom, niveau: a.niveau };
      }
      var objets = mesObjets.filter(function(o){ return o.niveau > 1; });
      if(objets.length){
        var o = objets[au(objets.length)];
        o.niveau--;
        poserLesBonus();
        return { quoi: "objet", nom: o.nom, emoji: o.def.emoji,
                 titre: o.def.nom, niveau: o.niveau };
      }
      return null;
    }

    function donnerObjet(nom){
      var o = trouver(mesObjets, nom);
      if(o){ if(o.niveau < MAX_OBJET_NIVEAU) o.niveau++; }
      else{
        if(mesObjets.length >= MAX_OBJETS) return null;
        o = { nom: nom, def: OBJETS[nom], niveau: 1 };
        mesObjets.push(o);
      }
      poserLesBonus();
      if(o.def.effet === "coeur"){
        partie.joueur.coeursMax = Moteur.REGLAGES.coeurs + coeursEnPlus();
        /* et TOUS les coeurs se remplissent. Un coeur de plus quand il t'en
           reste deux ne recompense rien : c'est le seul moment du jeu ou on
           repart entier, et ca doit se sentir. */
        partie.joueur.coeurs = partie.joueur.coeursMax;
        partie.joueur.invincibleJusqua = partie.temps + Moteur.REGLAGES.invincibilite;
      }
      return o;
    }

    /* --------------------------------------------------- les trois cartes */

    function possibles(){
      var liste = [], nom, n;
      /* ⚠️ Seulement ce que CE personnage peut apprendre : sans ce filtre, on
         proposerait une epee a un magicien. */
      for(n = 0; n < moi.catalogue.length; n++){
        nom = moi.catalogue[n];
        var a = trouver(mesArmes, nom);
        if(a){
          if(a.niveau < MAX_NIVEAU){
            liste.push({ sorte: "arme", nom: nom, def: CATALOGUE[nom], niveau: a.niveau + 1 });
          }
        }else if(mesArmes.length < MAX_ARMES){
          liste.push({ sorte: "arme", nom: nom, def: CATALOGUE[nom], niveau: 1 });
        }
      }
      for(nom in OBJETS){
        var o = trouver(mesObjets, nom);
        if(o){
          if(o.niveau < MAX_OBJET_NIVEAU){
            liste.push({ sorte: "objet", nom: nom, def: OBJETS[nom], niveau: o.niveau + 1 });
          }
        }else if(mesObjets.length < MAX_OBJETS){
          liste.push({ sorte: "objet", nom: nom, def: OBJETS[nom], niveau: 1 });
        }
      }
      return liste;
    }

    /* Trois cartes, jamais deux fois la meme, jamais une arme deja au maximum,
       jamais une cinquieme arme quand les quatre places sont prises. */
    function propositions(combien){
      var reste = possibles(), sortie = [];
      combien = combien || 3;
      while(sortie.length < combien && reste.length){
        var i = Math.floor(partie.alea() * reste.length);
        sortie.push(reste.splice(i, 1)[0]);
      }
      return sortie;
    }

    function appliquer(choix){
      if(!choix) return null;
      return choix.sorte === "arme" ? donner(choix.nom) : donnerObjet(choix.nom);
    }

    /* ----------------------------------------------------------- frapper */

    function pas(dt){
      var j = partie.joueur;
      if(partie.fini) return;

      var degats = multiplicateur("degats"),
          plus = aPlat("degats"),
          force = recul(),
          zone = multiplicateur("zone"),
          recharge = multiplicateur("recharge");

      poserLesBonus();

      for(var i = 0; i < mesArmes.length; i++){
        var a = mesArmes[i], t = a.def.type;
        if(t === "orbite"){ orbite(a, dt, degats, plus, force, zone); continue; }
        /* ⚠️ Le vent n'a PAS de cadence : il coupe tant qu'on court. Il passe
           donc avant `prochainTir`, comme les boucliers, sinon on lui
           chercherait une recharge qu'il n'a pas. Le sablier lui sert quand
           meme : il raccourcit le repos entre deux coupes sur une meme
           bestiole. */
        if(t === "sillage"){ sillage(a, dt, degats, plus, force, zone, recharge); continue; }
        /* la trappe non plus n'a pas de cadence : c'est la DISTANCE parcourue
           qui en seme une, pas le chronometre */
        if(t === "trappe"){ trappes(a, degats, plus, force, zone); continue; }
        a.prochainTir -= dt * recharge;
        if(a.prochainTir > 0) continue;
        a.prochainTir = Math.max(0.15, valeur(a.def, "recharge", a.niveau));
        /* ⚠️ Chaque arme dit SON son, comme elle dit sa couleur et sa forme :
           la frontiere tient, ajouter une arme reste un objet dans ce fichier.
           Le `typeof` protege les outils de mesure, qui tournent sans page. */
        if(a.def.son && typeof Sons !== "undefined") Sons.jouer(a.def.son);
        if(t === "moulinet") moulinet(a, degats, plus, force, zone);
        else if(t === "fleche") fleche(a, degats, plus, force, zone);
        else if(t === "cone") cone(a, degats, plus, force, zone);
        else if(t === "piques") piques(a, degats, plus, force, zone);
      }

      for(var k = projectiles.length - 1; k >= 0; k--){
        var p = projectiles[k];
        p.vie -= dt;
        if(p.avance) p.avance(p, dt);
        if(p.vie <= 0) projectiles.splice(k, 1);
      }
    }

    function place(){
      return projectiles.length < MAX_PROJECTILES;
    }

    /* ⚠️ LE SILLAGE. La seule arme dont la force vient du DEPLACEMENT.

       Elle garde les positions traversees pendant `duree` secondes et coupe ce
       qui se trouve a moins de `largeur` de ce chemin. Deux consequences
       voulues :

         - a l'arret, toutes les positions gardees sont la meme : la trainee se
           reduit a un point et le facteur de vitesse tombe a zero. On ne
           gagne rien a camper.
         - en courant, la trainee mesure vitesse x duree : les bottes
           l'allongent ET la renforcent, la glaire et la flaque font l'inverse.

       Rien ne reste au sol : ce qui n'a pas ete coupe au passage ne le sera
       plus. C'est ce qui la separe de la trainee de la salamandre. */
    function sillage(a, dt, degats, plus, force, zone, recharge){
      var j = partie.joueur;
      var ref = (typeof Moteur !== "undefined" && Moteur.REGLAGES
                 && Moteur.REGLAGES.vitesse) || 150;
      var vit = Math.hypot(j.vx, j.vy);
      /* pas de plafond a 1 : les bottes doivent VRAIMENT servir. Un plafond
         quand meme, pour qu'aucun cumul futur ne parte en vrille. */
      var elan = Math.min(2, vit / ref);
      var vie = valeur(a.def, "duree", a.niveau);
      var largeur = valeur(a.def, "largeur", a.niveau) * zone;
      var deg = (valeur(a.def, "degats", a.niveau) * degats + plus) * elan;
      var repos = Math.max(0.08, a.def.base.repos / Math.max(0.2, recharge || 1));

      a.trace = a.trace || [];
      a.trace.push({ x: j.x, y: j.y, t: partie.temps });
      while(a.trace.length && partie.temps - a.trace[0].t > vie) a.trace.shift();
      /* un plafond dur : a 60 images par seconde et une trainee longue, la
         liste ne doit jamais devenir un cout cache */
      while(a.trace.length > 60) a.trace.shift();
      a.elan = elan;
      a.largeur = largeur;

      if(elan < 0.05 || a.trace.length < 2) return;

      /* on ne cherche que ce qui peut atteindre la trainee : elle part du
         personnage et fait au plus vitesse x duree de long */
      var portee = vit * vie + largeur + 40;
      partie.voisines(j.x, j.y, portee, tampon);
      var coupe = false;
      for(var k = 0; k < tampon.length; k++){
        var b = tampon[k];
        if(!b.vivante || b.reposVent > partie.temps) continue;
        var marge = largeur + b.rayon;
        if(!surLaTrace(a.trace, b.x, b.y, marge)) continue;
        partie.blesser(b, deg, { x: j.x, y: j.y, force: force });
        b.reposVent = partie.temps + repos;
        coupe = true;
      }
      /* ⚠️ Le son part quand ca COUPE, pas a chaque image : un souffle continu
         a 60 images par seconde serait un grondement. Son repos propre fait le
         reste. */
      if(coupe && a.def.son && typeof Sons !== "undefined") Sons.jouer(a.def.son);
    }

    /* ⚠️ LES CHAUSSE-TRAPPES. On en seme une tous les `ecart` pas, et elles
       attendent. Deux garde-fous :

         - un PLAFOND propre. Elles vivent dans la meme liste que les fleches
           et les coups d'epee, qui en accepte quarante en tout : au niveau 6 on
           en pose une toutes les trois dixiemes de seconde pendant sept
           secondes, soit vingt-trois — de quoi affamer les autres armes. Au
           dela de seize, la plus vieille casse, exactement comme la trainee du
           salamandre.
         - une bestiole n'est mordue qu'UNE FOIS par une meme trappe. Sans ca,
           une bestiole immobile dessus consommait tous ses usages dans la meme
           image et la trappe disparaissait sans qu'on la voie. */
    var MAX_TRAPPES = 16;

    function trappes(a, degats, plus, force, zone){
      var j = partie.joueur;
      if(!a.dernier) a.dernier = { x: j.x, y: j.y };
      var ecart = Math.max(35, valeur(a.def, "ecart", a.niveau));
      var dx = j.x - a.dernier.x, dy = j.y - a.dernier.y;
      if(dx * dx + dy * dy < ecart * ecart) return;
      a.dernier.x = j.x; a.dernier.y = j.y;
      if(!place()) return;

      var vieilles = 0, plusVieille = -1;
      for(var i = 0; i < projectiles.length; i++){
        if(projectiles[i].forme !== "trappe") continue;
        vieilles++;
        if(plusVieille < 0) plusVieille = i;
      }
      if(vieilles >= MAX_TRAPPES && plusVieille >= 0) projectiles.splice(plusVieille, 1);

      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var taille = valeur(a.def, "taille", a.niveau) * zone;
      var usages = Math.max(1, Math.round(valeur(a.def, "usages", a.niveau)));
      var son = a.def.son;
      projectiles.push({
        forme: "trappe", couleur: a.def.couleur,
        x: j.x, y: j.y, r: taille,
        vie: a.def.base.duree, duree: a.def.base.duree,
        restes: usages, touches: [],
        avance: function(p, dt){
          partie.voisines(p.x, p.y, p.r + 30, tampon);
          for(var k = 0; k < tampon.length; k++){
            var b = tampon[k];
            if(!b.vivante || p.touches.indexOf(b) >= 0) continue;
            var bx = b.x - p.x, by = b.y - p.y, port = b.rayon + p.r;
            if(bx * bx + by * by > port * port) continue;
            p.touches.push(b);
            partie.blesser(b, deg, { x: p.x, y: p.y, force: force });
            if(son && typeof Sons !== "undefined") Sons.jouer(son);
            if(--p.restes <= 0){ p.vie = 0; return; }
          }
        }
      });
    }

    /* la distance d'un point au chemin parcouru, segment par segment */
    function surLaTrace(trace, x, y, marge){
      var m2 = marge * marge;
      for(var i = trace.length - 1; i > 0; i--){
        var p1 = trace[i], p0 = trace[i - 1];
        var vx = p1.x - p0.x, vy = p1.y - p0.y;
        var wx = x - p0.x, wy = y - p0.y;
        var l2 = vx * vx + vy * vy;
        var t = l2 > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / l2)) : 0;
        var dx = wx - vx * t, dy = wy - vy * t;
        if(dx * dx + dy * dy <= m2) return true;
      }
      return false;
    }

    /* un grand arc devant le chevalier, qui touche tout le secteur une fois */
    function moulinet(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var arc = valeur(a.def, "arc", a.niveau);
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var p = {
        forme: "arc", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: j.angle,
        portee: portee, arc: arc,
        vie: a.def.base.duree, duree: a.def.base.duree,
        touches: [],
        avance: function(p, dt){
          p.x = partie.joueur.x; p.y = partie.joueur.y;
          frapperSecteur(p, deg, force);
        }
      };
      projectiles.push(p);
      frapperSecteur(p, deg, force);
    }

    function frapperSecteur(p, deg, force, apres){
      partie.voisines(p.x, p.y, p.portee + 30, tampon);
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante || p.touches.indexOf(b) >= 0) continue;
        var dx = b.x - p.x, dy = b.y - p.y;
        var d = Math.hypot(dx, dy);
        if(d > p.portee + b.rayon) continue;
        var ecart = Math.abs(((Math.atan2(dy, dx) - p.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if(ecart > p.arc / 2) continue;
        p.touches.push(b);
        partie.blesser(b, deg, { x: p.x, y: p.y, force: force });
        if(apres && b.vivante) apres(b);
      }
    }

    /* des boucliers qui tournent en permanence */
    function orbite(a, dt, degats, plus, force, zone){
      a.tourne += valeur(a.def, "vitesse", a.niveau) * dt;
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var rayon = valeur(a.def, "rayon", a.niveau) * zone;
      var taille = a.def.base.taille;
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var j = partie.joueur;
      a.gardes = a.gardes || [];
      while(a.gardes.length < combien) a.gardes.push({ repos: 0 });
      a.gardes.length = combien;
      for(var i = 0; i < combien; i++){
        var g = a.gardes[i];
        var ang = a.tourne + i * (Math.PI * 2 / combien);
        g.x = j.x + Math.cos(ang) * rayon;
        g.y = j.y + Math.sin(ang) * rayon;
        g.r = taille;
        g.couleur = a.def.couleur;
        /* sa puissance se mesure a sa taille et a son nombre */
        if(a.def.base.gele) fumer(g, dt, (taille / a.def.base.taille) * (1 + (combien - 1) * 0.35));
        /* ⚠️ IL FRAPPE DES QU'IL TOUCHE. Avant, le repos etait porte par le
           BOUCLIER : apres un coup il ne frappait plus RIEN pendant un tiers de
           seconde, meme une bestiole toute neuve qui venait d'entrer dedans.
           Entoure, on voyait le bouclier traverser trois escargots sans rien
           leur faire. Le repos appartient maintenant a la BESTIOLE : chacune a
           le sien, donc une nouvelle est touchee tout de suite. */
        partie.voisines(g.x, g.y, taille + 30, tampon);
        for(var k = 0; k < tampon.length; k++){
          var b = tampon[k];
          if(!b.vivante) continue;
          if(b.reposOrbite > partie.temps) continue;
          var dx = b.x - g.x, dy = b.y - g.y, p = b.rayon + taille;
          if(dx * dx + dy * dy > p * p) continue;
          partie.blesser(b, deg, { x: g.x, y: g.y, force: force });
          /* ⚠️ Ce que la boule givree apporte n'est pas des degats, c'est du
             TEMPS : une bestiole gelee ne pense plus, donc elle ne prepare
             plus sa charge. Le gel monte avec le niveau. */
          if(a.def.base.gele){
            partie.geler(b, valeur(a.def, "gele", a.niveau));
            if(a.def.son && typeof Sons !== "undefined") Sons.jouer(a.def.son);
          }
          b.reposOrbite = partie.temps + a.def.base.repos;
        }
      }
    }

    /* Une fleche par niveau, chacune sur une bestiole differente. */
    /* ⚠️ LE SOUFFLE. Comme le moulinet, il balaie un secteur devant le
       personnage, mais il DURE : il brule tant qu'il souffle, et il frappe a
       chaque image ce qui entre dedans. Un coup d'epee touche une fois ; le
       feu touche tant qu'on reste devant. */
    function cone(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var arc = valeur(a.def, "arc", a.niveau);
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var p = {
        forme: "cone", couleur: a.def.couleur,
        x: j.x, y: j.y, angle: j.angle,
        portee: portee, arc: arc,
        vie: a.def.base.duree, duree: a.def.base.duree,
        touches: [],
        /* ⚠️ « C'est juste des triangles oranges, je veux voir du feu. » Le
           secteur plein ne sert plus qu'a savoir QUI brule ; ce qu'on voit,
           ce sont des flammeches qui jaillissent et meurent, comme la trainee
           de la salamandre mais projetees devant. */
        flammes: [],
        prochaine: 0,
        avance: function(p, dt){
          p.x = partie.joueur.x; p.y = partie.joueur.y;
          p.angle = partie.joueur.angle;
          /* ⚠️ On oublie ce qu'on a deja touche a chaque image : sinon le feu
             ne brulerait qu'une fois, et ce serait un coup d'epee orange. */
          p.touches.length = 0;
          frapperSecteur(p, deg * dt * 2.2, force * 0.3, function(b){
            /* ⚠️ Ce que le feu laisse : elle continue de bruler apres etre
               sortie du cone. Sans ca, un sort de feu n'est qu'une epee
               orange. */
            partie.bruler(b);
          });
          souffler(p, dt);
        }
      };
      projectiles.push(p);
      souffler(p, 0.016);
    }

    /* Les flammeches d'un souffle. Elles partent du personnage, filent dans le
       secteur, grossissent puis palissent : c'est ce qui fait du feu plutot
       qu'un triangle. Elles ne servent qu'a etre vues — les degats, eux, sont
       calcules sur le secteur. */
    function souffler(p, dt){
      /* ⚠️ La DENSITE suit la taille du souffle. « Avec la longue-vue ca tire
         loin mais ce n'est pas tres fourni » : le nombre de flammeches etait
         fixe, alors elles s'etalaient sur un cone deux fois plus grand et le
         feu devenait un crachin. Monter de niveau doit se SENTIR. */
      var grand = (p.portee / 132) * (p.arc / 1.0);
      var densite = Math.max(1, Math.min(4, grand));
      p.prochaine -= dt;
      if(p.prochaine <= 0){
        p.prochaine = 0.012 / densite;
        var combien = Math.max(2, Math.round(2 * densite));
        /* un plafond, sinon un souffle enorme couterait plus cher que toute
           la foule : mesure a l'appui, on tient sous les 16,7 ms */
        if(p.flammes.length > 320) combien = 0;
        for(var n = 0; n < combien; n++){
          var ecart = (partie.alea() - 0.5) * p.arc;
          var vite = p.portee * (1.4 + partie.alea() * 0.8);
          p.flammes.push({
            x: p.x, y: p.y,
            vx: Math.cos(p.angle + ecart) * vite,
            vy: Math.sin(p.angle + ecart) * vite,
            age: 0, vie: p.portee / vite * 1.25,
            r: (5 + partie.alea() * 5) * (0.85 + 0.35 * densite),
            teinte: partie.alea()
          });
        }
      }
      for(var i = p.flammes.length - 1; i >= 0; i--){
        var f = p.flammes[i];
        f.age += dt;
        if(f.age >= f.vie){ p.flammes.splice(i, 1); continue; }
        f.x += f.vx * dt;
        f.y += f.vy * dt;
      }
    }

    /* Le meme geste pour la boule givree, mais en rond et sans rien laisser au
       sol : c'est de la FUMEE GLACEE, elle suit la boule et s'evapore. */
    function fumer(g, dt, densite){
      /* ⚠️ La meme regle que pour le souffle : ce qu'on gagne en puissance doit
         SE VOIR. Une boule deux fois plus grosse qui laisse la meme fumee ne
         donne pas l'impression d'avoir monte. */
      var d = Math.max(1, Math.min(3.5, densite || 1));
      g.fumee = g.fumee || [];
      g.prochaine = (g.prochaine || 0) - dt;
      if(g.prochaine <= 0){
        g.prochaine = 0.03 / d;
        var combien = Math.max(1, Math.round(d));
        if(g.fumee.length > 90) combien = 0;
        for(var n = 0; n < combien; n++){
          g.fumee.push({ x: g.x, y: g.y, age: 0, vie: 0.5 + 0.12 * d,
                         r: g.r * (0.5 + partie.alea() * 0.4) * (0.8 + 0.28 * d),
                         derive: (partie.alea() - 0.5) * 40 });
        }
      }
      for(var i = g.fumee.length - 1; i >= 0; i--){
        var f = g.fumee[i];
        f.age += dt;
        if(f.age >= f.vie){ g.fumee.splice(i, 1); continue; }
        f.y -= 14 * dt;
        f.x += f.derive * dt;
      }
    }

    /* ⚠️ LES PIQUES DE TERRE. Elles sortent SOUS la bestiole, apres un preavis
       pendant lequel la terre tremble : c'est la regle de tout le jeu, rien ne
       frappe sans prevenir. Une pique par bestiole differente, comme les
       fleches : trois piques dans le meme escargot ne servent a rien. */
    function piques(a, degats, plus, force, zone){
      if(!place()) return;
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau) * zone;
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var taille = valeur(a.def, "taille", a.niveau) * zone;
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      /* ⚠️ « C'est trop aleatoire ou ils sortent. » Elle avait raison, et la
         cause n'etait pas le hasard : `voisines` rend les bestioles dans
         l'ordre des cases de la grille, PAS par distance. On piquait donc la
         premiere venue, qui pouvait etre la plus lointaine. L'arc, lui, triait
         depuis toujours. */
      partie.voisines(j.x, j.y, portee, tampon);
      var vues = [];
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante || partie.temps < b.arrivee) continue;
        var dx = b.x - j.x, dy = b.y - j.y, d = dx * dx + dy * dy;
        if(d > portee * portee) continue;
        vues.push({ b: b, d: d });
      }
      vues.sort(function(x, y){ return x.d - y.d; });
      var cibles = vues.slice(0, combien).map(function(v){ return v.b; });

      for(var k = 0; k < cibles.length; k++){
        if(!place()) return;
        /* ⚠️ Et on vise LA OU ELLE SERA. Une seconde de preavis sur une
           bestiole qui marche, c'est une pique qui sort derriere elle. */
        var c0 = cibles[k];
        var avance = a.def.base.preavis * (c0.espece.vitesse || 0) * 0.8;
        projectiles.push({
          forme: "pique", couleur: a.def.couleur,
          x: c0.x + Math.cos(c0.angle) * avance,
          y: c0.y + Math.sin(c0.angle) * avance, r: taille,
          vie: a.def.base.preavis + a.def.base.duree,
          duree: a.def.base.preavis + a.def.base.duree,
          preavis: a.def.base.preavis,
          degats: deg, force: force, frappe: false,
          avance: function(p, dt){
            if(p.frappe) return;
            /* elle sort quand le preavis est passe, et frappe UNE fois */
            if(p.vie > p.duree - p.preavis) return;
            p.frappe = true;
            partie.voisines(p.x, p.y, p.r + 40, tampon);
            for(var m = 0; m < tampon.length; m++){
              var c = tampon[m];
              if(!c.vivante) continue;
              var ex = c.x - p.x, ey = c.y - p.y, q = c.rayon + p.r;
              if(ex * ex + ey * ey > q * q) continue;
              partie.blesser(c, p.degats, { x: p.x, y: p.y, force: p.force });
            }
          }
        });
      }
    }

    function fleche(a, degats, plus, force, zone){
      var j = partie.joueur;
      var portee = valeur(a.def, "portee", a.niveau);
      var combien = Math.max(1, Math.round(valeur(a.def, "nombre", a.niveau)));
      var deg = valeur(a.def, "degats", a.niveau) * degats + plus;
      var perce = Math.max(1, Math.round(valeur(a.def, "perce", a.niveau)));
      var vitesse = a.def.base.vitesse;
      var taille = a.def.base.taille * zone;

      /* les `combien` plus proches, sans doublon */
      partie.voisines(j.x, j.y, portee, tampon);
      var vues = [];
      for(var i = 0; i < tampon.length; i++){
        var b = tampon[i];
        if(!b.vivante) continue;
        var dx = b.x - j.x, dy = b.y - j.y, d = dx * dx + dy * dy;
        if(d > portee * portee) continue;
        vues.push({ b: b, d: d });
      }
      vues.sort(function(x, y){ return x.d - y.d; });

      var tirs = Math.min(combien, Math.max(1, vues.length));
      for(var k = 0; k < tirs; k++){
        if(!place()) return;
        var cible = vues[k] ? vues[k].b : null;
        var ang = cible ? Math.atan2(cible.y - j.y, cible.x - j.x)
                        : j.angle + (k - tirs / 2) * 0.25;
        lancerFleche(j, ang, deg, perce, vitesse, taille, a.def.couleur, force);
      }
    }

    function lancerFleche(j, ang, deg, perce, vitesse, taille, couleur, force){
      projectiles.push({
        forme: "fleche", couleur: couleur,
        x: j.x, y: j.y, angle: ang, r: taille,
        vie: 340 / vitesse, duree: 340 / vitesse,
        touches: [],
        avance: function(p, dt){
          p.x += Math.cos(p.angle) * vitesse * dt;
          p.y += Math.sin(p.angle) * vitesse * dt;
          partie.voisines(p.x, p.y, taille + 24, tampon);
          for(var i = 0; i < tampon.length; i++){
            var b = tampon[i];
            if(!b.vivante || p.touches.indexOf(b) >= 0) continue;
            var dx = b.x - p.x, dy = b.y - p.y, q = b.rayon + taille;
            if(dx * dx + dy * dy <= q * q){
              p.touches.push(b);
              partie.blesser(b, deg, { x: p.x, y: p.y, force: force });
              if(p.touches.length >= perce) p.vie = 0;
            }
          }
        }
      });
    }

    /* ---------------------------------------------------------- le dessin */

    /* Un ecu : epaules rondes, pointe en bas, bordure claire et umbo au
       centre. `vers` est l'angle du dehors — le bouclier lui tourne le dos. */
    /* ⚠️ `ctx` est un PARAMETRE de `dessiner`, pas une variable du module : il
       faut le passer. Sans ca, la page plante des le premier tour de
       bouclier. */
    function dessinerEcu(ctx, g, vers){
      var r = g.r * 1.35;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(vers + Math.PI / 2);      /* la pointe part vers l'interieur */
      /* le corps, en acier */
      ctx.fillStyle = "#dfe6f2";
      ctx.beginPath();
      ctx.moveTo(-r * .72, -r * .62);
      ctx.quadraticCurveTo(0, -r * .95, r * .72, -r * .62);
      ctx.quadraticCurveTo(r * .72, r * .2, 0, r * .95);
      ctx.quadraticCurveTo(-r * .72, r * .2, -r * .72, -r * .62);
      ctx.fill();
      /* la bordure */
      ctx.strokeStyle = "#7d8a9e";
      ctx.lineWidth = Math.max(2, r * .12);
      ctx.stroke();
      /* la bande claire, en croix */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-r * .13, -r * .68, r * .26, r * 1.5);
      ctx.fillRect(-r * .62, -r * .24, r * 1.24, r * .24);
      /* l'umbo */
      ctx.fillStyle = "#7d8a9e";
      ctx.beginPath(); ctx.arc(0, -r * .12, r * .2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(-r * .05, -r * .17, r * .09, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    function dessiner(ctx){
      var i, k;
      for(i = 0; i < projectiles.length; i++){
        var p = projectiles[i];
        if(p.forme === "arc"){
          /* ⚠️ « Je veux voir une vraie epee. » C'etait une part de tarte
             jaune : la zone touchee, dessinee telle quelle. La zone reste —
             c'est elle qui dit ce qui est frappe — mais elle devient la
             TRAINEE du coup, et une lame la parcourt vraiment. */
          var avance = Math.max(0, Math.min(1, 1 - p.vie / p.duree));
          var debut = p.angle - p.arc / 2;
          var ou = debut + p.arc * avance;

          /* la trainee : du depart jusqu'a la lame, et elle palit derriere */
          var trace = ctx.createRadialGradient(p.x, p.y, p.portee * .25,
                                               p.x, p.y, p.portee);
          trace.addColorStop(0, "rgba(255,229,122,0)");
          trace.addColorStop(1, "rgba(255,240,180,.5)");
          ctx.globalAlpha = Math.max(0, p.vie / p.duree) * .9;
          ctx.fillStyle = trace;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.arc(p.x, p.y, p.portee, debut, ou);
          ctx.closePath();
          ctx.fill();
          /* le fil du coup, sur le bord exterieur */
          ctx.strokeStyle = "rgba(255,255,255,.75)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.portee, debut, ou);
          ctx.stroke();
          ctx.globalAlpha = 1;

          /* LA LAME, a l'endroit ou le coup en est */
          var lg = p.portee * .92;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(ou);
          /* la poignee, tenue pres du corps */
          ctx.fillStyle = "#6b4a24";
          ctx.fillRect(lg * .12, -lg * .035, lg * .16, lg * .07);
          ctx.fillStyle = "#ffd166";
          ctx.beginPath();
          ctx.arc(lg * .12, 0, lg * .045, 0, 6.2832);
          ctx.fill();
          /* la garde, en travers */
          ctx.fillStyle = "#ffc233";
          ctx.fillRect(lg * .27, -lg * .13, lg * .05, lg * .26);
          /* la lame : deux bords, une pointe, une arete claire */
          ctx.fillStyle = "#e8eef7";
          ctx.beginPath();
          ctx.moveTo(lg * .32, -lg * .075);
          ctx.lineTo(lg * .88, -lg * .045);
          ctx.lineTo(lg, 0);
          ctx.lineTo(lg * .88, lg * .045);
          ctx.lineTo(lg * .32, lg * .075);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(lg * .34, -lg * .022);
          ctx.lineTo(lg * .9, -lg * .012);
          ctx.lineTo(lg * .9, lg * .006);
          ctx.lineTo(lg * .34, lg * .016);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }else if(p.forme === "cone"){
          /* ⚠️ Des FLAMMECHES, plus un secteur plein : « c'est juste des
             triangles oranges, je veux voir du feu ». Chacune jaillit, grossit
             et palit, comme la trainee de la salamandre mais projetee devant. */
          var teintes = ["#d9330c", "#ff7a18", "#ffb03a", "#ffe066"];
          for(k = 0; k < p.flammes.length; k++){
            var f = p.flammes[k];
            var age = f.age / f.vie;
            if(age >= 1) continue;
            var gros = f.r * (0.5 + 1.7 * age);
            var t = Math.min(3, Math.floor(f.teinte * 1.4 + age * 2.6));
            ctx.globalAlpha = (1 - age) * 0.9;
            ctx.fillStyle = teintes[t];
            ctx.beginPath(); ctx.arc(f.x, f.y, gros, 0, 6.2832); ctx.fill();
            if(age < 0.5){
              ctx.globalAlpha = (1 - age * 2) * 0.75;
              ctx.fillStyle = "#ffe9a8";
              ctx.beginPath(); ctx.arc(f.x, f.y, gros * 0.45, 0, 6.2832); ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
        }else if(p.forme === "pique"){
          var reste = p.duree - p.vie;
          if(reste < p.preavis){
            /* le preavis : la terre tremble et se fendille */
            var pr = reste / p.preavis;
            ctx.globalAlpha = .35 + .35 * pr;
            ctx.strokeStyle = "#6b4a22";
            ctx.lineWidth = 3;
            for(k = 0; k < 5; k++){
              var ak = k * 1.257 + p.x * 0.01;
              ctx.beginPath();
              ctx.moveTo(p.x + Math.cos(ak) * p.r * .2, p.y + Math.sin(ak) * p.r * .12);
              ctx.lineTo(p.x + Math.cos(ak) * p.r * pr, p.y + Math.sin(ak) * p.r * .6 * pr);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }else{
            /* les pointes sorties */
            var sortie = Math.min(1, (reste - p.preavis) / 0.12);
            ctx.fillStyle = "rgba(0,0,0,.2)";
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + 4, p.r, p.r * .45, 0, 0, 6.2832);
            ctx.fill();
            for(k = 0; k < 6; k++){
              var a2 = k * 1.047 + 0.3;
              var dx2 = Math.cos(a2) * p.r * .55, dy2 = Math.sin(a2) * p.r * .32;
              var h = p.r * (0.7 + 0.3 * Math.sin(k * 2.1)) * sortie;
              ctx.fillStyle = k % 2 ? "#c08a4a" : "#9c6a33";
              ctx.beginPath();
              ctx.moveTo(p.x + dx2 - p.r * .16, p.y + dy2);
              ctx.lineTo(p.x + dx2 + p.r * .16, p.y + dy2);
              ctx.lineTo(p.x + dx2, p.y + dy2 - h);
              ctx.closePath();
              ctx.fill();
            }
          }
        }else if(p.forme === "trappe"){
          /* ⚠️ Elle doit se lire comme un PIEGE, pas comme un objet a
             ramasser : les objets du sol sont ronds, colores et brillants.
             Celle-ci est grise, anguleuse, et ses dents sont tournees vers le
             haut. Elle palit et se referme dans sa derniere seconde, pour
             qu'on voie qu'elle va disparaitre. */
          var vieux = Math.min(1, p.vie / 1);
          ctx.globalAlpha = 0.35 + 0.65 * vieux;
          ctx.fillStyle = "rgba(0,0,0,.18)";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + p.r * .3, p.r * .95, p.r * .45, 0, 0, 6.2832);
          ctx.fill();
          /* la machoire : deux arcs dentes qui se font face */
          for(var mc = -1; mc <= 1; mc += 2){
            ctx.fillStyle = mc < 0 ? "#c2ccdb" : "#a8b4c6";
            ctx.beginPath();
            ctx.moveTo(p.x - p.r * .8, p.y + mc * p.r * .12);
            for(var dt2 = 0; dt2 <= 4; dt2++){
              var px2 = p.x - p.r * .8 + (p.r * 1.6) * (dt2 / 4);
              ctx.lineTo(px2 - p.r * .1, p.y + mc * p.r * .62 * vieux);
              ctx.lineTo(px2 + p.r * .1, p.y + mc * p.r * .12);
            }
            ctx.closePath();
            ctx.fill();
          }
          /* le ressort au centre, qui dit qu'elle est armee */
          ctx.fillStyle = "#6f7c90";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .26, 0, 6.2832); ctx.fill();
          ctx.fillStyle = "#eef3fa";
          ctx.beginPath(); ctx.arc(p.x - p.r * .07, p.y - p.r * .07, p.r * .12, 0, 6.2832); ctx.fill();
          ctx.globalAlpha = 1;
        }else if(p.forme === "fleche"){
          ctx.fillStyle = p.couleur;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.r * 2.4, -p.r * .5, p.r * 4.8, p.r);
          ctx.beginPath();
          ctx.moveTo(p.r * 2.6, 0);
          ctx.lineTo(p.r * 1.1, -p.r * 1.3);
          ctx.lineTo(p.r * 1.1, p.r * 1.3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
      for(i = 0; i < mesArmes.length; i++){
        var a = mesArmes[i];
        /* ⚠️ LE SILLAGE se voit ou il COUPE, c'est-a-dire sur le chemin qu'on
           vient de parcourir. Il palit vers la queue pour qu'on lise le sens
           de la course, et il s'efface completement a l'arret : ce que l'on
           voit doit dire exactement ce qui blesse, sinon l'enfant croit que le
           vent le protege alors qu'il est immobile. */
        if(a.trace && a.trace.length > 1 && a.elan > 0.05){
          var tr = a.trace, lg = a.largeur || 26;
          var vif = Math.min(1, a.elan);
          /* ⚠️ UN TROU AUTOUR DE LUI. Dessine jusqu'a ses pieds, le sillage
             EFFACAIT LE MAGICIEN : capture a l'appui, on ne voyait plus qu'une
             tache blanche a la place du personnage. Or on vient justement de
             passer trois essais a le rendre reconnaissable. Le vent commence
             donc un peu derriere lui — ce qui se lit mieux de toute facon : le
             souffle se detache au lieu de le couvrir. */
          var trou = partie.joueur.rayon * 1.25;
          /* ⚠️ Et pas un simple degrade blanc : la premiere version, une fois
             assez pale pour ne plus cacher le personnage, ne se voyait plus du
             tout. Ce qui fait lire « vent » a huit ans, ce sont des TRAITS —
             trois filets paralleles le long du chemin, comme les traits de
             vitesse d'un dessin anime — pose sur un souffle flou. */
          var traits = [-0.55, 0, 0.55];
          for(k = 1; k < tr.length; k++){
            var av = k / (tr.length - 1);          /* 0 = la queue, 1 = lui */
            var p0 = tr[k - 1], p1 = tr[k];
            var dxj = p1.x - partie.joueur.x, dyj = p1.y - partie.joueur.y;
            if(dxj * dxj + dyj * dyj < trou * trou) continue;
            var sx = p1.x - p0.x, sy = p1.y - p0.y;
            var sl = Math.hypot(sx, sy) || 1;
            var nx = -sy / sl, ny = sx / sl;       /* la perpendiculaire */
            ctx.lineCap = "round";

            /* le souffle, large et flou */
            ctx.globalAlpha = av * 0.4 * vif;
            ctx.strokeStyle = "#dff4ff";
            ctx.lineWidth = lg * 1.6 * (0.3 + 0.7 * av);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
            ctx.stroke();

            /* les trois filets, qui s'ecartent vers la queue */
            for(var f = 0; f < 3; f++){
              var ec = traits[f] * lg * (0.5 + 0.8 * (1 - av));
              ctx.globalAlpha = Math.min(1, (0.3 + av) * (f === 1 ? 1 : 0.75)) * vif;
              ctx.strokeStyle = f === 1 ? "#ffffff" : "#8fd8ff";
              /* ⚠️ Les filets S'AFFINENT vers la queue. A largeur constante, le
                 filet du milieu formait une barre blanche nette : ca lisait
                 « laser », pas « vent ». */
              ctx.lineWidth = (f === 1 ? 1.2 : 0.8) + av * (f === 1 ? 3.6 : 2.4);
              ctx.beginPath();
              ctx.moveTo(p0.x + nx * ec, p0.y + ny * ec);
              ctx.lineTo(p1.x + nx * ec, p1.y + ny * ec);
              ctx.stroke();
            }

            /* des volutes, de part et d'autre : c'est ce qui fait du VENT
               plutot qu'un trait de peinture */
            if(k % 5 === 0){
              var ang = Math.atan2(sy, sx);
              var cote = (k / 5) % 2 ? 1 : -1;
              var ox = Math.cos(ang + cote * 1.5708) * lg * 0.75;
              var oy = Math.sin(ang + cote * 1.5708) * lg * 0.75;
              ctx.globalAlpha = Math.min(1, 0.3 + av * 0.7) * vif;
              ctx.strokeStyle = "#7fd0ff";
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.arc(p1.x + ox, p1.y + oy, lg * 0.45,
                      ang - cote * 2.4, ang + cote * 0.6, cote < 0);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }
        if(!a.gardes) continue;
        for(k = 0; k < a.gardes.length; k++){
          var g = a.gardes[k];
          if(g.x === undefined) continue;
          /* la fumee glacee, derriere la boule : elle monte et s'evapore, elle
             ne reste jamais au sol */
          if(g.fumee){
            for(var fi = 0; fi < g.fumee.length; fi++){
              var fu = g.fumee[fi], av = fu.age / fu.vie;
              if(av >= 1) continue;
              ctx.globalAlpha = (1 - av) * 0.5;
              ctx.fillStyle = av < 0.45 ? "#dff2ff" : "#9ad7ff";
              ctx.beginPath();
              ctx.arc(fu.x, fu.y, fu.r * (0.6 + av * 0.9), 0, 6.2832);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = "rgba(0,0,0,.2)";
          ctx.beginPath(); ctx.arc(g.x, g.y + 2, g.r, 0, 6.2832); ctx.fill();
          if(a.def.forme === "bouclier"){
            /* ⚠️ « Je veux voir des boucliers tourner. » C'etaient des billes
               jaunes. Un vrai ecu : epaules rondes, pointe en bas, bordure et
               umbo — et il regarde VERS L'EXTERIEUR, comme un bouclier qu'on
               tend devant soi. */
            dessinerEcu(ctx, g, Math.atan2(g.y - partie.joueur.y, g.x - partie.joueur.x));
          }else{
            ctx.fillStyle = g.couleur;
            ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.2832); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.55)";
            ctx.beginPath(); ctx.arc(g.x - g.r * .3, g.y - g.r * .3, g.r * .38, 0, 6.2832); ctx.fill();
          }
        }
      }
    }
  }

  return {
    resume: resume,
    progression: progression,
    progressionObjet: progressionObjet,
    CATALOGUE: CATALOGUE,
    PERSOS: PERSOS,
    OBJETS: OBJETS,
    MAX_ARMES: MAX_ARMES,
    MAX_OBJETS: MAX_OBJETS,
    MAX_NIVEAU: MAX_NIVEAU,
    MAX_OBJET_NIVEAU: MAX_OBJET_NIVEAU,
    MAX_PROJECTILES: MAX_PROJECTILES,
    creer: creer
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Armes;
if(typeof globalThis !== "undefined") globalThis.Armes = Armes;
