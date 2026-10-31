/**
 * «Il mal da terremoto», articolo «a strati»: In 30 secondi → Cosa si sente e cosa fare → Cosa dice la ricerca →
 * Per chi vuole andare a fondo. I numeri vengono dagli studi citati in fondo (letti per intero dove sono ad accesso
 * aperto); il grafico su Norcia usa il catalogo INGV e la formula dell'intensità del sito.
 * Non è un testo medico: descrive cosa si sa e indica quando rivolgersi al medico o al 112.
 */
import { Link } from 'react-router';
import type { Article } from './articles';
import { Part } from './LearnPart';
import { NorciaFeltChart, RiskFactorsChart, SwayChart, swayIncrease } from './figures4';

export const MAL_ARTICLE: Article = {
  slug: 'mal-da-terremoto',
  title: 'Il «mal da terremoto»',
  subtitle: 'Quando sembra che la terra tremi ancora, anche se è ferma: cosa sappiamo, perché succede, cosa fare.',
  minutes: 9,
  summaryTitle: 'In 30 secondi',
  summary: [
    'Dopo una scossa forte o una lunga sequenza, a tante persone sembra che la terra tremi anche quando è ferma. Dopo i terremoti di Kumamoto, in Giappone, è successo a 4 persone su 10.',
    'Non è immaginazione e non è debolezza: dopo mesi di repliche cambia, in modo misurabile, anche il modo in cui il corpo tiene l’equilibrio. Di solito passa da solo in qualche settimana.',
    'Per capire se trema davvero, guarda un oggetto appeso, chiedi a chi è con te o apri «Ho sentito una scossa». Se dura da mesi o non ti fa dormire, parlane con il medico.',
  ],
  body: () => (
    <>
      {/* ---------------- 1. Cosa si sente e cosa fare ---------------- */}
      <Part n={1} kicker="Cosa si sente e cosa fare">
        «Ma sta tremando?»
      </Part>
      <p>
        Sei seduto sul divano, o a letto, e senti un leggero ondeggiare. Ti fermi, trattieni il respiro, guardi il lampadario:
        è immobile. Passa qualche secondo, quasi sempre meno di un minuto, e tutto torna normale. Dopo un terremoto forte,
        questa scena si ripete a tantissime persone, anche per settimane.
      </p>
      <p>
        I medici giapponesi le hanno dato un nome dopo il grande terremoto del 2011: <dfn>sindrome da capogiro
        post-terremoto</dfn> (in inglese <em>post-earthquake dizziness syndrome</em>). Noi la chiamiamo «mal da terremoto»,
        perché somiglia molto a una cosa che conoscono tutti quelli che sono stati in barca: il <dfn>mal di sbarco</dfn>, la
        sensazione di dondolare ancora quando si è già a terra.
      </p>

      <h3>Come capire se trema davvero</h3>
      <ul className="advice">
        <li>
          <strong>Se trema forte, non perdere tempo a capirlo:</strong> proteggiti come per una scossa vera (lo spieghiamo in{' '}
          <Link to="/cosa-fare">Cosa fare</Link>). Se era il mal da terremoto, non hai perso niente.
        </li>
        <li>Se è un movimento leggero, guarda qualcosa di appeso o di liquido: un lampadario, una pianta, l’acqua in un bicchiere.</li>
        <li>Chiedi a chi è con te se l’ha sentito anche lui.</li>
        <li>
          Dopo qualche minuto apri <Link to="/ho-sentito">Ho sentito una scossa</Link>: l’INGV registra anche le scosse più
          piccole e lì vedi se ce n’è stata una vicino a te.
        </li>
      </ul>

      <h3>Cosa può aiutare</h3>
      <ul className="advice">
        <li>Sapere che è comune. Capita a tantissime persone, e spesso basta parlarne per scoprire che succede anche ai vicini.</li>
        <li>
          Tenere i propri ritmi: dormire, mangiare, uscire, muoversi. L’equilibrio si «ricalibra» meglio quando si fa vita
          normale.
        </li>
        <li>
          Controllare le scosse, sì, ma senza farne un’ossessione: se ti accorgi di guardare il telefono ogni pochi minuti,
          prova a darti degli orari. Le informazioni importanti non scappano.
        </li>
      </ul>

      <h3>Quando parlarne con il medico, e quando chiamare il 112</h3>
      <ul className="advice">
        <li>
          <strong>Parlane con il medico</strong> se la sensazione dura da più di qualche settimana, se ti fa cadere o barcollare,
          se senti girare tutto intorno (la vera vertigine), se senti meno da un orecchio o se l’ansia non ti fa dormire.
        </li>
        <li>
          <strong>Chiama subito il 112</strong> se il capogiro arriva all’improvviso insieme ad altri disturbi: bocca storta,
          debolezza di un braccio o di una gamba, difficoltà a parlare o a capire, vista che si annebbia, un mal di testa
          fortissimo mai provato prima. Questi non sono segni del mal da terremoto: possono essere un ictus, e ogni minuto
          conta.
        </li>
      </ul>

      {/* ---------------- 2. Cosa dice la ricerca ---------------- */}
      <Part n={2} kicker="Cosa dice la ricerca">
        Quattro cose che gli studi hanno scoperto
      </Part>
      <p>
        Il mal da terremoto è stato studiato soprattutto in Giappone e, dopo il 2023, in Turchia. In Italia, per quanto
        abbiamo trovato, non ci sono ancora studi pubblicati: i numeri qui sotto vengono da lì, ma descrivono un fenomeno che
        chi ha vissuto le sequenze di L’Aquila, del Centro Italia o dei Campi Flegrei potrebbe riconoscere.
      </p>

      <h3>1. È molto comune</h3>
      <p>
        Dopo i terremoti di Kumamoto, nel sud del Giappone, nell’aprile 2016, un gruppo di otorinolaringoiatri ha fatto un
        questionario: su 3.656 persone che hanno risposto, <strong>1.543 (il 42%)</strong> avevano avuto la sensazione che il
        corpo ondeggiasse. Di solito era comparsa entro una settimana dalla scossa, era durata fino a qualche settimana e
        capitava soprattutto in casa: proprio dove si sentono meglio anche le scosse vere.
      </p>

      <h3>2. Non è un errore di chi «sente scosse che ci sono»</h3>
      <p>
        Si potrebbe pensare: forse quelle persone sentivano repliche vere. Gli autori lo hanno controllato. Nelle cinque zone
        della provincia il numero di repliche era diverso, ma la percentuale di persone con il mal da terremoto no. Non
        dipendeva neanche dal tipo di casa, in legno o in cemento. Dipendeva invece da chi la provava.
      </p>
      <RiskFactorsChart />
      <p>
        Il fattore più forte è l’ansia: chi si sentiva in ansia aveva circa il triplo delle probabilità di provarlo. Contano
        anche l’età adulta, l’essere donna, i piani alti (dove gli edifici oscillano di più), i disturbi dell’orecchio e
        l’abitudine a soffrire il mal d’auto o di mare. Quest’ultimo è un indizio importante: il mal da terremoto ha a che fare
        con il <dfn>sistema dell’equilibrio</dfn>.
      </p>

      <h3>3. L’equilibrio cambia davvero, anche in chi non se ne accorge</h3>
      <p>
        Lo studio più sorprendente è del 2011. Quattro mesi dopo il grande terremoto del Giappone, alcuni ricercatori hanno
        confrontato studenti universitari di Tokyo, dove le repliche erano state continue, e di Osaka, dove non se ne erano
        quasi sentite. Nessuno aveva capogiri, e ansia, umore e sonno erano simili nei due gruppi. Eppure, stando in piedi a
        occhi chiusi, gli studenti di Tokyo oscillavano su un’area di circa il {Math.round(swayIncrease * 100)}% più grande.
      </p>
      <SwayChart />
      <p>
        Mesi di piccole scosse, insomma, lasciano un segno misurabile nel modo in cui il corpo sta in piedi. Con gli occhi
        aperti la vista compensa e non ce ne accorgiamo; quando siamo fermi, al buio o sdraiati, il segno può farsi sentire.
      </p>

      <h3>4. Di solito passa, ma non sempre in fretta</h3>
      <p>
        A Kumamoto per la maggior parte delle persone durava qualche settimana. In Turchia, dopo i terremoti del febbraio 2023,
        uno studio su 551 ragazzi tra 11 e 18 anni ha trovato che il 73% l’aveva provato e il 19% lo provava ancora più di un
        anno dopo. Attenzione però: quei ragazzi erano seguiti da ambulatori di psichiatria infantile, quindi non sono un
        campione di tutti i ragazzi. La sensazione durava di più in chi aveva più ansia, sintomi da stress post-traumatico o
        era ai piani alti durante la scossa.
      </p>

      <h3>Perché è così difficile capire se trema davvero</h3>
      <p>
        Durante una sequenza le scosse vere ci sono, eccome. Abbiamo stimato quante se ne sono sentite chiaramente in casa a
        Norcia dopo il 24 agosto 2016, settimana per settimana.
      </p>
      <NorciaFeltChart />
      <p>
        Nella prima settimana si sentivano più scosse al giorno; poi, per settimane, pochissime; poi di nuovo più di duecento in
        una sola settimana, quella del 30 ottobre. Il nostro «allarme interno» non sa mai quando può riposare. È comprensibile che, nelle settimane
        tranquille, scatti anche quando non c’è niente.
      </p>

      {/* ---------------- 3. Per chi vuole andare a fondo ---------------- */}
      <Part n={3} kicker="Per chi vuole andare a fondo">
        Perché succede: tre ipotesi, e i limiti degli studi
      </Part>
      <div className="learn-deep stack">
        <h3>L’equilibrio è un lavoro di squadra</h3>
        <p>
          Per sapere se siamo fermi il cervello mette insieme tre fonti: l’<dfn>orecchio interno</dfn> (il sistema vestibolare,
          che sente accelerazioni e rotazioni), la <strong>vista</strong> e le sensazioni di piedi, muscoli e articolazioni.
          Quando le tre fonti non vanno d’accordo, nasce il capogiro: è lo stesso meccanismo del mal d’auto. Le cause del mal
          da terremoto non sono ancora certe, ma i ricercatori indicano tre ingredienti, che probabilmente si sommano.
        </p>
        <ul className="advice">
          <li>
            <strong>Un equilibrio che si è adattato al movimento.</strong> Come nel mal di sbarco, il cervello si abitua a un
            movimento di fondo e, quando il movimento finisce, ci mette un po’ a «tornare a terra». Brevi episodi di mal di
            sbarco sono comuni anche nelle persone sane (Cha, 2009); un’ipotesi è che riguardi un meccanismo dell’orecchio
            interno e del cervelletto che «tiene a mente» il movimento per qualche secondo (Cohen e altri, 2018).
          </li>
          <li>
            <strong>Un allarme diventato più sensibile.</strong> Dopo un terremoto il cervello, giustamente, preferisce un falso
            allarme a una scossa non vista. Ma un allarme più sensibile scatta anche per un camion che passa, per il battito del
            cuore sentito da sdraiati, per un piccolo capogiro. È coerente con il fatto che l’ansia sia il fattore più forte.
          </li>
          <li>
            <strong>Il corpo sotto stress.</strong> Sonno disturbato, stanchezza, sbalzi di pressione alzandosi in piedi: a
            Kumamoto, nei pazienti visitati in ambulatorio, anche i test del sistema nervoso autonomo e dell’orecchio interno
            erano peggiorati dopo i terremoti, e i pazienti con disturbi dell’equilibrio erano 2,8 volte più numerosi di prima
            (Miwa, 2021).
          </li>
        </ul>

        <h3>Quando non passa: la PPPD</h3>
        <p>
          Per una piccola parte delle persone il senso di instabilità può durare mesi. Se è presente quasi tutti i giorni da
          almeno tre mesi e peggiora stando in piedi, muovendosi o guardando cose in movimento, i medici possono riconoscere
          un disturbo con un nome preciso: <dfn>PPPD</dfn>, capogiro posturale-percettivo persistente (Staab e altri, 2017). Può
          partire da un evento che ha disturbato l’equilibrio o da un forte stress. È un disturbo «funzionale»: non è una
          lesione e non è una malattia psichiatrica, è il sistema dell’equilibrio che resta in modalità allarme. Si può curare,
          per esempio con esercizi di riabilitazione dell’equilibrio: per questo vale la pena parlarne con il medico, che può
          indirizzare a un otorinolaringoiatra o a un neurologo.
        </p>

        <h3>I limiti degli studi</h3>
        <ul className="advice">
          <li>
            Sono quasi tutti questionari: dicono quante persone riferiscono il disturbo, non quante lo avrebbero avuto
            comunque.
          </li>
          <li>
            Il confronto con le repliche a Kumamoto si basa su sole cinque zone: gli stessi autori dicono che il test è debole.
          </li>
          <li>
            Lo studio di Tokyo e Osaka riguarda 101 giovani universitari, quattro mesi dopo un terremoto con tsunami e
            incidente nucleare: non sappiamo quanto il risultato valga, per esempio, per un anziano dopo una sequenza italiana.
          </li>
          <li>
            Lo studio turco riguarda ragazzi già seguiti da servizi di psichiatria: le percentuali sono probabilmente più alte
            di quelle di tutta la popolazione.
          </li>
          <li>In Italia mancano studi: è un tema su cui la ricerca italiana avrebbe molto da dire.</li>
        </ul>

        <h3>Come abbiamo fatto il grafico di Norcia</h3>
        <p>
          Abbiamo preso dal catalogo INGV le scosse di magnitudo 2,5 o più entro 40 km da Norcia, dal 24 agosto 2016 a fine
          febbraio 2017, e per ognuna abbiamo stimato l’intensità a Norcia con la formula di Allen, Wald e Worden (2012), la
          stessa che il sito usa per dirti se una scossa si è sentita a casa tua. Abbiamo contato quelle con intensità 3 o
          più, cioè avvertite chiaramente in casa da molte persone. Le scosse sotto magnitudo 2,5 non sono nel conto: il
          numero vero era più alto. Il calcolo si fa nel tuo browser, con gli stessi dati della mappa animata della sequenza.
        </p>
      </div>
    </>
  ),
  glossary: [
    ['Mal da terremoto', 'Sensazione che la terra tremi quando è ferma, dopo una scossa forte o una sequenza. In medicina: sindrome da capogiro post-terremoto (PEDS).'],
    ['Mal di sbarco', 'Sensazione di dondolare che resta dopo essere scesi da una barca o da un treno. In medicina: mal de débarquement.'],
    ['Sistema vestibolare', 'La parte dell’orecchio interno che sente accelerazioni e rotazioni della testa. Con vista e sensazioni del corpo ci dice se siamo fermi.'],
    ['Odds ratio', 'Di quanto un fattore aumenta la probabilità di un evento rispetto a chi non ce l’ha. 1 vuol dire nessuna differenza, 3 circa il triplo.'],
    ['Stabilometria', 'Misura delle piccole oscillazioni del corpo stando fermi in piedi su una pedana sensibile.'],
    ['PPPD', 'Capogiro posturale-percettivo persistente: senso di instabilità quasi quotidiano da almeno tre mesi. È un disturbo funzionale e si può curare.'],
  ],
  sources: [
    {
      label: 'Miwa T., Matsuyoshi H., Nomura Y., Minoda R. (2021). Post-earthquake dizziness syndrome following the 2016 Kumamoto earthquakes, Japan. PLOS ONE 16(8): e0255816',
      href: 'https://doi.org/10.1371/journal.pone.0255816',
    },
    {
      label: 'Honma M., Endo N., Osada Y., Kim Y., Kuriyama K. (2012). Disturbances in equilibrium function after major earthquake. Scientific Reports 2: 749',
      href: 'https://doi.org/10.1038/srep00749',
    },
    {
      label: 'Miwa T. (2021). Vestibular function after the 2016 Kumamoto earthquakes: a retrospective chart review. Frontiers in Neurology 11: 626613',
      href: 'https://doi.org/10.3389/fneur.2020.626613',
    },
    {
      label: 'Bozduman Çelebi S. e altri (2024). Identifying predictors of persistent post-earthquake dizziness among adolescents after the 2023 earthquakes in Türkiye. Auris Nasus Larynx 51',
      href: 'https://doi.org/10.1016/j.anl.2024.10.013',
    },
    { label: 'Nomura Y., Toi T. (2014). Post Earthquake Dizziness Syndrome. Equilibrium Research 73(3): 167–173', href: 'https://doi.org/10.3757/jser.73.167' },
    { label: 'Cha Y.-H. (2009). Mal de debarquement. Seminars in Neurology 29(5): 520–527', href: 'https://doi.org/10.1055/s-0029-1241038' },
    {
      label: 'Cohen B., Yakushin S. B., Cho C. (2018). Hypothesis: the vestibular and cerebellar basis of the mal de debarquement syndrome. Frontiers in Neurology 9: 28',
      href: 'https://doi.org/10.3389/fneur.2018.00028',
    },
    {
      label: 'Staab J. P. e altri (2017). Diagnostic criteria for persistent postural-perceptual dizziness (PPPD): consensus document of the Bárány Society. Journal of Vestibular Research 27(4): 191–208',
      href: 'https://doi.org/10.3233/VES-170622',
    },
    {
      label: 'Allen T. I., Wald D. J., Worden C. B. (2012). Intensity attenuation for active crustal regions. Journal of Seismology 16',
      href: 'https://doi.org/10.1007/s10950-012-9278-7',
    },
    { label: 'ISSalute (Istituto Superiore di Sanità) — Ictus: sintomi e cosa fare', href: 'https://www.issalute.it/index.php/la-salute-dalla-a-alla-z-menu/i/ictus' },
  ],
  dataNote: (
    <>
      Il grafico su Norcia usa il catalogo INGV (licenza CC BY 4.0), lo stesso file della mappa animata della sequenza
      (<code>scripts/build-sequence-data.mjs</code>), e la formula dell’intensità del sito (<code>src/lib/impact.ts</code>). Gli
      altri grafici riportano i numeri pubblicati negli studi citati.
    </>
  ),
};
