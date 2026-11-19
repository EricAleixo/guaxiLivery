import type { Range } from "./api";

export type PresetId = "hoje" | "7d" | "mes" | "mes-anterior" | "ano" | "custom";
export const PRESETS: { id: PresetId; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "mes", label: "Este mês" },
  { id: "mes-anterior", label: "Mês anterior" },
  { id: "ano", label: "Ano" },
  { id: "custom", label: "Personalizado" },
];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function presetRange(id: PresetId, custom?: Range): Range {
  const t = new Date();
  switch (id) {
    case "hoje": return { from: iso(t), to: iso(t) };
    case "7d": { const f = new Date(t); f.setDate(f.getDate() - 6); return { from: iso(f), to: iso(t) }; }
    case "mes": return { from: iso(new Date(t.getFullYear(), t.getMonth(), 1)), to: iso(new Date(t.getFullYear(), t.getMonth() + 1, 0)) };
    case "mes-anterior": return { from: iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: iso(new Date(t.getFullYear(), t.getMonth(), 0)) };
    case "ano": return { from: `${t.getFullYear()}-01-01`, to: `${t.getFullYear()}-12-31` };
    case "custom": return custom ?? {};
  }
}

export const fmtDate = (d: string | null | undefined) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR") : "—");
export const fmtMonth = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
export const todayIso = () => iso(new Date());
