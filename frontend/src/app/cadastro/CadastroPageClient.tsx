"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Store, UtensilsCrossed, UserRound, Phone } from "lucide-react";
import { api, ApiError, type Role } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { formatCnpj } from "@/lib/format";
import { Raccoon } from "@/components/Logo";
import { passwordStrength } from "@/lib/password";
import { btnCls, ErrorBox, Field, inputCls, PasswordStrength } from "@/components/ui";

const COMPANY_STEPS = [
  { title: "Sua conta", icon: UserRound, keys: ["name", "email", "password", "confirmPassword"] },
  { title: "A empresa", icon: Store, keys: ["tradeName", "cnpj"] },
  { title: "Contato", icon: Phone, keys: ["phone", "address", "description"] },
];

export default function CadastroPageClient() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tipo") === "empresa" ? "EMPRESA" : "CLIENTE");
  const [f, setF] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const isCompany = role === "EMPRESA";
  const last = isCompany ? COMPANY_STEPS.length - 1 : 0;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: k === "cnpj" ? formatCnpj(e.target.value) : e.target.value }));
  const v = (k: string) => f[k] ?? "";

  function stepValid() {
    const els = stepRef.current?.querySelectorAll<HTMLInputElement>("input, textarea") ?? [];
    for (const el of els) if (!el.reportValidity()) return false;
    if (step === 0 && !passwordStrength(v("password")).ok) { setFields({ password: "Use 8+ caracteres com letra, número e caractere especial" }); return false; }
    if (step === 0 && v("password") !== v("confirmPassword")) { setFields({ confirmPassword: "As senhas não coincidem" }); return false; }
    if (step === 1 && v("cnpj").length !== 14) { setFields({ cnpj: "CNPJ deve ter 14 dígitos" }); return false; }
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
        : await api.registerClient({ name: f.name, email: f.email, password: f.password });
      signIn(r);
      router.push(homeFor(r.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message); setFields(err.fields ?? {});
        const bad = COMPANY_STEPS.findIndex((s) => s.keys.some((k) => err.fields?.[k]));
        if (isCompany && bad >= 0) setStep(bad);
        else if (isCompany && err.status === 409) setStep(0);
      } else setError("Erro inesperado.");
    } finally { setBusy(false); }
  }

  const tab = (r: Role, label: string, icon: React.ReactNode) => (
    <button type="button" onClick={() => { setRole(r); setStep(0); setError(null); setFields({}); }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 font-extrabold transition ${role === r ? "bg-ink text-cream" : "text-ink hover:bg-orange-soft"}`}>{icon}{label}</button>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="animate-pop rounded-3xl border-2 border-fur-light bg-paper p-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold">Crie sua conta <Raccoon className="h-9 w-9" /></h1>
        <div className="mt-4 flex gap-1 rounded-full bg-fur-light/60 p-1">
          {tab("CLIENTE", "Quero pedir", <UtensilsCrossed size={18} />)}{tab("EMPRESA", "Sou empresa", <Store size={18} />)}
        </div>

        {isCompany && (
          <ol className="mt-6 flex items-center" aria-label="Etapas do cadastro">
            {COMPANY_STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span className={`grid h-10 w-10 place-items-center rounded-full transition ${i < step ? "bg-mint text-white" : i === step ? "bg-orange text-white" : "bg-fur-light text-fur"}`}>
                    {i < step ? <Check size={20} strokeWidth={3} /> : <s.icon size={20} />}
                  </span>
                  <span className={`text-xs font-bold ${i === step ? "text-ink" : "text-fur"}`}>{s.title}</span>
                </div>
                {i < COMPANY_STEPS.length - 1 && <span className={`mx-2 mb-5 h-1 flex-1 rounded ${i < step ? "bg-mint" : "bg-fur-light"}`} />}
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
                  <input className={inputCls} type="password" required maxLength={72} value={v("password")} onChange={set("password")} autoComplete="new-password" />
                  <PasswordStrength password={v("password")} /></Field>
                <Field label="Confirmar senha" error={fields.confirmPassword}>
                  <input className={inputCls} type="password" required maxLength={72} value={v("confirmPassword")} onChange={set("confirmPassword")} autoComplete="new-password" /></Field>
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
