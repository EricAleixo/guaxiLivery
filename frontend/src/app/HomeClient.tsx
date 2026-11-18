"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, BellRing, Bike, Camera, ChevronDown, ClipboardList, Eye, Moon, MapPin, Package,
  Phone, ShieldCheck, Store, Timer, TrendingUp, Zap, type LucideIcon,
} from "lucide-react";
import { api, type Company } from "@/lib/api";
import { useAuth, homeFor } from "@/lib/auth";
import { Raccoon } from "@/components/Logo";
import { btnCls } from "@/components/ui";

const STEPS: [LucideIcon, string, string][] = [
  [Camera, "Mostre a comida", "Tire uma foto, diga o que é, a quantidade e onde retirar."],
  [Store, "Uma empresa aceita", "Escolha uma parceira ou deixe o pedido aberto para todas."],
  [Bike, "O guaxinim voa", "Acompanhe cada etapa: aceito, a caminho, entregue."],
];

const FEATURES: [LucideIcon, string, string][] = [
  [Eye, "Acompanhamento em tempo real", "A barra de progresso se atualiza sozinha, sem precisar recarregar a página."],
  [Camera, "Pedido com foto", "A empresa vê exatamente o que precisa buscar — menos erro, menos ligação."],
  [Store, "Você escolhe quem entrega", "Indique uma empresa parceira ou deixe aberto e a primeira disponível assume."],
  [Moon, "Pensado para a noite", "Interface confortável e rápida para quando a fome bate de madrugada."],
  [ShieldCheck, "Conta segura", "Login protegido e cada pessoa só enxerga o que é seu."],
  [Zap, "Simples de usar", "Do cadastro ao primeiro pedido em poucos minutos, no celular ou no computador."],
];

const COMPANY_PERKS: [LucideIcon, string][] = [
  [ClipboardList, "Painel com todos os pedidos novos, em andamento e finalizados"],
  [BellRing, "Pedidos novos aparecem automaticamente, sem atualizar"],
  [TrendingUp, "Mais visibilidade para o seu negócio de entrega"],
];

const FAQ: [string, string][] = [
  ["Como faço meu primeiro pedido?", "Crie uma conta de cliente, clique em “Novo pedido”, envie a foto da comida, informe os endereços e pronto."],
  ["Posso escolher qual empresa vai entregar?", "Pode. Na hora do pedido você seleciona uma parceira ou deixa “qualquer empresa disponível”."],
  ["Como sei em que etapa está minha entrega?", "Na sua lista de pedidos há uma barra de progresso: aguardando, aceito, a caminho e entregue."],
  ["Como minha empresa entra na GuaxiLivery?", "Crie uma conta de empresa informando nome fantasia e CNPJ. Logo depois você já acessa o painel de pedidos."],
  ["Posso cancelar um pedido?", "O cancelamento é feito pela empresa responsável enquanto o pedido não foi entregue."],
];

