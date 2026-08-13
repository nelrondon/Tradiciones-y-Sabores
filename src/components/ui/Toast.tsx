import {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
  type ReactNode
} from "react";
import { CheckCircle, AlertTriangle, HelpCircle, Info, X } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Texto del botón que confirma. Por defecto "Sí, continuar". */
  confirmLabel?: string;
  /** Texto del botón que cancela. Por defecto "Cancelar". */
  cancelLabel?: string;
  /**
   * Pinta la confirmación en rojo, para acciones destructivas.
   * Por defecto `true`: casi todo lo que se confirma es un borrado.
   */
  danger?: boolean;
}

interface Confirm extends ConfirmOptions {
  id: number;
  resolve: (aceptado: boolean) => void;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  /**
   * Reemplazo de `window.confirm()`: muestra un toast con botones Sí/No y
   * resuelve `true` si el usuario acepta, `false` si cancela o lo descarta.
   *
   * ```ts
   * if (!(await showConfirm({ title: "¿Eliminar el plato?" }))) return;
   * ```
   */
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ── Contexto ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Íconos y estilos por tipo ─────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    bg: "bg-white",
    border: "border-l-4 border-l-emerald-500",
    iconColor: "text-emerald-500"
  },
  error: {
    icon: AlertTriangle,
    bg: "bg-white",
    border: "border-l-4 border-l-error",
    iconColor: "text-error"
  },
  info: {
    icon: Info,
    bg: "bg-white",
    border: "border-l-4 border-l-secondary-container",
    iconColor: "text-secondary-container"
  }
};

// ── Toast individual ──────────────────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { icon: Icon, bg, border, iconColor } = CONFIG[toast.type];
  return (
    <div
      className={`${bg} ${border} flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl min-w-[280px] max-w-sm fade-in-up border border-outline-variant`}
      style={{ animation: "fadeInUp 0.25s ease-out both" }}
    >
      <Icon size={20} className={`${iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-on-surface-variant mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0 mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── Toast de confirmación ─────────────────────────────────────────────────────

function ConfirmItem({
  confirm,
  onResponder
}: {
  confirm: Confirm;
  onResponder: (aceptado: boolean) => void;
}) {
  const danger = confirm.danger ?? true;

  return (
    <div
      role="alertdialog"
      aria-label={confirm.title}
      className={`bg-white border-l-4 ${
        danger ? "border-l-error" : "border-l-secondary-container"
      } flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl min-w-[300px] max-w-sm fade-in-up border border-outline-variant`}
      style={{ animation: "fadeInUp 0.25s ease-out both" }}
    >
      <HelpCircle
        size={20}
        className={`${danger ? "text-error" : "text-secondary-container"} shrink-0 mt-0.5`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface leading-tight">{confirm.title}</p>
        {confirm.message && (
          <p className="text-xs text-on-surface-variant mt-0.5">{confirm.message}</p>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => onResponder(false)}
            className="px-3 h-8 text-xs font-bold text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors"
          >
            {confirm.cancelLabel ?? "Cancelar"}
          </button>
          <button
            autoFocus
            onClick={() => onResponder(true)}
            className={`px-3 h-8 text-xs font-bold rounded-lg transition-opacity hover:opacity-90 ${
              danger ? "bg-error text-white" : "bg-primary text-on-primary"
            }`}
          >
            {confirm.confirmLabel ?? "Sí, continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirms, setConfirms] = useState<Confirm[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++nextId;
      setToasts(prev => [...prev, { id, type, title, message }]);
      setTimeout(() => removeToast(id), type === "error" ? 6000 : 4000);
    },
    [removeToast]
  );

  /** Resuelve la confirmación y la saca de la pila. */
  const responder = useCallback((confirm: Confirm, aceptado: boolean) => {
    confirm.resolve(aceptado);
    setConfirms(prev => prev.filter(c => c.id !== confirm.id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    const id = ++nextId;
    // A diferencia de los toasts, este no se auto-descarta: espera al usuario.
    return new Promise<boolean>(resolve => {
      setConfirms(prev => [...prev, { ...options, id, resolve }]);
    });
  }, []);

  // Escape cancela la confirmación más reciente.
  useEffect(() => {
    if (confirms.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const ultima = confirms[confirms.length - 1];
      if (ultima) responder(ultima, false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirms, responder]);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {/* Contenedor de toasts — esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
        {/* Las confirmaciones van al final: quedan pegadas a la esquina. */}
        {confirms.map(confirm => (
          <div key={confirm.id} className="pointer-events-auto">
            <ConfirmItem
              confirm={confirm}
              onResponder={aceptado => responder(confirm, aceptado)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
