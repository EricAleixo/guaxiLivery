"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Loading } from "@/components/Loading";
import { usePolling } from "@/components/ui";
import { api, ApiError, type CourierCompany, type CourierInfo, type Delivery, type DeliveryStatus } from "@/lib/api";
import { useRequireRole } from "@/lib/auth";

interface Ctx {
  profile: CourierInfo | null;
  setProfile: (p: CourierInfo) => void;
  available: Delivery[] | null;
  mine: Delivery[] | null;
  companies: CourierCompany[] | null;
  error: string | null;
  clearError: () => void;
  busyId: string | null;
  claim: (d: Delivery) => Promise<void>;
  release: (d: Delivery) => Promise<void>;
  move: (d: Delivery, to: DeliveryStatus) => Promise<void>;
  linkAction: (key: string, fn: () => Promise<unknown>) => Promise<void>;
}

const C = createContext<Ctx | null>(null);
export const useEntregador = () => {
  const c = useContext(C);
  if (!c) throw new Error("useEntregador fora do EntregadorProvider");
  return c;
};

const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Erro inesperado.");

export function EntregadorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useRequireRole("ENTREGADOR");
  const [profile, setProfile] = useState<CourierInfo | null>(null);
  const [available, setAvailable] = useState<Delivery[] | null>(null);
  const [mine, setMine] = useState<Delivery[] | null>(null);
  const [companies, setCompanies] = useState<CourierCompany[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.courierAvailable(), api.courierMine(), api.courierCompanies()])
      .then(([a, m, c]) => { setAvailable(a); setMine(m); setCompanies(c); setError(null); })
      .catch((e) => setError(msg(e)));
  }, []);
  useEffect(() => {
    if (!user) return;
    load();
    api.courierProfile().then(setProfile).catch((e) => setError(msg(e)));
  }, [user, load]);
  usePolling(() => { if (user && busyId === null) load(); });

  const run = useCallback(async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id); setError(null);
    try { await fn(); } catch (e) { setError(msg(e)); }
    finally { load(); setBusyId(null); }
  }, [load]);

  const value = useMemo<Ctx>(() => ({
    profile, setProfile, available, mine, companies, error, clearError: () => setError(null), busyId,
    claim: (d) => run(d.id, () => api.courierClaim(d.id)),
    release: (d) => run(d.id, () => api.courierRelease(d.id)),
    move: (d, to) => run(d.id, () => api.courierStatus(d.id, to)),
    linkAction: (key, fn) => run(key, fn),
  }), [profile, available, mine, companies, error, busyId, run]);

  if (!user) return <Loading />;
  return <C.Provider value={value}>{children}</C.Provider>;
}
