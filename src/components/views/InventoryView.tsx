"use client";

import {
  AlertTriangle,
  Edit2,
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, type Insumo, type InsumoInput } from "../../api";
import { useToast } from "../ui/Toast";

type FormData = InsumoInput;

const FORM_INICIAL: FormData = {
  nombre_insumo: "",
  stock_actual: 0,
  unidad_medida: "kg",
  stock_minimo: 0,
  punto_reorden: 0,
  fk_id_categoria: 1
};

const UNIDADES = ["kg", "g", "L", "mL", "unidad", "paquete", "caja", "bolsa", "litro"];

// ── Modal ─────────────────────────────────────────────────────────────────────

function ModalItem({
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
              value={form.nombre_insumo}
              onChange={e => set("nombre_insumo", e.target.value)}
              className="industrial-input"
              placeholder="Ej. Carne de res"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Stock Actual <span className="text-error">*</span>
              </label>
              <input
                value={form.stock_actual}
                onChange={e => set("stock_actual", Number(e.target.value))}
                type="number"
                min="0"
                className="industrial-input"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Unidad
              </label>
              <select
                value={form.unidad_medida}
                onChange={e => set("unidad_medida", e.target.value)}
                className="industrial-input"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Stock Mínimo
              </label>
              <input
                value={form.stock_minimo}
                onChange={e => set("stock_minimo", Number(e.target.value))}
                type="number"
                min="0"
                className="industrial-input"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Punto de Reorden
              </label>
              <input
                value={form.punto_reorden}
                onChange={e => set("punto_reorden", Number(e.target.value))}
                type="number"
                min="0"
                className="industrial-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
              Categoría (ID) <span className="text-error">*</span>
            </label>
            <input
              value={form.fk_id_categoria}
              onChange={e => set("fk_id_categoria", Number(e.target.value))}
              type="number"
              min="1"
              className="industrial-input"
            />
          </div>
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
            disabled={guardando || !form.nombre_insumo.trim()}
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

export default function InventoryView() {
  const toast = useToast();

  const [items, setItems] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await api.getInventario();
      setItems(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEditar = (item: Insumo) => {
    setEditando(item);
    setForm({
      nombre_insumo: item.nombre_insumo,
      stock_actual: item.stock_actual,
      unidad_medida: item.unidad_medida,
      stock_minimo: item.stock_minimo,
      punto_reorden: item.punto_reorden,
      fk_id_categoria: item.fk_id_categoria
    });
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.nombre_insumo.trim()) return;
    setGuardando(true);

    try {
      if (editando) {
        const updated = await api.actualizarInsumo(editando.id_insumos, form);
        setItems(prev =>
          prev.map(i => (i.id_insumos === updated.id_insumos ? updated : i))
        );
      } else {
        const nuevo = await api.crearInsumo(form);
        setItems(prev => [...prev, nuevo]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      toast.showToast("error", e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    const aceptado = await toast.showConfirm({
      title: "¿Eliminar este ítem del inventario?",
      message: "Esta acción no se puede deshacer.",
      confirmLabel: "Sí, eliminar"
    });
    if (!aceptado) return;
    setEliminando(id);
    try {
      await api.eliminarInsumo(id);
      setItems(prev => prev.filter(i => i.id_insumos !== id));
    } catch (e: unknown) {
      toast.showToast("error", e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setEliminando(null);
    }
  };

  const stockBajoCount = items.filter(i => i.stock_actual <= i.stock_minimo).length;

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <Package size={30} /> Inventario
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Gestiona el stock de ingredientes y productos del restaurante.
          </p>
        </div>
        <div className="flex gap-3">
          {stockBajoCount > 0 && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container border border-error px-3 py-2 rounded text-sm font-bold">
              <AlertTriangle size={16} /> {stockBajoCount} ítem
              {stockBajoCount !== 1 ? "s" : ""} con stock bajo
            </div>
          )}
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            <Plus size={18} /> Agregar Ítem
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded flex items-center gap-3 border border-error text-sm">
          <AlertTriangle size={18} /> {error}
          <button onClick={cargar} className="ml-auto font-bold underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase bg-surface-container-highest border-b border-outline-variant">
                <th className="text-left p-4">Producto / Ingrediente</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Unidad</th>
                <th className="p-4">Stock Mín.</th>
                <th className="p-4">Punto Reorden</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-on-surface-variant">
                    <Loader2 size={24} className="animate-spin inline mr-2" /> Cargando
                    inventario...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-on-surface-variant">
                    No hay ítems en el inventario. Agrega el primero.
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const itemId = item.id_insumos;
                  const nombreItem = item.nombre_insumo;
                  const stockVal = item.stock_actual;
                  const minVal = item.stock_minimo;
                  const unidadVal = item.unidad_medida;
                  const reordenVal = item.punto_reorden;
                  const bajo = stockVal <= minVal;
                  return (
                    <tr
                      key={itemId}
                      className={`border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low transition-colors fade-in-up ${bajo ? "bg-error-container/10" : ""}`}
                    >
                      <td className="p-4 font-bold text-on-surface">{nombreItem}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-mono font-black text-xl ${bajo ? "text-error" : "text-primary"}`}
                        >
                          {stockVal}
                        </span>
                      </td>
                      <td className="p-4 text-center text-on-surface-variant text-sm">
                        {unidadVal}
                      </td>
                      <td className="p-4 text-center font-mono text-on-surface-variant">
                        {minVal}
                      </td>
                      <td className="p-4 text-center font-mono text-on-surface-variant">
                        {reordenVal}
                      </td>
                      <td className="p-4">
                        {bajo ? (
                          <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container text-xs font-bold px-2 py-1 rounded">
                            <AlertTriangle size={12} /> Stock Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded border border-emerald-200">
                            ✓ OK
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(item)}
                            className="text-on-surface-variant hover:text-secondary-container transition-colors p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => eliminar(itemId)}
                            disabled={eliminando === itemId}
                            className="text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-50"
                          >
                            {eliminando === itemId ? (
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
        <ModalItem
          titulo={editando ? "Editar Ítem" : "Nuevo Ítem de Inventario"}
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
