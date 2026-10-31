import { useState } from 'react';
import { Link } from 'react-router';
import { Download, MapPin } from 'lucide-react';
import { useSettings, type TextSize, type ThemePref } from '../state/settings';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { PlacePicker } from '../components/PlacePicker';
import { MyData } from '../components/MyData';
import { Notice, PageHeader, Segmented, Switch } from '../components/ui';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'normal', label: 'Normale' },
  { value: 'large', label: 'Grande' },
  { value: 'xlarge', label: 'Molto grande' },
];
const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
  { value: 'auto', label: 'Come il telefono' },
];
const RADII = ['30', '50', '100', '200'] as const;
const ALERT_MAGS = ['2', '2.5', '3', '4'] as const;

type Perm = NotificationPermission | 'unsupported';
const currentPermission = (): Perm => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

export function SettingsPage() {
  const { settings, update } = useSettings();
  const [changingHome, setChangingHome] = useState(false);
  const [perm, setPerm] = useState<Perm>(currentPermission);
  const pwa = useInstallPrompt();

  const toggleAlerts = async (on: boolean) => {
    if (on && perm === 'default') {
      const p = await Notification.requestPermission();
      setPerm(p);
    }
    update({ alerts: { ...settings.alerts, enabled: on } });
  };

  return (
    <div className="container stack-lg">
      <PageHeader title="Impostazioni" intro="Tutto resta salvato solo su questo dispositivo." />

      <section className="card stack" aria-labelledby="s-home">
        <h2 id="s-home">Il tuo comune</h2>
        {settings.home && !changingHome ? (
          <>
            <p className="lead">
              <MapPin className="inline-icon" aria-hidden="true" /> <span className="strong">{settings.home.name}</span>
              {settings.home.detail && <span className="muted"> — {settings.home.detail}</span>}
            </p>
            <div className="row">
              <button type="button" className="btn btn--secondary" onClick={() => setChangingHome(true)}>
                Cambia comune
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => update({ home: null })}>
                Rimuovi
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Serve per dirti se una scossa è vicina a te e se potresti averla sentita.</p>
            <PlacePicker
              onPick={(home) => {
                update({ home, onboarded: true });
                setChangingHome(false);
              }}
            />
            {changingHome && (
              <button type="button" className="btn btn--ghost" onClick={() => setChangingHome(false)}>
                Annulla
              </button>
            )}
          </>
        )}
        <Segmented
          legend='Cosa vuol dire "vicino a me"?'
          options={RADII.map((r) => ({ value: r, label: `${r} km` }))}
          value={String(settings.radiusKm) as (typeof RADII)[number]}
          onChange={(v) => update({ radiusKm: Number(v) })}
        />
      </section>

      <section className="card stack" aria-labelledby="s-look">
        <h2 id="s-look">Aspetto</h2>
        <Segmented
          legend="Grandezza del testo"
          options={TEXT_SIZES}
          value={settings.textSize}
          onChange={(textSize) => update({ textSize })}
        />
        <Segmented legend="Colori" options={THEMES} value={settings.theme} onChange={(theme) => update({ theme })} />
        <Switch
          label="Contrasto elevato"
          description="Testi più scuri e bordi più marcati, per leggere meglio."
          checked={settings.highContrast}
          onChange={(highContrast) => update({ highContrast })}
        />
      </section>

      <section className="card stack" aria-labelledby="s-alerts">
        <h2 id="s-alerts">Avvisi</h2>
        <Switch
          label="Avvisami delle nuove scosse"
          description={
            settings.home
              ? `Quando c'è una nuova scossa entro ${settings.radiusKm} km da ${settings.home.name}, e quando una scossa più lontana si può essere sentita a ${settings.home.name}.`
              : 'Imposta il tuo comune per ricevere avvisi sulle scosse vicine. Senza comune ti avvisiamo solo per le scosse più forti in Italia.'
          }
          checked={settings.alerts.enabled && perm === 'granted'}
          disabled={perm === 'unsupported' || perm === 'denied'}
          onChange={toggleAlerts}
        />
        {perm === 'denied' && (
          <Notice tone="warn" title="Le notifiche sono bloccate">
            <p>Per attivarle, consenti le notifiche per questo sito nelle impostazioni del browser, poi torna qui.</p>
          </Notice>
        )}
        {perm === 'unsupported' && (
          <Notice tone="info">
            <p>Questo browser non supporta le notifiche. Su iPhone funzionano se aggiungi Quake Italia alla schermata Home.</p>
          </Notice>
        )}
        <Segmented
          legend="Avvisami a partire da magnitudo"
          options={ALERT_MAGS.map((m) => ({ value: m, label: m.replace('.', ',') }))}
          value={String(settings.alerts.minMag) as (typeof ALERT_MAGS)[number]}
          onChange={(v) => update({ alerts: { ...settings.alerts, minMag: Number(v) } })}
        />
        <p className="small muted">
          Gli avvisi arrivano solo mentre Quake Italia è aperto, con qualche minuto di ritardo rispetto alla scossa. Sul
          computer arrivano anche se il sito è in un'altra scheda; sul telefono di solito solo mentre Quake Italia è aperto
          sullo schermo. <span className="strong">Non è un sistema di allerta</span> e non può avvisarti prima di un
          terremoto.
        </p>
      </section>

      {!pwa.installed && (pwa.canInstall || pwa.isIos) && (
        <section className="card stack" aria-labelledby="s-install">
          <h2 id="s-install">Installa Quake Italia</h2>
          <p>Aggiungi Quake Italia alla schermata principale: si apre con un tocco, come un'app, e funziona anche senza rete con gli ultimi dati scaricati.</p>
          {pwa.canInstall ? (
            <button type="button" className="btn btn--primary" onClick={pwa.install}>
              <Download aria-hidden="true" /> Installa l'app
            </button>
          ) : (
            <p>
              Su iPhone o iPad: tocca il pulsante <span className="strong">Condividi</span> in basso, poi{' '}
              <span className="strong">Aggiungi alla schermata Home</span>.
            </p>
          )}
        </section>
      )}

      <MyData />

      <p className="footer-links">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/termini">Termini d’uso</Link>
        <Link to="/informazioni">Informazioni e crediti</Link>
      </p>
    </div>
  );
}
