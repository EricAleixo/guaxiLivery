"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Clapperboard, MapPin, Phone, ReceiptText, RotateCcw, ShoppingBag, Sparkles, Store, UserRound, Utensils,
  type LucideIcon,
} from "lucide-react";
import { api, type Delivery, type FeedItem, type Profile, type ProductCategory } from "@/lib/api";
import { useRequireRole } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { brl, CATEGORIES } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { DishCard } from "@/components/DishCard";
import { Loading } from "@/components/Loading";
import { RaccoonSnacking } from "@/components/Logo";
import { ErrorBox } from "@/components/ui";

/** Dashboard do cliente: atalhos para pedir de novo, explorar, empresas e perfil. */
export default function ClientePageClient() {
  const { user } = useRequireRole("CLIENTE");
  const bag = useBag();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [orders, setOrders] = useState<Delivery[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.feed().then(setItems).catch((e) => setError(e.message));
    api.myDeliveries().then(setOrders).catch(() => {});
    api.profile().then(setProfile).catch(() => {});
  }, [user]);

  const again = useMemo(() => {
    const seen = new Set<string>(); const out: FeedItem[] = [];
    for (const o of [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
      if (o.status === "CANCELADO" || o.productId == null || seen.has(o.productId)) continue;
      seen.add(o.productId);
      const it = items?.find((i) => i.product.id === o.productId);
      if (it) out.push(it);
    }
    return out.slice(0, 8);
  }, [orders, items]);

  const counts = useMemo(() => {
    const m = new Map<ProductCategory, number>();
    items?.forEach((i) => m.set(i.product.category, (m.get(i.product.category) ?? 0) + 1));
    return m;
  }, [items]);

  const companies = useMemo(() => {
    const m = new Map<string, { company: FeedItem["company"]; n: number }>();
    items?.forEach((i) => m.set(i.company.id, { company: i.company, n: (m.get(i.company.id)?.n ?? 0) + 1 }));
    return [...m.values()];
  }, [items]);

  const highlights = useMemo(() => (items ?? []).slice(0, 8), [items]);
  const active = orders.filter((o) => o.status !== "ENTREGUE" && o.status !== "CANCELADO").length;

  if (!user) return <Loading />;

  return (
    <div className="mx-auto max-w-[90rem] space-y-8 px-4 py-5 sm:space-y-10 sm:px-8 sm:py-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange via-[#ff8a3d] to-sun p-6 text-white shadow-[0_8px_0_var(--color-orange-dark)] sm:p-10">
        <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15" />
        <span className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold backdrop-blur sm:text-sm"><Sparkles size={14} /> Bem-vindo de volta</span>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">Oi, {user.name.split(" ")[0]}!<br />O que vai ser hoje?</h1>
            <p className="max-w-md text-sm text-white/90 sm:text-base">Peça de novo seus favoritos, descubra pratos novos ou role o feed até bater a fome.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/cliente/feed" className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-extrabold text-orange-dark shadow-[0_3px_0_var(--color-orange-soft)] transition hover:-translate-y-0.5">
                <Clapperboard size={18} /> Abrir o feed</Link>
              <Link href="/cliente/todos" className="flex items-center gap-2 rounded-full border-2 border-white/80 px-5 py-2.5 font-extrabold hover:bg-white/15">
                <Utensils size={18} /> Ver o cardápio</Link>
            </div>
          </div>
          <RaccoonSnacking className="mx-auto h-36 w-36 drop-shadow-xl sm:h-56 sm:w-56" />
        </div>
      </header>
      <ErrorBox message={error} />

      {/* Atalhos */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label="Atalhos">
        <Shortcut href="/cliente/sacola" icon={ShoppingBag} label="Sacola" tone="bg-sun/35 text-[#8a5a00]"
          big={String(bag.count)} hint={bag.count > 0 ? `${brl(bag.total)} no total` : "Vazia por enquanto"} />
        <Shortcut href="/cliente/pedidos" icon={ReceiptText} label="Pedidos" tone="bg-sky-soft text-sky"
          big={String(active || orders.length)} hint={active > 0 ? "em andamento" : "no histórico"} />
        <Shortcut href="/cliente/perfil" icon={UserRound} label="Meu perfil" tone="bg-mint-soft text-mint" hint="Foto, nome e telefone" />
        <Shortcut href="/cliente/perfil" icon={MapPin} label="Endereço" tone="bg-berry-soft text-berry" hint={profile?.address || "Cadastre onde receber"} />
      </section>

      {/* Peça de novo */}
      {again.length > 0 && (
        <DarkPanel>
          <Title icon={RotateCcw} dark>Peça de novo</Title>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {again.slice(0, 6).map((i, n) => (
              <DishCard key={i.product.id} item={i} highlight={n === 0} actionLabel="Pedir de novo" actionIcon={<RotateCcw size={16} />} />
            ))}
          </div>
        </DarkPanel>
      )}

      {/* Explore */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <Title icon={Utensils}>Explore</Title>
          <Link href="/cliente/todos" className="flex items-center gap-1 text-sm font-extrabold text-orange-dark hover:underline">Ver tudo <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
          {(Object.keys(CATEGORIES) as ProductCategory[]).map((c) => {
            const n = counts.get(c) ?? 0;
            return (
              <Link key={c} href={`/cliente/todos?categoria=${c}`} aria-disabled={n === 0}
                className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-3xl text-center transition hover:-translate-y-1 ${CATEGORIES[c].tint} ${n === 0 ? "opacity-50" : ""}`}>
                <span className="text-4xl transition group-hover:scale-125 group-hover:-rotate-6 sm:text-5xl">{CATEGORIES[c].emoji}</span>
                <span className="mt-1 text-xs font-extrabold sm:text-sm">{CATEGORIES[c].label}</span>
                <span className="text-[11px] font-bold text-ink/60">{n} {n === 1 ? "prato" : "pratos"}</span>
              </Link>
            );
          })}
        </div>
        {!items && !error && <Loading label="Buscando comidinhas…" />}
      </section>

      {/* Em destaque */}
      {highlights.length > 0 && (
        <DarkPanel>
          <div className="flex items-end justify-between gap-3">
            <Title icon={Sparkles} dark>Em destaque</Title>
            <Link href="/cliente/todos" className="flex items-center gap-1 text-sm font-extrabold text-sun hover:underline">Ver tudo <ArrowRight size={14} /></Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {highlights.slice(0, 6).map((i, n) => (
              <DishCard key={i.product.id} item={i} highlight={n === 0} actionLabel="Adicionar à sacola" actionIcon={<ShoppingBag size={16} />} />
            ))}
          </div>
        </DarkPanel>
      )}

      {/* Empresas */}
      {companies.length > 0 && (
        <section className="space-y-3">
          <Title icon={Store}>Empresas parceiras</Title>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map(({ company: c, n }) => (
              <Link key={c.id} href={`/cliente/todos?empresa=${c.id}`}
                className="group overflow-hidden rounded-[1.75rem] border-2 border-fur-light bg-paper transition hover:-translate-y-1 hover:border-orange">
                <div className="h-16 bg-gradient-to-r from-orange-soft via-sun/40 to-orange-soft" />
                <div className="-mt-8 space-y-1 px-4 pb-4 text-sm">
                  <Avatar url={c.logoUrl} name={c.tradeName} className="h-16 w-16 ring-4 ring-paper" />
                  <p className="truncate pt-1 text-lg font-extrabold">{c.tradeName}</p>
                  {c.description && <p className="line-clamp-2 text-ink/75">{c.description}</p>}
                  <div className="space-y-0.5 pt-1 text-fur">
                    {c.address && <p className="flex items-center gap-1.5"><MapPin size={14} className="shrink-0 text-orange" /> <span className="truncate">{c.address}</span></p>}
                    {c.phone && <p className="flex items-center gap-1.5"><Phone size={14} className="shrink-0 text-orange" /> {c.phone}</p>}
                  </div>
                  <p className="flex items-center justify-between pt-2 text-xs font-extrabold text-orange-dark">
                    <span className="rounded-full bg-orange-soft px-2.5 py-1">{n} {n === 1 ? "prato" : "pratos"}</span>
                    <span className="flex items-center gap-1 group-hover:underline">Ver cardápio <ArrowRight size={13} /></span></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Painel escuro com brilho laranja atrás dos cards claros. */
function DarkPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#14100e] via-ink to-[#4a2a1a] p-4 text-cream sm:p-6">
      <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange/25 blur-3xl" />
      <div className="relative">{children}</div>
    </section>
  );
}

function Title({ icon: Icon, children, dark }: { icon: LucideIcon; children: React.ReactNode; dark?: boolean }) {
  return (
    <h2 className={`flex items-center gap-2 text-xl font-extrabold sm:text-2xl ${dark ? "text-cream" : ""}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange text-white"><Icon size={19} /></span> {children}</h2>
  );
}

function Shortcut({ href, icon: Icon, label, hint, tone, big }: { href: string; icon: LucideIcon; label: string; hint: string; tone: string; big?: string }) {
  return (
    <Link href={href} className={`group relative overflow-hidden rounded-3xl p-4 transition hover:-translate-y-1 sm:p-5 ${tone}`}>
      <Icon size={84} strokeWidth={1.5} className="pointer-events-none absolute -bottom-4 -right-3 opacity-15 transition group-hover:rotate-6 group-hover:scale-110" />
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80"><Icon size={20} /></span>
      <span className="mt-3 flex items-baseline gap-2">
        <span className="font-extrabold text-ink">{label}</span>
        {big && <span className="font-display text-2xl font-extrabold leading-none">{big}</span>}
      </span>
      <span className="mt-0.5 block truncate text-xs font-bold text-ink/65">{hint}</span>
    </Link>
  );
}
