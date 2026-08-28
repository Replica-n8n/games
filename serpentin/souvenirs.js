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
    var o = lire();
    o.parties.push(Math.round(duree));
    if(o.parties.length > GARDE) o.parties = o.parties.slice(o.parties.length - GARDE);
    ecrire(o);
    return o;
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

  /* Le reglage de la partie qui vient. `aide` va de 0 a 2 :
     0 = le jeu normal, 2 = plus doux, pour quelqu'un qui meurt tres vite.
     Il faut au moins trois parties pour juger : sur une seule, on prendrait
     une partie ratee pour une habitude. */
  function reglage(){
    var o = lire();
    var m = mediane(o.parties);
    var aide = 0;
    if(o.parties.length >= 3 && m !== null){
      if(m < 120) aide = 2;
      else if(m < 240) aide = 1;
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
    lire: lire,
    ajouter: ajouter,
    oublier: oublier,
    mediane: mediane,
    reglage: reglage
  };
})();

if(typeof module !== "undefined" && module.exports) module.exports = Souvenirs;
if(typeof globalThis !== "undefined") globalThis.Souvenirs = Souvenirs;
