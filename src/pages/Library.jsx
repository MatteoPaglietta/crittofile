import { useCallback, useEffect, useState } from 'react';
import {
  FileIcon,
  Download,
  Unlock,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Inbox,
} from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal.jsx';
import PasswordPromptModal from '../components/PasswordPromptModal.jsx';
import RenamePromptModal from '../components/RenamePromptModal.jsx';
import { fetchFiles, downloadEncryptedFile, updateFileContent, renameFile, deleteFile } from '../lib/api.js';
import { decryptFile, encryptFile, downloadBlob } from '../lib/crypto.js';
import {
  formatFileSize,
  formatDate,
  getExtension,
  isTextLikeFile,
  isImageFile,
  isPdfFile,
  getMimeType,
} from '../lib/format.js';

// Stato per-riga: idle | downloading-raw | success-raw | downloading | decrypting
//                | success | error | confirm-delete | deleting
export default function Library() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rowState, setRowState] = useState({});
  const [passwordPrompt, setPasswordPrompt] = useState(null); // { file }
  const [renamePrompt, setRenamePrompt] = useState(null); // { file }
  // kind 'text': { kind, fileId, filename, content, password } — content è una stringa, editabile
  // kind 'image'|'pdf': { kind, filename, content, blob } — content è un object URL, sola anteprima
  const [viewer, setViewer] = useState(null);

  const loadFiles = useCallback((signal) => {
    setLoading(true);
    setLoadError('');
    return fetchFiles(signal)
      .then((data) => setFiles(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setLoadError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadFiles(controller.signal);
    return () => controller.abort();
  }, [loadFiles]);

  function setRow(id, patch) {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // Scarica il file esattamente come conservato su disco: nessuna password
  // richiesta, perché non avviene alcuna decifratura.
  async function handleDownloadRaw(file) {
    try {
      setRow(file.id, { phase: 'downloading-raw', error: '' });
      const encryptedBlob = await downloadEncryptedFile(file.saved_filename);
      downloadBlob(encryptedBlob, `${file.original_name}.enc`);
      setRow(file.id, { phase: 'success-raw' });
      setTimeout(() => setRow(file.id, { phase: 'idle' }), 2000);
    } catch (err) {
      setRow(file.id, { phase: 'error', error: err.message || 'Errore durante il download.' });
    }
  }

  function requestUnlock(file) {
    setRow(file.id, { error: '' });
    setPasswordPrompt({ file });
  }

  // Invocata dal modale di sblocco: propaga l'errore per tenerlo aperto se la
  // password è sbagliata, e lo chiude solo in caso di successo.
  async function unlockAndDecrypt(password) {
    const { file } = passwordPrompt;
    try {
      setRow(file.id, { phase: 'downloading', error: '' });
      const encryptedBlob = await downloadEncryptedFile(file.saved_filename);

      setRow(file.id, { phase: 'decrypting' });
      const plainBuffer = await decryptFile(encryptedBlob, password);

      if (isTextLikeFile(file.original_name)) {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(plainBuffer);
        setViewer({ kind: 'text', fileId: file.id, filename: file.original_name, content: text, password });
        setRow(file.id, { phase: 'idle', error: '' });
      } else if (isImageFile(file.original_name) || isPdfFile(file.original_name)) {
        const blob = new Blob([plainBuffer], { type: getMimeType(file.original_name) });
        const objectUrl = URL.createObjectURL(blob);
        setViewer({
          kind: isPdfFile(file.original_name) ? 'pdf' : 'image',
          filename: file.original_name,
          content: objectUrl,
          blob,
        });
        setRow(file.id, { phase: 'idle', error: '' });
      } else {
        downloadBlob(new Blob([plainBuffer]), file.original_name);
        setRow(file.id, { phase: 'success', error: '' });
        setTimeout(() => setRow(file.id, { phase: 'idle' }), 2000);
      }
      setPasswordPrompt(null);
    } catch (err) {
      setRow(file.id, { phase: 'idle' });
      throw err;
    }
  }

  // Chiude il modale di anteprima e libera l'object URL del blob (image/pdf),
  // altrimenti resterebbe agganciato in memoria finché la pagina non ricarica.
  function closeViewer() {
    if (viewer?.content && viewer.kind !== 'text') URL.revokeObjectURL(viewer.content);
    setViewer(null);
  }

  // Ricifra il testo modificato con la stessa password usata per aprirlo e
  // sostituisce il contenuto sul server, mantenendo id e saved_filename.
  async function handleSaveEdit(newText) {
    const { fileId, password } = viewer;
    const encryptedBlob = await encryptFile(new Blob([newText], { type: 'text/plain' }), password);
    const updated = await updateFileContent(fileId, encryptedBlob);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, file_size: updated.file_size, upload_date: updated.upload_date } : f
      )
    );
    setViewer((prev) => ({ ...prev, content: newText }));
  }

  function requestRename(file) {
    setRow(file.id, { error: '' });
    setRenamePrompt({ file });
  }

  // La password non serve per il rename in sé (il nome è un metadato in
  // chiaro): viene usata per decifrare il file e verificare che chi rinomina
  // ne conosca davvero la password, prima di modificarne il nome.
  async function handleRename(newName, password) {
    const { file } = renamePrompt;
    const encryptedBlob = await downloadEncryptedFile(file.saved_filename);
    await decryptFile(encryptedBlob, password);
    const updated = await renameFile(file.id, newName);
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, original_name: updated.original_name } : f))
    );
    setRenamePrompt(null);
  }

  async function handleDelete(file) {
    try {
      setRow(file.id, { phase: 'deleting', error: '' });
      await deleteFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setRow(file.id, { phase: 'error', error: err.message || 'Errore durante l’eliminazione.' });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Libreria File</h1>
          <p className="mt-1 text-sm text-slate-400">
            {files.length} file cifrat{files.length === 1 ? 'o' : 'i'} salvat
            {files.length === 1 ? 'o' : 'i'} nella libreria.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadFiles()}
          className="glass-btn"
          disabled={loading}
        >
          <RefreshCcw className={'h-4 w-4' + (loading ? ' animate-spin' : '')} />
          Aggiorna
        </button>
      </header>

      {loadError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
        </div>
      )}

      {!loading && files.length === 0 && !loadError && (
        <div className="glass-panel flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="h-8 w-8 text-slate-500" />
          <p className="text-sm text-slate-400">Nessun file nella libreria.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            state={rowState[file.id] || { phase: 'idle' }}
            onDownloadRaw={() => handleDownloadRaw(file)}
            onDecrypt={() => requestUnlock(file)}
            onRename={() => requestRename(file)}
            onRequestDelete={() => setRow(file.id, { phase: 'confirm-delete' })}
            onCancelDelete={() => setRow(file.id, { phase: 'idle' })}
            onConfirmDelete={() => handleDelete(file)}
          />
        ))}
      </div>

      {passwordPrompt && (
        <PasswordPromptModal
          filename={passwordPrompt.file.original_name}
          onConfirm={unlockAndDecrypt}
          onCancel={() => setPasswordPrompt(null)}
        />
      )}

      {renamePrompt && (
        <RenamePromptModal
          filename={renamePrompt.file.original_name}
          onConfirm={handleRename}
          onCancel={() => setRenamePrompt(null)}
        />
      )}

      {viewer && (
        <FilePreviewModal
          kind={viewer.kind}
          filename={viewer.filename}
          content={viewer.content}
          onClose={closeViewer}
          onDownload={() =>
            downloadBlob(
              viewer.kind === 'text' ? new Blob([viewer.content]) : viewer.blob,
              viewer.filename
            )
          }
          onSave={viewer.kind === 'text' ? handleSaveEdit : undefined}
        />
      )}
    </div>
  );
}

