"use client";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, ShoppingBag, Star } from "lucide-react";
import type { FeedItem } from "@/lib/api";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { MediaCarousel } from "@/components/MediaCarousel";

/** Um "post" do feed vertical estilo TikTok: mídia em tela cheia + informações por cima. */
export function ReelPost({ item, active, onAdded, onNext, last }: {
  item: FeedItem; active: boolean; onAdded?: () => void; onNext?: () => void; last?: boolean;
}) {
  const { product: p, company } = item;
  const bag = useBag();
  const inBag = bag.items.find((b) => b.productId === p.id)?.qty ?? 0;
  const c = CATEGORIES[p.category];
  const href = `/cliente/produto/${p.id}`;

  return (
    <article data-post={p.id} className="relative h-full w-full shrink-0 snap-start snap-always bg-ink">
      <div className="relative mx-auto h-full w-full max-w-[30rem] overflow-hidden bg-ink">
        <MediaCarousel product={p} active={active} />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-16 space-y-2 p-4 pb-5 text-white">
          <Link href={href} className="flex items-center gap-2 text-sm font-extrabold hover:underline">
            <Avatar url={company.logoUrl} name={company.tradeName} className="h-9 w-9 ring-2 ring-white" /> {company.tradeName}</Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-extrabold backdrop-blur">{c.emoji} {c.label}</span>
            {item.ratingAvg != null && (
              <span className="flex items-center gap-1 text-xs font-bold"><Star size={13} className="fill-sun text-sun" /> {item.ratingAvg.toFixed(1)} ({item.ratingCount})</span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold leading-tight drop-shadow">{p.name}</h2>
          {p.description && <p className="line-clamp-3 text-sm text-white/90">{p.description}</p>}
          <div className="flex items-center gap-3 pt-1">
            <span className="rounded-full bg-sun px-4 py-1.5 text-lg font-extrabold text-ink">{brl(p.price)}</span>
            <button onClick={() => { bag.add(item); onAdded?.(); }}
              className="flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 font-extrabold text-white shadow-[0_3px_0_var(--color-orange-dark)] transition active:translate-y-0.5 active:shadow-none">
              {inBag > 0 ? <><Check size={18} /> Na sacola ({inBag})</> : <><ShoppingBag size={18} /> Pedir</>}
            </button>
          </div>
        </div>

        <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-white">
          <Link href={href} aria-label={`Ver detalhes de ${p.name}`} className="flex flex-col items-center gap-1 text-xs font-bold">
            <span className="rounded-full bg-white/20 p-3 backdrop-blur hover:bg-white/30"><ExternalLink size={22} /></span>Detalhes</Link>
          {!last && onNext && (
            <button type="button" onClick={onNext} aria-label="Próximo prato" className="flex flex-col items-center gap-1 text-xs font-bold">
              <span className="rounded-full bg-white/20 p-3 backdrop-blur hover:bg-white/30"><ChevronDown size={22} /></span>Próximo</button>
          )}
        </div>
      </div>
    </article>
  );
}
