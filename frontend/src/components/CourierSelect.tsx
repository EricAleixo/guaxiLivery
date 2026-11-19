"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { Avatar } from "./Avatar";
import { VehicleIcon } from "./VehicleIcon";
import { activeCouriers, busyWarning } from "@/lib/couriers";
import { useEmpresa } from "@/lib/empresa";

/**
 * Dropdown personalizado de motoboys (usado no celular): livres primeiro, ocupados avisados.
 * A lista abre dentro do fluxo do card (não flutua), para não ser cortada pelo overflow dele.
 */
export function CourierSelect({ value, onChange, freeLabel, disabled, exceptId }: {
  value: string | null;
  onChange: (courierId: string | null) => void;
  freeLabel: string;
  disabled?: boolean;
  exceptId?: string;
}) {
  const { couriers, deliveries } = useEmpresa();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = activeCouriers(couriers, deliveries, exceptId);
  const current = list.find((x) => x.courier.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  function pick(id: string | null) {
    const x = list.find((y) => y.courier.id === id);
    if (x?.ride && id !== value && !confirm(busyWarning(x.courier.name, x.ride))) return;
    setOpen(false);
    onChange(id);
  }

  const row = "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm hover:bg-orange-soft";
  const free = list.filter((x) => !x.ride), busy = list.filter((x) => x.ride);
  const opt = (x: (typeof list)[number]) => (
    <li key={x.courier.id} role="option" aria-selected={x.courier.id === value}>
      <button type="button" onClick={() => pick(x.courier.id)} className={row}>
        <Avatar url={x.courier.avatarUrl} name={x.courier.name} className="h-8 w-8" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-extrabold">{x.courier.name}</span>
          <span className={`text-xs font-bold ${x.ride ? "text-sky" : "text-mint"}`}>{x.ride ? "Em corrida" : "Livre"}</span>
        </span>
        <VehicleIcon type={x.courier.vehicleType} className="shrink-0 text-fur" />
        {x.courier.id === value && <Check size={16} className="shrink-0 text-orange" />}
      </button>
    </li>
  );

  return (
    <div ref={root} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-2xl border-2 border-fur-light bg-paper px-3 py-2 text-left text-sm font-bold outline-none transition focus:border-orange disabled:opacity-50">
        {current
          ? <><Avatar url={current.courier.avatarUrl} name={current.courier.name} className="h-6 w-6" /><span className="min-w-0 flex-1 truncate">{current.courier.name}</span></>
          : <><Sparkles size={16} className="text-orange" /><span className="min-w-0 flex-1 truncate">{freeLabel}</span></>}
        <ChevronDown size={16} className={`shrink-0 text-fur transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" className="mt-2 max-h-72 space-y-0.5 overflow-y-auto rounded-2xl border-2 border-fur-light bg-paper p-1">
          <li role="option" aria-selected={value === null}>
            <button type="button" onClick={() => pick(null)} className={row}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sun/40 text-[#8a5a00]"><Sparkles size={16} /></span>
              <span className="flex-1 font-extrabold">{freeLabel}</span>
              {value === null && <Check size={16} className="text-orange" />}
            </button>
          </li>
          {free.length > 0 && <li role="presentation" className="px-3 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-mint">Livres ({free.length})</li>}
          {free.map(opt)}
          {busy.length > 0 && <li role="presentation" className="px-3 pt-2 text-[11px] font-extrabold uppercase tracking-wide text-sky">Em corrida ({busy.length})</li>}
          {busy.map(opt)}
        </ul>
      )}
    </div>
  );
}
