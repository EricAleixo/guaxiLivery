"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Play, Volume2, VolumeX } from "lucide-react";
import { mediaOf, uploadSrc, type Product } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";

/** Capa estática do produto (primeira mídia) para cards e listas. */
export function Cover({ p, className = "h-44" }: { p: Pick<Product, "id" | "imageUrl" | "media" | "category" | "name">; className?: string }) {
  const media = mediaOf(p);
  const first = media[0];
  const c = CATEGORIES[p.category];
  if (!first) return <div className={`grid w-full place-items-center text-6xl ${c.tint} ${className}`}>{c.emoji}</div>;
  return (
    <div className={`relative w-full ${className}`}>
      {first.type === "VIDEO"
        ? <video src={`${uploadSrc(first.url)}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" aria-label={p.name} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={uploadSrc(first.url)!} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
      {first.type === "VIDEO" && <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 p-1.5 text-cream"><Play size={14} fill="currentColor" /></span>}
      {media.length > 1 && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/70 px-2 py-1 text-xs font-extrabold text-cream">
          <Images size={13} /> {media.length}</span>
      )}
    </div>
  );
}

/**
 * Carrossel de fotos e vídeos com rolagem horizontal (swipe no celular, setas no desktop).
 * Vídeos tocam sem som apenas enquanto o slide está visível e `active` é verdadeiro.
 */
export function MediaCarousel({ product, active = true, fit = "cover", className = "" }: {
  product: Pick<Product, "id" | "imageUrl" | "media" | "category" | "name">; active?: boolean; fit?: "cover" | "contain"; className?: string;
}) {
  const media = mediaOf(product);
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const c = CATEGORIES[product.category];

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const go = (i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (media.length === 0) {
    return <div className={`grid h-full w-full place-items-center text-9xl ${c.tint} ${className}`}>{c.emoji}</div>;
  }

  return (
    <div className={`group relative h-full w-full ${className}`}>
      <div ref={ref} onScroll={onScroll} className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {media.map((m, i) => (
          <div key={m.id} className="relative h-full w-full shrink-0 snap-center snap-always">
            {m.type === "VIDEO"
              ? <Clip src={uploadSrc(m.url)!} playing={active && i === index} muted={muted} fit={fit} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={uploadSrc(m.url)!} alt={`${product.name} (${i + 1} de ${media.length})`} loading={i === 0 ? "eager" : "lazy"}
                  draggable={false} className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`} />}
          </div>
        ))}
      </div>

      {media[index]?.type === "VIDEO" && (
        <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ligar o som" : "Desligar o som"}
          className="absolute right-3 top-3 z-[2] rounded-full bg-ink/60 p-2 text-cream hover:bg-ink/80">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      )}

      {media.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" onClick={() => go(index - 1)} aria-label="Anterior"
              className="absolute left-2 top-1/2 z-[2] hidden -translate-y-1/2 rounded-full bg-ink/60 p-2 text-cream hover:bg-ink/80 md:block"><ChevronLeft size={20} /></button>
          )}
          {index < media.length - 1 && (
            <button type="button" onClick={() => go(index + 1)} aria-label="Próxima"
              className="absolute right-2 top-1/2 z-[2] hidden -translate-y-1/2 rounded-full bg-ink/60 p-2 text-cream hover:bg-ink/80 md:block"><ChevronRight size={20} /></button>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[2] flex justify-center gap-1.5" aria-hidden>
            {media.map((m, i) => (
              <span key={m.id} className={`h-1 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-3 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Clip({ src, playing, muted, fit }: { src: string; playing: boolean; muted: boolean; fit: "cover" | "contain" }) {
  const v = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (playing && !paused) el.play().catch(() => {});
    else el.pause();
  }, [playing, paused]);

  return (
    <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"} className="relative block h-full w-full">
      <video ref={v} src={src} muted={muted} loop playsInline preload="metadata"
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`} />
      {paused && <span className="absolute inset-0 grid place-items-center"><span className="rounded-full bg-ink/60 p-4 text-cream"><Play size={32} fill="currentColor" /></span></span>}
    </button>
  );
}
