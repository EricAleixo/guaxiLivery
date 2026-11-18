"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Trash2, Utensils } from "lucide-react";
import { api, ApiError, API_URL } from "@/lib/api";
import { Loading } from "@/components/Loading";
import { useRequireRole } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES } from "@/lib/format";
import { ClienteTabs } from "@/components/ClienteTabs";
import { Raccoon } from "@/components/Logo";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";

export default function SacolaPageClient() {
  const { user } = useRequireRole("CLIENTE");
  const bag = useBag();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <Loading />;

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    // um pedido por produto; o que já foi enviado sai da sacola mesmo que um item falhe
    for (const i of [...bag.items]) {
      try {
        await api.order({ productId: i.productId, quantity: i.qty, deliveryAddress: address, description: notes || undefined });
        bag.remove(i.productId);
      } catch (err) {
        setError(`${i.name}: ${err instanceof ApiError ? err.message : "erro inesperado."}`);
        setBusy(false);
        return;
      }
    }
    router.push("/cliente/pedidos");
  }

  const byCompany = Object.entries(Object.groupBy(bag.items, (i) => i.companyName));

  return (
    <div className="mx-auto max-w-[90rem] space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Sacola</h1>
        <ClienteTabs />
      </div>

      {bag.items.length === 0 ? (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <Raccoon className="mx-auto h-20 w-20" />
          <p className="mt-2 text-lg font-bold">Sua sacola está vazia.</p>
          <Link href="/cliente/feed" className={`${btnCls} mt-4 inline-flex items-center gap-2`}><Utensils size={18} /> Ver o feed</Link>
        </div>
      ) : (
        <form onSubmit={checkout} className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="space-y-5">
            {byCompany.map(([company, list]) => (
              <section key={company} className="space-y-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-fur">{company}</h2>
                {list?.map((i) => {
                  const c = CATEGORIES[i.category];
                  return (
                    <article key={i.productId} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-fur-light bg-paper p-3">
                      {i.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={`${API_URL}${i.imageUrl}`} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                        : <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl text-3xl ${c.tint}`}>{c.emoji}</div>}
                      <div className="min-w-[8rem] flex-1">
                        <h3 className="truncate font-extrabold">{i.name}</h3>
                        <p className="text-sm text-fur">{brl(i.price)} cada</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => bag.setQty(i.productId, i.qty - 1)} aria-label={`Menos ${i.name}`} className="rounded-full border-2 border-fur-light p-1.5 hover:bg-orange-soft"><Minus size={14} /></button>
                        <span className="w-7 text-center font-extrabold">{i.qty}</span>
                        <button type="button" onClick={() => bag.setQty(i.productId, i.qty + 1)} aria-label={`Mais ${i.name}`} className="rounded-full border-2 border-fur-light p-1.5 hover:bg-orange-soft"><Plus size={14} /></button>
                      </div>
                      <span className="ml-auto w-20 text-right font-extrabold">{brl(i.price * i.qty)}</span>
                      <button type="button" onClick={() => bag.remove(i.productId)} aria-label={`Remover ${i.name}`} className="rounded-full p-2 text-berry hover:bg-berry-soft"><Trash2 size={18} /></button>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>

          <aside className="h-fit space-y-4 rounded-3xl border-2 border-fur-light bg-paper p-5 lg:sticky lg:top-24">
            <Field label="Endereço de entrega">
              <input className={inputCls} required maxLength={255} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" /></Field>
            <Field label="Observações">
              <textarea className={inputCls} rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sem cebola, tocar a campainha…" /></Field>
            <div className="flex items-center justify-between border-t-2 border-dashed border-fur-light pt-3 text-lg font-extrabold">
              <span>Total</span><span>{brl(bag.total)}</span>
            </div>
            <ErrorBox message={error} />
            <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Enviando…" : "Finalizar pedido"}</button>
          </aside>
        </form>
      )}
    </div>
  );
}
