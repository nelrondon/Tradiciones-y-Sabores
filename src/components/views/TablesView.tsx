"use client";

import {
  AlertTriangle,
  Armchair,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Users,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type EstadoMesa, type Mesa, type MesaInput } from "../../api";
import { useToast } from "../ui/Toast";

// ── Constantes ────────────────────────────────────────────────────────────────

interface EstadoConfig {
  id: EstadoMesa;
  label: string;
  /** Punto de color del badge. */
  dot: string;
  /** Badge y botón activo del selector de estado. */
  chip: string;
}

const ESTADOS: EstadoConfig[] = [
  {
    id: "disponible",
    label: "Disponible",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-300"
  },
  {
    id: "ocupada",
    label: "Ocupada",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-300"
  },
  {
    id: "reservada",
    label: "Reservada",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 border-sky-300"
  },
  {
    id: "fuera_de_servicio",
    label: "Fuera de servicio",
    dot: "bg-neutral-400",
    chip: "bg-neutral-100 text-neutral-600 border-neutral-400"
  }
];

const configEstado = (estado: EstadoMesa): EstadoConfig =>
  ESTADOS.find(e => e.id === estado) ?? ESTADOS[3];

const FORM_INICIAL: MesaInput = {
  capacidad: 4,
  estado: "disponible",
  ubicacion: ""
};

// ── Modal de creación ─────────────────────────────────────────────────────────

