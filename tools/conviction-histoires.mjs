// Pièce à conviction : les histoires que le générateur transforme en enquêtes
// (tools/conviction-generateur.mjs). Une histoire = un décor, des personnes
// avec leur visage, un coupable, la pièce du crime, une intro et un dénouement.
// Les témoignages et la solution sont calculés, jamais écrits ici.
// Histoires originales : personnages célèbres, intrigues à nous.

/** Un meuble sur une ou plusieurs cases. */
const M = (type, ...cells) => ({ type, cells });
const homme = (o) => ({ ...o });
const femme = (o) => ({ ...o, fem: true });

export const HISTOIRES = [
  // ------------------------------------------------------------ Sherlock Holmes
  {
    id: 'holmes-221b', collection: 'Sherlock Holmes', title: 'Meurtre au 221B', theme: 'Baker Street',
    floor: '221B Baker Street', size: 6, ambiance: 'soir', variants: ['facile', 'moyen'],
    intro: "Londres, 1899. Charles Augustus Milverton, le roi des maîtres chanteurs, était venu narguer Sherlock Holmes chez lui. On l'a retrouvé mort au 221B. Holmes vous confie les témoignages : placez chacun sur le plan, une personne par ligne et par colonne. Le coupable est la seule personne qui était seule avec la victime dans une pièce.",
    rooms: [
      { id: 'S', name: 'Salon', material: 'tapis', in: 'dans le salon' },
      { id: 'B', name: 'Cabinet de travail', material: 'parquet', in: 'dans le cabinet de travail' },
      { id: 'C', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
      { id: 'M', name: 'Chambre', material: 'moquette', in: 'dans la chambre' },
    ],
    layout: ['SSSBBB', 'SSSBBB', 'SSCCBB', 'MMCCCB', 'MMMCCC', 'MMMCCC'],
    furniture: [M('fauteuil', [0, 0]), M('cheminee', [0, 1]), M('fauteuil', [1, 2]), M('bureau', [0, 4]), M('etagere', [0, 5]), M('tabouret', [1, 4]),
      M('table', [3, 3]), M('fourneau', [4, 5]), M('chaise', [5, 4]), M('armoire', [3, 0]), M('lit', [5, 0])],
    persons: [
      femme({ id: 'H', name: 'Mrs Hudson', role: 'la logeuse', color: 'ocre', look: { skin: 'rose', hair: 'chignon', hairColor: 'gris', outfit: 'tablier' } }),
      homme({ id: 'W', name: 'Dr Watson', role: 'le médecin', color: 'sapin', look: { skin: 'hale', hair: 'court', hairColor: 'brun', outfit: 'manteau', extras: ['moustache'] } }),
      homme({ id: 'L', name: 'Lestrade', role: "l'inspecteur", color: 'ardoise', look: { skin: 'clair', hair: 'court', hairColor: 'noir', hat: 'melon', outfit: 'manteau' } }),
      femme({ id: 'I', name: 'Irene Adler', role: "l'aventurière", color: 'prune', look: { skin: 'clair', hair: 'chignon', hairColor: 'brun', hat: 'bibi', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'R', name: 'Colonel Moran', role: 'le chasseur de tigres', color: 'brique', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', outfit: 'uniforme', extras: ['moustache-ciree'] } }),
      homme({ id: 'V', name: 'Augustus Milverton', role: 'le maître chanteur, victime', color: 'victime', victim: true, look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'costume', extras: ['lunettes'] } }),
    ],
    culprit: 'I', crimeRoom: 'S',
    verdict: "Irene Adler était seule avec Milverton dans le salon. Elle seule avait des lettres à reprendre à ce serpent. Pour Holmes, elle restera toujours « la femme ».",
  },
  {
    id: 'holmes-baskerville', collection: 'Sherlock Holmes', title: 'Le Chien des Baskerville', theme: 'Dartmoor',
    floor: 'Baskerville Hall et la lande', size: 7, ambiance: 'nuit', variants: ['moyen', 'difficile'],
    intro: "Dartmoor, 1889. Le forçat évadé Selden a été retrouvé mort sur la lande, au pied du manoir des Baskerville. Les paysans parlent d'un chien venu de l'enfer. Holmes, lui, ne croit qu'aux témoignages.",
    rooms: [
      { id: 'L', name: 'La lande', material: 'herbe', in: 'sur la lande' },
      { id: 'B', name: 'Bibliothèque', material: 'parquet', in: 'dans la bibliothèque' },
      { id: 'H', name: 'Grand hall', material: 'pierre', in: 'dans le grand hall' },
      { id: 'D', name: 'Salle à manger', material: 'tapis', in: 'dans la salle à manger' },
      { id: 'K', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
      { id: 'S', name: 'Serre', material: 'tomettes', in: 'dans la serre' },
    ],
    layout: ['LLLLLLL', 'LLBBHHH', 'LLBBHHH', 'DDDDHHH', 'DDDDKKK', 'SSSDKKK', 'SSSSKKK'],
    furniture: [M('plante', [0, 1]), M('plante', [0, 5]), M('etagere', [1, 2]), M('bureau', [2, 3]), M('armure', [1, 6]), M('fauteuil', [2, 5]), M('cheminee', [3, 6]),
      M('table', [3, 1], [4, 1]), M('chaise', [4, 2]), M('comptoir', [4, 6]), M('tabouret', [5, 5]), M('fourneau', [6, 6]), M('plante', [6, 0]), M('banc', [5, 1])],
    persons: [
      homme({ id: 'J', name: 'Jack Stapleton', role: 'le naturaliste', color: 'sapin', look: { skin: 'clair', hair: 'court', hairColor: 'blond', hat: 'paille', outfit: 'costume', extras: ['lunettes'] } }),
      femme({ id: 'B', name: 'Miss Stapleton', role: 'la sœur du naturaliste', color: 'prune', look: { skin: 'mat', hair: 'chignon', hairColor: 'noir', outfit: 'robe' } }),
      homme({ id: 'H', name: 'Henry Baskerville', role: "l'héritier", color: 'brique', look: { skin: 'hale', hair: 'court', hairColor: 'chatain', outfit: 'costume', extras: ['moustache'] } }),
      homme({ id: 'A', name: 'Mr Barrymore', role: 'le majordome', color: 'ardoise', look: { skin: 'clair', hair: 'court', hairColor: 'noir', outfit: 'livree', extras: ['barbe'] } }),
      femme({ id: 'E', name: 'Eliza Barrymore', role: 'la gouvernante', color: 'ocre', look: { skin: 'rose', hair: 'chignon', hairColor: 'chatain', outfit: 'tablier' } }),
      homme({ id: 'M', name: 'Dr Mortimer', role: 'le médecin de campagne', color: 'canard', look: { skin: 'rose', hair: 'degarni', hairColor: 'chatain', outfit: 'manteau', extras: ['lunettes'] } }),
      homme({ id: 'V', name: 'Selden', role: 'le forçat évadé, victime', color: 'victime', victim: true, look: { skin: 'hale', hair: 'long', hairColor: 'brun', outfit: 'chemise', extras: ['barbe'] } }),
    ],
    culprit: 'J', crimeRoom: 'L',
    verdict: "Stapleton était seul avec Selden sur la lande. Le naturaliste y lâchait son chien, enduit de phosphore, sur l'odeur de vieux habits de Sir Henry : Selden les portait ce soir-là.",
  },

  // ------------------------------------------------------------ Hercule Poirot
  {
    id: 'poirot-orient-express', collection: 'Hercule Poirot', title: "Le Crime de l'Orient-Express", theme: 'Train de luxe',
    floor: "La voiture Istanbul-Calais", size: 7, ambiance: 'neige', variants: ['moyen', 'difficile'],
    intro: "Hiver 1934. L'Orient-Express est bloqué par la neige quelque part en Yougoslavie. Au matin, M. Ratchett est retrouvé poignardé. Hercule Poirot met ses petites cellules grises au travail : aidez-les.",
    rooms: [
      { id: 'N', name: 'Dehors', material: 'neige', in: 'dehors, dans la neige' },
      { id: 'R', name: 'Voiture-restaurant', material: 'velours', in: 'dans la voiture-restaurant' },
      { id: 'S', name: 'Bar', material: 'planches', in: 'au bar' },
      { id: 'K', name: 'Compartiment de Ratchett', material: 'moquette', in: 'dans le compartiment de Ratchett' },
      { id: 'H', name: 'Compartiment de Mrs Hubbard', material: 'moquette', in: 'dans le compartiment de Mrs Hubbard' },
      { id: 'F', name: 'Fourgon', material: 'planches', in: 'dans le fourgon' },
    ],
    layout: ['NNNNNNN', 'RRRRRRR', 'RRRSSSS', 'KKKSSSS', 'KKKHHHH', 'FFFHHHH', 'FFFFFFF'],
    furniture: [M('plante', [0, 0]), M('plante', [0, 6]), M('table', [1, 1]), M('table', [1, 5]), M('banquette', [2, 1]), M('banquette', [1, 3]), M('fauteuil', [2, 4]), M('comptoir', [2, 6]), M('tabouret', [3, 5]),
      M('lit', [3, 0]), M('coffre', [4, 2]), M('lit', [5, 6]), M('armoire', [4, 6]), M('coffre', [6, 2]), M('tonneau', [6, 5]), M('coffre', [5, 1])],
    persons: [
      homme({ id: 'Q', name: 'Hector MacQueen', role: 'le secrétaire', color: 'canard', look: { skin: 'clair', hair: 'court', hairColor: 'roux', outfit: 'costume' } }),
      femme({ id: 'D', name: 'Mary Debenham', role: "l'institutrice", color: 'prune', look: { skin: 'clair', hair: 'chignon', hairColor: 'blond', outfit: 'robe' } }),
      homme({ id: 'A', name: 'Arbuthnot', role: "l'officier", color: 'brique', look: { skin: 'hale', hair: 'court', hairColor: 'chatain', outfit: 'uniforme', extras: ['moustache'] } }),
      femme({ id: 'P', name: 'Dragomiroff', role: "l'aristocrate russe", color: 'ardoise', look: { skin: 'rose', hair: 'chignon', hairColor: 'blanc', hat: 'bibi', outfit: 'fourrure', extras: ['collier'] } }),
      homme({ id: 'M', name: 'Pierre Michel', role: 'le contrôleur', color: 'sapin', look: { skin: 'mat', hair: 'court', hairColor: 'noir', hat: 'kepi', outfit: 'uniforme', extras: ['moustache'] } }),
      femme({ id: 'H', name: 'Caroline Hubbard', role: "l'Américaine bavarde", color: 'rose', look: { skin: 'rose', hair: 'boucle', hairColor: 'roux', outfit: 'robe', extras: ['boucles'] } }),
      homme({ id: 'V', name: 'Ratchett', role: "l'homme d'affaires, victime", color: 'victime', victim: true, look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', outfit: 'costume', extras: ['moustache'] } }),
    ],
    culprit: 'Q', crimeRoom: 'K',
    verdict: "Hector MacQueen était seul avec Ratchett dans son compartiment. Le secrétaire savait qui était vraiment son patron : Cassetti, l'homme qui avait détruit la famille Armstrong. Les petites cellules grises ont parlé.",
  },
  {
    id: 'poirot-nil', collection: 'Hercule Poirot', title: 'Mort sur le Nil', theme: 'Bateau à aubes',
    floor: 'Le Karnak', size: 6, ambiance: 'soir', variants: ['facile', 'moyen'],
    intro: "Égypte, 1937. À bord du Karnak, la riche Linnet Doyle est retrouvée morte dans sa cabine, au lendemain d'une scène terrible avec son ancienne amie Jacqueline. Hercule Poirot est à bord, en vacances. Plus pour longtemps.",
    rooms: [
      { id: 'P', name: 'Pont avant', material: 'pont', in: 'sur le pont avant' },
      { id: 'S', name: 'Salon', material: 'velours', in: 'dans le salon' },
      { id: 'C', name: 'Cabine de Linnet', material: 'moquette', in: 'dans la cabine de Linnet' },
      { id: 'B', name: 'Bar', material: 'planches', in: 'au bar' },
      { id: 'J', name: 'Cabine de Jacqueline', material: 'moquette', in: 'dans la cabine de Jacqueline' },
      { id: 'T', name: 'Pont arrière', material: 'pont', in: 'sur le pont arrière' },
    ],
    layout: ['PPPPPP', 'PPSSSS', 'CCSSSS', 'CCBBBJ', 'CCBBJJ', 'TTBBJJ'],
    furniture: [M('transat', [0, 1]), M('transat', [0, 4]), M('tonneau', [0, 5]), M('piano', [1, 5]), M('fauteuil', [2, 3]), M('lit', [2, 0]), M('coffre', [4, 1]),
      M('comptoir', [3, 4]), M('tabouret', [4, 3]), M('lit', [5, 5]), M('armoire', [3, 5]), M('transat', [5, 0])],
    persons: [
      femme({ id: 'J', name: 'Jacqueline', role: "l'amie trahie", color: 'brique', look: { skin: 'mat', hair: 'court', hairColor: 'noir', outfit: 'robe', extras: ['boucles'] } }),
      homme({ id: 'S', name: 'Simon Doyle', role: 'le jeune marié', color: 'canard', look: { skin: 'hale', hair: 'court', hairColor: 'chatain', outfit: 'costume' } }),
      femme({ id: 'O', name: 'Mrs Otterbourne', role: 'la romancière', color: 'rose', look: { skin: 'rose', hair: 'boucle', hairColor: 'roux', hat: 'bibi', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'R', name: 'Colonel Race', role: 'le militaire', color: 'sapin', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', outfit: 'uniforme', extras: ['moustache'] } }),
      homme({ id: 'T', name: 'Tim Allerton', role: 'le voyageur', color: 'ocre', look: { skin: 'clair', hair: 'court', hairColor: 'blond', hat: 'paille', outfit: 'chemise' } }),
      femme({ id: 'V', name: 'Linnet Doyle', role: "l'héritière, victime", color: 'victime', victim: true, look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe', extras: ['collier'] } }),
    ],
    culprit: 'J', crimeRoom: 'C',
    verdict: "Jacqueline était seule avec Linnet dans sa cabine. La dispute du salon et le coup de feu n'étaient qu'une comédie, montée avec un complice qui ne l'avait jamais vraiment quittée.",
  },

  // ------------------------------------------------------------ Agatha Christie
  {
    id: 'christie-dix', collection: 'Agatha Christie', title: 'Ils étaient dix', theme: 'Île déserte',
    floor: "La villa de l'île du Soldat", size: 8, ambiance: 'orage', variants: ['moyen'],
    intro: "Août 1939. Dix inconnus sont invités sur une île au large du Devon par un hôte qui ne vient pas. Au premier soir, une voix les accuse chacun d'un crime ; le jeune Anthony Marston s'effondre, empoisonné. Il n'y a personne d'autre sur l'île.",
    rooms: [
      { id: 'J', name: 'La falaise', material: 'herbe', in: 'sur la falaise' },
      { id: 'T', name: 'Terrasse', material: 'pave', in: 'sur la terrasse' },
      { id: 'S', name: 'Salon', material: 'tapis', in: 'dans le salon' },
      { id: 'H', name: 'Hall', material: 'marbre', in: 'dans le hall' },
      { id: 'D', name: 'Salle à manger', material: 'parquet', in: 'dans la salle à manger' },
      { id: 'C', name: 'Chambre du juge', material: 'moquette', in: 'dans la chambre du juge' },
      { id: 'K', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
    ],
    layout: ['JJJJJTTT', 'JJJJJTTT', 'SSSHHHTT', 'SSSHHHDD', 'SSSHHHDD', 'CCCHHDDD', 'CCCKKDDD', 'CCCKKKKK'],
    furniture: [M('plante', [0, 1]), M('plante', [1, 3]), M('transat', [0, 6]), M('table', [1, 7]), M('piano', [2, 0]), M('fauteuil', [3, 1]), M('canape', [4, 2]),
      M('statue', [2, 4]), M('armure', [4, 4]), M('table', [4, 6], [4, 7]), M('chaise', [3, 6]), M('chaise', [5, 7]),
      M('lit', [7, 0]), M('armoire', [5, 0]), M('fauteuil', [6, 2]), M('fourneau', [7, 7]), M('comptoir', [6, 4]), M('tabouret', [7, 4])],
    persons: [
      homme({ id: 'W', name: 'Juge Wargrave', role: 'le juge à la retraite', color: 'ardoise', look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'costume', extras: ['lunettes'] } }),
      femme({ id: 'C', name: 'Vera Claythorne', role: 'la secrétaire', color: 'canard', look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe' } }),
      homme({ id: 'L', name: 'Philip Lombard', role: "l'aventurier", color: 'brique', look: { skin: 'hale', hair: 'court', hairColor: 'noir', outfit: 'chemise', extras: ['cicatrice'] } }),
      femme({ id: 'B', name: 'Emily Brent', role: 'la vieille fille', color: 'prune', look: { skin: 'rose', hair: 'chignon', hairColor: 'gris', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'A', name: 'Dr Armstrong', role: 'le médecin', color: 'sapin', look: { skin: 'clair', hair: 'court', hairColor: 'chatain', outfit: 'costume', extras: ['lunettes'] } }),
      homme({ id: 'O', name: 'Blore', role: "l'ancien policier", color: 'ocre', look: { skin: 'hale', hair: 'court', hairColor: 'brun', hat: 'melon', outfit: 'manteau', extras: ['moustache'] } }),
      homme({ id: 'G', name: 'Général Macarthur', role: 'le vieux soldat', color: 'rose', look: { skin: 'rose', hair: 'degarni', hairColor: 'gris', outfit: 'uniforme', extras: ['moustache-ciree'] } }),
      homme({ id: 'V', name: 'Anthony Marston', role: 'le jeune fêtard, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'costume' } }),
    ],
    culprit: 'W', crimeRoom: 'S',
    verdict: "Le juge Wargrave était seul avec Marston dans le salon. Le plus respectable des invités avait écrit toute la comptine, et réservé à chacun son couplet.",
  },
  {
    id: 'christie-presbytere', collection: 'Agatha Christie', title: 'Meurtre au presbytère', theme: 'Village anglais',
    floor: 'Le presbytère de St Mary Mead', size: 6, ambiance: 'jour', variants: ['facile', 'moyen'],
    intro: "St Mary Mead, 1930. Le colonel Protheroe, que tout le village détestait, est retrouvé abattu dans le bureau du pasteur. Miss Marple, la voisine, a tout vu de son jardin. Ou presque.",
    rooms: [
      { id: 'J', name: 'Jardin', material: 'herbe', in: 'dans le jardin' },
      { id: 'A', name: 'Atelier', material: 'planches', in: "dans l'atelier du peintre" },
      { id: 'S', name: 'Salon', material: 'tapis', in: 'dans le salon' },
      { id: 'B', name: 'Bureau du pasteur', material: 'parquet', in: 'dans le bureau du pasteur' },
      { id: 'K', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
    ],
    layout: ['JJJJAA', 'JJJJAA', 'SSBBBA', 'SSBBBK', 'SSKKKK', 'SSKKKK'],
    furniture: [M('plante', [0, 1]), M('banc', [1, 2]), M('plante', [0, 3]), M('table', [0, 5]), M('tabouret', [1, 4]), M('bureau', [2, 3]), M('fauteuil', [3, 2]), M('etagere', [2, 4]),
      M('canape', [2, 0]), M('fauteuil', [4, 1]), M('cheminee', [5, 0]), M('fourneau', [5, 5]), M('table', [4, 3]), M('chaise', [5, 3])],
    persons: [
      homme({ id: 'L', name: 'Redding', role: 'le peintre', color: 'brique', look: { skin: 'hale', hair: 'boucle', hairColor: 'brun', outfit: 'chemise' } }),
      femme({ id: 'A', name: 'Anne Protheroe', role: "l'épouse du colonel", color: 'prune', look: { skin: 'clair', hair: 'chignon', hairColor: 'chatain', hat: 'bibi', outfit: 'robe', extras: ['collier'] } }),
      femme({ id: 'T', name: 'Lettice', role: 'la fille du colonel', color: 'rose', look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe', extras: ['ruban'] } }),
      homme({ id: 'C', name: 'Clement', role: 'le pasteur', color: 'ardoise', look: { skin: 'rose', hair: 'degarni', hairColor: 'gris', outfit: 'soutane', extras: ['lunettes'] } }),
      femme({ id: 'G', name: 'Griselda', role: 'la femme du pasteur', color: 'sapin', look: { skin: 'rose', hair: 'boucle', hairColor: 'noir', outfit: 'robe' } }),
      homme({ id: 'V', name: 'Protheroe', role: 'le juge de paix, victime', color: 'victime', victim: true, look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'costume', extras: ['moustache'] } }),
    ],
    culprit: 'L', crimeRoom: 'B',
    verdict: "Lawrence Redding était seul avec le colonel dans le bureau du pasteur. L'horloge avancée, le coup de feu entendu trop tard : tout était de sa main. Miss Marple, elle, n'avait jamais cru aux aveux d'Anne.",
  },

  // ------------------------------------------------------------ Le Trône de fer
  {
    id: 'westeros-pourpres', collection: 'Le Trône de fer', title: 'Les Noces pourpres', theme: 'Port-Réal',
    floor: 'Le Donjon Rouge', size: 7, ambiance: 'jour', variants: ['moyen', 'difficile'],
    intro: "Port-Réal. Au banquet de ses noces, le roi Joffrey Baratheon s'effondre, le visage pourpre, la coupe encore à la main. Cersei accuse aussitôt Tyrion. Avant que le procès ne commence, reconstituez la salle.",
    rooms: [
      { id: 'J', name: 'Jardins', material: 'herbe', in: 'dans les jardins' },
      { id: 'G', name: 'Grande salle', material: 'pierre', in: 'dans la grande salle' },
      { id: 'T', name: 'Salle du trône', material: 'tapis', in: 'dans la salle du trône' },
      { id: 'K', name: 'Cuisines', material: 'carrelage', in: 'dans les cuisines' },
      { id: 'C', name: 'Septuaire', material: 'marbre', in: 'au septuaire' },
    ],
    layout: ['JJJGGGG', 'JJJGGGG', 'JJGGGGG', 'TTTGGKK', 'TTTGGKK', 'TTTCCKK', 'TTCCCKK'],
    furniture: [M('plante', [0, 1]), M('banc', [1, 1]), M('fontaine', [2, 0]), M('table', [1, 4], [1, 5]), M('trone', [0, 4]), M('banc', [2, 5]), M('tonneau', [0, 6]),
      M('trone', [3, 1]), M('armure', [5, 0]), M('fourneau', [6, 6]), M('tonneau', [4, 6]), M('tabouret', [3, 5]), M('statue', [6, 3]), M('banc', [5, 4])],
    persons: [
      femme({ id: 'O', name: 'Olenna Tyrell', role: 'la Reine des Épines', color: 'sapin', look: { skin: 'rose', hair: 'chignon', hairColor: 'blanc', hat: 'voile', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'T', name: 'Tyrion', role: 'le Lutin', color: 'brique', look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'pourpoint', extras: ['cicatrice'] } }),
      femme({ id: 'S', name: 'Sansa', role: 'la louve captive', color: 'canard', look: { skin: 'clair', hair: 'long', hairColor: 'roux', outfit: 'robe', extras: ['collier'] } }),
      femme({ id: 'C', name: 'Cersei', role: 'la reine mère', color: 'ocre', look: { skin: 'clair', hair: 'long', hairColor: 'blond', hat: 'couronne', outfit: 'robe' } }),
      femme({ id: 'M', name: 'Margaery', role: 'la jeune mariée', color: 'rose', look: { skin: 'hale', hair: 'long', hairColor: 'chatain', hat: 'couronne', outfit: 'robe', extras: ['boucles'] } }),
      homme({ id: 'P', name: 'Littlefinger', role: 'le grand argentier', color: 'ardoise', look: { skin: 'mat', hair: 'court', hairColor: 'noir', outfit: 'pourpoint', extras: ['barbe'] } }),
      homme({ id: 'V', name: 'Joffrey', role: 'le roi, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'court', hairColor: 'blond', hat: 'couronne', outfit: 'fourrure' } }),
    ],
    culprit: 'O', crimeRoom: 'G',
    verdict: "Olenna Tyrell était seule avec Joffrey dans la grande salle. Le poison dormait dans le collier de Sansa ; la Reine des Épines n'allait pas laisser sa petite-fille épouser ce monstre.",
  },
  {
    id: 'westeros-rouges', collection: 'Le Trône de fer', title: 'Les Noces rouges', theme: 'Les Jumeaux',
    floor: 'Le château des Jumeaux', size: 7, ambiance: 'bougie', variants: ['difficile'],
    intro: "Les Jumeaux. Lord Walder Frey marie sa fille à Edmure Tully, et le Roi du Nord est invité. Le vin coule, les musiciens jouent Les Pluies de Castamere. Au matin, Robb Stark gît mort dans le château.",
    rooms: [
      { id: 'E', name: 'Campement', material: 'herbe', in: 'au campement' },
      { id: 'C', name: 'Cour', material: 'pave', in: 'dans la cour' },
      { id: 'G', name: 'Grande salle', material: 'pierre', in: 'dans la grande salle' },
      { id: 'K', name: 'Cuisines', material: 'carrelage', in: 'dans les cuisines' },
      { id: 'T', name: 'Tour', material: 'planches', in: 'dans la tour' },
    ],
    layout: ['EEECCCC', 'EEECCCC', 'EEGGGGT', 'KKGGGGT', 'KKGGGGT', 'KKKGGTT', 'KKKKTTT'],
    furniture: [M('tonneau', [0, 1]), M('coffre', [1, 0]), M('statue', [0, 5]), M('tonneau', [1, 6]), M('table', [3, 3], [3, 4]), M('banc', [4, 2]), M('trone', [2, 5]),
      M('fourneau', [6, 0]), M('comptoir', [4, 1]), M('tabouret', [5, 2]), M('lit', [6, 6]), M('coffre', [4, 6])],
    persons: [
      homme({ id: 'B', name: 'Bolton', role: "le seigneur de Fort-Terreur", color: 'ardoise', look: { skin: 'clair', hair: 'court', hairColor: 'noir', outfit: 'armure' } }),
      femme({ id: 'C', name: 'Catelyn', role: 'la mère du roi', color: 'canard', look: { skin: 'clair', hair: 'long', hairColor: 'roux', outfit: 'robe' } }),
      homme({ id: 'W', name: 'Walder Frey', role: "le seigneur des Jumeaux", color: 'ocre', look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', hat: 'capuche', outfit: 'fourrure', extras: ['barbe'] } }),
      homme({ id: 'E', name: 'Edmure Tully', role: 'le marié', color: 'sapin', look: { skin: 'hale', hair: 'court', hairColor: 'roux', outfit: 'pourpoint', extras: ['barbe'] } }),
      femme({ id: 'T', name: 'Talisa', role: "l'épouse du roi", color: 'rose', look: { skin: 'mat', hair: 'long', hairColor: 'noir', outfit: 'robe' } }),
      homme({ id: 'L', name: 'Lothar Frey', role: 'le fils boiteux', color: 'brique', look: { skin: 'rose', hair: 'degarni', hairColor: 'chatain', outfit: 'tunique' } }),
      homme({ id: 'V', name: 'Robb', role: 'le Roi du Nord, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'boucle', hairColor: 'chatain', hat: 'couronne', outfit: 'fourrure', extras: ['barbe'] } }),
    ],
    culprit: 'B', crimeRoom: 'G',
    verdict: "Roose Bolton était seul avec Robb dans la grande salle. « Les Lannister vous saluent. »",
  },

  // ------------------------------------------------------------ Grands classiques
  {
    id: 'leroux-chambre-jaune', collection: 'Grands classiques', title: 'Le Mystère de la chambre jaune', theme: 'Château du Glandier',
    floor: 'Le pavillon du Glandier', size: 6, ambiance: 'nuit', variants: ['facile', 'moyen'],
    intro: "Château du Glandier, 1892. Un cri dans la nuit : la porte de la chambre jaune est fermée à clé de l'intérieur, et pourtant Mathilde Stangerson y est retrouvée assassinée. Le jeune reporter Joseph Rouletabille prend l'affaire.",
    rooms: [
      { id: 'J', name: 'Le parc', material: 'herbe', in: 'dans le parc' },
      { id: 'L', name: 'Laboratoire', material: 'carrelage', in: 'dans le laboratoire' },
      { id: 'V', name: 'Vestibule', material: 'pierre', in: 'dans le vestibule' },
      { id: 'Y', name: 'Chambre jaune', material: 'jaune', in: 'dans la chambre jaune' },
      { id: 'P', name: 'Pavillon du garde', material: 'planches', in: 'dans le pavillon du garde' },
    ],
    layout: ['JJJJJJ', 'JJLLLJ', 'VVLLLY', 'VVLLYY', 'VVVYYY', 'PPPYYY'],
    furniture: [M('plante', [0, 0]), M('plante', [0, 4]), M('banc', [1, 1]), M('table', [1, 3]), M('etagere', [2, 2]), M('tabouret', [3, 3]), M('armoire', [4, 0]), M('banc', [2, 1]),
      M('lit', [5, 5]), M('bureau', [3, 4]), M('lit', [5, 0]), M('tonneau', [5, 2])],
    persons: [
      homme({ id: 'L', name: 'Frédéric Larsan', role: 'le policier', color: 'ardoise', look: { skin: 'hale', hair: 'court', hairColor: 'brun', hat: 'melon', outfit: 'manteau', extras: ['moustache'] } }),
      homme({ id: 'S', name: 'Professeur Stangerson', role: 'le savant', color: 'sapin', look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'costume', extras: ['barbe', 'lunettes'] } }),
      homme({ id: 'J', name: 'Jacques', role: 'le vieux domestique', color: 'ocre', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', hat: 'casquette', outfit: 'tablier', extras: ['moustache'] } }),
      homme({ id: 'D', name: 'Robert Darzac', role: 'le fiancé', color: 'canard', look: { skin: 'clair', hair: 'court', hairColor: 'noir', outfit: 'costume', extras: ['barbe'] } }),
      femme({ id: 'B', name: 'Bernier', role: 'la concierge', color: 'brique', look: { skin: 'rose', hair: 'chignon', hairColor: 'gris', outfit: 'tablier' } }),
      femme({ id: 'V', name: 'Mathilde', role: 'la fille du savant, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'long', hairColor: 'brun', outfit: 'robe' } }),
    ],
    culprit: 'L', crimeRoom: 'Y',
    verdict: "Frédéric Larsan était seul avec Mathilde dans la chambre jaune. Le grand policier n'était autre que Ballmeyer, l'ancien mari qu'elle fuyait. Il enquêtait sur son propre crime.",
  },
  {
    id: 'shakespeare-macbeth', collection: 'Grands classiques', title: 'Macbeth', theme: 'Écosse',
    floor: "Le château d'Inverness", size: 7, ambiance: 'bougie', variants: ['moyen', 'difficile'],
    intro: "Écosse, château d'Inverness. Le roi Duncan passe la nuit chez son fidèle Macbeth. Au matin, le portier ouvre aux nobles : le roi est mort dans sa chambre, ses gardes couverts de sang et ivres morts.",
    rooms: [
      { id: 'R', name: 'Remparts', material: 'pave', in: 'sur les remparts' },
      { id: 'G', name: 'Grande salle', material: 'pierre', in: 'dans la grande salle' },
      { id: 'K', name: 'Cuisines', material: 'carrelage', in: 'dans les cuisines' },
      { id: 'C', name: 'Chambre du roi', material: 'tapis', in: 'dans la chambre du roi' },
      { id: 'O', name: 'Cour', material: 'herbe', in: 'dans la cour' },
    ],
    layout: ['RRRRRRR', 'RGGGGGR', 'RGGGGGR', 'KKKCCCR', 'KKKCCCC', 'KKOOOCC', 'OOOOOOO'],
    furniture: [M('statue', [0, 3]), M('trone', [1, 3]), M('table', [2, 2], [2, 3]), M('banc', [2, 5]), M('cheminee', [1, 5]), M('lit', [4, 5]), M('coffre', [3, 3]),
      M('fourneau', [5, 0]), M('tonneau', [3, 1]), M('tabouret', [4, 2]), M('plante', [6, 1]), M('fontaine', [6, 5])],
    persons: [
      homme({ id: 'M', name: 'Macbeth', role: 'le seigneur de Glamis', color: 'brique', look: { skin: 'hale', hair: 'court', hairColor: 'brun', outfit: 'armure', extras: ['barbe'] } }),
      femme({ id: 'L', name: 'Lady Macbeth', role: 'son épouse', color: 'prune', look: { skin: 'clair', hair: 'long', hairColor: 'noir', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'B', name: 'Banquo', role: 'le compagnon d\'armes', color: 'sapin', look: { skin: 'rose', hair: 'court', hairColor: 'roux', outfit: 'pourpoint', extras: ['barbe'] } }),
      homme({ id: 'A', name: 'Fleance', role: 'le fils de Banquo', color: 'canard', look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'tunique' } }),
      homme({ id: 'D', name: 'Ross', role: 'le seigneur', color: 'ocre', look: { skin: 'clair', hair: 'boucle', hairColor: 'blond', outfit: 'pourpoint' } }),
      homme({ id: 'P', name: 'Seyton', role: 'le serviteur', color: 'ardoise', look: { skin: 'rose', hair: 'degarni', hairColor: 'chatain', hat: 'capuche', outfit: 'tablier' } }),
      homme({ id: 'V', name: 'Duncan', role: "le roi d'Écosse, victime", color: 'victime', victim: true, look: { skin: 'rose', hair: 'long', hairColor: 'blanc', hat: 'couronne', outfit: 'fourrure', extras: ['barbe'] } }),
    ],
    culprit: 'M', crimeRoom: 'C',
    verdict: "Macbeth était seul avec Duncan dans sa chambre. Les sorcières le lui avaient prédit : il serait roi. « Tous les parfums d'Arabie ne purifieront pas cette petite main », soupirera bientôt sa femme.",
  },
  {
    id: 'shakespeare-hamlet', collection: 'Grands classiques', title: 'Hamlet', theme: 'Danemark',
    floor: "Le château d'Elseneur", size: 6, ambiance: 'soir', variants: ['facile'],
    intro: "Elseneur, Danemark. Le prince Hamlet joue la folie depuis que le spectre de son père lui est apparu. Ce soir, on a retrouvé le vieux Polonius mort, poignardé à travers une tapisserie.",
    rooms: [
      { id: 'R', name: 'Remparts', material: 'neige', in: 'sur les remparts' },
      { id: 'G', name: 'Grande salle', material: 'pierre', in: 'dans la grande salle' },
      { id: 'Q', name: 'Chambre de la reine', material: 'velours', in: 'dans la chambre de la reine' },
      { id: 'C', name: 'Chapelle', material: 'marbre', in: 'dans la chapelle' },
    ],
    layout: ['RRRRRR', 'RRGGGG', 'QQGGGG', 'QQGGCC', 'QQQGCC', 'QQQCCC'],
    furniture: [M('armure', [0, 3]), M('trone', [1, 4]), M('table', [2, 3]), M('banc', [3, 2]), M('lit', [5, 0]), M('armoire', [2, 0]), M('tapis', [3, 1]), M('banc', [4, 4]), M('statue', [5, 5])],
    persons: [
      homme({ id: 'H', name: 'Hamlet', role: 'le prince', color: 'ardoise', look: { skin: 'clair', hair: 'court', hairColor: 'noir', outfit: 'pourpoint' } }),
      femme({ id: 'G', name: 'Gertrude', role: 'la reine', color: 'prune', look: { skin: 'rose', hair: 'chignon', hairColor: 'blond', hat: 'couronne', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'C', name: 'Claudius', role: 'le roi', color: 'brique', look: { skin: 'hale', hair: 'court', hairColor: 'brun', hat: 'couronne', outfit: 'fourrure', extras: ['barbe'] } }),
      femme({ id: 'O', name: 'Ophélie', role: 'la fille de Polonius', color: 'canard', look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe', extras: ['ruban'] } }),
      homme({ id: 'R', name: 'Laërte', role: 'le fils de Polonius', color: 'sapin', look: { skin: 'hale', hair: 'court', hairColor: 'chatain', outfit: 'pourpoint' } }),
      homme({ id: 'V', name: 'Polonius', role: 'le chambellan, victime', color: 'victime', victim: true, look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'pourpoint', extras: ['barbe'] } }),
    ],
    culprit: 'H', crimeRoom: 'Q',
    verdict: "Hamlet était seul avec Polonius dans la chambre de la reine. Il avait frappé à travers la tapisserie en criant : « Un rat ! » Il croyait tuer le roi.",
  },
];

// ------------------------------------------------------------ Chapitres
// Deux difficultés d'une même histoire = deux chapitres qui se suivent : le
// coupable du premier est sous les verrous, sa victime enterrée ; une autre
// personne meurt, un autre coupable, une autre pièce. Le décor reste.

/**
 * Le chapitre suivant d'une histoire.
 * @param {any} h l'histoire @param {{ sousTitre: string, retire: string[], victime: string, role: string,
 *   ajoute: any[], culprit: string, crimeRoom: string, intro: string, verdict: string }} c
 */
function suite(h, c) {
  const persons = h.persons.filter((/** @type {any} */ p) => !p.victim && !c.retire.includes(p.id) && p.id !== c.victime);
  const v = h.persons.find((/** @type {any} */ p) => p.id === c.victime);
  const victime = { ...(v ?? c.ajoute.find((p) => p.id === c.victime)), role: c.role, color: 'victime', victim: true };
  return {
    sousTitre: c.sousTitre, intro: c.intro, culprit: c.culprit, crimeRoom: c.crimeRoom, verdict: c.verdict,
    persons: [...persons, ...c.ajoute.filter((p) => p.id !== c.victime), victime],
  };
}

/** @type {Record<string, (h: any) => Record<string, object>>} */
const CHAPITRES = {
  'holmes-221b': (h) => ({ moyen: suite(h, {
    sousTitre: "L'ombre du colonel", retire: ['I'], victime: 'Y', role: 'le jeune joueur de cartes, victime', culprit: 'R', crimeRoom: 'B',
    ajoute: [
      homme({ id: 'F', name: 'Billy', role: 'le jeune groom', color: 'prune', look: { skin: 'clair', hair: 'court', hairColor: 'roux', hat: 'casquette', outfit: 'livree' } }),
      homme({ id: 'Y', name: 'Ronald Adair', look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'costume' } }),
    ],
    intro: "Londres, quelques mois plus tard. Irene Adler a quitté l'Angleterre et Milverton repose en paix. Le jeune Ronald Adair, venu supplier Holmes de l'aider, est retrouvé mort au 221B, une balle de fusil à air comprimé dans la tête.",
    verdict: "Le colonel Moran était seul avec Ronald Adair dans le cabinet de travail. Le jeune homme l'avait vu tricher aux cartes ; le meilleur tireur de l'Empire ne laisse jamais de témoin.",
  }) }),
  'holmes-baskerville': (h) => ({ difficile: suite(h, {
    sousTitre: 'La dame de Coombe Tracey', retire: ['J'], victime: 'Y', role: 'la dactylographe, victime', culprit: 'B', crimeRoom: 'S',
    ajoute: [
      homme({ id: 'F', name: 'Frankland', role: 'le voisin procédurier', color: 'sapin', look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'manteau', extras: ['moustache'] } }),
      femme({ id: 'Y', name: 'Laura Lyons', look: { skin: 'clair', hair: 'boucle', hairColor: 'chatain', outfit: 'robe' } }),
    ],
    intro: "Baskerville Hall, une semaine après la mort du chien. Stapleton attend son procès. Laura Lyons, qui devait témoigner contre lui, est retrouvée morte au manoir, la veille de l'audience.",
    verdict: "Miss Stapleton était seule avec Laura Lyons dans la serre. Laura allait révéler au procès qu'elle n'était pas la sœur du naturaliste, mais sa femme. Beryl Stapleton ne voulait pas tomber avec lui.",
  }) }),
  'poirot-orient-express': (h) => ({ difficile: suite(h, {
    sousTitre: 'La deuxième nuit', retire: ['Q'], victime: 'Y', role: 'la femme de chambre, victime', culprit: 'A', crimeRoom: 'F',
    ajoute: [
      homme({ id: 'N', name: 'Foscarelli', role: 'le vendeur de voitures', color: 'canard', look: { skin: 'clair', hair: 'court', hairColor: 'noir', outfit: 'costume', extras: ['moustache'] } }),
      femme({ id: 'Y', name: 'Hildegarde Schmidt', look: { skin: 'rose', hair: 'chignon', hairColor: 'blond', outfit: 'tablier' } }),
    ],
    intro: "Toujours la neige. MacQueen est enfermé dans le fourgon à bagages, sous la garde du contrôleur. La deuxième nuit, Hildegarde Schmidt, la femme de chambre de la princesse, ne se réveille pas.",
    verdict: "Arbuthnot était seul avec Hildegarde Schmidt dans le fourgon. La femme de chambre l'avait reconnu : un ami du colonel Armstrong. Elle aurait parlé avant la frontière.",
  }) }),
  'poirot-nil': (h) => ({ moyen: suite(h, {
    sousTitre: 'Le témoin du pont', retire: ['J'], victime: 'O', role: 'la romancière, victime', culprit: 'S', crimeRoom: 'P',
    ajoute: [
      femme({ id: 'L', name: 'Louise Bourget', role: 'la femme de chambre', color: 'rose', look: { skin: 'clair', hair: 'chignon', hairColor: 'noir', outfit: 'tablier' } }),
      homme({ id: 'N', name: 'Andrew Pennington', role: "l'homme d'affaires", color: 'brique', look: { skin: 'rose', hair: 'degarni', hairColor: 'gris', outfit: 'costume', extras: ['lunettes'] } }),
    ],
    intro: "Le Karnak remonte le Nil. Jacqueline est aux arrêts dans sa cabine. Mrs Otterbourne annonce à tout le salon qu'elle sait qui elle a vu cette nuit-là. Une heure plus tard, elle est morte.",
    verdict: "Simon Doyle était seul avec Mrs Otterbourne sur le pont avant. La romancière l'avait vu sortir de la cabine de Linnet, sur ses deux jambes : la blessure du salon était une comédie.",
  }) }),
  'christie-presbytere': (h) => ({ moyen: suite(h, {
    sousTitre: 'Le dernier témoin', retire: ['L'], victime: 'Y', role: "l'archéologue, victime", culprit: 'A', crimeRoom: 'A',
    ajoute: [
      femme({ id: 'K', name: 'Mrs Price Ridley', role: 'la commère du village', color: 'brique', look: { skin: 'rose', hair: 'boucle', hairColor: 'gris', hat: 'bibi', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'Y', name: 'Dr Stone', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', outfit: 'chemise', extras: ['lunettes', 'barbe'] } }),
    ],
    intro: "St Mary Mead, un mois plus tard. Lawrence Redding attend d'être jugé. Le Dr Stone, l'archéologue qui fouillait le tumulus, est retrouvé mort au presbytère le jour même où il devait parler à l'inspecteur.",
    verdict: "Anne Protheroe était seule avec le Dr Stone dans l'atelier. L'archéologue l'avait vue rejoindre Lawrence le soir du crime ; pour sauver son amant, elle a fait taire le dernier témoin.",
  }) }),
  'westeros-pourpres': (h) => ({ difficile: suite(h, {
    sousTitre: 'La leçon de la louve', retire: ['O'], victime: 'P', role: 'le grand argentier, victime', culprit: 'S', crimeRoom: 'T',
    ajoute: [
      homme({ id: 'A', name: 'Varys', role: "l'Araignée", color: 'ardoise', look: { skin: 'clair', hair: 'aucun', hairColor: 'gris', outfit: 'pourpoint' } }),
      homme({ id: 'J', name: 'Jaime', role: 'le Régicide', color: 'sapin', look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'armure' } }),
    ],
    intro: "Port-Réal, une lune plus tard. Olenna Tyrell croupit dans les cachots du Donjon Rouge. Au petit matin, on retrouve Littlefinger mort, une dague de Valyrie plantée dans le cœur.",
    verdict: "Sansa était seule avec Littlefinger dans la salle du trône. Il lui avait tout appris : le mensonge, la patience, et qu'il ne faut jamais tourner le dos à une Stark.",
  }) }),
  'leroux-chambre-jaune': (h) => ({ moyen: suite(h, {
    sousTitre: 'La Bête du Bon Dieu', retire: ['L'], victime: 'Y', role: "l'Américain, victime", culprit: 'B', crimeRoom: 'L',
    ajoute: [
      femme({ id: 'G', name: 'Mère Agenoux', role: 'la vieille du bois', color: 'ardoise', look: { skin: 'hale', hair: 'long', hairColor: 'blanc', hat: 'capuche', outfit: 'tablier' } }),
      homme({ id: 'Y', name: 'Arthur Rance', look: { skin: 'clair', hair: 'court', hairColor: 'roux', outfit: 'costume', extras: ['moustache'] } }),
    ],
    intro: "Le Glandier, l'hiver suivant. Larsan est en prison et Mathilde repose au cimetière du village. Arthur Rance, un Américain ami du professeur, est retrouvé mort au pavillon, le crâne fendu.",
    verdict: "Bernier était seule avec Arthur Rance dans le laboratoire. La concierge braconnait dans le parc depuis des années ; l'Américain l'avait surprise et voulait tout dire au professeur.",
  }) }),
  'shakespeare-macbeth': (h) => ({ difficile: suite(h, {
    sousTitre: 'Le dernier ordre', retire: ['M'], victime: 'B', role: "le compagnon d'armes, victime", culprit: 'P', crimeRoom: 'O',
    ajoute: [
      homme({ id: 'F', name: 'Macduff', role: 'le seigneur de Fife', color: 'brique', look: { skin: 'rose', hair: 'long', hairColor: 'noir', outfit: 'armure', extras: ['barbe'] } }),
      homme({ id: 'N', name: 'Angus', role: 'le thane', color: 'sapin', look: { skin: 'clair', hair: 'boucle', hairColor: 'chatain', outfit: 'pourpoint' } }),
    ],
    intro: "Inverness, après le couronnement de Malcolm, le fils de Duncan. Macbeth est enchaîné dans les cachots. Au matin, Banquo est retrouvé mort, et l'on dit que Lady Macbeth n'a pas dormi de la nuit.",
    verdict: "Seyton était seul avec Banquo dans la cour. Lady Macbeth lui avait donné un dernier ordre : les sorcières avaient promis le trône aux fils de Banquo, et elle ne le supportait pas.",
  }) }),
};
for (const h of HISTOIRES) if (CHAPITRES[h.id]) h.chapitres = CHAPITRES[h.id](h);

// ------------------------------------------------------------ Cluedo, Benoit Blanc
HISTOIRES.push(
  {
    id: 'cluedo-tudor', collection: 'Cluedo', title: 'Meurtre au manoir Tudor', theme: 'Le manoir Tudor',
    floor: 'Le manoir Tudor', size: 7, ambiance: 'orage', variants: ['moyen', 'difficile'],
    intro: "Un soir d'orage, le Docteur Lenoir réunit ses invités au manoir Tudor pour leur lire son nouveau testament. Les plombs sautent. Quand la lumière revient, le docteur gît mort. Six suspects, six pièces : à vous.",
    rooms: [
      { id: 'K', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
      { id: 'B', name: 'Salle de bal', material: 'parquet', in: 'dans la salle de bal' },
      { id: 'V', name: 'Véranda', material: 'tomettes', in: 'dans la véranda' },
      { id: 'L', name: 'Bibliothèque', material: 'tapis', in: 'dans la bibliothèque' },
      { id: 'S', name: 'Salon', material: 'velours', in: 'dans le salon' },
      { id: 'H', name: 'Hall', material: 'marbre', in: 'dans le hall' },
    ],
    layout: ['KKKBBBB', 'KKKBBBB', 'KKHHBVV', 'LLHHHVV', 'LLHHHVV', 'LLLSSSS', 'LLLSSSS'],
    furniture: [M('fourneau', [0, 0]), M('table', [1, 1]), M('piano', [0, 5]), M('chaise', [1, 3]), M('plante', [2, 6]), M('banquette', [4, 6]),
      M('etagere', [3, 0]), M('fauteuil', [5, 1]), M('cheminee', [6, 2]), M('canape', [6, 4]), M('fauteuil', [5, 6]), M('statue', [3, 3])],
    persons: [
      homme({ id: 'M', name: 'Colonel Moutarde', role: "l'ancien militaire", color: 'ocre', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', outfit: 'uniforme', extras: ['moustache-ciree'] } }),
      femme({ id: 'R', name: 'Mademoiselle Rose', role: 'la jeune actrice', color: 'rose', look: { skin: 'clair', hair: 'long', hairColor: 'noir', outfit: 'robe', extras: ['collier', 'boucles'] } }),
      femme({ id: 'P', name: 'Madame Pervenche', role: 'la veuve mondaine', color: 'canard', look: { skin: 'rose', hair: 'chignon', hairColor: 'gris', hat: 'bibi', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'O', name: 'Révérend Olive', role: "l'homme d'Église", color: 'sapin', look: { skin: 'clair', hair: 'court', hairColor: 'chatain', outfit: 'soutane', extras: ['lunettes'] } }),
      homme({ id: 'I', name: 'Professeur Violet', role: 'le savant', color: 'prune', look: { skin: 'rose', hair: 'boucle', hairColor: 'brun', outfit: 'costume', extras: ['noeud', 'lunettes'] } }),
      femme({ id: 'L', name: 'Madame Leblanc', role: 'la gouvernante', color: 'ardoise', look: { skin: 'rose', hair: 'chignon', hairColor: 'blanc', outfit: 'tablier' } }),
      homme({ id: 'V', name: 'Docteur Lenoir', role: 'le maître des lieux, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'degarni', hairColor: 'noir', outfit: 'costume', extras: ['moustache'] } }),
    ],
    culprit: 'P', crimeRoom: 'L',
    verdict: "Madame Pervenche était seule avec le Docteur Lenoir dans la bibliothèque, avec le chandelier. Le docteur comptait la rayer de son testament le lendemain matin.",
  },
  {
    id: 'blanc-couteaux', collection: 'Benoit Blanc', title: 'À couteaux tirés', theme: 'Le manoir Thrombey',
    floor: 'Le manoir Thrombey', size: 7, ambiance: 'soir', variants: ['moyen'],
    intro: "Massachusetts. Au lendemain de ses 85 ans, le célèbre auteur de romans policiers Harlan Thrombey est retrouvé mort dans son manoir. Toute la famille était là. Le détective Benoit Blanc, payé par on ne sait qui, s'installe au piano.",
    rooms: [
      { id: 'B', name: 'Bureau du grenier', material: 'parquet', in: 'dans le bureau du grenier' },
      { id: 'S', name: 'Salon', material: 'tapis', in: 'dans le salon' },
      { id: 'K', name: 'Cuisine', material: 'carrelage', in: 'dans la cuisine' },
      { id: 'J', name: 'Jardin', material: 'herbe', in: 'dans le jardin' },
      { id: 'E', name: 'Escalier', material: 'planches', in: "dans l'escalier" },
    ],
    layout: ['BBBEESS', 'BBBEESS', 'BBEESSS', 'KKEESSS', 'KKKJJJS', 'KKKJJJJ', 'KKKJJJJ'],
    furniture: [M('bureau', [0, 0]), M('etagere', [1, 1]), M('fauteuil', [2, 1]), M('piano', [0, 6]), M('canape', [2, 5]), M('fauteuil', [3, 6]),
      M('fourneau', [6, 0]), M('table', [4, 1]), M('chaise', [5, 2]), M('fontaine', [5, 5]), M('banc', [6, 4]), M('statue', [1, 3])],
    persons: [
      homme({ id: 'R', name: 'Ransom Drysdale', role: 'le petit-fils', color: 'brique', look: { skin: 'clair', hair: 'court', hairColor: 'chatain', outfit: 'manteau' } }),
      femme({ id: 'M', name: 'Marta Cabrera', role: "l'infirmière", color: 'canard', look: { skin: 'mat', hair: 'long', hairColor: 'brun', outfit: 'chemise' } }),
      femme({ id: 'L', name: 'Linda Drysdale', role: 'la fille aînée', color: 'prune', look: { skin: 'clair', hair: 'court', hairColor: 'blond', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'W', name: 'Walt Thrombey', role: "l'éditeur", color: 'ardoise', look: { skin: 'clair', hair: 'court', hairColor: 'brun', outfit: 'costume', extras: ['lunettes'] } }),
      femme({ id: 'J', name: 'Joni Thrombey', role: 'la belle-fille', color: 'rose', look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe', extras: ['boucles'] } }),
      femme({ id: 'F', name: 'Fran', role: 'la gouvernante', color: 'sapin', look: { skin: 'hale', hair: 'chignon', hairColor: 'chatain', outfit: 'tablier' } }),
      homme({ id: 'V', name: 'Harlan Thrombey', role: "l'auteur de romans policiers, victime", color: 'victime', victim: true, look: { skin: 'rose', hair: 'degarni', hairColor: 'blanc', outfit: 'costume', extras: ['barbe'] } }),
    ],
    culprit: 'R', crimeRoom: 'B',
    verdict: "Ransom Drysdale était seul avec Harlan dans le bureau du grenier. Déshérité le soir même, il avait échangé les flacons de Marta. Benoit Blanc l'avait vu dès le début : le trou au milieu du beignet.",
  },
  {
    id: 'blanc-glass-onion', collection: 'Benoit Blanc', title: 'Glass Onion', theme: 'Une île grecque',
    floor: 'La villa de Miles Bron', size: 7, ambiance: 'jour', variants: ['difficile'],
    intro: "Une île privée en Grèce. Le milliardaire Miles Bron invite ses vieux amis à un jeu de meurtre pour le week-end. Avant même le début du jeu, Duke Cody s'effondre, empoisonné. Benoit Blanc n'a plus du tout envie de jouer.",
    rooms: [
      { id: 'G', name: 'Glass Onion', material: 'marbre', in: 'sous le dôme de verre' },
      { id: 'P', name: 'Piscine', material: 'carrelage', in: 'au bord de la piscine' },
      { id: 'S', name: 'Salon', material: 'tapis', in: 'dans le salon' },
      { id: 'K', name: 'Cuisine', material: 'tomettes', in: 'dans la cuisine' },
      { id: 'J', name: 'Jardin', material: 'herbe', in: 'dans le jardin' },
    ],
    layout: ['JJJGGGG', 'JJJGGGG', 'JJGGGPP', 'SSGGPPP', 'SSSKPPP', 'SSSKKKP', 'SSSKKKK'],
    furniture: [M('plante', [0, 0]), M('statue', [1, 2]), M('fontaine', [0, 5]), M('banquette', [1, 4]), M('transat', [3, 5]), M('transat', [4, 6]),
      M('canape', [4, 0]), M('fauteuil', [6, 1]), M('comptoir', [6, 5]), M('tabouret', [5, 4]), M('piano', [2, 4]), M('table', [3, 0])],
    persons: [
      homme({ id: 'B', name: 'Miles Bron', role: 'le milliardaire', color: 'ocre', look: { skin: 'clair', hair: 'court', hairColor: 'brun', outfit: 'chemise' } }),
      femme({ id: 'A', name: 'Helen Brand', role: 'la sœur jumelle', color: 'prune', look: { skin: 'brun', hair: 'boucle', hairColor: 'noir', outfit: 'robe' } }),
      femme({ id: 'R', name: 'Birdie Jay', role: 'la star de la mode', color: 'rose', look: { skin: 'clair', hair: 'long', hairColor: 'blond', outfit: 'robe', extras: ['boucles', 'collier'] } }),
      homme({ id: 'L', name: 'Lionel Toussaint', role: "l'ingénieur", color: 'canard', look: { skin: 'fonce', hair: 'degarni', hairColor: 'noir', outfit: 'chemise', extras: ['lunettes'] } }),
      femme({ id: 'C', name: 'Claire Debella', role: 'la gouverneure', color: 'ardoise', look: { skin: 'clair', hair: 'chignon', hairColor: 'chatain', outfit: 'costume' } }),
      femme({ id: 'W', name: 'Whiskey', role: 'la compagne de Duke', color: 'brique', look: { skin: 'hale', hair: 'long', hairColor: 'noir', outfit: 'robe', extras: ['boucles'] } }),
      homme({ id: 'V', name: 'Duke Cody', role: 'le streamer, victime', color: 'victime', victim: true, look: { skin: 'clair', hair: 'court', hairColor: 'brun', outfit: 'chemise', extras: ['barbe'] } }),
    ],
    culprit: 'B', crimeRoom: 'P',
    verdict: "Miles Bron était seul avec Duke Cody au bord de la piscine. Duke avait compris que Miles avait volé l'idée d'Andi. Un verre de jus d'ananas pour un allergique : un plan idiot, d'un homme idiot.",
  },
);

// Cluedo, chapitre 2 : Madame Pervenche est arrêtée, le Colonel Moutarde tombe.
{
  const h = /** @type {any} */ (HISTOIRES.find((x) => x.id === 'cluedo-tudor'));
  h.chapitres = { difficile: suite(h, {
    sousTitre: 'La revanche du professeur', retire: ['P'], victime: 'M', role: "l'ancien militaire, victime", culprit: 'I', crimeRoom: 'V',
    ajoute: [
      femme({ id: 'C', name: 'Madame Pêche', role: 'la voisine jardinière', color: 'canard', look: { skin: 'mat', hair: 'long', hairColor: 'noir', outfit: 'robe', extras: ['collier'] } }),
      homme({ id: 'B', name: 'Capitaine Brun', role: 'le marin', color: 'ocre', look: { skin: 'hale', hair: 'court', hairColor: 'noir', hat: 'casquette', outfit: 'manteau', extras: ['barbe'] } }),
    ],
    intro: "Le manoir Tudor, le soir des funérailles du Docteur Lenoir. Madame Pervenche a été emmenée par la police. Le tonnerre gronde encore quand le Colonel Moutarde est retrouvé mort, la corde au cou.",
    verdict: "Le Professeur Violet était seul avec le Colonel Moutarde dans la véranda, avec la corde. Le colonel avait découvert que le professeur avait falsifié les comptes du docteur pendant des années.",
  }) };
}

// ------------------------------------------------------------ Les invités de l'Arcade
// Deux jeux de l'Arcade en visite (demande de Julie, 2026-10-16) : les
// bestioles du chevalier (games/serpentin/) et les créatures du golfe du
// requin (games/toto/), dans LEURS décors, sans château ni humains : elle a
// refusé une première version avec des humains (« rester dans le même
// univers »). Portraits : ui/bete.js.
HISTOIRES.push(
  {
    id: 'invite-foret', collection: "Les invités de l'Arcade", title: "L'affaire du papillon", theme: 'La forêt du chevalier',
    floor: 'La forêt du chevalier', size: 6, ambiance: 'jour', variants: ['facile'],
    intro: "La forêt du chevalier, un matin de rosée. Le Papillon, qui volait de fleur en fleur, ne s'est jamais réveillé. Toute la forêt accuse la Reine des toiles. Le chevalier, lui, veut des preuves : il interroge les bestioles.",
    rooms: [
      { id: 'F', name: 'La forêt', material: 'mousse', in: 'dans la forêt' },
      { id: 'P', name: 'La prairie', material: 'herbe', in: 'dans la prairie' },
      { id: 'M', name: 'La mare', material: 'mare', in: 'dans la mare' },
      { id: 'G', name: 'La grotte', material: 'grotte', in: 'dans la grotte' },
      { id: 'N', name: 'Le nid de la reine', material: 'toile', in: 'dans le nid de la reine' },
    ],
    layout: ['FFFPPP', 'FFFPPP', 'FFMMPP', 'GGMMNN', 'GGGMNN', 'GGGNNN'],
    furniture: [M('champignon', [0, 0]), M('souche', [1, 1]), M('plante', [2, 0]), M('pissenlit', [0, 4]), M('pissenlit', [1, 5]),
      M('nenuphar', [2, 3]), M('nenuphar', [3, 2]), M('rocher', [3, 0]), M('champignon', [5, 1]), M('rocher', [4, 5])],
    persons: [
      homme({ id: 'E', name: "L'Escargot", role: 'le plus lent de la forêt', color: 'ocre', look: { espece: 'escargot' } }),
      homme({ id: 'L', name: 'Le Lucane', role: 'le gardien de la souche', color: 'brique', look: { espece: 'lucane' } }),
      femme({ id: 'R', name: 'La Reine des toiles', role: 'la maîtresse du nid', color: 'prune', look: { espece: 'araignee' } }),
      homme({ id: 'C', name: 'Le Crapaud', role: 'le roi de la mare', color: 'sapin', look: { espece: 'crapaud' } }),
      homme({ id: 'H', name: 'Le Hérisson', role: 'le piquant de la grotte', color: 'ardoise', look: { espece: 'herisson' } }),
      homme({ id: 'V', name: 'Le Papillon', role: 'le voyageur des fleurs, victime', color: 'victime', victim: true, look: { espece: 'papillon' } }),
    ],
    culprit: 'C', crimeRoom: 'P',
    verdict: "Le Crapaud était seul avec le Papillon dans la prairie. Tout le monde accusait la Reine des toiles ; mais c'est une langue collante, pas une toile, qui a attrapé le Papillon.",
  },
  {
    id: 'invite-recif', collection: "Les invités de l'Arcade", title: 'Mystère au large', theme: 'Le golfe du requin',
    floor: 'Le golfe du requin', size: 7, ambiance: 'jour', variants: ['difficile'],
    intro: "Le golfe, au petit matin. Vieux-Borgne, le vieux cachalot qui veillait sur le large, a été retrouvé mort, échoué contre les quais du port. Toute la plage accuse le requin-bouledogue : depuis que le capitaine Rustin a tué sa mère, il mord tout ce qui bouge. Mais les chasseurs de baleines étaient sortis cette nuit-là.",
    rooms: [
      { id: 'P', name: 'La plage', material: 'sable', in: 'sur la plage' },
      { id: 'Q', name: 'Le port', material: 'planches', in: 'sur le port' },
      { id: 'N', name: 'Le baleinier', material: 'pont', in: 'sur le baleinier' },
      { id: 'X', name: 'Le large', material: 'mare', in: 'au large' },
      { id: 'R', name: 'Le récif', material: 'corail', in: 'dans le récif' },
      { id: 'G', name: 'La grotte sous-marine', material: 'grotte', in: 'dans la grotte sous-marine' },
    ],
    layout: ['PPPQQNN', 'PPQQNNN', 'PXXXXNN', 'RRXXXXG', 'RRXXXGG', 'RRRXGGG', 'RRRRGGG'],
    furniture: [M('transat', [0, 1]), M('coquillage', [1, 0]), M('ancre', [0, 3]), M('tonneau', [1, 2]), M('coffre', [0, 6]), M('banc', [2, 6]),
      M('corail', [4, 0]), M('anemone', [5, 1]), M('coquillage', [6, 2]), M('rocher', [4, 6]), M('rocher', [6, 5])],
    persons: [
      homme({ id: 'B', name: 'Le Bouledogue', role: 'le requin-bouledogue du bayou', color: 'sapin', look: { espece: 'requin' } }),
      femme({ id: 'M', name: 'La Matriarche', role: 'la reine des orques', color: 'ardoise', look: { espece: 'orque' } }),
      femme({ id: 'V', name: 'La Veuve', role: "la pieuvre de l'épave", color: 'prune', look: { espece: 'pieuvre' } }),
      homme({ id: 'R', name: 'Capitaine Rustin', role: 'le maître du port', color: 'brique', look: { skin: 'hale', hair: 'degarni', hairColor: 'gris', hat: 'casquette', outfit: 'manteau', extras: ['barbe', 'cicatrice'] } }),
      femme({ id: 'J', name: 'Jade', role: 'la baigneuse', color: 'rose', look: { skin: 'mat', hair: 'long', hairColor: 'blond', outfit: 'maillot', extras: ['boucles'] } }),
      homme({ id: 'G', name: 'Gédéon', role: 'le chasseur de baleines', color: 'ocre', look: { skin: 'hale', hair: 'court', hairColor: 'roux', hat: 'suroit', outfit: 'cire', extras: ['barbe', 'pipe'] } }),
      homme({ id: 'W', name: 'Vieux-Borgne', role: 'le vieux cachalot, victime', color: 'victime', victim: true, look: { espece: 'cachalot' } }),
    ],
    culprit: 'G', crimeRoom: 'Q',
    verdict: "Gédéon était seul avec Vieux-Borgne sur le port. Le chasseur de baleines l'avait harponné au large et remorqué jusqu'aux quais, en comptant laisser la ville accuser le requin. Le Bouledogue, pour une fois, n'y était pour rien.",
  },
);
