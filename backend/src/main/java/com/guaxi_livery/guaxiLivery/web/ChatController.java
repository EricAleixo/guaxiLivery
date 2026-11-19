package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.domain.ChatChannel;
import com.guaxi_livery.guaxiLivery.dto.ChatDtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

	private final ChatService chat;
	private final ChatSocketHandler sockets;

	public ChatController(ChatService chat, ChatSocketHandler sockets) {
		this.chat = chat;
		this.sockets = sockets;
	}

	@GetMapping
	public List<ConversationResponse> inbox(@AuthenticationPrincipal AppUserDetails me) { return chat.inbox(me.user()); }

	/** Quem está do outro lado ao abrir "falar com..." a partir de um pedido. */
	@GetMapping("/by-delivery/{deliveryId}/{channel}")
	public Party byDelivery(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID deliveryId, @PathVariable ChatChannel channel) {
		return chat.other(me.user(), deliveryId, channel);
	}

	@GetMapping("/with/{otherId}/{channel}")
	public ChatThread thread(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID otherId, @PathVariable ChatChannel channel) {
		return chat.thread(me.user(), otherId, channel);
	}

	/** Alternativa HTTP ao envio pelo WebSocket (também empurra a mensagem em tempo real). */
	@PostMapping("/with/{otherId}/{channel}/messages")
	public MessageResponse send(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID otherId,
								@PathVariable ChatChannel channel, @Valid @RequestBody SendRequest body) {
		MessageResponse m = chat.send(me.user(), otherId, channel, body.content());
		sockets.broadcast(m);
		return m;
	}

	@PostMapping("/with/{otherId}/{channel}/read")
	public void read(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID otherId, @PathVariable ChatChannel channel) {
		chat.markRead(me.user(), otherId, channel);
	}
}
