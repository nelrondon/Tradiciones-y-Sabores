"use client";

import { useState } from "react";
import Sidebar from "./ui/Sidebar";
import { ToastProvider } from "./ui/Toast";
import TopBar from "./ui/TopBar";
import InventoryView from "./views/InventoryView";
import KitchenView from "./views/KitchenView";
import OrdersView from "./views/OrdersView";
import PlatesView from "./views/PlatesView";
import PosView from "./views/PosView";
import ReportsView from "./views/ReportsView";
import SuppliersView from "./views/SuppliersView";

export type SystemView =
  | "pos"
  | "orders"
  | "kitchen"
  | "plates"
  | "inventory"
  | "suppliers"
  | "reports";

export interface ManagementViewProps {
  view: SystemView;
}

export default function ManagementView({ view }: ManagementViewProps) {
  // const searchParams = useSearchParams();

  // const getInitialView = (): string => {
  //   const viewParam = searchParams.get("view");
  //   if (viewParam && SYSTEM_VIEWS.includes(viewParam)) return viewParam;
  //   return "pos";
  // };

  // const [view, setView] = useState(getInitialView);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateTo = (v: string) => {};

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
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
