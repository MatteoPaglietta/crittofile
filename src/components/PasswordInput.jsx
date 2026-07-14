import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function PasswordInput({ value, onChange, placeholder, id, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || 'Password'}
        autoComplete={autoComplete || 'off'}
        className="glass-input pl-10 pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-200"
        tabIndex={-1}
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
