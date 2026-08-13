"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { api, type Usuario } from "../../api";
import { sesion } from "../../api/sesion";

// ── Tipos ─────────────────────────────────────────────────────────────────────

/**
 * - `cargando`: aún no se sabe si hay sesión (primer render / validando token).
 * - `autenticado`: hay un usuario con token válido.
 * - `invitado`: no hay sesión.
 */
export type EstadoSesion = "cargando" | "autenticado" | "invitado";

interface AuthContextValue {
  usuario: Usuario | null;
  estado: EstadoSesion;
  /** Inicia sesión. Lanza `ApiError` si las credenciales no son válidas. */
  login: (usuario: string, contrasena: string) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estado, setEstado] = useState<EstadoSesion>("cargando");

  // Al arrancar: se pinta el usuario cacheado para no parpadear, y en paralelo
  // se valida el token contra /auth/me. La sesión vive en localStorage, que no
  // existe durante el render del servidor: por eso se lee aquí y no en el
  // inicializador del useState (rompería la hidratación).
  useEffect(() => {
    let vigente = true;

    if (!sesion.accessToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado("invitado");
      return;
    }

    const cacheado = sesion.usuario();
    if (cacheado) {
      setUsuario(cacheado);
      setEstado("autenticado");
    }

    api
      .getPerfil()
      .then(perfil => {
        if (!vigente) return;
        sesion.guardar({ access: sesion.accessToken() ?? "", usuario: perfil });
        setUsuario(perfil);
        setEstado("autenticado");
      })
      .catch(() => {
        // Token inválido y refresh fallido: la capa de API ya limpió la sesión.
        if (!vigente) return;
        sesion.limpiar();
        setUsuario(null);
        setEstado("invitado");
      });

    return () => {
      vigente = false;
    };
  }, []);

  // Si la capa de API cierra la sesión sola (refresh vencido), la UI se entera.
  useEffect(
    () =>
      sesion.suscribir(() => {
        if (sesion.accessToken()) return;
        setUsuario(null);
        setEstado("invitado");
      }),
    []
  );

  const login = useCallback(async (nombreUsuario: string, contrasena: string) => {
    const respuesta = await api.login({ usuario: nombreUsuario, contrasena });
    sesion.guardar({
      access: respuesta.access_token,
      refresh: respuesta.refresh_token,
      usuario: respuesta.usuario
    });
    setUsuario(respuesta.usuario);
    setEstado("autenticado");
    return respuesta.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (sesion.refreshToken()) await api.logout();
    } catch {
      // Da igual por qué falló: la sesión local se cierra de todas formas.
    } finally {
      sesion.limpiar();
      setUsuario(null);
      setEstado("invitado");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, estado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
