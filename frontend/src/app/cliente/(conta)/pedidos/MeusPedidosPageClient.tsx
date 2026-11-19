"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type Delivery } from "@/lib/api";
import { Flame, History, Motorbike, PartyPopper, Receipt, Star, type LucideIcon } from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";
import { Loading } from "@/components/Loading";
import { useRequireRole } from "@/lib/auth";
import { Raccoon } from "@/components/Logo";
import { OrderCard } from "@/components/OrderCard";
import { ErrorBox, usePolling } from "@/components/ui";

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Meus pedidos</h1>
          <p className="font-semibold text-fur">{user.name ? `${user.name.split(" ")[0]}, ` : ""}acompanhe tudo daqui — atualizamos sozinhos</p>
        </div>
      </div>
      <ErrorBox message={error} />
      {!list && !error && <Loading label="Buscando seus pedidos…" />}
      {list && list.length === 0 && (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <Raccoon className="mx-auto h-20 w-20" />
          <p className="mt-2 text-lg font-bold">Nenhum pedido ainda. Escolha algo gostoso no feed!</p>
        </div>
      )}
      {list && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {([[Motorbike, active.length, "A caminho"], [PartyPopper, list.filter((d) => d.status === "ENTREGUE").length, "Entregues"], [Receipt, list.length, "Pedidos"]] as [LucideIcon, number, string][]).map(([Icon, n, l]) => (
            <div key={l} className="rounded-3xl border-2 border-fur-light bg-paper py-3">
              <Icon size={24} className="mx-auto text-orange" aria-hidden />
              <p className="font-display text-2xl font-extrabold leading-none">{n}</p>
              <p className="text-xs font-bold text-fur">{l}</p>
            </div>
          ))}
        </div>
      )}
      {active.length > 0 && <Grid title="Em andamento" icon={Flame} items={active} onReview={setReviewing} />}
      {past.length > 0 && <Grid title="Histórico" icon={History} items={past} onReview={setReviewing} />}
      {reviewing && <ReviewModal d={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); load(); }} />}
    </div>
  );
}

function Grid({ title, icon: Icon, items, onReview }: { title: string; icon: LucideIcon; items: Delivery[]; onReview: (d: Delivery) => void }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold"><Icon size={20} className="text-orange" /> {title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((d) => (
        <OrderCard key={d.id} d={d}>
          {d.status === "ENTREGUE" && d.productId && (d.reviewed
            ? <p className="flex items-center gap-1 text-sm font-bold text-mint"><Star size={16} className="fill-current" /> Você já avaliou este pedido</p>
            : <button onClick={() => onReview(d)} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange px-4 py-2 font-extrabold text-orange-dark hover:bg-orange-soft"><Star size={18} /> Avaliar pedido</button>)}
        </OrderCard>
      ))}</div>
    </section>
  );
}
