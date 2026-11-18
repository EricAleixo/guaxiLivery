"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, ApiError, type Delivery } from "@/lib/api";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";
import { Stars } from "./Stars";

export function ReviewModal({ d, onClose, onDone }: { d: Delivery; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) { setError("Escolha de 1 a 5 estrelas."); return; }
    setBusy(true); setError(null);
    try {
      await api.createReview({ deliveryId: d.id, rating, comment: comment || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro inesperado.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal aria-label={`Avaliar ${d.foodName}`}
        className="animate-pop w-full max-w-md space-y-4 rounded-3xl border-2 border-fur-light bg-paper p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold leading-tight">Como foi o {d.foodName}?</h2>
            <p className="text-sm text-fur">{d.company?.tradeName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-orange-soft"><X size={20} /></button>
        </div>
        <div className="flex justify-center py-1"><Stars value={rating} onChange={setRating} size={36} /></div>
        <Field label="Comentário (opcional)">
          <textarea className={inputCls} rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte como estava o prato, a entrega…" /></Field>
        <ErrorBox message={error} />
        <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Enviando…" : "Enviar avaliação"}</button>
      </form>
    </div>
  );
}
