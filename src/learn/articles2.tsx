/**
 * Post su storia sismica e vulcani. Stesse regole di articles.tsx:
 * testo semplice, termini scientifici spiegati, numeri solo da fonti verificate (elencate in fondo).
 */
import { Link } from 'react-router';
import cpti from '../data/learn/cpti15.json';
import cf from '../data/learn/campi-flegrei.json';
import { formatInt } from '../lib/format';
import type { Article } from './articles';
import { CF_MAIN } from './cfEvents';
import { SequenceSection } from './SequenceSection';
import { CenturyBars, CFMonthlyChart, CFYearBars, HistoryTimeline, UpliftBars, VolcanicIntensityChart } from './figures2';

const n = (v: number) => formatInt(v);

const CPTI15 = {
  label:
    'Rovida A., Locati M., Camassi R., Lolli B., Gasperini P., Antonucci A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV',
  href: 'https://doi.org/10.13127/CPTI/CPTI15.4',
};
const OV_BOLLETTINO = {
  label: 'INGV – Osservatorio Vesuviano, Bollettino di sorveglianza Campi Flegrei, settembre 2026',
  href: 'https://www.ov.ingv.it/index.php/monitoraggio-e-infrastrutture/bollettini-tutti/bollett-mensili-cf/anno-2026-3/2017-bollettino-mensile-campi-flegrei-2026-09/file',
};
const DPC_CF_TIMELINE = {
  label: 'Dipartimento della Protezione Civile — Il bradisismo ai Campi Flegrei: linea del tempo',
  href: 'https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/linea-del-tempo/',
};

