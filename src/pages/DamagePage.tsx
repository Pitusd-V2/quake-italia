import { Link } from 'react-router';
import { BedDouble, Camera, ClipboardCheck, LifeBuoy, Phone, ShieldAlert, Siren, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { SpeakButton } from '../components/Actions';
import { ExternalLink, Notice, PageHeader } from '../components/ui';

interface Section {
  id: string;
  title: string;
  icon: ReactNode;
  groups: { title?: string; items: string[] }[];
}

/*
 * Indicazioni tratte dalle pagine del Dipartimento della Protezione Civile e da «Io non rischio» (fonti in fondo).
 * Niente diagnosi tecniche e niente allarmi inutili: le crepe sottili sono comuni, i segnali seri sono pochi e
 * riconoscibili da chiunque. Solo per quelli vale la regola: esci e fai controllare.
 */
const SECTIONS: Section[] = [
  {
    id: 'sicurezza',
    title: 'Crepe e danni: quando preoccuparsi',
    icon: <ShieldAlert aria-hidden="true" />,
    groups: [
      {
        title: 'Crepe sottili nell’intonaco: di solito niente di grave',
        items: [
          'Crepe sottili come un capello, agli angoli delle stanze, sopra porte e finestre o tra muro e soffitto, sono comuni dopo una scossa e spesso riguardano solo l’intonaco.',
          'Fotografale con una moneta accanto, per avere la misura, e segna la data: così vedi se cambiano.',
          'Se con le scosse successive si allargano, si allungano o ne compaiono altre, chiedi un controllo.',
        ],
      },
      {
        title: 'Segnali seri: esci con calma e fai controllare la casa prima di rientrare',
        items: [
          'Crepe larghe (ci entra una moneta) o che attraversano il muro da parte a parte.',
          'Crepe su pilastri, travi o muri portanti, oppure muri gonfiati o staccati tra loro.',
          'Pezzi di soffitto caduti, tegole o comignoli spostati.',
          'Porte e finestre che non si aprono o non si chiudono più come prima.',
          'Pavimenti che si sono abbassati o sembrano inclinati, scale danneggiate.',
        ],
      },
      {
        title: 'Non sei sicuro?',
        items: [
          'Chiedi un parere al Comune o a un tecnico di fiducia. Mandargli le foto è spesso un buon primo passo.',
          'Nel frattempo, se fuori casa ti senti più tranquillo, va bene così: non è esagerare.',
        ],
      },
      {
        title: 'Se senti odore di gas',
        items: [
          'Non accendere fiamme, luci o interruttori.',
          'Apri porte e finestre ed esci. Se puoi farlo senza rischi, chiudi il gas al contatore.',
          'Avvisa i Vigili del Fuoco chiamando il 112.',
        ],
      },
      {
        title: 'Piccoli lavori sì, quelli grandi no',
        items: [
          'Puoi rimettere a posto gli oggetti caduti e pulire i calcinacci piccoli.',
          'Una crepa sottile dell’intonaco si può stuccare, ma aspetta che le scosse si calmino: se la copri subito non vedi più se si allarga.',
          'Tetto, comignoli, muri portanti, travi, pilastri e scale vanno lasciati a un tecnico. Non salire sul tetto dopo una scossa: tegole e comignoli possono muoversi.',
          'Se hai visto segnali seri, ricorda che una casa già danneggiata sopporta peggio le scosse successive: nel dubbio, resta fuori.',
        ],
      },
    ],
  },
  {
    id: 'chiamare',
    title: 'Chi chiamare',
    icon: <Phone aria-hidden="true" />,
    groups: [
      {
        title: 'Pericolo subito: crolli, persone ferite o bloccate, gas, parti che stanno per cadere',
        items: ['Chiama il 112, il numero unico di emergenza: è gratuito e funziona anche senza credito.'],
      },
      {
        title: 'Danni, ma nessun pericolo immediato',
        items: [
          'Rivolgiti al tuo Comune: dopo un terremoto con danni è il Comune che raccoglie le richieste di sopralluogo, spesso con un modulo.',
          'Segui il sito e i canali ufficiali del Comune: lì trovi come fare la richiesta ed eventuali scadenze.',
        ],
      },
      {
        title: 'Vuoi un parere in tempi brevi',
        items: [
          'Puoi chiamare un tecnico di fiducia (ingegnere, architetto o geometra). Il suo controllo è a pagamento e non sostituisce le verifiche organizzate dal Comune.',
        ],
      },
    ],
  },
  {
    id: 'documenti',
    title: 'Foto, ricevute, assicurazione',
    icon: <Camera aria-hidden="true" />,
    groups: [
      {
        items: [
          'Fai foto e video dei danni prima di spostare o riparare qualcosa, ma solo da un punto sicuro: non rientrare apposta.',
          'Conserva le ricevute delle spese urgenti, per esempio per mettere in sicurezza la casa o per dormire altrove.',
          'Se hai un’assicurazione sulla casa che copre il terremoto, avvisala il prima possibile.',
        ],
      },
    ],
  },
  {
    id: 'altrove',
    title: 'Se non puoi tornare a casa',
    icon: <BedDouble aria-hidden="true" />,
    groups: [
      {
        items: [
          'Raggiungi le aree di attesa previste dal piano di protezione civile del tuo Comune: lì ricevi le prime informazioni e assistenza.',
          'Il Comune e la Protezione Civile organizzano dove dormire, con soluzioni diverse a seconda dell’evento.',
          'Se in famiglia c’è chi ha bisogno di un aiuto particolare (persone anziane, con disabilità o malate), dillo subito al Comune.',
          'Se la tua casa principale è stata sgomberata e trovi da solo dove stare (in affitto o da parenti), la Protezione Civile può prevedere un contributo mensile: il contributo di autonoma sistemazione (CAS). Regole e importi cambiano da un terremoto all’altro; la domanda si fa al Comune.',
        ],
      },
    ],
  },
  {
    id: 'attenzione',
    title: 'Attenzione',
    icon: <TriangleAlert aria-hidden="true" />,
    groups: [
      {
        items: [
          'Diffida di chi si presenta come tecnico senza essere mandato dal Comune: chiedi sempre un documento e, nel dubbio, chiama il Comune.',
          'Prima di firmare contratti per lavori, fatti consigliare da un tecnico di fiducia.',
          'Le informazioni giuste sugli aiuti arrivano da Comune, Regione e Protezione Civile, non dai messaggi che girano sui social.',
          'Se tu o un familiare siete molto scossi, non tenerlo per te: parlane con il tuo medico o chiedi al Comune. Dopo i terremoti forti è previsto anche un supporto psicologico.',
        ],
      },
    ],
  },
];

/* Esiti della scheda AeDES, con le definizioni del Dipartimento della Protezione Civile dette in modo semplice. */
const OUTCOMES: { code: string; text: string }[] = [
  { code: 'A', text: 'Agibile: si può usare tutta, senza pericolo per chi ci abita.' },
  { code: 'B', text: 'Si potrà usare dopo piccoli lavori di messa in sicurezza, veloci da fare.' },
  { code: 'C', text: 'Solo alcune parti sono pericolose e non si possono usare.' },
  { code: 'D', text: 'Il tecnico non è sicuro: serve un controllo più approfondito. Fino ad allora non si usa.' },
  { code: 'E', text: 'Inagibile: ha danni seri e per ripararla serve il progetto di un tecnico.' },
  {
    code: 'F',
    text: 'Inagibile per un pericolo esterno, per esempio un edificio vicino che rischia di crollare, anche se la casa in sé ha pochi danni.',
  },
];

const speak = (s: Section) => `${s.title}. ${s.groups.map((g) => `${g.title ? `${g.title}. ` : ''}${g.items.join(' ')}`).join(' ')}`;

function SectionCard({ s }: { s: Section }) {
  return (
    <section className="card stack" aria-labelledby={`sec-${s.id}`}>
      <h2 id={`sec-${s.id}`} className="icon-title">
        {s.icon}
        {s.title}
      </h2>
      {s.groups.map((g, i) => (
        <div key={i} className="stack-sm">
          {g.title && <h3>{g.title}</h3>}
          <ul className="advice">
            {g.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <SpeakButton label="Ascolta" text={speak(s)} />
      </div>
    </section>
  );
}

export function DamagePage() {
  const [safety, call, ...rest] = SECTIONS;
  return (
    <div className="container stack-lg">
      <PageHeader
        title="La casa ha dei danni: cosa fare"
        intro="Dopo una scossa forte: come capire se è meglio uscire, chi chiamare, come funziona il controllo della casa e quali aiuti esistono. Un passo alla volta."
      />

      <a href="tel:112" className="emergency">
        <Siren aria-hidden="true" />
        <span>
          <span className="emergency__title">Pericolo? Chiama il 112</span>
          <span>Crolli, persone ferite o bloccate, odore di gas</span>
        </span>
        <Phone aria-hidden="true" />
      </a>

      <Notice tone="info" title="Ogni terremoto ha le sue regole">
        <p>Moduli, scadenze e aiuti cambiano da un evento all’altro: per il tuo caso fanno fede le indicazioni del tuo Comune.</p>
      </Notice>

      <SectionCard s={safety} />
      <SectionCard s={call} />

      <section className="card stack" aria-labelledby="sec-sopralluogo">
        <h2 id="sec-sopralluogo" className="icon-title">
          <ClipboardCheck aria-hidden="true" />
          Come funziona il controllo della casa
        </h2>
        <p>
          Dopo un terremoto forte, prima arrivano controlli veloci (spesso dei Vigili del Fuoco) per capire quali case si possono
          usare subito. Poi, dove serve, tecnici preparati fanno un controllo più accurato con una scheda ufficiale che si chiama{' '}
          <span className="strong">AeDES</span>. Alla fine la casa riceve un esito, indicato con una lettera:
        </p>
        <dl className="glossary">
          {OUTCOMES.map((o) => (
            <div key={o.code}>
              <dt>Esito {o.code}</dt>
              <dd>{o.text}</dd>
            </div>
          ))}
        </dl>
        <p>Se la casa non è agibile, il Sindaco può ordinarne lo sgombero. Si rientra solo quando il Comune lo consente.</p>
        <div>
          <SpeakButton
            label="Ascolta"
            text={`Come funziona il controllo della casa. ${OUTCOMES.map((o) => `Esito ${o.code}: ${o.text}`).join(' ')}`}
          />
        </div>
      </section>

      {rest.map((s) => (
        <SectionCard key={s.id} s={s} />
      ))}

      <Link to="/cosa-fare" className="tip">
        <LifeBuoy aria-hidden="true" />
        <span>
          <span className="strong">Cosa fare durante e subito dopo una scossa</span>
          <span className="muted"> I consigli della campagna «Io non rischio».</span>
        </span>
      </Link>

      <section className="stack-sm learn-sources" aria-labelledby="damage-sources">
        <h2 id="damage-sources">Fonti</h2>
        <ol>
          <li>
            <ExternalLink href="https://www.protezionecivile.gov.it/it/approfondimento/se-arriva-il-terremoto/">
              Dipartimento della Protezione Civile — Se arriva il terremoto
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.protezionecivile.gov.it/it/approfondimento/scheda-aedes/">
              Dipartimento della Protezione Civile — La scheda AeDES
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://emergenze.protezionecivile.gov.it/en/seismic/emilia-romagna-and-lombardy-earthquake-2012/safety-checks/">
              Dipartimento della Protezione Civile — Terremoto Emilia 2012, verifiche di agibilità ed esiti A–F (in inglese)
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://emergenze.protezionecivile.gov.it/it/sismiche/terremoto-centro-italia-2016/verifiche-di-agibilita/">
              Dipartimento della Protezione Civile — Terremoto Centro Italia 2016, verifiche di agibilità
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://domande-risposte.protezionecivile.gov.it/it/approfondimento/terremoto-centro-italia-chiarimenti-cas/">
              Dipartimento della Protezione Civile — Chiarimenti sul contributo di autonoma sistemazione (CAS)
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://iononrischio.protezionecivile.it/">Io non rischio — campagna di comunicazione sui rischi</ExternalLink>
          </li>
        </ol>
      </section>
    </div>
  );
}
