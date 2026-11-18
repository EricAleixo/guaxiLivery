"use client";
import { useEffect, useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { api, type Review } from "@/lib/api";
import { Loading } from "@/components/Loading";
import { ReviewItem } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { ErrorBox } from "@/components/ui";

const avg = (l: Review[]) => l.reduce((s, r) => s + r.rating, 0) / l.length;

export default function AvaliacoesPageClient() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<number | null>(null);

  useEffect(() => { api.companyReviews().then(setReviews).catch((e) => setError(e.message)); }, []);

  const byProduct = useMemo(() => {
    const m = new Map<number, { name: string; list: Review[] }>();
    reviews?.forEach((r) => { const e = m.get(r.productId) ?? { name: r.productName, list: [] }; e.list.push(r); m.set(r.productId, e); });
    return [...m.entries()].map(([id, v]) => ({ id, ...v }));
  }, [reviews]);

  const shown = product ? reviews?.filter((r) => r.productId === product) : reviews;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">Avaliações</h1>
        <p className="text-fur">O que os clientes acharam depois de receber o pedido.</p>
      </header>
      <ErrorBox message={error} />
      {!reviews && !error && <Loading label="Buscando avaliações…" />}

      {reviews && reviews.length === 0 && (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <MessageSquareText size={40} className="mx-auto text-orange" />
          <p className="mt-2 text-lg font-bold">Ainda não há avaliações. Elas aparecem quando um pedido entregue é avaliado.</p>
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-fur-light bg-paper p-4">
            <span className="text-4xl font-extrabold">{avg(reviews).toFixed(1)}</span>
            <div><Stars value={avg(reviews)} size={20} /><p className="text-sm text-fur">{reviews.length} avaliaç{reviews.length === 1 ? "ão" : "ões"} no total</p></div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtrar por produto">
            <button onClick={() => setProduct(null)} aria-pressed={!product}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${!product ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>Todos os produtos</button>
            {byProduct.map((p) => (
              <button key={p.id} onClick={() => setProduct(product === p.id ? null : p.id)} aria-pressed={product === p.id}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${product === p.id ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
                {p.name} · ★ {avg(p.list).toFixed(1)} ({p.list.length})</button>
            ))}
          </div>
          <div className="grid gap-3 xl:grid-cols-2">{shown?.map((r) => <ReviewItem key={r.id} r={r} showProduct={!product} />)}</div>
        </>
      )}
    </div>
  );
}
