"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, CircleCheck, Bike, MessageCircle } from "lucide-react";
import type { Delivery, DeliveryStatus } from "@/lib/api";
import { useEmpresa } from "@/lib/empresa";
import { CourierSelect } from "./CourierSelect";

const NEXT: Partial<Record<DeliveryStatus, { to: DeliveryStatus; label: string; icon: typeof Check }>> = {
  PENDENTE: { to: "ACEITO", label: "Aceitar pedido", icon: Check },
  ACEITO: { to: "EM_ROTA", label: "Saiu para entrega", icon: Bike },
  EM_ROTA: { to: "ENTREGUE", label: "Marcar entregue", icon: CircleCheck },
};

export function OrderActions({ d }: { d: Delivery }) {
  const { move, assign, busyId, couriers } = useEmpresa();
  const [pick, setPick] = useState("");
  const n = NEXT[d.status];
  const active = couriers?.filter((l) => l.status === "ATIVO") ?? [];
  if (!n) return null;
  return (
    <div className="space-y-2">
      {d.courier && (
        <p className="flex items-center gap-1 text-sm font-bold"><Bike size={16} className="text-orange" />Motoboy: {d.courier.name}{d.courier.phone && ` · ${d.courier.phone}`}</p>
      )}
      {/* No celular o motoboy é escolhido aqui; no desktop, arrastando o card até a barra lateral. */}
      {d.status === "PENDENTE" && active.length > 0 && (
        <div className="space-y-1 lg:hidden">
          <p className="text-sm font-bold">Motoboy (opcional)</p>
          <CourierSelect value={pick || null} onChange={(id) => setPick(id ?? "")} freeLabel="Deixar os motoboys escolherem" />
        </div>
      )}
      {(d.status === "ACEITO" || d.status === "EM_ROTA") && active.length > 0 && (
        <div className="space-y-1 lg:hidden">
          <p className="text-sm font-bold">Trocar motoboy</p>
          <CourierSelect value={d.courier?.id ?? null} onChange={(id) => assign(d, id)} freeLabel="Sem motoboy" disabled={busyId === d.id} exceptId={d.id} />
        </div>
      )}
    <div className="flex gap-2">
      <Link href={`/empresa/chats?d=${d.id}&c=EMPRESA`} aria-label="Conversar com o cliente" title="Conversar com o cliente"
        className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full bg-orange-soft text-orange-dark hover:bg-orange/20"><MessageCircle size={18} /></Link>
      <button disabled={busyId === d.id} onClick={() => move(d, n.to, d.status === "PENDENTE" && pick ? pick : undefined)}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-4 py-2 font-extrabold text-white hover:bg-orange-dark disabled:opacity-50"><n.icon size={18} />{n.label}</button>
      <button disabled={busyId === d.id} onClick={() => confirm("Cancelar este pedido?") && move(d, "CANCELADO")}
        className="rounded-full border-2 border-berry px-4 py-2 font-bold text-berry hover:bg-berry-soft disabled:opacity-50">Cancelar</button>
    </div>
    </div>
  );
}
