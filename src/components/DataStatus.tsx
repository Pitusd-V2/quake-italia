import { RefreshCw, WifiOff } from 'lucide-react';
import { formatTime } from '../lib/format';
import { useQuakeFeed } from '../state/quakes';

/** "Dati INGV aggiornati alle 21:35" + pulsante aggiorna. Avvisa se i dati sono vecchi. */
export function DataStatus({ compact = false }: { compact?: boolean }) {
  const feed = useQuakeFeed();
  const updated = feed.dataUpdatedAt ? new Date(feed.dataUpdatedAt) : null;
  const failing = feed.isError && feed.data;
  return (
    <div className={`data-status${failing ? ' data-status--warn' : ''}${compact ? ' data-status--compact' : ''}`}>
      {failing && <WifiOff className="inline-icon" aria-hidden="true" />}
      <span>
        {failing
          ? `Non riesco ad aggiornare. Dati delle ${updated ? formatTime(updated) : '—'}`
          : updated
            ? `Dati INGV aggiornati alle ${formatTime(updated)}`
            : 'Sto scaricando i dati INGV…'}
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => feed.refetch()}
        disabled={feed.isFetching}
        aria-label="Aggiorna adesso"
        title="Aggiorna adesso"
      >
        <RefreshCw className={feed.isFetching ? 'spin' : undefined} aria-hidden="true" />
      </button>
    </div>
  );
}
