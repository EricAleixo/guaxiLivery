"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, Check, CheckCheck, Lock, Send, WifiOff } from "lucide-react";
import { api, ApiError, type ChatChannel, type ChatMessage, type ChatParty } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/chat";
import { Avatar } from "./Avatar";
import { Loading } from "./Loading";

const hour = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => {
  const d = new Date(iso), t = new Date(), y = new Date(Date.now() - 864e5);
  if (d.toDateString() === t.toDateString()) return "Hoje";
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
};
const GROUP_MS = 5 * 60 * 1000;

/** Conversa de um pedido (canal) em tempo real. Ocupa toda a altura do pai. */
export function ChatPanel({ otherId, channel, onBack, className = "" }: {
  otherId: string; channel: ChatChannel; onBack?: () => void; className?: string;
}) {
  const { user } = useAuth();
  const { subscribe, send, connected, refreshUnread } = useChat();
  const [party, setParty] = useState<ChatParty | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [atEnd, setAtEnd] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  const markRead = useCallback(() => { api.chatRead(otherId, channel).then(refreshUnread).catch(() => {}); }, [otherId, channel, refreshUnread]);

  // O pai remonta o painel (key) a cada conversa, então o estado já começa limpo.
  useEffect(() => {
    let off = false;
    api.chatThread(otherId, channel)
      .then((t) => { if (!off) { setParty(t.party); setMsgs(t.messages); refreshUnread(); } })
      .catch((e) => !off && setError(e.message));
    return () => { off = true; };
  }, [otherId, channel, refreshUnread]);

  useEffect(() => subscribe((m) => {
    if (m.channel !== channel || (m.senderId !== otherId && m.recipientId !== otherId)) return;
    setMsgs((l) => (l && !l.some((x) => x.id === m.id) ? [...l, m] : l));
    if (m.senderId !== user?.id) markRead();
  }), [subscribe, otherId, channel, user?.id, markRead]);

  // Rola para o fim em mensagens novas, a menos que a pessoa esteja lendo mais acima.
  useEffect(() => {
    const last = msgs?.[msgs.length - 1];
    if (atEnd || last?.senderId === user?.id) end.current?.scrollIntoView({ block: "end" });
  }, [msgs, atEnd, user?.id]);

  function onScroll() {
    const el = scroller.current;
    if (el) setAtEnd(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function grow() {
    const el = box.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 128)}px`; }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true); setError(null);
    try {
      await send(otherId, channel, content);
      setText(""); requestAnimationFrame(grow);
      setAtEnd(true);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Não foi possível enviar."); }
    finally { setBusy(false); }
  }

  return (
    <section className={`relative flex min-h-0 flex-col overflow-hidden rounded-3xl bg-paper shadow-sm ring-2 ring-fur-light ${className}`} aria-label="Conversa">
      <header className="flex items-center gap-2 border-b-2 border-fur-light bg-paper p-2.5 sm:gap-3 sm:p-3">
        {onBack && (
          <button onClick={onBack} aria-label="Voltar para as conversas" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-orange-soft lg:hidden"><ArrowLeft size={22} /></button>
        )}
        <Avatar url={party?.avatarUrl} name={party?.name} className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold leading-tight">{party?.name ?? "Carregando…"}</p>
          <p className="flex items-center gap-1.5 truncate text-xs font-bold text-fur">
            {party && <span className="shrink-0 rounded-full bg-orange-soft px-2 py-0.5 text-orange-dark">{party.role}</span>}
                      </p>
        </div>
        {!connected && <span title="Reconectando…" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun/30 text-[#8a5a00]"><WifiOff size={16} /></span>}
      </header>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto bg-cream/70 px-3 py-4 sm:px-5" role="log" aria-live="polite">
        {!msgs && !error && <Loading label="Abrindo conversa…" />}
        {msgs?.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div><p className="text-lg font-extrabold">Nenhuma mensagem ainda</p><p className="text-sm font-semibold text-fur">Diga um oi para começar a conversa.</p></div>
          </div>
        )}
        {msgs?.map((m, i) => {
          const prev = msgs[i - 1], next = msgs[i + 1];
          const mine = m.senderId === user?.id;
          const newDay = !prev || day(prev.createdAt) !== day(m.createdAt);
          const joinsPrev = !!prev && !newDay && prev.deliveryId === m.deliveryId && prev.senderId === m.senderId && +new Date(m.createdAt) - +new Date(prev.createdAt) < GROUP_MS;
          const joinsNext = !!next && day(next.createdAt) === day(m.createdAt) && next.senderId === m.senderId && +new Date(next.createdAt) - +new Date(m.createdAt) < GROUP_MS;
          return (
            <div key={m.id}>
              {(!prev || prev.deliveryId !== m.deliveryId) && (
                <p className="mb-1 mt-4 text-center"><span className="rounded-full bg-orange-soft px-3 py-1 text-[11px] font-extrabold text-orange-dark">Pedido: {m.quantity}× {m.foodName}</span></p>
              )}
              {newDay && <p className="sticky top-0 z-[1] my-3 text-center"><span className="rounded-full bg-paper px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-fur shadow-sm">{day(m.createdAt)}</span></p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"} ${joinsPrev ? "mt-0.5" : "mt-2"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-3xl px-3.5 py-2 text-[15px] font-semibold leading-snug sm:max-w-[75%]
                  ${mine ? "bg-orange text-white" : "bg-paper text-ink shadow-sm"}
                  ${joinsPrev ? (mine ? "rounded-tr-md" : "rounded-tl-md") : ""} ${joinsNext ? (mine ? "rounded-br-md" : "rounded-bl-md") : ""}`}>
                  {m.content}
                  {!joinsNext && (
                    <span className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] font-bold ${mine ? "text-white/80" : "text-fur"}`}>
                      {hour(m.createdAt)}
                      {mine && (m.read ? <CheckCheck size={13} aria-label="Lida" /> : <Check size={13} aria-label="Enviada" />)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      {!atEnd && (
        <button onClick={() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" })} aria-label="Ir para as mensagens mais recentes"
          className="absolute bottom-24 right-4 grid h-10 w-10 place-items-center rounded-full bg-paper shadow-lg ring-2 ring-fur-light hover:bg-orange-soft"><ArrowDown size={18} /></button>
      )}

      {error && <p role="alert" className="bg-berry-soft px-4 py-2 text-sm font-bold text-berry">{error}</p>}
      {party && !party.canSend ? (
        <p className="flex items-center justify-center gap-2 border-t-2 border-fur-light bg-paper px-4 py-4 text-center text-sm font-bold text-fur">
          <Lock size={16} className="shrink-0" /> O chat com o entregador fica aberto enquanto ele está indo fazer a entrega.
        </p>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2 border-t-2 border-fur-light bg-paper p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-3">
          <textarea ref={box} value={text} onChange={(e) => { setText(e.target.value); grow(); }} rows={1} maxLength={1000} placeholder="Escreva uma mensagem…"
            enterKeyHint="send" aria-label="Mensagem"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover: hover)").matches) { e.preventDefault(); void submit(); } }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl bg-cream px-4 py-2.5 text-base font-semibold outline-none ring-2 ring-transparent focus:ring-orange" />
          <button disabled={!text.trim() || busy} aria-label="Enviar mensagem"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange text-white transition hover:bg-orange-dark active:scale-95 disabled:opacity-40"><Send size={18} /></button>
        </form>
      )}
    </section>
  );
}
