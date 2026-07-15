# Crittofile

App web per cifrare e archiviare file localmente. Tutta la cifratura e la decifratura avviene **esclusivamente nel browser** (Web Crypto API, AES-GCM-256 con chiave derivata via PBKDF2-SHA256): password e contenuti in chiaro non lasciano mai il client. Il backend riceve, salva e restituisce solo blob già cifrati insieme a metadati non sensibili (nome originale, dimensione, data).

## Come funziona la cifratura

Per ogni file cifrato (`src/lib/crypto.js`):

1. Vengono generati un salt casuale (16 byte) e un IV casuale (12 byte, richiesto da AES-GCM).
2. Dalla password viene derivata una chiave AES-GCM-256 con PBKDF2 (100.000 iterazioni, SHA-256).
3. Il file viene cifrato e il risultato salvato/caricato nel formato `[salt 16B][iv 12B][ciphertext...]`.
4. In decifratura si esegue il procedimento inverso: password sbagliata o file corrotto fanno fallire la verifica del tag GCM.

Non esiste un modo per recuperare un file se la password viene persa: non viene salvata da nessuna parte.

## Struttura del progetto

- **Frontend** (`src/`, React 19 + Vite + Tailwind, routing con `react-router-dom`):
  - `Dashboard` (`/`) — pagina iniziale.
  - `Upload` (`/cifra-carica`) — cifra un file e lo carica nella libreria sul server.
  - `Library` (`/libreria`) — elenca, scarica ed elimina i file cifrati salvati.
  - `Strumenti` / `QuickCipher` (`/strumenti`) — cifra o decifra un file al volo, solo nel browser, senza toccare il server/la libreria.
- **Backend** (`server/`, Express + `node:sqlite`):
  - `server/server.js` — API REST: `GET /api/files`, `POST /api/upload`, `GET /api/download/:filename`, `DELETE /api/files/:id`. In produzione serve anche la build statica di `dist/`.
  - `server/db.js` — inizializza il database SQLite (`server/libreria.db`) e la cartella `server/uploads/` al primo avvio, se non esistono già.
  - I file cifrati vengono salvati su disco con un nome generato dal server (UUID + `.enc`), mai derivato dall'input utente.

Il database e la cartella `uploads/` sono locali alla macchina e **non versionati** (vedi `.gitignore`): contengono i file cifrati e i relativi metadati dell'utente.

## Requisiti

- **Node.js ≥ 22.5** (usa il modulo `node:sqlite` integrato in Node — nessuna dipendenza nativa da compilare, quindi non servono Python o build tools). Segui il link per il download -> https://nodejs.org/en/download

## Avvio del progetto
1. Apri il terminale
2. Entra nella cartella del progetto unzippata
3. Esegui i seguenti comandi:
```bash
npm install
npm run dev:all
```

Questo avvia insieme:
- il frontend Vite su `http://localhost:5173`
- il backend Express su `http://localhost:3001` (il dev server di Vite fa da proxy per `/api/*` verso questa porta, vedi `vite.config.js`)

4. Apri `http://localhost:5173` nel browser.

### Comandi disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia solo il frontend (Vite) |
| `npm run server` | Avvia solo il backend (Express) |
| `npm run dev:all` | Avvia frontend e backend insieme (consigliato in sviluppo) |
| `npm run build` | Build di produzione del frontend in `dist/` |
| `npm run preview` | Anteprima locale della build di produzione |
| `npm run start` | Build + avvio del backend, che serve anche il frontend già buildato (uso "produzione" locale, un solo processo su `http://localhost:3001`) |
| `npm run lint` | Lint del codice con `oxlint` |

## Note

- Il database e la cartella upload vengono creati automaticamente al primo avvio del backend: non serve alcun setup manuale oltre a `npm install`.
- Il progetto è pensato per uso locale/personale: il backend non ha autenticazione, quindi non è pensato per essere esposto direttamente su internet.
