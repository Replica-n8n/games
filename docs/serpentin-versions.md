# Le chevalier (serpentin/) : versions

Numéro en trois chiffres, `majeur.mineur.correctif`, dans `serpentin/sw.js`
(`VERSION = "chevalier-x.y.z"`), qui nomme le cache hors ligne. Le menu
l'affiche (« Version x.y.z », et « service x.y.z » dans le diagnostic). Il est
recopié dans `serpentin/index.html` : ce n'est pas une deuxième source mais un
témoin. La page vient du réseau, les scripts du cache : si la page et le
service ne disent pas la même chose, le menu propose « Réparer ».
`tools/chevalier-moteur.mjs` refuse deux valeurs différentes.

- **majeur** : un autre jeu, ou une ancienne sauvegarde qui ne marcherait plus ;
- **mineur** : du nouveau (monde, boss, créature, arme, écran, son) ;
- **correctif** : corrections, retouches et dessins refaits.

Jusqu'au 2026-10-17, le numéro était un compteur (`serpentin-v1` à
`serpentin-v7` pour le serpent, puis `chevalier-v1` à `chevalier-v82`),
augmenté à chaque publication. Les numéros sautés (v10, v17) n'ont jamais été
publiés. Correspondance, reconstruite d'après l'historique :

| Version | Ancien compteur | Date | Contenu |
|---|---|---|---|
| 0.1.0 | serpentin-v1 | 2026-08-27 | Le serpent : la coquille PWA |
| 0.2.0 | serpentin-v2 | 2026-08-27 | Le noyau du moteur |
| 0.3.0 | serpentin-v3 | 2026-08-27 | La prairie s'affiche |
| 0.4.0 | serpentin-v4 | 2026-08-27 | Le pouce dirige |
| 0.4.1 | serpentin-v5 | 2026-08-27 | Virages plus serrés |
| 0.5.0 | serpentin-v6 | 2026-08-27 | Mourir |
| 0.6.0 | serpentin-v7 | 2026-08-27 | Les adversaires |
| 1.0.0 | v1 | 2026-08-27 | Le chevalier remplace le serpent |
| 1.1.0 | v2 | 2026-08-27 | Le heaume, les fraises qui soignent |
| 1.2.0 | v3 | 2026-08-27 | Menu, objets au sol |
| 1.3.0 | v4 | 2026-08-27 | Les cinq bestioles, l'onde de niveau, le bouclier |
| 1.4.0 | v5 | 2026-08-27 | Arme de départ au hasard, aimant, bombe |
| 1.5.0 | v6 | 2026-08-28 | La roue tire l'arme |
| 1.5.1 | v7 | 2026-08-28 | Les gantelets font enfin quelque chose |
| 1.5.2 | v8 | 2026-08-28 | Relecture complète, sept défauts corrigés |
| 1.6.0 | v9 | 2026-08-28 | La météo : pluie et nuit |
| 1.6.1 | v11 | 2026-08-28 | Le hérisson touche, les cartes parlent, la fin s'explique |
| 1.6.2 | v12 | 2026-08-28 | Le tableau dit le résultat |
| 1.6.3 | v13 | 2026-08-28 | La bulle, le hérisson, le cache qui ne se mettait pas à jour |
| 1.6.4 | v14 | 2026-08-28 | Moins de vert |
| 1.7.0 | v15 | 2026-08-28 | La neige et l'orage |
| 1.8.0 | v16 | 2026-08-28 | Un cadran annonce le temps |
| 1.9.0 | v18 | 2026-08-28 | L'onde pousse, les cœurs, cinq fruits, la mémoire des parties |
| 1.10.0 | v19 | 2026-08-28 | Ciel enchaîné, colosse, traînée de feu |
| 1.10.1 | v20 | 2026-08-28 | Les pastilles du panier ne se chevauchent plus |
| 1.11.0 | v21 | 2026-08-28 | Le lucane, l'invincibilité se voit |
| 1.11.1 | v22 | 2026-08-28 | Le piment tombe enfin |
| 1.12.0 | v23 | 2026-08-28 | La limace |
| 1.13.0 | v24 | 2026-08-28 | L'interrupteur « Tout voir » |
| 1.13.1 | v25 | 2026-08-28 | Le rétrogradage se voit sur le chevalier |
| 1.14.0 | v26 | 2026-08-28 | Le magicien et trois sorts |
| 1.14.1 | v27 | 2026-08-28 | Revue complète, huit défauts corrigés |
| 1.15.0 | v28 | 2026-08-28 | La nuit devient une clairière, des nuages |
| 1.15.1 | v29 | 2026-08-28 | Les flaques, le souffle qui monte |
| 1.15.2 | v30 | 2026-08-28 | « Tout voir » devient « Difficile » |
| 1.16.0 | v31 | 2026-08-28 | La reine des toiles |
| 1.17.0 | v32 | 2026-08-28 | Un bouton pour répéter le combat de la reine |
| 1.17.1 | v33 | 2026-08-28 | Un boss ne recule pas |
| 1.18.0 | v34 | 2026-08-29 | Une vraie épée, de vrais boucliers |
| 1.18.1 | v35 | 2026-08-29 | Les escargots redessinés |
| 1.19.0 | v36 | 2026-08-29 | Le son |
| 1.20.0 | v37 | 2026-08-29 | Sons d'épée, de feu, de terre, de roue, fanfare |
| 1.20.1 | v38 | 2026-08-29 | Ce qui reste après le coup, une nuit qui cache |
| 1.20.2 | v39 | 2026-08-29 | Le crapaud s'assoit, le hérisson montre son museau |
| 1.20.3 | v40 | 2026-08-29 | Recommencer ramène au choix du personnage |
| 1.20.4 | v41 | 2026-08-29 | Le magicien tient un bâton |
| 1.20.5 | v42 | 2026-08-29 | Le chevalier et le magicien debout, avec un visage |
| 1.21.0 | v43 | 2026-08-30 | Le vent tranchant |
| 1.22.0 | v44 | 2026-08-30 | La chausse-trappe, le mauvais temps qui fait mal |
| 1.23.0 | v45 | 2026-08-30 | Le bouclier en acier, des options sans un mot |
| 1.23.1 | v46 | 2026-08-30 | Les pissenlits poussent sous la pluie |
| 1.24.0 | v47 | 2026-08-30 | Le papillon toxique |
| 1.24.1 | v48 | 2026-08-30 | La nuée devient fumée noire |
| 1.24.2 | v49 | 2026-08-30 | Le papillon vole assez vite |
| 1.25.0 | v50 | 2026-09-02 | L'épouvantail |
| 1.25.1 | v51 | 2026-09-02 | Un seul choix par grappe |
| 1.26.0 | v52 | 2026-09-02 | L'île et le volcan |
| 1.26.1 | v53 | 2026-09-02 | « Difficile » sur l'écran des personnages |
| 1.27.0 | v54 | 2026-09-02 | La salamandre remplace le piment |
| 1.28.0 | v55 | 2026-09-03 | Herbe, vagues, bulles de lave, fumée |
| 1.29.0 | v56 | 2026-09-03 | Chaque monde a sa texture |
| 1.30.0 | v57 | 2026-09-03 | Un boss par monde : roi crabe, dragon d'obsidienne |
| 1.30.1 | v58 | 2026-09-03 | Une carte par niveau, le voile des cocotiers |
| 1.30.2 | v59 | 2026-09-03 | Le numéro ne suit plus l'accélérateur |
| 1.30.3 | v60 | 2026-09-03 | Le ciel se fond au lieu de basculer |
| 1.31.0 | v61 | 2026-09-04 | Mode boss |
| 1.31.1 | v62 | 2026-09-04 | Le bouton Installer s'efface une fois installé |
| 1.31.2 | v63 | 2026-09-04 | La vague du crabe a une porte, la lave tombe du ciel |
| 1.31.3 | v64 | 2026-09-04 | Le dragon saute pour de vrai |
| 1.31.4 | v65 | 2026-09-04 | Le crabe n'a plus d'anneau mort |
| 1.31.5 | v66 | 2026-09-04 | Les rochers brûlent, le dragon respire |
| 1.31.6 | v67 | 2026-09-04 | Un boss ne se fige jamais |
| 1.32.0 | v68 | 2026-09-11 | Choisir son monde |
| 1.33.0 | v69 | 2026-09-12 | L'écran de départ : blasons, polices, icônes dessinées |
| 1.34.0 | v70 | 2026-09-14 | Le chat géant |
| 1.34.1 | v71 | 2026-09-14 | Chat géant réglé |
| 1.34.2 | v72 | 2026-09-14 | Le jeu ne repeint plus tout, tout le temps |
| 1.34.3 | v73 | 2026-09-15 | Le menu met le jeu en pause |
| 1.35.0 | v74 | 2026-09-15 | L'épée légendaire, et le Labo |
| 1.36.0 | v75 | 2026-09-15 | Les bottes légendaires |
| 1.37.0 | v76 | 2026-09-15 | Le bouclier légendaire |
| 1.37.1 | v77 | 2026-09-15 | Une mise à jour n'efface plus le hors ligne des autres apps |
| 1.37.2 | v78 | 2026-09-17 | Le cache ne garde plus un ancien armes.js |
| 1.38.0 | v79 | 2026-09-17 | Diagnostic et « Réparer » dans le menu |
| 1.38.1 | v80 | 2026-09-17 | L'icône n'apparaît plus collée au milieu au chargement |
| 1.38.2 | v81 | 2026-09-17 | L'icône de la chausse-trappe redessinée |
| 1.38.3 | v82 | 2026-09-17 | Le Labo hors de portée d'un enfant, secousses réduites |
| 1.38.4 | (aucun) | 2026-10-17 | Le numéro passe en trois chiffres |
