import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR = path.join(__dirname, 'uploads');
export const DB_PATH = path.join(__dirname, 'libreria.db');

// Inizializzazione automatica: chi clona il repository non trova né la
// cartella /uploads né il database. Li creiamo qui da zero come istanza vuota,
// così l'app funziona subito dopo `npm install` senza passi manuali.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const isNewDatabase = !fs.existsSync(DB_PATH);

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS file_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    saved_filename TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    upload_date TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

if (isNewDatabase) {
  console.log(`[db] Nuovo database creato in ${DB_PATH}`);
}
