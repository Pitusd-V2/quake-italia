import { Link } from 'react-router';
import { MessageCircleWarning, ShieldCheck } from 'lucide-react';
import { SpeakButton } from '../components/Actions';
import { ExternalLink, PageHeader } from '../components/ui';

type Verdict = 'falso' | 'in-parte';

interface Rumor {
  id: string;
  /** La voce come la si sente dire o la si legge in un messaggio. */
  says: string;
  verdict: Verdict;
  answer: string[];
}

const VERDICT_LABEL: Record<Verdict, string> = { falso: 'Falso', 'in-parte': 'Vero solo in parte' };

/* Ogni risposta viene da una fonte elencata in fondo alla pagina (INGV, USGS, Protezione Civile, Il Post). */
const RUMORS: Rumor[] = [
  {
    id: 'previsione',
    says: '«Stanotte alle 3 arriva una scossa forte: me l’ha detto un amico che lavora all’INGV.»',
    verdict: 'falso',
    answer: [
      'Oggi nessuno al mondo sa prevedere un terremoto, cioè dire giorno, luogo e forza di una scossa futura. Né l’INGV né nessun altro.',
      'Gli scienziati possono solo dire quanto è probabile, in molti anni, un terremoto forte in una zona: per questo esistono le zone sismiche.',
    ],
  },
  {
    id: 'sciame',
    says: '«Tutte queste piccole scosse vogliono dire che sta per arrivare quella grande.»',
    verdict: 'falso',
    answer: [
      'Uno sciame non è un annuncio. Secondo i sismologi dell’INGV, la gran parte delle sequenze come quelle che capitano spesso in Italia (tra il 95 e il 99 su 100) finisce dopo giorni o settimane senza una scossa più forte.',
      'Non si può però escludere: per questo è giusto restare prudenti e avere la casa preparata, senza farsi prendere dal panico.',
    ],
  },
  {
    id: 'scaricano',
    says: '«Meglio tante piccole scosse: scaricano l’energia e quella forte non arriva.»',
    verdict: 'falso',
    answer: [
      'Le scosse piccole liberano pochissima energia. Per arrivare all’energia di una sola scossa di magnitudo 6 servirebbero circa 32.000 scosse di magnitudo 3, e scosse così, in una stessa zona, non ce ne sono mai abbastanza.',
    ],
  },
  {
    id: 'tempo',
    says: '«Fa caldo e c’è aria ferma: è tempo da terremoto.»',
    verdict: 'falso',
    answer: [
      'Il «tempo da terremoto» non esiste. I terremoti nascono a chilometri di profondità, dove il tempo che fa in superficie non arriva. Avvengono con il caldo, con il freddo, con la pioggia e con il sole, in proporzioni simili.',
      'Ci ricordiamo il tempo di un giorno speciale, e così sembra che ci sia un legame.',
    ],
  },
  {
    id: 'animali',
    says: '«Il cane abbaiava: gli animali sentono il terremoto prima.»',
    verdict: 'in-parte',
    answer: [
      'Gli animali possono accorgersi delle prime onde, le più veloci e deboli, qualche secondo prima che le sentiamo noi.',
      'Ma il loro comportamento non serve a prevedere i terremoti: gli animali reagiscono a tantissime cose, e quasi sempre dopo un cane agitato non succede niente.',
    ],
  },
  {
    id: 'magnitudo',
    says: '«L’INGV abbassa la magnitudo per non far pagare i danni allo Stato.»',
    verdict: 'falso',
    answer: [
      'I primi valori sono automatici e vengono corretti quando arrivano più dati: possono cambiare anche di mezzo punto, in su o in giù. Nel 2016 la scossa di Norcia passò da 6,1 a 6,5.',
      'Enti diversi possono dare numeri un po’ diversi perché usano dati e metodi diversi. E gli aiuti dopo un terremoto dipendono dai danni accertati, non dalla magnitudo.',
    ],
  },
  {
    id: 'vulcano',
    says: '«Ai Campi Flegrei sta per arrivare l’eruzione, lo dicono tutti sui social.»',
    verdict: 'falso',
    answer: [
      'Lo stato del vulcano lo seguono giorno e notte gli strumenti dell’Osservatorio Vesuviano dell’INGV. Il livello di allerta lo decide la Protezione Civile, e se cambiasse lo saprebbero tutti dai canali ufficiali e dal proprio Comune, anche con IT-alert.',
      'Un post o un audio che gira sui social non è un avviso.',
    ],
  },
];

