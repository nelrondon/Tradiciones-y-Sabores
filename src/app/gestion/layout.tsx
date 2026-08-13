"use client";

import { useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import TopBar from "@/components/ui/TopBar";

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
  children: React.ReactNode;
}

export default function ManagementLayout({ children }: ManagementViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background text-on-background font-sans overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-300"
          />
        )}

        <div className="flex-1 flex flex-col h-screen relative overflow-hidden md:ml-64">
          <TopBar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
