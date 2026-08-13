"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  Armchair,
  ChefHat,
  PlusCircle,
  ReceiptText,
  Utensils,
  UtensilsCrossed,
  Package,
  Truck,
  BarChart2,
  Settings,
  LogOut,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: Route;
  label: string;
  icon: typeof ReceiptText;
}

const navItems: NavItem[] = [
  { href: "/gestion/pedidos", label: "Pedidos", icon: ReceiptText },
  { href: "/gestion/cocina", label: "Cocina", icon: Utensils },
  { href: "/gestion/platos", label: "Platos", icon: UtensilsCrossed },
  { href: "/gestion/mesas", label: "Mesas", icon: Armchair },
  { href: "/gestion/inventario", label: "Inventario", icon: Package },
  { href: "/gestion/proveedores", label: "Proveedores", icon: Truck },
  { href: "/gestion/informes", label: "Informes", icon: BarChart2 }
];

const NUEVO_PEDIDO_HREF: Route = "/gestion/nuevo-pedido";

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      style={{ background: "linear-gradient(180deg, #1a110d 0%, #211510 100%)" }}
      className={`h-screen w-64 fixed left-0 top-0 flex flex-col p-5 z-40 border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div className="mb-7 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div
            style={{ background: "linear-gradient(135deg, #e8601a, #c44d0e)" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          >
            <ChefHat size={21} color="#fff" />
          </div>
          <div>
            <div className="text-[15px] font-black text-white leading-tight tracking-tight uppercase">
              Tradiciones y Sabores
            </div>
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">
              Sistema de gestión
            </div>
          </div>
        </div>

        {/* Botón cerrar en móvil */}
        <button
          onClick={onClose}
          className="md:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Botón CTA ────────────────────────────────── */}
      <Link
        href={NUEVO_PEDIDO_HREF}
        onClick={onClose}
        style={{ background: "linear-gradient(135deg, #e8601a, #c44d0e)" }}
        className="text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-6 hover:opacity-90 active:scale-95 transition-all h-12 uppercase tracking-wide shadow-lg shadow-orange-900/30"
      >
        <PlusCircle size={18} />
        Nuevo Pedido
      </Link>

      {/* ── Sección label ────────────────────────────── */}
      <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-1.5">
        Navegación
      </div>

      {/* ── Navegación ───────────────────────────────── */}
      <div className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <Icon
                size={18}
                color={isActive ? "#e8601a" : "currentColor"}
                className="shrink-0"
              />
              <span>{label}</span>
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-4 rounded-full"
                  style={{ background: "#e8601a" }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 mt-auto pt-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all duration-150">
          <Settings size={17} className="shrink-0" />
          <span>Configuración</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/40 hover:bg-white/5 hover:text-red-400 transition-all duration-150">
          <LogOut size={17} className="shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
