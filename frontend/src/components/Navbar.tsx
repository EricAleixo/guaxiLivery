"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, LayoutDashboard, LogIn, LogOut, ShoppingBag, UserPlus } from "lucide-react";
import { useAuth, homeFor } from "@/lib/auth";
import { useBag } from "@/lib/bag";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";

export function Navbar() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const { count } = useBag();
  return (
    <header className="sticky top-0 z-20 border-b border-fur-light bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[90rem] items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-8">
        <Link href={user ? homeFor(user.role) : "/"} className="min-w-0 shrink"><Logo /></Link>
        <div className="flex items-center gap-0.5 text-sm font-bold sm:gap-2">
          {!ready ? null : user ? (
            <>
              <Link href={user.role === "EMPRESA" ? "/empresa/perfil" : "/cliente/perfil"} aria-label="Meu perfil"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-fur hover:bg-orange-soft sm:pr-3">
                <Avatar url={user.avatarUrl} name={user.name} className="h-8 w-8" />
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
              </Link>
              {user.role === "EMPRESA" ? (
                <Link href="/empresa" aria-label="Painel" className="flex items-center gap-1.5 rounded-full p-2 hover:bg-orange-soft sm:px-3"><LayoutDashboard size={20} /> <span className="hidden sm:inline">Painel</span></Link>
              ) : (
                <>
                  <Link href="/cliente/feed" aria-label="Feed de comidas"
                    className="flex items-center gap-1.5 rounded-full p-2 hover:bg-orange-soft sm:px-3">
                    <Clapperboard size={20} /> <span className="hidden sm:inline">Feed</span>
                  </Link>
                  <Link href="/cliente/sacola" aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}
                    className="relative flex items-center gap-1.5 rounded-full p-2 hover:bg-orange-soft sm:px-3">
                    <ShoppingBag size={20} /> <span className="hidden sm:inline">Sacola</span>
                    {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-xs text-white">{count}</span>}
                  </Link>
                </>
              )}
              <button onClick={() => { signOut(); router.push("/"); }}
                aria-label="Sair" className="flex items-center gap-1.5 rounded-full border-2 border-ink p-2 hover:bg-ink hover:text-cream sm:px-4 sm:py-1.5">
                <LogOut size={18} /> <span className="hidden sm:inline">Sair</span></button>
            </>
          ) : (
            <>
              <Link href="/login" aria-label="Entrar" className="flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-orange-soft"><LogIn size={18} /> <span className="hidden sm:inline">Entrar</span></Link>
              <Link href="/cadastro" aria-label="Criar conta" className="flex items-center gap-1.5 rounded-full bg-orange px-3 py-2 text-white hover:bg-orange-dark sm:px-4"><UserPlus size={18} className="sm:hidden" /> <span className="hidden sm:inline">Criar conta</span></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
