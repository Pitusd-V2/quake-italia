import { Link } from 'react-router';
import { TAGLINE } from '../lib/brand';
import { ExternalLink, PageHeader } from '../components/ui';

export function InfoPage() {
  return (
    <div className="container stack-lg prose">
      <PageHeader title="Informazioni" intro={`${TAGLINE} Perché esiste Quake Italia, da dove arrivano i dati e come li usiamo.`} />

      <section className="card stack" aria-labelledby="why">
        <h2 id="why">Perché Quake Italia, se c’è già l’INGV?</h2>
        <p>
          Bella domanda, ed è giusto farsela. L’<ExternalLink href="https://terremoti.ingv.it/">INGV</ExternalLink> è la
          fonte ufficiale: registra ogni terremoto in Italia, fa un lavoro scientifico prezioso e mette i suoi dati a
          disposizione di tutti, gratuitamente. È proprio grazie a questo che Quake Italia può esistere.
        </p>
        <p>
          Quake Italia <strong>non sostituisce l’INGV</strong>: usa <strong>gli stessi dati ufficiali</strong> e li presenta in
          un altro modo, pensando soprattutto a chi non è pratico di tecnologia.
        </p>
        <div className="why-grid">
          <div className="why-card">
            <h3>INGV: da qui arrivano i dati</h3>
            <ul className="advice">
              <li>È la fonte ufficiale: registra ogni terremoto in Italia.</li>
              <li>Ha tutti i dati tecnici, per chi li sa leggere.</li>
              <li>Pubblica le spiegazioni dei sismologi.</li>
            </ul>
          </div>
          <div className="why-card why-card--hq">
            <h3>Quake Italia: tutto più facile</h3>
            <ul className="advice">
              <li>
                <strong>Capisci al primo sguardo.</strong> Niente sigle: invece di «ML 3.2» leggi «Scossa leggera, di solito
                non fa danni».
              </li>
              <li>
                <strong>Parla di te.</strong> Ti dice subito se è successo qualcosa vicino a casa tua e se potresti averlo
                sentito.
              </li>
              <li>
                <strong>Una scossa ti ha spaventato?</strong> Premi «Ho sentito una scossa» e scopri in un attimo cos’era.
              </li>
              <li>
                <strong>Tutto in un posto.</strong> Terremoti, zona sismica del tuo comune e cosa fare: non devi cercare su
                tanti siti.
              </li>
              <li>
                <strong>Comodo da leggere.</strong> Scritte grandi e colori chiari. E se preferisci, te lo legge ad alta voce.
              </li>
              <li>
                <strong>Ti aiuta a capire.</strong> Brevi spiegazioni per sapere cosa succede, con meno paura.
              </li>
            </ul>
          </div>
        </div>
        <p>
          Per i dati scientifici completi e per le comunicazioni ufficiali, il posto giusto resta l’INGV: in ogni scheda trovi
          il link alla pagina ufficiale dell’evento.
        </p>
      </section>

      <section className="card stack" aria-labelledby="mission">
        <h2 id="mission">La nostra idea</h2>
        <p>
          Quake Italia è un progetto indipendente e gratuito, nato con tre obiettivi:
        </p>
        <ul className="advice">
          <li>
            <strong>Navigare senza fatica:</strong> trovare in pochi secondi la risposta a «è successo qualcosa vicino a
            me?», anche per chi non è pratico di tecnologia.
          </li>
          <li>
            <strong>Avere più dati possibile, ma chiari:</strong> semplice per tutti, con la sezione Analisi per chi vuole
            approfondire.
          </li>
          <li>
            <strong>Diffondere cultura:</strong> capire cosa sono magnitudo, sequenze e zone sismiche aiuta ad avere meno
            paura, a riconoscere le notizie false e a prepararsi meglio.
          </li>
        </ul>
        <p>
          <span className="strong">Quake Italia non è un sito ufficiale e non è collegato all'INGV.</span> Non prevede i
          terremoti e non è un sistema di allerta. Non ha pubblicità e non chiede registrazioni. In caso di emergenza chiama
          il <a href="tel:112">112</a>.
        </p>
      </section>

      <section className="card stack">
        <h2>Da dove arrivano i dati</h2>
        <ul className="advice">
          <li>
            <span className="strong">Terremoti:</span>{' '}
            <ExternalLink href="https://terremoti.ingv.it/">INGV — Istituto Nazionale di Geofisica e Vulcanologia</ExternalLink>,
            tramite il servizio pubblico FDSN. Dati con licenza{' '}
            <ExternalLink href="https://creativecommons.org/licenses/by/4.0/deed.it">CC BY 4.0</ExternalLink>. Si aggiornano
            ogni minuto.
          </li>
          <li>
            <span className="strong">Mappe:</span> <ExternalLink href="https://openfreemap.org/">OpenFreeMap</ExternalLink>, ©{' '}
            <ExternalLink href="https://www.openmaptiles.org/">OpenMapTiles</ExternalLink>, dati ©{' '}
            <ExternalLink href="https://www.openstreetmap.org/copyright">i contributori di OpenStreetMap</ExternalLink>.
          </li>
          <li>
            <span className="strong">Ricerca dei comuni:</span>{' '}
            <ExternalLink href="https://photon.komoot.io/">Photon</ExternalLink> di komoot, basato su OpenStreetMap.
          </li>
          <li>
            <span className="strong">Consigli di sicurezza:</span> campagna{' '}
            <ExternalLink href="https://iononrischio.protezionecivile.it/">Io non rischio</ExternalLink> della Protezione Civile.
          </li>
        </ul>
        <p>
          Le frasi come "probabilmente avvertita" sono <span className="strong">stime indicative</span> calcolate da magnitudo,
          profondità e distanza. Gli effetti reali dipendono da molti fattori (terreno, edificio, piano).
        </p>
        <p>
          Per capire quanto una scossa si è sentita a casa tua stimiamo l’intensità (scala Mercalli) con la formula di{' '}
          <ExternalLink href="https://doi.org/10.1007/s10950-012-9278-7">Allen, Wald e Worden (2012)</ExternalLink>, con un
          margine di circa un grado. Da lì scegliamo il tono: il numero 112 compare solo quando è plausibile che ci siano danni,
          o per una scossa di magnitudo 5 o più sentita forte dove sei.
        </p>
      </section>

      <section className="card stack">
        <h2>Privacy</h2>
        <p>
          Quake Italia non ha account, cookie, statistiche o pubblicità. Il tuo comune e le preferenze restano solo sul tuo
          dispositivo. Tutti i dettagli sono nella <Link to="/privacy">Privacy Policy</Link>; le regole d’uso e i limiti del
          servizio nei <Link to="/termini">Termini d’uso</Link>.
        </p>
      </section>
    </div>
  );
}
