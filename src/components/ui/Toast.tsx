import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
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

// ── Provider ──────────────────────────────────────────────────────────────────

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Contenedor de toasts — esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
