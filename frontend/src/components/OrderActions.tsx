"use client";
import { Check, CircleCheck, Bike } from "lucide-react";
import type { Delivery, DeliveryStatus } from "@/lib/api";
import { useEmpresa } from "@/lib/empresa";

const NEXT: Partial<Record<DeliveryStatus, { to: DeliveryStatus; label: string; icon: typeof Check }>> = {
  PENDENTE: { to: "ACEITO", label: "Aceitar pedido", icon: Check },
  ACEITO: { to: "EM_ROTA", label: "Saiu para entrega", icon: Bike },
  EM_ROTA: { to: "ENTREGUE", label: "Marcar entregue", icon: CircleCheck },
};

export function OrderActions({ d }: { d: Delivery }) {
  const { move, busyId } = useEmpresa();
  const n = NEXT[d.status];
  if (!n) return null;
  return (
    <div className="flex gap-2">
      <button disabled={busyId === d.id} onClick={() => move(d, n.to)}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-4 py-2 font-extrabold text-white hover:bg-orange-dark disabled:opacity-50"><n.icon size={18} />{n.label}</button>
      <button disabled={busyId === d.id} onClick={() => confirm("Cancelar este pedido?") && move(d, "CANCELADO")}
        className="rounded-full border-2 border-berry px-4 py-2 font-bold text-berry hover:bg-berry-soft disabled:opacity-50">Cancelar</button>
    </div>
  );
}
