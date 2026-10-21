export interface LatLon {
  lat: number;
  lon: number;
}

/** Un luogo scelto dall'utente (casa, posizione attuale...). */
export interface Place extends LatLon {
  name: string;
  /** Provincia / regione, per distinguere comuni omonimi. */
  detail?: string;
}

/** Un terremoto, già convertito dal formato GeoJSON dell'INGV. */
export interface Quake {
  id: string;
  /** Istante dell'evento (l'INGV lo fornisce in UTC). */
  time: Date;
  lat: number;
  lon: number;
  depthKm: number;
  mag: number;
  magType: string;
  /** Descrizione originale INGV, es. "4 km E Bolognola (MC)". */
  place: string;
  author: string;
  version: number | null;
  type: string;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}
