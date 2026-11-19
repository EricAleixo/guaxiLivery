"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore, type AuthResponse, type Role, type User } from "./api";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  signIn: (r: AuthResponse) => void;
  signOut: () => void;
  updateUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const has = !!tokenStore.get();
    (has ? api.me().then(setUser).catch(() => tokenStore.clear()) : Promise.resolve()).finally(() => setReady(true));
  }, []);

  const signIn = useCallback((r: AuthResponse) => { tokenStore.set(r.token); setUser(r.user); }, []);
  const signOut = useCallback(() => { tokenStore.clear(); setUser(null); }, []);
  const value = useMemo(() => ({ user, ready, signIn, signOut, updateUser: setUser }), [user, ready, signIn, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}

export const homeFor = (role: Role) => (role === "EMPRESA" ? "/empresa" : role === "ENTREGADOR" ? "/entregador" : "/cliente");

/** Entregador também é cliente: pode usar as páginas de cliente. */
const allowed = (user: User, role: Role) => user.role === role || (role === "CLIENTE" && user.role === "ENTREGADOR");

/** Garante que o usuário está logado com o papel certo; redireciona caso contrário. */
export function useRequireRole(role: Role) {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (!allowed(user, role)) router.replace(homeFor(user.role));
  }, [ready, user, role, router]);
  return { user: user && allowed(user, role) ? user : null, ready };
}
