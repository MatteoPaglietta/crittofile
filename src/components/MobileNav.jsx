import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../lib/navigation.js';

export default function MobileNav() {
  return (
    <nav className="glass-panel fixed inset-x-4 bottom-4 z-40 flex items-stretch justify-between gap-1 p-1.5 md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-all duration-200',
              isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-100',
            ].join(' ')
          }
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
