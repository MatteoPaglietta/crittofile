// Tutta la cifratura/decifratura avviene qui, esclusivamente nel browser
// tramite Web Crypto API. Nessun dato in chiaro o password lascia mai questo
// modulo: il server riceve/restituisce solo blob binari già cifrati.

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // byte
const IV_LENGTH = 12; // byte, dimensione raccomandata per AES-GCM
const HEADER_LENGTH = SALT_LENGTH + IV_LENGTH;

/** Deriva una chiave AES-GCM-256 dalla password tramite PBKDF2-SHA256. */
async function deriveKey(password, salt, usages) {
  const passwordBytes = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

/**
 * Cifra un File/Blob con AES-GCM-256. Il risultato è un Blob nel formato:
 * [salt 16B][iv 12B][ciphertext...] pronto per essere caricato sul server.
 */
export async function encryptFile(file, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt, ['encrypt']);
  const plainBuffer = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBuffer);

  return new Blob([salt, iv, ciphertext], { type: 'application/octet-stream' });
}

/**
 * Decifra un Blob prodotto da encryptFile. Lancia un errore se la password
 * è errata o il file è corrotto (il tag GCM non verifica).
 */
export async function decryptFile(encryptedBlob, password) {
  const buffer = await encryptedBlob.arrayBuffer();
  if (buffer.byteLength < HEADER_LENGTH) {
    throw new Error('File cifrato non valido o corrotto.');
  }

  const salt = new Uint8Array(buffer.slice(0, SALT_LENGTH));
  const iv = new Uint8Array(buffer.slice(SALT_LENGTH, HEADER_LENGTH));
  const ciphertext = buffer.slice(HEADER_LENGTH);

  const key = await deriveKey(password, salt, ['decrypt']);

  try {
    return await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  } catch {
    throw new Error('Password errata o file corrotto.');
  }
}

/** Avvia il download di un Blob nel browser e libera subito l'URL temporaneo. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
