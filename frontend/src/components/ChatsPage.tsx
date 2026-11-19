"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Store, Bike } from "lucide-react";
import { api, type ChatChannel, type Conversation } from "@/lib/api";
import { STATUS } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { Avatar } from "./Avatar";
import { ChatPanel } from "./ChatPanel";
import { Loading } from "./Loading";
import { Raccoon } from "./Logo";
import { ErrorBox } from "./ui";

const key = (c: { otherId: string; channel: ChatChannel }) => `${c.otherId}:${c.channel}`;

const short = (iso: string) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

type Filter = "todas" | "naoLidas";

function Row({ c, active, mine, onOpen }: { c: Conversation; active: boolean; mine: string | undefined; onOpen: () => void }) {
  const st = STATUS[c.status];
  const Icon = c.channel === "EMPRESA" ? Store : Bike;
  return (
    <li>
      <button onClick={onOpen} aria-current={active ? "true" : undefined}
        className={`flex w-full items-start gap-3 rounded-3xl p-3 text-left transition active:scale-[.99] ${active ? "bg-orange-soft" : "bg-paper ring-2 ring-fur-light hover:bg-orange-soft/40"}`}>
        <span className="relative shrink-0">
          <Avatar url={c.other.avatarUrl} name={c.other.name} className="h-14 w-14" />
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-paper text-orange-dark shadow ring-2 ring-fur-light" aria-hidden><Icon size={13} /></span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-base ${c.unread ? "font-extrabold" : "font-bold"}`}>{c.other.name}</span>
            <span className={`shrink-0 text-xs font-bold ${c.unread ? "text-orange-dark" : "text-fur"}`}>{short(c.updatedAt)}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs font-bold">
            <span className="truncate text-fur">{c.orders > 1 ? `${c.orders} pedidos · último: ` : ""}{c.quantity}× {c.foodName}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 ${st.chip}`}>{st.label}</span>
          </span>
          <span className="mt-1 flex items-center justify-between gap-2">
            <span className={`truncate text-sm ${c.unread ? "font-extrabold text-ink" : "font-semibold text-fur"}`}>
              {c.last ? `${c.last.senderId === mine ? "Você: " : ""}${c.last.content}` : "Toque para conversar"}
            </span>
            {c.unread > 0 && <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-orange px-1.5 text-xs font-extrabold text-white">{c.unread}</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

/** Aba de chats: lista de conversas e a conversa aberta lado a lado no desktop; uma tela por vez no celular. */
export function ChatsPage() {
  const params = useSearchParams();
  const { user } = useAuth();
  const { subscribe, refreshUnread } = useChat();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");
  const [open, setOpen] = useState<string | null>(null);

  // Link vindo de um pedido (?d=pedido&c=canal): descobre com quem é a conversa e abre.
  const linkD = params.get("d"), linkC = params.get("c") as ChatChannel | null;
  useEffect(() => {
    if (!linkD || !linkC) return;
    api.chatByDelivery(linkD, linkC).then((p) => setOpen(key({ otherId: p.userId, channel: linkC }))).catch((e) => setError(e.message));
  }, [linkD, linkC]);

  const load = useCallback(() => {
    api.chats().then((l) => { setList(l); setError(null); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  useEffect(() => subscribe(() => load()), [subscribe, load]);

  const current = list?.find((c) => key(c) === open) ?? null;
  const [oid, och] = open?.split(":") ?? [];
  const direct = !current && oid && och ? { otherId: oid, channel: och as ChatChannel } : null; // vindo de um link, antes da lista chegar
  const shown = current ?? direct;
  const unread = list?.reduce((n, x) => n + x.unread, 0) ?? 0;
  const items = list?.filter((x) => filter === "todas" || x.unread > 0) ?? [];

  return (
    <div className="space-y-4">
      <header className={shown ? "hidden lg:block" : ""}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl"><MessageCircle className="text-orange" /> Chats</h1>
        <p className="text-sm font-semibold text-fur sm:text-base">Converse sobre seus pedidos em tempo real.</p>
      </header>
      <ErrorBox message={error} />
      {!list && !error ? <Loading label="Buscando conversas…" /> : (
        <div className={`grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[28rem] lg:grid-cols-[23rem_1fr] ${shown ? "h-[calc(100dvh-11rem)] min-h-[26rem]" : ""}`}>
          <div className={`flex min-h-0 flex-col gap-3 ${shown ? "hidden lg:flex" : ""}`}>
            {list && list.length > 0 && (
              <div role="tablist" className="flex gap-2">
                {([["todas", "Todas"], ["naoLidas", `Não lidas${unread ? ` (${unread})` : ""}`]] as const).map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition ${filter === id ? "border-orange bg-orange text-white" : "border-fur-light bg-paper hover:bg-orange-soft"}`}>{label}</button>
                ))}
              </div>
            )}
            <ul className="-m-1 min-h-0 flex-1 space-y-2 overflow-y-auto p-1">
              {list?.length === 0 && (
                <li className="rounded-3xl bg-orange-soft p-8 text-center">
                  <Raccoon className="mx-auto h-16 w-16" />
                  <p className="mt-2 font-extrabold">Nenhuma conversa ainda</p>
                  <p className="text-sm font-semibold text-fur">Elas aparecem quando você tem pedidos. O chat com o entregador abre quando ele sai para a entrega.</p>
                </li>
              )}
              {list && list.length > 0 && items.length === 0 && <li className="rounded-3xl bg-cream p-6 text-center text-sm font-bold text-fur">Nenhuma conversa não lida.</li>}
              {items.map((cv) => <Row key={key(cv)} c={cv} mine={user?.id} active={open === key(cv)} onOpen={() => { setOpen(key(cv)); if (cv.unread) refreshUnread(); }} />)}
            </ul>
          </div>
          {shown ? (
            <ChatPanel key={key(shown)} otherId={shown.otherId} channel={shown.channel}
              onBack={() => { setOpen(null); load(); }} className="h-full" />
          ) : (
            <div className="hidden place-items-center rounded-3xl bg-paper text-center ring-2 ring-fur-light lg:grid">
              <div><MessageCircle size={44} className="mx-auto text-orange" /><p className="mt-2 text-lg font-extrabold">Suas conversas</p><p className="font-semibold text-fur">Escolha uma conversa ao lado.</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
