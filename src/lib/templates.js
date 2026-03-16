export const TASK_TEMPLATES = {
  'NUOVO NEGOZIO': [
    'Spedizione 1 HIT',
    'Spedizione 1 OtoCam',
    'Spedizione 1/2 Hi-Pro',
    'Verifica e richiesta 1/2 OtoPad (PromiGroup)',
    'Verifica Nr OtoSwitcher (cabina)',
    'Creazione Shop - OtoPad Portal',
    'Creazione Utenza di Filiale',
    'Aggiornamento File Man',
    'Ingaggio Promigroup',
    'Richiesta linea dati e linea voce',
    'Installazione stampanti',
  ],
  'NUOVO NEGOZIO DIRETTA': [
    'Spedizione 1 HIT',
    'Spedizione 1 OtoCam',
    'Spedizione 1/2 Hi-Pro',
    'Verifica e richiesta 1/2 OtoPad (PromiGroup)',
    'Verifica Nr OtoSwitcher (cabina)',
    'Creazione Shop - OtoPad Portal',
    'Creazione Utenza di Filiale',
    'Aggiornamento File Man',
    'Ingaggio Promigroup',
    'Richiesta linea dati e linea voce',
    'Installazione stampanti',
    'Registratore di cassa',
  ],
  'NUOVO MINISHOP': [
    'Spedizione 1 OtoCam',
    'Aggiornamento File Man / OtoCam',
    'Richiesta linea dati e linea voce',
    'Installazione stampanti',
  ],
  'NUOVO MINISHOP DIRETTA': [
    'Spedizione 1 OtoCam',
    'Aggiornamento File Man / OtoCam',
    'Richiesta linea dati e linea voce',
    'Installazione stampanti',
    'Registratore di cassa',
  ],
  'TRASFERIMENTO': [
    'Richiesta Natus intervento',
    'Invio Braccio Aurical',
    'Invio Layout Allestitore x Braccio',
    'Definizione Strumenti in Layout',
    'Invio Indirizzo a Promigroup',
  ],
  'RISTRUTTURAZIONE': [
    'Richiesta Natus intervento',
    'Invio Braccio Aurical',
    'Invio Layout Allestitore x Braccio',
    'Definizione Strumenti in Layout',
  ],
  'SECONDA STANZA': [
    'Spedizione 1 Hi-Pro',
    'Richiesta 1 OtoPad',
    'Verifica Nr OtoSwitcher',
    'Creazione Utenza di Filiale',
    'Aggiornare nr OtoPad - File Man',
    'Ingaggio Promigroup',
    'Eventuale aggiunta stampante monofunzione se terza stanza',
  ],
  'TRASFORMAZIONE DA MINI A SHOP': [
    'Spedizione 1 HIT',
    'Spedizione 1 Hi-Pro',
    'Richiesta 1 OtoPad',
    'Creazione Shop - OtoPad Portal',
    'Creazione Utenza di Filiale',
    'Aggiornare nr OtoPad - File Man',
    'Ingaggio Promigroup',
    'Aggiunta stampante monofunzione',
  ],
  'ALTRO': [],
}

export const TYPE_LABELS = {
  'NUOVO NEGOZIO': 'Nuovo negozio (ATG)',
  'NUOVO NEGOZIO DIRETTA': 'Nuovo negozio (Diretta)',
  'NUOVO MINISHOP': 'Nuovo minishop (ATG)',
  'NUOVO MINISHOP DIRETTA': 'Nuovo minishop (Diretta)',
  'TRASFERIMENTO': 'Trasferimento',
  'RISTRUTTURAZIONE': 'Ristrutturazione',
  'SECONDA STANZA': 'Seconda stanza',
  'TRASFORMAZIONE DA MINI A SHOP': 'Mini → Shop',
  'ALTRO': 'Altro',
}

export const TYPE_COLORS = {
  'NUOVO NEGOZIO':          { bg: '#E6F1FB', text: '#0C447C' },
  'NUOVO NEGOZIO DIRETTA':  { bg: '#B5D4F4', text: '#042C53' },
  'NUOVO MINISHOP':         { bg: '#EAF3DE', text: '#27500A' },
  'NUOVO MINISHOP DIRETTA': { bg: '#C0DD97', text: '#173404' },
  'TRASFERIMENTO':          { bg: '#FAEEDA', text: '#633806' },
  'RISTRUTTURAZIONE':       { bg: '#FBEAF0', text: '#72243E' },
  'SECONDA STANZA':         { bg: '#EEEDFE', text: '#3C3489' },
  'TRASFORMAZIONE DA MINI A SHOP': { bg: '#E1F5EE', text: '#085041' },
  'ALTRO':                  { bg: '#F1EFE8', text: '#444441' },
}

// Mappatura tipo filiale dal documento Word
export const FILIALE_TYPE_MAP = {
  'ATG': null, // scelto manualmente tra NUOVO NEGOZIO e NUOVO MINISHOP
  'DIRETTA': null, // scelto manualmente tra NUOVO NEGOZIO DIRETTA e NUOVO MINISHOP DIRETTA
}
