"""
Estrae dal catalogo storico CPTI15 dell'INGV (file Excel ufficiale) i dati per il post
"I grandi terremoti della storia d'Italia" e per la parte storica dei vulcani.

    python scripts/build-history-data.py percorso/CPTI15_v4.0.xlsx

Il file si scarica da https://emidius.mi.ingv.it/CPTI15-DBMI15/ (dati CC BY 4.0).
Serve la libreria openpyxl (pip install openpyxl).
"""
import json
import sys
from datetime import date
from pathlib import Path

import openpyxl

SRC = sys.argv[1]
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "learn" / "cpti15.json"

wb = openpyxl.load_workbook(SRC, read_only=True)
rows = list(wb["catalogue"].iter_rows(values_only=True))
head = rows[0]
col = {name: i for i, name in enumerate(head)}
data = [r for r in rows[1:] if r[col["Year"]] is not None]


def event(r):
    return {
        "anno": r[col["Year"]],
        "mese": r[col["Mo"]],
        "giorno": r[col["Da"]],
        "area": r[col["EpicentralArea"]],
        "mw": r[col["MwDef"]],
        "io": r[col["IoDef"]] or None,
        "lat": r[col["LatDef"]],
        "lon": r[col["LonDef"]],
        "sezione": r[col["Sect"]],
    }


with_mw = [r for r in data if r[col["MwDef"]] is not None]

# Tutti i terremoti di Mw >= 6,5: la "classifica" dei più forti.
forti = sorted((event(r) for r in with_mw if r[col["MwDef"]] >= 6.5), key=lambda e: -e["mw"])

# Quanti terremoti di Mw >= 6 per secolo (attenzione: i secoli antichi sono incompleti).
per_secolo = {}
for r in with_mw:
    if r[col["MwDef"]] >= 6.0:
        sec = (r[col["Year"]] - 1) // 100 + 1
        per_secolo[sec] = per_secolo.get(sec, 0) + 1

# Aree vulcaniche: NV = area flegrea (Campi Flegrei, Ischia, Vesuvio), EV = Etna.
def top_vulcanici(sezione, n=8):
    def io_num(r):
        try:
            return float(str(r[col["IoDef"]] or "0").split("-")[0])
        except ValueError:
            return 0.0
    v = [r for r in with_mw if r[col["Sect"]] == sezione]
    return {
        "totale": len(v),
        "piuForti": [event(r) for r in sorted(v, key=lambda r: (-io_num(r), -r[col["MwDef"]]))[:n]],
    }

result = {
    "titolo": "CPTI15 v4.0 — Catalogo Parametrico dei Terremoti Italiani (INGV)",
    "fonte": "Rovida A., Locati M., Camassi R., Lolli B., Gasperini P., Antonucci A. (2022). Catalogo Parametrico dei Terremoti Italiani (CPTI15), versione 4.0. INGV. https://doi.org/10.13127/CPTI/CPTI15.4",
    "url": "https://emidius.mi.ingv.it/CPTI15-DBMI15/",
    "estratto": date.today().isoformat(),
    "totaleEventi": len(data),
    "primoAnno": min(r[col["Year"]] for r in data),
    "ultimoAnno": max(r[col["Year"]] for r in data),
    "forti": forti,
    "mw6PerSecolo": sorted(per_secolo.items()),
    "flegreo": top_vulcanici("NV"),
    "etna": top_vulcanici("EV"),
}
OUT.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
print(f"{len(forti)} terremoti Mw>=6,5; secoli: {sorted(per_secolo.items())}")
