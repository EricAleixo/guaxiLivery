"use client";
import Link from "next/link";
import { useState } from "react";
import { Lock, MessageCircle, X } from "lucide-react";
import type { Delivery } from "@/lib/api";
import { Avatar } from "./Avatar";

/**
 * Botão de mensagem do pedido (cliente). Abre uma lista dentro do fluxo do card (um popover seria
 * cortado pelo overflow dele): conversar com a empresa (sempre) ou com o entregador (só em rota).
 */
export function ChatMenu({ d }: { d: Delivery }) {
  const [open, setOpen] = useState(false);
  const cancelled = d.status === "CANCELADO";
  if (!d.company && !d.courier) return null;
  const courierOpen = !!d.courier && d.status === "EM_ROTA";
  const row = "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm";

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fechar opções de conversa" : "Conversar sobre este pedido"}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${open ? "bg-ink text-white" : "bg-orange text-white hover:bg-orange-dark"}`}>
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>
      {open && (
        <ul className="animate-pop order-last -mt-1 w-full basis-full space-y-1 rounded-2xl bg-cream p-1.5">
          {d.company && (
            <li>
              <Link href={`/cliente/chats?d=${d.id}&c=EMPRESA`} className={`${row} hover:bg-orange-soft`}>
                <Avatar url={d.company.logoUrl} name={d.company.tradeName} className="h-9 w-9" />
                <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{d.company.tradeName}</span><span className="text-xs font-bold text-fur">Empresa{cancelled ? "" : " · pode falar sempre"}</span></span>
                <MessageCircle size={16} className="text-orange" />
              </Link>
            </li>
          )}
          {d.courier && (
            <li>
              {courierOpen ? (
                <Link href={`/cliente/chats?d=${d.id}&c=ENTREGADOR`} className={`${row} hover:bg-orange-soft`}>
                  <Avatar url={d.courier.avatarUrl} name={d.courier.name} className="h-9 w-9" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{d.courier.name}</span><span className="text-xs font-bold text-mint">Entregador · a caminho</span></span>
                  <MessageCircle size={16} className="text-orange" />
                </Link>
              ) : (
                <div className={`${row} opacity-60`} aria-disabled>
                  <Avatar url={d.courier.avatarUrl} name={d.courier.name} className="h-9 w-9" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{d.courier.name}</span><span className="text-xs font-bold text-fur">Abre quando ele sair para a entrega</span></span>
                  <Lock size={15} className="text-fur" />
                </div>
              )}
            </li>
          )}
        </ul>
      )}
    </>
  );
}
