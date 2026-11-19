"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, api, tokenStore, type ChatChannel, type ChatMessage } from "./api";
import { useAuth } from "./auth";

type Listener = (m: ChatMessage) => void;
interface ChatCtx {
  connected: boolean;
  /** Total de mensagens não lidas (selo das abas de chats). */
  unread: number;
  refreshUnread: () => void;
  /** Escuta mensagens recebidas em tempo real; devolve a função para parar de escutar. */
  subscribe: (fn: Listener) => () => void;
  send: (otherId: string, channel: ChatChannel, content: string) => Promise<void>;
}

const Ctx = createContext<ChatCtx | null>(null);
const wsUrl = (token: string) => `${API_URL.replace(/^http/, "ws")}/ws/chat?token=${encodeURIComponent(token)}`;

/** Mantém um WebSocket aberto enquanto o usuário está logado (reconecta sozinho). */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const socket = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<Listener>());
  const me = user?.id;

  const refreshUnread = useCallback(() => {
    if (!tokenStore.get()) return;
    api.chats().then((l) => setUnread(l.reduce((n, c) => n + c.unread, 0))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!me) return;
    let closed = false, retry = 0, timer: ReturnType<typeof setTimeout>;
    refreshUnread();
    function open() {
      const token = tokenStore.get();
      if (!token || closed) return;
      const ws = new WebSocket(wsUrl(token));
      socket.current = ws;
      ws.onopen = () => { retry = 0; setConnected(true); refreshUnread(); };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "message") {
            const m = data.message as ChatMessage;
            listeners.current.forEach((fn) => fn(m));
            if (m.senderId !== me) setUnread((n) => n + 1); // o painel aberto zera ao marcar como lida
          }
        } catch {}
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) timer = setTimeout(open, Math.min(15000, 1000 * 2 ** retry++));
      };
    }
    open();
    return () => { closed = true; clearTimeout(timer); socket.current?.close(); socket.current = null; setConnected(false); };
  }, [me, refreshUnread]);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  const send = useCallback(async (otherId: string, channel: ChatChannel, content: string) => {
    const ws = socket.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "send", to: otherId, channel, content }));
      return;
    }
    // Sem conexão em tempo real: envia por HTTP e avisa quem está escutando.
    const m = await api.chatSend(otherId, channel, content);
    listeners.current.forEach((fn) => fn(m));
  }, []);

  const value = useMemo(() => ({ connected, unread: me ? unread : 0, refreshUnread, subscribe, send }), [connected, unread, me, refreshUnread, subscribe, send]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useChat fora do ChatProvider");
  return c;
}
