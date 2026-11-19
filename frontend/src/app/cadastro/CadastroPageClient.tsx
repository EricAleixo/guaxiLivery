"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bike, Check, Store, UtensilsCrossed, UserRound, Phone } from "lucide-react";
import { api, ApiError, VEHICLES, type Company, type Role, type VehicleType } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { formatCnpj } from "@/lib/format";
import { Raccoon } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { passwordStrength } from "@/lib/password";
import { btnCls, ErrorBox, Field, inputCls, PasswordStrength } from "@/components/ui";

const COMPANY_STEPS = [
  { title: "Sua conta", icon: UserRound, keys: ["name", "email", "password", "confirmPassword"] },
  { title: "A empresa", icon: Store, keys: ["tradeName", "cnpj"] },
  { title: "Contato", icon: Phone, keys: ["phone", "address", "description"] },
];

const COURIER_STEPS = [
  { title: "Sua conta", icon: UserRound, keys: ["name", "email", "password", "confirmPassword"] },
  { title: "Veículo", icon: Bike, keys: ["phone", "cpf", "vehicleType", "vehiclePlate", "vehicleModel", "vehicleColor", "cnh"] },
  { title: "Empresas", icon: Store, keys: [] as string[] },
];

export default function CadastroPageClient() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>(() => {
    if (typeof window === "undefined") return "CLIENTE";
    const t = new URLSearchParams(window.location.search).get("tipo");
    return t === "empresa" ? "EMPRESA" : t === "entregador" ? "ENTREGADOR" : "CLIENTE";
  });
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { api.companies().then(setCompanies).catch(() => setCompanies([])); }, []);
  const [f, setF] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const isCompany = role === "EMPRESA";
  const isCourier = role === "ENTREGADOR";
  const steps = isCompany ? COMPANY_STEPS : isCourier ? COURIER_STEPS : null;
  const last = steps ? steps.length - 1 : 0;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: k === "cnpj" ? formatCnpj(e.target.value) : k === "cpf" || k === "cnh" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value }));
  const v = (k: string) => f[k] ?? "";
  const motorized = VEHICLES[(v("vehicleType") || "MOTO") as VehicleType].motorized;

  function stepValid() {
    const els = stepRef.current?.querySelectorAll<HTMLInputElement>("input, textarea") ?? [];
    for (const el of els) if (!el.reportValidity()) return false;
    if (step === 0 && !passwordStrength(v("password")).ok) { setFields({ password: "Use 8+ caracteres com letra, número e caractere especial" }); return false; }
    if (step === 0 && v("password") !== v("confirmPassword")) { setFields({ confirmPassword: "As senhas não coincidem" }); return false; }
    if (isCourier && step === 1 && v("cpf").length !== 11) { setFields({ cpf: "CPF deve ter 11 dígitos" }); return false; }
    if (isCourier && step === 1 && motorized && (!v("vehiclePlate").trim() || v("cnh").length !== 11)) {
      setFields({ ...(v("vehiclePlate").trim() ? {} : { vehiclePlate: "Informe a placa" }), ...(v("cnh").length === 11 ? {} : { cnh: "CNH deve ter 11 dígitos" }) });
      return false;
    }
    if (isCompany && step === 1 && v("cnpj").length !== 14) { setFields({ cnpj: "CNPJ deve ter 14 dígitos" }); return false; }
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFields({});
    if (!stepValid()) return;
    if (step < last) { setStep(step + 1); return; }
    setBusy(true);
    try {
      const data = { ...f };
      delete data.confirmPassword;
      const r = isCompany
        ? await api.registerCompany(data)
        : isCourier
          ? await api.registerCourier({
              name: f.name, email: f.email, password: f.password, phone: f.phone, cpf: f.cpf,
              vehicleType: (f.vehicleType || "MOTO") as VehicleType,
              vehiclePlate: f.vehiclePlate?.trim() || undefined, vehicleModel: f.vehicleModel?.trim() || undefined,
              vehicleColor: f.vehicleColor?.trim() || undefined, cnh: f.cnh || undefined, companyIds: picked,
            })
          : await api.registerClient({ name: f.name, email: f.email, password: f.password });
      signIn(r);
      router.push(homeFor(r.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message); setFields(err.fields ?? {});
        const bad = (steps ?? []).findIndex((s) => s.keys.some((k) => err.fields?.[k]));
        if (steps && bad >= 0) setStep(bad);
        else if (steps && err.status === 409) setStep(0);
      } else setError("Erro inesperado.");
    } finally { setBusy(false); }
  }

  const tab = (r: Role, label: string, hint: string, icon: React.ReactNode) => (
    <button type="button" role="tab" aria-selected={role === r}
      onClick={() => { setRole(r); setStep(0); setError(null); setFields({}); }}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${role === r
        ? "border-orange bg-orange-soft text-orange-dark shadow-[0_3px_0_var(--color-orange)]"
        : "border-fur-light bg-paper text-ink hover:-translate-y-0.5 hover:border-orange"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-full ${role === r ? "bg-orange text-white" : "bg-fur-light text-fur"}`}>{icon}</span>
      <span className="text-sm font-extrabold leading-tight">{label}</span>
      <span className="hidden text-xs font-semibold text-fur sm:block">{hint}</span>
    </button>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="animate-pop rounded-3xl border-2 border-fur-light bg-paper p-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold">Crie sua conta <Raccoon className="h-9 w-9" /></h1>
        <div role="tablist" aria-label="Tipo de conta" className="mt-4 flex gap-2">
          {tab("CLIENTE", "Quero pedir", "Peça comida", <UtensilsCrossed size={20} />)}
          {tab("ENTREGADOR", "Sou motoboy", "Faça entregas", <Bike size={20} />)}
          {tab("EMPRESA", "Sou empresa", "Venda e entregue", <Store size={20} />)}
        </div>

        {steps && (
          <ol className="mt-6 flex items-center" aria-label="Etapas do cadastro">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span className={`grid h-10 w-10 place-items-center rounded-full transition ${i < step ? "bg-mint text-white" : i === step ? "bg-orange text-white" : "bg-fur-light text-fur"}`}>
                    {i < step ? <Check size={20} strokeWidth={3} /> : <s.icon size={20} />}
                  </span>
                  <span className={`text-xs font-bold ${i === step ? "text-ink" : "text-fur"}`}>{s.title}</span>
                </div>
                {i < steps.length - 1 && <span className={`mx-2 mb-5 h-1 flex-1 rounded ${i < step ? "bg-mint" : "bg-fur-light"}`} />}
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <div ref={stepRef} key={`${role}-${step}`} className="animate-pop space-y-4">
            {step === 0 && (
              <>
                <Field label={isCompany ? "Seu nome (responsável)" : "Seu nome"} error={fields.name}>
                  <input className={inputCls} required maxLength={120} value={v("name")} onChange={set("name")} autoComplete="name" /></Field>
                <Field label="E-mail" error={fields.email}>
                  <input className={inputCls} type="email" required value={v("email")} onChange={set("email")} autoComplete="email" /></Field>
                <Field label="Senha" error={fields.password}>
                  <PasswordInput required value={v("password")} onChange={set("password")} autoComplete="new-password" />
                  <PasswordStrength password={v("password")} /></Field>
                <Field label="Confirmar senha" error={fields.confirmPassword}>
                  <PasswordInput required value={v("confirmPassword")} onChange={set("confirmPassword")} autoComplete="new-password" /></Field>
              </>
            )}
            {isCompany && step === 1 && (
              <>
                <Field label="Nome fantasia" error={fields.tradeName}>
                  <input className={inputCls} required maxLength={120} value={v("tradeName")} onChange={set("tradeName")} /></Field>
                <Field label="CNPJ (14 dígitos)" error={fields.cnpj}>
                  <input className={inputCls} required inputMode="numeric" value={v("cnpj")} onChange={set("cnpj")} /></Field>
              </>
            )}
            {isCompany && step === 2 && (
              <>
                <Field label="Telefone" error={fields.phone}><input className={inputCls} maxLength={30} value={v("phone")} onChange={set("phone")} /></Field>
                <Field label="Endereço" error={fields.address}><input className={inputCls} maxLength={255} value={v("address")} onChange={set("address")} /></Field>
                <Field label="Descrição" error={fields.description}><textarea className={inputCls} rows={3} maxLength={500} value={v("description")} onChange={set("description")} /></Field>
              </>
            )}
            {isCourier && step === 1 && (
              <>
                <Field label="Telefone / WhatsApp" error={fields.phone}><input className={inputCls} required maxLength={30} value={v("phone")} onChange={set("phone")} autoComplete="tel" /></Field>
                <Field label="CPF (11 dígitos)" error={fields.cpf}><input className={inputCls} required inputMode="numeric" value={v("cpf")} onChange={set("cpf")} /></Field>
                <Field label="Veículo" error={fields.vehicleType}>
                  <select className={inputCls} value={v("vehicleType") || "MOTO"} onChange={(e) => setF((p) => ({ ...p, vehicleType: e.target.value }))}>
                    {(Object.keys(VEHICLES) as VehicleType[]).map((k) => <option key={k} value={k}>{VEHICLES[k].emoji} {VEHICLES[k].label}</option>)}
                  </select></Field>
                {motorized && (
                  <>
                    <Field label="Placa" error={fields.vehiclePlate}><input className={inputCls} maxLength={10} value={v("vehiclePlate")} onChange={set("vehiclePlate")} /></Field>
                    <Field label="CNH (11 dígitos)" error={fields.cnh}><input className={inputCls} inputMode="numeric" value={v("cnh")} onChange={set("cnh")} /></Field>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Modelo (opcional)" error={fields.vehicleModel}><input className={inputCls} maxLength={60} value={v("vehicleModel")} onChange={set("vehicleModel")} /></Field>
                  <Field label="Cor (opcional)" error={fields.vehicleColor}><input className={inputCls} maxLength={40} value={v("vehicleColor")} onChange={set("vehicleColor")} /></Field>
                </div>
              </>
            )}
            {isCourier && step === 2 && (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-bold">Para quais empresas você quer trabalhar? <span className="font-normal text-fur">(a empresa precisa aprovar)</span></legend>
                {!companies ? <p className="text-sm text-fur">Carregando empresas…</p> : companies.length === 0 ? <p className="text-sm text-fur">Nenhuma empresa ainda. Você poderá se candidatar depois.</p> :
                  companies.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-fur-light bg-paper px-4 py-2.5 font-bold has-[:checked]:border-orange has-[:checked]:bg-orange-soft">
                      <input type="checkbox" className="h-4 w-4 accent-orange" checked={picked.includes(c.id)}
                        onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} />
                      {c.tradeName}
                    </label>
                  ))}
              </fieldset>
            )}
          </div>
          <ErrorBox message={error} />
          <div className="flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => { setStep(step - 1); setError(null); setFields({}); }}
                className="flex items-center gap-1 rounded-full border-2 border-ink px-5 py-3 font-extrabold hover:bg-ink hover:text-cream">
                <ArrowLeft size={18} /> Voltar</button>
            )}
            <button className={`${btnCls} flex flex-1 items-center justify-center gap-2`} disabled={busy}>
              {step < last ? <>Continuar <ArrowRight size={18} /></> : busy ? "Criando…" : <>Criar conta <Check size={18} /></>}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm">Já tem conta? <Link href="/login" className="font-extrabold text-orange-dark underline">Entrar</Link></p>
      </div>
    </div>
  );
}