const SIGNS = [
  'Dice giorno, ora o luogo di una scossa futura: è sempre falso.',
  'La fonte è vaga: «un amico della Protezione Civile», «un esperto», un audio senza nome.',
  'Ti chiede di inoltrarlo a tutti, subito.',
  'Usa paura e fretta: maiuscole, tanti punti esclamativi, «stanotte non dormite in casa».',
  'Foto e video senza data: spesso sono di altri terremoti, anche di anni fa.',
];

const TODO = [
  'Non inoltrarlo, nemmeno «per sicurezza».',
  'Controlla sui canali ufficiali: INGV, Protezione Civile, il tuo Comune.',
  'Se te l’ha mandato una persona cara, rispondile con calma: probabilmente aveva paura anche lei.',
];

export function RumorsPage() {
  return (
    <div className="container stack-lg">
      <PageHeader
        title="È vero? Le voci sui terremoti"
        intro="Dopo una scossa girano tanti messaggi, audio e «previsioni». Qui trovi le voci più comuni, con la risposta degli scienziati."
      />

      <ul className="rumor-list">
        {RUMORS.map((r) => (
          <li key={r.id} className="card stack-sm rumor" aria-labelledby={`rumor-${r.id}`}>
            <p id={`rumor-${r.id}`} className="rumor__says">
              {r.says}
            </p>
            <p className={`chip rumor__verdict rumor__verdict--${r.verdict}`}>{VERDICT_LABEL[r.verdict]}</p>
            {r.answer.map((a) => (
              <p key={a}>{a}</p>
            ))}
            <div>
              <SpeakButton label="Ascolta" text={`${r.says} ${VERDICT_LABEL[r.verdict]}. ${r.answer.join(' ')}`} />
            </div>
          </li>
        ))}
      </ul>

      <section className="card stack" aria-labelledby="signs-title">
        <h2 id="signs-title" className="icon-title">
          <MessageCircleWarning aria-hidden="true" /> Come riconoscere un messaggio falso
        </h2>
        <ul className="advice">
          {SIGNS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <h3 className="icon-title">
          <ShieldCheck aria-hidden="true" /> Se ti arriva
        </h3>
        <ul className="advice">
          {TODO.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="row">
          <SpeakButton label="Ascolta" text={`Come riconoscere un messaggio falso. ${SIGNS.join(' ')} Se ti arriva: ${TODO.join(' ')}`} />
        </div>
      </section>

      <Link to="/capire/si-possono-prevedere" className="tip">
        <ShieldCheck aria-hidden="true" />
        <span>
          <span className="strong">Si possono prevedere i terremoti?</span>
          <span className="muted"> La risposta lunga, con la storia delle «previsioni» famose.</span>
        </span>
      </Link>

      <section className="stack-sm learn-sources" aria-labelledby="rumor-sources">
        <h2 id="rumor-sources">Fonti</h2>
        <ol>
          <li>
            <ExternalLink href="https://ingvterremoti.com/2019/11/11/alcune-riflessioni-in-caso-di-una-sequenza-sismica-come-quella-di-sora-balsorano-del-7-novembre-2019/">
              A. Amato (INGV), Alcune riflessioni in caso di una sequenza sismica, INGVterremoti, 2019
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://ingvterremoti.com/faq/faq-domande-frequenti-sui-terremoti/">INGV — FAQ, domande frequenti sui terremoti (Quale magnitudo?)</ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-facts-earthquake-fantasy">
              USGS — Earthquake Facts & Earthquake Fantasy (in inglese)
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.usgs.gov/faqs/can-you-predict-earthquakes">USGS — Can you predict earthquakes? (in inglese)</ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.ilpost.it/2016/08/26/magnitudo-terremoto-bufala/">Il Post — La bufala sul governo che avrebbe abbassato la magnitudo del terremoto, 2016</ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://www.focus.it/scienza/scienze/terremoto-perche-i-dati-sulle-magnitudo-sono-diversi">
              Focus — Terremoto: perché i dati sulle magnitudo sono diversi
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href="https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/domande-e-risposte/domande-e-risposte-sul-rischio-vulcanico-e-il-bradisismo-ai-campi-flegrei/">
              Dipartimento della Protezione Civile — Domande e risposte sui Campi Flegrei
            </ExternalLink>
          </li>
        </ol>
      </section>
    </div>
  );
}
