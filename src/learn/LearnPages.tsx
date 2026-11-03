import { Component, Suspense, use, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Info,
  MessageCircleQuestion,
  PenLine,
  Search,
  ShieldCheck,
  Square,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { ExternalLink, LoadingCards, Notice, PageHeader } from '../components/ui';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LEGAL } from '../legal/config';
import { norm } from '../lib/seismicZones';
import { CATALOG, findCard, loadArticle, type ArticleModule } from './catalog';
import type { ArticleCard } from './articleTypes';
import { PERCORSI } from './percorsi';
import { Part } from './LearnPart';

const longDate = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateText = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
const percorsoOf = (id: string) => PERCORSI.find((p) => p.id === id);
const inPercorso = (id: string) => CATALOG.filter((c) => c.percorso === id);

/** Scheda-link grande. */
function LinkCard({ to, title, text, icon: Icon }: { to: string; title: string; text: string; icon: LucideIcon }) {
  return (
    <li>
      <Link to={to} className="link-card">
        <Icon aria-hidden="true" />
        <span>
          <span className="strong">{title}</span>
          <span className="muted">{text}</span>
        </span>
        <ChevronRight aria-hidden="true" />
      </Link>
    </li>
  );
}

function ArticleLink({ a }: { a: ArticleCard }) {
  return (
    <li>
      <Link to={`/capire/${a.slug}`} className="learn-card">
        <span className="learn-card__body">
          <span className="learn-card__title">{a.titolo}</span>
          <span className="muted">{a.sottotitolo}</span>
          <span className="small muted">
            <Clock className="inline-icon" aria-hidden="true" /> {a.minuti} minuti di lettura
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Ricerca semplice: tutte le parole cercate devono comparire in titolo, sottotitolo o parole chiave. */
function search(q: string): ArticleCard[] {
  const words = norm(q).split(' ').filter((w) => w.length > 1);
  if (!words.length) return [];
  return CATALOG.filter((a) => {
    const hay = norm([a.titolo, a.sottotitolo, ...a.paroleChiave, percorsoOf(a.percorso)?.titolo ?? ''].join(' '));
    return words.every((w) => hay.includes(w));
  });
}

/** Elenco degli articoli, per percorsi, con la ricerca. */
export function LearnIndexPage() {
  const [q, setQ] = useState('');
  const results = useMemo(() => search(q), [q]);
  const searching = norm(q).length > 1;
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Capire i terremoti"
        intro="Brevi letture, in parole semplici ma con le parole giuste della scienza. Ogni articolo usa dati veri dell’INGV e fonti pubbliche, elencate in fondo."
      />

      <div className="learn-search" role="search">
        <label htmlFor="learn-q" className="learn-search__label">
          <Search aria-hidden="true" /> Cerca un argomento
        </label>
        <input
          id="learn-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Per esempio: magnitudo, Campi Flegrei, repliche"
          autoComplete="off"
        />
      </div>

      {searching ? (
        <section className="stack" aria-live="polite" aria-labelledby="learn-results">
          <h2 id="learn-results">
            {results.length === 0 ? 'Nessun articolo trovato' : results.length === 1 ? '1 articolo' : `${results.length} articoli`}
          </h2>
          {results.length === 0 ? (
            <p className="muted">Prova con un’altra parola, o guarda i percorsi qui sotto cancellando la ricerca.</p>
          ) : (
            <ul className="learn-list">
              {results.map((a) => (
                <ArticleLink key={a.slug} a={a} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <ul className="link-list">
            <LinkCard
              to="/e-vero"
              title="È vero? Le voci sui terremoti"
              text="Previsioni, «tempo da terremoto», magnitudo «abbassata»: le voci più comuni, con la risposta degli scienziati."
              icon={MessageCircleQuestion}
            />
          </ul>
          {PERCORSI.filter((p) => inPercorso(p.id).length > 0).map((p) => (
            <section key={p.id} className="stack learn-percorso" aria-labelledby={`percorso-${p.id}`}>
              <div className="stack-sm">
                <h2 id={`percorso-${p.id}`}>{p.titolo}</h2>
                <p className="muted">{p.descrizione}</p>
              </div>
              <ul className="learn-list">
                {inPercorso(p.id).map((a) => (
                  <ArticleLink key={a.slug} a={a} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <section className="stack" aria-labelledby="learn-method">
        <h2 id="learn-method">Come lavoriamo</h2>
        <ul className="link-list">
          <LinkCard
            to="/come-scriviamo"
            title="Come scriviamo gli articoli"
            text="Le fonti che usiamo, come le controlliamo, chi scrive e come correggiamo gli errori."
            icon={PenLine}
          />
        </ul>
      </section>

      <section className="stack" aria-labelledby="learn-expert">
        <h2 id="learn-expert">Per esperti</h2>
        <ul className="link-list">
          <LinkCard to="/analisi" title="Analisi" text="Ricerche nel catalogo INGV, grafici, tabelle ed esportazione dei dati." icon={FlaskConical} />
        </ul>
      </section>

      <section className="stack" aria-labelledby="learn-site">
        <h2 id="learn-site">Il sito</h2>
        <ul className="link-list">
          <LinkCard to="/informazioni" title="Informazioni" text="Perché esiste Quake Italia, da dove arrivano i dati e i crediti." icon={Info} />
          <LinkCard to="/privacy" title="Privacy" text="Come trattiamo i tuoi dati, in parole semplici." icon={ShieldCheck} />
          <LinkCard to="/termini" title="Termini d’uso" text="Le regole per usare il sito e i suoi limiti." icon={FileText} />
        </ul>
      </section>
    </div>
  );
}

/** Lettura ad alta voce di tutto l'articolo (testo preso dalla pagina). */
function ReadAloud({ target }: { target: RefObject<HTMLElement | null> }) {
  const { supported, speaking, speak, stop } = useSpeech();
  if (!supported) return null;
  return (
    <button
      type="button"
      className="btn btn--secondary"
      aria-pressed={speaking}
      onClick={() => (speaking ? stop() : speak(target.current?.innerText ?? ''))}
    >
      {speaking ? <Square aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
      {speaking ? 'Ferma la lettura' : 'Ascolta l’articolo'}
    </button>
  );
}

/** Come vengono disegnati gli elementi del testo Markdown. */
const MDX_COMPONENTS = {
  a: ({ href = '', children }: ComponentPropsWithoutRef<'a'>) =>
    href.startsWith('/') ? <Link to={href}>{children}</Link> : <ExternalLink href={href}>{children}</ExternalLink>,
  ul: ({ className, ...props }: ComponentPropsWithoutRef<'ul'>) => <ul className={className ?? 'advice'} {...props} />,
  Part,
};

/** `testo con `codice`` → testo con <code>codice</code> (per le note sui dati). */
function withCode(s: string): ReactNode[] {
  return s.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

const STANDARD_NOTE =
  'I grafici usano dati del catalogo INGV (licenza CC BY 4.0), scaricati e riassunti con lo script `scripts/build-learn-data.mjs`: il link “richiesta” permette di rifare la stessa interrogazione.';

function reportUrl(a: ArticleCard) {
  const title = `Errore nell’articolo «${a.titolo}»`;
  return `https://github.com/Pitusd-V2/quake-italia/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `Indirizzo: /capire/${a.slug}\n\nCosa non va (copia la frase, se puoi):\n\nQual è la fonte giusta (se la conosci):\n`,
  )}`;
}

/** Il testo dell'articolo: si scarica a parte, solo quando serve. */
function ArticleBody({ card }: { card: ArticleCard }) {
  const mod = use(loadArticle(card.slug) as Promise<ArticleModule>);
  const fm = mod.frontmatter;
  const Content = mod.default;
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <section className="learn-summary" aria-labelledby="in-breve">
        <h2 id="in-breve" className="icon-title">
          <BookOpen aria-hidden="true" /> {fm.riassuntoTitolo ?? 'In breve'}
        </h2>
        <ul className="advice">
          {fm.riassunto.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <ReadAloud target={bodyRef} />
      </section>

      <div className="learn-body" ref={bodyRef}>
        <Content components={MDX_COMPONENTS} />
      </div>

      {fm.glossario.length > 0 && (
        <section className="card stack" aria-labelledby="glossary-title">
          <h2 id="glossary-title">Le parole della scienza</h2>
          <dl className="glossary">
            {fm.glossario.map((g) => (
              <div key={g.termine}>
                <dt>{g.termine}</dt>
                <dd>{g.definizione}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="stack-sm learn-sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Fonti</h2>
        <ol>
          {fm.fonti.map((s) => (
            <li key={s.testo}>{s.url ? <ExternalLink href={s.url}>{s.testo}</ExternalLink> : s.testo}</li>
          ))}
        </ol>
        <p className="small muted">{withCode(fm.notaDati ?? STANDARD_NOTE)}</p>
      </section>

      <section className="learn-check" aria-labelledby="check-title">
        <h2 id="check-title" className="visually-hidden">
          Verifiche e correzioni
        </h2>
        <p>
          <span className="strong">Fonti verificate il {dateText(card.verificato)}.</span>{' '}
          {card.revisione
            ? `Rivisto da ${card.revisione.nome}, ${card.revisione.ruolo}, il ${dateText(card.revisione.data)}.`
            : 'Ogni affermazione importante ha una fonte qui sopra.'}{' '}
          <Link to="/come-scriviamo">Come scriviamo gli articoli</Link>.
        </p>
        <p>
          Hai trovato un errore? <ExternalLink href={reportUrl(card)}>Segnalalo su GitHub</ExternalLink> oppure scrivi a{' '}
          <a href={`mailto:${LEGAL.owner.email}`}>{LEGAL.owner.email}</a>.
        </p>
      </section>
    </>
  );
}

/** Se il testo non si scarica (per esempio senza rete), lo diciamo invece di lasciare la pagina vuota. */
class ArticleErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <Notice tone="warn" title="Non riesco a caricare l’articolo">
          <p>Forse la connessione è assente. Riprova tra poco ricaricando la pagina.</p>
        </Notice>
      );
    return this.props.children;
  }
}

/** Un articolo. */
export function ArticlePage() {
  const { slug } = useParams();
  const card = findCard(slug);
  if (!card) return <NotFoundPage />;
  const percorso = percorsoOf(card.percorso);
  const siblings = inPercorso(card.percorso);
  const i = siblings.indexOf(card);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const related = card.correlati.map((s) => findCard(s)).filter((x): x is ArticleCard => !!x);

  return (
    <article className="container stack-lg learn-article">
      <Link to="/capire" className="back-link">
        <ArrowLeft aria-hidden="true" /> Capire i terremoti
      </Link>

      <header className="page-header">
        <p className="eyebrow">
          {percorso?.titolo} · articolo {i + 1} di {siblings.length} · {card.minuti} minuti
        </p>
        <h1 tabIndex={-1}>{card.titolo}</h1>
        <p className="page-header__intro">{card.sottotitolo}</p>
      </header>

      <ArticleErrorBoundary key={card.slug}>
        <Suspense fallback={<LoadingCards count={2} label="Sto aprendo l’articolo…" />}>
          <ArticleBody card={card} />
        </Suspense>
      </ArticleErrorBoundary>

      {related.length > 0 && (
        <section className="stack" aria-labelledby="related-title">
          <h2 id="related-title">Leggi anche</h2>
          <ul className="learn-list">
            {related.map((a) => (
              <ArticleLink key={a.slug} a={a} />
            ))}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav className="learn-nav" aria-label={`Altri articoli del percorso ${percorso?.titolo ?? ''}`}>
          {prev ? (
            <Link to={`/capire/${prev.slug}`} className="learn-nav__link">
              <ArrowLeft aria-hidden="true" />
              <span>
                <span className="small muted">Precedente</span>
                <span className="strong">{prev.titolo}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/capire/${next.slug}`} className="learn-nav__link learn-nav__link--next">
              <span>
                <span className="small muted">Successivo</span>
                <span className="strong">{next.titolo}</span>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
