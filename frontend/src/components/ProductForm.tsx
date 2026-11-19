"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check, Film, Plus, X } from "lucide-react";
import { api, ApiError, mediaOf, uploadSrc, type Media, type Product, type ProductCategory } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";

const MAX_MEDIA = 10;
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

function Thumb({ src, video, label, onRemove }: { src: string; video: boolean; label: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-fur-light bg-ink">
      {video
        ? <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={src} alt="" className="h-full w-full object-cover" />}
      {video && <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 p-1 text-cream"><Film size={12} /></span>}
      <button type="button" onClick={onRemove} aria-label={label}
        className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-cream hover:bg-berry"><X size={14} /></button>
    </div>
  );
}

/** Janela para cadastrar ou editar um produto do cardápio. */
export function ProductForm({ product, onClose, onSaved }: {
  product: Product | null; onClose: () => void; onSaved: (p: Product) => void;
}) {
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "LANCHE");
  const [existing, setExisting] = useState<Media[]>(product ? mediaOf(product) : []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const filesRef = useRef(files);
  useEffect(() => { filesRef.current = files; }, [files]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)); };
  }, [onClose]);

  const total = existing.length + files.length;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const room = MAX_MEDIA - total;
    if (picked.length > room) setError(`Máximo de ${MAX_MEDIA} fotos/vídeos por produto.`); else setError(null);
    const ok: { file: File; url: string }[] = [];
    for (const file of picked.slice(0, Math.max(0, room))) {
      const video = file.type.startsWith("video/");
      if (file.size > (video ? MAX_VIDEO : MAX_IMAGE)) {
        setError(`${file.name}: ${video ? "vídeo" : "foto"} acima de ${video ? "50" : "5"}MB.`); continue;
      }
      ok.push({ file, url: URL.createObjectURL(file) });
    }
    setFiles((f) => [...f, ...ok]);
  }

  function dropNew(i: number) {
    setFiles((f) => { URL.revokeObjectURL(f[i].url); return f.filter((_, j) => j !== i); });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    fd.set("price", String(fd.get("price")).replace(",", "."));
    files.forEach((f) => fd.append("media", f.file));
    removed.forEach((id) => fd.append("removeMedia", String(id)));
    setBusy(true); setError(null); setFields({});
    try {
      onSaved(product ? await api.updateProduct(product.id, fd) : await api.createProduct(fd));
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields ?? {}); } else setError("Erro inesperado.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} role="dialog" aria-modal aria-label={product ? "Editar produto" : "Novo produto"}
        className="animate-pop w-full max-w-lg space-y-4 md:max-w-4xl rounded-3xl border-2 border-fur-light bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{product ? "Editar produto" : "Novo produto"} {CATEGORIES[category].emoji}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-orange-soft"><X size={20} /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_3fr] md:gap-8">
        <div className="space-y-2">
          <p className="text-sm font-bold">Fotos e vídeos <span className="font-semibold text-fur">({total}/{MAX_MEDIA})</span></p>
          <div className="grid grid-cols-3 gap-2">
            {existing.map((m) => (
              <Thumb key={m.id} src={uploadSrc(m.url)!} video={m.type === "VIDEO"} label="Remover"
                onRemove={() => { setExisting((l) => l.filter((x) => x.id !== m.id)); setRemoved((r) => [...r, m.id]); }} />
            ))}
            {files.map((f, i) => (
              <Thumb key={f.url} src={f.url} video={f.file.type.startsWith("video/")} label="Remover" onRemove={() => dropNew(i)} />
            ))}
            {total < MAX_MEDIA && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-fur-light bg-cream text-center text-fur transition hover:border-orange">
                <span><Plus size={28} className="mx-auto text-orange" /><span className="block text-xs font-bold">Adicionar</span></span>
                <input type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={pick} />
              </label>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-fur"><Camera size={13} /> JPG, PNG ou WEBP até 5MB · <Film size={13} /> MP4, WEBM ou MOV até 50MB. A primeira foto é a capa.</p>
        </div>

        <div className="space-y-4">
        <Field label="Nome do produto" error={fields.name}>
          <input name="name" className={inputCls} required maxLength={120} defaultValue={product?.name} placeholder="Ex.: X-Guaxi duplo" /></Field>

        <fieldset>
          <legend className="mb-1 block text-sm font-bold">Categoria</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORIES) as ProductCategory[]).map((c) => (
              <button type="button" key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`rounded-full border-2 px-3 py-1.5 text-sm font-extrabold transition ${category === c ? "border-orange bg-orange text-white" : "border-fur-light hover:bg-orange-soft"}`}>
                {CATEGORIES[c].emoji} {CATEGORIES[c].label}</button>
            ))}
          </div>
        </fieldset>

        <Field label="Preço" error={fields.price}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-fur">R$</span>
            <input name="price" className={`${inputCls} pl-12`} required inputMode="decimal" placeholder="0,00"
              defaultValue={product ? product.price.toFixed(2).replace(".", ",") : ""} pattern="\d{1,5}([.,]\d{1,2})?" title="Ex.: 24,90" />
          </div>
        </Field>

        <Field label="Descrição" error={fields.description}>
          <textarea name="description" rows={3} maxLength={500} className={inputCls} defaultValue={product?.description ?? ""}
            placeholder="Ingredientes, tamanho, detalhes que dão água na boca…" /></Field>
        </div>
        </div>

        <ErrorBox message={error} />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="rounded-full border-2 border-ink px-5 py-3 font-extrabold hover:bg-ink hover:text-cream">Cancelar</button>
          <button className={`${btnCls} flex flex-1 items-center justify-center gap-2`} disabled={busy}>
            {busy ? "Salvando…" : <><Check size={18} /> {product ? "Salvar alterações" : "Cadastrar produto"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
