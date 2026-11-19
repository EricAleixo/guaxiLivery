import { Check, CircleCheck, Clock, Bike, X, type LucideIcon } from "lucide-react";
import type { DeliveryStatus, ProductCategory } from "./api";

export const STATUS: Record<DeliveryStatus, { label: string; icon: LucideIcon; chip: string }> = {
  PENDENTE: { label: "Aguardando", icon: Clock, chip: "bg-sun/30 text-[#8a5a00]" },
  ACEITO: { label: "Aceito", icon: Check, chip: "bg-orange-soft text-orange-dark" },
  EM_ROTA: { label: "A caminho", icon: Bike, chip: "bg-sky-soft text-sky" },
  ENTREGUE: { label: "Entregue", icon: CircleCheck, chip: "bg-mint-soft text-mint" },
  CANCELADO: { label: "Cancelado", icon: X, chip: "bg-berry-soft text-berry" },
};

export const STEPS: DeliveryStatus[] = ["PENDENTE", "ACEITO", "EM_ROTA", "ENTREGUE"];

export function timeAgo(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export const formatCnpj = (v: string) => v.replace(/\D/g, "").slice(0, 14);

export const CATEGORIES: Record<ProductCategory, { label: string; emoji: string; tint: string }> = {
  LANCHE: { label: "Lanche", emoji: "🍔", tint: "bg-sun/30" },
  PIZZA: { label: "Pizza", emoji: "🍕", tint: "bg-orange-soft" },
  MARMITA: { label: "Marmita", emoji: "🍛", tint: "bg-mint-soft" },
  DOCE: { label: "Doce", emoji: "🧁", tint: "bg-berry-soft" },
  BEBIDA: { label: "Bebida", emoji: "🥤", tint: "bg-sky-soft" },
  SAUDAVEL: { label: "Saudável", emoji: "🥗", tint: "bg-mint-soft" },
  OUTROS: { label: "Outros", emoji: "🍽️", tint: "bg-fur-light" },
};

export const brl = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Codigo curto de um UUID para exibir na tela (ex.: #a1b2c3d4). */
export const shortId = (id: string) => id.slice(0, 8);
