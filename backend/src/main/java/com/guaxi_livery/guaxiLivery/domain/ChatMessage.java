package com.guaxi_livery.guaxiLivery.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Mensagem de uma conversa: (pedido, canal). Os participantes são o cliente do pedido e a empresa ou o entregador. */
@Entity
@Table(name = "chat_messages", indexes = @Index(name = "idx_chat_conv", columnList = "delivery_id, channel, createdAt"))
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "delivery_id", nullable = false)
	private Delivery delivery;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ChatChannel channel;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;

	@Column(nullable = false, length = 1000)
	private String content;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	/** Quando o destinatário leu; null = não lida. */
	private Instant readAt;
}
