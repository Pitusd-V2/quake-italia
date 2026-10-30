# Proposta: notifiche anche a sito chiuso (in sospeso)

Stato: **messa da parte il 30 ottobre 2026**, da riprendere. Nessun codice scritto.

## 1. Cosa sono e cosa NON sono

- **Sono** un messaggio che arriva qualche minuto dopo una scossa, per capire cos'era:
  «Sì, era una scossa. A Norcia si è sentita leggera, come un camion che passa».
- **Non sono** un allarme che arriva prima della scossa (early warning, come in Giappone). I dati INGV arrivano dopo
  qualche minuto: la notifica arriverebbe **2–10 minuti dopo**.

Va scritto chiaramente ovunque (regola n.1 e Termini d'uso): **non è un sistema di allerta**.

## 2. Come funzionerebbe

1. Un piccolo programma su Cloudflare (Worker con cron) chiede all'INGV le nuove scosse **una volta al minuto**:
   una sola richiesta, come un singolo utente.
2. Per ogni scossa nuova calcola quanto si è sentita nella zona di ogni iscritto, con la stessa formula del sito
   (`src/lib/impact.ts`, `src/lib/feltLike.ts`).
3. Manda la notifica solo a chi l'ha sentita davvero, secondo le sue preferenze.

Vincolo tecnico: il telefono non può ricevere tutte le notifiche e scartare quelle che non lo riguardano (i browser
obbligano a mostrare ogni notifica ricevuta). Quindi la scelta la fa il server, che deve sapere **più o meno** dove abiti.

## 3. Privacy: cosa si conserverebbe

Il minimo indispensabile:

- il **«codice» di iscrizione** alle notifiche generato dal browser (anonimo: niente nome, email o telefono);
- una **zona approssimativa**, un riquadro di circa 10 km (non la casa, non il comune preciso);
- le **preferenze** (quali scosse, ore notturne).

Conseguenze:

- aggiornare la Privacy Policy: cosa, perché, per quanto, come si cancella (un tocco disattivando le notifiche;
  automaticamente se il browser segnala che l'iscrizione non esiste più);
- le notifiche passano dai server di **Google, Apple o Mozilla** (dipende dal telefono): va dichiarato;
- con dati conservati davvero, l'indicazione del titolare del trattamento come solo «Quake Italia» pesa di più.

## 4. Anti-allarmismo: cosa scrivere e quando

- **Solo se si è sentita a casa tua**: di giorno dal grado III («leggera», come un camion); di notte dal grado IV
  (quelle che svegliano qualcuno).
- **Messaggi da persona**, con le frasi del sito. Esempio:
  «Sì, era una scossa. A Norcia si è sentita leggera, come un camion in strada. Magnitudo 3,1 a 9 km. Primi dati INGV.»
- **Sciami** (es. Campi Flegrei): al massimo un avviso ogni tot minuti, il resto raggruppato:
  «Altre 6 scosse leggere vicino a Pozzuoli nell'ultima ora. Andamento: in calo».
- **Magnitudo rivista**: una sola notifica di aggiornamento, solo se la correzione cambia molto il giudizio.
- **112**: solo nel livello «possibili danni», come nel sito.

## 5. Limiti

- **iPhone**: funziona solo con Quake Italia **installata sulla schermata Home** (iOS 16.4+). Serve una guida semplice.
- **Costi**: gratis all'inizio; con qualche centinaio/migliaio di iscritti il piano gratuito di Cloudflare non basta
  (ogni notifica va cifrata singolarmente): piano Workers da **5 $/mese**.
- **Affidabilità**: se l'INGV o i servizi push rallentano, le notifiche arrivano tardi o non arrivano. Va dichiarato.
- **Manutenzione**: il server va tenuto d'occhio (es. se il controllo automatico si blocca).

## 6. Sicurezza

- Chiave VAPID nei «secrets» di Cloudflare, mai nel codice.
- Iscrizioni accettate solo verso i servizi push ufficiali (Google, Apple, Mozilla, Microsoft), con limiti di
  dimensione e di frequenza.
- Si può cancellare solo un'iscrizione di cui si possiede il codice (la propria).

## 7. Come procedere

1. **Prima le regole, poi il codice**: soglie, testi e regole per gli sciami.
2. **Prototipo** su Cloudflare, provato con le scosse simulate, senza utenti veri.
3. **Prova con poche persone** (familiari, i 5 tester over 60): tranquillizza o disturba?
4. Solo dopo: Privacy Policy aggiornata e pubblicazione.

## Decisioni ancora aperte

1. Ok a un piccolo server e ai dati minimi descritti? (cambio di principio rispetto a «niente dati»)
2. Soglie: giorno dal grado III e notte dal IV, oppure solo dal IV sempre?
3. Sciami: massimo una notifica ogni 30 minuti con riepilogo?
4. Costi: ok all'eventuale piano da 5 $/mese?
