"use client";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Erro inesperado.");

/** Carrega dados dependentes do período; ignora respostas antigas (corrida entre filtros). */
export function useFinanceData<T>(load: () => Promise<T>, deps: unknown[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load().then((d) => { if (alive) { setData(d); setError(null); } }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

export function Card({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`animate-pop rounded-3xl border-2 border-fur-light bg-paper p-5 ${className}`}>
      <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
      {hint ? <p className="mb-3 text-xs font-bold text-fur">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone: string }) {
  return (
    <li className={`rounded-3xl p-4 sm:p-5 ${tone}`}>
      <p className="text-sm font-extrabold text-ink/80">{label}</p>
      <p className="font-display text-2xl font-extrabold leading-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs font-bold text-ink/65">{hint}</p>}
    </li>
  );
}

export const pct = (n: number | null | undefined) => (n == null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);

export function HBar({ label, value, max, text, tone = "bg-orange" }: { label: React.ReactNode; value: number; max: number; text: string; tone?: string }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 truncate font-bold">{label}</span>
      <span className="h-3 flex-1 rounded-full bg-cream">
        <span className={`block h-3 rounded-full ${tone}`} style={{ width: `${max ? Math.max(value ? 3 : 0, (Math.abs(value) / max) * 100) : 0}%` }} />
      </span>
      <span className="w-28 text-right font-extrabold tabular-nums">{text}</span>
    </li>
  );
}

export interface Series { key: string; label: string; tone: string; values: number[] }

/** Barras agrupadas (ou linha de lucro via série única). Valores negativos ficam abaixo da linha zero. */
export function BarChart({ labels, series, fmt }: { labels: string[]; series: Series[]; fmt: (n: number) => string }) {
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all), min = Math.min(0, ...all), span = max - min;
  const zero = (max / span) * 100;
  return (
    <div>
      <div className="flex h-52 items-stretch gap-2 overflow-x-auto" role="img"
        aria-label={labels.map((l, i) => `${l}: ${series.map((s) => `${s.label} ${fmt(s.values[i])}`).join(", ")}`).join("; ")}>
        {labels.map((l, i) => (
          <div key={i} className="relative flex min-w-8 flex-1 items-stretch justify-center gap-0.5" title={`${l}\n${series.map((s) => `${s.label}: ${fmt(s.values[i])}`).join("\n")}`}>
            {series.map((s) => {
              const v = s.values[i], h = (Math.abs(v) / span) * 100;
              return (
                <span key={s.key} className="relative block w-full max-w-5">
                  <span className={`absolute w-full rounded-sm ${s.tone}`}
                    style={v >= 0 ? { bottom: `${100 - zero}%`, height: `${v ? Math.max(1, h) : 0}%` } : { top: `${zero}%`, height: `${Math.max(1, h)}%` }} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2 overflow-x-auto">
        {labels.map((l, i) => <span key={i} className="min-w-8 flex-1 truncate text-center text-[11px] font-bold text-fur">{l}</span>)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-4 text-xs font-bold">
        {series.map((s) => <li key={s.key} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${s.tone}`} />{s.label}</li>)}
      </ul>
    </div>
  );
}

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl bg-cream p-6 text-center font-bold text-fur">{children}</p>
);
