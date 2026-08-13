/**
 * Tradiciones y Sabores — Almacén de sesión
 *
 * Guarda el access token, el refresh token y el usuario de la sesión actual.
 * Vive fuera de React porque la capa de API (`./index`) necesita leer el token
 * en cada request y reaccionar a un 401 sin depender de un componente.
 *
 * Persiste en `localStorage` para que un F5 no cierre la sesión. Si el navegador
 * bloquea el storage (modo privado), la sesión sigue funcionando en memoria y
 * simplemente no sobrevive a una recarga.
 */

import type { Usuario } from "./index";

const CLAVE_ACCESS = "tys.access_token";
const CLAVE_REFRESH = "tys.refresh_token";
const CLAVE_USUARIO = "tys.usuario";

let access: string | null = null;
let refresh: string | null = null;
let usuario: Usuario | null = null;
let hidratado = false;

const oyentes = new Set<() => void>();

function hidratar(): void {
  if (hidratado || typeof window === "undefined") return;
  hidratado = true;
  try {
    access = window.localStorage.getItem(CLAVE_ACCESS);
    refresh = window.localStorage.getItem(CLAVE_REFRESH);
    const crudo = window.localStorage.getItem(CLAVE_USUARIO);
    usuario = crudo ? (JSON.parse(crudo) as Usuario) : null;
  } catch {
    // Storage bloqueado o JSON corrupto: se sigue con lo que haya en memoria.
  }
}

function escribir(clave: string, valor: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (valor === null) window.localStorage.removeItem(clave);
    else window.localStorage.setItem(clave, valor);
  } catch {
    // Igual que arriba: la sesión queda solo en memoria.
  }
}

function notificar(): void {
  for (const oyente of oyentes) oyente();
}

export interface DatosSesion {
  access: string;
  refresh?: string | null;
  usuario?: Usuario | null;
}

export const sesion = {
  accessToken(): string | null {
    hidratar();
    return access;
  },

  refreshToken(): string | null {
    hidratar();
    return refresh;
  },

  /** Último usuario conocido: sirve para pintar la UI sin esperar a /auth/me. */
  usuario(): Usuario | null {
    hidratar();
    return usuario;
  },

  /** Guarda la sesión. Los campos omitidos conservan su valor anterior. */
  guardar(datos: DatosSesion): void {
    hidratar();
    access = datos.access;
    escribir(CLAVE_ACCESS, access);

    if (datos.refresh !== undefined) {
      refresh = datos.refresh;
      escribir(CLAVE_REFRESH, refresh);
    }
    if (datos.usuario !== undefined) {
      usuario = datos.usuario;
      escribir(CLAVE_USUARIO, usuario ? JSON.stringify(usuario) : null);
    }
    notificar();
  },

  limpiar(): void {
    hidratar();
    access = null;
    refresh = null;
    usuario = null;
    escribir(CLAVE_ACCESS, null);
    escribir(CLAVE_REFRESH, null);
    escribir(CLAVE_USUARIO, null);
    notificar();
  },

  /** Avisa de cualquier cambio de sesión (login, refresh, logout forzado). */
  suscribir(oyente: () => void): () => void {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
  }
};
