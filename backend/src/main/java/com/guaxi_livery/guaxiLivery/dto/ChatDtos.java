package com.guaxi_livery.guaxiLivery.dto;

import com.guaxi_livery.guaxiLivery.domain.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ChatDtos {
	private ChatDtos() {}

	public record SendRequest(@NotBlank @Size(max = 1000) String content) {}

	/** Mensagem de uma conversa. A conversa é entre duas pessoas; o pedido é só o contexto em que ela foi escrita. */
	public record MessageResponse(UUID id, UUID deliveryId, ChatChannel channel, UUID senderId, UUID recipientId, String senderName,
								  String content, Instant createdAt, boolean read, String foodName, int quantity) {
		public static MessageResponse of(ChatMessage m, UUID recipientId) {
			return new MessageResponse(m.getId(), m.getDelivery().getId(), m.getChannel(), m.getSender().getId(), recipientId,
					m.getSender().getName(), m.getContent(), m.getCreatedAt(), m.getReadAt() != null,
					m.getDelivery().getFoodName(), m.getDelivery().getQuantity());
		}
	}

	/** Quem está do outro lado da conversa. */
	public record Party(UUID userId, String name, String avatarUrl, String role, boolean canSend) {}

	public record ChatThread(Party party, List<MessageResponse> messages) {}

	/** Linha da aba de chats: uma por pessoa/empresa (e não por pedido). */
	public record ConversationResponse(UUID otherId, ChatChannel channel, String foodName, int quantity, DeliveryStatus status,
									   int orders, Party other, MessageResponse last, long unread, Instant updatedAt) {}
}
