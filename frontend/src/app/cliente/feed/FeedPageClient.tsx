"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, LayoutGrid, X } from "lucide-react";
import { api, type FeedItem, type ProductCategory } from "@/lib/api";
import { ReelPost } from "@/components/ReelPost";
import { Loading } from "@/components/Loading";
import { useRequireRole } from "@/lib/auth";
import { CATEGORIES } from "@/lib/format";
import { Raccoon } from "@/components/Logo";
import { ErrorBox, usePolling } from "@/components/ui";

/** Feed vertical estilo TikTok: um prato por vez, com carrossel de fotos e vídeos. */
export default function FeedPageClient() {
  const { user } = useRequireRole("CLIENTE");
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.feed().then((l) => { setItems(l); setError(null); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);
  usePolling(() => { if (user) load(); }, 60000);

  const shown = useMemo(() => (items ?? []).filter((i) => !category || i.product.category === category), [items, category]);
  const firstId = shown[0]?.product.id ?? null;

  // O post visível (>= 60%) é o "ativo": só ele toca vídeo.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setActiveId(Number((e.target as HTMLElement).dataset.post));
      }
    }, { root, threshold: 0.6 });
    root.querySelectorAll("[data-post]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const step = useCallback((dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!user) return <Loading />;

  const empty = items && shown.length === 0;

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[32rem] bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-3 pb-6 pt-3">
        <div className="pointer-events-auto mx-auto flex w-full max-w-[30rem] items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Categorias">
            <Chip active={!category} onClick={() => setCategory(null)}>Pra você</Chip>
            {(Object.keys(CATEGORIES) as ProductCategory[]).map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</Chip>
            ))}
          </div>
          <Link href="/cliente/todos" aria-label="Ver todos os pratos em lista"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-ink hover:bg-sun">
            <LayoutGrid size={16} /> <span className="hidden sm:inline">Ver tudo</span></Link>
        </div>
      </div>

      {(notice || error) && (
        <div className="absolute inset-x-0 top-14 z-10 mx-auto w-full max-w-[28rem] space-y-2 px-3">
          {notice && (
            <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-mint-soft px-4 py-2.5 text-sm font-bold">
              <span>{notice} <Link href="/cliente/sacola" className="underline">Ver sacola</Link></span>
              <button onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={16} /></button>
            </div>
          )}
          <ErrorBox message={error} />
        </div>
      )}

      {!items && !error ? <div className="grid h-full place-items-center bg-cream"><Loading label="Buscando comidinhas…" /></div> : empty ? (
        <div className="grid h-full place-items-center bg-cream p-6">
          <div className="rounded-3xl bg-orange-soft p-10 text-center">
            <Raccoon className="mx-auto h-20 w-20" />
            <p className="mt-2 text-lg font-bold">
              {items.length === 0 ? "Nenhuma empresa publicou produtos ainda." : "Nada nessa categoria por enquanto."}</p>
          </div>
        </div>
      ) : (
        <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shown.map((i, n) => (
            <ReelPost key={i.product.id} item={i} active={(activeId ?? firstId) === i.product.id}
              last={n === shown.length - 1} onNext={() => step(1)}
              onAdded={() => setNotice(`${i.product.name} foi para a sacola.`)} />
          ))}
          <EndOfFeed onTop={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })} />
        </div>
      )}
    </div>
  );
}

function EndOfFeed({ onTop }: { onTop: () => void }) {
  return (
    <section className="grid h-full w-full shrink-0 snap-start place-items-center bg-ink px-6 text-center text-cream">
      <div className="space-y-4">
        <div className="relative mx-auto w-fit">
          <Raccoon className="animate-hop mx-auto h-28 w-28" />
          <span className="animate-shadow mx-auto mt-2 block h-2 w-20 rounded-full bg-black" />
        </div>
        <h2 className="text-3xl font-extrabold">Você chegou ao fim!</h2>
        <p className="text-cream/70">O guaxinim já mostrou todos os pratos por hoje.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button onClick={onTop} className="flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 font-extrabold text-white">
            <ArrowUp size={18} /> Voltar ao início</button>
          <Link href="/cliente/todos" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-extrabold text-ink">
            <LayoutGrid size={18} /> Ver tudo</Link>
        </div>
      </div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-extrabold transition ${active ? "bg-orange text-white" : "bg-black/40 text-white backdrop-blur hover:bg-black/60"}`}>
      {children}</button>
  );
}
