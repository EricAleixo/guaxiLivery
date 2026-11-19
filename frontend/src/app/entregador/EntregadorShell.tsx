"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Store, UserRound, UtensilsCrossed } from "lucide-react";
import { EntregadorProvider, useEntregador } from "@/lib/entregador";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { Avatar } from "@/components/Avatar";
import { ErrorBox } from "@/components/ui";
import { VEHICLES } from "@/lib/api";

const LINKS = [
  { href: "/entregador", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entregador/chats", label: "Chats", icon: MessageCircle },
  { href: "/entregador/empresas", label: "Empresas", icon: Store },
  { href: "/entregador/perfil", label: "Perfil", icon: UserRound },
];

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user } = useAuth();
  const { unread } = useChat();
  const { profile, available, companies, error } = useEntregador();
  const invites = companies?.filter((c) => c.status === "CONVITE").length ?? 0;
  const v = profile ? VEHICLES[profile.vehicleType] : null;

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row">
      <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-64 lg:shrink-0">
        <div className="rounded-3xl border-2 border-fur-light bg-paper p-3 lg:p-4">
          <div className="mb-3 hidden items-center gap-3 border-b-2 border-dashed border-fur-light pb-4 lg:flex">
            <Avatar url={user?.avatarUrl} name={user?.name} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">{user?.name}</p>
              <p className="text-xs font-bold text-fur">{v ? `${v.emoji} ${v.label}` : "Painel do motoboy"}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Painel do motoboy">
            {LINKS.map((l) => {
              const active = l.href === "/entregador" ? path === l.href : path.startsWith(l.href);
              const badge = l.href === "/entregador" ? available?.length ?? 0 : l.href === "/entregador/empresas" ? invites : l.href === "/entregador/chats" ? unread : 0;
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                  className={`flex flex-1 items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 font-extrabold transition lg:flex-none ${active ? "bg-orange-soft text-orange-dark" : "text-ink/80 hover:bg-cream"}`}>
                  <l.icon size={20} />{l.label}
                  {badge > 0 && <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs text-white">{badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 border-t-2 border-dashed border-fur-light pt-3">
            <Link href="/cliente" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 font-extrabold text-ink/80 hover:bg-cream">
              <UtensilsCrossed size={20} /> Pedir comida
            </Link>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 space-y-6">
        <ErrorBox message={error} />
        {children}
      </div>
    </div>
  );
}

export default function EntregadorShell({ children }: { children: React.ReactNode }) {
  return <EntregadorProvider><Shell>{children}</Shell></EntregadorProvider>;
}
