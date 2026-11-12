import { Link } from 'react-router';
import { Car, ChevronRight, ClipboardList, DoorOpen, FileText, GraduationCap, House, Phone, Siren, TreePine, X, type LucideIcon } from 'lucide-react';
import { SpeakButton } from '../components/Actions';
import { ExternalLink, PageHeader } from '../components/ui';
import { PrepareSummary } from '../components/PrepareSummary';
import { ArticleQuestionLine } from '../learn/ArticleQuestions';

/**
 * Le fonti di questa pagina, numerate: ogni consiglio porta accanto il numero della fonte (o delle fonti) da cui viene.
 * Lette e confrontate il 12/11/2026. Regola: in questa pagina non entra nessun consiglio che non sia in una di queste
 * pagine ufficiali. Se una fonte cambia, cambia anche questo file. Quando le fonti dicono cose un po' diverse
 * («limitare» o «non usare» il telefono) teniamo la versione più prudente e citiamo entrambe.
 */
export const SOURCES: { n: number; label: string; url: string }[] = [
  { n: 1, label: 'Io non rischio (Protezione Civile) — Cosa fare: terremoto', url: 'https://iononrischio.protezionecivile.it/it/preparati/terremoto/cosa-fare/' },
  { n: 2, label: 'Dipartimento della Protezione Civile — Se arriva il terremoto', url: 'https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/' },
  { n: 3, label: 'Dipartimento della Protezione Civile — Rischio sismico. Sei preparato?', url: 'https://rischi.protezionecivile.it/it/sismico/sei-preparato/' },
  { n: 4, label: 'Ministero dell’Interno — Che cosa fare se si è coinvolti in un terremoto? I consigli dei Vigili del Fuoco', url: 'https://www.interno.gov.it/it/cosa-fare-e-coinvolti-terremoto' },
  { n: 5, label: 'AREU Lombardia (agenzia che gestisce il 112) — Domande frequenti sull’app del 112', url: 'https://www.areu.lombardia.it/web/home/faq-where-are-u' },
];

/** La scheda a simboli della Protezione Civile (citata nella fonte 3). */
const CAA_URL = 'https://www.protezionecivile.gov.it/static/e8131fdaea1248f821bcb3029623fb1e/scheda-caa-terremoto.pdf';

/** Un passo: l'azione in poche parole, poi il perché o il come, e le fonti. */
export interface Step {
  title: string;
  text: string;
  src: number[];
}

export interface Section {
  id: string;
  /** Sopra il titolo, piccolo: quando serve questa parte. */
  kicker: string;
  title: string;
  intro?: string;
  icon: LucideIcon;
  groups: { title?: string; icon?: LucideIcon; steps: Step[] }[];
  /** Le cose da evitare, in un riquadro a parte. */
  dont?: { text: string; src: number[] }[];
  /** Un link in fondo al riquadro «Da non fare». */
  dontLink?: { to: string; label: string };
}

/**
 * L'ordine segue i momenti in cui le persone aprono davvero questa pagina: subito dopo una scossa sentita (la parte
 * urgente, in cima), oppure in un giorno tranquillo, per imparare cosa fare durante la prossima e preparare la casa.
 */
