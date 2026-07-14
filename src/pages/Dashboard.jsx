import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Files, HardDrive, UploadCloud, Library, Wifi, WifiOff, Wand2 } from 'lucide-react';
import { fetchFiles } from '../lib/api.js';
import { formatFileSize } from '../lib/format.js';

export default function Dashboard() {
  const [status, setStatus] = useState('loading'); // loading | online | offline
  const [stats, setStats] = useState({ count: 0, totalSize: 0 });

  useEffect(() => {
    const controller = new AbortController();

    fetchFiles(controller.signal)
      .then((files) => {
        setStats({
          count: files.length,
          totalSize: files.reduce((sum, f) => sum + f.file_size, 0),
        });
        setStatus('online');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStatus('offline');
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Panoramica della tua libreria cifrata, al sicuro sul tuo dispositivo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Files}
          label="File nella libreria"
          value={stats.count}
          loading={status === 'loading'}
        />
        <StatCard
          icon={HardDrive}
          label="Spazio utilizzato"
          value={formatFileSize(stats.totalSize)}
          loading={status === 'loading'}
        />
        <ConnectionCard status={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ShortcutCard
          to="/cifra-carica"
          icon={UploadCloud}
          title="Cifra & Carica"
          description="Cifra un nuovo file lato client e caricalo nella libreria."
        />
        <ShortcutCard
          to="/libreria"
          icon={Library}
          title="Libreria File"
          description="Sfoglia, decifra e scarica i file salvati."
        />
        <ShortcutCard
          to="/strumenti"
          icon={Wand2}
          title="Strumenti One-Off"
          description="Cifra o decifra un file al volo, senza salvarlo."
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-white">{loading ? '—' : value}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({ status }) {
  const online = status === 'online';
  return (
    <div className="glass-panel p-5">
      <div className="flex items-center gap-3">
        <div
          className={[
            'flex h-10 w-10 items-center justify-center rounded-xl',
            online ? 'bg-emerald-500/15' : 'bg-red-500/15',
          ].join(' ')}
        >
          {online ? (
            <Wifi className="h-5 w-5 text-emerald-400" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-400" />
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500">Server locale</p>
          <p className={'text-xl font-semibold ' + (online ? 'text-emerald-400' : 'text-red-400')}>
            {status === 'loading' ? 'Verifica…' : online ? 'Connesso' : 'Non raggiungibile'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="glass-panel glass-panel-hover group block p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-gradient shadow-glow transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
    </Link>
  );
}
