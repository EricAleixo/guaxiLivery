"use client";
import { Loading } from "@/components/Loading";
import { useState } from "react";
import { Moon } from "lucide-react";
import { DeliveryCard } from "@/components/ui";
import { OrderActions } from "@/components/OrderActions";
import { useEmpresa } from "@/lib/empresa";
import type { Delivery } from "@/lib/api";

const TABS = [
  { id: "novos", label: "Novos", test: (d: Delivery) => d.status === "PENDENTE" },
  { id: "andamento", label: "Em andamento", test: (d: Delivery) => d.status === "ACEITO" || d.status === "EM_ROTA" },
  { id: "finalizados", label: "Finalizados", test: (d: Delivery) => d.status === "ENTREGUE" || d.status === "CANCELADO" },
] as const;

export default function PedidosPageClient() {
  const { deliveries } = useEmpresa();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("novos");
  const current = TABS.find((t) => t.id === tab)!;
  const items = deliveries?.filter(current.test) ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">Pedidos</h1>
        <p className="text-fur">Atualizamos sozinhos a cada 10 segundos.</p>
      </header>
      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = deliveries?.filter(t.test).length ?? 0;
          return (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${tab === t.id ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
              {t.label} <span className={tab === t.id ? "text-white/90" : "text-fur"}>({n})</span>
            </button>
          );
        })}
      </div>
      {!deliveries ? <Loading label="Buscando pedidos…" /> : items.length === 0 ? (
        <div className="rounded-3xl bg-orange-soft p-10 text-center">
          <Moon size={40} className="mx-auto text-orange" />
          <p className="mt-2 text-lg font-bold">Nenhum pedido aqui por enquanto.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((d) => <DeliveryCard key={d.id} d={d} showClient><OrderActions d={d} /></DeliveryCard>)}
        </div>
      )}
    </div>
  );
}
