# Sicurezza di Quake Italia

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
| Clickjacking | il sito messo dentro un iframe di un sito truffa | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Connessioni non cifrate | rete Wi-Fi pubblica che modifica la pagina | HTTPS obbligatorio (HSTS) + `upgrade-insecure-requests` |
| **Backdoor nelle librerie (supply chain)** | una libreria npm compromessa | versioni bloccate (`package-lock.json` + `save-exact`), `npm ci`, `npm audit`, Dependabot, CI che blocca il deploy |
| **Furto degli account** (il rischio più grande) | qualcuno entra nel tuo GitHub o hosting e sostituisce il sito | vedi checklist qui sotto: 2FA e accessi minimi |

## Già fatto nel codice

- `security/headers.ts`: CSP e header di sicurezza. Il build genera `dist/_headers` (Cloudflare Pages / Netlify)
  e `npm run preview` usa gli stessi header, così si provano in locale.
- `src/lib/sanitize.ts`: pulizia dei testi esterni, ID sicuri, lista dei domini per i link esterni.
- Nessuno script in linea nella pagina (il tema si applica con `public/theme-init.js`).
- Nessun `innerHTML`, `eval` o `dangerouslySetInnerHTML` nel nostro codice.
- Tutti i link esterni con `rel="noopener noreferrer"`.
- Le simulazioni di sviluppo (`src/dev/`) non finiscono mai nella versione pubblicata.
- Niente source map in produzione.
- `npm run build` esegue prima typecheck e **test** (`src/lib/security.test.ts`): se un controllo di sicurezza fallisce, non si pubblica.
- `.github/workflows/ci.yml`: a ogni modifica `npm ci` + `npm audit` + build; ogni lunedì ricontrolla le dipendenze.
- `.github/dependabot.yml`: propone gli aggiornamenti di sicurezza delle librerie.

## Da fare quando pubblichi (checklist)

### Account (la parte più importante)
- [ ] **2FA attiva** su GitHub, sull'hosting (Cloudflare/Netlify) e sul registrar del dominio. Meglio con app di autenticazione o chiavetta, non SMS.
- [ ] Email dell'account protetta da password unica e 2FA (chi controlla l'email può recuperare tutti gli altri account).
- [ ] Password diverse per ogni servizio (usa un password manager).
- [ ] Nessun altro con accesso "admin" se non serve.

### GitHub
- [ ] Ramo `main` protetto: niente push diretti, solo pull request con la CI verde.
- [ ] Il sito si pubblica **solo dalla CI / dall'hosting collegato al repository**, mai caricando file a mano.
- [ ] Attiva "Dependabot alerts" e "Secret scanning" nelle impostazioni del repository.
- [ ] Se un domani ci saranno chiavi o segreti: mai nel codice, solo nei "secrets" dell'hosting/CI.

### Dominio
- [ ] Blocco del trasferimento del dominio ("registrar lock") attivo.
- [ ] DNSSEC attivo, se il registrar lo offre.
- [ ] Record DNS **CAA** che permette i certificati solo all'autorità usata dall'hosting.

### Dopo la pubblicazione
- [ ] Controlla gli header con [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory) o securityheaders.com: obiettivo A/A+.
- [ ] Apri il sito e la console del browser: nessun errore "Content-Security-Policy".
- [ ] Valuta di aggiungere `/.well-known/security.txt` con un contatto per segnalare problemi.
- [ ] Quando il sito è stabile in HTTPS, puoi iscriverlo alla lista "HSTS preload".

## Se aggiungi qualcosa

- **Nuovo servizio esterno** (API, mappe, font): aggiungi il dominio in `security/headers.ts` (`connect-src` o la direttiva giusta), altrimenti il browser lo blocca.
- **Nuovo link esterno**: aggiungi il dominio in `ALLOWED_LINK_HOSTS` (`src/lib/sanitize.ts`). Un test controlla che ogni link nel codice sia in lista.
- **Testi che arrivano da fuori**: passali sempre da `cleanText()`.
- **Nuova libreria npm**: preferisci librerie molto usate e mantenute, controlla `npm audit` dopo l'installazione.
- Non usare mai `dangerouslySetInnerHTML`, `innerHTML` con dati esterni, `eval` o script da CDN.

## Limiti onesti

- Se INGV, Photon o OpenFreeMap fossero compromessi, potrebbero mandarci **dati sbagliati** (es. un terremoto finto):
  possiamo filtrare quelli assurdi e impedire che diventino codice o link, ma non possiamo sapere se un dato plausibile è vero.
- La CSP permette agli stili impostati via JavaScript di funzionare (servono a React e alla mappa).
- Le difese lato browser non sostituiscono la protezione degli account: senza 2FA tutto il resto conta poco.
