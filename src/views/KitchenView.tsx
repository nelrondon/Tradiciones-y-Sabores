import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Loader2, Clock, Volume2, VolumeX } from 'lucide-react';
import { api, type Orden, type EstatusOrden } from '../api';
import { useToast } from '../components/Toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function minutosDesde(horaISO: string): number {
  const ahora = Date.now();
  const inicio = new Date(horaISO).getTime();
  if (isNaN(inicio)) return 0;
  return Math.floor((ahora - inicio) / 60000);
}

function formatMinutos(mins: number): string {
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

// ── Sonido de notificación (Web Audio API) ────────────────────────────────────

function sonarNotificacion() {
  try {
    const ctx = new AudioContext();
    const notas = [523, 659, 784]; // Do, Mi, Sol
    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch {
    // Silenciar si el navegador no soporta Web Audio API
  }
}

// ── Modal de confirmación ─────────────────────────────────────────────────────

function ModalConfirmar({
  orden,
  onConfirmar,
  onCancelar,
  cargando,
}: {
  orden: Orden;
  onConfirmar: () => void;
  onCancelar: () => void;
  cargando: boolean;
}) {
  const esDespachar = orden.Estatus_Orden === 'Preparando';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-surface w-full max-w-sm rounded-xl border border-outline-variant shadow-2xl fade-in-up">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            esDespachar ? 'bg-emerald-100' : 'bg-secondary-container/20'
          }`}>
            {esDespachar
              ? <CheckCircle size={28} className="text-emerald-600" />
              : <Clock size={28} className="text-secondary-container" />}
          </div>
          <h3 className="text-lg font-black text-primary uppercase tracking-wide">
            {esDespachar ? '¿Despachar orden?' : '¿Iniciar preparación?'}
          </h3>
          <div className="mt-3 space-y-1">
            <p className="text-base font-bold text-on-surface">
              Pedido <span className="font-mono text-secondary-container">#{orden.id_pedido}</span>
            </p>
            <p className="text-sm text-on-surface-variant">{orden.cliente_nombre}</p>
            {orden.tipo === 'mesa' && orden.mesa && (
              <p className="text-sm font-bold text-on-surface">
                🪑 Mesa <span className="text-2xl font-black text-primary">{orden.mesa}</span>
              </p>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mt-3">
            {esDespachar
              ? 'Esto marcará la orden como lista para entregar al cliente.'
              : 'Esto moverá la orden a la pantalla de preparación.'}
          </p>
        </div>
        <div className="flex gap-3 p-5 border-t border-outline-variant">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 h-10 text-sm font-bold border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors text-on-surface-variant"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={`flex-1 h-10 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${
              esDespachar
                ? 'bg-emerald-600 text-white hover:opacity-90'
                : 'bg-secondary-container text-on-secondary-container hover:opacity-90'
            }`}
          >
            {cargando
              ? <Loader2 size={16} className="animate-spin" />
              : esDespachar ? '✓ Confirmar despacho' : '▶ Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de Orden ──────────────────────────────────────────────────────────

function TarjetaOrden({
  orden,
  onCambiarEstatus,
}: {
  key?: number | string;
  orden: Orden;
  onCambiarEstatus: (id: number, estatus: EstatusOrden) => Promise<void>;
}) {
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mins, setMins] = useState(minutosDesde(orden.hora_creacion));
  const urgente = orden.Estatus_Orden === 'Preparando' && mins >= 10;
  const esListo = orden.Estatus_Orden === 'Listo';

  useEffect(() => {
    const id = setInterval(() => setMins(minutosDesde(orden.hora_creacion)), 30_000);
    return () => clearInterval(id);
  }, [orden.hora_creacion]);

  const handleConfirmar = async () => {
    const siguiente: EstatusOrden =
      orden.Estatus_Orden === 'Recibido' ? 'Preparando' : 'Listo';
    setCargando(true);
    try {
      await onCambiarEstatus(orden.id_pedido, siguiente);
      setMostrarModal(false);
    } finally {
      setCargando(false);
    }
  };

  const tipoLabel =
    orden.tipo === 'mesa' ? `Mesa` :
    orden.tipo === 'pickup' ? '🛍️ Para Llevar' : '🛵 Delivery';

  const colorBorde =
    urgente ? 'border-error pulse-red' :
    esListo ? 'border-emerald-400' : 'border-outline-variant';

  const colorHeader =
    urgente ? 'bg-error-container' :
    esListo ? 'bg-emerald-50' : 'bg-surface-container-highest';

  return (
    <>
      <div
        className={`bg-surface border-2 ${colorBorde} rounded-xl overflow-hidden flex flex-col min-h-[380px] max-h-[680px] shadow-sm fade-in-up`}
      >
        {/* Encabezado */}
        <div className={`p-4 flex justify-between items-center ${colorHeader} shrink-0`}>
          <div>
            <span className="font-mono text-2xl font-black text-primary">
              #{orden.id_pedido}
            </span>
            {orden.tipo === 'mesa' && orden.mesa ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm font-semibold text-on-surface-variant">🪑 {tipoLabel}</span>
                <span className="bg-primary text-on-primary text-xl font-black px-2 py-0.5 rounded leading-tight">
                  {orden.mesa}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-on-surface-variant mt-0.5">{tipoLabel}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <Clock size={15} className={urgente ? 'text-error' : ''} />
            <span className={`font-mono text-xl font-black ${urgente ? 'text-error' : 'text-on-surface'}`}>
              {formatMinutos(mins)}
            </span>
          </div>
        </div>

        {/* Nombre del cliente */}
        <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant text-sm font-bold text-on-surface shrink-0">
          {orden.cliente_nombre}
          {orden.cliente_telefono && (
            <span className="ml-2 font-normal text-on-surface-variant font-mono text-xs">{orden.cliente_telefono}</span>
          )}
        </div>

        {/* Ítems */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {orden.items.map((item, i) => (
            <div key={i} className="border-b border-surface-dim last:border-0 pb-3 last:pb-0">
              <span className="text-xl font-black text-on-surface leading-tight block">
                {item.cantidad}× {item.nombre}
              </span>
              {item.notas && (
                <span className="mt-1 text-xs font-bold text-error bg-error-container px-2 py-0.5 rounded inline-block uppercase tracking-wide">
                  ⚠ {item.notas}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Botón de acción */}
        {!esListo ? (
          <button
            onClick={() => setMostrarModal(true)}
            className={`w-full p-4 text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors shrink-0 ${
              orden.Estatus_Orden === 'Recibido'
                ? 'bg-primary text-on-primary hover:bg-secondary'
                : 'bg-secondary-container text-on-secondary-container hover:opacity-90'
            }`}
          >
            {orden.Estatus_Orden === 'Recibido'
              ? '▶ Iniciar preparación'
              : '✓ Despachar'}
          </button>
        ) : (
          <div className="w-full p-4 bg-emerald-50 border-t border-emerald-200 text-center text-sm font-black text-emerald-700 uppercase tracking-widest shrink-0 flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Listo para entregar
          </div>
        )}
      </div>

      {mostrarModal && (
        <ModalConfirmar
          orden={orden}
          onConfirmar={handleConfirmar}
          onCancelar={() => setMostrarModal(false)}
          cargando={cargando}
        />
      )}
    </>
  );
}

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function KitchenView() {
  const { showToast } = useToast();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sonidoActivado, setSonidoActivado] = useState(true);
  const prevCountRef = useRef(0);

  const cargarOrdenes = useCallback(async () => {
    try {
      const data = await api.getOrdenesActivas();

      // Detectar órdenes nuevas y reproducir sonido
      if (data.length > prevCountRef.current && prevCountRef.current > 0 && sonidoActivado) {
        sonarNotificacion();
        showToast('info', '🔔 Nueva orden en cocina', `Hay ${data.length} órdenes activas`);
      }
      prevCountRef.current = data.length;

      setOrdenes(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [sonidoActivado, showToast]);

  useEffect(() => {
    cargarOrdenes();
    const intervalo = setInterval(cargarOrdenes, 30_000);
    return () => clearInterval(intervalo);
  }, [cargarOrdenes]);

  const handleCambiarEstatus = async (id: number, estatus: EstatusOrden) => {
    await api.updateEstatus(id, estatus);
    const orden = ordenes.find(o => o.id_pedido === id);
    if (estatus === 'Listo' && orden) {
      showToast('success', `✓ Orden #${id} lista para entregar`, orden.cliente_nombre);
    }
    await cargarOrdenes();
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <Loader2 size={32} className="animate-spin text-secondary-container" />
      </div>
    );

  if (error)
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <div className="bg-error-container text-on-error-container p-8 rounded-xl text-center flex flex-col gap-4 max-w-sm w-full">
          <AlertTriangle size={40} className="mx-auto" />
          <h2 className="text-2xl font-black uppercase">Error de Conexión</h2>
          <p className="text-sm">{error}</p>
          <button onClick={cargarOrdenes} className="bg-error text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition">
            Reintentar
          </button>
        </div>
      </div>
    );

  if (ordenes.length === 0)
    return (
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <div className="text-center flex flex-col gap-4 items-center text-on-surface-variant">
          <CheckCircle size={64} className="text-emerald-500 opacity-60" />
          <h2 className="text-2xl font-black text-primary uppercase">¡Cocina Despejada!</h2>
          <p className="text-base">No hay órdenes activas en este momento.</p>
          <button onClick={cargarOrdenes}
            className="flex items-center gap-2 text-sm font-bold text-on-surface-variant border border-outline-variant px-4 py-2 rounded hover:bg-surface-variant transition-colors">
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex-1 p-6 min-h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-primary uppercase">
          Panel de Cocina —{' '}
          <span className="text-secondary-container">{ordenes.length}</span>{' '}
          orden{ordenes.length !== 1 ? 'es' : ''} activa{ordenes.length !== 1 ? 's' : ''}
        </h2>
        <div className="flex items-center gap-2">
          {/* Toggle sonido */}
          <button
            onClick={() => setSonidoActivado(prev => !prev)}
            className={`flex items-center gap-2 text-sm font-bold border px-3 py-2 rounded-lg transition-colors ${
              sonidoActivado
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant'
            }`}
            title={sonidoActivado ? 'Silenciar notificaciones' : 'Activar sonido'}
          >
            {sonidoActivado ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="hidden md:inline">{sonidoActivado ? 'Sonido ON' : 'Silencio'}</span>
          </button>
          <button
            onClick={cargarOrdenes}
            className="flex items-center gap-2 text-sm font-bold text-on-surface-variant border border-outline-variant px-4 py-2 rounded hover:bg-surface-variant transition-colors"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 items-start">
        {ordenes.map((orden) => (
          <TarjetaOrden
            key={orden.id_pedido}
            orden={orden}
            onCambiarEstatus={handleCambiarEstatus}
          />
        ))}
      </div>
    </div>
  );
}