export const SECTIONS: Section[] = [
  {
    id: 'dopo',
    kicker: 'Subito dopo',
    title: 'C’è appena stata una scossa?',
    intro: 'Fai queste cose in ordine, con calma. La maggior parte delle scosse non fa danni: questi passi servono per quelle forti.',
    icon: DoorOpen,
    groups: [
      {
        steps: [
          {
            title: 'Controlla come stanno le persone vicino a te',
            text: 'Se serve, presta i primi soccorsi. Se qualcuno è ferito o in pericolo, chiama il 112.',
            src: [1, 2, 3],
          },
          {
            title: 'Prima di uscire, chiudi gas, acqua e luce',
            text: 'I rubinetti del gas e dell’acqua e l’interruttore generale della luce.',
            src: [1, 3, 4],
          },
          {
            title: 'Senti odore di gas? Niente fiamme',
            text: 'Controlla dall’odore se c’è una perdita, senza accendere fiamme. Se c’è, apri porte e finestre e segnalala.',
            src: [4],
          },
          {
            title: 'Metti le scarpe ed esci con calma, dalle scale',
            text: 'Per strada possono esserci vetri rotti. Usa le scale, facendo attenzione perché possono essere danneggiate; se ci sono scale antincendio, usa quelle.',
            src: [1, 2, 3, 4],
          },
          {
            title: 'Vai in uno spazio aperto',
            text: 'L’area di attesa indicata dal piano di protezione civile del tuo Comune, oppure una piazza ampia, un giardino pubblico, un campo sportivo: posti dove i soccorsi arrivano facilmente. Non fermarti vicino a corsi d’acqua.',
            src: [1, 2, 3, 4],
          },
          {
            title: 'Ritrovati con i tuoi familiari',
            text: 'Nel punto di ritrovo che avete deciso, e restate uniti il più possibile.',
            src: [4],
          },
          {
            title: 'Usa telefono e auto solo se è davvero necessario',
            text: 'Le linee telefoniche e le strade servono ai soccorsi.',
            src: [1, 2, 3, 4],
          },
          {
            title: 'Vicino al mare, allontanati dalla spiaggia',
            text: 'Un terremoto può provocare onde molto alte. Raggiungi un posto elevato e resta lontano dalle spiagge per diverse ore.',
            src: [1, 2, 3, 4],
          },
        ],
      },
      {
        title: 'Nelle ore successive',
        steps: [
          {
            title: 'Non rientrare in una casa danneggiata',
            text: 'A meno che non ti accompagnino gli operatori dei soccorsi.',
            src: [4],
          },
          {
            title: 'Fai attenzione all’acqua e all’igiene',
            text: 'Se si sono rotte tubazioni o fognature, l’acqua potabile può essere inquinata.',
            src: [4],
          },
        ],
      },
    ],
    dont: [
      { text: 'Usare l’ascensore: può bloccarsi.', src: [1, 2, 3, 4] },
      { text: 'Accendere fiamme se c’è odore di gas.', src: [4] },
      { text: 'Rientrare in una casa danneggiata senza i soccorritori.', src: [4] },
    ],
    dontLink: { to: '/danni-casa', label: 'La casa ha delle crepe? Quando preoccuparsi e chi chiamare' },
  },
  {
    id: 'durante',
    kicker: 'Da imparare oggi',
    title: 'Cosa fare durante la scossa',
    intro: 'Una scossa dura pochi secondi: non c’è il tempo di leggere. Per questo conviene saperlo già. Il pericolo principale non è la scossa in sé, ma quello che crolla o cade.',
    icon: House,
    groups: [
      {
        title: 'Se sei in casa o in un altro luogo chiuso',
        icon: House,
        steps: [
          {
            title: 'Riparati nei punti più solidi',
            text: 'Nel vano di una porta in un muro portante (il più spesso), vicino a una parete portante, sotto una trave o in un angolo; oppure sotto un letto o un tavolo robusto.',
            src: [1, 2, 3, 4],
          },
          {
            title: 'Stai lontano da quello che può cadere',
            text: 'Al centro della stanza possono colpirti oggetti, pezzi di intonaco, controsoffitti, vetri, mobili.',
            src: [1, 2, 3, 4],
          },
          {
            title: 'Aspetta che la scossa finisca',
            text: 'Non precipitarti fuori. Poi esci come spiegato qui sopra, in «C’è appena stata una scossa?».',
            src: [1, 3],
          },
        ],
      },
      {
        title: 'Se sei all’aperto',
        icon: TreePine,
        steps: [
          {
            title: 'Allontanati da edifici, alberi, lampioni e linee elettriche',
            text: 'Possono cadere vasi, tegole e altri materiali.',
            src: [1, 2, 3],
          },
          {
            title: 'Non fermarti sotto balconi, cornicioni e grondaie',
            text: 'Non passarci nemmeno sotto. Se non puoi allontanarti, l’architrave di un portone è un buon riparo.',
            src: [4],
          },
          {
            title: 'Fai attenzione a ponti, frane e perdite di gas',
            text: 'Sono le altre conseguenze possibili di una scossa forte.',
            src: [1, 2, 3],
          },
        ],
      },
      {
        title: 'Se sei in auto',
        icon: Car,
        steps: [
          {
            title: 'Resta dentro l’auto',
            text: 'È un buon riparo, purché non sia ferma sotto edifici, viadotti, cartelloni pubblicitari o tralicci.',
            src: [4],
          },
        ],
      },
      {
        title: 'Se sei a scuola',
        icon: GraduationCap,
        steps: [
          {
            title: 'Riparati sotto il banco',
            text: 'Oppure addossati a un muro portante, in un punto lontano dalle finestre, che possono rompersi e ferire.',
            src: [4],
          },
        ],
      },
    ],
    dont: [
      { text: 'Precipitarti fuori mentre la terra trema.', src: [1, 3] },
      { text: 'Usare l’ascensore: può bloccarsi.', src: [2, 4] },
    ],
  },
];

