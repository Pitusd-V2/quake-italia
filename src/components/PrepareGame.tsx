import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardCheck, Compass, HardHat, Trophy, Users, Wrench, type LucideIcon } from 'lucide-react';
import { useSettings } from '../state/settings';
import {
  LEVELS,
  missionDone,
  missionKeys,
  partsDone,
  progress,
  withKeys,
  type Checklist,
  type Mission,
} from '../lib/prepare';
import { ExternalLink } from './ui';

const BADGE_ICONS: Record<number, LucideIcon> = { 1: Compass, 2: Wrench, 3: Users, 4: HardHat };

const SOURCE_URL = 'https://iononrischio.protezionecivile.it/it/preparati/terremoto/cosa-fare/';

/** «Prepara la tua casa» come un gioco a livelli: missioni concrete e distintivi. */
export function PrepareGame({ homeName }: { homeName?: string }) {
  const { settings, update } = useSettings();
  const list = settings.checklist;
  const prog = progress(list);
  const [open, setOpen] = useState<number | null>(() => prog.levels.find((l) => !l.complete)?.level.n ?? null);
  /** Il livello appena finito: il suo distintivo fa una piccola festa e lo annunciamo. */
  const [justEarned, setJustEarned] = useState<number | null>(null);

  const set = (keys: string[], value: boolean) => {
    const next = withKeys(list, keys, value);
    const before = progress(list).levels;
    const gained = progress(next).levels.find((l, i) => l.complete && !before[i].complete);
    setJustEarned(gained ? gained.level.n : null);
    update({ checklist: next });
  };

  const earned = prog.levels.filter((l) => l.complete);
  const earnedNow = justEarned != null ? LEVELS.find((l) => l.n === justEarned) : undefined;

  return (
    <section className="card stack prep" aria-labelledby="check-title">
      <h2 id="check-title" className="icon-title">
        <ClipboardCheck aria-hidden="true" /> Prepara la tua casa
      </h2>
      <p>Missioni concrete, divise in quattro livelli. Si fanno un pezzo alla volta, con calma: ogni livello finito vale un distintivo.</p>

      <div className="prep-summary">
        <ul className="prep-badges" aria-label={`Distintivi conquistati: ${earned.length} su ${LEVELS.length}`}>
          {prog.levels.map(({ level, complete }) => {
            const Icon = BADGE_ICONS[level.n];
            return (
              <li key={level.n} className={`prep-badge${complete ? ' is-earned' : ''}${justEarned === level.n ? ' is-new' : ''}`}>
                <span className="prep-badge__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="prep-badge__name">
                  {level.badge}
                  <span className="visually-hidden">{complete ? ': conquistato' : ': da conquistare'}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(prog.done / prog.total) * 100}%` }} />
        </div>
        <p className="strong" role="status">
          Missioni fatte: {prog.done} su {prog.total}.
          {earnedNow && <> Distintivo «{earnedNow.badge}» conquistato!</>}
        </p>
      </div>

      {prog.complete && (
        <div className="prep-finale">
          <Trophy aria-hidden="true" />
          <p>
            <span className="strong">Casa preparata.</span> Hai fatto tutto quello che la Protezione Civile consiglia di fare
            fin da subito. Ogni tanto ricontrolla il kit: pile cariche, medicine non scadute.
          </p>
        </div>
      )}

      <div className="prep-levels">
        {prog.levels.map(({ level, done, total, complete }) => {
          const isOpen = open === level.n;
          const Icon = BADGE_ICONS[level.n];
          const panelId = `prep-level-${level.n}`;
          return (
            <section key={level.n} className={`prep-level${complete ? ' is-complete' : ''}`}>
              <h3 className="prep-level__heading">
                <button
                  type="button"
                  className="prep-level__head"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : level.n)}
                >
                  <span className={`prep-level__badge${complete ? ' is-earned' : ''}`} aria-hidden="true">
                    {complete ? <Check /> : <Icon />}
                  </span>
                  <span className="prep-level__text">
                    <span className="prep-level__title">
                      Livello {level.n}: {level.title}
                    </span>
                    <span className="prep-level__meta">
                      {complete ? `Distintivo «${level.badge}» conquistato` : `${done} su ${total} ${total === 1 ? 'missione' : 'missioni'}`}
                    </span>
                    <span className="progress progress--thin" aria-hidden="true">
                      <span style={{ width: `${(done / total) * 100}%` }} />
                    </span>
                  </span>
                  <ChevronDown className="prep-level__chev" aria-hidden="true" />
                </button>
              </h3>
              {isOpen && (
                <ul id={panelId} className="missions">
                  {level.missions.map((m) => (
                    <MissionItem key={m.id} m={m} list={list} onSet={set} homeName={homeName} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p className="small muted">
        Le missioni vengono dai consigli della campagna{' '}
        <ExternalLink href={SOURCE_URL}>Io non rischio</ExternalLink> della Protezione Civile. Le spunte restano salvate su
        questo dispositivo.
      </p>
    </section>
  );
}

function MissionItem({
  m,
  list,
  onSet,
  homeName,
}: {
  m: Mission;
  list: Checklist;
  onSet: (keys: string[], value: boolean) => void;
  homeName?: string;
}) {
  const done = missionDone(m, list);
  const n = partsDone(m, list);
  const partial = !!m.parts && n > 0 && !done;
  const box = useRef<HTMLInputElement>(null);
  // Per le missioni a pezzi: la casella principale è «a metà» finché non sono fatti tutti.
  useEffect(() => {
    if (box.current) box.current.indeterminate = partial;
  }, [partial]);

  return (
    <li className={`mission${done ? ' is-done' : ''}`}>
      <label className="mission__head">
        <input ref={box} type="checkbox" checked={done} onChange={() => onSet(missionKeys(m), !done)} />
        <span className="check__box" aria-hidden="true">
          <Check />
        </span>
        <span className="mission__title">
          {m.title}
          <span className="mission__time">{m.time}</span>
        </span>
      </label>
      <p className="mission__how">{m.how}</p>

      {m.parts && (
        <ul className="mission__parts" aria-label={`Fatti ${n} su ${m.parts.length}`}>
          {m.parts.map((p) => {
            const on = list[p.key] === true;
            return (
              <li key={p.key}>
                <label className={`part-chip${on ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => onSet([p.key], !on)} />
                  <Check aria-hidden="true" />
                  {p.label}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {m.townPlan && homeName && (
        <ExternalLink
          href={`https://www.google.com/search?q=${encodeURIComponent(`piano protezione civile comune di ${homeName} aree di attesa`)}`}
          className="btn btn--secondary mission__action"
        >
          Cerca il piano di {homeName}
        </ExternalLink>
      )}
    </li>
  );
}
