"use client";

import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useAuth } from "../auth/AuthProvider";

const LOGIN: Route = "/login-personal";
const GESTION: Route = "/gestion";

/**
 * Franja superior del menú digital con el acceso del personal: invita a iniciar
 * sesión si no hay sesión, y lleva directo al panel si ya la hay.
 *
 * Mantiene su altura mientras se verifica la sesión para que el menú no salte.
 */
export default function StaffAccessBar() {
  const { estado, usuario } = useAuth();

  return (
    <div className="bg-surface-container-highest border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-12 flex items-center justify-end gap-3">
        {estado === "autenticado" ? (
          <>
            <span className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
              Sesión iniciada como{" "}
              <span className="text-on-surface font-bold">{usuario?.nombre}</span>
            </span>
            <Link
              href={GESTION}
              className="flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              <ShieldCheck size={14} />
              Ir al sistema de gestión
              <ArrowRight size={14} />
            </Link>
          </>
        ) : estado === "invitado" ? (
          <>
            <span className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
              ¿Eres parte del personal?
            </span>
            <Link
              href={LOGIN}
              className="flex items-center gap-2 border border-outline-variant bg-surface text-on-surface text-xs font-bold px-3 py-2 rounded-lg hover:bg-surface-variant transition-colors active:scale-95"
            >
              <LogIn size={14} />
              Iniciar sesión
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
