"use client";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { FeedItem } from "@/lib/api";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES } from "@/lib/format";
import { btnCls } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { Cover } from "@/components/MediaCarousel";

export function FeedCard({ item, onAdded }: { item: FeedItem; onAdded?: () => void }) {
  const { product: p, company } = item;
  const bag = useBag();
  const inBag = bag.items.find((b) => b.productId === p.id)?.qty ?? 0;
  const c = CATEGORIES[p.category];
  const href = `/cliente/produto/${p.id}`;
  return (
    <article className="animate-pop flex flex-col overflow-hidden rounded-3xl border-2 border-fur-light bg-paper transition hover:-translate-y-0.5">
      <Link href={href} className="relative block" aria-label={`Ver detalhes de ${p.name}`}>
        <Cover p={p} className="h-44" />
        <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-3 py-1 text-xs font-extrabold">{c.emoji} {c.label}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-fur"><Avatar url={company.logoUrl} name={company.tradeName} className="h-5 w-5" /> {company.tradeName}</p>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-extrabold leading-tight"><Link href={href} className="hover:underline">{p.name}</Link></h3>
          <span className="shrink-0 rounded-full bg-sun/30 px-3 py-1 text-sm font-extrabold text-[#8a5a00]">{brl(p.price)}</span>
        </div>
        {item.ratingAvg != null && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-fur"><Stars value={item.ratingAvg} size={14} /> {item.ratingAvg.toFixed(1)} ({item.ratingCount})</p>
        )}
        {p.description && <p className="line-clamp-2 text-sm text-ink/80">{p.description}</p>}
        <button onClick={() => { bag.add(item); onAdded?.(); }} className={`${btnCls} mt-auto flex items-center justify-center gap-2`}>
          {inBag > 0 ? <><Check size={18} /> Na sacola ({inBag}) · adicionar mais</> : <><ShoppingBag size={18} /> Adicionar à sacola</>}</button>
      </div>
    </article>
  );
}
