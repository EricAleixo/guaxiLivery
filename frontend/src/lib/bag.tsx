"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "./auth";
import type { FeedItem } from "./api";

export interface BagItem {
  productId: string; name: string; price: number; imageUrl: string | null;
  category: FeedItem["product"]["category"]; companyName: string; qty: number;
}

interface BagCtx {
  items: BagItem[];
  count: number;
  total: number;
  add: (i: FeedItem, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<BagCtx | null>(null);
const MAX_QTY = 50;

export function BagProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const key = user ? `guaxi:bag:${user.id}` : null;
  const [loaded, setLoaded] = useState<{ key: string | null; items: BagItem[] }>({ key: null, items: [] });

  // troca de usuário: recarrega a sacola dele (a chave só muda depois da hidratação)
  if (loaded.key !== key) {
    let stored: BagItem[] = [];
    if (key) { try { stored = (JSON.parse(localStorage.getItem(key) ?? "[]") as BagItem[]).filter((x) => typeof x.productId === "string"); /* ids antigos (numericos) sao descartados */ } catch {} }
    setLoaded({ key, items: stored });
  }
  const items = loaded.items;
  const update = useCallback((fn: (p: BagItem[]) => BagItem[]) => {
    setLoaded((cur) => {
      const next = fn(cur.items);
      if (cur.key) { try { localStorage.setItem(cur.key, JSON.stringify(next)); } catch {} }
      return { key: cur.key, items: next };
    });
  }, []);

  const add = useCallback((i: FeedItem, qty = 1) => update((p) => {
    const found = p.find((x) => x.productId === i.product.id);
    if (found) return p.map((x) => x === found ? { ...x, qty: Math.min(MAX_QTY, x.qty + qty) } : x);
    return [...p, { productId: i.product.id, name: i.product.name, price: i.product.price, imageUrl: i.product.imageUrl,
      category: i.product.category, companyName: i.company.tradeName, qty: Math.min(MAX_QTY, qty) }];
  }), [update]);
  const setQty = useCallback((id: string, qty: number) =>
    update((p) => p.map((x) => x.productId === id ? { ...x, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : x)), [update]);
  const remove = useCallback((id: string) => update((p) => p.filter((x) => x.productId !== id)), [update]);
  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo(() => ({
    items, add, setQty, remove, clear,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.qty * i.price, 0),
  }), [items, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBag() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBag fora do BagProvider");
  return c;
}
