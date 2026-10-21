import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { LEGAL, HOSTING_INFO, hasPlaceholders } from './config';
import { PageHeader } from '../components/ui';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Struttura comune di Privacy Policy e Termini: indice cliccabile, sezioni numerate, data. */
export function LegalLayout({ title, intro, sections }: { title: string; intro: ReactNode; sections: LegalSection[] }) {
  const incomplete = hasPlaceholders() || JSON.stringify(HOSTING_INFO[LEGAL.hosting]).includes('[DA COMPLETARE');
  return (
    <div className="container stack-lg legal">
      <PageHeader title={title} intro={intro}>
        <p className="small muted">Ultimo aggiornamento: {LEGAL.lastUpdated}</p>
      </PageHeader>

      {import.meta.env.DEV && incomplete && (
        <div className="notice notice--warn" role="note">
          <div className="notice__body">
            <p className="strong">Solo in sviluppo: ci sono campi da completare</p>
            <p>
              Compila i campi «[DA COMPLETARE…]» in <code>src/legal/config.ts</code> prima di pubblicare il sito.
            </p>
          </div>
        </div>
      )}

      <nav className="card legal-toc" aria-label="Indice">
        <p className="strong">Indice</p>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="legal-section" aria-labelledby={`${s.id}-t`}>
          <h2 id={`${s.id}-t`}>
            {i + 1}. {s.title}
          </h2>
          <div className="legal-body">{s.body}</div>
        </section>
      ))}

      <p className="small muted">
        Vedi anche: <Link to="/privacy">Privacy Policy</Link> · <Link to="/termini">Termini d’uso</Link> ·{' '}
        <Link to="/informazioni">Informazioni</Link>
      </p>
    </div>
  );
}

/** Email del titolare come link (o testo, se ancora da completare). */
export function ContactEmail() {
  const e = LEGAL.owner.email;
  return e.startsWith('[') ? <span>{e}</span> : <a href={`mailto:${e}`}>{e}</a>;
}
