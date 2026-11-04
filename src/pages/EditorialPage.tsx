import { Link } from 'react-router';
import { ClipboardCheck, History, Library, ListChecks, MessageSquareWarning, Users } from 'lucide-react';
import { ExternalLink, PageHeader } from '../components/ui';
import { LEGAL } from '../legal/config';
import { CORREZIONI } from '../learn/corrections';

const longDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateText = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));

/** Le linee editoriali di «Capire»: pubbliche, perché chiunque possa controllare che le rispettiamo. */
export function EditorialPage() {
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Come scriviamo gli articoli"
        intro="Le regole che seguiamo per ogni articolo di «Capire»: da dove prendiamo le informazioni, come le controlliamo e come correggiamo gli errori."
      />

      <section className="stack" aria-labelledby="ed-why">
        <h2 id="ed-why">Perché queste regole</h2>
        <p>
          Quake Italia vuole rendere la scienza dei terremoti comprensibile a tutti. Ma una spiegazione semplice e sbagliata fa
          più danni di nessuna spiegazione. Per questo ogni articolo segue le stesse regole, scritte qui perché chiunque possa
          controllare che le rispettiamo.
        </p>
        <p>
          Non vogliamo sostituire nessuno: gli articoli portano verso le fonti ufficiali, come l’INGV e la Protezione Civile,
          e le ringraziano. Il nostro lavoro è renderle più facili da raggiungere e da capire.
        </p>
      </section>

      <section className="card stack" aria-labelledby="ed-sources">
        <h2 id="ed-sources" className="icon-title">
          <Library aria-hidden="true" /> Da dove prendiamo le informazioni
        </h2>
        <p>In ordine di importanza:</p>
        <ol className="advice">
          <li>
            <strong>Enti pubblici di ricerca e di protezione civile:</strong> INGV (cataloghi, bollettini, pagine ufficiali),
            Dipartimento della Protezione Civile, ISPRA, Regioni.
          </li>
          <li>
            <strong>Rassegne scientifiche e documenti di consenso:</strong> articoli che riassumono molti studi, rapporti di
            commissioni internazionali, linee guida.
          </li>
          <li>
            <strong>Singoli studi scientifici</strong> pubblicati su riviste con revisione tra pari. Li raccontiamo sempre come
            «uno studio»: cosa dice, cosa non dice e cosa ne pensano gli altri ricercatori.
          </li>
          <li>
            <strong>Giornali:</strong> solo per fatti di cronaca e dichiarazioni (chi ha detto cosa, e quando), mai per spiegare
            la scienza.
          </li>
        </ol>
        <p>Non usiamo post sui social, video o audio senza fonte, siti anonimi, né «previsioni» di alcun tipo.</p>
      </section>

      <section className="card stack" aria-labelledby="ed-rules">
        <h2 id="ed-rules" className="icon-title">
          <ListChecks aria-hidden="true" /> Le regole di ogni articolo
        </h2>
        <ul className="advice">
          <li>Ogni affermazione importante ha una fonte, elencata in fondo; dove si può, con un link per controllarla.</li>
          <li>I numeri vengono dalle fonti o dai dati ufficiali. Quando facciamo calcoli nostri, pubblichiamo il codice per rifarli.</li>
          <li>Distinguiamo ciò che è assodato da ciò su cui gli scienziati discutono ancora.</li>
          <li>Niente allarmismo, e niente false rassicurazioni.</li>
          <li>
            Non togliamo i concetti difficili: li spieghiamo. E raccontiamo anche come lo sappiamo: con quali strumenti,
            misure e studi gli scienziati ci sono arrivati.
          </li>
          <li>Parole semplici, ma i termini scientifici restano: li spieghiamo la prima volta e nel glossario.</li>
          <li>
            Gli articoli sono «a strati»: l’essenziale si capisce in pochi secondi, e chi vuole può andare a fondo, fino agli
            studi originali.
          </li>
          <li>Scriviamo con parole nostre: non copiamo testi altrui e rifacciamo i grafici dai dati, citando sempre l’origine.</li>
          <li>
            Non diamo consigli medici personali né valutazioni sul tuo edificio: per questo servono un medico o un tecnico
            abilitato.
          </li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="ed-who">
        <h2 id="ed-who" className="icon-title">
          <Users aria-hidden="true" /> Chi scrive e chi controlla
        </h2>
        <p>
          Quake Italia è un progetto personale e indipendente. Gli articoli nascono dal lavoro insieme di una persona e di
          un’intelligenza artificiale, Claude, di Anthropic.
        </p>
        <p>
          <strong>L’intelligenza artificiale fa la parte più lunga della ricerca:</strong> cerca le fonti, legge per intero gli
          studi quando sono ad accesso aperto, controlla che ogni riferimento esista e porti allo studio giusto, rifà i calcoli
          sui dati ufficiali e scrive una prima versione. Per esempio, per l’articolo{' '}
          <Link to="/capire/tempo-da-terremoto">Esiste il «tempo da terremoto»?</Link> ha analizzato 40 anni di catalogo INGV e
          il tempo meteorologico delle 24 ore prima di 171 terremoti; il codice per rifare i conti è pubblico.
        </p>
        <p>
          <strong>Una persona c’è sempre.</strong> Decide quali temi trattare, legge ogni articolo prima che venga pubblicato e
          lo approva: se una frase non si capisce o non convince, si riscrive. Nessun articolo va online senza questo passaggio.
          Ed è sempre una persona a rispondere alle segnalazioni e a decidere le correzioni.
        </p>
        <p>
          Non è testo prodotto in automatico e pubblicato senza controllo: prima della lettura finale, ogni numero e ogni frase
          vengono riconfrontati con le fonti, in un passaggio separato. Né una persona né un’intelligenza artificiale sono
          infallibili: per questo valgono le regole qui sopra, ogni fonte è a portata di clic e gli errori finiscono nel
          registro delle correzioni.
        </p>
        <p>
          In fondo a ogni articolo c’è la data dell’ultima verifica delle fonti. Quando un esperto esterno (per esempio un
          sismologo o un geologo) rivede un articolo, lo scriviamo con nome e ruolo; se non c’è scritto, l’articolo non è ancora
          stato rivisto da un esperto esterno.
        </p>
        <p>
          <strong>Sei un sismologo, un geologo o un ingegnere e vuoi aiutarci?</strong> Quake Italia è gratuito, senza
          pubblicità e senza guadagni, e codice e testi sono aperti a tutti: per questo anche le revisioni sono volontarie e non
          retribuite. Se vuoi, il tuo nome e il tuo ruolo compaiono in fondo agli articoli che hai rivisto. La revisione è a
          titolo personale e non impegna l’ente per cui lavori. Scrivici a{' '}
          <a href={`mailto:${LEGAL.owner.email}`}>{LEGAL.owner.email}</a>, oppure proponi le correzioni direttamente su{' '}
          <ExternalLink href="https://github.com/Pitusd-V2/quake-italia">GitHub</ExternalLink>.
        </p>
      </section>

      <section className="card stack" aria-labelledby="ed-checks">
        <h2 id="ed-checks" className="icon-title">
          <ClipboardCheck aria-hidden="true" /> I controlli automatici
        </h2>
        <ul className="advice">
          <li>
            Il sito non viene pubblicato se un articolo ha meno di tre fonti, non ha la data di verifica o contiene link a siti
            fuori dalla nostra lista di fonti controllate.
          </li>
          <li>
            Ogni settimana un controllo automatico verifica che i link delle fonti funzionino ancora e che ogni riferimento a uno
            studio (il codice DOI) porti davvero allo studio citato.
          </li>
          <li>Se le fonti di un articolo non vengono ricontrollate da più di un anno, il sistema ce lo ricorda.</li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="ed-fix">
        <h2 id="ed-fix" className="icon-title">
          <MessageSquareWarning aria-hidden="true" /> Come correggiamo gli errori
        </h2>
        <ul className="advice">
          <li>
            Puoi segnalare un errore dal link in fondo a ogni articolo, su{' '}
            <ExternalLink href="https://github.com/Pitusd-V2/quake-italia/issues">GitHub</ExternalLink>, oppure per email a{' '}
            <a href={`mailto:${LEGAL.owner.email}`}>{LEGAL.owner.email}</a>.
          </li>
          <li>Rispondiamo entro 7 giorni. Un errore che può mettere in pericolo qualcuno lo correggiamo appena lo sappiamo.</li>
          <li>Le correzioni importanti restano scritte nel registro qui sotto: non cancelliamo gli errori di nascosto.</li>
        </ul>
      </section>

      <section className="stack" aria-labelledby="ed-log">
        <h2 id="ed-log" className="icon-title">
          <History aria-hidden="true" /> Registro delle correzioni
        </h2>
        <p className="muted">Le prime correzioni sono state fatte prima della pubblicazione del sito, durante i controlli.</p>
        <ol className="corrections">
          {CORREZIONI.map((c) => (
            <li key={`${c.data}-${c.prima}`} className="card stack-sm">
              <p className="small muted">
                {dateText(c.data)} · <Link to={c.link}>{c.pagina}</Link>
              </p>
              <p>
                <span className="strong">Prima: </span>
                {c.prima}
              </p>
              <p>
                <span className="strong">Ora: </span>
                {c.ora}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="small muted">
        I testi degli articoli hanno licenza CC BY-SA 4.0: puoi riusarli citando Quake Italia, con la stessa licenza. I dettagli
        sono nei <Link to="/termini">Termini d’uso</Link>.
      </p>
    </div>
  );
}
