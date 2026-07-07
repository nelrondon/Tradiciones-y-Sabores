import { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Edit2, Trash2, Loader2, AlertTriangle, X, Save } from 'lucide-react';
import { api, type Proveedor } from '../api';

type FormData = Omit<Proveedor, 'id_proveedor'>;

const FORM_INICIAL: FormData = {
  nombre: '',
  rif: '',
  contacto: '',
  telefono: '',
  email: '',
};

// ── Modal ─────────────────────────────────────────────────────────────────────

function ModalProveedor({
  titulo, form, setForm, onClose, onGuardar, guardando,
}: {
  titulo: string;
  form: FormData;
  setForm: (f: FormData) => void;
  onClose: () => void;
  onGuardar: () => void;
  guardando: boolean;
}) {
  const set = (k: keyof FormData, v: string) => setForm({ ...form, [k]: v });
  const esValido = form.nombre.trim() && form.rif.trim() && form.telefono.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-surface w-full max-w-md rounded-xl border border-outline-variant shadow-2xl fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="text-base font-black text-primary uppercase tracking-wide">{titulo}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
              Nombre del Proveedor <span className="text-error">*</span>
            </label>
            <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              className="industrial-input" placeholder="Ej. Distribuidora La Central" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                RIF <span className="text-error">*</span>
              </label>
              <input value={form.rif} onChange={(e) => set('rif', e.target.value)}
                className="industrial-input" placeholder="J-12345678-0" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">Contacto</label>
              <input value={form.contacto} onChange={(e) => set('contacto', e.target.value)}
                className="industrial-input" placeholder="Carlos López" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">
                Teléfono <span className="text-error">*</span>
              </label>
              <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                type="tel" className="industrial-input" placeholder="0414-0000000" />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block">Email</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)}
                type="email" className="industrial-input" placeholder="ventas@empresa.com" />
            </div>
          </div>
        </div>
        <div className="p-5 flex gap-3 justify-end border-t border-outline-variant">
          <button onClick={onClose}
            className="px-4 h-10 text-sm font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors">
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={guardando || !esValido}
            className="px-6 h-10 text-sm font-bold bg-primary text-on-primary rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-40">
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vista Principal ───────────────────────────────────────────────────────────

export default function SuppliersView() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await api.getProveedores();
      setProveedores(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error cargando proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setEditando(null); setForm(FORM_INICIAL); setShowModal(true); };
  const abrirEditar = (p: Proveedor) => {
    setEditando(p);
    setForm({ nombre: p.nombre, rif: p.rif, contacto: p.contacto, telefono: p.telefono, email: p.email ?? '' });
    setShowModal(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (editando) {
        const updated = await api.updateProveedor(editando.id_proveedor, form);
        setProveedores((prev) => prev.map((p) => p.id_proveedor === updated.id_proveedor ? updated : p));
      } else {
        const nuevo = await api.crearProveedor(form);
        setProveedores((prev) => [...prev, nuevo]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este proveedor? Esta acción no se puede deshacer.')) return;
    setEliminando(id);
    try {
      await api.deleteProveedor(id);
      setProveedores((prev) => prev.filter((p) => p.id_proveedor !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="p-8 flex-1 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-outline-variant">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
            <Truck size={30} /> Proveedores
          </h2>
          <p className="text-base text-on-surface-variant mt-2">
            Directorio de proveedores. Gestiona contactos y datos fiscales.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Agregar Proveedor
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded flex items-center gap-3 border border-error text-sm">
          <AlertTriangle size={18} /> {error}
          <button onClick={cargar} className="ml-auto font-bold underline">Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="text-xs text-on-surface-variant uppercase bg-surface-container-highest border-b border-outline-variant">
                <th className="text-left p-4">Nombre / Empresa</th>
                <th className="p-4">RIF</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-on-surface-variant">
                  <Loader2 size={24} className="animate-spin inline mr-2" /> Cargando proveedores...
                </td></tr>
              ) : proveedores.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-on-surface-variant">
                  No hay proveedores registrados. Agrega el primero.
                </td></tr>
              ) : (
                proveedores.map((p) => (
                  <tr key={p.id_proveedor}
                    className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container-low transition-colors fade-in-up">
                    <td className="p-4 font-bold text-on-surface">{p.nombre}</td>
                    <td className="p-4 text-center font-mono text-sm text-on-surface-variant">{p.rif}</td>
                    <td className="p-4 text-center text-on-surface">{p.contacto || '—'}</td>
                    <td className="p-4 text-center font-mono text-sm">
                      <a href={`tel:${p.telefono}`} className="text-secondary-container hover:underline">
                        {p.telefono}
                      </a>
                    </td>
                    <td className="p-4 text-center text-sm">
                      {p.email
                        ? <a href={`mailto:${p.email}`} className="text-secondary-container hover:underline">{p.email}</a>
                        : <span className="text-on-surface-variant">—</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => abrirEditar(p)}
                          className="text-on-surface-variant hover:text-secondary-container transition-colors p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => eliminar(p.id_proveedor)} disabled={eliminando === p.id_proveedor}
                          className="text-on-surface-variant hover:text-error transition-colors p-1 disabled:opacity-50">
                          {eliminando === p.id_proveedor
                            ? <Loader2 size={16} className="animate-spin" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalProveedor
          titulo={editando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          form={form} setForm={setForm}
          onClose={() => setShowModal(false)}
          onGuardar={guardar}
          guardando={guardando}
        />
      )}
    </div>
  );
}
