// Variante extra (3 pe eveniment). Forma: [grup][domeniu] = [v1, v2, v3]
export const FAIL_VARIANTS = {
  taran: {
    drept: ['Scribul de la han a scris jalba altuia. Se zice că tu n-ai fi știut nici cum s-o începi.', 'În fața logofătului ai stat cu mâna goală. Cartierul a văzut și a ținut minte.', 'Un vecin a pierdut o pricină mică pentru că nu ai știut să-l îndrumi. Nu ți-a mai bătut la poartă.'],
    filosofie: ['Preotul Valerie i-a învățat slovele pe copiii vecinilor, nu pe tine. Spune că tu ai timp altă dată.', 'Slovele pe care le știai anul trecut ți-au scăpat. Cartea de la biserică stă neatinsă.', 'La slujbă n-ai putut citi nici rândul tău. Oamenii s-au uitat în pământ.'],
    sport: ['Căratul butoaielor a rămas pe seama altora. Hangiul spune că ești bun la vorbă, nu la muncă.', 'La întrecerea din târg ai ieșit ultimul. Copiii au râs, iar tu ai tăcut.', 'Mâinile ți-au rămas moi, iar plugarii și-au dat seama de la prima strângere.'],
    casa: ['Gardul a căzut peste noapte, iar vecinii spun că vitele lor au ajuns în ograda ta.', 'Lemnele pentru iarnă nu sunt tăiate, iar fumul de la vecini ți-o amintește.', 'Coliba e plină de praf și frunze. Cine trece pe drum se uită și oftează.']
  },
  baron_obor: {
    drept: ['Un negustor a venit după sfat și a plecat cu mâinile goale. Baronia nu mai e locul unde se caută dreptate.', 'Zapisul unui arendaș a rămas necitit, iar el a pierdut o vie. Te-a învinuit în public.', 'Judele târgului a judecat fără tine și a hotărât greșit. Se spune că baronul nu mai ține la lege.'],
    filosofie: ['Dascălul grec a dat lecția altui elev. Zice că minții tale i-a fost lene.', 'Cărțile din odaia baronului au prins praf. Un oaspete a băgat de seamă.', 'Preotul Valerie a întrebat ce mai citești. Răspunsul a întârziat prea mult.'],
    sport: ['Ostașii au tras la țintă fără baron. Au zis că nu mai are mâna sigură.', 'Calul baronului a stat nealergat o lună, iar grăjdarul a ridicat din umeri.', 'La parada din Obor baronul a stat în a doua linie, iar oamenii au băgat de seamă.'],
    casa: ['Acoperișul hambarului a luat apă, iar grâul a mucegăit. Negustorii s-au retras de la tocmeală.', 'Curtea baronului e pe jumătate măturată. Un oaspete a râs în barbă.', 'Slugile nu mai primesc poruncă la timp, iar casa se vede.']
  },
  baron_buc: {
    drept: ['Un proces de la Dealul Spirii s-a pierdut pentru o dovadă neadusă la timp.', 'Logofătul Divanului a trimis o cerere la care n-ai răspuns. Se zice că ai alte treburi.', 'Un arendaș din cartier a pierdut o moșie, iar vina arată spre cancelaria ta.'],
    filosofie: ['La Academia Domnească scaunul tău a rămas gol. Profesorii au observat.', 'O dispută de la curte s-a purtat fără tine. Cel care a câștigat-o nu te-a pomenit.', 'Un dascăl tânăr a cerut să-și așeze catedra în alt cartier.'],
    sport: ['Garda n-a mai ieșit la instrucție de două săptămâni, iar comandantul se uită după alt stăpân.', 'Un duel din târg l-a câștigat un oștean pe care odinioară nu l-ai fi lăsat.', 'Caii gărzii s-au îngrășat, iar ostașii s-au dezobișnuit de drum.'],
    casa: ['Cămara conacului e aproape goală, iar slugile cer plata pe lunile trecute.', 'Un mic foc la grajduri a arătat că nimeni nu mai verifică focul.', 'Intendentul a pierdut socoteala sacilor. Se bănuiește că unul a plecat în noapte.']
  },
  conte: {
    drept: ['O pricină de hotar între două sate a ajuns la Divan fără aviz de la tine.', 'Doi boieri din Ilfov s-au judecat fără un cuvânt de la conte, iar unul a rămas nemulțumit.', 'Arhiva județului s-a încurcat, iar un zapis important nu se mai găsește.'],
    filosofie: ['O școală din Ilfov a rămas fără dascăl și nimeni n-a știut cui să ceară unul.', 'Scrisorile către cărturari au rămas fără răspuns. Aceștia au scris în altă parte.', 'Un tipograf din Buftea s-a plâns că nimeni din județ nu mai comandă cărți.'],
    sport: ['La vânătoarea contelui au venit boieri să te vadă călare. Ai rămas acasă.', 'Cavaleria a rămas fără instrucție de lance, iar un căpitan a cerut transferul.', 'Caii din herghelia contelui nu mai sunt scoși la alergat.'],
    casa: ['Hambarele județului nu sunt numărate, iar un arendaș a vândut grâul de două ori.', 'Vistiernicul a cerut socoteala banilor strânși, iar socoteala nu e gata.', 'Podul de lângă Otopeni s-a stricat, iar dările s-au amânat.']
  },
  domn: {
    drept: ['Un proces mare a trecut prin Divan cu un singur martor, iar acela nu a fost al tău.', 'Hrisovul pe care îl așteptau boierii n-a fost iscălit la timp.', 'Judecata Divanului a mers spre cel mai puternic, iar tu ai aflat ultimul.'],
    filosofie: ['Școala domnească din ținutul tău s-a închis pentru lipsă de dascăli.', 'Un cărturar a plecat din țară, scriind că aici nu mai citește nimeni.', 'Epitropii cer ca banii bisericii să meargă la altă școală.'],
    sport: ['Oștirea a ieșit la parada de Sfântul Gheorghe fără steag, iar boierii au murmurat.', 'Domnul nu s-a arătat la vânătoarea domnească, iar curtea a tras concluzii.', 'Garda domnească se instruiește singură, iar ostașii nu mai știu cine le e stăpân.'],
    casa: ['Boierii spun că visteria a fost scoasă la inventar și nu s-a găsit toată suma.', 'Dările din țară au întârziat, iar Poarta a cerut lămuriri.', 'Curtea domnească a rămas fără lumânări în plină iarnă. Se șoptește că visteria e goală.']
  }
};

