import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Activity, Ear, FlaskConical, House, Landmark, LayoutGrid, LifeBuoy, X, type LucideIcon } from 'lucide-react';
import { useSettings } from '../state/settings';
import { useQuakeFeed } from '../state/quakes';
import { useQuakeAlerts, alertText } from '../hooks/useQuakeAlerts';
import { Logo } from './Logo';
import { DataStatus } from './DataStatus';
import { LoadingCards } from './ui';
import { TAGLINE } from '../lib/brand';

// Pannello simulazioni: esiste solo in sviluppo, in produzione viene eliminato.
const SimPanel = import.meta.env.DEV ? lazy(() => import('../dev/SimPanel')) : null;

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Altre pagine che "appartengono" a questa voce: la voce resta evidenziata anche lì. */
  section?: string[];
  /** Separata dalle altre voci da una linea (per "Analisi", che è per esperti). */
  divider?: boolean;
}

// Pagine che si aprono da "Altro" (vedi MorePage). "Analisi" si aggiunge solo dove non ha una voce propria (sul telefono).
const MORE_PAGES = ['/capire', '/e-vero', '/danni-casa', '/impostazioni', '/informazioni', '/privacy', '/termini'];

const HOME_ITEM: NavItem = { to: '/', label: 'Vicino a te', icon: House, end: true };
const QUAKES_ITEM: NavItem = { to: '/terremoti', label: 'Terremoti', icon: Activity };
const TOWN_ITEM: NavItem = { to: '/il-mio-comune', label: 'Il mio comune', icon: Landmark };
const SAFETY_ITEM: NavItem = { to: '/cosa-fare', label: 'Cosa fare', icon: LifeBuoy };
const EXPERT_ITEM: NavItem = { to: '/analisi', label: 'Analisi', icon: FlaskConical, divider: true };
const moreItem = (section: string[]): NavItem => ({ to: '/altro', label: 'Altro', icon: LayoutGrid, section });

// Le stesse 5 voci sul telefono e sul computer, così c'è un solo menu da imparare.
// Sul computer si aggiunge "Analisi", separata; sul telefono sta in "Altro".
const MAIN_ITEMS: NavItem[] = [HOME_ITEM, QUAKES_ITEM, TOWN_ITEM, SAFETY_ITEM];
const BOTTOM_NAV: NavItem[] = [...MAIN_ITEMS, moreItem([...MORE_PAGES, '/analisi'])];
const TOP_NAV: NavItem[] = [...MAIN_ITEMS, moreItem(MORE_PAGES), EXPERT_ITEM];

/** true se `pathname` è la pagina `base` o una sua sotto-pagina (es. /capire/magnitudo). */
function isUnder(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLinks({ items, className }: { items: NavItem[]; className: string }) {
  const { pathname } = useLocation();
  return (
    <>
      {items.map(({ to, label, icon: Icon, end, section, divider }) => {
        const cls = divider ? `${className} ${className}--divider` : className;
        const content = (
          <>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </>
        );
        if (!section) {
          return (
            <NavLink key={to} to={to} end={end} className={cls}>
              {content}
            </NavLink>
          );
        }
        // Voce "sezione": "page" sulla sua pagina, "true" sulle pagine che le appartengono.
        const current = pathname === to ? 'page' : section.some((p) => isUnder(pathname, p)) ? 'true' : undefined;
        return (
          <Link key={to} to={to} className={cls} aria-current={current}>
            {content}
          </Link>
        );
      })}
    </>
  );
}

/** Dopo un cambio pagina: torna in cima e sposta il focus sul titolo (per i lettori di schermo). */
function useRouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const h1 = document.querySelector<HTMLElement>('#main h1');
    h1?.focus({ preventScroll: true });
  }, [pathname]);
}

function NewQuakeBanner() {
  const feed = useQuakeFeed();
  const { settings } = useSettings();
  const { pathname } = useLocation();
  const { latest, dismiss } = useQuakeAlerts(feed.data);
  const text = latest ? alertText(latest, settings) : null;

  // Se l'utente apre la pagina di quella scossa, l'avviso ha fatto il suo lavoro.
  useEffect(() => {
    if (latest && pathname === `/terremoto/${latest.id}`) dismiss();
  }, [latest, pathname, dismiss]);
  return (
    <div className="banner-region" aria-live="polite">
      {latest && text && (
        <div className="banner">
          <Link to={`/terremoto/${latest.id}`} className="banner__link" onClick={dismiss}>
            <span className="strong">Nuova {text.title.charAt(0).toLowerCase() + text.title.slice(1)}</span>
            <span>{text.body}</span>
          </Link>
          <button type="button" className="icon-btn" onClick={dismiss} aria-label="Chiudi avviso">
            <X aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  useRouteFocus();

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Vai al contenuto
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand" aria-label="Quake Italia, vai alla pagina iniziale">
            <Logo />
          </Link>
          <nav className="top-nav" aria-label="Menu principale">
            <NavLinks items={TOP_NAV} className="top-nav__link" />
          </nav>
          <Link to="/ho-sentito" className="btn--felt-small" aria-label="Ho sentito una scossa">
            <Ear aria-hidden="true" />
            <span className="only-wide">Ho sentito una scossa</span>
            <span className="only-narrow">Ho sentito</span>
          </Link>
        </div>
      </header>

      <NewQuakeBanner />

      <main id="main" className="app-main">
        <Suspense fallback={<div className="container"><LoadingCards label="Sto aprendo la pagina…" /></div>}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="app-footer">
        <div className="container stack-sm">
          <DataStatus compact />
          <p className="small muted">
            Dati: <a href="https://terremoti.ingv.it/" target="_blank" rel="noopener noreferrer">INGV</a> (licenza CC BY 4.0).{' '}
            <strong>Quake Italia</strong> — {TAGLINE} Progetto indipendente e gratuito: non è un sito ufficiale dell'INGV e
            non è un sistema di allerta. In caso di emergenza chiama il <a href="tel:112">112</a>.
          </p>
          <p className="small footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/termini">Termini d’uso</Link>
            <Link to="/informazioni">Informazioni e crediti</Link>
          </p>
        </div>
      </footer>

      {/* Sul telefono 5 voci grandi e leggibili; le altre pagine sono raccolte in "Altro". */}
      <nav className="bottom-nav" aria-label="Menu principale">
        <NavLinks items={BOTTOM_NAV} className="bottom-nav__link" />
      </nav>

      {SimPanel && (
        <Suspense fallback={null}>
          <SimPanel />
        </Suspense>
      )}
    </div>
  );
}
