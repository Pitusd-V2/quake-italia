import { useId } from 'react';
import { Link } from 'react-router';
import { BookOpen, ChevronRight } from 'lucide-react';
import { findCard } from './catalog';
import type { ArticleCard } from './articleTypes';

const cardsOf = (slugs: readonly string[]) => slugs.map((s) => findCard(s)).filter((c): c is ArticleCard => !!c);

/**
 * Due o tre domande che portano agli articoli di «Capire»: si mette accanto a una scossa, a una sequenza, alla zona
 * del comune. Mostra la domanda (quella che le persone si fanno), non il titolo: il titolo sta sotto, più piccolo.
 * Se nessuno degli articoli indicati esiste, non mostra niente.
 */
export function ArticleQuestions({ slugs, title }: { slugs: readonly string[]; title: string }) {
  const id = useId();
  const cards = cardsOf(slugs);
  if (!cards.length) return null;
  return (
    <section className="card stack" aria-labelledby={id}>
      <h2 id={id} className="icon-title">
        <BookOpen aria-hidden="true" /> {title}
      </h2>
      <ul className="ask-list">
        {cards.map((c) => (
          <li key={c.slug}>
            <Link to={`/capire/${c.slug}`} className="ask">
              <span>
                <span className="strong">{c.domanda}</span>
                <span className="small muted">
                  {c.titolo} · {c.minuti} minuti
                </span>
              </span>
              <ChevronRight aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Una sola domanda, in una riga di testo («Per capire meglio: …»). Niente, se l'articolo non esiste. */
export function ArticleQuestionLine({ slug, lead = 'Per capire meglio: ' }: { slug: string; lead?: string }) {
  const card = findCard(slug);
  if (!card) return null;
  return (
    <p className="small">
      {lead}
      <Link to={`/capire/${card.slug}`}>{card.domanda}</Link>
    </p>
  );
}
