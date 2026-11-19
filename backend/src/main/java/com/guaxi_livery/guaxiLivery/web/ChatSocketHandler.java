package com.guaxi_livery.guaxiLivery.web;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.guaxi_livery.guaxiLivery.domain.ChatChannel;
import com.guaxi_livery.guaxiLivery.domain.User;
import com.guaxi_livery.guaxiLivery.dto.ChatDtos.MessageResponse;
import com.guaxi_livery.guaxiLivery.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket do chat (/ws/chat). Cada usuário pode ter várias abas abertas; a mensagem salva
 * é entregue a todas as sessões dos dois participantes.
 * Os registros ficam em memória: com mais de uma instância do back end, troque {@link #broadcast}
 * por um Pub/Sub (ex.: Redis) — o restante não muda.
 */
@Component
public class ChatSocketHandler extends TextWebSocketHandler {

	public static final String USER_ATTR = "chatUser";
	private static final Logger log = LoggerFactory.getLogger(ChatSocketHandler.class);

	private final ChatService chat;
	private final ObjectMapper mapper;
	private final Map<UUID, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();

	public ChatSocketHandler(ChatService chat, ObjectMapper mapper) {
		this.chat = chat;
		this.mapper = mapper;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession raw) {
		User u = (User) raw.getAttributes().get(USER_ATTR);
		WebSocketSession s = new ConcurrentWebSocketSessionDecorator(raw, 5000, 64 * 1024);
		raw.getAttributes().put("safe", s);
		sessions.computeIfAbsent(u.getId(), k -> ConcurrentHashMap.newKeySet()).add(s);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession raw, CloseStatus status) {
		User u = (User) raw.getAttributes().get(USER_ATTR);
		Set<WebSocketSession> set = u == null ? null : sessions.get(u.getId());
		if (set != null) set.remove((WebSocketSession) raw.getAttributes().get("safe"));
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage text) throws IOException {
		User me = (User) session.getAttributes().get(USER_ATTR);
		WebSocketSession out = (WebSocketSession) session.getAttributes().get("safe");
		try {
			JsonNode in = mapper.readTree(text.getPayload());
			if (!"send".equals(in.path("type").asText())) return;
			MessageResponse m = chat.send(me, UUID.fromString(in.path("to").asText()),
					ChatChannel.valueOf(in.path("channel").asText()), in.path("content").asText());
			broadcast(m);
		} catch (ApiException e) {
			out.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of("type", "error", "message", e.getMessage()))));
		} catch (IllegalArgumentException e) {
			out.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of("type", "error", "message", "Mensagem inválida"))));
		}
	}

	/** Entrega a mensagem às sessões abertas dos participantes. */
	public void broadcast(MessageResponse m) {
		String json;
		try { json = mapper.writeValueAsString(Map.of("type", "message", "message", m)); }
		catch (RuntimeException e) { return; }
		for (UUID uid : Set.of(m.senderId(), m.recipientId())) {
			for (WebSocketSession s : sessions.getOrDefault(uid, Set.of())) {
				try { s.sendMessage(new TextMessage(json)); }
				catch (IOException | RuntimeException e) { log.debug("Falha ao enviar ao socket {}: {}", s.getId(), e.getMessage()); }
			}
		}
	}
}
