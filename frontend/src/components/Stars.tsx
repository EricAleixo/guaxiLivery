"use client";
import { Star } from "lucide-react";

/** Estrelas somente leitura (aceita média fracionada) ou, com onChange, seletor de nota. */
export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={`Nota ${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        const star = (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-fur-light" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-sun text-sun" style={{ minWidth: size }} /></span>
          </span>
        );
        return onChange
          ? <button type="button" key={n} onClick={() => onChange(n)} role="radio" aria-checked={Math.round(value) === n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`} className="rounded p-0.5 transition hover:scale-110">{star}</button>
          : <span key={n}>{star}</span>;
      })}
    </span>
  );
}
