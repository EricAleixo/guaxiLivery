package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Despesa registrada manualmente pelo proprietário. */
@Entity
@Table(name = "expenses", indexes = {
		@Index(name = "idx_expense_company_date", columnList = "company_id, expense_date"),
		@Index(name = "idx_expense_company_paid", columnList = "company_id, paid_at")})
@Getter
@Setter
@NoArgsConstructor
public class Expense {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

	@Column(nullable = false, length = 120)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(name = "category_group", nullable = false, length = 30)
	private ExpenseGroup categoryGroup;

	@Column(nullable = false, length = 60)
	private String subcategory;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	/** Data de competência da despesa (usada no resultado). */
	@Column(name = "expense_date", nullable = false)
	private LocalDate expenseDate;

	private LocalDate dueDate;

	/** Data em que saiu do caixa (usada no fluxo de caixa). Só existe quando status = PAGO. */
	@Column(name = "paid_at")
	private LocalDate paidAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private PaymentMethod paymentMethod;

	@Column(length = 120)
	private String supplier;

	@Column(length = 500)
	private String notes;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private ExpenseType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private ExpenseStatus status;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private ExpenseRecurrence recurrence = ExpenseRecurrence.NENHUMA;

	/** Despesa recorrente que gerou esta ocorrência. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "recurrence_parent_id")
	private Expense recurrenceParent;

	/** Na despesa recorrente original: quantas ocorrências já foram geradas. */
	@Column(nullable = false)
	private int occurrencesGenerated = 0;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();
}
