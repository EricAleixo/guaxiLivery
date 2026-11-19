"use client";
import { Loading } from "@/components/Loading";
import { ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { brl } from "@/lib/format";
import { fmtDate, fmtMonth } from "@/lib/period";
import { PeriodBar, usePeriod } from "@/components/finance/PeriodBar";
import { BarChart, Card, Empty, HBar, pct, useFinanceData } from "@/components/finance/parts";
import { FinanceHeader } from "./FinanceNav";

export default function RelatoriosPageClient() {
  const p = usePeriod("ano");
  const { data, error } = useFinanceData(() => api.financeReports(p.range), [p.range], p.valid);
  const groups = [...(data?.byGroup ?? [])].filter((g) => g.total > 0).sort((a, b) => b.total - a.total);
  const gMax = Math.max(1, ...groups.map((g) => g.total));
  const months = data?.months ?? [];
  const daily = data?.daily ?? [];
  const short = (n: number) => brl(n);

  return (
    <div className="space-y-6">
      <FinanceHeader title="Relatórios" subtitle="Evolução do faturamento, das despesas e do lucro." />
      <PeriodBar p={p} />
      <ErrorBox message={error} />
      {!data ? <Loading label="Montando relatórios…" /> : (
        <>
          <Card title="Faturamento x despesas por mês" hint="Despesas por competência (pagas + pendentes)">
            {months.length === 0 ? <Empty>Sem dados no período.</Empty> : (
              <BarChart fmt={short} labels={months.map((m) => fmtMonth(m.month))} series={[
                { key: "g", label: "Faturamento bruto", tone: "bg-orange", values: months.map((m) => m.gross) },
                { key: "e", label: "Despesas", tone: "bg-berry", values: months.map((m) => m.expenses) },
              ]} />
            )}
          </Card>
          <Card title="Evolução do lucro" hint="Lucro estimado por mês">
            {months.length === 0 ? <Empty>Sem dados no período.</Empty> : (
              <BarChart fmt={short} labels={months.map((m) => fmtMonth(m.month))}
                series={[{ key: "p", label: "Lucro estimado", tone: "bg-mint", values: months.map((m) => m.profit) }]} />
            )}
          </Card>
          <Card title="Faturamento diário" hint={`${fmtDate(data.from)} a ${fmtDate(data.to)}`}>
            {daily.length === 0 ? <Empty>Sem pedidos finalizados no período.</Empty> : (
              <BarChart fmt={short} labels={daily.map((d) => fmtDate(d.date).slice(0, 5))}
                series={[{ key: "d", label: "Faturamento bruto", tone: "bg-orange", values: daily.map((d) => d.gross) }]} />
            )}
          </Card>
          <Card title="Despesas por categoria">
            {groups.length === 0 ? <Empty>Nenhuma despesa no período.</Empty> : (
              <ul className="space-y-3">
                {groups.map((g) => <HBar key={g.group} label={g.label} value={g.total} max={gMax} text={brl(g.total)} />)}
              </ul>
            )}
          </Card>
          <Card title="Histórico financeiro" hint="Mês a mês">
            {months.length === 0 ? <Empty>Sem dados no período.</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead><tr className="border-b-2 border-fur-light text-left text-xs uppercase text-fur">
                    <th className="py-2">Mês</th><th className="text-right">Pedidos</th><th className="text-right">Bruto</th>
                    <th className="text-right">Líquida</th><th className="text-right">Despesas</th><th className="text-right">Pendentes</th>
                    <th className="text-right">Lucro</th><th className="text-right">Margem</th>
                  </tr></thead>
                  <tbody className="tabular-nums">
                    {[...months].reverse().map((m) => (
                      <tr key={m.month} className="border-b border-dashed border-fur-light font-bold">
                        <td className="py-2">{fmtMonth(m.month)}</td><td className="text-right">{m.orders}</td>
                        <td className="text-right">{brl(m.gross)}</td><td className="text-right">{brl(m.net)}</td>
                        <td className="text-right">{brl(m.expenses)}</td><td className="text-right text-fur">{brl(m.pendingExpenses)}</td>
                        <td className={`text-right ${m.profit < 0 ? "text-berry" : "text-mint"}`}>{brl(m.profit)}</td>
                        <td className="text-right">{pct(m.marginPercent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
