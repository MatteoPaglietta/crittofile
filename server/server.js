import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { db, UPLOADS_DIR } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// I nomi salvati su disco sono sempre generati dal server (UUID + estensione
// fissa), mai derivati dall'input dell'utente: evita path traversal e
// collisioni, e nasconde il nome file originale a chi ha accesso al filesystem.
const SAVED_FILENAME_RE = /^[a-f0-9-]{36}\.enc$/;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.enc`),
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
});

// GET /api/files - elenco dei file cifrati salvati nella libreria
app.get('/api/files', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, original_name, saved_filename, file_size, upload_date FROM file_library ORDER BY upload_date DESC'
    )
    .all();
  res.json(rows);
});

// POST /api/upload - riceve un blob già cifrato lato client (salt+iv+ciphertext)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nessun file ricevuto.' });
  }
  const originalName = req.body?.originalName;
  if (!originalName || typeof originalName !== 'string') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Nome file originale mancante.' });
  }

  const stmt = db.prepare(
    'INSERT INTO file_library (original_name, saved_filename, file_size) VALUES (?, ?, ?)'
  );
  const info = stmt.run(originalName, req.file.filename, req.file.size);

  res.status(201).json({
    id: info.lastInsertRowid,
    original_name: originalName,
    saved_filename: req.file.filename,
    file_size: req.file.size,
  });
});

// GET /api/download/:filename - invia il file cifrato così com'è (nessuna decifratura server-side)
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  if (!SAVED_FILENAME_RE.test(filename)) {
    return res.status(400).json({ error: 'Nome file non valido.' });
  }

  const row = db.prepare('SELECT * FROM file_library WHERE saved_filename = ?').get(filename);
  if (!row) {
    return res.status(404).json({ error: 'File non trovato.' });
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File non trovato su disco.' });
  }

  res.download(filePath, row.original_name + '.enc');
});

// DELETE /api/files/:id - rimuove il file dal disco e dal database
app.delete('/api/files/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'ID non valido.' });
  }

  const row = db.prepare('SELECT * FROM file_library WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: 'File non trovato.' });
  }

  const filePath = path.join(UPLOADS_DIR, row.saved_filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).json({ error: 'Errore durante la rimozione del file dal disco.' });
    }
    db.prepare('DELETE FROM file_library WHERE id = ?').run(id);
    res.json({ success: true });
  });
});

// In produzione il server serve anche la build statica della SPA React.
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] Crittofile backend in ascolto su http://localhost:${PORT}`);
});
