import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PosView from './views/PosView';
import KitchenView from './views/KitchenView';
import ReportsView from './views/ReportsView';
import InventoryView from './views/InventoryView';
import PlatesView from './views/PlatesView';
import SuppliersView from './views/SuppliersView';
import OrdersView from './views/OrdersView';
import CustomerMenuView from './views/CustomerMenuView';
import { ToastProvider } from './components/Toast';

const SYSTEM_VIEWS = ['pos', 'orders', 'kitchen', 'plates', 'inventory', 'suppliers', 'reports'];

/**
 * Si la URL tiene ?view=menu, esta ventana es SOLO para el cliente.
 * El sistema (POS, cocina, inventario, etc.) queda en su propia ventana del personal.
 */
const isCustomerWindow = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'menu';
};

const getInitialView = (): string => {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam && SYSTEM_VIEWS.includes(viewParam)) return viewParam;
  return 'pos';
};

// ── Ventana exclusiva para clientes ──────────────────────────────────────────
// Se carga cuando la URL tiene ?view=customer.
// El cliente SOLO puede ver el menú y hacer su pedido. 
// No hay sidebar, no hay topbar del sistema, no hay acceso a nada más.
function CustomerApp() {
  return (
    <ToastProvider>
      <CustomerMenuView />
    </ToastProvider>
  );
}

// ── App del sistema interno (personal del restaurante) ────────────────────────
// Se carga cuando la URL NO tiene ?view=customer.
// Solo los empleados con acceso a esta ventana ven el POS, cocina, inventario, etc.
function SystemApp() {
  const [view, setView] = useState(getInitialView);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (v: string) => {
    setView(v);
    setSidebarOpen(false);
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background text-on-background font-sans overflow-hidden">
        <Sidebar
          currentView={view}
          setView={navigateTo}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Backdrop para cerrar el sidebar en móvil */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300"
          />
        )}

        <div className="flex-1 flex flex-col h-screen relative overflow-hidden md:ml-64">
          <TopBar
            currentView={view}
            setView={navigateTo}
            onOpenSidebar={() => setSidebarOpen(true)}
          />

          <main className="flex-1 overflow-y-auto">
            {view === 'pos'       && <PosView />}
            {view === 'orders'    && <OrdersView />}
            {view === 'kitchen'   && <KitchenView />}
            {view === 'plates'    && <PlatesView />}
            {view === 'inventory' && <InventoryView />}
            {view === 'suppliers' && <SuppliersView />}
            {view === 'reports'   && <ReportsView />}

            {/* Vista 404 */}
            {!SYSTEM_VIEWS.includes(view) && (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                <div className="text-9xl font-black text-outline-variant select-none">404</div>
                <div>
                  <h2 className="text-2xl font-black text-primary">Vista no encontrada</h2>
                  <p className="text-on-surface-variant mt-2">
                    La sección <code className="bg-surface-container px-2 py-0.5 rounded font-mono">{view}</code> no existe.
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('pos')}
                  className="bg-primary text-on-primary font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Ir al Punto de Venta
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

// ── Root: decide qué app mostrar según la URL ────────────────────────────────
export default function App() {
  if (isCustomerWindow()) {
    return <CustomerApp />;
  }
  return <SystemApp />;
}
