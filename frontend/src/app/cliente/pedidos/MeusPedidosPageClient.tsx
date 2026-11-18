"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type Delivery } from "@/lib/api";
import { Star } from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";
import { Loading } from "@/components/Loading";
import { useRequireRole } from "@/lib/auth";
import { Raccoon } from "@/components/Logo";
import { ClienteTabs } from "@/components/ClienteTabs";
import { DeliveryCard, ErrorBox, usePolling } from "@/components/ui";

export default function MeusPedidosPageClient() {
  const { user } = useRequireRole("CLIENTE");
  const [list, setList] = useState<Delivery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Delivery | null>(null);

  const load = useCallback(() => {
    api.myDeliveries().then((l) => { setList(l); setError(null); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);
  usePolling(() => { if (user) load(); });

  if (!user) return <Loading />;
  const active = list?.filter((d) => ["PENDENTE", "ACEITO", "EM_ROTA"].includes(d.status)) ?? [];
  const past = list?.filter((d) => !active.includes(d)) ?? [];

  return (
    <div className="mx-auto max-w-[90rem] space-y-8 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Meus pedidos</h1>
        <ClienteTabs />
      </div>
      <ErrorBox message={error} />
      {!list && !error && <Loading label="Buscando seus pedidos…" />}
      {list && list.length === 0 && (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <Raccoon className="mx-auto h-20 w-20" />
          <p className="mt-2 text-lg font-bold">Nenhum pedido ainda. Escolha algo gostoso no feed!</p>
        </div>
      )}
      {active.length > 0 && <Grid title="Em andamento" items={active} onReview={setReviewing} />}
      {past.length > 0 && <Grid title="Histórico" items={past} onReview={setReviewing} />}
      {reviewing && <ReviewModal d={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(); }} />}
    </div>
  );
}

function Grid({ title, items, onReview }: { title: string; items: Delivery[]; onReview: (d: Delivery) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((d) => (
        <DeliveryCard key={d.id} d={d}>
          {d.status === "ENTREGUE" && d.productId && (d.reviewed
            ? <p className="flex items-center gap-1 text-sm font-bold text-mint"><Star size={16} className="fill-current" /> Você já avaliou este pedido</p>
            : <button onClick={() => onReview(d)} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange px-4 py-2 font-extrabold text-orange-dark hover:bg-orange-soft"><Star size={18} /> Avaliar pedido</button>)}
        </DeliveryCard>
      ))}</div>
    </section>
  );
}
