# Sicurezza di Quake Italia

## Segnalare un problema di sicurezza

Se trovi una vulnerabilità **non aprire una segnalazione pubblica** (issue): chiunque la leggerebbe prima che sia corretta.

- Su GitHub, nella scheda **Security** del repository, usa **«Report a vulnerability»** (segnalazione privata).
- Oppure scrivi a **quakeitalia@gmail.com**.

Descrivi il problema e, se puoi, come riprodurlo. Rispondiamo **entro 7 giorni**.
Quake Italia è un progetto personale e gratuito: non ci sono premi in denaro, ma ringraziamo volentieri chi segnala
(se lo desideri, anche per nome nella pagina dei crediti).

### Cosa rientra

- Il codice di questo repository e il sito pubblicato a partire da esso.
- La versione più recente del ramo `main`: le versioni precedenti non vengono corrette.

### Cosa non rientra

- **Dati sbagliati di INGV, Photon o OpenFreeMap**: sono servizi esterni, va segnalato a loro.
  Per un terremoto con dati che sembrano errati, fa fede il sito dell'[INGV](https://terremoti.ingv.it/).
- Attacchi che richiedono di avere già il controllo del dispositivo o del browser di chi visita il sito.
- Segnalazioni automatiche senza un caso concreto (per esempio «manca l'header X» quando c'è già).

## Come è fatto il sito

Quake Italia è un **sito statico**: niente server nostro, niente database, niente account.
Il browser scarica i nostri file (HTML, JS, CSS) e legge i dati direttamente da tre servizi pubblici:
INGV (terremoti), Photon (ricerca comuni), OpenFreeMap (mappe).

Quindi gli attacchi possibili sono pochi ma reali:

| Rischio | Esempio | Difesa |
|---|---|---|
| Testo o link manipolati (XSS) | un servizio esterno manomesso inserisce codice o link truffa nei nomi delle località | React non esegue mai l'HTML; in più `src/lib/sanitize.ts` toglie HTML, link, caratteri invisibili e "testo girato"; i dati non plausibili vengono scartati |
| Codice estraneo nella pagina | uno script iniettato prova a caricare altro codice o a mandare dati altrove | **Content-Security-Policy**: solo i nostri script, nessuno script in linea, connessioni solo verso INGV / Photon / OpenFreeMap |
| Indirizzi costruiti ad arte | `/terremoto/<script>…`, coordinate assurde nell'URL | ID e coordinate validati: se non sono validi non partono nemmeno richieste |
| Preferenze manomesse | qualcuno modifica il localStorage | `sanitizeSettings` tiene solo valori validi |
| Formule nei file esportati | un testo che Excel eseguirebbe come formula nel CSV | le celle che iniziano con `=`, `+`, `-`, `@` vengono neutralizzate |
| Clickjacking | il sito messo dentro un iframe di un sito truffa | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Connessioni non cifrate | rete Wi-Fi pubblica che modifica la pagina | HTTPS obbligatorio (HSTS) + `upgrade-insecure-requests` |
| Librerie compromesse (supply chain) | una libreria npm con una backdoor | versioni bloccate (`package-lock.json` + `save-exact`), `npm ci`, `npm audit` e Dependabot, controlli automatici a ogni modifica |

## Le difese nel codice

- `security/headers.ts`: CSP e header di sicurezza. Il build genera `dist/_headers` (Cloudflare Pages / Netlify)
  e `npm run preview` usa gli stessi header, così si provano in locale.
- `src/lib/sanitize.ts`: pulizia dei testi esterni, ID sicuri, lista dei domini per i link esterni.
- Nessuno script in linea nella pagina (il tema si applica con `public/theme-init.js`).
- Nessun `innerHTML`, `eval` o `dangerouslySetInnerHTML` nel nostro codice.
- Tutti i link esterni con `rel="noopener noreferrer"`.
- Le simulazioni di sviluppo (`src/dev/`) non finiscono mai nella versione pubblicata.
- Niente source map in produzione.
- `npm run build` esegue prima typecheck e **test** (`src/lib/security.test.ts`): se un controllo di sicurezza fallisce, il build si ferma.
- `.github/workflows/ci.yml`, a ogni modifica e ogni lunedì:
  - le librerie che arrivano nel browser non devono avere vulnerabilità note, nemmeno moderate;
  - gli strumenti usati solo per costruire il sito non devono averne di gravi;
  - poi typecheck, test e build.
- `.github/dependabot.yml`: propone gli aggiornamenti delle librerie, che passano dagli stessi controlli.

## Se contribuisci

- **Nuovo servizio esterno** (API, mappe, font): aggiungi il dominio in `security/headers.ts` (`connect-src` o la direttiva giusta), altrimenti il browser lo blocca. Va descritto anche nella Privacy Policy: un test lo controlla.
- **Nuovo link esterno**: aggiungi il dominio in `ALLOWED_LINK_HOSTS` (`src/lib/sanitize.ts`). Un test controlla che ogni link nel codice sia in lista.
- **Testi che arrivano da fuori**: passali sempre da `cleanText()`.
- **Nuova libreria npm**: preferisci librerie molto usate e mantenute, controlla `npm audit` dopo l'installazione.
- Non usare mai `dangerouslySetInnerHTML`, `innerHTML` con dati esterni, `eval` o script da CDN.
- Mai chiavi, password o altri segreti nel codice.

## Limiti onesti

- Se INGV, Photon o OpenFreeMap fossero compromessi, potrebbero mandarci **dati sbagliati** (es. un terremoto finto):
  possiamo filtrare quelli assurdi e impedire che diventino codice o link, ma non possiamo sapere se un dato plausibile è vero.
- La CSP permette agli stili impostati via JavaScript di funzionare (servono a React e alla mappa).
- Quake Italia **non è un sistema di allerta**: i dati arrivano dopo che la scossa è avvenuta e possono avere ritardi.
