import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Dropzone from '../components/Dropzone.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { encryptFile } from '../lib/crypto.js';
import { uploadEncryptedFile } from '../lib/api.js';

const PHASES = {
  IDLE: 'idle',
  ENCRYPTING: 'encrypting',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const abortRef = useRef(null);

  // Evita di aggiornare lo stato dopo lo smontaggio del componente e annulla
  // un eventuale upload in corso se l'utente cambia pagina.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const busy = phase === PHASES.ENCRYPTING || phase === PHASES.UPLOADING;

  const isValid = file && password.length > 0 && password === confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return setError('Seleziona un file da cifrare.');
    if (password.length === 0) return setError('Inserisci una password.');
    if (password !== confirmPassword) return setError('Le password non coincidono.');

    setError('');
    setProgress(0);

    try {
      setPhase(PHASES.ENCRYPTING);
      const encryptedBlob = await encryptFile(file, password);

      setPhase(PHASES.UPLOADING);
      const controller = new AbortController();
      abortRef.current = controller;
      await uploadEncryptedFile(encryptedBlob, file.name, {
        signal: controller.signal,
        onProgress: setProgress,
      });

      setPhase(PHASES.SUCCESS);
      setFile(null);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Si è verificato un errore imprevisto.');
      setPhase(PHASES.ERROR);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Cifra & Carica</h1>
        <p className="mt-1 text-sm text-slate-400">
          Il file viene cifrato interamente nel tuo browser prima di lasciare il dispositivo.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Dropzone file={file} onFileSelected={setFile} disabled={busy} />

        <div className="glass-panel space-y-4 p-5">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-400">
              Password di cifratura
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Password robusta"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Conferma password
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Ripeti la password"
              autoComplete="new-password"
            />
          </div>
        </div>

        {phase === PHASES.UPLOADING && (
          <div className="glass-panel p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Caricamento del file cifrato…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent-gradient transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {phase === PHASES.SUCCESS && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              File cifrato e caricato con successo.
            </span>
            <button
              type="button"
              onClick={() => navigate('/libreria')}
              className="font-medium underline underline-offset-2 hover:text-emerald-200"
            >
              Vai alla libreria
            </button>
          </div>
        )}

        <button type="submit" disabled={!isValid || busy} className="glass-btn-primary w-full">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {phase === PHASES.ENCRYPTING ? 'Cifratura in corso…' : 'Caricamento in corso…'}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Cifra e carica
            </>
          )}
        </button>
      </form>
    </div>
  );
}
