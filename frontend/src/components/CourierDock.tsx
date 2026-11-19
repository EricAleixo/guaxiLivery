"use client";
import { useState } from "react";
import { Bike, CircleCheck, Hand, Sparkles } from "lucide-react";
import { Avatar } from "./Avatar";
import { VehicleIcon } from "./VehicleIcon";
import { activeCouriers, busyWarning } from "@/lib/couriers";
import { useEmpresa } from "@/lib/empresa";

export const DRAG_TYPE = "application/x-guaxi-delivery";

/**
 * Barra lateral de despacho (desktop): arraste um pedido até um motoboy para atribuí-lo,
 * ou até "Deixar livre" para os motoboys escolherem. Livres primeiro. Fica fixa na tela
 * enquanto a lista de pedidos rola.
 */
export function CourierDock({ draggingId }: { draggingId: string | null }) {
  const { deliveries, couriers, move, assign } = useEmpresa();
  const [over, setOver] = useState<string | null>(null);
  const list = activeCouriers(couriers, deliveries, draggingId ?? undefined);
  const free = list.filter((x) => !x.ride), busy = list.filter((x) => x.ride);

  async function drop(e: React.DragEvent, target: string | null) {
    e.preventDefault();
    setOver(null);
    const d = deliveries?.find((x) => x.id === e.dataTransfer.getData(DRAG_TYPE));
    if (!d) return;
    const t = list.find((x) => x.courier.id === target);
    if (t?.ride && !confirm(busyWarning(t.courier.name, t.ride))) return;
    if (d.status === "PENDENTE") await move(d, "ACEITO", target ?? undefined);
    else await assign(d, target);
  }

  const zone = (key: string, target: string | null) => ({
    onDragOver: (e: React.DragEvent) => { if (draggingId) { e.preventDefault(); setOver(key); } },
    onDragLeave: () => setOver((o) => (o === key ? null : o)),
    onDrop: (e: React.DragEvent) => drop(e, target),
  });
  const tile = (key: string) => `relative flex items-center gap-3 rounded-2xl border-2 border-dashed p-2.5 transition ${
    over === key ? "scale-[1.03] border-orange bg-orange-soft shadow-md"
      : draggingId ? "border-orange/50 bg-paper" : "border-fur-light bg-paper"}`;

  const courierTile = (x: (typeof list)[number]) => (
    <li key={x.courier.id} {...zone(x.courier.id, x.courier.id)} className={tile(x.courier.id)}>
      <Avatar url={x.courier.avatarUrl} name={x.courier.name} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold leading-tight">{x.courier.name}</p>
        {x.ride
          ? <p className="truncate text-xs font-bold text-sky" title={`${x.ride.quantity}× ${x.ride.foodName}`}>{x.ride.quantity}× {x.ride.foodName}</p>
          : <p className="text-xs font-bold text-fur">{x.courier.vehiclePlate ?? "Sem placa"}</p>}
      </div>
      <VehicleIcon type={x.courier.vehicleType} className="shrink-0 text-fur" />
      {over === x.courier.id && x.ride && (
        <span className="absolute inset-x-2 -top-2.5 rounded-full bg-berry px-2 py-0.5 text-center text-[11px] font-extrabold text-white">Já está em uma corrida!</span>
      )}
    </li>
  );

  return (
    <aside aria-label="Despacho de motoboys" className="hidden lg:block lg:w-72 lg:shrink-0 xl:w-80">
      <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-3 rounded-3xl border-2 border-fur-light bg-cream p-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Hand size={18} className="text-orange" /> Despacho</h2>
          <p className="text-xs font-semibold text-fur">{draggingId ? "Solte o pedido em um motoboy" : "Arraste um pedido até um motoboy."}</p>
        </div>
        <ul className="space-y-2">
          <li {...zone("free", null)} className={tile("free")}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sun/40 text-[#8a5a00]"><Sparkles size={20} /></span>
            <div className="min-w-0"><p className="font-extrabold leading-tight">Deixar livre</p><p className="text-xs font-bold text-fur">Os motoboys escolhem</p></div>
          </li>
        </ul>
        <div className="-mr-1 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {list.length === 0 && <p className="text-sm font-semibold text-fur">Nenhum motoboy ativo. Adicione em “Entregadores”.</p>}
          {free.length > 0 && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-mint"><CircleCheck size={14} /> Livres ({free.length})</h3>
              <ul className="space-y-2">{free.map(courierTile)}</ul>
            </section>
          )}
          {busy.length > 0 && (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-sky"><Bike size={14} /> Em corrida ({busy.length})</h3>
              <ul className="space-y-2">{busy.map(courierTile)}</ul>
            </section>
          )}
        </div>
      </div>
    </aside>
  );
}
