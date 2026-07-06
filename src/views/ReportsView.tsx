import { ReceiptText, Filter, Download, TrendingUp, TrendingDown, Timer, MoreVertical, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ReportsView() {
  return (
    <div className="p-8 flex-1 flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
      {/* Page Header & Global Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Gestión de Datos</h2>
          <p className="text-base text-on-surface-variant mt-2">Vista completa de la tabla 'PEDIDO' y analíticas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 bg-surface-container border border-outline-variant p-1 rounded">
            <button className="px-3 py-1.5 text-sm font-bold text-on-surface bg-surface shadow-sm rounded">Hoy</button>
            <button className="px-3 py-1.5 text-sm font-bold text-on-surface-variant hover:bg-surface-variant rounded transition-colors">7D</button>
            <button className="px-3 py-1.5 text-sm font-bold text-on-surface-variant hover:bg-surface-variant rounded transition-colors">30D</button>
          </div>
          <button className="h-10 px-4 flex items-center gap-2 bg-surface border border-outline-variant text-primary text-sm font-bold rounded hover:bg-surface-variant transition-colors">
            <Filter size={18} />
            Filtros
          </button>
          <button className="h-10 px-4 flex items-center gap-2 bg-primary text-on-primary text-sm font-bold rounded hover:bg-primary-fixed-dim hover:text-primary transition-colors">
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards (Bento style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-surface p-6 border border-outline-variant rounded flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Total Pedidos</span>
            <ReceiptText className="text-secondary" />
          </div>
          <div>
            <span className="text-5xl font-black text-primary">1.248</span>
          </div>
          <div className="flex items-center gap-1 text-secondary text-xs font-bold">
            <TrendingUp size={16} />
            <span>+12.5% desde ayer</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface p-6 border border-outline-variant rounded flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Ingresos Brutos</span>
            <span className="font-bold text-secondary border border-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs">$</span>
          </div>
          <div>
            <span className="text-5xl font-black text-primary">$18.450</span>
          </div>
          <div className="flex items-center gap-1 text-secondary text-xs font-bold">
            <TrendingUp size={16} />
            <span>+8.2% desde ayer</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-highest p-6 border border-outline-variant rounded flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #fdf8f8 25%, #fdf8f8 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-sm font-bold text-primary uppercase tracking-wider">Tiempo Prom. Prep.</span>
            <Timer className="text-primary" />
          </div>
          <div className="relative z-10">
            <span className="text-5xl font-black text-primary">4m 12s</span>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-bold relative z-10">
            <TrendingDown size={16} />
            <span>-30s del objetivo</span>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-surface border border-outline-variant rounded flex flex-col flex-1 min-h-[500px]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="text-xl font-bold text-primary">Tabla: PEDIDO (Datos en Vivo)</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input 
                type="text" 
                placeholder="ID, Cliente..." 
                className="pl-9 pr-3 h-9 w-48 bg-surface border border-outline-variant rounded focus:border-primary outline-none text-sm"
              />
            </div>
            <select className="h-9 bg-surface border border-outline-variant rounded px-3 text-sm text-primary outline-none focus:border-primary font-semibold">
              <option>Todos los Estados</option>
              <option>Preparando</option>
              <option>Listo</option>
              <option>Completado</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container border-b border-outline-variant sticky top-0 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <tr>
                <th className="p-4">ID Pedido</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Artículos</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-primary divide-y divide-outline-variant/50">
              
              {/* Row 1 (Urgent) */}
              <tr className="hover:bg-surface-variant transition-colors bg-error-container/20">
                <td className="p-4 font-mono font-bold">#ORD-9921</td>
                <td className="p-4 text-on-surface-variant">14:02:45</td>
                <td className="p-4 font-bold">Sarah Jenkins</td>
                <td className="p-4">2x Clásica, 1x Papas</td>
                <td className="p-4 font-mono">$24.50</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-wider rounded">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    Urgente
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><MoreVertical size={18} /></button>
                </td>
              </tr>

              {/* Row 2 (Preparing) */}
              <tr className="hover:bg-surface-variant transition-colors">
                <td className="p-4 font-mono font-bold">#ORD-9922</td>
                <td className="p-4 text-on-surface-variant">14:05:12</td>
                <td className="p-4 font-bold">Mike T.</td>
                <td className="p-4">1x Doble, 1x Batido</td>
                <td className="p-4 font-mono">$18.00</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fbbf24] text-black text-[10px] font-black uppercase tracking-wider rounded">
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                    Prep
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><MoreVertical size={18} /></button>
                </td>
              </tr>

              {/* Row 3 (Ready) */}
              <tr className="hover:bg-surface-variant transition-colors">
                <td className="p-4 font-mono font-bold">#ORD-9923</td>
                <td className="p-4 text-on-surface-variant">14:08:33</td>
                <td className="p-4 font-bold">En local</td>
                <td className="p-4">3x Papas, 3x Refrescos</td>
                <td className="p-4 font-mono">$15.00</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-[#10b981] text-white text-[10px] font-black uppercase tracking-wider rounded">
                    Listo
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><MoreVertical size={18} /></button>
                </td>
              </tr>

              {/* Row 4 (Completed) */}
              <tr className="hover:bg-surface-variant transition-colors opacity-70">
                <td className="p-4 font-mono font-bold">#ORD-9919</td>
                <td className="p-4 text-on-surface-variant">13:45:00</td>
                <td className="p-4 font-bold">Uber Eats #A1</td>
                <td className="p-4">1x Hamb. Vegana</td>
                <td className="p-4 font-mono">$12.50</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-surface-dim text-on-surface-variant text-[10px] font-black uppercase tracking-wider rounded border border-outline-variant">
                    Hecho
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><MoreVertical size={18} /></button>
                </td>
              </tr>

              {/* Row 5 (Completed) */}
              <tr className="hover:bg-surface-variant transition-colors opacity-70">
                <td className="p-4 font-mono font-bold">#ORD-9918</td>
                <td className="p-4 text-on-surface-variant">13:42:10</td>
                <td className="p-4 font-bold">David K.</td>
                <td className="p-4">2x Clásica, 1x Aros de Cebolla</td>
                <td className="p-4 font-mono">$26.00</td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-surface-dim text-on-surface-variant text-[10px] font-black uppercase tracking-wider rounded border border-outline-variant">
                    Hecho
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><MoreVertical size={18} /></button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center mt-auto">
          <span className="text-sm text-on-surface-variant">Mostrando 1-5 de 1.248</span>
          <div className="flex gap-2">
            <button className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded bg-surface text-on-surface-variant hover:bg-surface-variant disabled:opacity-50" disabled>
              <ChevronLeft size={18} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center border border-primary bg-primary text-on-primary rounded text-sm font-bold">1</button>
            <button className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded bg-surface text-on-surface hover:bg-surface-variant text-sm font-bold">2</button>
            <button className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded bg-surface text-on-surface hover:bg-surface-variant text-sm font-bold">3</button>
            <span className="h-8 w-8 flex items-center justify-center text-on-surface-variant">...</span>
            <button className="h-8 w-8 flex items-center justify-center border border-outline-variant rounded bg-surface text-on-surface hover:bg-surface-variant">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>
      <div className="h-8 shrink-0"></div>
    </div>
  );
}
