/** Piccoli componenti di base, grandi e facili da toccare. */
import { useId, type ReactNode } from 'react';
import { AlertCircle, ExternalLink as ExternalIcon, RefreshCw } from 'lucide-react';
import { isAllowedLink } from '../lib/sanitize';

/* ---------- Scelta tra poche opzioni (radio stilizzati) ---------- */

export interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
}: {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  hideLegend?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend className={hideLegend ? 'visually-hidden' : 'segmented__legend'}>{legend}</legend>
      <div className="segmented__options">
        {options.map((o) => (
          <label key={o.value} className="segmented__option">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Interruttore Sì/No con testo visibile ---------- */

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="switch-row">
      <div className="switch-row__text">
        <span id={`${id}-l`} className="switch-row__label">
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className="switch-row__desc">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        className="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
        <span className="switch__state" aria-hidden="true">
          {checked ? 'Sì' : 'No'}
        </span>
      </button>
    </div>
  );
}

/* ---------- Stati: caricamento, errore, vuoto ---------- */

export function LoadingCards({ count = 3, label = 'Sto caricando i terremoti…' }: { count?: number; label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" aria-hidden="true" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice notice--danger" role="alert">
      <AlertCircle className="notice__icon" aria-hidden="true" />
      <div className="notice__body">
        <p className="strong">Qualcosa non ha funzionato</p>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            <RefreshCw aria-hidden="true" /> Riprova
          </button>
        )}
      </div>
    </div>
  );
}

export function Notice({
  tone = 'info',
  icon,
  title,
  children,
}: {
  tone?: 'info' | 'ok' | 'warn' | 'danger';
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`notice notice--${tone}`}>
      {icon && <span className="notice__icon" aria-hidden="true">{icon}</span>}
      <div className="notice__body">
        {title && <p className="strong">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Titolo di pagina ---------- */

export function PageHeader({ title, intro, children }: { title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <h1 tabIndex={-1}>{title}</h1>
      {intro && <p className="page-header__intro">{intro}</p>}
      {children}
    </header>
  );
}

/* ---------- Link verso siti esterni (sempre dichiarati) ---------- */

/**
 * Link verso siti esterni. Solo https e solo domini in lista (vedi sanitize.ts):
 * altrimenti viene mostrato come testo semplice, non cliccabile.
 */
export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  if (!isAllowedLink(href)) {
    if (import.meta.env.DEV) console.warn('[sicurezza] link bloccato, dominio non in lista:', href);
    return <span className={className}>{children}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ExternalIcon className="inline-icon" aria-hidden="true" />
      <span className="visually-hidden"> (si apre in una nuova finestra)</span>
    </a>
  );
}