function ModalMesa({
  form,
  setForm,
  onClose,
  onGuardar,
  guardando
}: {
  form: MesaInput;
  setForm: (f: MesaInput) => void;
  onClose: () => void;
  onGuardar: () => void;
  guardando: boolean;
}) {
  const set = <K extends keyof MesaInput>(k: K, v: MesaInput[K]) =>
    setForm({ ...form, [k]: v });

  const valido = form.ubicacion.trim() !== "" && Number(form.capacidad) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-surface w-full max-w-md rounded-xl border border-outline-variant shadow-2xl fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="text-base font-black text-primary uppercase tracking-wide">
            Nueva Mesa
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
              Ubicación <span className="text-error">*</span>
            </label>
            <input
              value={form.ubicacion}
              onChange={e => set("ubicacion", e.target.value)}
              className="industrial-input"
              placeholder="Ej. Terraza, Salón principal, Barra"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Capacidad <span className="text-error">*</span>
              </label>
              <input
                value={form.capacidad}
                onChange={e => set("capacidad", Number(e.target.value))}
                type="number"
                min="1"
                step="1"
                className="industrial-input"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Estado inicial
              </label>
              <select
                value={form.estado}
                onChange={e => set("estado", e.target.value as EstadoMesa)}
                className="industrial-input"
              >
                {ESTADOS.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {Number(form.capacidad) <= 0 && (
            <p className="text-xs text-on-surface-variant">
              La capacidad debe ser un entero mayor a 0.
            </p>
          )}

          <p className="text-xs text-on-surface-variant">
            El número de la mesa lo asigna la base de datos al crearla.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 flex gap-3 justify-end border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-4 h-10 text-sm font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={guardando || !valido}
            className="px-6 h-10 text-sm font-bold bg-primary text-on-primary rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {guardando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function TablesView() {
  const { showToast, showConfirm } = useToast();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MesaInput>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  /** id_mesa de la mesa cuyo estado se está guardando. */
  const [actualizando, setActualizando] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<EstadoMesa | "todas">("todas");

  const cargar = useCallback(async () => {
    try {
      const data = await api.getMesas();
      setMesas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando las mesas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const abrirNueva = () => {
    setForm(FORM_INICIAL);
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.ubicacion.trim() || Number(form.capacidad) <= 0) return;
    setGuardando(true);
    try {
      const nueva = await api.crearMesa({
        capacidad: Number(form.capacidad),
        estado: form.estado,
        ubicacion: form.ubicacion.trim()
      });
      setMesas(prev => [...prev, nueva]);
      setShowModal(false);
      showToast(
        "success",
        "Mesa creada",
        `Mesa ${nueva.id_mesa} — ${nueva.ubicacion} (${nueva.capacidad} personas).`
      );
    } catch (e: unknown) {
      showToast(
        "error",
        "No se pudo crear la mesa",
        e instanceof Error ? e.message : undefined
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (mesa: Mesa, estado: EstadoMesa) => {
    if (mesa.estado === estado || actualizando !== null) return;
    setActualizando(mesa.id_mesa);
    try {
      const actualizada = await api.actualizarEstadoMesa(mesa.id_mesa, estado);
      // La API puede no devolver la mesa completa: se conserva lo que ya se tenía.
      setMesas(prev =>
        prev.map(m =>
          m.id_mesa === mesa.id_mesa ? { ...m, ...(actualizada ?? {}), estado } : m
        )
      );
      showToast(
        "success",
        `Mesa ${mesa.id_mesa} actualizada`,
        `Ahora está marcada como "${configEstado(estado).label}".`
      );
    } catch (e: unknown) {
      showToast(
        "error",
        "No se pudo cambiar el estado",
        e instanceof Error ? e.message : undefined
      );
    } finally {
      setActualizando(null);
    }
  };

  const eliminar = async (mesa: Mesa) => {
    const aceptado = await showConfirm({
      title: `¿Eliminar la mesa ${mesa.id_mesa}?`,
      message: `${mesa.ubicacion} · ${mesa.capacidad} personas. Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar"
    });
    if (!aceptado) return;
    setEliminando(mesa.id_mesa);
    try {
      await api.eliminarMesa(mesa.id_mesa);
      setMesas(prev => prev.filter(m => m.id_mesa !== mesa.id_mesa));
      showToast("success", "Mesa eliminada", `La mesa ${mesa.id_mesa} ya no existe.`);
    } catch (e: unknown) {
      showToast(
        "error",
        "No se pudo eliminar la mesa",
        e instanceof Error ? e.message : undefined
      );
    } finally {
      setEliminando(null);
    }
  };

  const ordenadas = useMemo(
    () => [...mesas].sort((a, b) => a.id_mesa - b.id_mesa),
    [mesas]
  );

  const visibles = useMemo(
    () => (filtro === "todas" ? ordenadas : ordenadas.filter(m => m.estado === filtro)),
    [ordenadas, filtro]
  );

  const conteo = (id: EstadoMesa | "todas") =>
    id === "todas" ? mesas.length : mesas.filter(m => m.estado === id).length;

  const puestos = ordenadas.reduce((s, m) => s + (Number(m.capacidad) || 0), 0);

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <Armchair size={30} /> Mesas
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Administra las mesas del salón y su disponibilidad en tiempo real.
          </p>
        </div>
        <button
          onClick={abrirNueva}
          className="flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Agregar Mesa
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded flex items-center gap-3 border border-error text-sm">
          <AlertTriangle size={18} /> {error}
          <button onClick={cargar} className="ml-auto font-bold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Filtro por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: "todas" as const, label: "Todas" }, ...ESTADOS].map(e => {
          const activo = filtro === e.id;
          return (
            <button
              key={e.id}
              onClick={() => setFiltro(e.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors ${
                activo
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              {e.label} ({conteo(e.id)})
            </button>
          );
        })}
        {!loading && mesas.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-on-surface-variant">
            {mesas.length} mesas · {puestos} puestos en total
          </span>
        )}
      </div>

      {/* Grid de mesas */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-on-surface-variant">
          <Loader2 size={24} className="animate-spin" /> Cargando mesas...
        </div>
      ) : visibles.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-xl p-12 text-center text-on-surface-variant">
          {mesas.length === 0
            ? "No hay mesas registradas. Agrega la primera."
            : `No hay mesas en estado "${configEstado(filtro as EstadoMesa).label}".`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibles.map(mesa => {
            const cfg = configEstado(mesa.estado);
            const ocupada = actualizando === mesa.id_mesa;
            return (
              <div
                key={mesa.id_mesa}
                className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow fade-in-up"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-on-surface leading-none">
                      Mesa {mesa.id_mesa}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="shrink-0" />
                        {mesa.ubicacion || "Sin ubicación"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="shrink-0" />
                        {mesa.capacidad} personas
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded border ${cfg.chip}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => eliminar(mesa)}
                      disabled={eliminando === mesa.id_mesa}
                      title="Eliminar mesa"
                      className="text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-50"
                    >
                      {eliminando === mesa.id_mesa ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Selector de estado */}
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1.5">
                    Cambiar estado
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ESTADOS.map(e => {
                      const activo = mesa.estado === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => cambiarEstado(mesa, e.id)}
                          disabled={ocupada || activo}
                          className={`h-9 px-2 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-colors flex items-center justify-center gap-1.5 disabled:cursor-default ${
                            activo
                              ? e.chip
                              : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant disabled:opacity-50"
                          }`}
                        >
                          {ocupada && !activo ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                          )}
                          {e.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ModalMesa
          form={form}
          setForm={setForm}
          onClose={() => setShowModal(false)}
          onGuardar={guardar}
          guardando={guardando}
        />
      )}
    </div>
  );
}
