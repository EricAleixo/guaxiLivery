"use client";
import { useMemo, useState } from "react";
import type { Range } from "@/lib/api";
import { PRESETS, presetRange, todayIso, type PresetId } from "@/lib/period";

/** Estado do filtro de período; o intervalo só muda de referência quando o preset/datas mudam. */
export function usePeriod(initial: PresetId = "mes") {
  const [preset, setPreset] = useState<PresetId>(initial);
  const [custom, setCustom] = useState<Range>({ from: todayIso(), to: todayIso() });
  const range = useMemo(() => presetRange(preset, custom), [preset, custom]);
  const valid = !!range.from && !!range.to && range.from <= range.to;
  return { preset, setPreset, custom, setCustom, range, valid };
}

export function PeriodBar({ p }: { p: ReturnType<typeof usePeriod> }) {
  return (
    <div className="space-y-2">
      <div role="tablist" aria-label="Período" className="flex flex-wrap gap-2">
        {PRESETS.map((x) => (
          <button key={x.id} role="tab" aria-selected={p.preset === x.id} onClick={() => p.setPreset(x.id)}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${p.preset === x.id ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>
            {x.label}
          </button>
        ))}
      </div>
      {p.preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <input type="date" aria-label="Data inicial" value={p.custom.from ?? ""} onChange={(e) => p.setCustom({ ...p.custom, from: e.target.value })}
            className="rounded-2xl border-2 border-fur-light bg-paper px-3 py-2" />
          até
          <input type="date" aria-label="Data final" value={p.custom.to ?? ""} onChange={(e) => p.setCustom({ ...p.custom, to: e.target.value })}
            className="rounded-2xl border-2 border-fur-light bg-paper px-3 py-2" />
          {!p.valid && <span className="text-berry">A data final deve ser depois da inicial.</span>}
        </div>
      )}
    </div>
  );
}
