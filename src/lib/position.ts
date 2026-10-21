import type { LatLon } from './types';

export interface Fix extends LatLon {
  accuracyM: number | null;
}

export class PositionError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

const MESSAGES: Record<number, string> = {
  0: 'Questo dispositivo non permette di trovare la posizione.',
  1: 'Non hai dato il permesso di usare la posizione.',
  2: 'Non riesco a trovare la tua posizione in questo momento.',
  3: 'La ricerca della posizione sta impiegando troppo tempo.',
};

/**
 * Posizione attuale dal GPS del dispositivo.
 * `precise`: più accurata ma più lenta.
 */
export async function getPosition(precise = false): Promise<Fix> {
  if (import.meta.env.DEV) {
    const { simulatedPosition } = await import('../dev/simulation');
    const sim = simulatedPosition();
    if (sim) return sim;
  }
  if (!('geolocation' in navigator)) throw new PositionError(0, MESSAGES[0]);
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: precise,
        timeout: precise ? 20_000 : 15_000,
        maximumAge: precise ? 30_000 : 5 * 60_000,
      }),
    );
    return { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracyM: pos.coords.accuracy ?? null };
  } catch (e) {
    const code = (e as GeolocationPositionError).code ?? 2;
    throw new PositionError(code, MESSAGES[code] ?? MESSAGES[2]);
  }
}
