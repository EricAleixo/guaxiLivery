"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/empresa/financeiro", label: "Visão geral" },
  { href: "/empresa/financeiro/faturamento", label: "Faturamento" },
  { href: "/empresa/financeiro/despesas", label: "Despesas" },
  { href: "/empresa/financeiro/relatorios", label: "Relatórios" },
];

export function FinanceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const path = usePathname();
  return (
    <header className="space-y-3">
      <div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="text-fur">{subtitle}</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Financeiro">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition ${path === t.href ? "bg-ink text-white" : "bg-orange-soft text-orange-dark hover:bg-orange/30"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
