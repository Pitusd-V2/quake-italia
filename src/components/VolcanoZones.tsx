import { Link } from 'react-router';
import { Mountain } from 'lucide-react';
import { VOLCANO_LINKS, VOLCANO_NAME, volcanoZonesFor, type Volcano, type VolcanoZone } from '../lib/volcanoZones';
import { SpeakButton } from './Actions';
import { ExternalLink } from './ui';

/** Cosa vuol dire, in pratica, essere in una zona. Testi presi dai piani nazionali della Protezione Civile. */
const MEANING = {
  rossa:
    'Zona rossa: è l’area che, se il vulcano desse segni di un’eruzione vicina, verrebbe evacuata prima che cominci. È il modo più sicuro per proteggere le persone dai flussi piroclastici (nubi di gas e cenere caldissime).',
  gialla:
    'Zona gialla: in caso di eruzione potrebbe cadere molta cenere. Se servisse, il Comune potrebbe chiedere di lasciare per qualche tempo gli edifici resi fragili dalla cenere: le decisioni si prendono durante l’evento, in base al vento.',
};

/** «in Toscana», ma «nel Lazio» e «nelle Marche». */
const inRegion = (r: string) => (r === 'Lazio' ? 'nel Lazio' : r === 'Marche' ? 'nelle Marche' : `in ${r}`);

function zoneTitle(comune: string, z: VolcanoZone): string {
  const where = `zona ${z.zone} ${z.volcano === 'vesuvio' ? 'del Vesuvio' : 'dei Campi Flegrei'}`;
  return z.partial ? `Una parte di ${comune} è nella ${where}` : `${comune} è nella ${where}`;
}

/** Solo ciò che è specifico di questa zona; le spiegazioni comuni sono scritte una volta sola sotto. */
function zoneLines(comune: string, z: VolcanoZone): string[] {
  const lines: string[] = [];
  if (z.parts) lines.push(`Ne fanno parte ${z.parts}.`);
  if (z.twin) {
    const who = z.partial ? 'gli abitanti di questa parte del comune' : `gli abitanti di ${comune}`;
    lines.push(`In caso di evacuazione ${who} sarebbero accolti ${inRegion(z.twin)}, la regione «gemellata».`);
  }
  return lines;
}

export function VolcanoZones({ comune, sigla }: { comune: string; sigla: string }) {
  const zones = volcanoZonesFor(comune, sigla);
  if (!zones.length) return null;
  const volcanoes = [...new Set(zones.map((z) => z.volcano))] as Volcano[];
  const colors = (['rossa', 'gialla'] as const).filter((c) => zones.some((z) => z.zone === c));
  const partial = zones.some((z) => z.partial);
  const partialText = 'Conosciamo il tuo comune ma non il tuo indirizzo: controlla sulla mappa ufficiale in quale zona è la tua via.';
  const speech = [
    ...zones.map((z) => `${zoneTitle(comune, z)}. ${zoneLines(comune, z).join(' ')}`),
    ...(partial ? [partialText] : []),
    ...colors.map((c) => MEANING[c]),
  ].join(' ');

  return (
    <section className="card stack" aria-labelledby="volcano-title">
      <h2 id="volcano-title" className="icon-title">
        <Mountain aria-hidden="true" /> Vicino a un vulcano
      </h2>
      <p>
        Per {volcanoes.map((v) => (v === 'vesuvio' ? 'il Vesuvio' : 'i Campi Flegrei')).join(' e per ')}{' '}
        {volcanoes.length > 1 ? 'esistono piani nazionali di protezione civile, che dividono' : 'esiste un piano nazionale di protezione civile, che divide'} il
        territorio in zone. Essere in una di queste zone <span className="strong">non vuol dire che un’eruzione sia
        vicina</span>: vuol dire sapere in anticipo cosa si farebbe.
      </p>

      {zones.map((z) => (
        <div key={`${z.volcano}-${z.zone}`} className={`volcano-zone volcano-zone--${z.zone} stack-sm`}>
          <h3>{zoneTitle(comune, z)}</h3>
          {zoneLines(comune, z).map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      ))}

      {partial && <p className="strong">{partialText}</p>}
      <ul className="advice">
        {colors.map((c) => (
          <li key={c}>{MEANING[c]}</li>
        ))}
      </ul>

      <p>
        Lo stato del vulcano e il livello di allerta li comunica la Protezione Civile, sulla base dei dati dell’
        <ExternalLink href="https://www.ov.ingv.it/">Osservatorio Vesuviano dell’INGV</ExternalLink>. Segui anche le
        indicazioni del tuo Comune.
      </p>
      <div className="row">
        <SpeakButton text={speech} />
      </div>
      <ul className="advice">
        {volcanoes.map((v) => (
          <li key={v}>
            {VOLCANO_NAME[v]}: <ExternalLink href={VOLCANO_LINKS[v].plan}>il piano nazionale e la mappa delle zone</ExternalLink> ·{' '}
            <ExternalLink href={VOLCANO_LINKS[v].advice}>cosa sapere e cosa fare (Io non rischio)</ExternalLink>
          </li>
        ))}
        {volcanoes.includes('campi-flegrei') && (
          <li>
            Per capire il bradisismo e le scosse dei Campi Flegrei: <Link to="/capire/campi-flegrei">la caldera che respira</Link>.
          </li>
        )}
      </ul>
    </section>
  );
}

/** Due parole per la scheda in pagina iniziale: «zona rossa del Vesuvio», «in parte in zona rossa di Vesuvio e Campi Flegrei». */
export function volcanoShort(comune: string, sigla: string): string | null {
  const zones = volcanoZonesFor(comune, sigla);
  if (!zones.length) return null;
  const top = zones.filter((z) => z.zone === zones[0].zone);
  const partial = top.every((z) => z.partial);
  const of = top.length > 1 ? 'di Vesuvio e Campi Flegrei' : top[0].volcano === 'vesuvio' ? 'del Vesuvio' : 'dei Campi Flegrei';
  return `${partial ? 'in parte in ' : ''}zona ${top[0].zone} ${of}`;
}
