"use client";
import { Loading } from "@/components/Loading";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError, type CompanyLink, type Delivery, type DeliveryStatus, type Product } from "@/lib/api";
import { useRequireRole } from "@/lib/auth";
import { usePolling } from "@/components/ui";
import { ProductForm } from "@/components/ProductForm";

interface Ctx {
  deliveries: Delivery[] | null;
  products: Product[] | null;
  couriers: CompanyLink[] | null;
  reloadCouriers: () => void;
  assign: (d: Delivery, courierId: string | null) => Promise<void>;
  error: string | null;
  clearError: () => void;
  busyId: string | null;
  move: (d: Delivery, to: DeliveryStatus, courierId?: string | null) => Promise<void>;
  toggle: (p: Product) => Promise<void>;
  remove: (p: Product) => Promise<void>;
  openForm: (p?: Product) => void;
}

const EmpresaCtx = createContext<Ctx | null>(null);
export const useEmpresa = () => {
  const c = useContext(EmpresaCtx);
  if (!c) throw new Error("useEmpresa fora do EmpresaProvider");
  return c;
};

const msg = (e: unknown) => (e instanceof ApiError ? e.message : "Erro inesperado.");

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useRequireRole("EMPRESA");
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [couriers, setCouriers] = useState<CompanyLink[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined); // undefined = fechado, null = novo

  const load = useCallback(() => {
    api.availableDeliveries().then((l) => { setDeliveries(l); setError(null); }).catch((e) => setError(msg(e)));
  }, []);
  const reloadCouriers = useCallback(() => {
    api.companyCouriers().then(setCouriers).catch((e) => setError(msg(e)));
  }, []);
  useEffect(() => {
    if (!user) return;
    load();
    reloadCouriers();
    api.myProducts().then(setProducts).catch((e) => setError(msg(e)));
  }, [user, load, reloadCouriers]);
  usePolling(() => { if (user && busyId === null) { load(); reloadCouriers(); } });

  const move = useCallback(async (d: Delivery, to: DeliveryStatus, courierId?: string | null) => {
    setBusyId(d.id); setError(null);
    try {
      let upd = await api.updateStatus(d.id, to);
      if (courierId != null) {
        try { upd = await api.assignCourier(d.id, courierId); }
        catch (e) { setError(`Pedido aceito, mas não foi possível associar o motoboy: ${msg(e)}`); }
      }
      setDeliveries((l) => l?.map((x) => (x.id === upd.id ? upd : x)) ?? l);
    } catch (e) { setError(msg(e)); load(); }
    finally { setBusyId(null); }
  }, [load]);

  const assign = useCallback(async (d: Delivery, courierId: string | null) => {
    setBusyId(d.id); setError(null);
    try {
      const upd = await api.assignCourier(d.id, courierId);
      setDeliveries((l) => l?.map((x) => (x.id === upd.id ? upd : x)) ?? l);
    } catch (e) { setError(msg(e)); load(); }
    finally { setBusyId(null); }
  }, [load]);

  const toggle = useCallback(async (p: Product) => {
    try {
      const upd = await api.setProductAvailable(p.id, !p.available);
      setProducts((l) => l?.map((x) => (x.id === upd.id ? upd : x)) ?? l);
    } catch (e) { setError(msg(e)); }
  }, []);

  const remove = useCallback(async (p: Product) => {
    if (!confirm(`Remover "${p.name}" do cardápio?`)) return;
    try { await api.deleteProduct(p.id); setProducts((l) => l?.filter((x) => x.id !== p.id) ?? l); }
    catch (e) { setError(msg(e)); }
  }, []);

  const openForm = useCallback((p?: Product) => setEditing(p ?? null), []);
  const closeForm = useCallback(() => setEditing(undefined), []);
  const saved = useCallback((p: Product) => {
    setProducts((l) => (l?.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [p, ...(l ?? [])]));
    setEditing(undefined);
  }, []);

  const value = useMemo(() => ({
    deliveries, products, couriers, reloadCouriers, assign, error, clearError: () => setError(null), busyId, move, toggle, remove, openForm,
  }), [deliveries, products, couriers, reloadCouriers, assign, error, busyId, move, toggle, remove, openForm]);

  if (!user) return <Loading />;
  return (
    <EmpresaCtx.Provider value={value}>
      {children}
      {editing !== undefined && <ProductForm product={editing} onClose={closeForm} onSaved={saved} />}
    </EmpresaCtx.Provider>
  );
}
