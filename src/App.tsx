import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PosView from './views/PosView';
import KitchenView from './views/KitchenView';
import ReportsView from './views/ReportsView';
import InventoryView from './views/InventoryView';
import SuppliersView from './views/SuppliersView';
import OrdersView from './views/OrdersView';
import { ToastProvider } from './components/Toast';

const VIEWS = ['pos', 'orders', 'kitchen', 'inventory', 'suppliers', 'reports'];

export default function App() {
  const [view, setView] = useState('pos');

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background text-on-background font-sans overflow-hidden">
        <Sidebar currentView={view} setView={setView} />

        <div className="flex-1 flex flex-col md:ml-64 h-screen relative overflow-hidden">
          <TopBar currentView={view} setView={setView} />

          <main className="flex-1 overflow-y-auto">
            {view === 'pos'       && <PosView />}
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
                  onClick={() => setView('pos')}
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
