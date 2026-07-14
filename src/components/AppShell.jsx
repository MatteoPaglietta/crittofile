import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import MobileNav from './MobileNav.jsx';
import BackgroundLayer from './BackgroundLayer.jsx';

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <BackgroundLayer />
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col md:flex-row">
        <MobileTopBar />
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-4 md:pb-4 md:pl-0">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
