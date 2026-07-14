import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileIcon, X } from 'lucide-react';
import { formatFileSize } from '../lib/format.js';

export default function Dropzone({ file, onFileSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList?.[0];
      if (selected) onFileSelected(selected);
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(event.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  if (file) {
    return (
      <div className="glass-panel flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
            <FileIcon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{file.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onFileSelected(null)}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Rimuovi file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={[
        'glass-panel flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-10 text-center transition-all duration-200',
        isDragging ? 'border-cyan-400/60 bg-white/[0.09] shadow-glow' : 'hover:border-white/20',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
        <UploadCloud className="h-6 w-6 text-cyan-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200">
          Trascina un file qui, o <span className="gradient-text">sfoglia</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Qualsiasi tipo di file è supportato</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
