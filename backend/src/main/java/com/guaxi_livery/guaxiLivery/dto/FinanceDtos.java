package com.guaxi_livery.guaxiLivery.dto;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class FinanceDtos {
	private FinanceDtos() {}

	// ---------------- Faturamento ----------------

	/**
	 * Faturamento bruto = itens + taxa de entrega cobrada do cliente.
	 * Receita líquida = bruto − descontos − taxas sobre vendas.
	 * Pedidos sem valor registrado contam em {@code orders} mas não entram nos valores.
	 */
	public record RevenueSummary(
			long orders,
			long ordersWithoutValue,
			long itemsSold,
			long canceledOrders,
			BigDecimal itemsSubtotal,
			BigDecimal deliveryFees,
			BigDecimal gross,
			BigDecimal discounts,
			BigDecimal salesFees,
			BigDecimal net,
			BigDecimal averageTicket) {}

	public record DailyPoint(LocalDate date, BigDecimal gross, BigDecimal net, long orders) {}

	public record ProductSales(String name, UUID productId, long quantity, long orders, BigDecimal gross) {}

	public record FinancialOrder(
			UUID id, String foodName, int quantity, String clientName, Instant finalizedAt,
			BigDecimal unitPrice, BigDecimal itemsSubtotal, BigDecimal deliveryFee, BigDecimal discount,
			BigDecimal paymentFee, BigDecimal gross, BigDecimal net, boolean hasValue, boolean adjusted) {}

	public record RevenueResponse(LocalDate from, LocalDate to, RevenueSummary summary, List<DailyPoint> daily,
								  List<ProductSales> products, List<FinancialOrder> orders) {}

	/** Valores informados pelo proprietário. itemsSubtotal só é obrigatório para pedidos sem valor registrado. */
	public record OrderAdjustmentRequest(
			@DecimalMin(value = "0.01", message = "Valor dos itens deve ser maior que zero")
			@Digits(integer = 10, fraction = 2) BigDecimal itemsSubtotal,
			@NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal deliveryFee,
			@NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal discount,
			@NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal paymentFee,
			@Size(max = 255) String reason) {}

	public record OrderAdjustmentResponse(
			UUID id, String changedBy, Instant createdAt, String reason,
			BigDecimal previousItemsSubtotal, BigDecimal newItemsSubtotal,
			BigDecimal previousDeliveryFee, BigDecimal newDeliveryFee,
			BigDecimal previousDiscount, BigDecimal newDiscount,
			BigDecimal previousPaymentFee, BigDecimal newPaymentFee) {
		public static OrderAdjustmentResponse of(OrderFinancialAdjustment a) {
			return new OrderAdjustmentResponse(a.getId(), a.getChangedBy().getName(), a.getCreatedAt(), a.getReason(),
					a.getPreviousItemsSubtotal(), a.getNewItemsSubtotal(), a.getPreviousDeliveryFee(), a.getNewDeliveryFee(),
					a.getPreviousDiscount(), a.getNewDiscount(), a.getPreviousPaymentFee(), a.getNewPaymentFee());
		}
	}

	// ---------------- Despesas ----------------

	public record ExpenseRequest(
			@NotBlank @Size(max = 120) String description,
			@NotNull ExpenseGroup group,
			@NotBlank @Size(max = 60) String subcategory,
			@NotNull @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
			@Digits(integer = 10, fraction = 2) BigDecimal amount,
			@NotNull LocalDate expenseDate,
			LocalDate dueDate,
			LocalDate paidAt,
			@NotNull PaymentMethod paymentMethod,
			@Size(max = 120) String supplier,
			@Size(max = 500) String notes,
			@NotNull ExpenseType type,
			@NotNull ExpenseStatus status,
			@NotNull ExpenseRecurrence recurrence) {}

	public record ExpenseStatusRequest(@NotNull ExpenseStatus status, LocalDate paidAt) {}

	public record ExpenseResponse(
			UUID id, String description, ExpenseGroup group, String groupLabel, String subcategory, BigDecimal amount,
			LocalDate expenseDate, LocalDate dueDate, LocalDate paidAt, PaymentMethod paymentMethod, String supplier,
			String notes, ExpenseType type, ExpenseStatus status, ExpenseRecurrence recurrence,
			UUID recurrenceParentId, boolean overdue) {
		public static ExpenseResponse of(Expense e, LocalDate today) {
			boolean overdue = e.getStatus() == ExpenseStatus.PENDENTE && e.getDueDate() != null && e.getDueDate().isBefore(today);
			return new ExpenseResponse(e.getId(), e.getDescription(), e.getCategoryGroup(), e.getCategoryGroup().label(),
					e.getSubcategory(), e.getAmount(), e.getExpenseDate(), e.getDueDate(), e.getPaidAt(),
					e.getPaymentMethod(), e.getSupplier(), e.getNotes(), e.getType(), e.getStatus(), e.getRecurrence(),
					e.getRecurrenceParent() == null ? null : e.getRecurrenceParent().getId(), overdue);
		}
	}

	public record ExpenseCategoryResponse(ExpenseGroup group, String label, boolean stock, List<String> subcategories) {}

	public record SubcategoryTotal(String subcategory, BigDecimal total) {}

	public record GroupTotal(ExpenseGroup group, String label, BigDecimal total, BigDecimal paid, BigDecimal pending,
							 List<SubcategoryTotal> subcategories) {}

	/** Despesas por competência (data da despesa). Pagas e pendentes sempre separadas. */
	public record ExpenseSummary(long count, BigDecimal total, BigDecimal paid, BigDecimal pending, BigDecimal overdue,
								 BigDecimal fixed, BigDecimal variable, List<GroupTotal> byGroup) {}

	// ---------------- Visão geral ----------------

	/**
	 * Resultado (regime de competência).
	 * costOfGoods: hoje = compras de insumos/embalagens do período (aproximação); futuramente, CMV do estoque.
	 */
	public record ResultSummary(BigDecimal netRevenue, BigDecimal costOfGoods, String costOfGoodsMethod,
								BigDecimal operatingExpenses, BigDecimal profit, BigDecimal marginPercent) {}

	/** Fluxo de caixa: o que de fato entrou e saiu no período. */
	public record CashFlow(BigDecimal inflow, BigDecimal outflow, BigDecimal balance, BigDecimal pendingCommitments) {}

	public record OverviewResponse(LocalDate from, LocalDate to, RevenueSummary revenue, ExpenseSummary expenses,
								   ResultSummary result, CashFlow cashFlow) {}

	// ---------------- Relatórios ----------------

	public record MonthPoint(String month, BigDecimal gross, BigDecimal net, long orders, BigDecimal expenses,
							 BigDecimal paidExpenses, BigDecimal pendingExpenses, BigDecimal profit, BigDecimal marginPercent) {}

	public record ReportsResponse(LocalDate from, LocalDate to, List<MonthPoint> months, List<DailyPoint> daily,
								  List<GroupTotal> byGroup) {}
}
