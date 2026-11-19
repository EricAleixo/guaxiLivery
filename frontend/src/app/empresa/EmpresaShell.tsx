"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Plus, Star, UserRound, Wallet, Bike, MessageCircle } from "lucide-react";
import { EmpresaProvider, useEmpresa } from "@/lib/empresa";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { Avatar } from "@/components/Avatar";
import { ErrorBox } from "@/components/ui";

const LINKS = [
  { href: "/empresa", label: "Visão geral", icon: LayoutDashboard },
  { href: "/empresa/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/empresa/produtos", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/empresa/chats", label: "Chats", icon: MessageCircle },
  { href: "/empresa/entregadores", label: "Entregadores", icon: Bike },
  { href: "/empresa/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/empresa/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/empresa/perfil", label: "Perfil", icon: UserRound },
];

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user } = useAuth();
  const { unread } = useChat();
  const { deliveries, couriers, openForm, error } = useEmpresa();
  const applicants = couriers?.filter((l) => l.status === "CANDIDATURA").length ?? 0;
  const pending = deliveries?.filter((d) => d.status === "PENDENTE").length ?? 0;

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row">
      <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-64 lg:shrink-0">
        <div className="rounded-3xl border-2 border-fur-light bg-paper p-3 lg:p-4">
          <div className="mb-3 hidden items-center gap-3 border-b-2 border-dashed border-fur-light pb-4 lg:flex">
            <Avatar url={user?.avatarUrl} name={user?.name} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">{user?.name}</p>
              <p className="text-xs font-bold text-fur">Painel da empresa</p>
            </div>
          </div>
          <button onClick={() => openForm()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-orange px-4 py-3 font-extrabold text-white shadow-[0_4px_0_var(--color-orange-dark)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
            <Plus size={20} strokeWidth={3} /> Novo produto
          </button>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Painel da empresa">
            {LINKS.map((l) => {
              const active = l.href === "/empresa" ? path === l.href : path.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                  className={`flex flex-1 items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 font-extrabold transition lg:flex-none ${active ? "bg-orange-soft text-orange-dark" : "text-ink/80 hover:bg-cream"}`}>
                  <l.icon size={20} />{l.label}
                  {l.href === "/empresa/pedidos" && pending > 0 && (
                    <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs text-white">{pending}</span>
                  )}
                  {l.href === "/empresa/chats" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs text-white">{unread}</span>
                  )}
                  {l.href === "/empresa/entregadores" && applicants > 0 && (
                    <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs text-white">{applicants}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-6">
        <ErrorBox message={error} />
        {children}
      </div>
    </div>
  );
}

export default function EmpresaShell({ children }: { children: React.ReactNode }) {
  return <EmpresaProvider><Shell>{children}</Shell></EmpresaProvider>;
}
