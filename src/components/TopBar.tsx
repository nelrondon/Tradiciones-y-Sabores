import { useState, useEffect } from 'react';
import { Bell, Search, ChefHat } from 'lucide-react';

interface TopBarProps {
  currentView: string;
  setView: (view: string) => void;
}

const LABELS: Record<string, string> = {
  pos:       'Punto de Venta',
  orders:    'Pedidos',
  kitchen:   'Panel de Cocina',
  inventory: 'Inventario',
  suppliers: 'Proveedores',
  reports:   'Reportes y Datos',
};

export default function TopBar({ currentView, setView: _setView }: TopBarProps) {
  const [hora, setHora] = useState('');

  useEffect(() => {
    const tick = () =>
      setHora(new Date().toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Caracas',
      }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center w-full px-6 h-14 shrink-0 shadow-sm">

      {/* ── Título de la vista actual ─────────────────────── */}
      <div className="flex items-center gap-3">
        <ChefHat size={18} className="text-secondary-container shrink-0" />
        <div className="hidden md:block h-4 w-px bg-outline-variant" />
        <h1 className="text-sm font-bold text-on-surface tracking-wide">
          {LABELS[currentView] ?? currentView}
        </h1>
      </div>

      {/* ── Reloj ────────────────────────────────────────────── */}
      {hora && (
        <span className="hidden md:block font-mono text-sm font-bold text-on-surface-variant tabular-nums">
          {hora}
        </span>
      )}

      {/* ── Acciones ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Búsqueda global */}
        <div className="relative hidden xl:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            className="pl-8 pr-4 h-8 w-52 bg-surface-container-low border border-outline-variant rounded-lg focus:border-secondary-container focus:ring-1 focus:ring-secondary-container/40 outline-none text-xs text-on-surface transition-colors placeholder:text-outline"
          />
        </div>

        {/* Estado del sistema */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            En línea
          </span>
        </div>

        {/* Notificaciones */}
        <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant relative">
          <Bell size={17} />
        </button>
      </div>
    </header>
  );
}
