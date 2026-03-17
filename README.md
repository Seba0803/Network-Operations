# IT Ops — Growth Tracker
## Guida alla gestione del repository GitHub

App per tracciare aperture negozi, minishop, trasferimenti e trasformazioni del team IT Operations Amplifon.

🌐 **Link app:** https://seba0803.github.io/Network-Operations/

---

## Come modificare i task di una tipologia

1. Vai su `src/lib/templates.js`
2. Clicca la matita ✏️ per modificare
3. Trova la tipologia (es. `NUOVO NEGOZIO`) e aggiungi/rimuovi righe
4. Ogni task è una stringa tra virgolette, seguita da virgola
5. Clicca **Commit changes** — il deploy parte automaticamente in 2-3 minuti

**Esempio — aggiungere un task:**
```js
'NUOVO NEGOZIO': [
  'Spedizione 1 HIT',
  'Spedizione 1 OtoCam',
  'Nuovo task da aggiungere',   // ← aggiunta
],
```

---

## Come aggiungere o rimuovere un utente

1. Vai su `src/App.jsx`
2. Clicca la matita ✏️
3. Trova il blocco `const USERS = [...]`
4. Aggiungi o rimuovi una riga:
   - `{ name: 'NomeUtente', role: 'editor' }` → può modificare tutto
   - `{ name: 'NomeUtente', role: 'viewer' }` → solo lettura
5. **Commit changes**

**Utenti attuali:**
| Nome | Ruolo |
|------|-------|
| Sebastiano | editor |
| Tiziano | editor |
| Sandro | editor |
| Riccardo | editor |
| Giovanni | editor |
| Cristian | viewer |
| Angelo | viewer |

---

## Come aggiungere una nuova tipologia di operazione

1. Vai su `src/lib/templates.js`
2. Aggiungi un blocco prima di `'ALTRO'`:
```js
'NUOVA TIPOLOGIA': [
  'Primo task',
  'Secondo task',
],
```
3. Aggiungi il nome visibile in `TYPE_LABELS`:
```js
'NUOVA TIPOLOGIA': 'Nome visibile nell\'app',
```
4. Aggiungi il colore del badge in `TYPE_COLORS`:
```js
'NUOVA TIPOLOGIA': { bg: '#E6F1FB', text: '#0C447C' },
```
5. **Commit changes**

---

## Come aggiornare le credenziali Supabase

1. Vai su `src/lib/supabase.js`
2. Clicca la matita ✏️
3. Aggiorna `SUPABASE_URL` e `SUPABASE_ANON_KEY` con i valori da:
   `https://supabase.com/dashboard/project/xjdansvutcphqeedmjgp/settings/api-keys`
4. **Commit changes**

---

## Come aggiornare il logo

1. Carica il nuovo file immagine nella cartella `public/` del repository
2. Vai su `src/pages/Dashboard.jsx`
3. Trova la riga con `<img src="/Network-Operations/logo.png"`
4. Cambia `logo.png` con il nome del nuovo file
5. **Commit changes**

---

## Monitoraggio deploy

Ogni modifica al branch `main` attiva un deploy automatico su GitHub Pages.

- **Stato deploy:** https://github.com/Seba0803/Network-Operations/actions
- ✅ Verde = deploy riuscito, app aggiornata
- ❌ Rosso = errore — clicca sul job per vedere il log

---

## Struttura file principali

| File | Descrizione |
|------|-------------|
| `src/App.jsx` | Utenti, ruoli, routing pagine |
| `src/lib/templates.js` | Task per ogni tipologia di operazione |
| `src/lib/supabase.js` | Credenziali database |
| `src/lib/parseWord.js` | Lettura automatica protocolli Word |
| `src/lib/exportExcel.js` | Export dati in Excel |
| `src/pages/Dashboard.jsx` | Pagina principale con lista operazioni |
| `src/pages/OperationDetail.jsx` | Dettaglio operazione e checklist task |
| `supabase/schema.sql` | Script SQL per creare le tabelle |
| `public/logo.png` | Logo Amplifon |

---

## Link utili

| Risorsa | Link |
|---------|------|
| App | https://seba0803.github.io/Network-Operations/ |
| Repository GitHub | https://github.com/Seba0803/Network-Operations |
| Database Supabase | https://supabase.com/dashboard/project/xjdansvutcphqeedmjgp |
| Deploy Actions | https://github.com/Seba0803/Network-Operations/actions |
