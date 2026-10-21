import { Link } from 'react-router';
import {
  BookOpen,
  ChevronRight,
  FileText,
  FlaskConical,
  HousePlus,
  Info,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../components/ui';

interface MoreLink {
  to: string;
  title: string;
  /** Una riga semplice: a cosa serve la pagina. */
  text: string;
  icon: LucideIcon;
}

interface MoreGroup {
  id: string;
  title: string;
  links: MoreLink[];
}

const LEARN: MoreGroup = {
  id: 'altro-capire',
  title: 'Per capire',
  links: [
    {
      to: '/capire',
      title: 'Capire i terremoti',
      text: 'Magnitudo, repliche, perché l’Italia trema: brevi letture spiegate con calma.',
      icon: BookOpen,
    },
    {
      to: '/e-vero',
      title: 'È vero? Le voci sui terremoti',
      text: 'Messaggi, audio e «previsioni» che girano dopo una scossa: cosa dicono gli scienziati.',
      icon: MessageCircleQuestion,
    },
    {
      to: '/danni-casa',
      title: 'La casa ha dei danni: cosa fare',
      text: 'Dopo una scossa forte: se uscire, chi chiamare, come si fa controllare la casa e quali aiuti esistono.',
      icon: HousePlus,
    },
  ],
};

const SETTINGS_LINK: MoreLink = {
  to: '/impostazioni',
  title: 'Impostazioni',
  text: 'Il tuo comune, la grandezza delle scritte, i colori e gli avvisi delle nuove scosse.',
  icon: Settings,
};

// Sul computer "Analisi" ha una voce propria nel menu in alto: qui serve solo sul telefono.
const EXPERT_LINK: MoreLink = {
  to: '/analisi',
  title: 'Analisi per esperti',
  text: 'Ricerche nel catalogo INGV, grafici, tabelle ed esportazione dei dati.',
  icon: FlaskConical,
};

const SITE_LINKS: MoreLink[] = [
  {
    to: '/informazioni',
    title: 'Informazioni',
    text: 'Perché esiste Quake Italia, da dove arrivano i dati e i crediti.',
    icon: Info,
  },
  {
    to: '/privacy',
    title: 'Privacy',
    text: 'Come trattiamo i tuoi dati, in parole semplici.',
    icon: ShieldCheck,
  },
  {
    to: '/termini',
    title: 'Termini d’uso',
    text: 'Le regole per usare il sito e i suoi limiti, scritte in modo semplice.',
    icon: FileText,
  },
];

function MoreCard({ to, title, text, icon: Icon }: MoreLink) {
  return (
    <li className={to === EXPERT_LINK.to ? 'only-narrow' : undefined}>
      <Link to={to} className="more-link">
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

export function MorePage() {
  const groups: MoreGroup[] = [
    LEARN,
    {
      id: 'altro-sito',
      title: 'Il sito',
      links: [SETTINGS_LINK, EXPERT_LINK, ...SITE_LINKS],
    },
  ];

  return (
    <div className="container stack-lg">
      <PageHeader title="Altro" intro="Qui trovi tutte le altre pagine di Quake Italia: tocca quella che ti serve." />

      {groups.map((g) => (
        <section key={g.id} className="stack" aria-labelledby={g.id}>
          <h2 id={g.id}>{g.title}</h2>
          <ul className="more-list">
            {g.links.map((l) => (
              <MoreCard key={l.to} {...l} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
