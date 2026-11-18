"use client";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/api";
import { Cover } from "@/components/MediaCarousel";
import { brl, CATEGORIES } from "@/lib/format";
import { useEmpresa } from "@/lib/empresa";

export function ProductCard({ p }: { p: Product }) {
  const { toggle, remove, openForm } = useEmpresa();
  const c = CATEGORIES[p.category];
  return (
    <article className={`animate-pop overflow-hidden rounded-3xl border-2 border-fur-light bg-paper transition hover:-translate-y-0.5 ${p.available ? "" : "opacity-75"}`}>
      <div className="relative">
        <Cover p={p} className={`h-40 ${p.available ? "" : "grayscale"}`} />
        <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-3 py-1 text-xs font-extrabold">{c.emoji} {c.label}</span>
        {!p.available && <span className="absolute right-3 top-3 rounded-full bg-berry px-3 py-1 text-xs font-extrabold text-white">Pausado</span>}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-extrabold leading-tight">{p.name}</h3>
          <span className="shrink-0 rounded-full bg-sun/30 px-3 py-1 text-sm font-extrabold text-[#8a5a00]">{brl(p.price)}</span>
        </div>
        {p.description && <p className="line-clamp-2 text-sm text-ink/80">{p.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <button role="switch" aria-checked={p.available} onClick={() => toggle(p)} className="flex items-center gap-2 text-sm font-bold">
            <span className={`relative h-6 w-11 rounded-full transition ${p.available ? "bg-mint" : "bg-fur-light"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.available ? "left-[22px]" : "left-0.5"}`} /></span>
            {p.available ? "Disponível" : "Pausado"}
          </button>
          <div className="flex gap-1">
            <button onClick={() => openForm(p)} aria-label={`Editar ${p.name}`} className="rounded-full p-2 hover:bg-orange-soft"><Pencil size={18} /></button>
            <button onClick={() => remove(p)} aria-label={`Remover ${p.name}`} className="rounded-full p-2 text-berry hover:bg-berry-soft"><Trash2 size={18} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}
