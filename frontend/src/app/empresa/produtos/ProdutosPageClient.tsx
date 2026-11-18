"use client";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { btnCls } from "@/components/ui";
import { useEmpresa } from "@/lib/empresa";
import { CATEGORIES } from "@/lib/format";
import type { ProductCategory } from "@/lib/api";

export default function ProdutosPageClient() {
  const { products, openForm } = useEmpresa();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ProductCategory | "TODOS">("TODOS");
  const shown = useMemo(() => (products ?? []).filter((p) =>
    (cat === "TODOS" || p.category === cat) && p.name.toLowerCase().includes(q.trim().toLowerCase())), [products, q, cat]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Meu cardápio</h1>
          <p className="text-fur">{products ? `${products.length} produto${products.length === 1 ? "" : "s"} cadastrado${products.length === 1 ? "" : "s"}` : "Carregando…"}</p>
        </div>
        <button onClick={() => openForm()} className={`${btnCls} flex items-center gap-2`}><Plus size={20} strokeWidth={3} /> Novo produto</button>
      </header>

      {products && products.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-orange bg-orange-soft p-10 text-center">
          <p className="text-5xl">🍔🍕🧁</p>
          <p className="mt-3 text-xl font-extrabold">Seu cardápio está vazio</p>
          <p className="mx-auto mt-1 max-w-sm text-ink/80">Cadastre seu primeiro prato com foto e preço para começar a receber pedidos.</p>
          <button onClick={() => openForm()} className={`${btnCls} mt-5 inline-flex items-center gap-2`}><Plus size={20} strokeWidth={3} /> Cadastrar primeiro produto</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-52 flex-1 sm:max-w-xs">
              <span className="sr-only">Buscar produto</span>
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fur" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto…"
                className="w-full rounded-full border-2 border-fur-light bg-paper py-2 pl-11 pr-4 outline-none focus:border-orange focus:ring-4 focus:ring-orange-soft" />
            </label>
            <div className="flex flex-wrap gap-2">
              {(["TODOS", ...Object.keys(CATEGORIES)] as const).map((c) => (
                <button key={c} onClick={() => setCat(c as ProductCategory | "TODOS")} aria-pressed={cat === c}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold transition ${cat === c ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
                  {c === "TODOS" ? "Todos" : `${CATEGORIES[c as ProductCategory].emoji} ${CATEGORIES[c as ProductCategory].label}`}</button>
              ))}
            </div>
          </div>
          {products && shown.length === 0 && <p className="rounded-3xl bg-paper p-8 text-center font-bold text-fur">Nenhum produto encontrado.</p>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {shown.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
