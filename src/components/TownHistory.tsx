import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import {
  DBMI_CITATION,
  DBMI_DOI,
  DBMI_LICENSE,
  DBMI_SITE,
  DBMI_UNTIL,
  DEGREE_LEGEND,
  dbmiPlaceUrl,
  historicDate,
  intensityWords,
  loadTownHistory,
  type IntensityWords,
} from '../lib/dbmi';
import { MCS_SOURCE } from '../lib/mcs';
import { ExternalLink, LoadingCards } from './ui';

/** «grado 8 su 12, gravemente dannoso», oppure «danni (senza un grado preciso)» per le sigle del database. */
const degreeText = (w: IntensityWords) =>
  w.name ? `${w.label.toLowerCase()} su 12, ${w.name.toLowerCase()}` : `${w.label.toLowerCase()} (senza un grado preciso)`;

/** La citazione che l'INGV chiede, parola per parola, con la licenza e la nota su cosa abbiamo fatto noi ai dati. */
function Citation() {
  return (
    <p className="small muted">
      <span className="strong">Fonte dei dati:</span> {DBMI_CITATION} <ExternalLink href={DBMI_DOI}>{DBMI_DOI}</ExternalLink>. Licenza{' '}
      <ExternalLink href={DBMI_LICENSE.url}>{DBMI_LICENSE.name}</ExternalLink>. Qui mostriamo solo una scelta dei dati, riassunta da noi: se
      c’è un errore nel riassunto è nostro, non dell’INGV.
    </p>
  );
}

/** Come leggere la storia sismica: i limiti, detti prima che qualcuno tragga conclusioni sbagliate. */
function Limits({ place }: { place: string }) {
  return (
    <div className="history-limits" role="note" aria-label="Come leggere questi dati">
      <p className="strong">Come leggere questi dati</p>
      <ul className="advice">
        <li>
          <span className="strong">È storia, non una previsione.</span> Dice cosa è successo, non cosa succederà: nessuno può prevedere i
          terremoti.
        </li>
        <li>
          <span className="strong">L’elenco è incompleto.</span> Ci sono solo i terremoti di cui restano notizie scritte o rilievi. Se un
          terremoto non c’è, non vuol dire che qui non si sia sentito.
        </li>
        <li>
          <span className="strong">Il grado descrive gli effetti di allora</span>, sulle case di allora. Lo stesso terremoto, oggi, farebbe
          effetti diversi secondo come sono costruiti gli edifici.
        </li>
        <li>
          <span className="strong">I dati riguardano {place}</span> come centro abitato, non ogni via o frazione, e si fermano al{' '}
          {DBMI_UNTIL}.
        </li>
      </ul>
    </div>
  );
}

/**
 * «Nella storia»: i terremoti che si sono sentiti di più nel comune negli ultimi mille anni, dal database DBMI15
 * dell'INGV. Il catalogo strumentale (dal 1985) da solo dà un'idea sbagliata: a Napoli non compaiono né il 1456 né
 * l'Irpinia del 1980. Tono: è storia, non allarme.
 */
