import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { buildQueryUrl } from '../../../lib/ingv';
import { downloadText, toCsv, toGeoJson } from '../../../lib/export';
import { formatInt } from '../../../lib/format';
import { ExternalLink } from '../../../components/ui';
import type { ToolProps } from '../registry';

export default function DataTool({ quakes, query }: ToolProps) {
  const url = buildQueryUrl(query);
  const [copied, setCopied] = useState(false);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      window.prompt('Copia la richiesta:', url);
    }
  };

  return (
    <div className="stack-lg">
      <section className="stack">
        <h3>Esporta i {formatInt(quakes.length)} eventi</h3>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={() => downloadText(`quakeitalia-${stamp}.csv`, toCsv(quakes), 'text/csv')}>
            <Download aria-hidden="true" /> CSV
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => downloadText(`quakeitalia-${stamp}.geojson`, toGeoJson(quakes), 'application/geo+json')}
          >
            <Download aria-hidden="true" /> GeoJSON
          </button>
        </div>
        <p className="small muted">Orari in UTC (ISO 8601). Il CSV usa la virgola come separatore e il punto per i decimali.</p>
      </section>

      <section className="stack">
        <h3>Richiesta FDSN equivalente</h3>
        <pre className="code" tabIndex={0}>
          <code>{url}</code>
        </pre>
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copiata' : 'Copia'}
          </button>
          <ExternalLink href={url.replace('format=geojson', 'format=text')} className="btn btn--ghost">
            Formato testo
          </ExternalLink>
          <ExternalLink href={url.replace('format=geojson', 'format=xml')} className="btn btn--ghost">
            QuakeML
          </ExternalLink>
        </div>
        <p className="small muted">
          Standard FDSN event 1.0. Parametri utili: starttime, endtime, minmag, maxmag, mindepth, maxdepth, minlat/maxlat/minlon/maxlon
          oppure lat, lon, maxradiuskm; orderby; limit; eventid. Senza risultati il servizio risponde 204 (nessun contenuto).
          Documentazione: <ExternalLink href="https://webservices.ingv.it/swagger-ui/dist/?url=https://ingv.github.io/openapi/fdsnws/event/0.0.1/event.yaml">webservices.ingv.it</ExternalLink>.
        </p>
      </section>

      <section className="stack">
        <h3>Come citare i dati</h3>
        <p className="small">
          ISIDe Working Group (2007). Italian Seismological Instrumental and Parametric Database (ISIDe). Istituto Nazionale di
          Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/ISIDE — licenza CC BY 4.0.
        </p>
      </section>
    </div>
  );
}
