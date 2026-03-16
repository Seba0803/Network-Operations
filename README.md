# IT Ops — Growth Tracker

App per tracciare aperture shop, minishop, trasferimenti e trasformazioni con checklist, note e sync in tempo reale per il team.

---

## Guida all'installazione passo-passo (30-45 minuti)

### Passo 1 — Crea un account GitHub (5 min)

1. Vai su [github.com](https://github.com) e clicca **Sign up**
2. Scegli un username, email e password
3. Verifica la tua email

---

### Passo 2 — Crea il repository su GitHub (3 min)

1. Una volta loggato, clicca sul **+** in alto a destra → **New repository**
2. Nome repository: `itops-growth-tracker`
3. Seleziona **Public** (necessario per GitHub Pages gratuito)
4. Clicca **Create repository**

---

### Passo 3 — Carica i file (5 min)

1. Nella pagina del repository appena creato, clicca **uploading an existing file**
2. Trascina tutti i file e le cartelle di questo progetto nell'area di upload
   - ⚠️ Assicurati di caricare anche le cartelle: `src/`, `supabase/`, `.github/`
3. Clicca **Commit changes**

---

### Passo 4 — Crea un account Supabase (5 min)

1. Vai su [supabase.com](https://supabase.com) e clicca **Start your project**
2. Accedi con GitHub (comodo, usi lo stesso account)
3. Clicca **New project**
4. Scegli un nome (es. `itops-tracker`), imposta una password per il database, scegli la region **eu-central-1 (Frankfurt)**
5. Aspetta ~2 minuti che il progetto sia pronto

---

### Passo 5 — Crea le tabelle su Supabase (3 min)

1. Nel pannello Supabase, vai su **SQL Editor** nel menu a sinistra
2. Clicca **New query**
3. Apri il file `supabase/schema.sql` di questo progetto, copia tutto il contenuto
4. Incollalo nell'editor SQL di Supabase
5. Clicca **Run** — vedrai il messaggio "Success"

---

### Passo 6 — Copia le credenziali Supabase (2 min)

1. Nel pannello Supabase, vai su **Project Settings** (icona ingranaggio) → **API**
2. Copia:
   - **Project URL** (es. `https://abcdefgh.supabase.co`)
   - **anon / public key** (la chiave lunga sotto "Project API keys")
3. Apri il file `src/lib/supabase.js` nel tuo repository GitHub
4. Clicca l'icona matita (Edit file)
5. Sostituisci:
   ```
   const SUPABASE_URL = 'https://TUO-PROGETTO.supabase.co'
   const SUPABASE_ANON_KEY = 'tua-anon-key-qui'
   ```
   con i tuoi valori reali
6. Clicca **Commit changes**

---

### Passo 7 — Abilita GitHub Pages (3 min)

1. Nel repository GitHub, vai su **Settings** (tab in alto)
2. Nel menu a sinistra, clicca **Pages**
3. Sotto "Source", seleziona **GitHub Actions**
4. Clicca **Save**

---

### Passo 8 — Attendi il deploy (3-5 min)

1. Vai su **Actions** (tab in alto del repository)
2. Vedrai un workflow in esecuzione — aspetta che diventi verde ✅
3. La tua app sarà disponibile su:
   ```
   https://TUO-USERNAME.github.io/itops-growth-tracker/
   ```

---

### Passo 9 — Configura l'autenticazione Supabase (2 min)

1. Su Supabase, vai su **Authentication** → **URL Configuration**
2. Aggiungi il tuo URL GitHub Pages come **Site URL**:
   ```
   https://TUO-USERNAME.github.io/itops-growth-tracker/
   ```
3. Aggiungilo anche in **Redirect URLs**
4. Clicca **Save**

---

### Passo 10 — Condividi con il team!

Invia il link `https://TUO-USERNAME.github.io/itops-growth-tracker/` ai tuoi colleghi.

Ogni persona crea il proprio account direttamente dall'app (registrazione con email).

---

## Aggiornamenti futuri

Per aggiornare l'app basta modificare i file direttamente su GitHub — il deploy avviene automaticamente in ~3 minuti.

---

## Personalizzazioni comuni

### Aggiungere una nuova tipologia di operazione

Apri `src/lib/templates.js` e aggiungi la tua tipologia seguendo il pattern esistente.

### Cambiare il nome dell'app

Apri `index.html` e cambia il contenuto del tag `<title>`.

---

## Stack tecnologico

| Tecnologia | Uso | Costo |
|---|---|---|
| React 18 + Vite | Frontend | Gratuito |
| Supabase | Database + Auth + Realtime | Gratuito (fino a 500MB, 50k richieste/mese) |
| GitHub Pages | Hosting | Gratuito (repo pubblico) |
| GitHub Actions | Deploy automatico | Gratuito (2000 min/mese) |

---

## Supporto

Per problemi o domande, apri una **Issue** su questo repository GitHub.
