"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";
import { Raccoon } from "@/components/Logo";

export default function LoginPageClient() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await api.login(email, password);
      signIn(r);
      router.push(homeFor(r.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? (err.status === 401 ? "E-mail ou senha incorretos." : err.message) : "Erro inesperado.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <div className="animate-pop rounded-3xl border-2 border-fur-light bg-paper p-6">
        <Raccoon className="mx-auto h-16 w-16" />
        <h1 className="mt-2 text-center text-3xl font-extrabold">Bem-vindo de volta!</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="E-mail"><input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field label="Senha"><input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          <ErrorBox message={error} />
          <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        </form>
        <p className="mt-4 text-center text-sm">Novo por aqui? <Link href="/cadastro" className="font-extrabold text-orange-dark underline">Crie sua conta</Link></p>
      </div>
    </div>
  );
}
