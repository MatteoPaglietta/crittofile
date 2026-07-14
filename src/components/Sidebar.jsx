import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { NAV_ITEMS } from '../lib/navigation.js';

export default function Sidebar() {
  return (
    <aside className="glass-panel m-4 hidden w-64 shrink-0 flex-col p-4 md:flex">
      <div className="mb-8 flex items-center gap-3 px-2 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">CrittoFile</p>
          <p className="text-xs leading-tight text-slate-400">Zero-Knowledge</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/10 text-white shadow-glass-inset border border-white/10'
                  : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-100',
              ].join(' ')
            }
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-500">
        La password non lascia mai il tuo browser. Cifratura e decifratura
        avvengono solo lato client.
      </div>
    </aside>
  );
}
