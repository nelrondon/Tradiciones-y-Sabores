"use client";

import { useState, useEffect } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { Bell, Search, ChefHat, Menu, Monitor, Copy, Check } from "lucide-react";
import Link from "next/link";

interface TopBarProps {
  onOpenSidebar: () => void;
}

const LABELS: Record<string, string> = {
  "nuevo-pedido": "Nuevo Pedido",
  pedidos: "Pedidos",
  cocina: "Panel de Cocina",
  platos: "Platos",
  mesas: "Mesas",
  inventario: "Inventario",
  proveedores: "Proveedores",
  informes: "Reportes y Datos"
};

export default function TopBar({ onOpenSidebar }: TopBarProps) {
  const segment = useSelectedLayoutSegment();

  const currentLabel = (segment && LABELS[segment]) ?? segment ?? "";

  const [hora, setHora] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () =>
      setHora(
        new Date().toLocaleTimeString("es-VE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "America/Caracas"
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="bg-white border-b border-outline-variant sticky top-0 z-30 flex justify-between items-center w-full px-6 h-14 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
        >
          <Menu size={20} />
        </button>

        <ChefHat size={18} className="text-secondary-container shrink-0" />
        <div className="hidden md:block h-4 w-px bg-outline-variant" />
        <h1 className="text-sm font-bold text-on-surface tracking-wide">
          {currentLabel}
        </h1>
      </div>

      {hora && (
        <span className="hidden md:block font-mono text-sm font-bold text-on-surface-variant tabular-nums">
          {hora}
        </span>
      )}

      <Link
        href="/"
        className="flex items-center gap-1.5 bg-amber-500 text-white hover:bg-amber-600 font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
      >
        <Monitor size={14} />
        <span>Ir al menú de clientes ↗</span>
      </Link>
    </header>
  );
}
