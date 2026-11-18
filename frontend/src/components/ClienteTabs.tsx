"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ReceiptText } from "lucide-react";
import { useBag } from "@/lib/bag";

export function ClienteTabs() {
  const path = usePathname();
  const { count } = useBag();
  const tabs = [
    { href: "/cliente/sacola", label: "Sacola", icon: ShoppingBag, badge: count },
    { href: "/cliente/pedidos", label: "Meus pedidos", icon: ReceiptText, badge: 0 },
  ];
  return (
    <nav className="flex gap-2" aria-label="Sacola e pedidos">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}
          className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${path === t.href ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
          <t.icon size={16} /> {t.label}{t.badge > 0 && ` (${t.badge})`}
        </Link>
      ))}
    </nav>
  );
}
