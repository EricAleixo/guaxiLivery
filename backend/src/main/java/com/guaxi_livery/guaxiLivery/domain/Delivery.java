package com.guaxi_livery.guaxiLivery.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
public class Delivery {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "client_id", nullable = false)
	private User client;

	/** Empresa escolhida pelo cliente ou que aceitou o pedido. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id")
	private Company company;

	/** Produto do feed que originou o pedido (usado nas avaliações). */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	@Column(nullable = false)
	private String foodName;

	@Column(length = 500)
	private String description;

	@Column(nullable = false)
	private Integer quantity;

	@Column(nullable = false)
	private String pickupAddress;

	@Column(nullable = false)
	private String deliveryAddress;

	/** Nome do arquivo da foto da comida dentro de app.upload.dir. */
	@Column(nullable = false)
	private String imageFilename;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DeliveryStatus status = DeliveryStatus.PENDENTE;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();
}
