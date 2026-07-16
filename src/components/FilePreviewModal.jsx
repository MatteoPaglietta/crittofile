import { useEffect, useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Pencil, Save, Loader2, AlertCircle, Check } from 'lucide-react';

const ICONS = { text: FileText, image: ImageIcon, pdf: FileText };

/**
 * kind: 'text' (editabile, content = stringa) | 'image' | 'pdf'
 * (image/pdf sono sola anteprima, content = object URL del blob decifrato)
 */
export default function FilePreviewModal({ kind, filename, content, onClose, onDownload, onSave }) {
  const editable = kind === 'text';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editable ? content : '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !editing) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, editing]);

  // Il contenuto può cambiare dall'esterno dopo un salvataggio riuscito.
  useEffect(() => {
    if (editable) setDraft(content);
  }, [editable, content]);

  function startEditing() {
    setDraft(content);
    setSaveError('');
    setSaved(false);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(content);
    setSaveError('');
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      await onSave(draft);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  }

  const Icon = ICONS[kind] || FileText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={editing ? undefined : onClose}
    >
      <div
        className={
          'glass-panel flex w-full max-w-3xl flex-col overflow-hidden ' +
          (kind === 'pdf' ? 'h-[95vh]' : 'max-h-[80vh]')
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Icon className="h-4.5 w-4.5 shrink-0 text-cyan-300" />
            <p className="truncate text-sm font-medium text-slate-100" title={filename}>
              {filename}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi anteprima"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
            autoFocus
            className="min-h-0 flex-1 resize-none overflow-auto bg-transparent p-5 font-mono text-sm leading-relaxed text-slate-200 outline-none"
          />
        ) : kind === 'image' ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-5">
            <img src={content} alt={filename} className="max-h-full max-w-full object-contain" />
          </div>
        ) : kind === 'pdf' ? (
          <iframe title={filename} src={content} className="min-h-0 flex-1 border-0 bg-white" />
        ) : (
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-relaxed text-slate-200">
            {content}
          </pre>
        )}

        {saveError && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {saveError}
          </div>
        )}

        {saved && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <Check className="h-3.5 w-3.5 shrink-0" />
            Modifiche salvate e ricifrate.
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3.5">
          {editing ? (
            <>
              <button type="button" onClick={cancelEditing} disabled={saving} className="glass-btn">
                Annulla
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="glass-btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Salvataggio…' : 'Salva modifiche'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="glass-btn">
                Chiudi
              </button>
              {editable && (
                <button type="button" onClick={startEditing} className="glass-btn">
                  <Pencil className="h-4 w-4" />
                  Modifica
                </button>
              )}
              <button type="button" onClick={onDownload} className="glass-btn-primary">
                <Download className="h-4 w-4" />
                Scarica file decifrato
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
