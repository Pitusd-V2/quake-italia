import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { readRaw, writeJson } from '../lib/storage';
import { BookOpen, ChevronRight, MapPinned } from 'lucide-react';
import { findComune } from '../lib/seismicZones';
import { volcanoNear } from '../lib/volcanoAreas';
import { findCard } from '../learn/catalog';
import type { Place } from '../lib/types';

const KEY = 'quakeitalia:per-cominciare:v1';

/** La data di oggi sul dispositivo, «2026-11-13»: il riquadro vale per la giornata in cui si è scelto il comune. */
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Lo stato salvato può essere stato modificato a mano: vale solo una data scritta bene. */
export function shouldShowFirstSteps(raw: unknown, today: string): boolean {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && r.day === today && r.closed !== true;
}

/**
 * Quando mostrare «Per cominciare»: dalla scelta del comune finché la persona non tocca «Chiudi», e al massimo per
 * quella giornata. Così chi apre una lettura e torna indietro ritrova l'altra; il giorno dopo non ricompare.
 */
export function useFirstSteps() {
  const [show, setShow] = useState(() => shouldShowFirstSteps(readRaw(KEY), localDay()));
  return {
    show,
    start: () => {
      writeJson(KEY, { day: localDay(), closed: false });
      setShow(true);
    },
    close: () => {
      writeJson(KEY, { day: localDay(), closed: true });
      setShow(false);
    },
  };
}

/** Una domanda che porta a un articolo di «Capire». Niente, se l'articolo non esiste. */
function Ask({ slug, question }: { slug: string; question?: string }) {
  const card = findCard(slug);
  if (!card) return null;
  return (
    <li>
      <Link to={`/capire/${card.slug}`} className="ask">
        <span>
          <span className="strong">{question ?? card.domanda}</span>
          <span className="small muted">
            {card.titolo} · {card.minuti} minuti
          </span>
        </span>
        <ChevronRight aria-hidden="true" />
      </Link>
    </li>
  );
}

/**
 * «Per cominciare»: compare dopo la scelta del comune nella pagina iniziale, per quella giornata (vedi useFirstSteps).
 * Propone le letture legate al posto dove si vive (la zona sismica del comune, il vulcano vicino) invece di un generico
 * «leggi i nostri articoli»; vicino a un vulcano invita anche a indicare il punto di casa, che lì conta di più.
 */
export function FirstSteps({ place, onClose }: { place: Place; onClose: () => void }) {
  const zone = useQuery({
    queryKey: ['zone', place.name, place.detail],
    queryFn: () => findComune(place),
    staleTime: Infinity,
  });
  const volcano = volcanoNear(place);
  const z = zone.data;

  return (
    <section className="card stack first-steps" aria-labelledby="first-steps-title">
      <h2 id="first-steps-title" className="icon-title">
        <BookOpen aria-hidden="true" /> Per cominciare
      </h2>
      <p>
        Fatto: ora ti diciamo cosa succede vicino a {place.name}. Se ti va, qui sotto ci sono due letture per capire il posto
        dove vivi.
      </p>

      <ul className="ask-list">
        {z && <Ask slug="le-zone-sismiche" question={`${z.comune} è in zona sismica ${z.zone}: cosa vuol dire per casa tua?`} />}
        {volcano?.name === 'Campi Flegrei' ? (
          <Ask slug="campi-flegrei" />
        ) : volcano ? (
          <Ask slug="terremoti-e-vulcani" />
        ) : (
          <Ask slug="perche-l-italia-trema" />
        )}
      </ul>

      {volcano && !place.point && (
        <div className="first-steps__point">
          <p className="icon-title strong">
            <MapPinned aria-hidden="true" /> Qui pochi chilometri contano
          </p>
          <p>
            Abiti {volcano.near}, dove le scosse sono molto superficiali: la stessa scossa si sente in modo molto diverso da un
            quartiere all’altro. Se indichi dove abiti, la stima di quanto una scossa si è sentita da te diventa più precisa. Il
            punto resta solo su questo dispositivo.
          </p>
          <div>
            <Link to="/impostazioni#punto-casa" className="btn btn--secondary">
              Indica il punto di casa
            </Link>
          </div>
        </div>
      )}

      <div className="row">
        <Link to="/capire" className="btn btn--ghost">
          Tutti i percorsi di «Capire»
        </Link>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </section>
  );
}
