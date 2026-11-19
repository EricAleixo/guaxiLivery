package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Avaliação (1 a 5 estrelas + comentário) de um pedido entregue. */
@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "delivery_id", nullable = false, unique = true)
	private Delivery delivery;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id", nullable = false)
	private Product product;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "client_id", nullable = false)
	private User client;

	@Column(nullable = false)
	private int rating;

	@Column(length = 500)
	private String comment;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();
}
