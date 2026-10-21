import { Link } from 'react-router';
import { Siren } from 'lucide-react';
import { ExternalLink } from '../components/ui';
import { LEGAL } from './config';
import { ContactEmail, LegalLayout, type LegalSection } from './LegalLayout';

/**
 * Termini d'uso. Linguaggio semplice, ma con i punti che contano:
 * non è un servizio ufficiale né di allerta, i dati sono di terzi e possono cambiare,
 * limiti di responsabilità entro quanto consentito dalla legge italiana.
 */
export function TermsPage() {
  const { siteName: S } = LEGAL;

  const sections: LegalSection[] = [
    {
      id: 'accettazione',
      title: 'Chi siamo e a cosa servono questi termini',
      body: (
        <>
          <p>
            {S} è un sito gratuito gestito da <strong>{LEGAL.owner.name}</strong> come progetto personale, senza scopo di
            lucro. Questi termini spiegano come si può usare il sito e quali sono i suoi limiti. Usando il sito li accetti:
            se non sei d’accordo, ti chiediamo di non usarlo.
          </p>
          <p>
            Il sito non richiede registrazione, non ha un’area riservata e non vende nulla.
          </p>
        </>
      ),
    },
    {
      id: 'non-emergenza',
      title: 'Non è un servizio di emergenza né di allerta',
      body: (
        <>
          <div className="legal-callout" role="note">
            <Siren aria-hidden="true" />
            <div>
              <p className="strong">In caso di emergenza chiama il 112.</p>
              <p>
                {S} <strong>non prevede i terremoti</strong>, <strong>non avvisa prima</strong> di una scossa e{' '}
                <strong>non è un sistema di allerta</strong>.
              </p>
            </div>
          </div>
          <ul className="advice">
            <li>
              Le informazioni arrivano sempre <strong>dopo</strong> la scossa, con un ritardo che può essere di diversi minuti
              e dipende da servizi esterni e dalla tua connessione.
            </li>
            <li>
              Gli avvisi nel sito funzionano solo mentre il sito è aperto e possono non arrivare (browser chiuso, batteria,
              rete assente, permessi negati).
            </li>
            <li>
              {S} <strong>non è un sito ufficiale</strong> e non è collegato all’INGV, al Dipartimento della Protezione Civile o
              ad altri enti. Per le informazioni e le indicazioni ufficiali fai sempre riferimento a loro, al tuo Comune e al
              sistema pubblico di allarme{' '}
              <ExternalLink href="https://www.it-alert.gov.it/it/">IT-alert</ExternalLink>.
            </li>
            <li>Non prendere decisioni importanti per la tua sicurezza basandoti solo su {S}.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'dati',
      title: 'Da dove arrivano i dati e quanto sono affidabili',
      body: (
        <ul className="advice">
          <li>
            I dati sui terremoti sono dell’<ExternalLink href="https://terremoti.ingv.it/">INGV</ExternalLink> (licenza CC BY
            4.0). Subito dopo una scossa sono <strong>stime provvisorie</strong>: magnitudo, posizione e profondità possono
            essere corrette nelle ore successive. {S} li mostra così come li riceve e non ne garantisce l’esattezza o la
            completezza.
          </li>
          <li>
            Le frasi come «probabilmente avvertita», i livelli («leggera», «moderata»…) e le distanze sono{' '}
            <strong>stime indicative</strong> calcolate automaticamente, pensate per aiutare a capire. Non sono valutazioni
            ufficiali e gli effetti reali dipendono da molti fattori (terreno, edificio, piano).
          </li>
          <li>
            La zona sismica dei comuni viene dalla classificazione del{' '}
            <ExternalLink href="https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/">
              Dipartimento della Protezione Civile
            </ExternalLink>
            . È un’informazione generale: non dice nulla sulla sicurezza di un singolo edificio, che può valutare solo un
            tecnico abilitato.
          </li>
          <li>
            I consigli su cosa fare sono tratti dalla campagna pubblica «Io non rischio» della Protezione Civile e hanno solo
            scopo informativo. Segui sempre le indicazioni delle autorità.
          </li>
          <li>
            Le funzioni per esperti (grafici, b-value, esportazioni) hanno scopo divulgativo e didattico: non sono analisi
            scientifiche validate.
          </li>
        </ul>
      ),
    },
    {
      id: 'disponibilita',
      title: 'Servizio gratuito e disponibilità',
      body: (
        <p>
          {S} è offerto gratuitamente, «così com’è». Funziona grazie a servizi esterni (INGV, mappe, ricerca dei comuni,
          hosting) che possono essere lenti, non disponibili o cambiare senza preavviso. Per questo non possiamo garantire che
          il sito sia sempre raggiungibile, aggiornato o senza errori, e possiamo modificarlo, sospenderlo o chiuderlo in
          qualsiasi momento, anche senza preavviso.
        </p>
      ),
    },
    {
      id: 'responsabilita',
      title: 'Limiti di responsabilità',
      body: (
        <>
          <p>
            Nei limiti consentiti dalla legge, il gestore di {S} non risponde di danni derivanti da: ritardi, errori o
            mancanza dei dati forniti da terzi; interruzioni del servizio; uso delle informazioni del sito in modo diverso da
            quello indicato in questi termini, in particolare come se fossero un sistema di allerta o di emergenza.
          </p>
          <p>
            Questa limitazione <strong>non si applica</strong> ai casi di dolo o colpa grave (art. 1229 del Codice civile) e non
            riduce i diritti che la legge riconosce in modo inderogabile ai consumatori.
          </p>
        </>
      ),
    },
    {
      id: 'uso-corretto',
      title: 'Uso corretto del sito',
      body: (
        <>
          <p>Usando {S} ti impegni a non:</p>
          <ul className="advice">
            <li>attaccare o cercare di violare il sito, o di aggirarne le misure di sicurezza;</li>
            <li>sovraccaricare il sito o i servizi esterni che usa (ad esempio con richieste automatiche massicce);</li>
            <li>
              diffondere notizie false o allarmistiche presentandole come dati di {S} (ad esempio con immagini modificate);
            </li>
            <li>usare il nome o il logo di {S} per siti, app o messaggi che possano trarre in inganno.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'proprieta',
      title: 'Proprietà intellettuale e licenze',
      body: (
        <ul className="advice">
          <li>
            Il nome «{S}», il logo, i testi e il codice del sito appartengono al gestore, salvo dove indicato diversamente.
          </li>
          <li>
            Dati sui terremoti: © INGV, licenza{' '}
            <ExternalLink href="https://creativecommons.org/licenses/by/4.0/deed.it">CC BY 4.0</ExternalLink>. Se li riusi,
            cita l’INGV come fonte.
          </li>
          <li>
            Mappe: <ExternalLink href="https://openfreemap.org/">OpenFreeMap</ExternalLink>, ©{' '}
            <ExternalLink href="https://www.openmaptiles.org/">OpenMapTiles</ExternalLink>, dati ©{' '}
            <ExternalLink href="https://www.openstreetmap.org/copyright">i contributori di OpenStreetMap</ExternalLink>.
          </li>
          <li>Carattere Atkinson Hyperlegible Next (SIL Open Font License); icone Lucide (licenza ISC).</li>
        </ul>
      ),
    },
    {
      id: 'link',
      title: 'Link ad altri siti',
      body: (
        <p>
          Il sito contiene link a siti esterni (INGV, Protezione Civile e altri). Non controlliamo questi siti e non siamo
          responsabili dei loro contenuti o delle loro regole sulla privacy.
        </p>
      ),
    },
    {
      id: 'privacy',
      title: 'Privacy',
      body: (
        <p>
          Come trattiamo i dati è spiegato nella <Link to="/privacy">Privacy Policy</Link>.
        </p>
      ),
    },
    {
      id: 'modifiche',
      title: 'Modifiche ai termini',
      body: (
        <p>
          Possiamo aggiornare questi termini, ad esempio quando aggiungiamo nuove funzioni. La versione valida è sempre quella
          pubblicata su questa pagina, con la data di «ultimo aggiornamento» in alto.
        </p>
      ),
    },
    {
      id: 'legge',
      title: 'Legge applicabile',
      body: (
        <p>
          Questi termini sono regolati dalla legge italiana. Se usi il sito come consumatore, per eventuali controversie è
          competente il giudice del luogo in cui risiedi o sei domiciliato, come previsto dal Codice del consumo.
        </p>
      ),
    },
    {
      id: 'contatti',
      title: 'Contatti',
      body: (
        <p>
          Per domande, segnalazioni di errori o problemi di sicurezza scrivi a <ContactEmail />.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Termini d’uso"
      intro={`Le regole per usare ${S} e, soprattutto, i suoi limiti. Leggile con calma: sono scritte in modo semplice.`}
      sections={sections}
    />
  );
}
