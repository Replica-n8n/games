/* Ce que le jeu retient des parties precedentes.

   Une seule mesure, invisible : combien de temps chaque partie a dure. Elle
   sert a regler la suivante. Si l'enfant meurt a deux minutes, le jeu ne doit
   pas continuer a lui envoyer la meme chose ; et si un fruit n'arrive qu'a la
   septieme minute alors qu'il meurt a la troisieme, ce fruit n'existe pas.

   Rien ne sort du telephone. Une seule cle dans le stockage local, et tout est
   entoure de `try` : un navigateur qui refuse le stockage doit donner un jeu
   qui marche, pas un jeu qui plante. */

var Souvenirs = (function(){
  "use strict";

  var CLE = "chevalier.souvenirs.v1";
  var CLE_ESSAI = "chevalier.essai.v1";
  var CLE_PERSO = "chevalier.perso.v1";
  var GARDE = 12;            /* on ne retient que les douze dernieres parties */

  function lire(){
    try{
      var brut = localStorage.getItem(CLE);
      if(!brut) return { parties: [] };
      var o = JSON.parse(brut);
      if(!o || !Array.isArray(o.parties)) return { parties: [] };
      return { parties: o.parties.filter(function(n){ return typeof n === "number" && isFinite(n); }) };
    }catch(e){
      return { parties: [] };
    }
  }

  function ecrire(o){
    try{
      localStorage.setItem(CLE, JSON.stringify(o));
      return true;
    }catch(e){
      return false;                 /* navigateur prive, stockage plein : tant pis */
    }
  }

  function ajouter(duree){
    if(typeof duree !== "number" || !isFinite(duree) || duree < 0) return lire();
    /* ⚠️ Une partie d'ESSAI ne compte pas. Toutes les bestioles y arrivent des
       la premiere seconde : on y meurt en une minute, et trois parties comme
       celles-la feraient croire au jeu que l'enfant n'y arrive pas, puis
       l'adouciraient pour de vrai. */
    if(essai()) return lire();
    var o = lire();
    o.parties.push(Math.round(duree));
    if(o.parties.length > GARDE) o.parties = o.parties.slice(o.parties.length - GARDE);
    ecrire(o);
    return o;
  }

  /* Le mode d'essai, choisi dans le menu et garde d'une fois sur l'autre.
     ⚠️ Il vit ici parce que c'est deja le seul endroit qui parle au stockage
     du telephone, et parce qu'il touche directement aux souvenirs : une partie
     d'essai NE COMPTE PAS. */
  function essai(){
    try{ return localStorage.getItem(CLE_ESSAI) === "1"; }
    catch(e){ return false; }
  }

  function reglerEssai(actif){
    try{
      if(actif) localStorage.setItem(CLE_ESSAI, "1");
      else localStorage.removeItem(CLE_ESSAI);
    }catch(e){}
    return actif;
  }

  /* Le personnage choisi. Un enfant qui aime le magicien ne veut pas le
     rechoisir a chaque partie. */
  function perso(){
    try{ return localStorage.getItem(CLE_PERSO) || "chevalier"; }
    catch(e){ return "chevalier"; }
  }

  function reglerPerso(nom){
    try{ localStorage.setItem(CLE_PERSO, String(nom)); }catch(e){}
    return nom;
  }

  function oublier(){
    try{ localStorage.removeItem(CLE); }catch(e){}
  }

  /* la duree du milieu, moins sensible a une partie ratee qu'une moyenne */
  function mediane(parties){
    if(!parties.length) return null;
    var t = parties.slice().sort(function(a, b){ return a - b; });
    return t[Math.floor(t.length / 2)];
  }

  /* Le reglage de la partie qui vient. `aide` va de -2 a 2 :
     0 = le jeu normal, 2 = plus doux pour quelqu'un qui meurt tres vite,
     et -2 = plus serre pour quelqu'un qui va au bout a chaque fois.
     ⚠️ Les deux sens comptent. Une metrique qui ne sait qu'adoucir laisse le
     jeu devenir facile et ennuyeux des qu'on progresse, et c'est exactement ce
     qui est arrive. Il faut au moins trois parties pour juger : sur une seule,
     on prendrait une partie ratee pour une habitude. */
  function reglage(){
    var o = lire();
    var m = mediane(o.parties);
    var aide = 0;
    if(o.parties.length >= 3 && m !== null){
      if(m < 120) aide = 2;
      else if(m < 240) aide = 1;
      else if(m >= 430) aide = -2;      /* il va presque toujours au bout */
      else if(m >= 340) aide = -1;
    }
    return {
      parties: o.parties.length,
      mediane: m,
      aide: aide,
      /* Les cinq fruits doivent tous etre trouvables AVANT la fin d'une partie
         habituelle : le cinquieme vise 60 % de la duree mediane. Sans souvenir,
         on part sur trois minutes. */
      legumeChaque: Math.max(12, Math.min(40, Math.round((m || 180) * 0.6 / 5)))
    };
  }

  return {
    CLE: CLE,
    CLE_ESSAI: CLE_ESSAI,
    essai: essai,
    reglerEssai: reglerEssai,
    perso: perso,
    reglerPerso: reglerPerso,
    lire: lire,
    ajouter: ajouter,
    oublier: oublier,
    mediane: mediane,
    reglage: reglage
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Souvenirs;
if(typeof globalThis !== "undefined") globalThis.Souvenirs = Souvenirs;
