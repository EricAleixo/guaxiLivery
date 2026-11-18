"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Inbox, Bike, PartyPopper, ChefHat, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEmpresa } from "@/lib/empresa";
import { Raccoon } from "@/components/Logo";
import { Chip } from "@/components/ui";
import { OrderActions } from "@/components/OrderActions";
import { brl, CATEGORIES, STATUS, timeAgo } from "@/lib/format";
import type { DeliveryStatus, ProductCategory } from "@/lib/api";

const DAY_LABEL = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function Card({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`animate-pop rounded-3xl border-2 border-fur-light bg-paper p-5 ${className}`}>
      <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
      {hint && <p className="mb-3 text-xs font-bold text-fur">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

/** Barra horizontal fina com ponta arredondada; o rótulo e o valor ficam em tinta de texto. */
function HBar({ label, value, max, tone = "bg-orange" }: { label: React.ReactNode; value: number; max: number; tone?: string }) {
  return (
    <li className="flex items-center gap-3 text-sm" title={`${value}`}>
      <span className="w-28 shrink-0 truncate font-bold">{label}</span>
      <span className="h-3 flex-1 rounded-full bg-cream">
        <span className={`block h-3 rounded-full ${tone}`} style={{ width: `${max ? Math.max(value ? 4 : 0, (value / max) * 100) : 0}%` }} />
      </span>
      <span className="w-6 text-right font-extrabold tabular-nums">{value}</span>
    </li>
  );
}

export default function VisaoGeralPageClient() {
  const { user } = useAuth();
  const { deliveries, products, openForm } = useEmpresa();

  const d = useMemo(() => deliveries ?? [], [deliveries]);
  const open = d.filter((x) => x.status === "PENDENTE");
  const doing = d.filter((x) => x.status === "ACEITO" || x.status === "EM_ROTA");
  const delivered = d.filter((x) => x.status === "ENTREGUE");
  const active = products?.filter((p) => p.available) ?? [];

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => { const t = new Date(); t.setDate(t.getDate() - (6 - i)); return t; });
    return days.map((t) => ({
      label: DAY_LABEL.format(t).replace(".", ""),
      today: dayKey(t) === dayKey(new Date()),
      value: d.filter((x) => dayKey(new Date(x.createdAt)) === dayKey(t)).length,
    }));
  }, [d]);
  const weekMax = Math.max(1, ...week.map((w) => w.value));

  const byStatus = (["PENDENTE", "ACEITO", "EM_ROTA", "ENTREGUE", "CANCELADO"] as DeliveryStatus[])
    .map((s) => ({ s, n: d.filter((x) => x.status === s).length }));
  const statusMax = Math.max(1, ...byStatus.map((x) => x.n));

  const byCat = (Object.keys(CATEGORIES) as ProductCategory[])
    .map((c) => ({ c, n: products?.filter((p) => p.category === c).length ?? 0 })).filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const catMax = Math.max(1, ...byCat.map((x) => x.n));
  const avg = products && products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;

  const kpis = [
    { label: "Novos pedidos", value: open.length, icon: Inbox, tone: "bg-sun/30 text-[#8a5a00]", href: "/empresa/pedidos" },
    { label: "Em andamento", value: doing.length, icon: Bike, tone: "bg-sky-soft text-sky", href: "/empresa/pedidos" },
    { label: "Entregues", value: delivered.length, icon: PartyPopper, tone: "bg-mint-soft text-mint", href: "/empresa/pedidos" },
    { label: "No cardápio", value: active.length, icon: ChefHat, tone: "bg-orange-soft text-orange-dark", href: "/empresa/produtos" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-pop flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-orange p-6 text-white">
        <div className="flex items-center gap-4">
          <Raccoon className="h-16 w-16 shrink-0 animate-ride" />
          <div>
            <h1 className="text-3xl font-extrabold leading-tight">Olá, {user?.name.split(" ")[0]}!</h1>
            <p className="font-bold text-white/90">
              {open.length > 0 ? `Tem ${open.length} pedido${open.length > 1 ? "s" : ""} esperando você 🛵` : products && products.length === 0 ? "Vamos montar o cardápio? Seu primeiro produto leva um minutinho." : "Tudo calmo por aqui. Que tal caprichar no cardápio?"}
            </p>
          </div>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-extrabold text-orange-dark shadow-[0_4px_0_var(--color-orange-soft)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
          <Plus size={20} strokeWidth={3} /> Novo produto</button>
      </div>

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}>
            <Link href={k.href} className="animate-pop flex items-center gap-3 rounded-3xl border-2 border-fur-light bg-paper p-4 transition hover:-translate-y-0.5 hover:border-orange">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${k.tone}`}><k.icon size={24} /></span>
              <span><span className="block font-display text-3xl font-extrabold leading-none tabular-nums">{k.value}</span><span className="text-xs font-bold text-fur">{k.label}</span></span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Pedidos nos últimos 7 dias" hint="Quantidade de pedidos por dia" className="xl:col-span-2">
          <div className="flex h-44 items-end gap-3" role="img" aria-label={`Pedidos por dia: ${week.map((w) => `${w.label} ${w.value}`).join(", ")}`}>
            {week.map((w, i) => (
              <div key={i} className="group flex h-full flex-1 flex-col justify-end gap-1 text-center" title={`${w.label}: ${w.value} pedido(s)`}>
                <span className="text-xs font-extrabold tabular-nums">{w.value || ""}</span>
                <span className={`w-full rounded-t-lg transition group-hover:opacity-80 ${w.today ? "bg-orange" : "bg-orange/55"}`}
                  style={{ height: `${w.value ? Math.max(6, (w.value / weekMax) * 100) : 2}%` }} />
                <span className={`text-xs font-bold ${w.today ? "text-ink" : "text-fur"}`}>{w.today ? "hoje" : w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Situação dos pedidos" hint="Por etapa da entrega">
          <ul className="space-y-3">
            {byStatus.map(({ s, n }) => {
              const st = STATUS[s];
              return <HBar key={s} value={n} max={statusMax} tone={s === "ENTREGUE" ? "bg-mint" : s === "EM_ROTA" ? "bg-sky" : s === "CANCELADO" ? "bg-berry" : s === "PENDENTE" ? "bg-sun" : "bg-orange"}
                label={<span className="flex items-center gap-1.5"><st.icon size={14} strokeWidth={3} />{st.label}</span>} />;
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Pedidos recentes" className="xl:col-span-2">
          {d.length === 0 ? (
            <p className="rounded-2xl bg-cream p-6 text-center font-bold text-fur">Ainda sem pedidos. Quando chegarem, aparecem aqui. 🌙</p>
          ) : (
            <ul className="divide-y-2 divide-dashed divide-fur-light">
              {[...d].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5).map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">{x.quantity}× {x.foodName}</p>
                    <p className="truncate text-xs text-fur">#{x.id} · {x.clientName} · {timeAgo(x.createdAt)}</p>
                  </div>
                  <Chip status={x.status} />
                  <div className="w-full sm:w-auto sm:min-w-64"><OrderActions d={x} /></div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/empresa/pedidos" className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-orange-dark hover:underline">Ver todos os pedidos <ArrowRight size={16} /></Link>
        </Card>

        <Card title="Seu cardápio" hint={products ? `${products.length} produto(s) · preço médio ${brl(avg)}` : undefined}>
          {byCat.length === 0 ? (
            <div className="rounded-2xl bg-orange-soft p-5 text-center">
              <p className="text-3xl">🧁🍕🍔</p>
              <p className="mt-1 text-sm font-bold">Nenhum produto ainda.</p>
              <button onClick={() => openForm()} className="mt-3 rounded-full bg-orange px-4 py-2 text-sm font-extrabold text-white hover:bg-orange-dark">Cadastrar produto</button>
            </div>
          ) : (
            <ul className="space-y-3">
              {byCat.map(({ c, n }) => <HBar key={c} value={n} max={catMax} label={`${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`} />)}
            </ul>
          )}
          {products && products.length > 0 && <Link href="/empresa/produtos" className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-orange-dark hover:underline">Gerenciar cardápio <ArrowRight size={16} /></Link>}
        </Card>
      </div>
    </div>
  );
}
