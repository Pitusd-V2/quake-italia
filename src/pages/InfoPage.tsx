import { Link } from 'react-router';
import { TAGLINE } from '../lib/brand';
import { ExternalLink, PageHeader } from '../components/ui';

export function InfoPage() {
  return (
    <div className="container stack-lg prose">
      <PageHeader title="Informazioni" intro={`${TAGLINE} Perché esiste Quake Italia, da dove arrivano i dati e come li usiamo.`} />

      <section className="card stack" aria-labelledby="mission">
        <h2 id="mission">La nostra missione</h2>
        <p>
          Quake Italia è nato pensando a Napoli. Negli ultimi anni, ai Campi Flegrei, la terra ha ripreso a muoversi: il
          suolo che si alza, le scosse che si fanno sentire sempre più spesso, le notti passate in strada. E intanto si parla
          del Vesuvio, di Stromboli, del Marsili sommerso nel Tirreno: ogni notizia una paura nuova, a volte più grande della
          realtà.
        </p>
        <p>
          In quei momenti le domande sono sempre le stesse: cos’era? Era forte? Ne arriverà un’altra? Le risposte esistono,
          e le danno da una vita i ricercatori dell’Osservatorio Vesuviano dell’INGV, il più antico osservatorio vulcanologico
          del mondo. Ma chi non sa dove cercarle, o non sa leggerle, come tanti dei nostri genitori e dei nostri nonni, resta
          solo con la paura.
        </p>
        <p>
          <strong>Quake Italia è nato per loro</strong>, per chi vive ai Campi Flegrei e a Napoli: per dare una risposta
          chiara, vera e tranquilla, proprio quando serve. Poi abbiamo capito che le stesse domande se le fa tutta l’Italia,
          da Norcia a Catania, e il progetto è cresciuto con lei. Con un secondo obiettivo: che, passata la paura, chi vuole possa
          capire davvero cosa succede sotto i suoi piedi.
        </p>
        <p>
          Sui terremoti in Italia si sa moltissimo. L’INGV registra ogni scossa, giorno e notte; ogni comune ha la sua
          zona sismica ufficiale; i cataloghi raccontano mille anni di terremoti; ogni grande scossa viene studiata da decine
          di ricercatori. E gran parte di questa conoscenza è pubblica.
        </p>
        <p>
          Ma è sparsa in tanti posti diversi, ed è scritta per chi la studia di mestiere: sigle, tabelle, articoli scientifici
          in inglese. Chi non è un ricercatore spesso si ferma lì, e resta con le sue domande. Oppure trova le risposte
          sbagliate che girano in rete.
        </p>
        <p>
          <strong>Quake Italia prova ad accorciare questa distanza.</strong> Raccoglie in un solo posto i dati e le
          conoscenze ufficiali (i terremoti dell’INGV, le zone sismiche della Protezione Civile, i cataloghi storici, gli
          studi scientifici) e li traduce in parole che chiunque può capire. Tradurre non vuol dire impoverire: i concetti
          difficili restano, spiegati bene, e ogni affermazione porta alla sua fonte. La nostra regola è una sola:{' '}
          <strong>scientifico, ma capibile</strong>.
        </p>
        <p>
          <strong>E tutto è aperto:</strong> il codice del sito, i testi, i dati che usiamo e perfino i calcoli che facciamo.
          Chiunque può leggerli, controllarli, correggerli e riusarli. Lo facciamo per due ragioni. La prima è la fiducia: su
          un tema che fa paura non basta dire «fidati», bisogna mostrare come si arriva a ogni numero. La seconda è un
          principio: <strong>la cultura scientifica è un bene comune</strong>. Gran parte di questa conoscenza nasce dalla
          ricerca pubblica, e deve restare di tutti: senza abbonamenti, senza pubblicità, senza registrazioni.
        </p>
      </section>

      <section className="card stack" aria-labelledby="why">
        <h2 id="why">Perché Quake Italia, se c’è già l’INGV?</h2>
        <p>
          Bella domanda, ed è giusto farsela. L’<ExternalLink href="https://terremoti.ingv.it/">INGV</ExternalLink> è la
          fonte ufficiale: registra ogni terremoto in Italia, fa un lavoro scientifico prezioso e mette i suoi dati a
          disposizione di tutti, gratuitamente. È proprio grazie a questo che Quake Italia può esistere.
        </p>
        <p>
          Quake Italia <strong>non sostituisce l’INGV</strong>: usa <strong>gli stessi dati ufficiali</strong> e ci aggiunge
          quello che serve per capirli. È pensato per chi non fa il sismologo di mestiere: chi ha sentito una scossa e vuole
          sapere cos’era, chi vuole capire come funzionano i terremoti, chi cerca risposte chiare e verificabili. Con un
          occhio di riguardo per chi usa poco il telefono o il computer.
        </p>
        <p>
          Per i dati scientifici completi e per le comunicazioni ufficiali, il posto giusto resta l’INGV: in ogni scheda trovi
          il link alla pagina ufficiale dell’evento.
        </p>
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
            <span className="strong">Meteo del passato</span> (solo nell’articolo sul «tempo da terremoto»):{' '}
            <ExternalLink href="https://open-meteo.com/en/license">Open-Meteo</ExternalLink>, licenza CC BY 4.0, con dati della
            rianalisi ERA5 del Copernicus Climate Change Service. Scaricati una volta sola per preparare l’articolo: il sito
            non si collega a Open-Meteo.
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
        <p>
          Le frasi «Così si è sentita» (per esempio «come il passaggio di un camion in strada») riprendono le descrizioni
          ufficiali dei gradi della{' '}
          <ExternalLink href="https://www.usgs.gov/programs/earthquake-hazards/modified-mercalli-intensity-scale">
            scala Mercalli modificata (USGS)
          </ExternalLink>{' '}
          e della{' '}
          <ExternalLink href="https://quakes.bgs.ac.uk/education/faqs/ems_synopsis.html">scala europea EMS-98</ExternalLink>.
        </p>
      </section>

      <section className="card stack" aria-labelledby="open-source">
        <h2 id="open-source">Codice aperto</h2>
        <p>
          Quake Italia è <strong>open source</strong>: il codice è pubblico e chiunque può controllare come funziona, da
          dove arrivano i dati e come stimiamo quanto si è sentita una scossa. Non ci sono server privati né chiavi
          segrete.
        </p>
        <p>
          Il codice è distribuito con licenza AGPL-3.0, i testi con licenza CC BY-SA 4.0. Se sei un sismologo, un
          geologo o lavori nella protezione civile e trovi un errore, le segnalazioni sono benvenute.
        </p>
        <ExternalLink href="https://github.com/Pitusd-V2/quake-italia" className="btn btn--secondary">
          Il codice su GitHub
        </ExternalLink>
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
