import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

export default function KitchenView() {
  return (
    <div className="flex-1 p-6 bg-background h-full min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-start h-full">
        
        {/* Urgent Card (Oldest) */}
        <div className="bg-surface-container-high border-2 border-error flex flex-col h-full min-h-[400px] max-h-[700px] rounded shadow-sm">
          <div className="bg-error text-on-error p-4 flex justify-between items-center">
            <span className="font-mono text-2xl font-bold">#1042</span>
            <span className="text-xl font-bold">12:45</span>
          </div>
          <div className="p-4 bg-surface-variant flex justify-between items-center border-b border-outline-variant">
            <span className="text-sm font-bold text-on-surface-variant">MESA</span>
            <span className="bg-[#ffb4ab] text-[#690005] font-bold px-2 py-1 text-xs rounded-sm flex items-center gap-1">
              <AlertTriangle size={14} /> PREPARANDO
            </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-start gap-4 border-b border-outline-variant pb-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">2x Smash Clásica</span>
                <span className="text-error font-bold text-xs bg-error-container px-2 py-0.5 mt-2 inline-block rounded">SIN CEBOLLA</span>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-outline-variant pb-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">1x Papas Grandes</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">1x Batido de Vainilla</span>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-secondary text-on-secondary text-xl p-6 hover:bg-[#803400] active:scale-[0.98] transition-transform font-bold min-h-[64px]">
            DESPACHAR
          </button>
        </div>

        {/* Regular Card (Preparing) */}
        <div className="bg-surface-container-high border border-outline-variant flex flex-col h-full min-h-[400px] max-h-[700px] rounded shadow-sm">
          <div className="bg-surface-container-highest text-on-surface p-4 flex justify-between items-center border-b border-outline-variant">
            <span className="font-mono text-2xl font-bold">#1044</span>
            <span className="text-xl font-bold text-outline">05:20</span>
          </div>
          <div className="p-4 bg-surface-variant flex justify-between items-center border-b border-outline-variant">
            <span className="text-sm font-bold text-on-surface-variant">PARA LLEVAR</span>
            <span className="bg-[#ffddb3] text-[#4d2700] font-bold px-2 py-1 text-xs rounded-sm flex items-center gap-1">
              <RefreshCw size={14} className="animate-spin-slow" /> PREPARANDO
            </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-start gap-4 border-b border-outline-variant pb-4">
              <input type="checkbox" defaultChecked className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight line-through text-outline">1x Bacon Deluxe</span>
              </div>
            </div>
            <div className="flex items-start gap-4 border-b border-outline-variant pb-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">1x Aros de Cebolla</span>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-secondary-container text-on-secondary-container text-xl p-6 hover:bg-secondary hover:text-on-secondary active:scale-[0.98] transition-colors font-bold min-h-[64px]">
            DESPACHAR
          </button>
        </div>

        {/* New Card (Received) */}
        <div className="bg-surface-container-high border border-outline-variant flex flex-col h-full min-h-[400px] max-h-[700px] rounded shadow-sm opacity-90">
          <div className="bg-surface-container-highest text-on-surface p-4 flex justify-between items-center border-b border-outline-variant">
            <span className="font-mono text-2xl font-bold">#1045</span>
            <span className="text-xl font-bold text-outline">01:15</span>
          </div>
          <div className="p-4 bg-surface-variant flex justify-between items-center border-b border-outline-variant">
            <span className="text-sm font-bold text-on-surface-variant">DELIVERY</span>
            <span className="bg-surface-dim text-on-surface-variant font-bold px-2 py-1 text-xs rounded-sm flex items-center gap-1">
              <Sparkles size={14} /> RECIBIDO
            </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-start gap-4 border-b border-outline-variant pb-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">3x Menú Infantil</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <input type="checkbox" className="w-6 h-6 mt-1 rounded cursor-pointer accent-secondary" />
              <div>
                <span className="text-lg font-bold block leading-tight">1x Hamburguesa Vegana</span>
                <span className="bg-surface-dim text-on-surface-variant px-2 py-0.5 mt-2 inline-block text-xs font-bold rounded">EXTRA PEPINILLOS</span>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-surface-variant text-on-surface-variant text-xl p-6 border-t border-outline-variant hover:bg-outline-variant active:scale-[0.98] transition-colors font-bold min-h-[64px]">
            INICIAR
          </button>
        </div>

      </div>
    </div>
  );
}
