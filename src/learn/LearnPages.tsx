import { useRef, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock, FileText, FlaskConical, Info, MessageCircleQuestion, ShieldCheck, Square, Volume2, type LucideIcon } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { ExternalLink, PageHeader } from '../components/ui';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ARTICLES, findArticle } from './articles';

/** Scheda-link grande, come nell'elenco dei post. */
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

/** Elenco dei post. */
export function LearnIndexPage() {
  return (
    <div className="container stack-lg">
      <PageHeader
        title="Capire i terremoti"
        intro="Brevi letture, in parole semplici ma con le parole giuste della scienza. Ogni post usa dati veri dell’INGV e fonti pubbliche, elencate in fondo."
      />
      <ul className="link-list">
        <LinkCard
          to="/e-vero"
          title="È vero? Le voci sui terremoti"
          text="Previsioni, «tempo da terremoto», magnitudo «abbassata»: le voci più comuni, con la risposta degli scienziati."
          icon={MessageCircleQuestion}
        />
      </ul>

      <ol className="learn-list">
        {ARTICLES.map((a, i) => (
          <li key={a.slug}>
            <Link to={`/capire/${a.slug}`} className="learn-card">
              <span className="learn-card__n" aria-hidden="true">
                {i + 1}
              </span>
              <span className="learn-card__body">
                <span className="learn-card__title">{a.title}</span>
                <span className="muted">{a.subtitle}</span>
                <span className="small muted">
                  <Clock className="inline-icon" aria-hidden="true" /> {a.minutes} minuti di lettura
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <section className="stack" aria-labelledby="learn-expert">
        <h2 id="learn-expert">Per esperti</h2>
        <ul className="link-list">
          <LinkCard
            to="/analisi"
            title="Analisi"
            text="Ricerche nel catalogo INGV, grafici, tabelle ed esportazione dei dati."
            icon={FlaskConical}
          />
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

/** Lettura ad alta voce di tutto il post (testo preso dalla pagina). */
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
      {speaking ? 'Ferma la lettura' : 'Ascolta il post'}
    </button>
  );
}

/** Un post. */
export function ArticlePage() {
  const { slug } = useParams();
  const article = findArticle(slug);
  const bodyRef = useRef<HTMLDivElement>(null);
  if (!article) return <NotFoundPage />;
  const i = ARTICLES.indexOf(article);
  const prev = ARTICLES[i - 1];
  const next = ARTICLES[i + 1];
  const Body = article.body;

  return (
    <article className="container stack-lg learn-article">
      <Link to="/capire" className="back-link">
        <ArrowLeft aria-hidden="true" /> Capire i terremoti
      </Link>

      <header className="page-header">
        <p className="eyebrow">
          Post {i + 1} di {ARTICLES.length} · {article.minutes} minuti
        </p>
        <h1 tabIndex={-1}>{article.title}</h1>
        <p className="page-header__intro">{article.subtitle}</p>
      </header>

      <section className="learn-summary" aria-labelledby="in-breve">
        <h2 id="in-breve" className="icon-title">
          <BookOpen aria-hidden="true" /> In breve
        </h2>
        <ul className="advice">
          {article.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <ReadAloud target={bodyRef} />
      </section>

      <div className="learn-body" ref={bodyRef}>
        <Body />
      </div>

      <section className="card stack" aria-labelledby="glossary-title">
        <h2 id="glossary-title">Le parole della scienza</h2>
        <dl className="glossary">
          {article.glossary.map(([term, def]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="stack-sm learn-sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Fonti</h2>
        <ol>
          {article.sources.map((s) => (
            <li key={s.label}>{s.href ? <ExternalLink href={s.href}>{s.label}</ExternalLink> : s.label}</li>
          ))}
        </ol>
        <p className="small muted">
          I grafici usano dati del catalogo INGV (licenza CC BY 4.0), scaricati e riassunti con lo script{' '}
          <code>scripts/build-learn-data.mjs</code>: il link “richiesta” permette di rifare la stessa interrogazione.
        </p>
      </section>

      <nav className="learn-nav" aria-label="Altri post">
        {prev ? (
          <Link to={`/capire/${prev.slug}`} className="learn-nav__link">
            <ArrowLeft aria-hidden="true" />
            <span>
              <span className="small muted">Precedente</span>
              <span className="strong">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/capire/${next.slug}`} className="learn-nav__link learn-nav__link--next">
            <span>
              <span className="small muted">Successivo</span>
              <span className="strong">{next.title}</span>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </nav>
    </article>
  );
}
