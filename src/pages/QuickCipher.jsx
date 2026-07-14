import { useState } from 'react';
import { Lock, Unlock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Dropzone from '../components/Dropzone.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { encryptFile, decryptFile, downloadBlob } from '../lib/crypto.js';

const MODES = { ENCRYPT: 'encrypt', DECRYPT: 'decrypt' };

export default function QuickCipher() {
  const [mode, setMode] = useState(MODES.ENCRYPT);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function switchMode(nextMode) {
    setMode(nextMode);
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  }

  const isValid =
    file &&
    password.length > 0 &&
    (mode === MODES.DECRYPT || password === confirmPassword);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!file) return setError('Seleziona un file.');
    if (!password) return setError('Inserisci una password.');
    if (mode === MODES.ENCRYPT && password !== confirmPassword) {
      return setError('Le password non coincidono.');
    }

    setBusy(true);
    try {
      if (mode === MODES.ENCRYPT) {
        const encryptedBlob = await encryptFile(file, password);
        downloadBlob(encryptedBlob, `${file.name}.enc`);
        setSuccess('File cifrato e scaricato con successo.');
      } else {
        const plainBuffer = await decryptFile(file, password);
        const restoredName = file.name.endsWith('.enc')
          ? file.name.slice(0, -4)
          : `${file.name}.decrypted`;
        downloadBlob(new Blob([plainBuffer]), restoredName);
        setSuccess('File decifrato e scaricato con successo.');
      }
      setFile(null);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Strumenti One-Off</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cifra o decifra un file al volo, senza salvare nulla nella libreria locale.
        </p>
      </header>

      <div className="glass-panel flex gap-1.5 p-1.5">
        <ModeButton
          active={mode === MODES.ENCRYPT}
          icon={Lock}
          label="Cifra"
          onClick={() => switchMode(MODES.ENCRYPT)}
        />
        <ModeButton
          active={mode === MODES.DECRYPT}
          icon={Unlock}
          label="Decifra"
          onClick={() => switchMode(MODES.DECRYPT)}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Dropzone file={file} onFileSelected={setFile} disabled={busy} />

        <div className="glass-panel space-y-4 p-5">
          <div>
            <label htmlFor="qc-password" className="mb-1.5 block text-xs font-medium text-slate-400">
              Password
            </label>
            <PasswordInput
              id="qc-password"
              value={password}
              onChange={setPassword}
              placeholder={mode === MODES.ENCRYPT ? 'Password robusta' : 'Password usata in cifratura'}
              autoComplete={mode === MODES.ENCRYPT ? 'new-password' : 'off'}
            />
          </div>
          {mode === MODES.ENCRYPT && (
            <div>
              <label
                htmlFor="qc-confirm"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Conferma password
              </label>
              <PasswordInput
                id="qc-confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Ripeti la password"
                autoComplete="new-password"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        <button type="submit" disabled={!isValid || busy} className="glass-btn-primary w-full">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Elaborazione in corso…
            </>
          ) : mode === MODES.ENCRYPT ? (
            <>
              <Lock className="h-4 w-4" />
              Cifra e scarica
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4" />
              Decifra e scarica
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
        active ? 'bg-accent-gradient text-white shadow-glow' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
