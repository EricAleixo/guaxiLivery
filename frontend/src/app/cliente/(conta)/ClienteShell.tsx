"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, MessageCircle, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { useChat } from "@/lib/chat";
import { Avatar } from "@/components/Avatar";

/** Menu lateral da área do cliente (sacola, pedidos, chats e perfil), no mesmo estilo do painel da empresa. */
export default function ClienteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user } = useAuth();
  const { count } = useBag();
  const { unread } = useChat();
  const links = [
    { href: "/cliente", label: "Início", icon: Home, badge: 0 },
    { href: "/cliente/feed", label: "Feed", icon: Clapperboard, badge: 0 },
    { href: "/cliente/sacola", label: "Sacola", icon: ShoppingBag, badge: count },
    { href: "/cliente/pedidos", label: "Meus pedidos", icon: ReceiptText, badge: 0 },
    { href: "/cliente/chats", label: "Chats", icon: MessageCircle, badge: unread },
    { href: "/cliente/perfil", label: "Perfil", icon: UserRound, badge: 0 },
  ];

  return (
    <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row">
      <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-64 lg:shrink-0">
        <div className="rounded-3xl border-2 border-fur-light bg-paper p-3 lg:p-4">
          <div className="mb-3 hidden items-center gap-3 border-b-2 border-dashed border-fur-light pb-4 lg:flex">
            <Avatar url={user?.avatarUrl} name={user?.name} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">{user?.name}</p>
              <p className="text-xs font-bold text-fur">Minha conta</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Minha conta">
            {links.map((l) => {
              const active = l.href === "/cliente" ? path === l.href : path.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
                  className={`flex flex-1 items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 font-extrabold transition lg:flex-none ${active ? "bg-orange-soft text-orange-dark" : "text-ink/80 hover:bg-cream"}`}>
                  <l.icon size={20} />{l.label}
                  {l.badge > 0 && <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-xs text-white">{l.badge}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
