import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatFull, formatMag } from '../../../lib/format';
import type { Quake } from '../../../lib/types';
import type { ToolProps } from '../registry';

type Col = 'time' | 'mag' | 'depthKm' | 'lat' | 'lon' | 'place';
const COLS: { id: Col; label: string; numeric?: boolean }[] = [
  { id: 'time', label: 'Data e ora (italiana)' },
  { id: 'mag', label: 'Magnitudo', numeric: true },
  { id: 'depthKm', label: 'Prof. (km)', numeric: true },
  { id: 'lat', label: 'Lat', numeric: true },
  { id: 'lon', label: 'Lon', numeric: true },
  { id: 'place', label: 'Località' },
];
const PAGE = 50;

const value = (q: Quake, c: Col) => (c === 'time' ? q.time.getTime() : q[c]);

export default function TableTool({ quakes }: ToolProps) {
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: 'time', dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const s = [...quakes];
    s.sort((a, b) => {
      const va = value(a, sort.col);
      const vb = value(b, sort.col);
      return (typeof va === 'string' ? va.localeCompare(vb as string, 'it') : (va as number) - (vb as number)) * sort.dir;
    });
    return s;
  }, [quakes, sort]);

  const pages = Math.ceil(rows.length / PAGE);
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * PAGE, current * PAGE + PAGE);

  const toggle = (col: Col) => {
    setSort((s) => (s.col === col ? { col, dir: s.dir === 1 ? -1 : 1 } : { col, dir: col === 'place' ? 1 : -1 }));
    setPage(0);
  };

  return (
    <div className="stack">
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabella degli eventi (scorre orizzontalmente)">
        <table className="data-table tabular">
          <caption className="visually-hidden">
            Eventi trovati, ordinati per {COLS.find((c) => c.id === sort.col)!.label} {sort.dir === 1 ? 'crescente' : 'decrescente'}
          </caption>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={c.numeric ? 'num' : undefined}
                  aria-sort={sort.col === c.id ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" className="th-btn" onClick={() => toggle(c.id)}>
                    {c.label}
                    {sort.col === c.id && (sort.dir === 1 ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((q) => (
              <tr key={q.id}>
                <td>
                  <Link to={`/terremoto/${q.id}`}>{formatFull(q.time)}</Link>
                </td>
                <td className="num">
                  {formatMag(q.mag)} <span className="muted">{q.magType}</span>
                </td>
                <td className="num">{q.depthKm.toFixed(1)}</td>
                <td className="num">{q.lat.toFixed(3)}</td>
                <td className="num">{q.lon.toFixed(3)}</td>
                <td>{q.place}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="pager" aria-label="Pagine della tabella">
          <button type="button" className="btn btn--secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Precedenti
          </button>
          <span aria-live="polite">
            Pagina {current + 1} di {pages}
          </span>
          <button type="button" className="btn btn--secondary" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Successivi
          </button>
        </nav>
      )}
    </div>
  );
}