export default function HomeClient() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  useEffect(() => { api.companies().then(setCompanies).catch(() => {}); }, []);

  const cta = user ? (
    <Link href={homeFor(user.role)} className={`${btnCls} inline-flex items-center gap-2`}>Ir para meu painel <ArrowRight size={18} /></Link>
  ) : (
    <Link href="/cadastro" className={`${btnCls} inline-flex items-center gap-2`}>Pedir uma entrega <ArrowRight size={18} /></Link>
  );

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 py-8 sm:px-8 sm:py-14 md:grid-cols-2 md:py-20">
        <div className="animate-pop space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sun/40 px-3 py-1 text-sm font-extrabold"><Moon size={16} /> Entrega esperta e noturna</span>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Fome de madrugada? <span className="text-orange">O guaxinim</span> resolve.
          </h1>
          <p className="text-lg text-ink/80">A GuaxiLivery conecta quem quer comer a empresas de entrega que atuam rápido — e deixa você acompanhar tudo em tempo real.</p>
          <div className="flex flex-wrap gap-3">
            {cta}
            {!user && <Link href="/cadastro?tipo=empresa" className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-6 py-3 font-extrabold hover:bg-ink hover:text-cream"><Store size={18} /> Sou uma empresa</Link>}
          </div>
        </div>
        <div className="relative grid place-items-center rounded-[2rem] bg-orange-soft p-8 pb-14 pt-14 sm:rounded-[3rem] sm:p-10">
          <Raccoon className="h-40 w-40 animate-ride drop-shadow-xl sm:h-56 sm:w-56" />
          <span className="absolute bottom-3 right-3 flex text-xs sm:bottom-6 sm:right-6 sm:text-sm items-center gap-1.5 rounded-2xl bg-paper px-3 py-2 font-extrabold shadow"><Package size={16} className="text-orange" /> +1 entrega a caminho</span>
          <span className="absolute left-3 top-3 flex text-xs sm:left-6 sm:top-6 sm:text-sm items-center gap-1.5 rounded-2xl bg-paper px-3 py-2 font-extrabold shadow"><Timer size={16} className="text-mint" /> Pedido aceito</span>
        </div>
      </section>

      {/* Faixa de destaques */}
      <section className="bg-ink text-cream">
        <div className="mx-auto grid max-w-[90rem] gap-6 px-4 sm:px-8 py-8 text-center sm:grid-cols-3">
          {([[Eye, "Acompanhe ao vivo"], [Camera, "Pedido com foto"], [Store, "Você escolhe a empresa"]] as [LucideIcon, string][]).map(([I, t]) => (
            <div key={t} className="flex items-center justify-center gap-3 font-display text-xl font-bold"><I className="text-sun" size={26} /> {t}</div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-[90rem] px-4 sm:px-8 py-10 sm:py-16">
        <SectionTitle kicker="Passo a passo" title="Como funciona" />
        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map(([Icon, t, d], i) => (
            <div key={t} className="relative rounded-3xl border-2 border-fur-light bg-paper p-6">
              <span className="absolute -top-4 left-5 grid h-8 w-8 place-items-center rounded-full bg-orange font-display font-extrabold text-white">{i + 1}</span>
              <Icon size={36} className="text-orange" />
              <h3 className="mt-3 text-xl font-extrabold">{t}</h3>
              <p className="mt-1 text-sm text-ink/75">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vantagens */}
      <section className="bg-orange-soft/60 py-10 sm:py-16">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
          <SectionTitle kicker="Por que a GuaxiLivery" title="Tudo o que você precisa numa entrega" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([Icon, t, d]) => (
              <div key={t} className="rounded-3xl bg-paper p-6 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-soft text-orange-dark"><Icon size={24} /></span>
                <h3 className="mt-3 text-lg font-extrabold">{t}</h3>
                <p className="mt-1 text-sm text-ink/75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para empresas */}
      <section className="mx-auto max-w-[90rem] px-4 sm:px-8 py-10 sm:py-16">
        <div className="grid items-center gap-8 rounded-[2rem] bg-ink p-6 sm:rounded-[2.5rem] sm:p-8 text-cream md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <span className="text-sm font-extrabold uppercase tracking-wider text-sun">Para empresas</span>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">Tem uma empresa de entregas? Receba pedidos aqui.</h2>
            <p className="text-cream/80">Cadastre-se, receba pedidos de clientes da sua região e gerencie cada etapa em um painel simples.</p>
            <Link href={user?.role === "EMPRESA" ? "/empresa" : "/cadastro?tipo=empresa"} className={`${btnCls} inline-flex items-center gap-2`}>
              {user?.role === "EMPRESA" ? "Abrir painel" : "Cadastrar minha empresa"} <ArrowRight size={18} />
            </Link>
          </div>
          <ul className="space-y-3">
            {COMPANY_PERKS.map(([I, t]) => (
              <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                <I className="mt-0.5 shrink-0 text-sun" size={22} /> <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Empresas parceiras */}
      {companies.length > 0 && (
        <section className="mx-auto max-w-[90rem] px-4 sm:px-8 pb-10 sm:pb-16">
          <SectionTitle kicker="Quem entrega" title="Empresas parceiras" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {companies.map((c) => (
              <div key={c.id} className="rounded-3xl border-2 border-fur-light bg-paper p-5">
                <h3 className="flex items-center gap-2 text-lg font-extrabold"><Store size={18} className="text-orange" /> {c.tradeName}</h3>
                {c.description && <p className="mt-1 text-sm text-ink/75">{c.description}</p>}
                {c.address && <p className="mt-2 flex items-center gap-1 text-xs text-fur"><MapPin size={13} /> {c.address}</p>}
                {c.phone && <p className="flex items-center gap-1 text-xs text-fur"><Phone size={13} /> {c.phone}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-10 sm:pb-16">
        <SectionTitle kicker="Dúvidas" title="Perguntas frequentes" />
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border-2 border-fur-light bg-paper p-4 open:border-orange">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">
                {q} <ChevronDown size={20} className="shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-ink/80">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-orange px-6 py-10 sm:rounded-[2.5rem] sm:py-12 text-center text-white">
          <Raccoon className="h-20 w-20 animate-ride" />
          <h2 className="text-3xl font-extrabold sm:text-4xl">Bora matar essa fome?</h2>
          <p className="max-w-md text-white/90">Crie sua conta grátis e faça seu primeiro pedido agora mesmo.</p>
          {user ? (
            <Link href={homeFor(user.role)} className="rounded-full bg-white px-6 py-3 font-extrabold text-orange-dark hover:bg-cream">Ir para meu painel</Link>
          ) : (
            <Link href="/cadastro" className="rounded-full bg-white px-6 py-3 font-extrabold text-orange-dark hover:bg-cream">Criar minha conta</Link>
          )}
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      <span className="text-sm font-extrabold uppercase tracking-wider text-orange-dark">{kicker}</span>
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
    </div>
  );
}
