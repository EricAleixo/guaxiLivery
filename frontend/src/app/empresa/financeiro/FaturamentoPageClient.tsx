"use client";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Loading } from "@/components/Loading";
import { ErrorBox, Field, inputCls, btnCls } from "@/components/ui";
import { api, type FinancialOrder, type OrderAdjustment } from "@/lib/api";
import { brl, shortId } from "@/lib/format";
import { PeriodBar, usePeriod } from "@/components/finance/PeriodBar";
import { Card, Empty, HBar, Stat, errMsg, useFinanceData } from "@/components/finance/parts";
import { FinanceHeader } from "./FinanceNav";

export default function FaturamentoPageClient() {
  const p = usePeriod("mes");
  const { data, error, reload } = useFinanceData(() => api.financeRevenue(p.range), [p.range], p.valid);
  const [editing, setEditing] = useState<FinancialOrder | null>(null);
  const s = data?.summary;
  const pMax = Math.max(1, ...(data?.products ?? []).map((x) => x.gross));

  return (
    <div className="space-y-6">
      <FinanceHeader title="Faturamento" subtitle="Calculado automaticamente a partir dos pedidos finalizados." />
      <PeriodBar p={p} />
      <ErrorBox message={error} />
      {!data || !s ? <Loading label="Somando pedidos…" /> : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Stat label="Faturamento bruto" value={brl(s.gross)} hint={`itens ${brl(s.itemsSubtotal)} + entregas ${brl(s.deliveryFees)}`} tone="bg-orange-soft" />
            <Stat label="Receita líquida" value={brl(s.net)} hint="bruto − descontos − taxas" tone="bg-sky-soft" />
            <Stat label="Pedidos finalizados" value={String(s.orders)} hint={`${s.canceledOrders} cancelado(s) fora da conta`} tone="bg-mint-soft" />
            <Stat label="Ticket médio" value={brl(s.averageTicket)} tone="bg-sun/30" />
            <Stat label="Produtos vendidos" value={String(s.itemsSold)} tone="bg-cream" />
            <Stat label="Descontos" value={brl(s.discounts)} tone="bg-berry-soft" />
            <Stat label="Taxas de pagamento/entrega" value={brl(s.salesFees)} hint="quando informadas" tone="bg-berry-soft" />
          </ul>
          {s.ordersWithoutValue > 0 && (
            <p className="rounded-2xl bg-sun/30 px-4 py-3 text-sm font-bold text-[#8a5a00]">
              {s.ordersWithoutValue} pedido(s) sem valor registrado (pedidos antigos ou avulsos) não entram nos totais. Clique em editar para informar.
            </p>
          )}

          <Card title="Produtos mais vendidos" hint="Por valor faturado">
            {data.products.length === 0 ? <Empty>Nenhum produto vendido no período.</Empty> : (
              <ul className="space-y-3">
                {data.products.slice(0, 8).map((x) => <HBar key={`${x.productId}-${x.name}`} label={`${x.quantity}× ${x.name}`} value={x.gross} max={pMax} text={brl(x.gross)} />)}
              </ul>
            )}
          </Card>

          <Card title="Pedidos finalizados" hint="Valores congelados no momento do pedido; alterações ficam no histórico">
            {data.orders.length === 0 ? <Empty>Nenhum pedido finalizado no período.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-sm">
                  <thead><tr className="border-b-2 border-fur-light text-left text-xs uppercase text-fur">
                    <th className="py-2">Pedido</th><th>Finalizado</th><th className="text-right">Itens</th><th className="text-right">Entrega</th>
                    <th className="text-right">Desconto</th><th className="text-right">Taxas</th><th className="text-right">Líquido</th><th />
                  </tr></thead>
                  <tbody className="tabular-nums">
                    {data.orders.map((o) => (
                      <tr key={o.id} className="border-b border-dashed border-fur-light font-bold">
                        <td className="py-2"><span className="block">#{shortId(o.id)} · {o.quantity}× {o.foodName}</span><span className="text-xs font-semibold text-fur">{o.clientName}{o.adjusted && " · ajustado"}</span></td>
                        <td>{new Date(o.finalizedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                        <td className="text-right">{o.hasValue ? brl(o.itemsSubtotal ?? 0) : <span className="text-berry">sem valor</span>}</td>
                        <td className="text-right">{brl(o.deliveryFee ?? 0)}</td><td className="text-right">{brl(o.discount ?? 0)}</td>
                        <td className="text-right">{brl(o.paymentFee ?? 0)}</td><td className="text-right">{brl(o.net)}</td>
                        <td className="text-right"><button onClick={() => setEditing(o)} aria-label={`Editar valores do pedido ${o.id}`} className="rounded-full p-2 hover:bg-orange-soft"><Pencil size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
      {editing && <AdjustModal order={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

const num = (v: string) => Number(v.replace(",", "."));

function AdjustModal({ order, onClose, onSaved }: { order: FinancialOrder; onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState(order.itemsSubtotal != null ? String(order.itemsSubtotal) : "");
  const [fee, setFee] = useState(String(order.deliveryFee ?? 0));
  const [discount, setDiscount] = useState(String(order.discount ?? 0));
  const [pay, setPay] = useState(String(order.paymentFee ?? 0));
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<OrderAdjustment[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api.adjustOrder(order.id, { itemsSubtotal: order.hasValue ? undefined : num(items), deliveryFee: num(fee), discount: num(discount), paymentFee: num(pay), reason: reason || undefined });
      onSaved();
    } catch (x) { setErr(errMsg(x)); setBusy(false); }
  }
  async function toggleHistory() {
    setShowHistory((v) => !v);
    if (!history) api.orderAdjustments(order.id).then(setHistory).catch((x) => setErr(errMsg(x)));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label={`Valores do pedido ${order.id}`}>
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Pedido #{shortId(order.id)}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-cream"><X size={20} /></button>
        </div>
        {!order.hasValue && <Field label="Valor dos itens (R$)"><input required inputMode="decimal" value={items} onChange={(e) => setItems(e.target.value)} className={inputCls} /></Field>}
        <Field label="Taxa de entrega cobrada (R$)"><input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} className={inputCls} /></Field>
        <Field label="Desconto concedido (R$)"><input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputCls} /></Field>
        <Field label="Taxas de pagamento/plataforma (R$)"><input inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} className={inputCls} /></Field>
        <Field label="Motivo (opcional)"><input maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} /></Field>
        <ErrorBox message={err} />
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={toggleHistory} className="text-sm font-extrabold text-orange-dark hover:underline">{showHistory ? "Ocultar histórico" : "Ver histórico"}</button>
          <button disabled={busy} className={btnCls}>{busy ? "Salvando…" : "Salvar"}</button>
        </div>
        {showHistory && (history === null ? <Loading label="Carregando…" /> : history.length === 0 ? <Empty>Nenhum ajuste ainda.</Empty> : (
          <ul className="space-y-2 text-xs font-bold">
            {history.map((h) => (
              <li key={h.id} className="rounded-2xl bg-cream p-3">
                <p>{new Date(h.createdAt).toLocaleString("pt-BR")} · {h.changedBy}{h.reason && ` · ${h.reason}`}</p>
                <p className="text-fur">Entrega {brl(h.previousDeliveryFee ?? 0)}→{brl(h.newDeliveryFee ?? 0)} · Desconto {brl(h.previousDiscount ?? 0)}→{brl(h.newDiscount ?? 0)} · Taxas {brl(h.previousPaymentFee ?? 0)}→{brl(h.newPaymentFee ?? 0)}</p>
              </li>
            ))}
          </ul>
        ))}
      </form>
    </div>
  );
}
