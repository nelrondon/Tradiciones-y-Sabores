import { Bell, HelpCircle, Search, Terminal } from 'lucide-react';

interface TopBarProps {
  currentView: string;
  setView: (view: string) => void;
}

export default function TopBar({ currentView, setView }: TopBarProps) {
  return (
    <header className="bg-surface text-primary border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center w-full px-8 h-16 shrink-0">
      {/* Brand/Product Logo (Visible more on mobile, or just as structural anchor) */}
      <div className="flex items-center gap-8 h-full">
        <div className="font-mono text-lg font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
          <Terminal size={24} />
          <span className="hidden md:inline">UDO-FAT ADMIN v1.0</span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex gap-8 h-full items-end">
          <button 
            onClick={() => setView('pos')}
            className={`text-sm font-bold pb-4 cursor-pointer transition-opacity border-b-2 ${currentView === 'pos' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-secondary'}`}
          >
            Vista en Vivo
          </button>
          <button 
            onClick={() => setView('kitchen')}
            className={`text-sm font-bold pb-4 cursor-pointer transition-opacity border-b-2 ${currentView === 'kitchen' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-secondary'}`}
          >
            Cocina
          </button>
          <button 
            onClick={() => setView('reports')}
            className={`text-sm font-bold pb-4 cursor-pointer transition-opacity border-b-2 ${currentView === 'reports' ? 'text-secondary border-secondary' : 'text-on-surface-variant border-transparent hover:text-secondary'}`}
          >
            Reportes
          </button>
        </nav>
      </div>

      {/* Trailing Actions & Search */}
      <div className="flex items-center gap-6">
        {/* Search placeholder for reports view mostly, but good to have globally */}
        <div className="relative hidden xl:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input 
            type="text" 
            placeholder="Buscar pedidos..." 
            className="pl-10 pr-4 h-10 w-64 bg-surface-container border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-sm text-primary transition-colors"
          />
        </div>

        {/* System Status */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded border border-outline-variant">
          <div className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></div>
          <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">Estado del Sistema: Óptimo</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-surface-variant rounded transition-colors text-on-surface-variant">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-surface-variant rounded transition-colors text-on-surface-variant">
            <HelpCircle size={20} />
          </button>
          <button className="p-2 lg:hidden hover:bg-surface-variant rounded transition-colors text-on-surface-variant">
            <Search size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
