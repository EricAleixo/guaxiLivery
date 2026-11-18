"use client";
import Link from "next/link";
import { Check, Clock, Star } from "lucide-react";
import { mediaOf, uploadSrc, type FeedItem } from "@/lib/api";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/Avatar";

/**
 * Card de prato no estilo "lista de tarefas": etiquetas, título, linha com ícone,
 * rodapé com autor e avatares sobrepostos. O destaque (`highlight`) fica laranja, os demais brancos.
 */
export function DishCard({ item, highlight = false, actionLabel = "Pedir", actionIcon }: {
  item: FeedItem; highlight?: boolean; actionLabel?: string; actionIcon?: React.ReactNode;
}) {
  const { product: p, company } = item;
  const bag = useBag();
  const inBag = bag.items.find((b) => b.productId === p.id)?.qty ?? 0;
  const c = CATEGORIES[p.category];
  const media = mediaOf(p).slice(0, 3);
  const pill = `rounded-full border px-3 py-0.5 text-xs font-bold ${highlight ? "border-white/80" : "border-ink/70"}`;

  return (
    <article className={`animate-pop flex flex-col gap-3 rounded-[1.75rem] p-4 sm:p-5 ${highlight ? "bg-orange text-white" : "bg-white text-ink"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          <span className={pill}>{c.emoji} {c.label}</span>
          <span className={`${pill} max-w-[9rem] truncate`}>{company.tradeName}</span>
        </div>
        <span className={`shrink-0 text-sm font-extrabold ${highlight ? "text-white" : "text-orange-dark"}`}>{brl(p.price)}</span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-extrabold leading-tight"><Link href={`/cliente/produto/${p.id}`} className="hover:underline">{p.name}</Link></h3>
        <p className={`flex items-center gap-2 text-sm ${highlight ? "text-white/85" : "text-ink/55"}`}>
          {item.ratingAvg != null
            ? <><Star size={16} className={highlight ? "fill-white" : "fill-sun text-sun"} /> {item.ratingAvg.toFixed(1)} · {item.ratingCount} avaliaç{item.ratingCount === 1 ? "ão" : "ões"}</>
            : <><Clock size={16} /> Publicado {timeAgo(p.createdAt)}</>}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <p className={`min-w-0 truncate text-sm ${highlight ? "text-white/85" : "text-ink/55"}`}>Vendido por <b className={highlight ? "text-white" : "text-ink"}>{company.tradeName}</b></p>
        <div className="flex shrink-0 -space-x-2.5">
          <Avatar url={company.logoUrl} name={company.tradeName} className={`h-9 w-9 ring-2 ${highlight ? "ring-orange" : "ring-white"}`} />
          {media.map((m) => (
            <span key={m.id} className={`h-9 w-9 overflow-hidden rounded-full bg-ink ring-2 ${highlight ? "ring-orange" : "ring-white"}`}>
              {m.type === "VIDEO"
                ? <video src={`${uploadSrc(m.url)}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={uploadSrc(m.url)!} alt="" className="h-full w-full object-cover" loading="lazy" />}
            </span>
          ))}
        </div>
      </div>

      <button onClick={() => bag.add(item)}
        className={`flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold transition active:scale-[.98] ${highlight ? "bg-white text-orange-dark" : "bg-orange text-white"}`}>
        {inBag > 0 ? <><Check size={16} /> Na sacola ({inBag})</> : <>{actionIcon} {actionLabel}</>}</button>
    </article>
  );
}
