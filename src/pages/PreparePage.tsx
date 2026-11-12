import { Link } from 'react-router';
import { Landmark, LifeBuoy } from 'lucide-react';
import { useSettings } from '../state/settings';
import { PrepareGame } from '../components/PrepareGame';
import { PageHeader } from '../components/ui';

/** «Prepara la tua casa»: il gioco a livelli, in una pagina sua. Funziona anche senza aver scelto il comune. */
export function PreparePage() {
  const { settings } = useSettings();
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Prepara la tua casa"
        intro="Le cose da fare prima di una scossa, una alla volta: missioni concrete, in quattro livelli. Ogni livello finito vale un distintivo. I consigli sono quelli della campagna «Io non rischio» della Protezione Civile."
      />

      <PrepareGame homeName={settings.home?.name} heading="Livelli e missioni" intro={false} />

      <p className="small muted">Le tue spunte restano salvate solo su questo dispositivo.</p>

      <Link to="/cosa-fare" className="tip">
        <LifeBuoy aria-hidden="true" />
        <span>
          <span className="strong">Cosa fare durante e dopo una scossa.</span>
          <span className="muted"> Pochi consigli semplici, da leggere con calma.</span>
        </span>
      </Link>
      <Link to="/il-mio-comune" className="tip">
        <Landmark aria-hidden="true" />
        <span>
          <span className="strong">Il mio comune.</span>
          <span className="muted"> La zona sismica dove vivi e i terremoti del passato.</span>
        </span>
      </Link>
    </div>
  );
}
