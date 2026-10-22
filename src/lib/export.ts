import type { Quake } from './types';

const csvCell = (v: string | number | null) => {
  let s = v == null ? '' : String(v);
  // Un testo che inizia con = + - @ (o tab/a capo) verrebbe eseguito come formula da Excel e simili
  // ("CSV injection"): lo apostrofo lo fa leggere come testo. I numeri restano numeri (es. profondità -0,5).
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(quakes: Quake[]): string {
  const head = ['event_id', 'time_utc', 'latitude', 'longitude', 'depth_km', 'magnitude', 'mag_type', 'place', 'author', 'version'];
  const rows = quakes.map((q) =>
    [q.id, q.time.toISOString(), q.lat, q.lon, q.depthKm, q.mag, q.magType, q.place, q.author, q.version].map(csvCell).join(','),
  );
  return [head.join(','), ...rows].join('\n');
}

export function toGeoJson(quakes: Quake[]): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: quakes.map((q) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [q.lon, q.lat, q.depthKm] },
      properties: {
        eventId: q.id, time: q.time.toISOString(), mag: q.mag, magType: q.magType,
        place: q.place, author: q.author, version: q.version,
      },
    })),
  });
}

export function downloadText(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
