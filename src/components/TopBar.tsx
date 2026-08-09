import { useState, useEffect } from 'react';
import { Bell, Search, ChefHat, Menu, Monitor, Copy, Check } from 'lucide-react';

interface TopBarProps {
  currentView: string;
  setView: (view: string) => void;
  onOpenSidebar: () => void;
}

const LABELS: Record<string, string> = {
  pos:       'Punto de Venta',
  customer:  'Pantalla Cliente',
  orders:    'Pedidos',
  kitchen:   'Panel de Cocina',
  inventory: 'Inventario',
  suppliers: 'Proveedores',
  reports:   'Reportes y Datos',
};

export default function TopBar({ currentView, setView, onOpenSidebar }: TopBarProps) {
  const [hora, setHora] = useState('');
  const [copied, setCopied] = useState(false);

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

  const copyCustomerLink = () => {
    const url = `${window.location.origin}/?view=menu`;
    // navigator.clipboard solo funciona en HTTPS.
    // Usamos el método legacy (execCommand) que funciona en HTTP y HTTPS.
    try {
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si aun así falla, mostrar el link en un prompt para copiarlo manualmente
      window.prompt('Copia este link para compartir con los clientes:', url);
    }
  };


  return (
    <header className="bg-white border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center w-full px-6 h-14 shrink-0 shadow-sm">

      {/* ── Título de la vista actual ─────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Botón menú (hamburguesa) en móvil */}
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Menu size={20} />
        </button>

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

        {/* Grupo: Pantalla Cliente + Copiar Link */}
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => window.open('/?view=menu', '_blank', 'width=1024,height=768,noopener,noreferrer')}
            title="Abrir menú cliente en ventana separada para monitor externo o tablet"
            className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Monitor size={14} />
            <span>Pantalla Cliente ↗</span>
          </button>
          <button
            onClick={copyCustomerLink}
            title="Copiar link del menú cliente para enviar a los clientes"
            className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-amber-700 hover:bg-amber-100 border border-amber-300'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>


        {/* Búsqueda global */}
        <div className="relative hidden xl:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            className="pl-8 pr-4 h-8 w-44 bg-surface-container-low border border-outline-variant rounded-lg focus:border-secondary-container focus:ring-1 focus:ring-secondary-container/40 outline-none text-xs text-on-surface transition-colors placeholder:text-outline"
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
