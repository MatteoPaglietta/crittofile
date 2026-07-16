// Wrapper per le chiamate al backend locale. Il backend vede e conserva
// esclusivamente blob già cifrati e metadati non sensibili: nessuna password
// o contenuto in chiaro transita mai attraverso queste funzioni.

async function parseJsonOrThrow(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    // risposta senza corpo JSON (es. errore di rete generico)
  }
  if (!response.ok) {
    throw new Error(body?.error || `Richiesta fallita (${response.status})`);
  }
  return body;
}

export async function fetchFiles(signal) {
  const response = await fetch('/api/files', { signal });
  return parseJsonOrThrow(response);
}

/** Upload con progress reale tramite XMLHttpRequest (fetch non lo espone). */
export function uploadEncryptedFile(blob, originalName, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob, `${originalName}.enc`);
    formData.append('originalName', originalName);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // ignora corpo non JSON
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        reject(new Error(body?.error || `Upload fallito (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Errore di rete durante l’upload.'));
    xhr.onabort = () => reject(new DOMException('Upload annullato', 'AbortError'));

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.send(formData);
  });
}

export async function downloadEncryptedFile(savedFilename, signal) {
  const response = await fetch(`/api/download/${encodeURIComponent(savedFilename)}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Download fallito (${response.status})`);
  }
  return response.blob();
}

/** Sostituisce il contenuto cifrato di un file già in libreria (salvataggio dopo modifica). */
export async function updateFileContent(id, encryptedBlob) {
  const formData = new FormData();
  formData.append('file', encryptedBlob, 'content.enc');
  const response = await fetch(`/api/files/${id}/content`, { method: 'PUT', body: formData });
  return parseJsonOrThrow(response);
}

export async function deleteFile(id) {
  const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
  return parseJsonOrThrow(response);
}
