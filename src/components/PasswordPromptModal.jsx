import { useState } from 'react';
import { KeyRound, Loader2, AlertCircle, X } from 'lucide-react';
import PasswordInput from './PasswordInput.jsx';

/** Modale che chiede la password di decifratura al momento dell'apertura di un file specifico. */
export default function PasswordPromptModal({ filename, onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!password) return setError('Inserisci la password.');
    setBusy(true);
    setError('');
    try {
      await onConfirm(password);
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
            <KeyRound className="h-4.5 w-4.5 shrink-0 text-cyan-300" />
            <p className="truncate text-sm font-medium text-slate-100">Sblocca «{filename}»</p>
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
          <label htmlFor="unlock-password" className="mb-1.5 block text-xs font-medium text-slate-400">
            Password di decifratura
          </label>
          <PasswordInput
            id="unlock-password"
            value={password}
            onChange={setPassword}
            placeholder="Inserisci la password usata in fase di cifratura"
            autoFocus
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
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Sblocca
          </button>
        </div>
      </form>
    </div>
  );
}
