import { useState } from 'react';
import { Pencil, Loader2, AlertCircle, X } from 'lucide-react';
import PasswordInput from './PasswordInput.jsx';

// Stessa regola di format.js/getExtension: un punto iniziale o finale non
// conta come estensione (es. ".env" resta tutto "titolo").
function splitFileName(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return { base: filename, ext: '' };
  return { base: filename.slice(0, dot), ext: filename.slice(dot) };
}

/** Modale per rinominare un file: la password viene verificata provando a decifrarlo. */
export default function RenamePromptModal({ filename, onConfirm, onCancel }) {
  const { base, ext } = splitFileName(filename);
  const [newBase, setNewBase] = useState(base);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!newBase.trim()) return setError('Inserisci un nome file.');
    if (!password) return setError('Inserisci la password.');
    setBusy(true);
    setError('');
    try {
      await onConfirm(`${newBase.trim()}${ext}`, password);
    } catch (err) {
      setError(err.message || 'Password errata o file corrotto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-sm space-y-4 p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Pencil className="h-4.5 w-4.5 shrink-0 text-cyan-300" />
            <p className="truncate text-sm font-medium text-slate-100">Rinomina file</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Annulla"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label htmlFor="rename-name" className="mb-1.5 block text-xs font-medium text-slate-400">
            Nuovo nome
          </label>
          <div className="relative">
            <input
              id="rename-name"
              type="text"
              value={newBase}
              onChange={(event) => setNewBase(event.target.value)}
              className={'glass-input' + (ext ? ' pr-14' : '')}
              autoFocus
            />
            {ext && (
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                {ext}
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="rename-password" className="mb-1.5 block text-xs font-medium text-slate-400">
            Password di decifratura
          </label>
          <PasswordInput
            id="rename-password"
            value={password}
            onChange={setPassword}
            placeholder="Conferma la password del file"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="glass-btn" disabled={busy}>
            Annulla
          </button>
          <button type="submit" className="glass-btn-primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Rinomina
          </button>
        </div>
      </form>
    </div>
  );
}
