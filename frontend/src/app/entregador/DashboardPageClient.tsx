"use client";
import { useState } from "react";
import { Bike, CircleCheck, Hand, Inbox, Moon, Package, Undo2 } from "lucide-react";
import { Loading } from "@/components/Loading";
import { DeliveryCard } from "@/components/ui";
import { useEntregador } from "@/lib/entregador";
import type { Delivery } from "@/lib/api";

const sameDay = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Bike; label: string; value: number; tone: string }) {
  return (
    <div className="animate-pop flex items-center gap-3 rounded-3xl border-2 border-fur-light bg-paper p-4">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={24} /></span>
      <div><p className="text-2xl font-extrabold tabular-nums leading-none">{value}</p><p className="text-sm font-bold text-fur">{label}</p></div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl bg-orange-soft p-8 text-center">
      <Moon size={36} className="mx-auto text-orange" /><p className="mt-2 font-bold">{text}</p>
    </div>
  );
}

const btn = "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 font-extrabold disabled:opacity-50";

export default function DashboardPageClient() {
  const { available, mine, busyId, claim, release, move, profile } = useEntregador();
  const [tab, setTab] = useState<"andamento" | "historico">("andamento");
  if (!available || !mine) return <Loading label="Buscando entregas…" />;

  const active = mine.filter((d) => d.status === "ACEITO" || d.status === "EM_ROTA");
  const done = mine.filter((d) => d.status === "ENTREGUE");
  const today = done.filter((d) => sameDay(d.createdAt)).length;

  const actions = (d: Delivery) => (
    <div className="flex gap-2">
      {d.status === "ACEITO" && (
        <>
          <button disabled={busyId === d.id} onClick={() => move(d, "EM_ROTA")} className={`${btn} bg-orange text-white hover:bg-orange-dark`}><Bike size={18} /> Saí para entrega</button>
          <button disabled={busyId === d.id} onClick={() => confirm("Desistir desta entrega?") && release(d)}
            className="flex items-center gap-1 rounded-full border-2 border-berry px-4 py-2 font-bold text-berry hover:bg-berry-soft disabled:opacity-50"><Undo2 size={16} /> Desistir</button>
        </>
      )}
      {d.status === "EM_ROTA" && (
        <button disabled={busyId === d.id} onClick={() => confirm("Confirmar que o pedido foi entregue?") && move(d, "ENTREGUE")}
          className={`${btn} bg-mint text-white hover:opacity-90`}><CircleCheck size={18} /> Entreguei</button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold">Olá, {profile?.name.split(" ")[0] ?? "motoboy"}!</h1>
        <p className="text-fur">Atualizamos sozinhos a cada 10 segundos.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="Disponíveis" value={available.length} tone="bg-sun/30 text-[#8a5a00]" />
        <Stat icon={Bike} label="Em andamento" value={active.length} tone="bg-sky-soft text-sky" />
        <Stat icon={CircleCheck} label="Entregues hoje" value={today} tone="bg-mint-soft text-mint" />
        <Stat icon={Package} label="Total entregue" value={done.length} tone="bg-orange-soft text-orange-dark" />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Pedidos para pegar</h2>
        {available.length === 0 ? <Empty text="Nenhum pedido aguardando entregador agora." /> : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {available.map((d) => (
              <DeliveryCard key={d.id} d={d} showClient>
                <button disabled={busyId === d.id} onClick={() => claim(d)} className={`${btn} w-full bg-orange text-white hover:bg-orange-dark`}><Hand size={18} /> Pegar entrega</button>
              </DeliveryCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div role="tablist" className="flex gap-2">
          {([["andamento", `Minhas entregas (${active.length})`], ["historico", `Histórico (${mine.length - active.length})`]] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${tab === id ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>{label}</button>
          ))}
        </div>
        {(() => {
          const list = tab === "andamento" ? active : mine.filter((d) => d.status === "ENTREGUE" || d.status === "CANCELADO");
          return list.length === 0 ? <Empty text={tab === "andamento" ? "Você não tem entregas em andamento." : "Nada no histórico ainda."} /> : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {list.map((d) => <DeliveryCard key={d.id} d={d} showClient>{tab === "andamento" && actions(d)}</DeliveryCard>)}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