export const MORE_ARTICLES: Article[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'grandi-terremoti-della-storia',
    title: 'I grandi terremoti della storia d’Italia',
    subtitle: 'Mille anni di memoria scritta: cosa ci insegnano i terremoti del passato.',
    minutes: 6,
    summary: [
      `Il catalogo storico dell’INGV (CPTI15) elenca ${n(cpti.totaleEventi)} terremoti dall’anno ${cpti.primoAnno} al ${cpti.ultimoAnno}.`,
      'I più forti hanno colpito Sicilia orientale, Calabria, Appennino meridionale e centrale: Mw stimata oltre 7.',
      'Le stesse zone sono state colpite più volte: per questo la storia è la base delle mappe di pericolosità.',
    ],
    body: () => (
      <>
        <h2>Come si studia un terremoto di 500 anni fa</h2>
        <p>
          L’Italia ha una “memoria sismica” unica al mondo: cronache, lettere, registri parrocchiali, relazioni di ingegneri e
          giornali raccontano i terremoti da più di mille anni. La <dfn>sismologia storica</dfn> raccoglie questi documenti,
          ricostruisce i danni paese per paese e assegna a ogni luogo un grado di <dfn>intensità</dfn> (scala MCS). Dalla
          distribuzione delle intensità si stimano poi la posizione dell’epicentro e la magnitudo.
        </p>
        <p>
          Il risultato è il <dfn>Catalogo Parametrico dei Terremoti Italiani (CPTI15)</dfn> dell’INGV: {n(cpti.totaleEventi)}{' '}
          terremoti, dal {cpti.primoAnno} al {cpti.ultimoAnno}. Per i terremoti antichi la magnitudo è una stima ricavata dagli
          effetti; per quelli recenti viene dagli strumenti. Per questo alcuni valori possono essere un po’ diversi da quelli
          che trovi altrove: per Norcia 2016, per esempio, il catalogo storico riporta Mw 6,6, l’INGV in tempo reale Mw 6,5.
        </p>

        <HistoryTimeline />

        <h2>I più forti</h2>
        <ul className="advice">
          <li>
            <strong>11 gennaio 1693, Sicilia sud-orientale (Mw 7,3):</strong> il terremoto più forte del catalogo. Distrusse
            decine di città del Val di Noto, con molte migliaia di vittime. Le città furono ricostruite in stile barocco: oggi
            sono patrimonio dell’UNESCO.
          </li>
          <li>
            <strong>5 dicembre 1456, Appennino centro-meridionale (Mw 7,2)</strong> e <strong>16 dicembre 1857, Basilicata
            (Mw 7,1):</strong> due grandi terremoti dell’Appennino del Sud. Dopo quello del 1857 l’ingegnere irlandese Robert
            Mallet ne studiò gli effetti sul posto: è considerato uno degli inizi della sismologia moderna.
          </li>
          <li>
            <strong>1783, Calabria (Mw fino a 7,1):</strong> non un solo terremoto, ma una sequenza di cinque forti scosse in
            meno di due mesi, che cambiò il paesaggio con frane e laghi nuovi.
          </li>
          <li>
            <strong>28 dicembre 1908, Stretto di Messina (Mw 7,1):</strong> il disastro più grave della storia d’Italia moderna.
            Messina e Reggio Calabria furono rase al suolo, seguì un maremoto. Secondo l’INGV le vittime furono circa 80.000.
          </li>
          <li>
            <strong>13 gennaio 1915, Marsica (Mw 7,1):</strong> distrusse Avezzano e molti paesi della piana del Fucino.
          </li>
        </ul>

        <h2>Il Novecento e i nostri giorni</h2>
        <ul className="advice">
          <li><strong>1968, Valle del Belice</strong> (Mw 6,4).</li>
          <li>
            <strong>6 maggio 1976, Friuli (Mw 6,5):</strong> 965 vittime secondo il catalogo dei forti terremoti dell’INGV.
            Le scosse dell’11 e del 15 settembre ne causarono altre 13.
          </li>
          <li>
            <strong>23 novembre 1980, Irpinia-Basilicata (Mw 6,8):</strong> 2.734 vittime secondo la Protezione Civile. I
            soccorsi lenti e disorganizzati portarono, nel 1982, alla nascita del Dipartimento della Protezione Civile.
          </li>
          <li>
            <strong>6 aprile 2009, L’Aquila (Mw 6,3):</strong> 309 vittime e oltre 1.500 feriti.
          </li>
          <li>
            <strong>2016, Italia centrale:</strong> il 24 agosto (Mw 6,0) 299 vittime ad Amatrice, Accumoli e Arquata del
            Tronto; il 30 ottobre la scossa di Norcia, la più forte in Italia dal 1980, senza vittime ma con danni enormi. Ne
            parliamo in <Link to="/capire/repliche-e-sequenze">Repliche e sequenze</Link>.
          </li>
        </ul>
        <p>
          Secondo l’INGV, negli ultimi 150 anni l’Italia ha avuto in media un disastro sismico ogni 4–5 anni, con circa
          150.000 morti in totale.
        </p>

        <h2>Il Medioevo tremava meno? No: mancano i documenti</h2>
        <CenturyBars />
        <p>
          Questo è un concetto importante, la <dfn>completezza</dfn> del catalogo: per i periodi antichi conosciamo soprattutto
          i terremoti più distruttivi, quelli che hanno lasciato tracce scritte. Gli studiosi ne tengono conto quando calcolano
          la pericolosità.
        </p>

        <h2>Cosa ci insegna la storia</h2>
        <p>
          Guardando la mappa dei terremoti del passato si vede che le stesse zone sono state colpite più volte: Sicilia
          orientale, Calabria, Appennino. La storia non dice <em>quando</em> arriverà il prossimo terremoto, ma dice{' '}
          <em>dove</em> può arrivare e quanto può essere forte. È proprio su questi dati che si costruiscono le mappe di
          pericolosità e le <Link to="/il-mio-comune">zone sismiche dei comuni</Link>.
        </p>
      </>
    ),
    glossary: [
      ['Sismologia storica', 'Studio dei terremoti del passato attraverso documenti scritti.'],
      ['CPTI15', 'Catalogo Parametrico dei Terremoti Italiani dell’INGV: elenco ufficiale dei terremoti dall’anno 1000.'],
      ['Completezza', 'Quanto un catalogo contiene davvero tutti i terremoti di un periodo; per i secoli antichi è bassa.'],
    ],
    sources: [
      CPTI15,
      { label: 'INGV — CFTI5Med, Catalogo dei Forti Terremoti in Italia', href: 'https://storing.ingv.it/cfti/cfti5/' },
      { label: 'INGV — CFTI, linea del tempo dei forti terremoti', href: 'https://cfti.ingv.it/timeline/' },
      { label: 'INGV — CFTI, scheda del terremoto del Friuli del 6 maggio 1976', href: 'https://storing.ingv.it/cfti/cfti4/quakes/38902.html' },
      { label: 'INGVterremoti — La “catastrofe sismica” del 28 dicembre 1908', href: 'https://ingvterremoti.com/2015/12/28/i-terremoti-del-900-la-catastrofe-sismica-del-28-dicembre-1908/' },
      { label: 'Protezione Civile — The Irpinia earthquake', href: 'https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/irpinia-earthquake/' },
      { label: 'Protezione Civile — The Abruzzo earthquake', href: 'https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/abruzzo-earthquake/' },
      { label: 'Protezione Civile — The earthquake in Central Italy', href: 'https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/earthquake-central-italy/' },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'terremoti-e-vulcani',
    title: 'Terremoti e vulcani: Etna, Vesuvio, Ischia',
    subtitle: 'Perché vicino ai vulcani anche una scossa “piccola” può fare danni.',
    minutes: 5,
    summary: [
      'Nelle aree vulcaniche i terremoti nascono da magma, gas e fluidi in movimento e dalle faglie sui fianchi dei vulcani.',
      'Sono quasi sempre poco profondi (pochi km): per questo, anche con magnitudo bassa, vicino all’epicentro si sentono forte.',
      'Esempi: Ischia 1883 (Mw 4,3, intensità IX-X) e Fleri sull’Etna 2018 (Mw 4,9, profondità meno di 1 km).',
    ],
    body: () => {
      const ischia = (cpti.flegreo.piuForti as { anno: number; mw: number; io: string }[]).find((e) => e.anno === 1883)!;
      const linera = (cpti.etna.piuForti as { anno: number; mw: number; io: string }[]).find((e) => e.anno === 1914)!;
      return (
        <>
          <h2>Perché tremano i vulcani</h2>
          <p>Nelle aree vulcaniche i terremoti hanno cause diverse da quelle dell’Appennino:</p>
          <ul className="advice">
            <li>il <dfn>magma</dfn> e i gas che si muovono in profondità spingono e fratturano le rocce;</li>
            <li>
              i <dfn>sistemi idrotermali</dfn> (acqua e gas caldi sotto il vulcano) si pressurizzano e fanno muovere il suolo;
            </li>
            <li>i fianchi dei vulcani sono attraversati da <dfn>faglie</dfn> che possono rompersi, come sull’Etna.</li>
          </ul>
          <p>
            Questi terremoti sono quasi sempre <strong>superficiali</strong>, a pochi chilometri o anche meno di un chilometro di
            profondità. Le onde arrivano in superficie quasi senza perdere energia: vicino all’epicentro lo scuotimento è forte,
            ma si esaurisce in pochi chilometri.
          </p>

          <VolcanicIntensityChart />

          <h2>Etna</h2>
          <p>
            L’Etna è uno dei vulcani più attivi del mondo e uno dei più sismici d’Italia: il catalogo storico ne elenca{' '}
            {n(cpti.etna.totale)} terremoti. I più dannosi avvengono lungo le faglie del fianco orientale. Nel 1914 una scossa
            di Mw {String(linera.mw).replace('.', ',')} raggiunse l’intensità {linera.io} a Linera, vicino a Santa Venerina.
          </p>
          <p>
            Il 26 dicembre 2018, durante un’eruzione laterale, un terremoto di <strong>Mw 4,9</strong> colpì Fleri e i paesi
            vicini: è stato il più energetico sull’Etna degli ultimi 70 anni. L’ipocentro era a meno di un chilometro di
            profondità e la <dfn>faglia di Fiandaca</dfn> si è rotta fino in superficie per circa 8 km. Gli edifici costruiti
            proprio sopra la faglia sono stati i più colpiti; i danni hanno riguardato più di 3.000 edifici.
          </p>

          <h2>Ischia</h2>
          <p>
            Il 28 luglio 1883 un terremoto di magnitudo stimata solo <strong>{String(ischia.mw).replace('.', ',')}</strong>{' '}
            distrusse Casamicciola, con un’intensità {ischia.io}: secondo l’Archivio Storico Macrosismico dell’INGV le vittime
            furono circa 2.300, anche perché l’isola era piena di turisti. Il 21 agosto 2017 una nuova scossa di Mw 3,9, a circa
            1,5 km di profondità, ha provocato di nuovo crolli e vittime a Casamicciola.
          </p>

          <h2>Vesuvio</h2>
          <p>
            Il Vesuvio non erutta dal 1944 ed è oggi un vulcano tranquillo dal punto di vista sismico: dal 1985 il terremoto più
            forte registrato nel catalogo INGV vicino al cratere è stato di magnitudo Md 3,4, nel 1999. Ma “tranquillo” non vuol
            dire “innocuo”: attorno al Vesuvio vivono centinaia di migliaia di persone e per questo esiste un piano nazionale di
            emergenza.
          </p>

          <h2>E i Campi Flegrei?</h2>
          <p>
            Sono il caso più particolare, con un fenomeno tutto loro: il bradisismo. Li raccontiamo nel prossimo post,{' '}
            <Link to="/capire/campi-flegrei">Campi Flegrei: la caldera che respira</Link>.
          </p>
        </>
      );
    },
    glossary: [
      ['Sistema idrotermale', 'Acqua e gas caldi nel sottosuolo di un vulcano, riscaldati dal magma.'],
      ['Terremoto superficiale', 'Terremoto con ipocentro a pochi km di profondità: forte vicino, debole lontano.'],
      ['Faglia di Fiandaca', 'Faglia sul fianco orientale dell’Etna, rotta in superficie dal terremoto del 26 dicembre 2018.'],
    ],
    sources: [
      CPTI15,
      { label: 'INGV — Il terremoto sull’Etna del 26 dicembre e la rottura della faglia di Fiandaca', href: 'https://www.ingv.it/stampa-urp/ufficio-stampa/note-stampa/il-terremoto-sull-etna-del-26-dicembre-e-la-rottura-della-faglia-di-fiandaca' },
      { label: 'INGVterremoti — La fagliazione superficiale prodotta dal terremoto etneo del 26 dicembre 2018, Mw 4.9', href: 'https://ingvterremoti.com/2019/03/06/la-fagliazione-superficiale-prodotta-dal-terremoto-etneo-del-26-dicembre-2018-mw-4-9/' },
      { label: 'INGV — ASMI, 28 luglio 1883, Isola d’Ischia', href: 'https://emidius.mi.ingv.it/ASMI/event/18830728_2025_000' },
      { label: 'INGVterremoti — 28 luglio 1883, la catastrofe di Casamicciola', href: 'https://ingvterremoti.com/2018/07/27/i-terremoti-nella-storia-28-luglio-1883-la-catastrofe-di-casamicciola-sullisola-dischia/' },
      { label: 'INGV — catalogo dei terremoti (Vesuvio e Ischia 2017)', href: 'https://webservices.ingv.it/fdsnws/event/1/query?format=text&starttime=1985-01-01&lat=40.821&lon=14.426&maxradiuskm=6&orderby=magnitude&limit=5' },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'campi-flegrei',
    title: 'Campi Flegrei: la caldera che respira',
    subtitle: 'Cos’è il bradisismo, cosa sta succedendo dal 2005 e cosa sappiamo davvero.',
    minutes: 9,
    summary: [
      'I Campi Flegrei sono una caldera: un vulcano “a conca” nato da enormi eruzioni, dove oggi vivono centinaia di migliaia di persone.',
      'Il suolo si alza e si abbassa lentamente (bradisismo): a Pozzuoli si è sollevato di circa 169,5 cm da novembre 2005.',
      'La sismicità cresce dal 2019; la scossa più forte finora è stata Md 4,7 il 31 luglio 2026. Il livello di allerta è giallo.',
    ],
    body: () => (
      <>
        <h2>Un vulcano che non sembra un vulcano</h2>
        <p>
          Se pensi a un vulcano immagini una montagna a cono come il Vesuvio. I Campi Flegrei, a ovest di Napoli, sono invece
          una <dfn>caldera</dfn>: una grande depressione nata quando il tetto della camera magmatica è sprofondato dopo
          eruzioni gigantesche. Secondo l’Osservatorio Vesuviano dell’INGV le principali sono due:
        </p>
        <ul className="advice">
          <li>
            l’<dfn>Ignimbrite Campana</dfn>, circa 40.000 anni fa, l’eruzione più energetica conosciuta nell’area del
            Mediterraneo;
          </li>
          <li>il <dfn>Tufo Giallo Napoletano</dfn>, circa 15.000 anni fa.</li>
        </ul>
        <p>
          Dopo, negli ultimi 5.500 anni, ci sono state più di 27 eruzioni più piccole. L’ultima è del 1538 e ha formato il Monte
          Nuovo, vicino a Pozzuoli. Dentro e attorno alla caldera oggi ci sono Pozzuoli, Bacoli, Monte di Procida, Quarto e
          quartieri di Napoli: è una delle aree vulcaniche più abitate del mondo.
        </p>

        <h2>Il bradisismo: il suolo che sale e scende</h2>
        <p>
          <dfn>Bradisismo</dfn> viene dal greco <em>bradýs</em>, “lento”: è un lento movimento verticale del suolo. Ai Campi
          Flegrei sotto la superficie c’è un <dfn>sistema idrotermale</dfn>: acqua e gas caldi, riscaldati dal magma più in
          profondità. Quando questo sistema si scalda e si pressurizza, il suolo si gonfia e si solleva; quando la pressione
          cala, si abbassa. Il sollevamento “stira” le rocce più superficiali, che si rompono con tanti piccoli terremoti.
        </p>
        <p>
          Lo si misura anche dal livello del mare: la stazione mareografica di Pozzuoli Porto registra, dal 2006 a oggi, un
          sollevamento del suolo di circa 159 cm rispetto al mare.
        </p>

        <h2>Le crisi del 1970–72 e del 1982–84</h2>
        <p>
          Nel 1970–72 il suolo si sollevò di circa 1,5–1,7 m e il Rione Terra di Pozzuoli fu evacuato. Nel 1982–84 il
          sollevamento fu di circa 1,8 m, con molti terremoti e danni diffusi agli edifici: fu evacuato tutto il centro di
          Pozzuoli. In totale, in quegli anni, il suolo si alzò di circa 3,5 m. Poi, per vent’anni, è lentamente sceso.
        </p>

        <UpliftBars />

        <h2>La fase attuale: dal 2005 a oggi</h2>
        <p>
          Dal novembre 2005 il suolo ha ricominciato a salire, prima lentamente, poi sempre più in fretta. Secondo il
          bollettino dell’Osservatorio Vesuviano di settembre 2026:
        </p>
        <ul className="advice">
          <li>
            alla stazione GPS del Rione Terra il sollevamento totale è di <strong>circa 169,5 cm da novembre 2005</strong>, di cui
            circa 32 cm solo da gennaio 2025;
          </li>
          <li>
            da febbraio 2026 il suolo sale in media di <strong>circa 10 mm al mese</strong>;
          </li>
          <li>a settembre 2026 ci sono stati 91 terremoti, il più forte di magnitudo Md 2,0.</li>
        </ul>
        <p>
          L’Osservatorio scrive che dal 2019 la sismicità si è intensificata, sia per numero di eventi sia per magnitudo. I dati
          del catalogo nazionale lo mostrano bene:
        </p>

        <CFYearBars />
        <CFMonthlyChart />

        <h2>Le scosse più forti</h2>
        <p>Valori ufficiali comunicati dall’Osservatorio Vesuviano e dalla Protezione Civile:</p>
        <ul className="cf-events">
          {CF_MAIN.map(([d, m, note]) => (
            <li key={d}>
              <span className="cf-events__date">{d}</span>
              <span className="cf-events__mag">{m}</span>
              <span className="muted">{note}</span>
            </li>
          ))}
        </ul>
        <p>
          Non sono terremoti grandissimi, ma si sentono molto perché sono <strong>superficialissimi</strong>: nei dati
          INGV dal 2000 la profondità mediana è di circa {String(cf.profonditaMediana).replace('.', ',')} km e solo il{' '}
          {cf.oltre3km}% supera i 3 km. In più avvengono sotto una città densa, su terreni vulcanici che amplificano lo
          scuotimento.
        </p>
        <p className="small muted">
          Nota: la stessa scossa può avere magnitudo diverse in cataloghi diversi. Per quella del 27 settembre 2023 l’Osservatorio
          Vesuviano ha comunicato Md 4,2, mentre il catalogo nazionale riporta ML 3,1: sono due tipi di magnitudo calcolati in
          modo diverso. Per le scosse principali usiamo i valori ufficiali dell’Osservatorio.
        </p>

        <SequenceSection preferred="campi-flegrei" />

        <h2>I gas e il calore</h2>
        <p>
          Non c’è solo il movimento del suolo. Alla Solfatara e a Pisciarelli il vulcano “respira” gas: nell’area interna della
          Solfatara il flusso di <dfn>anidride carbonica</dfn> (CO₂) dal suolo è stimato intorno a 900 tonnellate al giorno, un
          valore elevato, paragonabile a quello di vulcani attivi che degassano in modo continuo. L’Osservatorio segnala che la
          composizione delle fumarole indica il perdurare di un riscaldamento e di una pressurizzazione del sistema idrotermale,
          ripresi dai primi mesi del 2022.
        </p>

        <h2>Livelli di allerta: a che punto siamo</h2>
        <p>
          Per i vulcani italiani ci sono quattro <dfn>livelli di allerta</dfn>: verde, giallo, arancione e rosso. Ai Campi
          Flegrei il livello è <strong>giallo</strong>, che l’Osservatorio descrive come “disequilibrio medio”: il vulcano mostra
          variazioni dei parametri rispetto al normale. Dal novembre 2025 la Protezione Civile ha adottato anche la “fase di
          attenzione”, mantenendo il livello giallo.
        </p>
        <p>
          Nel bollettino di settembre 2026 l’Osservatorio Vesuviano conclude che non ci sono elementi tali da suggerire
          significative evoluzioni a breve termine, e che eventuali cambiamenti saranno comunicati subito.
        </p>

        <h2>Ci sarà un’eruzione?</h2>
        <p>
          Nessuno può dirlo con certezza, e diffida di chi lo “prevede”. Bradisismo e terremoti non significano che
          un’eruzione sia imminente: a oggi non ci sono evidenze di risalita di magma. Ma è proprio per questo che la caldera è
          tra le aree più monitorate al mondo: 27 stazioni sismiche fisse a terra e in mare, più stazioni mobili, una rete GPS,
          misure dei gas e del calore, sensori sul fondo del golfo. Se i parametri indicassero una risalita di magma, il livello
          di allerta salirebbe e scatterebbero le misure del piano nazionale, che per la <dfn>zona rossa</dfn> prevede
          l’allontanamento preventivo della popolazione.
        </p>

        <h2>Se vivi ai Campi Flegrei</h2>
        <ul className="advice">
          <li>Scopri se la tua casa è nella zona rossa e qual è la tua area di attesa: chiedilo al Comune.</li>
          <li>Leggi le indicazioni della Protezione Civile su bradisismo e rischio vulcanico (link in fondo).</li>
          <li>
            Verifica con un tecnico lo stato della tua casa: con i terremoti superficiali la qualità dell’edificio fa la
            differenza.
          </li>
          <li>Segui solo le fonti ufficiali: Osservatorio Vesuviano, Protezione Civile, il tuo Comune.</li>
          <li>
            Durante una scossa vale quello che diciamo in <Link to="/cosa-fare">Cosa fare</Link>.
          </li>
        </ul>
        <p>
          Puoi seguire in tempo reale i terremoti dell’area in <Link to="/terremoti?vista=mappa&centro=40.827,14.139">Terremoti</Link>.
        </p>
      </>
    ),
    glossary: [
      ['Caldera', 'Grande depressione vulcanica nata dallo sprofondamento del tetto della camera magmatica.'],
      ['Bradisismo', 'Lento sollevamento o abbassamento del suolo (dal greco bradýs, “lento”).'],
      ['Sistema idrotermale', 'Acqua e gas caldi nel sottosuolo, riscaldati dal magma.'],
      ['Livello di allerta', 'Stato di attività di un vulcano: verde, giallo, arancione, rosso.'],
      ['Zona rossa', 'Area più esposta in caso di eruzione, per cui è previsto l’allontanamento preventivo.'],
      ['Md', 'Magnitudo di durata: si calcola da quanto dura il segnale sul sismogramma; usata per i terremoti vulcanici.'],
    ],
    sources: [
      OV_BOLLETTINO,
      { label: 'INGV – Osservatorio Vesuviano — I Campi Flegrei: inquadramento', href: 'https://www.ov.ingv.it/index.php/monitoraggio-sismico-e-vulcanico/campi-flegrei' },
      DPC_CF_TIMELINE,
      {
        label: 'Dipartimento della Protezione Civile — Pianificazione nazionale di emergenza per il rischio vulcanico ai Campi Flegrei',
        href: 'https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/la-pianificazione-nazionale-di-emergenza-il-rischio-vulcanico-i-campi-flegrei/',
      },
      { label: 'Io non rischio — Campi Flegrei: cosa sapere', href: 'https://iononrischio.protezionecivile.gov.it/it/preparati/vulcani/campi-flegrei/cosa-sapere/' },
      { label: 'INGV — Miscellanea INGV sulle crisi bradisismiche del 1970–72 e 1982–84', href: 'https://collane-editoriali.ingv.it/index.php/mi/article/view/171/pdf' },
      { label: 'INGV — catalogo dei terremoti, richiesta usata per i grafici', href: cf.richiesta },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'mal-da-terremoto',
    title: 'Il «mal da terremoto»',
    subtitle: 'Quando dopo una scossa sembra che la terra tremi ancora, anche se è ferma.',
    minutes: 3,
    summary: [
      'Dopo una scossa forte o una sequenza, a molte persone sembra che la terra tremi anche quando è ferma.',
      'Dopo i terremoti di Kumamoto (Giappone, 2016) è successo a 4 persone su 10 tra quelle che hanno risposto a uno studio.',
      'È un disturbo conosciuto, non immaginazione: di solito passa da solo nel giro di qualche settimana.',
    ],
    body: () => (
      <>
        <h2>Cosa si sente</h2>
        <p>
          Una sensazione di ondeggiare, come una piccola scossa, che dura pochi secondi e quasi sempre meno di un minuto.
          Capita soprattutto in casa, quando si è seduti o fermi: proprio quando si sentono meglio anche le scosse vere. Per
          questo è così difficile distinguerla. In Giappone i medici l’hanno chiamata{' '}
          <dfn>sindrome da capogiro post-terremoto</dfn> (in inglese post-earthquake dizziness syndrome).
        </p>

        <h2>Quanto è comune</h2>
        <p>
          Dopo i forti terremoti di Kumamoto, nel sud del Giappone, nel 2016 un gruppo di medici ha fatto un questionario: su{' '}
          {n(3656)} persone che hanno risposto, <strong>{n(1543)} (il 42%)</strong> avevano avuto questa sensazione. Di solito
          era comparsa entro una settimana dalla scossa ed era durata fino a qualche settimana.
        </p>

        <h2>A chi capita di più</h2>
        <p>Nello stesso studio era più frequente:</p>
        <ul className="advice">
          <li>in chi si sentiva più in ansia;</li>
          <li>in chi soffre di mal d’auto o di mal di mare;</li>
          <li>in chi abita dal terzo piano in su;</li>
          <li>nelle donne e negli adulti, più che nei ragazzi;</li>
          <li>in chi aveva fischi o la sensazione di orecchie tappate.</li>
        </ul>

        <h2>Perché succede</h2>
        <p>
          Non si sa ancora con certezza. L’ipotesi dei ricercatori è che il nostro <dfn>sistema dell’equilibrio</dfn>{' '}
          (orecchio interno, vista e sensazioni del corpo), dopo tante scosse, riceva segnali che non vanno d’accordo tra loro,
          e che lo stress faccia il resto. Non è debolezza e non vuol dire che stai esagerando.
        </p>

        <h2>Come capire se trema davvero</h2>
        <ul className="advice">
          <li>Guarda un lampadario, una pianta o l’acqua in un bicchiere: se restano fermi, di solito non sta tremando.</li>
          <li>Chiedi a chi è con te se l’ha sentita anche lui.</li>
          <li>
            Apri <Link to="/ho-sentito">Ho sentito una scossa</Link>: l’INGV registra anche le scosse più piccole e dopo
            pochi minuti le trovi lì.
          </li>
        </ul>

        <h2>Cosa può aiutare</h2>
        <ul className="advice">
          <li>Sapere che è normale aiuta già molto: capita a tantissime persone.</li>
          <li>Parlane con chi ti sta vicino: spesso scopri che succede anche a loro.</li>
          <li>
            Se la sensazione dura più di qualche settimana, se hai capogiri forti o se l’ansia non ti fa dormire, parlane con
            il tuo medico.
          </li>
        </ul>
      </>
    ),
    glossary: [
      ['Mal da terremoto', 'Sensazione che la terra tremi quando è ferma, dopo una scossa forte o una sequenza.'],
      ['Sistema dell’equilibrio', 'Orecchio interno, vista e sensazioni del corpo: insieme ci dicono se siamo fermi o ci muoviamo.'],
    ],
    sources: [
      {
        label:
          'Miwa T., Matsuyoshi H., Nomura Y., Minoda R. (2021). Post-earthquake dizziness syndrome following the 2016 Kumamoto earthquakes, Japan. PLOS ONE 16(8): e0255816',
        href: 'https://doi.org/10.1371/journal.pone.0255816',
      },
      { label: 'Nomura Y., Toi T. (2014). Post Earthquake Dizziness Syndrome. Equilibrium Research 73(3): 167–173', href: 'https://doi.org/10.3757/jser.73.167' },
    ],
  },
];
