"use client";
import { Check, Send, Store, X } from "lucide-react";
import { Loading } from "@/components/Loading";
import { useEntregador } from "@/lib/entregador";
import { api, type CourierLinkStatus } from "@/lib/api";

const LABEL: Record<CourierLinkStatus, { text: string; cls: string }> = {
  ATIVO: { text: "Você trabalha aqui", cls: "bg-mint-soft text-mint" },
  CANDIDATURA: { text: "Candidatura enviada", cls: "bg-sun/30 text-[#8a5a00]" },
  CONVITE: { text: "Convite recebido", cls: "bg-sky-soft text-sky" },
  RECUSADO: { text: "Recusado", cls: "bg-berry-soft text-berry" },
  ENCERRADO: { text: "Encerrado", cls: "bg-fur-light text-fur" },
};

export default function EmpresasPageClient() {
  const { companies, busyId, linkAction } = useEntregador();
  if (!companies) return <Loading label="Buscando empresas…" />;
  const key = (id: string) => id;
  const small = "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-extrabold disabled:opacity-50";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">Empresas</h1>
        <p className="text-fur">Você só vê e pega pedidos das empresas em que trabalha.</p>
      </header>
      {companies.length === 0 ? <p className="rounded-3xl bg-orange-soft p-8 text-center font-bold">Nenhuma empresa cadastrada ainda.</p> : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {companies.map(({ company: c, linkId, status }) => {
            const busy = busyId === key(c.id);
            return (
              <article key={c.id} className="animate-pop space-y-3 rounded-3xl border-2 border-fur-light bg-paper p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-soft text-orange-dark"><Store size={24} /></span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold leading-tight">{c.tradeName}</h3>
                    {c.address && <p className="truncate text-sm text-fur">{c.address}</p>}
                  </div>
                </div>
                {status && <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold ${LABEL[status].cls}`}>{LABEL[status].text}</span>}
                <div className="flex flex-wrap gap-2">
                  {(!status || status === "RECUSADO" || status === "ENCERRADO") && (
                    <button disabled={busy} onClick={() => linkAction(key(c.id), () => api.courierApply(c.id))} className={`${small} bg-orange text-white hover:bg-orange-dark`}><Send size={15} /> Candidatar-se</button>
                  )}
                  {status === "CONVITE" && linkId != null && (
                    <>
                      <button disabled={busy} onClick={() => linkAction(key(c.id), () => api.courierAnswerInvite(linkId, true))} className={`${small} bg-mint text-white`}><Check size={15} /> Aceitar</button>
                      <button disabled={busy} onClick={() => linkAction(key(c.id), () => api.courierAnswerInvite(linkId, false))} className={`${small} border-2 border-berry text-berry hover:bg-berry-soft`}><X size={15} /> Recusar</button>
                    </>
                  )}
                  {(status === "ATIVO" || status === "CANDIDATURA") && linkId != null && (
                    <button disabled={busy} onClick={() => confirm(status === "ATIVO" ? "Sair desta empresa?" : "Cancelar candidatura?") && linkAction(key(c.id), () => api.courierLeave(linkId))}
                      className={`${small} border-2 border-berry text-berry hover:bg-berry-soft`}>{status === "ATIVO" ? "Sair da empresa" : "Cancelar"}</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
