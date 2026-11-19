import { ChefHat, Frown, Hourglass, House, MapPin, Motorbike, PartyPopper, Store, Utensils, type LucideIcon } from "lucide-react";
import { imageSrc, VEHICLES, type Delivery, type DeliveryStatus } from "@/lib/api";
import { STATUS, STEPS, shortId, timeAgo } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ChatMenu } from "./ChatMenu";
import { Raccoon } from "./Logo";
import { Chip } from "./ui";
import { VehicleIcon } from "./VehicleIcon";

const MOOD: Record<DeliveryStatus, { icon: LucideIcon; tone: string; text: (d: Delivery) => string }> = {
  PENDENTE: { icon: Hourglass, tone: "bg-sun/30", text: () => "Mandamos seu pedido! Agora é só esperar a cozinha aceitar." },
  ACEITO: { icon: ChefHat, tone: "bg-orange-soft", text: (d) => d.courier ? `${d.courier.name.split(" ")[0]} já vai buscar o seu pedido!` : "Pedido aceito! Estamos chamando um motoboy…" },
  EM_ROTA: { icon: Motorbike, tone: "bg-sky-soft", text: (d) => d.courier ? `${d.courier.name.split(" ")[0]} está a caminho! Fique de olho na porta.` : "Seu pedido está a caminho!" },
  ENTREGUE: { icon: PartyPopper, tone: "bg-mint-soft", text: () => "Chegou quentinho! Bom apetite." },
  CANCELADO: { icon: Frown, tone: "bg-berry-soft", text: () => "Esse pedido foi cancelado. Que tal pedir outra coisa?" },
};

/** Trilha de entrega: o guaxinim anda da loja até a sua casa conforme o pedido avança. */
function Trail({ status }: { status: DeliveryStatus }) {
  const idx = STEPS.indexOf(status);
  const pct = idx < 0 ? 0 : (idx / (STEPS.length - 1)) * 100;
  return (
    <div className="px-1 pb-1 pt-2">
      <div className="relative mx-4 h-9">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fur-light" />
        <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange transition-all duration-700" style={{ width: `${pct}%` }} />
        <span className="absolute left-0 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange-soft text-orange-dark" aria-hidden><Store size={15} /></span>
        <span className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full bg-mint-soft text-mint" aria-hidden><House size={15} /></span>
        {status !== "CANCELADO" && (
          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-[60%] transition-all duration-700" style={{ left: `${pct}%` }}>
            <Raccoon className={`h-9 w-9 rounded-full ring-2 ring-paper ${status === "EM_ROTA" ? "animate-hop" : ""}`} />
          </span>
        )}
      </div>
      <ol className="mt-1 flex justify-between text-[11px] font-bold">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= idx ? "text-orange-dark" : "text-fur"}>{STATUS[s].label}</li>
        ))}
      </ol>
    </div>
  );
}

/** Cartão de pedido do cliente: mais visual e com mensagens que contam o que está acontecendo. */
export function OrderCard({ d, children }: { d: Delivery; children?: React.ReactNode }) {
  const mood = MOOD[d.status];
  const live = d.status === "PENDENTE" || d.status === "ACEITO" || d.status === "EM_ROTA";
  return (
    <article className={`animate-pop overflow-hidden rounded-3xl border-2 bg-paper ${live ? "border-orange/60 shadow-[0_6px_0_var(--color-orange-soft)]" : "border-fur-light"}`}>
      <div className="relative">
        {d.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc(d)} alt={d.foodName} className={`h-40 w-full object-cover ${d.status === "CANCELADO" ? "grayscale" : ""}`} loading="lazy" />
        ) : (
          <div className={`grid h-24 place-items-center text-orange-dark ${mood.tone}`} aria-hidden><Utensils size={44} /></div>
        )}
        <div className="absolute left-3 top-3"><Chip status={d.status} /></div>
        <span className="absolute -bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-paper text-orange-dark shadow-md ring-2 ring-fur-light" aria-hidden><mood.icon size={20} /></span>
      </div>
      <div className="space-y-3 p-4 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold leading-tight">{d.quantity}× {d.foodName}</h3>
            <p className="text-xs font-semibold text-fur">Pedido #{shortId(d.id)} · {timeAgo(d.createdAt)}</p>
          </div>
          <ChatMenu d={d} />
        </div>
        <p className={`rounded-2xl px-3 py-2 text-sm font-bold ${mood.tone}`}>{mood.text(d)}</p>
        <Trail status={d.status} />
        {d.courier && (d.status === "ACEITO" || d.status === "EM_ROTA" || d.status === "ENTREGUE") && (
          <section aria-label="Seu entregador" className="flex items-center gap-3 rounded-2xl bg-orange-soft/60 p-3">
            <Avatar url={d.courier.avatarUrl} name={d.courier.name} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-dark">{d.status === "ENTREGUE" ? "Entregue por" : "Seu entregador"}</p>
              <p className="truncate text-lg font-extrabold leading-tight">{d.courier.name}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-fur">
                <span className="inline-flex items-center gap-1"><VehicleIcon type={d.courier.vehicleType} size={14} />{[VEHICLES[d.courier.vehicleType].label, d.courier.vehicleModel, d.courier.vehicleColor].filter(Boolean).join(" · ")}</span>
                {d.courier.vehiclePlate && <span className="rounded-md bg-paper px-1.5 py-0.5 font-mono font-extrabold text-ink">{d.courier.vehiclePlate.toUpperCase()}</span>}
              </p>
            </div>
          </section>
        )}
        <dl className="space-y-1 text-sm">
          <div className="flex gap-1"><dt className="inline-flex shrink-0 items-center gap-1 font-bold"><Store size={15} className="text-orange" />De:</dt><dd>{d.company?.tradeName ?? "Qualquer empresa disponível"}</dd>
          </div>
          <div className="flex gap-1"><dt className="inline-flex shrink-0 items-center gap-1 font-bold"><MapPin size={15} className="text-orange" />Retirada:</dt><dd>{d.pickupAddress}</dd></div>
          <div className="flex gap-1"><dt className="inline-flex shrink-0 items-center gap-1 font-bold"><House size={15} className="text-orange" />Entrega:</dt><dd>{d.deliveryAddress}</dd></div>
        </dl>
        {children}
      </div>
    </article>
  );
}
