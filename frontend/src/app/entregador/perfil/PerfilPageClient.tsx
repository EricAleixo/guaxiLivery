"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { Loading } from "@/components/Loading";
import { ProfileForm } from "@/components/ProfileForm";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";
import { api, ApiError, VEHICLES, type CourierProfileRequest, type VehicleType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useEntregador } from "@/lib/entregador";

export default function PerfilPageClient() {
  const { profile, setProfile } = useEntregador();
  const { user, updateUser } = useAuth();
  const [f, setF] = useState<Partial<CourierProfileRequest>>({});
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!profile) return <Loading label="Abrindo seu perfil…" />;

  const val = <K extends keyof CourierProfileRequest>(k: K) => (f[k] ?? profile[k] ?? "") as string;
  const set = (k: keyof CourierProfileRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const raw = e.target.value;
    setSaved(false);
    setF((p) => ({ ...p, [k]: k === "cpf" || k === "cnh" ? raw.replace(/\D/g, "").slice(0, 11) : raw }));
  };
  const type = (val("vehicleType") || "MOTO") as VehicleType;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setFields({}); setSaved(false);
    try {
      const p = await api.updateCourierProfile({
        name: val("name"), phone: val("phone"), cpf: val("cpf"), vehicleType: type,
        vehiclePlate: val("vehiclePlate").trim() || undefined, vehicleModel: val("vehicleModel").trim() || undefined,
        vehicleColor: val("vehicleColor").trim() || undefined, cnh: val("cnh") || undefined,
      });
      setProfile(p); setF({}); setSaved(true);
      if (user) updateUser({ ...user, name: p.name });
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields ?? {}); } else setError("Erro inesperado.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Meu perfil</h1>
      <form onSubmit={submit} className="animate-pop space-y-4 rounded-3xl border-2 border-fur-light bg-paper p-6">
        <h2 className="text-xl font-extrabold">Dados do motoboy</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" error={fields.name}><input className={inputCls} required maxLength={120} value={val("name")} onChange={set("name")} /></Field>
          <Field label="Telefone" error={fields.phone}><input className={inputCls} required maxLength={30} value={val("phone")} onChange={set("phone")} /></Field>
          <Field label="CPF" error={fields.cpf}><input className={inputCls} required inputMode="numeric" value={val("cpf")} onChange={set("cpf")} /></Field>
          <Field label="Veículo" error={fields.vehicleType}>
            <select className={inputCls} value={type} onChange={set("vehicleType")}>
              {(Object.keys(VEHICLES) as VehicleType[]).map((k) => <option key={k} value={k}>{VEHICLES[k].emoji} {VEHICLES[k].label}</option>)}
            </select></Field>
          <Field label="Placa" error={fields.vehiclePlate}><input className={inputCls} maxLength={10} value={val("vehiclePlate")} onChange={set("vehiclePlate")} /></Field>
          <Field label="CNH" error={fields.cnh}><input className={inputCls} inputMode="numeric" value={val("cnh")} onChange={set("cnh")} /></Field>
          <Field label="Modelo" error={fields.vehicleModel}><input className={inputCls} maxLength={60} value={val("vehicleModel")} onChange={set("vehicleModel")} /></Field>
          <Field label="Cor" error={fields.vehicleColor}><input className={inputCls} maxLength={40} value={val("vehicleColor")} onChange={set("vehicleColor")} /></Field>
        </div>
        <ErrorBox message={error} />
        <button className={`${btnCls} flex items-center gap-2`} disabled={busy}>{saved ? <><Check size={18} /> Salvo</> : busy ? "Salvando…" : "Salvar dados"}</button>
      </form>
      <ProfileForm />
    </div>
  );
}
