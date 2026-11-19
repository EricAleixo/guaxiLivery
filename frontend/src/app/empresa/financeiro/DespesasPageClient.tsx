"use client";
import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Loading } from "@/components/Loading";
import { ErrorBox, Field, inputCls, btnCls } from "@/components/ui";
import { api, type Expense, type ExpenseCategory, type ExpenseGroup, type ExpenseRequest, type ExpenseStatus, type PaymentMethod } from "@/lib/api";
import { brl } from "@/lib/format";
import { fmtDate, todayIso } from "@/lib/period";
import { PeriodBar, usePeriod } from "@/components/finance/PeriodBar";
import { Card, Empty, HBar, Stat, errMsg, useFinanceData } from "@/components/finance/parts";
import { FinanceHeader } from "./FinanceNav";

const PAY: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro", PIX: "Pix", CARTAO_DEBITO: "Cartão de débito", CARTAO_CREDITO: "Cartão de crédito",
  BOLETO: "Boleto", TRANSFERENCIA: "Transferência", OUTRO: "Outro",
};

export default function DespesasPageClient() {
  const p = usePeriod("mes");
  const [group, setGroup] = useState<"" | ExpenseGroup>("");
  const [status, setStatus] = useState<"" | ExpenseStatus>("");
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [editing, setEditing] = useState<Expense | null | undefined>(undefined); // undefined fechado, null novo
  const [actionErr, setActionErr] = useState<string | null>(null);
  useEffect(() => { api.expenseCategories().then(setCats).catch((e) => setActionErr(errMsg(e))); }, []);

  const list = useFinanceData(() => api.expenses({ ...p.range, group: group || undefined, status: status || undefined }), [p.range, group, status], p.valid);
  const overview = useFinanceData(() => api.financeOverview(p.range), [p.range], p.valid);
  const reload = () => { list.reload(); overview.reload(); };
  const sum = overview.data?.expenses;
  const groups = [...(sum?.byGroup ?? [])].filter((g) => g.total > 0).sort((a, b) => b.total - a.total);
  const gMax = Math.max(1, ...groups.map((g) => g.total));

  async function pay(e: Expense) {
    setActionErr(null);
    try { await api.setExpenseStatus(e.id, "PAGO", todayIso()); reload(); } catch (x) { setActionErr(errMsg(x)); }
  }
  async function remove(e: Expense) {
    if (!confirm(`Excluir "${e.description}"?`)) return;
    setActionErr(null);
    try { await api.deleteExpense(e.id); reload(); } catch (x) { setActionErr(errMsg(x)); }
  }

  return (
    <div className="space-y-6">
      <FinanceHeader title="Despesas" subtitle="Registre os gastos da empresa. Pagas e pendentes ficam separadas." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PeriodBar p={p} />
        <button onClick={() => setEditing(null)} className={`${btnCls} flex items-center gap-2`}><Plus size={18} strokeWidth={3} /> Nova despesa</button>
      </div>
      <ErrorBox message={list.error ?? overview.error ?? actionErr} />

      {sum && (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Stat label="Total (competência)" value={brl(sum.total)} hint={`${sum.count} lançamento(s)`} tone="bg-orange-soft" />
          <Stat label="Pagas" value={brl(sum.paid)} hint="saída efetiva de caixa" tone="bg-mint-soft" />
          <Stat label="Pendentes" value={brl(sum.pending)} hint={sum.overdue > 0 ? `${brl(sum.overdue)} vencidas` : "compromissos a pagar"} tone="bg-sun/30" />
          <Stat label="Fixas / variáveis" value={`${brl(sum.fixed)} / ${brl(sum.variable)}`} tone="bg-sky-soft" />
        </ul>
      )}

      <Card title="Total gasto por categoria">
        {groups.length === 0 ? <Empty>Nenhuma despesa no período.</Empty> : (
          <ul className="space-y-3">
            {groups.map((g) => <HBar key={g.group} label={g.label} value={g.total} max={gMax} text={brl(g.total)} />)}
          </ul>
        )}
      </Card>

      <Card title="Histórico">
        <div className="mb-3 flex flex-wrap gap-2">
          <select aria-label="Categoria" value={group} onChange={(e) => setGroup(e.target.value as "" | ExpenseGroup)} className={`${inputCls} !w-auto`}>
            <option value="">Todas as categorias</option>
            {cats.map((c) => <option key={c.group} value={c.group}>{c.label}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as "" | ExpenseStatus)} className={`${inputCls} !w-auto`}>
            <option value="">Pagas e pendentes</option><option value="PAGO">Pagas</option><option value="PENDENTE">Pendentes</option>
          </select>
        </div>
        {!list.data ? <Loading label="Carregando…" /> : list.data.length === 0 ? <Empty>Nenhuma despesa encontrada.</Empty> : (
          <ul className="divide-y-2 divide-dashed divide-fur-light">
            {list.data.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{e.description}</p>
                  <p className="truncate text-xs text-fur">{e.groupLabel} · {e.subcategory} · {fmtDate(e.expenseDate)} · {e.type === "FIXA" ? "fixa" : "variável"}{e.recurrence !== "NENHUMA" && ` · ${e.recurrence.toLowerCase()}`}{e.supplier && ` · ${e.supplier}`}</p>
                  {e.dueDate && e.status === "PENDENTE" && <p className={`text-xs font-bold ${e.overdue ? "text-berry" : "text-fur"}`}>{e.overdue ? "Venceu" : "Vence"} em {fmtDate(e.dueDate)}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${e.status === "PAGO" ? "bg-mint-soft text-mint" : e.overdue ? "bg-berry-soft text-berry" : "bg-sun/30 text-[#8a5a00]"}`}>{e.status === "PAGO" ? "Pago" : e.overdue ? "Vencida" : "Pendente"}</span>
                <span className="w-28 text-right font-extrabold tabular-nums">{brl(e.amount)}</span>
                <div className="flex gap-1">
                  {e.status === "PENDENTE" && <button onClick={() => pay(e)} aria-label="Marcar como paga" title="Marcar como paga" className="rounded-full p-2 text-mint hover:bg-mint-soft"><Check size={18} strokeWidth={3} /></button>}
                  <button onClick={() => setEditing(e)} aria-label="Editar" className="rounded-full p-2 hover:bg-orange-soft"><Pencil size={16} /></button>
                  <button onClick={() => remove(e)} aria-label="Excluir" className="rounded-full p-2 text-berry hover:bg-berry-soft"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing !== undefined && <ExpenseForm expense={editing} cats={cats} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
    </div>
  );
}

const num = (v: string) => Number(v.replace(",", "."));

function ExpenseForm({ expense, cats, onClose, onSaved }: { expense: Expense | null; cats: ExpenseCategory[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    description: expense?.description ?? "", group: (expense?.group ?? "INGREDIENTES") as ExpenseGroup, subcategory: expense?.subcategory ?? "",
    amount: expense ? String(expense.amount) : "", expenseDate: expense?.expenseDate ?? todayIso(), dueDate: expense?.dueDate ?? "",
    paidAt: expense?.paidAt ?? "", paymentMethod: (expense?.paymentMethod ?? "PIX") as PaymentMethod, supplier: expense?.supplier ?? "",
    notes: expense?.notes ?? "", type: expense?.type ?? "VARIAVEL", status: (expense?.status ?? "PAGO") as ExpenseStatus, recurrence: expense?.recurrence ?? "NENHUMA",
  });
  const [err, setErr] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((o) => ({ ...o, [k]: v }));
  const subs = cats.find((c) => c.group === f.group)?.subcategories ?? [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setFields({});
    const body: ExpenseRequest = {
      description: f.description, group: f.group, subcategory: f.subcategory || (subs[0] ?? "Outros"), amount: num(f.amount),
      expenseDate: f.expenseDate, dueDate: f.dueDate || null, paidAt: f.status === "PAGO" ? f.paidAt || f.expenseDate : null,
      paymentMethod: f.paymentMethod, supplier: f.supplier || null, notes: f.notes || null, type: f.type, status: f.status, recurrence: f.recurrence,
    };
    try { await (expense ? api.updateExpense(expense.id, body) : api.createExpense(body)); onSaved(); }
    catch (x) { setErr(errMsg(x)); if (x instanceof Object && "fields" in x) setFields((x as { fields?: Record<string, string> }).fields ?? {}); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label="Despesa">
      <form onSubmit={save} className="max-h-[92vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-3xl bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{expense ? "Editar despesa" : "Nova despesa"}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-cream"><X size={20} /></button>
        </div>
        <Field label="Descrição" error={fields.description}><input required maxLength={120} value={f.description} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Categoria"><select value={f.group} onChange={(e) => { set("group", e.target.value as ExpenseGroup); set("subcategory", ""); }} className={inputCls}>
            {cats.map((c) => <option key={c.group} value={c.group}>{c.label}</option>)}</select></Field>
          <Field label="Subcategoria" error={fields.subcategory}>
            <input list="subs" required maxLength={60} value={f.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder={subs[0] ?? "Digite uma categoria"} className={inputCls} />
            <datalist id="subs">{subs.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Valor (R$)" error={fields.amount}><input required inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} /></Field>
          <Field label="Forma de pagamento"><select value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as PaymentMethod)} className={inputCls}>
            {Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Data da despesa"><input type="date" required value={f.expenseDate} onChange={(e) => set("expenseDate", e.target.value)} className={inputCls} /></Field>
          <Field label="Vencimento (opcional)"><input type="date" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={inputCls} /></Field>
          <Field label="Tipo"><select value={f.type} onChange={(e) => set("type", e.target.value as "FIXA" | "VARIAVEL")} className={inputCls}><option value="FIXA">Fixa</option><option value="VARIAVEL">Variável</option></select></Field>
          <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value as ExpenseStatus)} className={inputCls}><option value="PAGO">Pago</option><option value="PENDENTE">Pendente</option></select></Field>
          <Field label="Recorrência"><select value={f.recurrence} onChange={(e) => set("recurrence", e.target.value as typeof f.recurrence)} className={inputCls}>
            <option value="NENHUMA">Nenhuma</option><option value="SEMANAL">Semanal</option><option value="MENSAL">Mensal</option><option value="ANUAL">Anual</option></select></Field>
          <Field label="Fornecedor (opcional)"><input maxLength={120} value={f.supplier} onChange={(e) => set("supplier", e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Observações (opcional)"><textarea maxLength={500} rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} /></Field>
        <ErrorBox message={err} />
        <button disabled={busy} className={`${btnCls} w-full`}>{busy ? "Salvando…" : "Salvar despesa"}</button>
      </form>
    </div>
  );
}
