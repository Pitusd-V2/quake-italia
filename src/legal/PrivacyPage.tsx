import { Link } from 'react-router';
import { ExternalLink } from '../components/ui';
import { HOSTING_INFO, LEGAL } from './config';
import { ContactEmail, LegalLayout, type LegalSection } from './LegalLayout';

/**
 * Informativa privacy (art. 13 Regolamento UE 2016/679 - GDPR).
 * Descrive i flussi di dati REALI del sito: se cambia il codice (nuovo servizio esterno,
 * statistiche, account...) questa pagina va aggiornata insieme.
 */
export function PrivacyPage() {
  const host = HOSTING_INFO[LEGAL.hosting];
  const { siteName: S } = LEGAL;

  const sections: LegalSection[] = [
    {
      id: 'in-breve',
      title: 'In breve',
      body: (
        <div className="legal-summary">
          <ul className="advice">
            <li>
              {S} <strong>non ha account</strong>, non usa <strong>cookie</strong>, non ha <strong>statistiche</strong> né{' '}
              <strong>pubblicità</strong> e non vende dati a nessuno.
            </li>
            <li>
              Il comune che imposti e le tue preferenze restano <strong>solo sul tuo dispositivo</strong>: noi non li
              riceviamo e non li vediamo.
            </li>
            <li>
              Per funzionare, il tuo browser scarica i dati direttamente da servizi pubblici (INGV per i terremoti, OpenFreeMap
              per le mappe, Photon per la ricerca dei comuni). Come ogni sito web, questi servizi e il nostro hosting vedono
              l’indirizzo IP del tuo dispositivo.
            </li>
            <li>
              La tua <strong>posizione</strong> si usa solo se premi «Usa la mia posizione» e dai il permesso.
            </li>
            <li>
              Puoi cancellare tutto in qualsiasi momento da <Link to="/impostazioni#i-tuoi-dati">Impostazioni → I tuoi dati</Link>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'titolare',
      title: 'Chi è il titolare del trattamento',
      body: (
        <>
          <p>
            Il titolare del trattamento è <strong>{LEGAL.owner.name}</strong>, {LEGAL.owner.place}, che gestisce {S} come
            progetto personale, gratuito e senza scopo di lucro.
          </p>
          <p>
            Per qualsiasi domanda sulla privacy o per esercitare i tuoi diritti scrivi a: <ContactEmail />.
          </p>
          <p>
            {S} è un progetto indipendente: <strong>non è collegato</strong> all’INGV, alla Protezione Civile né ad altri
            enti pubblici.
          </p>
        </>
      ),
    },
    {
      id: 'dispositivo',
      title: 'Dati salvati solo sul tuo dispositivo',
      body: (
        <>
          <p>Per ricordare le tue scelte, {S} salva nella memoria del browser (localStorage) del tuo dispositivo:</p>
          <ul className="advice">
            <li>il comune che hai scelto come «casa» (nome e coordinate) e il raggio «vicino a me»;</li>
            <li>le preferenze di aspetto (testo, colori, contrasto) e degli avvisi;</li>
            <li>le voci della checklist «Prepara la tua casa» che hai spuntato.</li>
          </ul>
          <p>
            Inoltre il browser conserva una copia dei file del sito e degli ultimi dati sui terremoti e delle mappe
            (cache), per funzionare anche senza rete.
          </p>
          <p>
            Questi dati <strong>non vengono inviati a noi</strong> né a terzi: restano sul dispositivo finché non li
            cancelli. Sono strumenti tecnici, necessari a fornire il servizio che hai chiesto, per i quali non serve il
            consenso (art. 122 del Codice privacy e{' '}
            <ExternalLink href="https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876">
              Linee guida cookie del Garante, 10 giugno 2021
            </ExternalLink>
            ).
          </p>
          <p>
            Puoi cancellarli con il pulsante in <Link to="/impostazioni#i-tuoi-dati">Impostazioni → I tuoi dati</Link>, oppure
            cancellando i dati del sito dalle impostazioni del browser.
          </p>
        </>
      ),
    },
    {
      id: 'navigazione',
      title: 'Dati tecnici di navigazione (hosting)',
      body: (
        <>
          <p>
            Il sito è ospitato da <strong>{host.name}</strong> ({host.company}). Come avviene per ogni sito web, quando apri
            una pagina il server registra automaticamente alcuni dati tecnici: indirizzo IP, data e ora, pagina richiesta,
            tipo di browser e di dispositivo.
          </p>
          <ul className="advice">
            <li>
              <strong>Perché:</strong> per far funzionare il sito e proteggerlo da abusi e attacchi.
            </li>
            <li>
              <strong>Base giuridica:</strong> legittimo interesse del titolare a fornire un servizio sicuro (art. 6, par. 1,
              lett. f, GDPR).
            </li>
            <li>
              <strong>Chi li tratta:</strong> il fornitore di hosting, come responsabile del trattamento (art. 28 GDPR).
              {S} non usa questi dati per profilarti.
            </li>
            <li>
              <strong>Per quanto tempo:</strong> per il periodo, di norma breve, previsto dal fornitore.
            </li>
            <li>
              <strong>Trasferimento fuori dall’UE:</strong> {host.transfer}
            </li>
          </ul>
          {host.privacyUrl && (
            <p>
              Informativa del fornitore: <ExternalLink href={host.privacyUrl}>{host.name}</ExternalLink>.
            </p>
          )}
        </>
      ),
    },
    {
      id: 'servizi-esterni',
      title: 'Servizi esterni usati dal tuo browser',
      body: (
        <>
          <p>
            Per mostrarti terremoti, mappe e comuni, il tuo browser si collega <strong>direttamente</strong> ai servizi qui
            sotto. Ognuno riceve, come minimo, l’indirizzo IP del tuo dispositivo e la richiesta fatta, e li tratta come{' '}
            <strong>titolare autonomo</strong> secondo la propria informativa. {S} non riceve questi dati.
          </p>
          <div className="legal-table" role="table" aria-label="Servizi esterni">
            <div role="row" className="legal-table__head">
              <span role="columnheader">Servizio</span>
              <span role="columnheader">A cosa serve</span>
              <span role="columnheader">Cosa riceve</span>
            </div>
            <div role="row">
              <span role="cell">
                <strong>INGV</strong> – Istituto Nazionale di Geofisica e Vulcanologia (Italia)
                <br />
                <ExternalLink href="https://www.ingv.it/privacy">informativa</ExternalLink>
              </span>
              <span role="cell">Dati ufficiali sui terremoti</span>
              <span role="cell">IP, tipo di ricerca (periodo, area). Con «Il mio comune», anche le coordinate del comune.</span>
            </div>
            <div role="row">
              <span role="cell">
                <strong>OpenFreeMap</strong>
                <br />
                <ExternalLink href="https://openfreemap.org/">sito</ExternalLink>
              </span>
              <span role="cell">Mappe</span>
              <span role="cell">IP e zona della mappa che stai guardando</span>
            </div>
            <div role="row">
              <span role="cell">
                <strong>Photon</strong> – komoot GmbH (Germania)
                <br />
                <ExternalLink href="https://www.komoot.com/privacy">informativa</ExternalLink>
              </span>
              <span role="cell">Ricerca dei comuni</span>
              <span role="cell">
                IP e il testo che scrivi. Se usi «Usa la mia posizione», anche le coordinate, per trovare il comune.
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'posizione',
      title: 'La tua posizione',
      body: (
        <>
          <p>
            {S} chiede la posizione <strong>solo quando premi «Usa la mia posizione»</strong> e solo se dai il permesso nel
            browser. La posizione serve a trovare il tuo comune e a calcolare la distanza dalle scosse.
          </p>
          <ul className="advice">
            <li>Le coordinate vengono inviate a Photon (vedi sopra) solo per ricavare il nome del comune.</li>
            <li>Se scegli di salvarle come «casa», restano sul tuo dispositivo.</li>
            <li>Non seguiamo i tuoi spostamenti e non usiamo la posizione in sottofondo.</li>
            <li>Puoi revocare il permesso in qualsiasi momento dalle impostazioni del browser o del telefono.</li>
          </ul>
          <p>
            <strong>Base giuridica:</strong> la tua richiesta di usare la funzione (art. 6, par. 1, lett. b, GDPR) e il
            permesso che dai al browser.
          </p>
        </>
      ),
    },
    {
      id: 'altre-funzioni',
      title: 'Notifiche, lettura ad alta voce e condivisione',
      body: (
        <ul className="advice">
          <li>
            <strong>Notifiche:</strong> sono generate dal browser sul tuo dispositivo, solo se le attivi. Non usiamo server
            di notifica e non raccogliamo identificativi.
          </li>
          <li>
            <strong>Lettura ad alta voce:</strong> usa la sintesi vocale del tuo dispositivo. Alcuni browser possono usare
            voci online del produttore del browser: in quel caso il testo letto (informazioni sui terremoti, non dati
            personali) passa da quel servizio.
          </li>
          <li>
            <strong>Condividi:</strong> usa il pannello di condivisione del tuo telefono. Il messaggio non passa da noi.
          </li>
        </ul>
      ),
    },
    {
      id: 'contatti',
      title: 'Se ci scrivi',
      body: (
        <p>
          Se ci scrivi via email, useremo il tuo indirizzo e il contenuto del messaggio solo per risponderti (art. 6, par. 1,
          lett. b e f, GDPR), e li conserveremo per il tempo necessario a gestire la tua richiesta.
        </p>
      ),
    },
    {
      id: 'cosa-non-facciamo',
      title: 'Cosa non facciamo',
      body: (
        <ul className="advice">
          <li>Non chiediamo registrazioni e non creiamo profili.</li>
          <li>Non usiamo cookie, né tecnici né di profilazione, e quindi non mostriamo banner sui cookie.</li>
          <li>Non usiamo strumenti di statistica, pubblicità o tracciamento (Google Analytics, pixel, ecc.).</li>
          <li>Non vendiamo né cediamo dati a nessuno.</li>
          <li>Non prendiamo decisioni automatizzate che producono effetti giuridici su di te (art. 22 GDPR).</li>
        </ul>
      ),
    },
    {
      id: 'diritti',
      title: 'I tuoi diritti',
      body: (
        <>
          <p>
            Hai diritto di chiedere accesso, rettifica, cancellazione, limitazione, portabilità dei tuoi dati e di opporti al
            trattamento (artt. 15–22 del{' '}
            <ExternalLink href="https://eur-lex.europa.eu/eli/reg/2016/679/oj">Regolamento UE 2016/679</ExternalLink>).
            Scrivi a <ContactEmail />.
          </p>
          <p>
            Dato che {S} non conserva dati personali sui propri server, la maggior parte dei dati è nelle tue mani: puoi
            vederli e cancellarli direttamente da <Link to="/impostazioni#i-tuoi-dati">Impostazioni → I tuoi dati</Link>.
            Per i dati trattati dai servizi esterni puoi rivolgerti anche a loro.
          </p>
          <p>
            Hai anche il diritto di presentare reclamo al{' '}
            <ExternalLink href="https://www.garanteprivacy.it/">Garante per la protezione dei dati personali</ExternalLink>.
          </p>
        </>
      ),
    },
    {
      id: 'minori',
      title: 'Minori',
      body: (
        <p>
          {S} può essere consultato da chiunque senza registrazione e non raccoglie consapevolmente dati personali di minori.
          Le uniche informazioni salvate restano sul dispositivo di chi usa il sito.
        </p>
      ),
    },
    {
      id: 'sicurezza',
      title: 'Sicurezza',
      body: (
        <p>
          Il sito usa solo connessioni cifrate (HTTPS) e regole di sicurezza del browser (Content-Security-Policy) che
          impediscono di caricare codice o collegarsi a servizi diversi da quelli elencati sopra. Nessuna misura è però
          sicura al 100%.
        </p>
      ),
    },
    {
      id: 'modifiche',
      title: 'Modifiche a questa informativa',
      body: (
        <p>
          Se cambia il modo in cui il sito tratta i dati, aggiorneremo questa pagina e la data di «ultimo aggiornamento» in
          alto. Per i cambiamenti importanti lo segnaleremo anche nel sito.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`Come ${S} tratta i tuoi dati, in parole semplici. Informativa ai sensi dell’art. 13 del Regolamento UE 2016/679 (GDPR).`}
      sections={sections}
    />
  );
}
