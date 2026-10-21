import { Suspense, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { RefreshCw, Search } from 'lucide-react';
import { useSettings } from '../../state/settings';
import { useQuakeSearch } from '../../state/quakes';
import { formatInt, formatMag } from '../../lib/format';
import { ErrorBox, LoadingCards, Notice, PageHeader, Segmented } from '../../components/ui';
import { EXPERT_TOOLS } from './registry';
import { buildQuery, formFromParams, MAX_LIMIT, paramsFromForm, type Area, type ExpertForm, type PeriodPreset } from './query';

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: '1g', label: '24 ore' },
  { value: '7g', label: '7 giorni' },
  { value: '30g', label: '30 giorni' },
  { value: '90g', label: '90 giorni' },
  { value: '1a', label: '1 anno' },
  { value: 'custom', label: 'Date…' },
];

function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {children(id)}
      {hint && <p className="field__help">{hint}</p>}
    </div>
  );
}

function ToolTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = EXPERT_TOOLS.length;
    const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(EXPERT_TOOLS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label="Strumenti di analisi">
      {EXPERT_TOOLS.map((t, i) => {
        const Icon = t.icon;
        const selected = t.id === active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={selected ? 0 : -1}
            className="tab"
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <Icon aria-hidden="true" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ExpertPage() {
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const paramKey = params.toString();
  const applied = useMemo(() => formFromParams(new URLSearchParams(paramKey)), [paramKey]);
  const [form, setForm] = useState<ExpertForm>(applied);
  useEffect(() => setForm(applied), [applied]);

  const toolId = EXPERT_TOOLS.some((t) => t.id === params.get('strumento')) ? params.get('strumento')! : EXPERT_TOOLS[0].id;
  const tool = EXPERT_TOOLS.find((t) => t.id === toolId)!;

  // La ricerca effettiva dipende solo dai parametri applicati (non dal modulo in modifica).
  const searchKey = paramsFromForm(applied, new URLSearchParams()).toString();
  const built = useMemo(() => buildQuery(applied, settings.home), [searchKey, settings.home]); // eslint-disable-line react-hooks/exhaustive-deps
  const result = useQuakeSearch(built.query, searchKey + (applied.area === 'casa' ? JSON.stringify(settings.home) : ''));
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof ExpertForm>(k: K, v: ExpertForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const check = buildQuery(form, settings.home);
    setFormError(check.error);
    if (check.error) return;
    setParams(paramsFromForm(form, params));
  };

  const setTool = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('strumento', id);
    setParams(next, { replace: true });
  };

  const quakes = result.data ?? [];
  const maxMag = quakes.reduce((m, q) => Math.max(m, q.mag), -Infinity);
  const hitLimit = built.query?.limit != null && quakes.length >= built.query.limit;
  const ToolComponent = tool.component;

  return (
    <div className="container container--wide stack-lg">
      <PageHeader title="Analisi" intro="Ricerca nel catalogo INGV con filtri avanzati. Il link nella barra dell'indirizzo conserva la ricerca: puoi salvarlo o condividerlo." />

      <form className="card expert-form" onSubmit={submit} aria-label="Filtri di ricerca" noValidate>
        <Segmented legend="Periodo" options={PERIODS} value={form.period} onChange={(v) => set('period', v)} />
        {form.period === 'custom' && (
          <div className="form-grid">
            <Field label="Dal giorno">{(id) => <input id={id} className="input" type="date" value={form.from} onChange={(e) => set('from', e.target.value)} />}</Field>
            <Field label="Al giorno" hint="Vuoto = fino a oggi">
              {(id) => <input id={id} className="input" type="date" value={form.to} onChange={(e) => set('to', e.target.value)} />}
            </Field>
          </div>
        )}
        <div className="form-grid">
          <Field label="Magnitudo min">{(id) => <input id={id} className="input" inputMode="decimal" placeholder="es. 2,0" value={form.minMag} onChange={(e) => set('minMag', e.target.value)} />}</Field>
          <Field label="Magnitudo max">{(id) => <input id={id} className="input" inputMode="decimal" value={form.maxMag} onChange={(e) => set('maxMag', e.target.value)} />}</Field>
          <Field label="Profondità min (km)">{(id) => <input id={id} className="input" inputMode="decimal" value={form.minDepth} onChange={(e) => set('minDepth', e.target.value)} />}</Field>
          <Field label="Profondità max (km)">{(id) => <input id={id} className="input" inputMode="decimal" value={form.maxDepth} onChange={(e) => set('maxDepth', e.target.value)} />}</Field>
        </div>
        <Segmented<Area>
          legend="Area"
          options={[
            { value: 'italia', label: 'Italia' },
            { value: 'mondo', label: 'Mondo' },
            { value: 'casa', label: settings.home ? `Intorno a ${settings.home.name}` : 'Intorno a casa' },
            { value: 'punto', label: 'Punto (lat/lon)' },
          ]}
          value={form.area}
          onChange={(v) => set('area', v)}
        />
        {(form.area === 'casa' || form.area === 'punto') && (
          <div className="form-grid">
            {form.area === 'punto' && (
              <>
                <Field label="Latitudine">{(id) => <input id={id} className="input" inputMode="decimal" placeholder="42.79" value={form.lat} onChange={(e) => set('lat', e.target.value)} />}</Field>
                <Field label="Longitudine">{(id) => <input id={id} className="input" inputMode="decimal" placeholder="13.09" value={form.lon} onChange={(e) => set('lon', e.target.value)} />}</Field>
              </>
            )}
            <Field label="Raggio (km)">{(id) => <input id={id} className="input" inputMode="numeric" value={form.radiusKm} onChange={(e) => set('radiusKm', e.target.value)} />}</Field>
          </div>
        )}
        <div className="form-grid">
          <Field label="Numero massimo di eventi" hint={`Fino a ${formatInt(MAX_LIMIT)}`}>
            {(id) => <input id={id} className="input" inputMode="numeric" value={form.limit} onChange={(e) => set('limit', e.target.value)} />}
          </Field>
        </div>
        {formError && (
          <p className="field__error" role="alert">
            {formError}
          </p>
        )}
        <div className="row">
          <button type="submit" className="btn btn--primary">
            <Search aria-hidden="true" /> Cerca
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => result.refetch()} disabled={result.isFetching || !built.query}>
            <RefreshCw className={result.isFetching ? 'spin' : undefined} aria-hidden="true" /> Aggiorna
          </button>
        </div>
      </form>

      {built.error && <ErrorBox message={built.error} />}
      {result.isError && <ErrorBox message={(result.error as Error).message} onRetry={() => result.refetch()} />}
      {result.isPending && built.query && <LoadingCards count={2} label="Sto interrogando il catalogo INGV…" />}

      {result.data && (
        <>
          <p className="summary" role="status">
            <span className="strong">{formatInt(quakes.length)}</span> eventi
            {quakes.length > 0 && (
              <>
                {' '}· magnitudo massima <span className="strong">{formatMag(maxMag)}</span>
              </>
            )}
            {result.isFetching && ' · aggiornamento in corso…'}
          </p>
          {hitLimit && (
            <Notice tone="warn" title="Hai raggiunto il numero massimo di eventi">
              <p>I risultati sono incompleti: restringi periodo, area o magnitudo, oppure aumenta il limite.</p>
            </Notice>
          )}

          <ToolTabs active={toolId} onChange={setTool} />
          <section id={`panel-${toolId}`} role="tabpanel" aria-labelledby={`tab-${toolId}`} className="tool-panel" tabIndex={0}>
            <p className="muted">{tool.description}</p>
            {quakes.length === 0 ? (
              <p className="empty">Nessun evento con questi filtri. Prova ad allargare la ricerca.</p>
            ) : (
              <Suspense fallback={<LoadingCards count={1} label="Sto preparando lo strumento…" />}>
                <ToolComponent quakes={quakes} query={built.query!} home={settings.home} refreshing={result.isFetching} />
              </Suspense>
            )}
          </section>
        </>
      )}
    </div>
  );
}