export function TownHistory({ comune, sigla }: { comune: string; sigla: string }) {
  const history = useQuery({
    queryKey: ['dbmi', comune, sigla],
    queryFn: () => loadTownHistory(comune, sigla),
    staleTime: Infinity,
  });
  const h = history.data;

  return (
    <section className="card stack" aria-labelledby="storia-title">
      <h2 id="storia-title" className="icon-title">
        <ScrollText aria-hidden="true" /> Nella storia: i terremoti più sentiti qui
      </h2>

      {history.isPending && <LoadingCards count={1} label="Cerco nella storia sismica…" />}

      {history.isError && <p className="muted">In questo momento non riesco a caricare la storia sismica. Riprova più tardi.</p>}

      {history.data === null && (
        <>
          <p>
            Per {comune} il database storico dell’INGV non ha una storia sismica.{' '}
            <span className="strong">Non vuol dire che qui non abbia mai tremato</span>: vuol dire che non sono arrivate fino a noi
            notizie sufficienti, oppure che il comune ha cambiato nome o confini.
          </p>
          <p className="small muted">
            Puoi cercare le località vicine nel <ExternalLink href={DBMI_SITE}>Database Macrosismico Italiano dell’INGV</ExternalLink>.
          </p>
        </>
      )}

      {h && (
        <>
          <p>
            Gli studiosi dell’INGV hanno ricostruito gli effetti di <span className="strong">{h.observations}</span>{' '}
            {h.observations === 1 ? 'terremoto' : 'terremoti'} a <span className="strong">{h.place}</span>, dal {h.since} al {DBMI_UNTIL}, da
            documenti d’epoca e rilievi sul posto.
            {h.quakes.length > 0 ? ' Questi sono quelli che qui si sono sentiti di più.' : ''}
          </p>
          {h.place !== h.comune && (
            <p className="muted">
              I dati sono della località {h.place}, nel comune di {h.comune}.
            </p>
          )}

          {h.quakes.length === 0 ? (
            <p>
              Nessuno di questi risulta sentito in modo netto: sono scosse non avvertite o avvertite appena. Leggi qui sotto perché questo
              non basta per dire che la zona è tranquilla.
            </p>
          ) : (
            <ol className="history-list">
              {h.quakes.map((q) => {
                const here = intensityWords(q.intensity);
                const worst = q.maxIntensity && q.maxIntensity !== q.intensity ? intensityWords(q.maxIntensity) : null;
                return (
                  <li key={`${q.year}-${q.month}-${q.day}-${q.area}`}>
                    <span className="history-list__when">{historicDate(q)}</span>
                    <span className="history-list__what">
                      <span className="strong">Epicentro: {q.area}</span>
                      <span>
                        A {h.place}: <span className="strong">{degreeText(here)}</span>
                      </span>
                      {worst ? (
                        <span className="muted">Dove ha colpito di più: {degreeText(worst)}</span>
                      ) : (
                        q.maxIntensity && <span className="muted">È qui che ha colpito di più.</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {h.quakes.length > 0 && (
            <div className="stack-sm">
              <h3>Cosa vogliono dire i gradi</h3>
              <p>
                <span className="strong">Il grado non è la magnitudo.</span> La magnitudo dice quanta energia ha liberato il terremoto, ed
                è una sola. Il grado di intensità dice cosa è successo in un posto preciso, in una scala da 1 a 12: lo stesso terremoto
                ha gradi alti vicino all’epicentro e più bassi lontano.
              </p>
              <ul className="degree-legend">
                {DEGREE_LEGEND.filter((d) => d.degree >= 5).map((d) => (
                  <li key={d.degree}>
                    <span className="degree-legend__n">{d.degree}</span>
                    <span>
                      <span className="strong">{d.name}.</span> {d.text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="small muted">
                I gradi sono quelli della scala Mercalli-Cancani-Sieberg (MCS), la stessa usata dal database. Le descrizioni sono riassunte
                dal testo ufficiale della scala pubblicato dall’INGV: <ExternalLink href={MCS_SOURCE.url}>{MCS_SOURCE.label}</ExternalLink>.
              </p>
            </div>
          )}

          <Limits place={h.place} />

          <div>
            <ExternalLink href={dbmiPlaceUrl(h.placeId)} className="btn btn--secondary">
              Tutta la storia sismica di {h.place} (INGV)
            </ExternalLink>
          </div>
          {h.otherPlaces > 0 && (
            <p className="small muted">
              Nel comune ci sono dati anche per {h.otherPlaces === 1 ? 'un’altra località' : `altre ${h.otherPlaces} località`}: le trovi sul
              sito dell’INGV.
            </p>
          )}
        </>
      )}

      <Citation />
    </section>
  );
}
