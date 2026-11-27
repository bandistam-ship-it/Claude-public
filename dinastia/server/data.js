// Date statice: ranguri, domenii, evenimente (toate in romana).
export const DOMAINS = ['drept', 'filosofie', 'sport', 'casa'];
export const DOMAIN_NAMES = { drept: 'Drept și Barou', filosofie: 'Filosofie și lectură', sport: 'Sport', casa: 'Casă' };

export const RANKS = [
  { id: 'taran', name: 'Țăran liber', factor: 10, group: 'taran', next: 'Cucerești Obor' },
  { id: 'baron_obor', name: 'Baron de Obor', factor: 8, group: 'baron_obor', next: 'Cucerești tot Bucureștiul' },
  { id: 'baron_buc', name: 'Baron de București', factor: 11, group: 'baron_buc', next: 'Cucerești orașele din Ilfov' },
  { id: 'conte', name: 'Conte de Ilfov', factor: 15, group: 'conte', next: 'Cucerești județele din jur' },
  { id: 'vornic', name: 'Mare Vornic', factor: 20, group: 'domn', next: 'Cucerești toată Țara Românească' },
  { id: 'domn_tr', name: 'Domn al Țării Românești', factor: 27, group: 'domn', next: 'Cucerești Moldova și Transilvania' },
  { id: 'domn_pr', name: 'Domn al Principatelor', factor: 36, group: 'domn', next: 'Cucerești țări vecine' },
  { id: 'rege', name: 'Rege', factor: 48, group: 'domn', next: 'Cucerești restul continentului' },
  { id: 'imparat', name: 'Împărat', factor: null, group: 'domn', next: 'Menții imperiul' }
];
// Dificultatea (factorul) pe pas, relativ la Obor, asa cum e in document.
export const STEP_FACTORS = [10, 8, 11, 15, 20, 27, 36, 48];

export const SOURCES = {
  taran: {
    drept: 'Logofătul a trimis după altcineva să scrie jalba. Pentru el nu ești încă om de încredere.',
    filosofie: 'Preotul Valerie din cartier n-a vrut să te învețe să citești, găsindu-te sărac cu duhul.',
    sport: 'Hangiul a pus alt băiat la căratul butoaielor. Brațele tale n-au făcut față.',
    casa: 'Acoperișul colibei picură, iar vecinii au observat.'
  },
  baron_obor: {
    drept: 'La judecata târgului un negustor a pierdut o pricină pe care ai fi putut-o câștiga. Se întreabă la ce îți trebuie baronia.',
    filosofie: 'Dascălul grec nu mai vine. Spune că nu te-a prins la lecție de trei săptămâni.',
    sport: 'Garda baroniei a făcut instrucție fără stăpân. Ostașii spun că baronul e de masă, nu de arme.',
    casa: 'Hambarele din Obor n-au fost numărate, iar un negustor a luat mai mult decât se cuvenea.'
  },
  baron_buc: {
    drept: 'Un conac din Colentina a trecut la vecini din cauza unui act necitit la timp.',
    filosofie: 'Profesorul de la Academia Domnească spune că poate găsi alt protector, mai citit.',
    sport: 'Garda nu se mai ține după un comandant care n-a ieșit din conac de o lună.',
    casa: 'Intendentul spune că vistieria curții e goală. Nimeni nu înțelege de ce.'
  },
  conte: {
    drept: 'Vornicii din Buftea au trimis un raport pe care nu l-ai citit. Doi arendași certați au tras din el concluzii opuse.',
    filosofie: 'Cantemir vodă a întrerupt corespondența cu tine. Peste ținuturile tale aproape nimeni nu știe să citească.',
    sport: 'Cavaleria județului a ieșit la paradă cu un comandant care abia se ținea în șa.',
    casa: 'Dările din Ilfov n-au fost strânse la timp, iar vistiernicul îți cere socoteală.'
  },
  domn: {
    drept: 'Divanul a judecat o pricină fără tine. Hotărârea o aplică cel mai tare, nu cel mai drept.',
    filosofie: 'Epitropii bisericii spun că ținutul tău n-a mai dat nici un cărturar de un an.',
    sport: 'Oștirea e tare pe hârtie, dar domnul nu s-a mai arătat la arme.',
    casa: 'Visteria e nesigură, iar boierii cer să se numească alt vistiernic.'
  }
};

