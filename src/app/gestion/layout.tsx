"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import Sidebar from "@/components/ui/Sidebar";
import TopBar from "@/components/ui/TopBar";
import { Loader2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LOGIN: Route = "/login-personal";

export type SystemView =
  | "pos"
  | "orders"
  | "kitchen"
  | "plates"
  | "inventory"
  | "suppliers"
  | "reports";

export interface ManagementLayoutProps {
  children: React.ReactNode;
}

export default function ManagementLayout({ children }: ManagementLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { estado } = useAuth();
  const router = useRouter();

  // Guardia del panel: sin sesión se vuelve al login. Es solo para la UI —
  // quien protege los datos de verdad es la API, que exige el token.
  useEffect(() => {
    if (estado === "invitado") router.replace(LOGIN);
  }, [estado, router]);

  if (estado !== "autenticado") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 size={22} className="animate-spin" />
        <span className="text-sm font-semibold">
          {estado === "cargando" ? "Verificando sesión..." : "Redirigiendo al login..."}
        </span>
      </div>
    );
  }

  return (
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
  );
}
