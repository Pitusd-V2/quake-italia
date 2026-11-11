import { Suspense, use, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Search } from 'lucide-react';
import { LoadingCards, PageHeader } from '../components/ui';
import { findCard } from './catalog';
import { initial, loadGlossary } from './glossary';
import { fold } from './searchEngine';
import type { GlossaryEntry } from './articleTypes';
import { ArticleErrorBoundary } from './LearnPages';

const letterId = (l: string) => `lettera-${l === '#' ? 'altro' : l}`;

function GlossaryBody() {
  const entries = use(loadGlossary() as Promise<GlossaryEntry[]>);
  const [q, setQ] = useState('');
  const key = fold(q);
  const shown = key.length > 1 ? entries.filter((e) => fold(e.termine).includes(key)) : entries;
  const letters = [...new Set(shown.map((e) => initial(e.termine)))];

  return (
    <>
      <div className="learn-search" role="search">
        <label htmlFor="glossary-q" className="learn-search__label">
          <Search aria-hidden="true" /> Cerca una parola
        </label>
        <input
          id="glossary-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Per esempio: ipocentro, faglia, replica"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="small muted" aria-live="polite">
          {shown.length === 0
            ? 'Nessuna parola trovata. Prova a scriverne solo l’inizio.'
            : shown.length === entries.length
              ? `${entries.length} parole, prese dai glossari degli articoli.`
              : shown.length === 1
                ? '1 parola trovata.'
                : `${shown.length} parole trovate.`}
        </p>
      </div>

      {letters.length > 1 && (
        <nav className="glossary-letters" aria-label="Vai alla lettera">
          {letters.map((l) => (
            <a key={l} href={`#${letterId(l)}`}>
              {l}
            </a>
          ))}
        </nav>
      )}

      {letters.map((l) => (
        <section key={l} className="stack" aria-labelledby={letterId(l)}>
          <h2 id={letterId(l)} className="glossary-letter">
            {l}
          </h2>
          <dl className="glossary glossary--all">
            {shown
              .filter((e) => initial(e.termine) === l)
              .map((e) => (
                <div key={e.id} id={e.id} tabIndex={-1}>
                  <dt>{e.termine}</dt>
                  {e.voci.map((v) => (
                    <dd key={v.slug}>
                      {v.definizione}{' '}
                      <span className="small muted">
                        Da <Link to={`/capire/${v.slug}`}>{findCard(v.slug)?.titolo ?? 'un articolo'}</Link>
                      </span>
                    </dd>
                  ))}
                </div>
              ))}
          </dl>
        </section>
      ))}
    </>
  );
}

/** Il glossario generale: tutte le parole spiegate in fondo agli articoli, dalla A alla Z. */
export function GlossaryPage() {
  return (
    <div className="container stack-lg">
      <Link to="/capire" className="back-link">
        <ArrowLeft aria-hidden="true" /> Capire i terremoti
      </Link>
      <PageHeader
        title="Le parole della scienza"
        intro="Tutte le parole spiegate negli articoli, dalla A alla Z. Accanto a ogni spiegazione c’è l’articolo da cui viene: lì trovi anche le fonti."
      />
      <ArticleErrorBoundary what="il glossario">
        <Suspense fallback={<LoadingCards count={2} label="Sto aprendo il glossario…" />}>
          <GlossaryBody />
        </Suspense>
      </ArticleErrorBoundary>
    </div>
  );
}
