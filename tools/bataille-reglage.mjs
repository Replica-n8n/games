import { regler, REGLE, ATOUTS, lire } from "../serveur-bataille/worker.js";

/* Le réglage automatique du mode à atouts (serveur-bataille/worker.js, `regler`)
   prend-il les bonnes décisions ? On lui donne des compteurs fabriqués, hors
   navigateur, et on regarde ce qu'il décide. Aucun réseau. */

const echecs = [];
const verifie = (nom, ok, detail) => { if (!ok) echecs.push(nom + (detail !== undefined ? " : " + detail : "")); };
const depart = () => ({ g: 0, f: 1, s: {}, mesure: true, total: 0, fin: "" });
const compteurs = (n, taux, extra = {}) => ({ g: Math.round(n * taux), e: 0, p: n - Math.round(n * taux), offert: {}, choisi: {}, avec: {}, ...extra });

/* trop peu d'années : il ne touche à rien */
let r = regler({ ...depart(), total: 100 }, compteurs(100, 0.9));
verifie("sous " + REGLE.MIN + " années, rien ne change", r.etat.g === 0 && r.etat.f === 1 && r.raisons.length === 0);
/* dans la bande visée : rien */
r = regler({ ...depart(), total: 120 }, compteurs(120, 0.55));
verifie("55 % de victoires : rien à changer", r.etat.g === 0 && r.raisons.length === 0, r.raisons.join());
/* les joueurs gagnent trop : le Maudit prend de la vie, nouveau réglage */
r = regler({ ...depart(), total: 120 }, compteurs(120, 0.7));
verifie("70 % de victoires : le Maudit gagne de la vie", r.etat.f === 1.02 && r.etat.g === 1, r.etat.f);
/* ils perdent trop */
r = regler({ ...depart(), total: 120 }, compteurs(120, 0.4));
verifie("40 % de victoires : le Maudit perd de la vie", r.etat.f === 0.98 && r.etat.g === 1, r.etat.f);
/* jamais au-delà des bornes */
r = regler({ ...depart(), f: REGLE.F_MAX, total: 120 }, compteurs(120, 0.9));
verifie("la vie du Maudit ne dépasse pas sa borne", r.etat.f === REGLE.F_MAX);
/* un atout qui gagne bien plus que les autres est affaibli ; un boudé est renforcé */
r = regler({ ...depart(), total: 140 }, compteurs(140, 0.55, { avec: { vampire: { g: 40, e: 0, p: 5 }, pari: { g: 10, e: 0, p: 35 } }, offert: { butin: 80, garde: 80 }, choisi: { butin: 4, garde: 30 } }));
verifie("un atout trop gagnant est affaibli", r.etat.s.vampire === 0.85, r.etat.s.vampire);
verifie("un atout trop perdant est renforcé", r.etat.s.pari === 1.15, r.etat.s.pari);
verifie("un atout presque jamais choisi est renforcé", r.etat.s.butin === 1.15 && r.etat.s.garde === undefined, JSON.stringify(r.etat.s));
verifie("un changement ouvre un nouveau réglage", r.etat.g === 1);
/* trop peu d'années avec un atout : on ne juge pas */
r = regler({ ...depart(), total: 120 }, compteurs(120, 0.55, { avec: { vampire: { g: 20, e: 0, p: 0 } } }));
verifie("20 années avec un atout ne suffisent pas à le juger", r.etat.s.vampire === undefined);
/* la mesure s'arrête : stable, ou plafond */
r = regler({ ...depart(), total: 300 }, compteurs(300, 0.55));
verifie(REGLE.STABLE + " années sans rien à changer : la mesure s'arrête", r.etat.mesure === false && r.etat.fin === "stable");
r = regler({ ...depart(), total: REGLE.PLAFOND }, compteurs(40, 0.9));
verifie("au plafond, la mesure s'arrête quoi qu'il arrive", r.etat.mesure === false && r.etat.fin === "plafond");
r = regler({ ...depart(), mesure: false, fin: "stable" }, compteurs(400, 0.9));
verifie("une mesure arrêtée ne change plus rien", r.etat.f === 1 && r.etat.g === 0 && r.raisons.length === 0);
/* la fiche : le numéro de réglage est accepté, un identifiant ne change rien à ce qui est gardé */
const f = lire({ v: "V12", mode: "essai", r: "g", mois: 9, ecart: 4, g: 3, choix: [{ o: ["vampire", "garde", "butin"], c: "garde" }], id: "joueur" });
verifie("la fiche garde le numéro de réglage et rien d'inattendu", f && f.g === 3 && Object.keys(f).sort().join() === "choix,ecart,g,mode,mois,r,v", f && Object.keys(f).join());
verifie("quatorze atouts connus du compteur", ATOUTS.length === 14);

console.log(echecs.length ? "ÉCHEC\n" + echecs.join("\n") : "bataille-reglage : le réglage automatique décide comme prévu");
process.exit(echecs.length ? 1 : 0);
