import { Raccoon } from "./Logo";

/** Guaxinim pulando enquanto a página carrega. */
export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="grid place-items-center gap-2 p-16 text-center">
      <div className="pt-4">
        <Raccoon className="animate-hop h-16 w-16" />
        <div className="animate-shadow mx-auto mt-1 h-2 w-12 rounded-full bg-ink" />
      </div>
      <p className="font-display text-lg font-extrabold text-fur">{label}</p>
    </div>
  );
}
