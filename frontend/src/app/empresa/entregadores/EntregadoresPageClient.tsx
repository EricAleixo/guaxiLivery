"use client";
import { useState } from "react";
import { Bike, Check, Hash, IdCard, Mail, Phone, Plus, X, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PasswordInput } from "@/components/PasswordInput";
import { Loading } from "@/components/Loading";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/ui";
import { api, ApiError, VEHICLES, type CompanyLink, type CourierLinkStatus, type VehicleType } from "@/lib/api";
import { useEmpresa } from "@/lib/empresa";

const GROUPS: { status: CourierLinkStatus; title: string }[] = [
  { status: "CANDIDATURA", title: "Candidaturas" },
  { status: "ATIVO", title: "Entregadores ativos" },
  { status: "CONVITE", title: "Convites enviados" },
];

const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.***.***-${d.slice(9)}` : v || "—";
};

function Info({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-fur" aria-hidden />
      <div className="min-w-0"><dt className="text-[11px] font-bold uppercase tracking-wide text-fur">{label}</dt><dd className="font-semibold">{children}</dd></div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border-2 border-fur-light py-2">
      <p className="font-display text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-fur">{label}</p>
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState<Record<string, string>>({ vehicleType: "MOTO" });
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const v = (k: string) => f[k] ?? "";
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: k === "cpf" || k === "cnh" ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setFields({});
    const clean = Object.fromEntries(Object.entries(f).filter(([, x]) => x.trim() !== ""));
    try {
      await api.companyAddCourier({ ...clean, email: f.email, vehicleType: f.vehicleType as VehicleType });
      onDone();
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setFields(err.fields ?? {}); } else setError("Erro inesperado.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="animate-pop space-y-4 rounded-3xl border-2 border-fur-light bg-paper p-5">
      <p className="text-sm text-fur">Se o e-mail já for de um motoboy cadastrado, ele recebe um convite e os outros campos são ignorados. Senão, criamos a conta com a senha inicial informada.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="E-mail" error={fields.email}><input className={inputCls} type="email" required value={v("email")} onChange={set("email")} /></Field>
        <Field label="Nome" error={fields.name}><input className={inputCls} maxLength={120} value={v("name")} onChange={set("name")} /></Field>
        <Field label="Senha inicial" error={fields.password}><PasswordInput value={v("password")} onChange={set("password")} autoComplete="new-password" /></Field>
        <Field label="Telefone" error={fields.phone}><input className={inputCls} maxLength={30} value={v("phone")} onChange={set("phone")} /></Field>
        <Field label="CPF" error={fields.cpf}><input className={inputCls} inputMode="numeric" value={v("cpf")} onChange={set("cpf")} /></Field>
        <Field label="Veículo" error={fields.vehicleType}>
          <select className={inputCls} value={v("vehicleType")} onChange={set("vehicleType")}>
            {(Object.keys(VEHICLES) as VehicleType[]).map((k) => <option key={k} value={k}>{VEHICLES[k].label}</option>)}
          </select></Field>
        <Field label="Placa" error={fields.vehiclePlate}><input className={inputCls} maxLength={10} value={v("vehiclePlate")} onChange={set("vehiclePlate")} /></Field>
        <Field label="CNH" error={fields.cnh}><input className={inputCls} inputMode="numeric" value={v("cnh")} onChange={set("cnh")} /></Field>
      </div>
      <ErrorBox message={error} />
      <button className={btnCls} disabled={busy}>{busy ? "Salvando…" : "Cadastrar / convidar"}</button>
    </form>
  );
}

export default function EntregadoresPageClient() {
  const { couriers, deliveries, reloadCouriers } = useEmpresa();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!couriers) return <Loading label="Buscando entregadores…" />;

  async function act(l: CompanyLink, fn: () => Promise<unknown>) {
    setBusy(l.id); setError(null);
    try { await fn(); reloadCouriers(); } catch (e) { setError(e instanceof ApiError ? e.message : "Erro inesperado."); }
    finally { setBusy(null); }
  }
  const small = "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-extrabold disabled:opacity-50";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Entregadores</h1>
          <p className="text-fur">Motoboys que trabalham com você. Ao aceitar um pedido, escolha quem vai entregar.</p>
        </div>
        <button onClick={() => setAdding((a) => !a)} className={`${btnCls} flex items-center gap-2`}><Plus size={18} /> {adding ? "Fechar" : "Adicionar motoboy"}</button>
      </header>
      {adding && <AddForm onDone={() => { setAdding(false); reloadCouriers(); }} />}
      <ErrorBox message={error} />
      {GROUPS.map(({ status, title }) => {
        const list = couriers.filter((l) => l.status === status);
        if (list.length === 0 && status !== "ATIVO") return null;
        return (
          <section key={status} className="space-y-3">
            <h2 className="text-xl font-extrabold">{title} ({list.length})</h2>
            {list.length === 0 ? <p className="rounded-3xl bg-orange-soft p-6 text-center font-bold">Nenhum motoboy ativo ainda.</p> : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {list.map((l) => {
                  const c = l.courier, veh = VEHICLES[c.vehicleType];
                  const mine = (deliveries ?? []).filter((d) => d.courier?.id === c.id);
                  const done = mine.filter((d) => d.status === "ENTREGUE").length;
                  const live = mine.filter((d) => d.status === "ACEITO" || d.status === "EM_ROTA");
                  const vehicle = [veh.label, c.vehicleModel, c.vehicleColor].filter(Boolean).join(" · ");
                  return (
                    <article key={l.id} className="animate-pop space-y-3 rounded-3xl border-2 border-fur-light bg-paper p-4">
                      <div className="flex items-center gap-3">
                        <Avatar url={c.avatarUrl} name={c.name} className="h-14 w-14" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-extrabold leading-tight">{c.name}</h3>
                          <p className="text-sm text-fur">{status === "ATIVO" ? "Vínculo desde" : status === "CONVITE" ? "Convidado em" : "Candidatou-se em"} {new Date(l.updatedAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        {status === "ATIVO" && (
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${live.length ? "bg-sky-soft text-sky" : "bg-mint-soft text-mint"}`}>
                            {live.length ? `Em entrega (${live.length})` : "Disponível"}
                          </span>
                        )}
                      </div>
                      <dl className="grid gap-x-4 gap-y-1.5 rounded-2xl bg-cream p-3 text-sm sm:grid-cols-2">
                        <Info icon={Mail} label="E-mail"><a href={`mailto:${c.email}`} className="break-all underline-offset-2 hover:underline">{c.email}</a></Info>
                        <Info icon={Phone} label="Telefone">{c.phone ? <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a> : "—"}</Info>
                        <Info icon={IdCard} label="CPF">{maskCpf(c.cpf)}</Info>
                        <Info icon={IdCard} label="CNH">{c.cnh ?? "—"}</Info>
                        <Info icon={Bike} label="Veículo">{vehicle}</Info>
                        <Info icon={Hash} label="Placa">{c.vehiclePlate ? <span className="font-mono font-extrabold">{c.vehiclePlate.toUpperCase()}</span> : "—"}</Info>
                      </dl>
                      {status === "ATIVO" && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <Stat value={mine.length} label="Pedidos" />
                          <Stat value={done} label="Entregues" />
                          <Stat value={live.length} label="Em andamento" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        {status === "CANDIDATURA" && (
                          <>
                            <button disabled={busy === l.id} onClick={() => act(l, () => api.companyDecideCourier(l.id, true))} className={`${small} bg-mint text-white`}><Check size={15} /> Aprovar</button>
                            <button disabled={busy === l.id} onClick={() => act(l, () => api.companyDecideCourier(l.id, false))} className={`${small} border-2 border-berry text-berry hover:bg-berry-soft`}><X size={15} /> Recusar</button>
                          </>
                        )}
                        {status !== "CANDIDATURA" && (
                          <button disabled={busy === l.id} onClick={() => confirm(status === "ATIVO" ? "Encerrar vínculo com este motoboy?" : "Cancelar convite?") && act(l, () => api.companyEndCourier(l.id))}
                            className={`${small} border-2 border-berry text-berry hover:bg-berry-soft`}>{status === "ATIVO" ? "Encerrar vínculo" : "Cancelar convite"}</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
