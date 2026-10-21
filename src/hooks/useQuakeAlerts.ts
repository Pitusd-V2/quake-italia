import { useCallback, useEffect, useRef, useState } from 'react';
import { distanceKm, formatKm } from '../lib/geo';
import { magLevel, placeText } from '../lib/describe';
import { formatMag } from '../lib/format';
import { useSettings, type Settings } from '../state/settings';
import type { Quake } from '../lib/types';

const RECENT_MS = 2 * 3_600_000;
/** Senza un comune impostato avvisiamo solo per le scosse più importanti in Italia. */
const NO_HOME_MIN_MAG = 3.5;

function isRelevant(q: Quake, s: Settings): boolean {
  if (Date.now() - q.time.getTime() > RECENT_MS) return false;
  if (s.home) return q.mag >= s.alerts.minMag && distanceKm(s.home, q) <= s.radiusKm;
  return q.mag >= Math.max(NO_HOME_MIN_MAG, s.alerts.minMag);
}

export function alertText(q: Quake, s: Settings): { title: string; body: string } {
  const lvl = magLevel(q.mag);
  const where = placeText(q.place).full;
  const dist = s.home ? ` — a ${formatKm(distanceKm(s.home, q))} da ${s.home.name}` : '';
  return {
    title: `Scossa ${lvl.name.toLowerCase()}, magnitudo ${formatMag(q.mag)}`,
    body: `${where}${dist}. Tocca per i dettagli.`,
  };
}

async function systemNotify(q: Quake, s: Settings) {
  const { title, body } = alertText(q, s);
  const url = `/terremoto/${q.id}`;
  const options: NotificationOptions = { body, icon: '/pwa-192x192.png', tag: q.id, data: { url } };
  try {
    // Su Android le notifiche funzionano solo tramite il service worker.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* proviamo il metodo classico */
  }
  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      window.location.assign(url);
    };
  } catch {
    /* notifiche non disponibili */
  }
}

/**
 * Confronta ogni aggiornamento con il precedente e segnala le nuove scosse
 * rilevanti. Funziona solo mentre l'app è aperta: non è un sistema di allerta.
 */
export function useQuakeAlerts(quakes: Quake[] | undefined) {
  const { settings } = useSettings();
  const seen = useRef<Set<string> | null>(null);
  const [latest, setLatest] = useState<Quake | null>(null);

  useEffect(() => {
    if (!quakes) return;
    if (!seen.current) {
      // Primo caricamento: non avvisare per scosse già avvenute.
      seen.current = new Set(quakes.map((q) => q.id));
      return;
    }
    const fresh = quakes.filter((q) => !seen.current!.has(q.id));
    for (const q of fresh) seen.current.add(q.id);
    const relevant = fresh.filter((q) => isRelevant(q, settings));
    if (!relevant.length) return;
    const top = relevant.reduce((a, b) => (b.mag > a.mag ? b : a));
    setLatest(top);
    if (settings.alerts.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void systemNotify(top, settings);
    }
  }, [quakes, settings]);

  const dismiss = useCallback(() => setLatest(null), []);
  return { latest, dismiss };
}
