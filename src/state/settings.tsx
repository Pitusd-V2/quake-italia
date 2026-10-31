import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readRaw, writeJson } from '../lib/storage';
import { cleanText, inRange, isLat, isLon } from '../lib/sanitize';
import type { Place } from '../lib/types';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type ThemePref = 'auto' | 'light' | 'dark';

export interface Settings {
  home: Place | null;
  /** Entro quanti km una scossa è "vicino a me". */
  radiusKm: number;
  textSize: TextSize;
  theme: ThemePref;
  highContrast: boolean;
  /** Nell'elenco: mostrare anche le microscosse (sotto magnitudo 2). */
  showMicro: boolean;
  alerts: {
    enabled: boolean;
    minMag: number;
  };
  /** Ha già visto la schermata di benvenuto. */
  onboarded: boolean;
  /** Voci della checklist "Prepara la tua casa" già fatte. */
  checklist: Record<string, boolean>;
}

export const STORAGE_KEY = 'quakeitalia:settings:v1';

const DEFAULTS: Settings = {
  home: null,
  // «Vicino» = il proprio comune e quelli intorno. Le scosse lontane ma sentite a casa le segnaliamo comunque
  // (vedi impact.ts e useQuakeAlerts): il raggio decide solo cosa contiamo come «vicino».
  radiusKm: 30,
  textSize: 'normal',
  theme: 'light',
  highContrast: false,
  showMicro: false,
  alerts: { enabled: false, minMag: 2.5 },
  onboarded: false,
  checklist: {},
};

const oneOf = <T,>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

/**
 * Le impostazioni salvate nel browser possono essere modificate a mano o corrotte:
 * teniamo solo i valori validi e per tutto il resto usiamo quelli di base.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  let home: Place | null = null;
  const h = r.home as Record<string, unknown> | null | undefined;
  if (h && typeof h === 'object' && isLat(Number(h.lat)) && isLon(Number(h.lon)) && cleanText(h.name, 80)) {
    home = { lat: Number(h.lat), lon: Number(h.lon), name: cleanText(h.name, 80), detail: cleanText(h.detail, 120) || undefined };
  }
  const alerts = (r.alerts && typeof r.alerts === 'object' ? r.alerts : {}) as Record<string, unknown>;
  const checklist: Record<string, boolean> = {};
  if (r.checklist && typeof r.checklist === 'object') {
    for (const [k, v] of Object.entries(r.checklist as Record<string, unknown>).slice(0, 30)) {
      if (/^[a-z]{1,20}$/.test(k) && v === true) checklist[k] = true;
    }
  }
  return {
    home,
    radiusKm: oneOf(r.radiusKm, [30, 50, 100, 200], DEFAULTS.radiusKm),
    textSize: oneOf(r.textSize, ['normal', 'large', 'xlarge'] as const, DEFAULTS.textSize),
    theme: oneOf(r.theme, ['light', 'dark', 'auto'] as const, DEFAULTS.theme),
    highContrast: r.highContrast === true,
    showMicro: r.showMicro === true,
    alerts: {
      enabled: alerts.enabled === true,
      minMag: inRange(Number(alerts.minMag), 2, 4) ? oneOf(Number(alerts.minMag), [2, 2.5, 3, 4], DEFAULTS.alerts.minMag) : DEFAULTS.alerts.minMag,
    },
    onboarded: r.onboarded === true,
    checklist,
  };
}

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => sanitizeSettings(readRaw(STORAGE_KEY)));

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Riflette le preferenze di aspetto sull'elemento <html> (vedi tokens.css).
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.textSize = settings.textSize;
    r.dataset.theme = settings.theme;
    if (settings.highContrast) r.dataset.contrast = 'high';
    else delete r.dataset.contrast;
  }, [settings.textSize, settings.theme, settings.highContrast]);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings va usato dentro <SettingsProvider>');
  return ctx;
}

/** Il tema effettivo (chiaro/scuro), tenendo conto della preferenza di sistema. */
export function useResolvedTheme(): 'light' | 'dark' {
  const { settings } = useSettings();
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (settings.theme !== 'auto') return settings.theme;
  return systemDark ? 'dark' : 'light';
}
