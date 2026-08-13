"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Save
} from "lucide-react";
import { api, type Producto, type CategoriaPlato } from "../../api";
import { useToast } from "../ui/Toast";

interface FormData {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaPlato;
}

const FORM_INICIAL: FormData = {
  nombre: "",
  descripcion: "",
  precio: 0,
  categoria: "entrada"
};

/** Categorías válidas según la API (POST /platos) */
const CATEGORIAS: { id: string; label: string }[] = [
  { id: "entrada", label: "Entrada" },
  { id: "plato_principal", label: "Plato Principal" },
  { id: "postre", label: "Postre" },
  { id: "bebida", label: "Bebida" },
  { id: "acompañante", label: "Acompañante" }
];

const labelCategoria = (c: string): string =>
  CATEGORIAS.find(x => x.id === c)?.label ?? c;

// ── Modal ─────────────────────────────────────────────────────────────────────

function ModalPlato({
  titulo,
  form,
  setForm,
  onClose,
  onGuardar,
  guardando
}: {
  titulo: string;
  form: FormData;
  setForm: (f: FormData) => void;
  onClose: () => void;
  onGuardar: () => void;
  guardando: boolean;
}) {
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm({ ...form, [k]: v });

  const valido =
    form.nombre.trim() !== "" &&
    form.descripcion.trim() !== "" &&
    Number(form.precio) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-surface w-full max-w-md rounded-xl border border-outline-variant shadow-2xl fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="text-base font-black text-primary uppercase tracking-wide">
            {titulo}
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
              Nombre <span className="text-error">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              className="industrial-input"
              placeholder="Ej. Ceviche de camarón"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
              Descripción <span className="text-error">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={e => set("descripcion", e.target.value)}
              rows={3}
              className="industrial-input resize-none"
              placeholder="Ej. Camarones frescos marinados en limón, cebolla morada y cilantro"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Precio ($) <span className="text-error">*</span>
              </label>
              <input
                value={form.precio}
                onChange={e => set("precio", Number(e.target.value))}
                type="number"
                min="0"
                step="0.01"
                className="industrial-input"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Categoría <span className="text-error">*</span>
              </label>
              <select
                value={form.categoria}
                onChange={e => set("categoria", e.target.value)}
                className="industrial-input"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {Number(form.precio) <= 0 && (
            <p className="text-xs text-on-surface-variant">
              El precio debe ser mayor a 0.
            </p>
          )}
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

export default function PlatesView() {
  const { showToast } = useToast();
  const [platos, setPlatos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<string>("todos");

  const cargar = useCallback(async () => {
    try {
      const data = await api.getPlatos();
      setPlatos(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando platos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setForm(FORM_INICIAL);
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.descripcion.trim() || Number(form.precio) <= 0)
      return;
    setGuardando(true);
    try {
      const nuevo = await api.crearPlato({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        categoria: form.categoria
      });
      setPlatos(prev => [...prev, nuevo]);
      setShowModal(false);
      showToast("success", "Plato creado", `${nuevo.nombre} ya está en el menú.`);
    } catch (e: unknown) {
      showToast(
        "error",
        "No se pudo crear el plato",
        e instanceof Error ? e.message : undefined
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" del menú? Esta acción no se puede deshacer.`))
      return;
    setEliminando(id);
    try {
      await api.deletePlato(id);
      setPlatos(prev => prev.filter(p => (p.id_plato ?? p.id_producto) !== id));
      showToast("success", "Plato eliminado", `${nombre} ya no está en el menú.`);
    } catch (e: unknown) {
      showToast(
        "error",
        "No se pudo eliminar el plato",
        e instanceof Error ? e.message : undefined
      );
    } finally {
      setEliminando(null);
    }
  };

  const visibles = useMemo(
    () => (filtro === "todos" ? platos : platos.filter(p => p.categoria === filtro)),
    [platos, filtro]
  );

  const conteo = (id: string) =>
    id === "todos" ? platos.length : platos.filter(p => p.categoria === id).length;

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <UtensilsCrossed size={30} /> Platos
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Administra los platos del menú del restaurante.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Agregar Plato
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

      {/* Filtro por categoría */}
      <div className="flex flex-wrap gap-2">
        {[{ id: "todos", label: "Todos" }, ...CATEGORIAS].map(c => {
          const activo = filtro === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFiltro(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-colors ${
                activo
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              {c.label} ({conteo(c.id)})
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase bg-surface-container-highest border-b border-outline-variant">
                <th className="text-left p-4">Plato</th>
                <th className="text-left p-4">Descripción</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Disponible</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                    <Loader2 size={24} className="animate-spin inline mr-2" /> Cargando
                    platos...
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-on-surface-variant">
                    {platos.length === 0
                      ? "No hay platos registrados. Agrega el primero."
                      : `No hay platos en la categoría "${labelCategoria(filtro)}".`}
                  </td>
                </tr>
              ) : (
                visibles.map((plato, idx) => {
                  const platoId = plato.id_plato ?? plato.id_producto ?? idx + 1;
                  return (
                    <tr
                      key={platoId}
                      className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low transition-colors fade-in-up"
                    >
                      <td className="p-4 font-bold text-on-surface">{plato.nombre}</td>
                      <td className="p-4 text-sm text-on-surface-variant max-w-md">
                        {plato.descripcion || <span className="text-outline">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-surface-container-highest text-on-surface-variant text-xs font-bold px-2 py-1 rounded">
                          {labelCategoria(String(plato.categoria))}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-black text-lg text-primary">
                        ${Number(plato.precio ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {plato.disponible ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded border border-emerald-200">
                            ✓ Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container text-xs font-bold px-2 py-1 rounded">
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => eliminar(platoId, plato.nombre)}
                            disabled={eliminando === platoId}
                            title="Eliminar plato"
                            className="text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-50"
                          >
                            {eliminando === platoId ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalPlato
          titulo="Nuevo Plato"
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