function FileCard({
  file,
  state,
  onDownloadRaw,
  onDecrypt,
  onRename,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const busy =
    state.phase === 'downloading-raw' ||
    state.phase === 'downloading' ||
    state.phase === 'decrypting' ||
    state.phase === 'deleting';

  return (
    <div className="glass-panel glass-panel-hover flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
          <FileIcon className="h-5 w-5 text-cyan-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100" title={file.original_name}>
            {file.original_name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{formatDate(file.upload_date)}</p>
        </div>
        <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400">
          {getExtension(file.original_name)}
        </span>
      </div>

      <p className="text-xs text-slate-500">{formatFileSize(file.file_size)}</p>

      {state.phase === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {state.error}
        </div>
      )}

      {state.phase === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <Check className="h-3.5 w-3.5 shrink-0" />
          File decifrato e scaricato.
        </div>
      )}

      {state.phase === 'success-raw' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <Check className="h-3.5 w-3.5 shrink-0" />
          File cifrato scaricato.
        </div>
      )}

      {state.phase === 'confirm-delete' ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-slate-400">Eliminare definitivamente?</span>
          <button
            type="button"
            onClick={onCancelDelete}
            aria-label="Annulla eliminazione"
            className="glass-btn !px-2.5 !py-1.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            aria-label="Conferma eliminazione"
            className="glass-btn-danger !px-2.5 !py-1.5"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDecrypt}
            disabled={busy}
            className="glass-btn-primary flex-1 !py-2"
          >
            {state.phase === 'downloading' || state.phase === 'decrypting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            {state.phase === 'downloading'
              ? 'Scaricamento…'
              : state.phase === 'decrypting'
                ? 'Decifratura…'
                : 'Decripta'}
          </button>
          <button
            type="button"
            onClick={onDownloadRaw}
            disabled={busy}
            className="glass-btn !px-3"
            aria-label="Scarica versione cifrata"
            title="Scarica versione cifrata (nessuna password richiesta)"
          >
            {state.phase === 'downloading-raw' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onRename}
            disabled={busy}
            className="glass-btn !px-3"
            aria-label="Rinomina file"
            title="Rinomina file (richiede la password)"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            disabled={busy}
            className="glass-btn-danger !px-3"
            aria-label="Elimina file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
