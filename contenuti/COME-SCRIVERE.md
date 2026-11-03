# Come scrivere (o correggere) un articolo di «Capire»

Gli articoli sono file di testo in `contenuti/articoli/`, uno per articolo. Il nome del file è l'indirizzo della pagina:
`campi-flegrei.mdx` diventa `/capire/campi-flegrei`. Le regole editoriali complete sono nella pagina
[Come scriviamo gli articoli](https://github.com/Pitusd-V2/quake-italia/blob/main/src/pages/EditorialPage.tsx)
(sul sito: `/come-scriviamo`). Prima di scrivere, leggile.

## Correggere una frase

Apri il file, correggi il testo, aggiorna `verificato` con la data di oggi se hai ricontrollato le fonti. Se l'errore era
importante (un fatto sbagliato, non un refuso), aggiungi una voce in cima a `src/learn/corrections.ts`: gli errori non si
cancellano di nascosto.

## Scrivere un articolo nuovo

Copia questo schema in un file nuovo, per esempio `contenuti/articoli/liquefazione.mdx`:

```mdx
---
titolo: "Quando il terreno diventa liquido"
sottotitolo: "La liquefazione: perché durante una scossa la sabbia può comportarsi come l’acqua."
percorso: le-basi          # uno di: le-basi, italia, storia, vulcani, sicurezza, scienza, miti, persone
ordine: 6                  # posizione nel percorso (non due articoli con lo stesso numero)
minuti: 5                  # tempo di lettura
verificato: 2026-11-03     # data in cui hai ricontrollato a mano le affermazioni sulle fonti
riassuntoTitolo: "In 30 secondi"   # facoltativo (di base: «In breve»)
riassunto:                 # da 2 a 5 punti: l'essenziale, comprensibile da chiunque
  - "Primo punto."
  - "Secondo punto."
glossario:
  - termine: "Liquefazione"
    definizione: "Spiegazione in una riga."
fonti:                     # almeno 3; almeno una con link. Prima le fonti ufficiali, poi gli studi.
  - testo: "Autore, A. (anno). Titolo dello studio. Rivista, volume"
    url: "https://doi.org/..."
  - testo: "INGV — titolo della pagina"
    url: "https://..."
  - testo: "Libro o documento senza link (accettato, ma meglio con link)"
correlati: [repliche-e-sequenze]   # altri articoli da suggerire alla fine
paroleChiave: ["liquefazione", "sabbia", "Emilia 2012"]  # per la ricerca
# revisione:               # SOLO se un esperto esterno ha davvero rivisto l'articolo
#   nome: "Nome Cognome"
#   ruolo: "sismologo, Università di …"
#   data: 2026-11-10
---

<Part n={1} kicker="La storia">Un titolo per la prima parte</Part>

Testo normale in **Markdown**: paragrafi separati da una riga vuota, *corsivo*, [link a un’altra pagina](/cosa-fare),
[link esterno](https://www.ingv.it/) (solo siti in `src/lib/sanitize.ts`). I termini scientifici, la prima volta:
<dfn>liquefazione</dfn>.

- Gli elenchi puntati si scrivono così.

## Un sottotitolo

<Part n={2} kicker="Cosa dicono i dati">…</Part>

<Part n={3} kicker="Per chi vuole andare a fondo">…</Part>
```

### Le tre parti

Gli articoli sono «a strati»: chi legge solo il riassunto deve aver capito l'essenziale; la parte 1 racconta (una storia
vera, un caso italiano); la parte 2 mostra le prove (dati, studi); la parte 3 è per chi vuole il metodo, i limiti degli
studi e il dibattito. Per un articolo breve bastano riassunto e testo, senza le parti.

### Grafici

I grafici sono componenti React in `src/learn/figures*.tsx` e si inseriscono con una riga di `import` sotto i dati in cima,
per esempio `import { MonthsChart } from '../../src/learn/figures3'` e poi `<MonthsChart />` nel testo. I numeri presi dai
dati si scrivono come `{n(dati.totale)}` (vedi gli articoli esistenti): così restano sempre uguali ai dati.

## I controlli

- `npm run build` si ferma se un articolo non rispetta le regole (fonti, date, link, percorso…) e dice cosa sistemare.
- `npm run check:fonti` controlla che i link funzionino e che ogni DOI porti allo studio citato. Gira anche da solo ogni
  lunedì su GitHub.
- Prima di proporre un articolo, leggilo ad alta voce: se una frase non si capisce al primo ascolto, va riscritta.
- **Nessun articolo va online senza che una persona l’abbia letto e approvato.** Lo promettiamo pubblicamente nella
  pagina «Come scriviamo»: è una regola, non un consiglio.
