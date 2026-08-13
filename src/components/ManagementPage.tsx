"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../components/ui/Sidebar";
import { ToastProvider } from "../components/ui/Toast";
import TopBar from "../components/ui/TopBar";
import InventoryView from "../components/views/InventoryView";
import KitchenView from "../components/views/KitchenView";
import OrdersView from "../components/views/OrdersView";
import PlatesView from "../components/views/PlatesView";
import PosView from "../components/views/PosView";
import ReportsView from "../components/views/ReportsView";
import SuppliersView from "../components/views/SuppliersView";

const SYSTEM_VIEWS = [
  "pos",
  "orders",
  "kitchen",
  "plates",
  "inventory",
  "suppliers",
  "reports"
];

export default function ManagementPage() {
  const searchParams = useSearchParams();

  const getInitialView = (): string => {
    const viewParam = searchParams.get("view");
    if (viewParam && SYSTEM_VIEWS.includes(viewParam)) return viewParam;
    return "pos";
  };

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
            {view === "pos" && <PosView />}
            {view === "orders" && <OrdersView />}
            {view === "kitchen" && <KitchenView />}
            {view === "plates" && <PlatesView />}
            {view === "inventory" && <InventoryView />}
            {view === "suppliers" && <SuppliersView />}
            {view === "reports" && <ReportsView />}

            {!SYSTEM_VIEWS.includes(view) && (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                <div className="text-9xl font-black text-outline-variant select-none">
                  404
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary">
                    Vista no encontrada
                  </h2>
                  <p className="text-on-surface-variant mt-2">
                    La sección{" "}
                    <code className="bg-surface-container px-2 py-0.5 rounded font-mono">
                      {view}
                    </code>{" "}
                    no existe.
                  </p>
                </div>
                <button
                  onClick={() => navigateTo("pos")}
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
