import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PosView from './views/PosView';
import KitchenView from './views/KitchenView';
import ReportsView from './views/ReportsView';
import InventoryView from './views/InventoryView';
import SuppliersView from './views/SuppliersView';
import OrdersView from './views/OrdersView';
import CustomerMenuView from './views/CustomerMenuView';
import { ToastProvider } from './components/Toast';

const VIEWS = ['pos', 'customer', 'orders', 'kitchen', 'inventory', 'suppliers', 'reports'];

export default function App() {
  const [view, setView] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (v: string) => {
    setView(v);
    setSidebarOpen(false); // Cerrar sidebar al navegar en móvil
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background text-on-background font-sans overflow-hidden">
        {/* Sidebar responsivo (cajón en móvil, fijo en desktop) */}
        <Sidebar currentView={view} setView={navigateTo} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Backdrop para cerrar el sidebar en móvil */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300"
          />
        )}

        <div className="flex-1 flex flex-col md:ml-64 h-screen relative overflow-hidden">
          {view !== 'customer' && (
            <TopBar currentView={view} setView={navigateTo} onOpenSidebar={() => setSidebarOpen(true)} />
          )}

          <main className="flex-1 overflow-y-auto">
            {view === 'pos'       && <PosView />}
            {view === 'customer'  && <CustomerMenuView />}
            {view === 'orders'    && <OrdersView />}
            {view === 'kitchen'   && <KitchenView />}
            {view === 'inventory' && <InventoryView />}
            {view === 'suppliers' && <SuppliersView />}
            {view === 'reports'   && <ReportsView />}

            {/* Vista 404 */}
            {!VIEWS.includes(view) && (
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
