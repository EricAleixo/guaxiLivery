"use client";
import { useEffect, useRef } from "react";
import { Bike, Home, MapPin, Store } from "lucide-react";
import type { Delivery, DeliveryStatus } from "@/lib/api";
import { imageSrc } from "@/lib/api";
import { passwordStrength } from "@/lib/password";
import { STATUS, STEPS, shortId, timeAgo } from "@/lib/format";

export const inputCls =
  "w-full rounded-2xl border-2 border-fur-light bg-paper px-4 py-3 outline-none transition focus:border-orange focus:ring-4 focus:ring-orange-soft";
export const btnCls =
  "rounded-full bg-orange px-6 py-3 font-extrabold text-white shadow-[0_4px_0_var(--color-orange-dark)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm font-semibold text-berry">{error}</span>}
    </label>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry">{message}</p>;
}

export function Chip({ status }: { status: DeliveryStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${s.chip}`}><s.icon size={14} strokeWidth={3} /> {s.label}</span>;
}

export function Tracker({ status }: { status: DeliveryStatus }) {
  if (status === "CANCELADO") return null;
  const idx = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1" aria-label="Progresso do pedido">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-1">
          <span title={STATUS[s].label}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${i <= idx ? "bg-orange text-white" : "bg-fur-light text-fur"} ${i === idx && s === "EM_ROTA" ? "animate-ride" : ""}`}>
            {(() => { const Icon = STATUS[s].icon; return <Icon size={16} strokeWidth={2.5} />; })()}
          </span>
          {i < STEPS.length - 1 && <span className={`h-1 flex-1 rounded ${i < idx ? "bg-orange" : "bg-fur-light"}`} />}
        </li>
      ))}
    </ol>
  );
}

export function DeliveryCard({ d, children, showClient }: { d: Delivery; children?: React.ReactNode; showClient?: boolean }) {
  return (
    <article className="animate-pop overflow-hidden rounded-3xl border-2 border-fur-light bg-paper">
      {d.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc(d)} alt={d.foodName} className="h-44 w-full object-cover" loading="lazy" />
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold leading-tight">{d.quantity}× {d.foodName}</h3>
            <p className="text-xs text-fur">#{shortId(d.id)} · {timeAgo(d.createdAt)}{showClient && ` · ${d.clientName}`}</p>
          </div>
          <Chip status={d.status} />
        </div>
        {d.description && <p className="text-sm text-ink/80">{d.description}</p>}
        <dl className="space-y-1 text-sm">
          <div><dt className="inline-flex items-center gap-1 font-bold"><MapPin size={15} className="text-orange" />Retirar: </dt><dd className="inline">{d.pickupAddress}</dd></div>
          <div><dt className="inline-flex items-center gap-1 font-bold"><Home size={15} className="text-orange" />Entregar: </dt><dd className="inline">{d.deliveryAddress}</dd></div>
          <div><dt className="inline-flex items-center gap-1 font-bold"><Store size={15} className="text-orange" />Empresa: </dt><dd className="inline">{d.company?.tradeName ?? "Qualquer empresa disponível"}</dd></div>
          {d.courier && <div><dt className="inline-flex items-center gap-1 font-bold"><Bike size={15} className="text-orange" />Motoboy: </dt><dd className="inline">{d.courier.name}{d.courier.vehiclePlate && ` · ${d.courier.vehiclePlate}`}</dd></div>}
        </dl>
        <Tracker status={d.status} />
        {children}
      </div>
    </article>
  );
}

/** Executa fn a cada intervalo (atualização automática das listas). */
export function usePolling(fn: () => void, ms = 10000) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => { const id = setInterval(() => ref.current(), ms); return () => clearInterval(id); }, [ms]);
}

export function PasswordStrength({ password }: { password: string }) {
  const st = passwordStrength(password);
  const color = ["bg-fur-light", "bg-berry", "bg-orange", "bg-mint"][st.level];
  const text = ["text-fur", "text-berry", "text-orange-dark", "text-mint"][st.level];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-fur-light" role="progressbar" aria-label="Força da senha"
        aria-valuemin={0} aria-valuemax={3} aria-valuenow={st.level}>
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${(st.level / 3) * 100}%` }} />
      </div>
      <div className="mt-1 flex items-start justify-between gap-2 text-xs font-bold">
        <span className="flex flex-wrap gap-x-2">
          {st.checks.map((c) => <span key={c.label} className={c.ok ? "text-mint" : "text-fur"}>{c.ok ? "✓" : "○"} {c.label}</span>)}
        </span>
        {st.label && <span className={`shrink-0 ${text}`}>{st.label}</span>}
      </div>
    </div>
  );
}
