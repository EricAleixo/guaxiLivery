package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
public class Delivery {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

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

	/** Entregador responsável (precisa ter vínculo ativo com a empresa). */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "courier_id")
	private Courier courier;

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

	// ---- Valores financeiros congelados no momento do pedido ----
	// null = pedido sem valor registrado (pedidos antigos ou entregas avulsas sem produto).

	/** Preço unitário do produto no momento do pedido (não muda se o cardápio mudar). */
	@Column(precision = 10, scale = 2)
	private BigDecimal unitPrice;

	/** unitPrice × quantity. */
	@Column(precision = 12, scale = 2)
	private BigDecimal itemsSubtotal;

	/** Taxa de entrega cobrada do cliente (receita). */
	@Column(precision = 10, scale = 2)
	private BigDecimal deliveryFee;

	/** Desconto concedido ao cliente. */
	@Column(precision = 10, scale = 2)
	private BigDecimal discount;

	/** Taxas incidentes sobre a venda (maquininha, gateway, plataforma). */
	@Column(precision = 10, scale = 2)
	private BigDecimal paymentFee;

	/** Quando o pedido foi finalizado (status ENTREGUE). */
	private Instant deliveredAt;

	/** Quando o pedido foi cancelado. */
	private Instant canceledAt;
}
