/**
 * localStorage può essere bloccato (navigazione privata, permessi): mai far crashare l'app.
 * Restituisce il valore grezzo: chi lo usa deve validarlo (può essere stato modificato a mano).
 */
export function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* pazienza: le impostazioni valgono solo per questa visita */
  }
}
