import { ShieldCheck } from 'lucide-react';

export default function MobileTopBar() {
  return (
    <header className="glass-panel m-4 mb-0 flex items-center gap-3 p-3 md:hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
        <ShieldCheck className="h-4.5 w-4.5 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-white">CrittoFile</p>
        <p className="text-[11px] leading-tight text-slate-400">Zero-Knowledge</p>
      </div>
    </header>
  );
}
