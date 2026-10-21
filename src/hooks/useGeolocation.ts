import { useCallback, useState } from 'react';
import { reverseGeocode } from '../lib/geocode';
import { getPosition } from '../lib/position';
import type { Place } from '../lib/types';

type Status = 'idle' | 'locating' | 'error';

/** Chiede la posizione al dispositivo e la trasforma in un luogo con nome. */
export function useGeolocation() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<Place | null> => {
    setStatus('locating');
    setError(null);
    try {
      const fix = await getPosition();
      const place = await reverseGeocode(fix);
      setStatus('idle');
      return place;
    } catch (e) {
      setStatus('error');
      setError(`${(e as Error).message} Puoi scrivere il nome del tuo comune.`);
      return null;
    }
  }, []);

  return { status, error, locate };
}
