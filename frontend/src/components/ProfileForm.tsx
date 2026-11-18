"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { api, ApiError, type Profile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { Loading } from "@/components/Loading";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";

/** Perfil do cliente ou da empresa: foto + dados de contato. */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const blob = useRef<string | null>(null);

  useEffect(() => { api.profile().then(setProfile).catch((e) => setError(e.message)); }, []);
  useEffect(() => () => { if (blob.current) URL.revokeObjectURL(blob.current); }, []);

  if (!profile) return error ? <ErrorBox message={error} /> : <Loading label="Abrindo seu perfil…" />;
  const company = profile.role === "EMPRESA";

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (blob.current) URL.revokeObjectURL(blob.current);
    blob.current = f ? URL.createObjectURL(f) : null;
    setPreview(blob.current);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const img = fd.get("image") as File | null;
    if (img && img.size === 0) fd.delete("image");
    if (img && img.size > 5 * 1024 * 1024) { setError("A foto deve ter no máximo 5MB."); return; }
    setBusy(true); setError(null); setFields({}); setSaved(false);
    try {
      const p = await api.updateProfile(fd);
      setProfile(p); setPreview(null);
      if (user) updateUser({ ...user, name: p.name, avatarUrl: p.avatarUrl });
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields ?? {}); } else setError("Erro inesperado.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="animate-pop grid gap-6 rounded-3xl border-2 border-fur-light bg-paper p-6 md:grid-cols-[16rem_1fr] md:gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <label className="group relative cursor-pointer">
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="Nova foto" className="h-40 w-40 rounded-full object-cover" />
            : <Avatar url={profile.avatarUrl} name={profile.name} className="h-40 w-40" />}
          <span className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-orange text-white shadow transition group-hover:bg-orange-dark"><Camera size={20} /></span>
          <input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={pick} />
        </label>
        <p className="text-sm font-bold text-fur">{company ? "Logo da empresa" : "Sua foto"}</p>
        <p className="text-xs text-fur">JPG, PNG ou WEBP · até 5MB</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={company ? "Nome do responsável" : "Seu nome"} error={fields.name}>
            <input name="name" className={inputCls} required maxLength={120} defaultValue={profile.name} /></Field>
          <Field label="E-mail"><input className={`${inputCls} opacity-70`} value={profile.email} readOnly /></Field>
          {company && (
            <>
              <Field label="Nome fantasia" error={fields.tradeName}>
                <input name="tradeName" className={inputCls} required maxLength={120} defaultValue={profile.tradeName ?? ""} /></Field>
              <Field label="CNPJ"><input className={`${inputCls} opacity-70`} value={profile.cnpj ?? ""} readOnly /></Field>
            </>
          )}
          <Field label="Telefone" error={fields.phone}>
            <input name="phone" className={inputCls} maxLength={30} defaultValue={profile.phone ?? ""} autoComplete="tel" /></Field>
          <Field label={company ? "Endereço da empresa" : "Endereço de entrega padrão"} error={fields.address}>
            <input name="address" className={inputCls} maxLength={255} defaultValue={profile.address ?? ""} autoComplete="street-address" /></Field>
        </div>
        {company && (
          <Field label="Sobre a empresa" error={fields.description}>
            <textarea name="description" rows={4} maxLength={500} className={inputCls} defaultValue={profile.description ?? ""}
              placeholder="Conte a história, especialidades, horário…" /></Field>
        )}
        <ErrorBox message={error} />
        <div className="flex items-center gap-3">
          <button className={`${btnCls} flex items-center gap-2`} disabled={busy}>{busy ? "Salvando…" : <><Check size={18} /> Salvar perfil</>}</button>
          {saved && <p role="status" className="font-bold text-mint">Perfil atualizado!</p>}
        </div>
      </div>
    </form>
  );
}