export const WINS = {
  taran: {
    drept: 'Logofătul a cerut ca jalba ta să fie citită în fața satului. Cartierul îți spune acum „cel cu hârtia”.',
    filosofie: 'Preotul Valerie te-a pus să le arăți slovele ucenicilor. Lumea s-a mirat că știi carte.',
    sport: 'Hangiul te-a pus cel dintâi la căratul butoaielor, iar brațele au ținut până seara.',
    casa: 'Acoperișul colibei e dres, iar vecinii vin să te întrebe cum ai făcut.'
  },
  baron_obor: {
    drept: 'La judecata târgului ai câștigat o pricină grea. Negustorii vorbesc cu respect despre baronie.',
    filosofie: 'Dascălul grec a rămas peste ceas la lecție. Spune că rar a întâlnit un baron cu mintea atât de ageră.',
    sport: 'Garda a ieșit prima la instrucție, în pasul baronului. Hatmanul a notat numele tău.',
    casa: 'Hambarele din Obor au fost numărate până la ultimul bob. Negustorii se feresc de socoteala ta.'
  },
  baron_buc: {
    drept: 'Un act citit la timp a salvat un conac din Colentina. Boierii spun că ai ochi de logofăt.',
    filosofie: 'Profesorul de la Academia Domnească te-a poftit la o dispută publică. Se șoptește că ai viitor de cărturar.',
    sport: 'Garda a defilat în pas de paradă, iar comandantul a lăudat disciplina baronului.',
    casa: 'Vistieria curții a închis anul pe plus pentru prima dată. Intendentul cere să rămână la fel.'
  },
  conte: {
    drept: 'Vornicii din Buftea au primit răspuns la timp. Arendașii certați s-au împăcat.',
    filosofie: 'Dascălii din Ilfov au cerut să deschidă o școală în numele tău.',
    sport: 'Cavaleria județului a defilat în fața ta, iar calul comandantului a primit numele tău.',
    casa: 'Dările din Ilfov au fost strânse la timp, iar vistiernicul îți mulțumește în scris.'
  },
  domn: {
    drept: 'Divanul a așteptat părerea ta înainte să hotărască, iar pricina s-a încheiat după dreptate.',
    filosofie: 'Epitropii bisericii au cerut un cărturar din ținutul tău pentru școala domnească.',
    sport: 'Oștirea e tare și pe teren, nu doar pe hârtie, iar domnul s-a arătat la arme alături de ea.',
    casa: 'Visteria e plină, iar boierii nu mai cer alt vistiernic.'
  }
};

export const HABIT = {
  drept: 'cartea de drept în mână',
  filosofie: 'cartea de filosofie în mână',
  sport: 'brațele și picioarele la antrenament',
  casa: 'treburile casei în termen'
};

export const RIVALS = ['Spătarul Costache', 'Postelnicul Iordache', 'Căminarul Manolache', 'Paharnicul Dinu', 'Clucerul Radu', 'Armașul Stan'];

export const HEIR_NAMES = ['Matei', 'Ilie', 'Vlad', 'Stelian', 'Neagu', 'Barbu', 'Gheorghe', 'Teodor', 'Constantin', 'Șerban'];

export const CONQUEST_FLAVOR = {
  1: ['Târgoveții își scot căciula când treci.', 'Negustorii îți ies în cale cu pâine și sare.', 'Clopotul din Obor bate pentru tine.'],
  2: ['Cartierul își deschide porțile, iar vecinii întreabă ce mai poruncești.', 'Mahalagiii se adună în ulița ta și strigă numele tău.', 'Dascălii cartierului te primesc cu cartea deschisă.'],
  3: ['Vornicii orașului vin să-ți sărute mâna și să-ți predea cheile.', 'Târgul îți deschide poarta, iar arendașii cer să te cunoască.', 'Judele orașului îți așază pecetea pe hrisov.'],
  4: ['Județul se închină, iar dările sunt ale tale.', 'Boierii județului vin la tine cu pâine și cu jurământ.', 'Steagul tău flutură deasupra cetății.']
};

export const LOSS_TEXT = [
  '{rival} a pus stăpânire pe {t}. Boierii spun că nu l-ai fi lăsat dacă în luna trecută ți-ai fi ținut {habit}.',
  '{rival} a intrat în {t} cu oamenii lui, iar nimeni nu l-a oprit. Se zice că ai fi putut, cu {habit}.',
  'În {t} flutură acum steagul lui {rival}. Vecinii povestesc că altfel ar fi fost cu {habit}.'
];
export const RECONQUER_TEXT = [
  '{t} e din nou al tău. {rival} își strânge oamenii și pleacă.',
  'Ai luat {t} înapoi de la {rival}. Se spune că nu va uita.'
];
export const DAILY = {
  taran: {
    drept: 'Logofătul a aflat că ai lucrat la „{t}”.',
    filosofie: 'Preotul Valerie te-a văzut cu cartea în mână: „{t}”.',
    sport: 'Hangiul a văzut că ai muncit cu brațele azi: „{t}”.',
    casa: 'Vecinii au observat că ai pus rânduială: „{t}”.'
  },
  baron_obor: {
    drept: 'Negustorii din târg au auzit că ai rezolvat „{t}”.',
    filosofie: 'Dascălul grec a notat că ai trecut prin „{t}”.',
    sport: 'Garda baroniei te-a văzut la instrucție: „{t}”.',
    casa: 'Hambarele din Obor sunt în ordine: „{t}”.'
  },
  baron_buc: {
    drept: 'Un act din cancelaria ta a fost închis: „{t}”.',
    filosofie: 'Profesorii de la Academie vorbesc despre „{t}”.',
    sport: 'Comandantul gărzii a lăudat instrucția: „{t}”.',
    casa: 'Intendentul a bifat în catastif: „{t}”.'
  },
  conte: {
    drept: 'Vornicii din Ilfov primesc vestea: „{t}”.',
    filosofie: 'Cărturarii din județ au aflat de „{t}”.',
    sport: 'Cavaleria județului a făcut exerciții: „{t}”.',
    casa: 'Vistiernicul a trecut în socoteală: „{t}”.'
  },
  domn: {
    drept: 'Divanul a luat act de „{t}”.',
    filosofie: 'Epitropii au consemnat: „{t}”.',
    sport: 'Oștirea domnească a ieșit la arme: „{t}”.',
    casa: 'Visteria curții a închis la zi: „{t}”.'
  }
};
