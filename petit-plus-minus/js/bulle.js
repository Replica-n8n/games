/* La bulle de respiration : 4 s pour inspirer, 4 s pour souffler, en boucle.
   Le mot affiché change en même temps que la bulle : sans animation (réglage du
   téléphone), c'est lui et la teinte qui guident. Les deux mots viennent de
   contenu.json (sos.motInspire, sos.motSouffle). quandCycle() est appelé à la fin de
   chaque cycle complet de 8 s. Rend une fonction d'arrêt. */

export const PHASE_MS = 4000;

export function lancerBulle(bulle, mot, mots, quandCycle) {
  let inspire = true;
  let demarre = false;
  function pas() {
    // Un cycle (inspirer puis souffler) se termine quand on repasse à « inspire ».
    if (inspire && demarre && quandCycle) quandCycle();
    demarre = true;
    bulle.classList.toggle("grande", inspire);
    mot.textContent = inspire ? mots.inspire : mots.souffle;
    inspire = !inspire;
  }
  // Une image plus tard : la bulle doit d'abord être posée petite pour que la transition joue.
  const premier = requestAnimationFrame(pas);
  const cycle = setInterval(pas, PHASE_MS);
  return function arreter() {
    cancelAnimationFrame(premier);
    clearInterval(cycle);
  };
}
