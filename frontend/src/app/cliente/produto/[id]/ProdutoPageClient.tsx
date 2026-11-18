"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, MapPin, Minus, Phone, Plus, ShoppingBag } from "lucide-react";
import { api, type FeedItem, type ProductReviews } from "@/lib/api";
import { useRequireRole } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES, timeAgo } from "@/lib/format";
import { FeedCard } from "@/components/FeedCard";
import { Loading } from "@/components/Loading";
import { Raccoon } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { ReviewItem } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { btnCls, ErrorBox } from "@/components/ui";
import { MediaCarousel } from "@/components/MediaCarousel";

export default function ProdutoPageClient() {
  const { user } = useRequireRole("CLIENTE");
  const { id } = useParams<{ id: string }>();
  const bag = useBag();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<ProductReviews | null>(null);

  useEffect(() => {
    if (user) api.feed().then(setItems).catch((e) => setError(e.message));
  }, [user]);

  useEffect(() => {
    if (user) api.productReviews(Number(id)).then(setReviews).catch(() => {});
  }, [user, id]);

  const item = items?.find((i) => String(i.product.id) === id);
  const sameCompany = useMemo(
    () => (items ?? []).filter((i) => item && i.company.id === item.company.id && i.product.id !== item.product.id), [items, item]);
  const sameCategory = useMemo(
    () => (items ?? []).filter((i) => item && i.company.id !== item.company.id && i.product.category === item.product.category).slice(0, 4), [items, item]);

  if (!user) return <Loading />;

  const back = (
    <Link href="/cliente/feed" className="inline-flex items-center gap-1 font-extrabold text-orange-dark hover:underline"><ArrowLeft size={18} /> Voltar ao feed</Link>
  );

  if (!items && !error) return <Loading label="Abrindo o prato…" />;
  if (!item) {
    return (
      <div className="mx-auto max-w-[90rem] space-y-6 px-4 py-8 sm:px-8">
        {back}
        <ErrorBox message={error} />
        {!error && (
          <div className="rounded-3xl bg-orange-soft p-10 text-center">
            <Raccoon className="mx-auto h-20 w-20" />
            <p className="mt-2 text-lg font-bold">Esse produto não está mais disponível.</p>
          </div>
        )}
      </div>
    );
  }

  const { product: p, company } = item;
  const c = CATEGORIES[p.category];
  const inBag = bag.items.find((b) => b.productId === p.id)?.qty ?? 0;

  return (
    <div className="mx-auto max-w-[90rem] space-y-10 px-4 py-8 sm:px-8">
      {back}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border-2 border-fur-light bg-paper">
          <div className="aspect-[4/3] bg-ink"><MediaCarousel product={p} fit="contain" /></div>
        </div>

        <div className="space-y-5">
          <span className="inline-block rounded-full bg-orange-soft px-3 py-1 text-sm font-extrabold">{c.emoji} {c.label}</span>
          <h1 className="text-4xl font-extrabold leading-tight">{p.name}</h1>
          <p className="text-3xl font-extrabold text-orange-dark">{brl(p.price)}</p>
          {reviews && (reviews.average != null
            ? <a href="#avaliacoes" className="flex items-center gap-2 font-bold"><Stars value={reviews.average} size={20} /> {reviews.average.toFixed(1)} · {reviews.count} avaliaç{reviews.count === 1 ? "ão" : "ões"}</a>
            : <p className="text-sm text-fur">Ainda sem avaliações.</p>)}
          <p className="whitespace-pre-line text-ink/80">{p.description || "A empresa não adicionou uma descrição para este produto."}</p>
          <p className="flex items-center gap-1 text-sm text-fur"><Clock size={15} /> Publicado {timeAgo(p.createdAt)}</p>

          <div className="space-y-3 rounded-3xl border-2 border-fur-light bg-paper p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos" className="rounded-full border-2 border-fur-light p-2 hover:bg-orange-soft"><Minus size={16} /></button>
                <span className="w-8 text-center text-lg font-extrabold">{qty}</span>
                <button type="button" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="Mais" className="rounded-full border-2 border-fur-light p-2 hover:bg-orange-soft"><Plus size={16} /></button>
              </div>
              <span className="text-lg font-extrabold">{brl(p.price * qty)}</span>
            </div>
            <button onClick={() => { bag.add(item, qty); setAdded(true); }} className={`${btnCls} flex w-full items-center justify-center gap-2`}>
              <ShoppingBag size={18} /> Adicionar à sacola</button>
            {(added || inBag > 0) && (
              <p role="status" className="flex items-center gap-1 text-sm font-bold text-mint">
                <Check size={16} /> {inBag} na sacola · <Link href="/cliente/sacola" className="underline">ver sacola</Link></p>
            )}
          </div>

          <section className="space-y-2 rounded-3xl bg-orange-soft p-4">
            <h2 className="flex items-center gap-3 text-lg font-extrabold"><Avatar url={company.logoUrl} name={company.tradeName} className="h-12 w-12" /> {company.tradeName}</h2>
            {company.description && <p className="text-sm text-ink/80">{company.description}</p>}
            <ul className="space-y-1 text-sm">
              {company.address && <li className="flex items-center gap-2"><MapPin size={15} className="text-orange" /> {company.address}</li>}
              {company.phone && <li className="flex items-center gap-2"><Phone size={15} className="text-orange" /> {company.phone}</li>}
            </ul>
          </section>
        </div>
      </div>

      <section id="avaliacoes" className="space-y-3">
        <h2 className="text-2xl font-extrabold">Avaliações e comentários</h2>
        {!reviews || reviews.count === 0
          ? <p className="rounded-2xl bg-orange-soft p-4 font-bold">Ninguém avaliou este produto ainda. Peça e seja o primeiro!</p>
          : <div className="grid gap-3 xl:grid-cols-2">{reviews.reviews.map((r) => <ReviewItem key={r.id} r={r} />)}</div>}
      </section>

      {sameCompany.length > 0 && <Related title={`Mais de ${company.tradeName}`} list={sameCompany} />}
      {sameCategory.length > 0 && <Related title={`Outros ${c.label.toLowerCase()}s que você pode gostar`} list={sameCategory} />}
    </div>
  );
}

function Related({ title, list }: { title: string; list: FeedItem[] }) {
  return (
    <section>
      <h2 className="mb-3 text-2xl font-extrabold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {list.map((i) => <FeedCard key={i.product.id} item={i} />)}
      </div>
    </section>
  );
}
