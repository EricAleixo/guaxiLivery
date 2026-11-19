"use client";
import { Loading } from "@/components/Loading";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { brl } from "@/lib/format";
import { fmtDate } from "@/lib/period";
import { PeriodBar, usePeriod } from "@/components/finance/PeriodBar";
import { Card, Empty, HBar, Stat, pct, useFinanceData } from "@/components/finance/parts";
import { FinanceHeader } from "./FinanceNav";

export default function VisaoPageClient() {
  const p = usePeriod("mes");
  const { data, error } = useFinanceData(() => api.financeOverview(p.range), [p.range], p.valid);
  const r = data?.result;
  const groups = [...(data?.expenses.byGroup ?? [])].filter((g) => g.total > 0).sort((a, b) => b.total - a.total);
  const gMax = Math.max(1, ...groups.map((g) => g.total));

  return (
    <div className="space-y-6">
      <FinanceHeader title="Financeiro" subtitle="Quanto você vendeu, quanto gastou e o que sobrou." />
      <PeriodBar p={p} />
      <ErrorBox message={error} />
      {!data ? <Loading label="Calculando…" /> : (
        <>
          <p className="text-sm font-bold text-fur">Período: {fmtDate(data.from)} a {fmtDate(data.to)}</p>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            <Stat label="Faturamento bruto" value={brl(data.revenue.gross)} hint="pedidos finalizados" tone="bg-orange-soft" />
            <Stat label="Receita líquida" value={brl(data.revenue.net)} hint="bruto − descontos − taxas" tone="bg-sky-soft" />
            <Stat label="Total de despesas" value={brl(data.result.operatingExpenses + data.result.costOfGoods)} hint={`${brl(data.expenses.pending)} ainda pendentes`} tone="bg-berry-soft" />
            <Stat label="Lucro estimado" value={brl(r!.profit)} hint="receita líquida − despesas" tone={r!.profit >= 0 ? "bg-mint-soft" : "bg-berry-soft"} />
            <Stat label="Margem de lucro" value={pct(r!.marginPercent)} hint={r!.marginPercent == null ? "sem receita no período" : "lucro ÷ receita líquida"} tone="bg-sun/30" />
            <Stat label="Pedidos finalizados" value={String(data.revenue.orders)} hint={`ticket médio ${brl(data.revenue.averageTicket)}`} tone="bg-cream" />
          </ul>
          {data.revenue.ordersWithoutValue > 0 && (
            <p className="rounded-2xl bg-sun/30 px-4 py-3 text-sm font-bold text-[#8a5a00]">
              {data.revenue.ordersWithoutValue} pedido(s) finalizado(s) não têm valor registrado e não entram nos totais. Informe o valor em Faturamento.
            </p>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card title="Fluxo de caixa" hint="O que de fato entrou e saiu (despesas pagas)">
              <dl className="space-y-2 text-sm">
                <Row l="Entradas (receita líquida)" v={brl(data.cashFlow.inflow)} />
                <Row l="Saídas (despesas pagas)" v={brl(data.cashFlow.outflow)} />
                <Row l="Saldo do período" v={brl(data.cashFlow.balance)} strong />
                <Row l="Compromissos pendentes" v={brl(data.cashFlow.pendingCommitments)} muted />
              </dl>
            </Card>
            <Card title="Resultado" hint="Regime de competência">
              <dl className="space-y-2 text-sm">
                <Row l="Receita líquida" v={brl(r!.netRevenue)} />
                <Row l="Custo de mercadorias (insumos e embalagens)" v={`− ${brl(r!.costOfGoods)}`} />
                <Row l="Despesas operacionais" v={`− ${brl(r!.operatingExpenses)}`} />
                <Row l="Lucro estimado" v={brl(r!.profit)} strong />
              </dl>
              <p className="mt-3 text-xs font-bold text-fur">Hoje o custo de mercadorias usa as compras do período; quando houver estoque e ficha técnica, passa a ser o CMV real.</p>
            </Card>
          </div>

          <Card title="Maiores custos" hint="Despesas do período por categoria">
            {groups.length === 0 ? <Empty>Nenhuma despesa no período.</Empty> : (
              <ul className="space-y-3">
                {groups.map((g) => <HBar key={g.group} label={g.label} value={g.total} max={gMax} text={brl(g.total)} />)}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ l, v, strong, muted }: { l: string; v: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "border-t-2 border-dashed border-fur-light pt-2 text-base font-extrabold" : "font-bold"} ${muted ? "text-fur" : ""}`}>
      <dt>{l}</dt><dd className="tabular-nums">{v}</dd>
    </div>
  );
}
