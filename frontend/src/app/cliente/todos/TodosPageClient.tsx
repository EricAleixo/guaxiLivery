"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clapperboard, Search, Store, X } from "lucide-react";
import { api, type FeedItem } from "@/lib/api";
import { FeedCard } from "@/components/FeedCard";
import { Loading } from "@/components/Loading";
import { useRequireRole } from "@/lib/auth";
import { CATEGORIES } from "@/lib/format";
import { Raccoon } from "@/components/Logo";
import { ErrorBox, inputCls, usePolling } from "@/components/ui";
import type { ProductCategory } from "@/lib/api";

export default function TodosPageClient() {
  const { user } = useRequireRole("CLIENTE");
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [company, setCompany] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    api.feed().then((l) => { setItems(l); setError(null); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);
  // filtros vindos do dashboard: ?categoria=LANCHE&empresa=3
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("categoria"); const e = Number(q.get("empresa"));
    /* eslint-disable react-hooks/set-state-in-effect -- lê a URL só no cliente, após a hidratação */
    if (c && c in CATEGORIES) setCategory(c as ProductCategory);
    if (e) setCompany(e);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  usePolling(() => { if (user) load(); }, 30000);

  const companies = useMemo(() => {
    const m = new Map<number, FeedItem["company"]>();
    items?.forEach((i) => m.set(i.company.id, i.company));
    return [...m.values()];
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) =>
      (!category || i.product.category === category) &&
      (!company || i.company.id === company) &&
      (!q || `${i.product.name} ${i.product.description ?? ""} ${i.company.tradeName}`.toLowerCase().includes(q)));
  }, [items, query, category, company]);

  if (!user) return <Loading />;

  return (
    <div className="mx-auto max-w-[90rem] space-y-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Todos os pratos</h1>
          <p className="text-fur">Produtos disponíveis agora, direto das empresas parceiras.</p>
        </div>
        <Link href="/cliente/feed" className="flex items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold hover:bg-ink hover:text-cream">
          <Clapperboard size={16} /> Ver em vídeo</Link>
      </header>

      {notice && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-mint-soft px-4 py-3 font-bold">
          <span>{notice} <Link href="/cliente/sacola" className="underline">Ver sacola</Link></span>
          <button onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={18} /></button>
        </div>
      )}
      <ErrorBox message={error} />

      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fur" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar prato ou empresa…"
            className={`${inputCls} pl-11`} aria-label="Buscar" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill active={!category} onClick={() => setCategory(null)}>Tudo</Pill>
          {(Object.keys(CATEGORIES) as ProductCategory[]).map((c) => (
            <Pill key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
              {CATEGORIES[c].emoji} {CATEGORIES[c].label}</Pill>
          ))}
        </div>
        {companies.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Empresas">
            <Pill active={!company} onClick={() => setCompany(null)}><Store size={14} className="inline" /> Todas as empresas</Pill>
            {companies.map((c) => (
              <Pill key={c.id} active={company === c.id} onClick={() => setCompany(company === c.id ? null : c.id)}>{c.tradeName}</Pill>
            ))}
          </div>
        )}
      </div>

      {!items && !error ? <Loading label="Buscando comidinhas…" /> : items && shown.length === 0 ? (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <Raccoon className="mx-auto h-20 w-20" />
          <p className="mt-2 text-lg font-bold">
            {items.length === 0 ? "Nenhuma empresa publicou produtos ainda." : "Nada encontrado com esses filtros."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((i) => <FeedCard key={i.product.id} item={i} onAdded={() => setNotice(`${i.product.name} foi para a sacola.`)} />)}
        </div>
      )}

    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${active ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
      {children}</button>
  );
}
