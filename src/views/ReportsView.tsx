import { useState, useEffect, useCallback } from 'react';
import {
  ReceiptText, Filter, Download, TrendingUp, TrendingDown,
  Timer, MoreVertical, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle,
} from 'lucide-react';
import { api, type Orden, type ResumenReporte } from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSegundos(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function BadgeEstatus({ estatus }: { estatus: string }) {
  const estilos: Record<string, string> = {
    Recibido: 'bg-surface-dim text-on-surface-variant border border-outline-variant',
    Preparando: 'bg-[#fbbf24] text-black',
    Listo: 'bg-[#10b981] text-white',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded ${estilos[estatus] ?? estilos['Recibido']}`}>
      {estatus === 'Preparando' && <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
      {estatus}
    </span>
  );
}

const ITEMS_POR_PAGINA = 10;

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function ReportsView() {
  const [resumen, setResumen] = useState<ResumenReporte | null>(null);
  const [pedidos, setPedidos] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoy');
  const [pagina, setPagina] = useState(1);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumenData, pedidosData] = await Promise.all([
        api.getResumen(),
        api.getPedidosReporte({ estado: filtroEstado || undefined, periodo: filtroPeriodo }),
      ]);
      setResumen(resumenData);
      setPedidos(pedidosData);
      setPagina(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroPeriodo]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const totalPaginas = Math.max(1, Math.ceil(pedidos.length / ITEMS_POR_PAGINA));
  const pedidosPagina = pedidos.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);

  const exportarCSV = () => {
    const filas = [
      ['ID Pedido', 'Hora', 'Cliente', 'Cédula', 'Teléfono', 'Tipo', 'Total', 'Estado'],
      ...pedidos.map((p) => [
        `#${p.id_pedido}`, p.hora_creacion, p.cliente_nombre,
        p.cliente_cedula ?? '', p.cliente_telefono ?? '',
        p.tipo, p.total.toFixed(2), p.Estatus_Orden,
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const KPICard = ({
    label, value, pct, icon: Icon, color,
  }: {
    label: string;
    value: string;
    pct: number | null;
    icon: typeof Timer;
    color: string;
  }) => (
    <div className={`bg-surface rounded-xl border-2 ${color} p-5 flex flex-col gap-3 card-shadow`}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
        <Icon size={20} className="text-on-surface-variant opacity-60" />
      </div>
      <span className="font-mono text-4xl font-black text-primary leading-none">{value}</span>
      {pct !== null && (
        <div className={`flex items-center gap-1 text-xs font-bold ${pct >= 0 ? 'text-emerald-600' : 'text-error'}`}>
          {pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {pct >= 0 ? '+' : ''}{pct}% desde ayer
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight">Gestión de Datos</h2>
          <p className="text-base text-on-surface-variant mt-2">
            Vista completa de la tabla PEDIDO y analíticas del sistema.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Período */}
          <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded-lg p-1">
            {(['hoy', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPeriodo(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  filtroPeriodo === p ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                {p === 'hoy' ? 'Hoy' : p === '7d' ? '7 días' : '30 días'}
              </button>
            ))}
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded font-bold text-sm text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <Filter size={16} /> Filtros
          </button>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded flex items-center gap-3 border border-error text-sm">
          <AlertTriangle size={18} /> {error}
          <button onClick={cargarDatos} className="ml-auto font-bold underline">Reintentar</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading || !resumen ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-xl border border-outline-variant p-5 h-36 animate-pulse" />
          ))
        ) : (
          <>
            <KPICard
              label="Total Pedidos"
              value={resumen.total_pedidos.toLocaleString()}
              pct={resumen.pct_cambio_pedidos}
              icon={ReceiptText}
              color="border-primary"
            />
            <KPICard
              label="Ingresos Brutos"
              value={`$${resumen.ingresos_brutos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              pct={resumen.pct_cambio_ingresos}
              icon={TrendingUp}
              color="border-secondary-container"
            />
            <KPICard
              label="Tiempo Prom. Preparación"
              value={formatSegundos(resumen.tiempo_promedio_seg)}
              pct={null}
              icon={Timer}
              color="border-outline-variant"
            />
          </>
        )}
      </div>

      {/* Tabla de pedidos */}
      <div className="flex flex-col flex-1 bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Barra de herramientas */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-outline-variant bg-surface-container-highest">
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <ReceiptText size={19} /> Tabla: PEDIDO
          </h3>
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="industrial-input h-9 w-auto px-3 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="Recibido">Recibido</option>
              <option value="Preparando">Preparando</option>
              <option value="Listo">Listo</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase border-b border-outline-variant bg-surface-container-high">
                <th className="text-left p-4">ID Pedido</th>
                <th className="text-left p-4">Hora</th>
                <th className="text-left p-4">Cliente</th>
                <th className="p-4">Tipo</th>
                <th className="text-right p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-on-surface-variant">
                    <Loader2 size={24} className="animate-spin inline mr-2" /> Cargando...
                  </td>
                </tr>
              ) : pedidosPagina.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-on-surface-variant">
                    No se encontraron pedidos con ese filtro.
                  </td>
                </tr>
              ) : (
                pedidosPagina.map((p) => (
                  <tr
                    key={p.id_pedido}
                    className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low transition-colors fade-in-up"
                  >
                    <td className="p-4 font-mono font-black text-primary">#{p.id_pedido}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{p.hora_creacion}</td>
                    <td className="p-4 font-bold text-on-surface">{p.cliente_nombre}</td>
                    <td className="p-4 text-center capitalize text-sm text-on-surface-variant">{p.tipo}</td>
                    <td className="p-4 text-right font-mono font-bold text-secondary-container">${p.total.toFixed(2)}</td>
                    <td className="p-4"><BadgeEstatus estatus={p.Estatus_Orden} /></td>
                    <td className="p-4 text-right">
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-4 flex justify-between items-center border-t border-outline-variant bg-surface-container-highest">
          <span className="text-sm text-on-surface-variant">
            {pedidos.length > 0
              ? `Mostrando ${(pagina - 1) * ITEMS_POR_PAGINA + 1}–${Math.min(pagina * ITEMS_POR_PAGINA, pedidos.length)} de ${pedidos.length}`
              : '0 resultados'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-variant transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`w-8 h-8 flex items-center justify-center border rounded text-xs font-bold transition-colors ${
                  pagina === n
                    ? 'bg-primary text-on-primary border-primary'
                    : 'border-outline-variant hover:bg-surface-variant'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface-variant transition-colors disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="h-4 shrink-0" />
    </div>
  );
}