/** «Fin da subito»: quello che la Protezione Civile consiglia di fare in un giorno qualunque. */
const PREPARE: { text: string; src: number[] }[] = [
  { text: 'Allontana i mobili pesanti da letti e divani e fissa alle pareti scaffali, librerie e mobili alti.', src: [1, 3] },
  { text: 'Appendi quadri e specchi con ganci chiusi, che non li lascino staccare dalla parete.', src: [1, 3] },
  { text: 'Metti gli oggetti pesanti sui ripiani bassi; su quelli alti puoi fissarli con nastro biadesivo.', src: [1, 3] },
  { text: 'In cucina, metti un fermo alle ante dei mobili con piatti e bicchieri, così non si aprono durante la scossa.', src: [1, 3] },
  { text: 'Impara dove sono e come si chiudono i rubinetti del gas e dell’acqua e l’interruttore generale della luce.', src: [1, 3] },
  { text: 'Tieni in casa una cassetta di pronto soccorso, una torcia, una radio a pile e le copie dei documenti, e fai in modo che tutti sappiano dove sono.', src: [1, 3] },
  { text: 'Scegli i punti sicuri della casa dove ripararti durante una scossa.', src: [1, 3] },
  { text: 'Informati sul piano di protezione civile del tuo Comune: dice dove sono le aree di attesa. Se il piano non c’è, chiedi che venga fatto.', src: [1, 3] },
  { text: 'Per rinforzare la casa (muri portanti, collegamenti tra pareti e solai) fatti consigliare da un tecnico esperto.', src: [1, 3] },
];

/** Il numero delle fonti di un consiglio, con il link all'elenco in fondo. */
function Src({ src }: { src: number[] }) {
  return (
    <span className="src">
      {src.length === 1 ? 'Fonte ' : 'Fonti '}
      {src.map((n, i) => (
        <span key={n}>
          {i > 0 && ', '}
          <a href={`#fonte-${n}`} aria-label={`Fonte ${n}: ${SOURCES.find((s) => s.n === n)?.label ?? ''}`}>
            {n}
          </a>
        </span>
      ))}
    </span>
  );
}

/** Il testo di una parte, per la lettura ad alta voce e per la ricerca (senza i numeri delle fonti). */
export const sectionText = (s: Section) =>
  [
    s.title,
    s.intro,
    ...s.groups.flatMap((g) => [g.title, ...g.steps.map((st) => `${st.title}. ${st.text}`)]),
    ...(s.dont?.length ? ['Da non fare:', ...s.dont.map((d) => d.text)] : []),
  ]
    .filter(Boolean)
    .join(' ');

