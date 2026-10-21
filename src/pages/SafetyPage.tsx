import { Link } from 'react-router';
import { BookOpen, ClipboardList, House, MessageCircleWarning, Phone, Siren, TreePine } from 'lucide-react';
import type { ReactNode } from 'react';
import { SpeakButton } from '../components/Actions';
import { ExternalLink, PageHeader } from '../components/ui';

interface Section {
  id: string;
  title: string;
  icon: ReactNode;
  groups: { title?: string; items: string[] }[];
}

/* Consigli tratti dalle indicazioni pubbliche della Protezione Civile ("Io non rischio"). */
const SECTIONS: Section[] = [
  {
    id: 'durante',
    title: 'Durante la scossa',
    icon: <House aria-hidden="true" />,
    groups: [
      {
        title: 'Se sei in casa o in un edificio',
        items: [
          'Resta calmo. Mettiti vicino a un muro portante, sotto una trave o sotto un tavolo robusto.',
          'Stai lontano da finestre, vetri, armadi e mobili che possono cadere.',
          'Non usare l’ascensore e non correre verso le scale: aspetta che la scossa finisca.',
        ],
      },
      {
        title: 'Se sei all’aperto',
        items: [
          'Allontanati da edifici, alberi, lampioni e linee elettriche.',
          'Attenzione a cornicioni, vetri e tegole che possono cadere.',
          'Se sei in auto, fermati lontano da ponti, cavalcavia ed edifici e resta dentro fino alla fine della scossa.',
        ],
      },
    ],
  },
  {
    id: 'dopo',
    title: 'Subito dopo',
    icon: <TreePine aria-hidden="true" />,
    groups: [
      {
        items: [
          'Controlla come stanno le persone vicino a te. Non spostare chi è ferito gravemente: chiama il 112.',
          'Esci con prudenza, con le scarpe ai piedi, senza usare l’ascensore.',
          'Se senti odore di gas non accendere fiamme né interruttori. Se puoi, chiudi gas, acqua e luce.',
          'Raggiungi le aree di attesa indicate dal tuo Comune e segui le indicazioni delle autorità.',
          'Usa il telefono solo per le emergenze, per non bloccare le linee. Ascolta la radio o le notizie ufficiali.',
          'Possono arrivare altre scosse (repliche): non rientrare in edifici danneggiati.',
        ],
      },
    ],
  },
  {
    id: 'prima',
    title: 'Prepararsi prima, con calma',
    icon: <ClipboardList aria-hidden="true" />,
    groups: [
      {
        items: [
          'Chiedi al tuo Comune qual è l’area di attesa più vicina a casa (piano di protezione civile).',
          'Fissa ai muri i mobili alti e pesanti. Non tenere oggetti pesanti sugli scaffali in alto.',
          'Impara dove sono e come si chiudono gas, acqua e luce.',
          'Tieni in un posto facile da raggiungere: torcia, radio a pile, kit di pronto soccorso, acqua, medicine e documenti.',
          'Decidi con la famiglia un punto dove ritrovarvi.',
        ],
      },
    ],
  },
];

const GLOSSARY: { term: string; text: string }[] = [
  { term: 'Magnitudo', text: 'Misura quanta energia ha liberato il terremoto. Ogni terremoto ha una sola magnitudo. Un punto in più vuol dire circa 30 volte più energia.' },
  { term: 'Intensità', text: 'Descrive gli effetti in un luogo preciso: cosa hanno sentito le persone, che danni ci sono stati. Cambia da paese a paese ed è più forte vicino all’epicentro.' },
  { term: 'Epicentro', text: 'Il punto sulla superficie della Terra che sta proprio sopra il punto in cui è iniziato il terremoto.' },
  { term: 'Profondità', text: 'Quanto è sotto terra il punto in cui la roccia si è rotta (l’ipocentro). In Italia di solito è tra 5 e 20 km.' },
  { term: 'Sciame sismico', text: 'Tante scosse nella stessa zona per giorni o settimane, di solito piccole.' },
  { term: 'Replica', text: 'Una scossa che arriva dopo una scossa più forte, nella stessa zona.' },
  { term: 'Si possono prevedere?', text: 'No. Nessuno può sapere quando ci sarà un terremoto: diffida di chi dice il contrario. Si può però sapere quanto è pericolosa una zona e prepararsi.' },
];

export function SafetyPage() {
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Cosa fare in caso di terremoto"
        intro="Pochi consigli semplici. Leggili con calma oggi: ti saranno utili se un giorno servirà."
      />

      <a href="tel:112" className="emergency">
        <Siren aria-hidden="true" />
        <span>
          <span className="emergency__title">Emergenza? Chiama il 112</span>
          <span>Numero unico, gratuito, attivo giorno e notte</span>
        </span>
        <Phone aria-hidden="true" />
      </a>

      {SECTIONS.map((s) => (
        <section key={s.id} className="card stack" aria-labelledby={`sec-${s.id}`}>
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
            <SpeakButton
              label="Ascolta questi consigli"
              text={`${s.title}. ${s.groups.map((g) => `${g.title ? `${g.title}. ` : ''}${g.items.join(' ')}`).join(' ')}`}
            />
          </div>
        </section>
      ))}

      <Link to="/danni-casa" className="tip">
        <House aria-hidden="true" />
        <span>
          <span className="strong">La casa ha delle crepe dopo una scossa?</span>
          <span className="muted"> Chi chiamare, come funziona il controllo della casa, quali aiuti esistono.</span>
        </span>
      </Link>

      <section className="card stack" aria-labelledby="glossary">
        <h2 id="glossary" className="icon-title">
          <BookOpen aria-hidden="true" />
          Capire le parole
        </h2>
        <dl className="glossary">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link to="/e-vero" className="tip">
        <MessageCircleWarning aria-hidden="true" />
        <span>
          <span className="strong">Ti è arrivato un messaggio che «prevede» una scossa?</span>
          <span className="muted"> Le voci più comuni sui terremoti, con la risposta degli scienziati.</span>
        </span>
      </Link>

      <Link to="/capire" className="tip">
        <BookOpen aria-hidden="true" />
        <span>
          <span className="strong">Vuoi capire meglio?</span>
          <span className="muted"> Leggi «Capire i terremoti»: magnitudo, repliche, previsioni, con dati veri.</span>
        </span>
      </Link>

      <p className="muted">
        Fonte dei consigli: campagna <ExternalLink href="https://iononrischio.protezionecivile.it/">Io non rischio</ExternalLink> del
        Dipartimento della Protezione Civile. Segui sempre le indicazioni del tuo Comune.
      </p>
    </div>
  );
}
