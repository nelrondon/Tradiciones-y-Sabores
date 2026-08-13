"use client";

import { AlertTriangle, ChefHat, Eye, EyeOff, LogIn, Loader2, Utensils } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../ui/Toast";

const DESTINO: Route = "/gestion";
const MENU_PUBLICO: Route = "/menu";

export default function LoginView() {
  const router = useRouter();
  const { estado, login } = useAuth();
  const { showToast } = useToast();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Con sesión abierta no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (estado === "autenticado") router.replace(DESTINO);
  }, [estado, router]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usuario.trim() || !contrasena) {
      setError("Ingrese su usuario y su contraseña.");
      return;
    }

    setEnviando(true);
    try {
      const perfil = await login(usuario.trim(), contrasena);
      showToast("success", `Bienvenido, ${perfil.nombre}`, "Sesión iniciada correctamente.");
      router.replace(DESTINO);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo iniciar sesión. Intente de nuevo.";
      setError(msg);
      setContrasena("");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 fade-in-up">
        {/* Marca */}
        <div className="flex flex-col items-center text-center gap-3">
          <div
            style={{ background: "linear-gradient(135deg, #e8601a, #c44d0e)" }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20"
          >
            <ChefHat size={28} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary uppercase tracking-tight leading-tight">
              Tradiciones y Sabores
            </h1>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-1">
              Sistema de gestión
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={enviar}
          className="bg-surface border border-outline-variant rounded-xl shadow-sm p-6 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="usuario"
              className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block"
            >
              Usuario
            </label>
            <input
              id="usuario"
              name="username"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={enviando}
              className="industrial-input"
              placeholder="Ej. jperez"
            />
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="text-xs font-bold text-on-surface-variant uppercase mb-1.5 block"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="contrasena"
                name="password"
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                autoComplete="current-password"
                disabled={enviando}
                className="industrial-input pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setVerContrasena(v => !v)}
                aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {verContrasena ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-3 rounded-lg flex items-start gap-2 border border-error text-xs font-semibold">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || estado === "cargando"}
            className="w-full h-12 bg-primary text-on-primary text-sm font-black uppercase tracking-wide rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50"
          >
            {enviando ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <LogIn size={17} />
            )}
            {enviando ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
            El acceso al panel es solo para el personal del restaurante. Si olvidó su
            contraseña, pídale al administrador que la restablezca.
          </p>
        </form>

        {/* Acceso al menú público */}
        <Link
          href={MENU_PUBLICO}
          className="flex items-center justify-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          <Utensils size={14} />
          Volver al menú digital
        </Link>
      </div>
    </main>
  );
}
