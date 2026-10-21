/**
 * Gli strumenti della sezione Analisi.
 *
 * Per aggiungere una nuova funzione avanzata:
 *   1. crea un componente in ./tools/ che riceve `ToolProps`
 *      (export default);
 *   2. aggiungi una riga qui sotto.
 * Fatto: compare come nuova scheda, con i dati della ricerca corrente.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { ChartColumn, ChartScatter, Download, Layers, Map as MapIcon, Table2, type LucideIcon } from 'lucide-react';
import type { QuakeQuery } from '../../lib/ingv';
import type { Place, Quake } from '../../lib/types';

export interface ToolProps {
  quakes: Quake[];
  query: QuakeQuery;
  home: Place | null;
  /** true mentre arriva un nuovo risultato (il grafico resta, sbiadito). */
  refreshing: boolean;
}

export interface ExpertTool {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
}

export const EXPERT_TOOLS: ExpertTool[] = [
  {
    id: 'mappa',
    label: 'Mappa',
    icon: MapIcon,
    description: 'Epicentri colorati per magnitudo o per profondità.',
    component: lazy(() => import('./tools/MapTool')),
  },
  {
    id: 'sequenza',
    label: 'Sequenza',
    icon: ChartScatter,
    description: 'Magnitudo nel tempo e numero cumulativo di eventi.',
    component: lazy(() => import('./tools/SequenceTool')),
  },
  {
    id: 'gutenberg-richter',
    label: 'Gutenberg-Richter',
    icon: ChartColumn,
    description: 'Distribuzione frequenza-magnitudo, magnitudo di completezza e b-value.',
    component: lazy(() => import('./tools/MagnitudeTool')),
  },
  {
    id: 'profondita',
    label: 'Profondità',
    icon: Layers,
    description: 'Distribuzione degli ipocentri in profondità.',
    component: lazy(() => import('./tools/DepthTool')),
  },
  {
    id: 'tabella',
    label: 'Tabella',
    icon: Table2,
    description: 'Tutti gli eventi, ordinabili per colonna.',
    component: lazy(() => import('./tools/TableTool')),
  },
  {
    id: 'dati',
    label: 'Dati e API',
    icon: Download,
    description: 'Esporta CSV/GeoJSON e copia la richiesta FDSN.',
    component: lazy(() => import('./tools/DataTool')),
  },
];
