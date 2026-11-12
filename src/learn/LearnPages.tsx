import { Component, Suspense, use, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  BookA,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleCheck,
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
import { GlossarioContext, Termine } from './Termine';
import { duration, readingTime, setRead, useReadArticles } from './readState';
import type { Percorso } from './percorsi';
import { fold, type SearchHit, type SearchResult } from './searchEngine';
import type { Found } from './search';

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

/** Un articolo in un elenco: il titolo, la domanda a cui risponde, il tempo di lettura e il segno «letto». */
function ArticleLink({ a }: { a: ArticleCard }) {
  const read = useReadArticles().has(a.slug);
  return (
    <li>
      <Link to={`/capire/${a.slug}`} className="learn-card">
        <span className="learn-card__body">
          <span className="learn-card__title">{a.titolo}</span>
          <span className="muted">{a.domanda}</span>
          <span className="small muted learn-card__meta">
            <span>
              <Clock className="inline-icon" aria-hidden="true" /> {readingTime(a)}
            </span>
            {read && (
              <span className="learn-card__read">
                <CircleCheck className="inline-icon" aria-hidden="true" /> Letto
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * L'articolo da cui cominciare o continuare, in cima alla pagina «Capire»: chi non ha ancora letto niente parte dal
 * primo; chi ha letto qualcosa continua nel percorso dell'ultimo articolo letto.
 */
function NextArticle({ read }: { read: ReadonlySet<string> }) {
  const unread = CATALOG.filter((a) => !read.has(a.slug));
  if (!unread.length) {
    return (
      <p className="strong percorso__done">
        <CircleCheck className="inline-icon" aria-hidden="true" /> Hai letto tutti gli articoli. Ne arriveranno altri.
      </p>
    );
  }
  // L'elenco dei letti è in ordine di lettura: l'ultimo è il più recente.
  const last = [...read].reverse().map((slug) => findCard(slug)).find((c) => !!c);
  const next = (last && unread.find((a) => a.percorso === last.percorso)) ?? unread[0];
  return (
    <Link to={`/capire/${next.slug}`} className="percorso__next">
      <span>
        <span className="small muted">{last ? 'Continua da qui' : 'Comincia da qui'}</span>
        <span className="strong">{next.domanda}</span>
        <span className="small muted">
          {next.titolo} · {readingTime(next)}
        </span>
      </span>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

/**
 * Un percorso nella pagina «Capire»: una riga con il titolo, quanti articoli ha e quanti ne hai letti. Un tocco la
 * apre e mostra gli articoli in ordine. Così la pagina resta corta anche quando gli articoli saranno tanti.
 */
function PercorsoCard({ p, open, onToggle, read }: { p: Percorso; open: boolean; onToggle: () => void; read: ReadonlySet<string> }) {
  const articles = inPercorso(p.id);
  const done = articles.filter((a) => read.has(a.slug)).length;
  const minutes = articles.reduce((sum, a) => sum + a.minuti, 0);
  const panelId = `percorso-${p.id}-articoli`;
  return (
    <section id={`percorso-${p.id}`} tabIndex={-1} className="percorso">
      <h3 className="percorso__head">
        <button type="button" className="percorso__toggle" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span>
            <span className="percorso__title">{p.titolo}</span>
            <span className="small muted">
              {articles.length === 1 ? '1 articolo' : `${articles.length} articoli`} · {duration(minutes)}
              {done > 0 && (done === articles.length ? ' · letti tutti' : ` · letti ${done} su ${articles.length}`)}
            </span>
          </span>
          <ChevronDown className="percorso__icon" aria-hidden="true" />
        </button>
      </h3>
      <div id={panelId} className="stack percorso__panel" hidden={!open}>
        <p className="muted">{p.descrizione}</p>
        {done > 0 && <progress className="percorso__bar" max={articles.length} value={done} aria-label={`Letti ${done} articoli su ${articles.length}`} />}
        <ol className="learn-list">
          {articles.map((a) => (
            <ArticleLink key={a.slug} a={a} />
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Ricerca di riserva, sui soli titoli e parole chiave: risponde subito, mentre quella vera (src/learn/search.ts, con
 * il testo degli articoli) si sta scaricando, e resta se lo scaricamento non riesce (per esempio senza rete).
 */
function basicSearch(q: string): SearchResult<Found> {
  const words = norm(q).split(' ').filter((w) => w.length > 1);
  const cards = words.length
    ? CATALOG.filter((a) => {
        const hay = norm([a.titolo, a.sottotitolo, ...a.paroleChiave, percorsoOf(a.percorso)?.titolo ?? ''].join(' '));
        return words.every((w) => hay.includes(w));
      })
    : [];
  return { hits: cards.map((card) => ({ item: { kind: 'articolo', card }, score: 0, matched: words.length })), partial: false };
}

/** La frase trovata, con le parole cercate in evidenza e il titolo del paragrafo da cui viene. */
function Snippet({ hit }: { hit: SearchHit<Found> }) {
  if (!hit.snippet) return null;
  return (
    <span className="search-snippet">
      {hit.label && <span className="search-snippet__where">{hit.label}: </span>}
      {hit.snippet.map((s, i) => (s.hit ? <mark key={i}>{s.text}</mark> : s.text))}
    </span>
  );
}

/** Un risultato della ricerca: un articolo, una parola del glossario o un'altra pagina del sito. */
function ResultItem({ hit }: { hit: SearchHit<Found> }) {
  const { item } = hit;
  if (item.kind === 'articolo') {
    return (
      <li>
        <Link to={`/capire/${item.card.slug}`} className="learn-card">
          <span className="learn-card__body">
            <span className="learn-card__title">{item.card.titolo}</span>
            {hit.snippet ? <Snippet hit={hit} /> : <span className="muted">{item.card.sottotitolo}</span>}
            <span className="small muted">
              <Clock className="inline-icon" aria-hidden="true" /> {readingTime(item.card)}
            </span>
          </span>
        </Link>
      </li>
    );
  }
  if (item.kind === 'parola') {
    return (
      <li>
        <Link to={`/capire/glossario#${item.entry.id}`} className="learn-card">
          <span className="learn-card__body">
            <span className="eyebrow">Parola del glossario</span>
            <span className="learn-card__title">{item.entry.termine}</span>
            <span className="muted">{item.entry.voci[0]?.definizione}</span>
          </span>
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link to={item.to} className="learn-card">
        <span className="learn-card__body">
          <span className="eyebrow">{item.where}</span>
          <span className="learn-card__title">{item.title}</span>
          <Snippet hit={hit} />
        </span>
      </Link>
    </li>
  );
}

const resultKey = ({ item }: SearchHit<Found>) =>
  item.kind === 'articolo' ? `a-${item.card.slug}` : item.kind === 'parola' ? `p-${item.entry.id}` : `s-${item.to}-${item.title}`;

/** Elenco degli articoli, per percorsi, con la ricerca. */
export function LearnIndexPage() {
  // La ricerca sta nell'indirizzo (?q=…): tornando indietro da un articolo si ritrovano gli stessi risultati.
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const setQ = (value: string) => setParams(value ? { q: value } : {}, { replace: true });
  // La ricerca vera (con il testo di tutti gli articoli) si scarica solo quando qualcuno cerca.
  const [engine, setEngine] = useState<typeof import('./search') | null>(null);
  const asked = useRef(false);
  const loadEngine = () => {
    if (asked.current) return;
    asked.current = true;
    import('./search').then(setEngine, () => {
      asked.current = false;
    });
  };
  useEffect(() => {
    if (q) loadEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const searching = fold(q).length > 1;
  const results = useMemo(() => (searching ? (engine ? engine.searchSite(q) : basicSearch(q)) : null), [q, engine, searching]);
  const found = results?.hits.length ?? 0;
  // Il percorso aperto sta nell'indirizzo (/capire#percorso-le-basi): tornando indietro da un articolo lo si ritrova
  // aperto e in vista (ci pensa Layout, che porta la pagina al punto indicato dopo il #).
  const location = useLocation();
  const navigate = useNavigate();
  const openId = location.hash.startsWith('#percorso-') ? location.hash.slice('#percorso-'.length) : null;
  const toggle = (id: string) => navigate({ search: location.search, hash: openId === id ? '' : `#percorso-${id}` }, { replace: true });
  const read = useReadArticles();
  const readCount = CATALOG.filter((a) => read.has(a.slug)).length;
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
          onChange={(e) => {
            loadEngine();
            setQ(e.target.value);
          }}
          onFocus={loadEngine}
          placeholder="Per esempio: assestamento, zona 2, crepe"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="small muted">Cerca negli articoli, nel glossario e nelle pagine «È vero?», «Cosa fare» e «La casa ha dei danni».</p>
      </div>

      {searching ? (
        <section className="stack" aria-live="polite" aria-labelledby="learn-results">
          <h2 id="learn-results">{found === 0 ? 'Nessun risultato' : found === 1 ? '1 risultato' : `${found} risultati`}</h2>
          {results?.partial && (
            <p className="muted">Nessuna pagina contiene tutte le parole che hai scritto: queste ne contengono alcune.</p>
          )}
          {found === 0 ? (
            <>
              <p className="muted">
                Prova con un’altra parola o con una sola. Se l’argomento non c’è ancora, è possibile che l’articolo sia in
                preparazione.
              </p>
              <ul className="link-list">
                <LinkCard
                  to="/capire/glossario"
                  title="Le parole della scienza"
                  text="Il glossario: tutte le parole spiegate negli articoli, dalla A alla Z."
                  icon={BookA}
                />
              </ul>
            </>
          ) : (
            <ul className="learn-list">
              {results?.hits.map((hit) => (
                <ResultItem key={resultKey(hit)} hit={hit} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <NextArticle read={read} />
          <section className="stack" aria-labelledby="percorsi-titolo">
            <div className="stack-sm">
              <h2 id="percorsi-titolo">I percorsi</h2>
              <p className="muted">
                Articoli sullo stesso tema, dal più semplice al più specifico. Tocca un percorso per vederli.
                {readCount > 0 && ` Su questo dispositivo ne hai letti ${readCount} su ${CATALOG.length}.`}
              </p>
            </div>
            <div className="percorsi">
              {PERCORSI.filter((p) => inPercorso(p.id).length > 0).map((p) => (
                <PercorsoCard key={p.id} p={p} open={openId === p.id} onToggle={() => toggle(p.id)} read={read} />
              ))}
            </div>
          </section>
          <section className="stack" aria-labelledby="learn-more">
            <h2 id="learn-more">Altro da leggere</h2>
            <ul className="link-list">
              <LinkCard
                to="/e-vero"
                title="È vero? Le voci sui terremoti"
                text="Previsioni, «tempo da terremoto», magnitudo «abbassata»: le voci più comuni, con la risposta degli scienziati."
                icon={MessageCircleQuestion}
              />
              <LinkCard
                to="/capire/glossario"
                title="Le parole della scienza"
                text="Il glossario: ipocentro, faglia, replica… tutte le parole spiegate negli articoli, dalla A alla Z."
                icon={BookA}
              />
            </ul>
          </section>
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

/**
 * Alla fine del testo: quando chi legge arriva qui e ci resta un momento, l'articolo viene segnato come letto
 * (solo sul dispositivo). Si può togliere il segno; in quel caso, per questa visita, non lo rimettiamo da soli.
 */
function ReadMark({ slug }: { slug: string }) {
  const read = useReadArticles().has(slug);
  const [undone, setUndone] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (read || undone || !ref.current || typeof IntersectionObserver === 'undefined') return;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry.isIntersecting) timer = window.setTimeout(() => setRead(slug, true), 1500);
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [slug, read, undone]);
  return (
    <p ref={ref} className="learn-read small" aria-live="polite">
      {read ? (
        <>
          <CircleCheck className="inline-icon" aria-hidden="true" /> <span className="strong">Articolo letto.</span> Lo ricordiamo solo su
          questo dispositivo.{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setUndone(true);
              setRead(slug, false);
            }}
          >
            Segna come da leggere
          </button>
        </>
      ) : (
        <span className="muted">Fine del testo. Qui sotto trovi le parole della scienza e le fonti.</span>
      )}
    </p>
  );
}

/** Come vengono disegnati gli elementi del testo Markdown. */
const MDX_COMPONENTS = {
  a: ({ href = '', children }: ComponentPropsWithoutRef<'a'>) =>
    href.startsWith('/') ? <Link to={href}>{children}</Link> : <ExternalLink href={href}>{children}</ExternalLink>,
  ul: ({ className, ...props }: ComponentPropsWithoutRef<'ul'>) => <ul className={className ?? 'advice'} {...props} />,
  Part,
  // Le parole del glossario scritte <dfn>…</dfn> nel testo (vedi plugins/termini.ts).
  Termine,
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

      {card.parti.length > 1 && (
        <nav className="learn-toc" aria-labelledby="toc-titolo">
          <h2 id="toc-titolo">In questo articolo</h2>
          <ol>
            {card.parti.map((p) => (
              <li key={p.n}>
                <a href={`#parte-${p.n}`}>
                  <span className="learn-toc__n" aria-hidden="true">
                    {p.n}
                  </span>
                  <span>
                    <span className="small muted">{p.kicker}</span>
                    <span className="strong">{p.titolo}</span>
                  </span>
                  <span className="small muted learn-toc__min">{p.minuti} min</span>
                </a>
              </li>
            ))}
          </ol>
          {/fondo/i.test(card.parti[card.parti.length - 1].kicker) && (
            <p className="small muted">Puoi fermarti prima dell’ultima parte: è per chi vuole andare a fondo.</p>
          )}
        </nav>
      )}

      <div className="learn-body" ref={bodyRef}>
        <GlossarioContext value={fm.glossario}>
          <Content components={MDX_COMPONENTS} />
        </GlossarioContext>
      </div>

      <ReadMark slug={card.slug} />

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
          <p className="small">
            <Link to="/capire/glossario">Tutte le parole degli articoli, dalla A alla Z</Link>
          </p>
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
export class ArticleErrorBoundary extends Component<{ children: ReactNode; what?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <Notice tone="warn" title={`Non riesco a caricare ${this.props.what ?? 'l’articolo'}`}>
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
      <Link to={`/capire#percorso-${card.percorso}`} className="back-link">
        <ArrowLeft aria-hidden="true" /> {percorso ? `Percorso «${percorso.titolo}»` : 'Capire i terremoti'}
      </Link>

      <header className="page-header">
        <p className="eyebrow">
          {percorso?.titolo} · articolo {i + 1} di {siblings.length} · {card.minuti} minuti
        </p>
        <h1 tabIndex={-1}>{card.titolo}</h1>
        <p className="page-header__intro">{card.sottotitolo}</p>
        {/* Trasparenza sull'IA già all'inizio dell'articolo (AI Act, art. 50): non solo nella pagina sul metodo. */}
        <p className="small muted">
          Scritto insieme a un’intelligenza artificiale e approvato da una persona prima della pubblicazione.{' '}
          <Link to="/come-scriviamo">Come lavoriamo</Link>
        </p>
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
