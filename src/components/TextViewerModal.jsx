import { useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

export default function TextViewerModal({ filename, content, onClose, onDownload }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="h-4.5 w-4.5 shrink-0 text-cyan-300" />
            <p className="truncate text-sm font-medium text-slate-100">{filename}</p>
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

        <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-relaxed text-slate-200">
          {content}
        </pre>

        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3.5">
          <button type="button" onClick={onClose} className="glass-btn">
            Chiudi
          </button>
          <button type="button" onClick={onDownload} className="glass-btn-primary">
            <Download className="h-4 w-4" />
            Scarica file decifrato
          </button>
        </div>
      </div>
    </div>
  );
}