function SafetySection({ s }: { s: Section }) {
  const Icon = s.icon;
  return (
    <section className="card stack safety" id={`sec-${s.id}`} tabIndex={-1} aria-labelledby={`sec-${s.id}-title`}>
      <div className="stack-sm">
        <p className="eyebrow">{s.kicker}</p>
        <h2 id={`sec-${s.id}-title`} className="icon-title">
          <Icon aria-hidden="true" />
          {s.title}
        </h2>
        {s.intro && <p className="muted">{s.intro}</p>}
      </div>
      {s.groups.map((g, i) => {
        const GroupIcon = g.icon;
        return (
          <div key={g.title ?? i} className="stack-sm">
            {g.title && (
              <h3 className="safety__group">
                {GroupIcon && <GroupIcon aria-hidden="true" />}
                {g.title}
              </h3>
            )}
            <ol className="steps">
              {g.steps.map((st) => (
                <li key={st.title}>
                  <span className="steps__title">{st.title}</span>
                  <span className="steps__text">
                    {st.text} <Src src={st.src} />
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
      {s.dont && (
        <div className="dont" role="note" aria-label="Da non fare">
          <p className="dont__title">Da non fare</p>
          <ul>
            {s.dont.map((d) => (
              <li key={d.text}>
                <X aria-hidden="true" />
                <span>
                  {d.text} <Src src={d.src} />
                </span>
              </li>
            ))}
          </ul>
          {s.dontLink && (
            <p className="dont__link">
              <Link to={s.dontLink.to}>{s.dontLink.label}</Link>
            </p>
          )}
        </div>
      )}
      <div>
        <SpeakButton label="Ascolta questi consigli" text={sectionText(s)} />
      </div>
    </section>
  );
}

const MORE: { to: string; title: string }[] = [
  { to: '/danni-casa', title: 'La casa ha dei danni: quando preoccuparsi e chi chiamare' },
  { to: '/e-vero', title: 'È vero? Le voci sui terremoti, con la risposta degli scienziati' },
  { to: '/capire', title: 'Capire i terremoti: articoli con dati veri e fonti' },
  { to: '/capire/glossario', title: 'Le parole della scienza: epicentro, replica, sciame…' },
];

export function SafetyPage() {
  const [dopo, durante] = SECTIONS;
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Cosa fare in caso di terremoto"
        intro="I consigli della Protezione Civile e dei Vigili del Fuoco, in ordine: prima quello che serve subito dopo una scossa, poi quello da imparare con calma. Accanto a ogni consiglio c’è il numero della fonte da cui viene."
      />

      <div className="stack-sm">
        <a href="tel:112" className="emergency">
          <Siren aria-hidden="true" />
          <span>
            <span className="emergency__title">Emergenza? Chiama il 112</span>
            <span>Numero unico per tutte le emergenze</span>
          </span>
          <Phone aria-hidden="true" />
        </a>
        <p className="small">
          Quando chiami, di’ subito dove ti trovi: la località e la via. <Src src={[5]} />
        </p>
      </div>

      {/* La pagina è lunga apposta: da qui si salta alla parte che serve. */}
      <nav className="jump" aria-label="In questa pagina">
        <a href="#sec-dopo">Subito dopo</a>
        <a href="#sec-durante">Durante la scossa</a>
        <a href="#sec-prima">Prepara la casa</a>
        <a href="#sec-simboli-title">Scheda a simboli</a>
        <a href="#safety-sources">Fonti</a>
      </nav>

      <SafetySection s={dopo} />

      <SafetySection s={durante} />

      <section className="card stack safety" id="sec-prima" tabIndex={-1} aria-labelledby="sec-prima-title">
        <div className="stack-sm">
          <p className="eyebrow">Da fare con calma</p>
          <h2 id="sec-prima-title" className="icon-title">
            <ClipboardList aria-hidden="true" />
            Prima di una scossa: prepara la casa
          </h2>
          <p className="muted">
            La sicurezza dipende soprattutto dalla casa in cui si vive. Queste sono le cose che si possono fare fin da subito,
            quasi tutte da soli. <Src src={[1, 3]} />
          </p>
        </div>
        <ul className="advice">
          {PREPARE.map((p) => (
            <li key={p.text}>{p.text}</li>
          ))}
        </ul>
        <p>Per farle una alla volta, senza dimenticarne nessuna, ci sono le missioni:</p>
        <PrepareSummary />
      </section>

      <section className="card stack" aria-labelledby="sec-simboli-title">
        <h2 id="sec-simboli-title" className="icon-title">
          <FileText aria-hidden="true" />
          Una scheda a simboli, per chi fa fatica a leggere
        </h2>
        <p>
          La Protezione Civile ha preparato una scheda con simboli e frasi brevi che spiega cosa fare durante e dopo un
          terremoto. È pensata anche per persone con disabilità intellettive o disturbi del linguaggio, per persone nello
          spettro autistico, per anziani e per chi ha difficoltà con i testi scritti in italiano. <Src src={[3]} />
        </p>
        <div>
          <ExternalLink href={CAA_URL} className="btn btn--secondary">
            Apri la scheda a simboli (PDF)
          </ExternalLink>
        </div>
      </section>

      <section className="stack-sm" aria-labelledby="safety-more">
        <h2 id="safety-more">Per saperne di più</h2>
        <ArticleQuestionLine slug="repliche-e-sequenze" lead="Dopo una scossa forte: " />
        <ul className="more-links">
          {MORE.map(({ to, title }) => (
            <li key={to}>
              <Link to={to}>
                <span>{title}</span>
                <ChevronRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack-sm learn-sources" aria-labelledby="safety-sources">
        <h2 id="safety-sources">Fonti</h2>
        <ol>
          {SOURCES.map((s) => (
            <li key={s.n} id={`fonte-${s.n}`} tabIndex={-1}>
              <ExternalLink href={s.url}>{s.label}</ExternalLink>
            </li>
          ))}
        </ol>
        <p className="small muted">
          Consigli letti e confrontati sulle pagine ufficiali il 12 novembre 2026. In questa pagina non c’è nessun consiglio
          che non venga da una di queste fonti. Segui sempre le indicazioni del tuo Comune e dei soccorritori.
        </p>
      </section>
    </div>
  );
}