export const WIN_VARIANTS = {
  taran: {
    drept: ['Un vecin a venit la tine cu zapisul, iar tu l-ai citit pe loc. Cartierul a prins de veste.', 'Logofătul te-a poftit să-i citești o hârtie. E prima dată când cineva din sat face asta.', 'Jalba ta a fost primită fără întârziere, iar vecinii te privesc altfel.'],
    filosofie: ['Preotul Valerie ți-a dat să citești la slujbă. Satul a ascultat în tăcere.', 'Slovele îți ies acum curat, iar copiii cer să le arăți.', 'Preotul spune că ai început să citești ca un om învățat.'],
    sport: ['La întrecerea din târg ai ajuns în primii trei. Hangiul a ridicat un pahar.', 'Plugarii spun că ai mâna tare, iar un vecin te-a chemat la arat.', 'Brațele tale au dus butoaiele fără oprire, iar hangiul te-a plătit în plus.'],
    casa: ['Gardul e drept, iar vecinii ți-au lăudat ograda.', 'Lemnele sunt tăiate pentru toată iarna. Cine trece pe drum îți dă binețe.', 'Coliba e măturată, iar fumul iese drept din horn.']
  },
  baron_obor: {
    drept: ['Un negustor a plecat mulțumit de la judecata ta, iar vestea s-a dus prin târg.', 'Zapisul unui arendaș l-ai citit la timp, iar el și-a păstrat via.', 'Judele târgului a ținut seama de părerea ta și a hotărât drept.'],
    filosofie: ['Dascălul grec ți-a dat o carte din biblioteca lui. Rar face asta.', 'Cărțile din odaia baronului sunt frunzărite, iar un oaspete a băgat de seamă.', 'Preotul Valerie a întrebat ce citești, iar răspunsul a venit pe loc.'],
    sport: ['Ostașii au tras la țintă cu baronul în față, iar cel mai bun a fost el.', 'Calul baronului a fost alergat zilnic, iar grăjdarul zâmbește.', 'La parada din Obor baronul a mers în primul rând.'],
    casa: ['Acoperișul hambarului e nou, iar grâul stă la uscat.', 'Curtea baronului e măturată, iar un oaspete a rămas la masă.', 'Slugile primesc poruncile la timp, iar casa merge ca un ceas.']
  },
  baron_buc: {
    drept: ['O pricină de la Dealul Spirii s-a câștigat cu o dovadă adusă la timp.', 'Logofătul Divanului a primit răspunsul tău în aceeași zi.', 'Un arendaș din cartier și-a păstrat moșia, iar vestea s-a dus prin București.'],
    filosofie: ['La Academia Domnească scaunul tău nu e niciodată gol.', 'O dispută de la curte s-a purtat cu numele tău pe buze.', 'Un dascăl tânăr a cerut să-și așeze catedra în cartierul tău.'],
    sport: ['Garda a ieșit zilnic la instrucție, iar comandantul e mulțumit.', 'Un duel din târg l-a câștigat un oștean al tău.', 'Caii gărzii sunt în formă, iar ostașii străbat drumul fără oboseală.'],
    casa: ['Cămara conacului e plină, iar slugile sunt plătite la zi.', 'Un mic foc la grajduri a fost stins din primul moment, iar intendentul te-a lăudat.', 'Intendentul a numărat sacii, iar socoteala a ieșit la leu.']
  },
  conte: {
    drept: ['O pricină de hotar între două sate s-a încheiat cu aviz de la tine.', 'Doi boieri din Ilfov s-au judecat în fața ta, iar amândoi au plecat împăcați.', 'Arhiva județului e în ordine, iar zapisele se găsesc într-un ceas.'],
    filosofie: ['O școală din Ilfov a primit un dascăl nou în numele tău.', 'Scrisorile către cărturari au primit răspuns, iar unul a venit să te vadă.', 'Un tipograf din Buftea a început să tipărească cărți pentru județ.'],
    sport: ['La vânătoarea contelui, boierii te-au văzut călare și au tăcut cu respect.', 'Cavaleria a exersat lancea, iar un căpitan a cerut să rămână.', 'Caii din herghelia contelui sunt scoși zilnic la alergat.'],
    casa: ['Hambarele județului sunt numărate, iar niciun arendaș nu mai vinde dublu.', 'Socoteala vistiernicului e gata înainte de termen.', 'Podul de lângă Otopeni a fost dres, iar dările au intrat la timp.']
  },
  domn: {
    drept: ['Un proces mare a trecut prin Divan cu martorul tău în față.', 'Hrisovul boierilor a fost iscălit în ziua cuvenită.', 'Judecata Divanului a pornit de la un cuvânt de-al tău.'],
    filosofie: ['Școala domnească din ținutul tău are dascăli noi și elevi în bănci.', 'Un cărturar a scris acasă că aici se citește din nou.', 'Epitropii au trimis bani pentru școala din ținutul tău.'],
    sport: ['Oștirea a ieșit la parada de Sfântul Gheorghe cu steagul sus.', 'Domnul a venit la vânătoarea domnească, iar curtea a fost mulțumită.', 'Garda domnească se instruiește sub ochii tăi, iar ostașii știu cine le e stăpân.'],
    casa: ['Visteria a trecut inventarul fără nicio lipsă.', 'Dările au sosit la termen, iar Poarta n-a cerut nimic.', 'Curtea domnească are lumânări din belșug în plină iarnă.']
  }
};
