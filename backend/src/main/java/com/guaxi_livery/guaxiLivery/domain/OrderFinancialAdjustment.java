package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Histórico de alterações nos valores financeiros de um pedido. O pedido continua sendo a única fonte do valor;
 * esta tabela só guarda quem mudou o quê e quando, ligada ao pedido original.
 */
@Entity
@Table(name = "order_financial_adjustments", indexes = @Index(name = "idx_adj_delivery", columnList = "delivery_id"))
@Getter
@Setter
@NoArgsConstructor
public class OrderFinancialAdjustment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "delivery_id", nullable = false)
	private Delivery delivery;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "changed_by_id", nullable = false)
	private User changedBy;

	@Column(precision = 12, scale = 2) private BigDecimal previousItemsSubtotal;
	@Column(precision = 12, scale = 2) private BigDecimal newItemsSubtotal;
	@Column(precision = 10, scale = 2) private BigDecimal previousDeliveryFee;
	@Column(precision = 10, scale = 2) private BigDecimal newDeliveryFee;
	@Column(precision = 10, scale = 2) private BigDecimal previousDiscount;
	@Column(precision = 10, scale = 2) private BigDecimal newDiscount;
	@Column(precision = 10, scale = 2) private BigDecimal previousPaymentFee;
	@Column(precision = 10, scale = 2) private BigDecimal newPaymentFee;

	@Column(length = 255)
	private String reason;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();
}
