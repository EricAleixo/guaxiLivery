package com.guaxi_livery.guaxiLivery.service.finance;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.FinanceDtos.*;
import com.guaxi_livery.guaxiLivery.repository.DeliveryRepository;
import com.guaxi_livery.guaxiLivery.repository.ExpenseRepository;
import com.guaxi_livery.guaxiLivery.repository.OrderFinancialAdjustmentRepository;
import com.guaxi_livery.guaxiLivery.service.finance.FinancePeriods.Period;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.guaxi_livery.guaxiLivery.service.finance.OrderValues.*;

/**
 * Cálculos financeiros a partir dos pedidos já existentes (fonte única das vendas) e das despesas lançadas.
 * Nada de vendas é copiado: tudo é agregado sob demanda a partir da tabela de pedidos.
 */
@Service
public class FinanceService {

	/** Acima disso a série diária deixa de ser enviada nos relatórios (fica só a mensal). */
	private static final long MAX_DAILY_POINTS = 400;
	private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

	private final DeliveryRepository deliveries;
	private final ExpenseRepository expenses;
	private final OrderFinancialAdjustmentRepository adjustments;
	private final ExpenseService expenseService;
	private final CostOfGoodsStrategy cogs;
	private final FinancePeriods periods;

	public FinanceService(DeliveryRepository deliveries, ExpenseRepository expenses,
						  OrderFinancialAdjustmentRepository adjustments, ExpenseService expenseService,
						  CostOfGoodsStrategy cogs, FinancePeriods periods) {
		this.deliveries = deliveries;
		this.expenses = expenses;
		this.adjustments = adjustments;
		this.expenseService = expenseService;
		this.cogs = cogs;
		this.periods = periods;
	}

	// ======================= Visão geral =======================

	@Transactional
	public OverviewResponse overview(User user, LocalDate from, LocalDate to) {
		Company company = expenseService.companyOf(user);
		expenseService.materializeRecurring(company);
		Period p = periods.resolve(from, to);

		List<Delivery> orders = finalized(company, p);
		RevenueSummary revenue = revenueSummary(orders, canceled(company, p));
		List<Expense> periodExpenses = expensesByDate(company, p);
		ExpenseSummary expenseSummary = expenseSummary(periodExpenses);
		ResultSummary result = result(company, p.from(), p.to(), revenue.net(), periodExpenses);

		BigDecimal outflow = sum(expenses.findByCompanyIdAndPaidAtBetween(company.getId(), p.from(), p.to()), Expense::getAmount);
		CashFlow cash = new CashFlow(revenue.net(), outflow, revenue.net().subtract(outflow), expenseSummary.pending());

		return new OverviewResponse(p.from(), p.to(), revenue, expenseSummary, result, cash);
	}

	// ======================= Faturamento =======================

	@Transactional(readOnly = true)
	public RevenueResponse revenue(User user, LocalDate from, LocalDate to) {
		Company company = expenseService.companyOf(user);
		Period p = periods.resolve(from, to);
		List<Delivery> orders = finalized(company, p);

		Set<UUID> adjusted = orders.isEmpty() ? Set.of()
				: new HashSet<>(adjustments.adjustedAmong(orders.stream().map(Delivery::getId).toList()));

		List<ProductSales> products = orders.stream()
				.collect(Collectors.groupingBy(d -> d.getFoodName(), LinkedHashMap::new, Collectors.toList()))
				.values().stream()
				.map(list -> new ProductSales(list.getFirst().getFoodName(),
						list.stream().map(d -> d.getProduct() == null ? null : d.getProduct().getId()).filter(Objects::nonNull).findFirst().orElse(null),
						list.stream().mapToLong(Delivery::getQuantity).sum(), list.size(),
						sum(list.stream().filter(OrderValues::hasValue).toList(), OrderValues::gross)))
				.sorted(Comparator.comparing(ProductSales::gross).reversed().thenComparing(ProductSales::quantity, Comparator.reverseOrder()))
				.toList();

		return new RevenueResponse(p.from(), p.to(), revenueSummary(orders, canceled(company, p)),
				p.days() <= MAX_DAILY_POINTS ? daily(orders, p) : List.of(), products,
				orders.stream().map(d -> financialOrder(d, adjusted.contains(d.getId()))).toList());
	}

	/** Registra valores do pedido informados pelo proprietário (taxas, desconto, ou o valor de um pedido antigo). */
	@Transactional
	public FinancialOrder adjustOrder(User user, UUID deliveryId, OrderAdjustmentRequest req) {
		Company company = expenseService.companyOf(user);
		Delivery d = deliveries.findOwned(deliveryId, company.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
		if (d.getStatus() == DeliveryStatus.CANCELADO) {
			throw new ApiException(HttpStatus.CONFLICT, "Pedido cancelado não entra no faturamento");
		}
		BigDecimal items = req.itemsSubtotal() != null ? req.itemsSubtotal() : d.getItemsSubtotal();
		if (items == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o valor dos itens deste pedido");
		}
		if (req.discount().compareTo(items.add(req.deliveryFee())) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "O desconto não pode ser maior que o valor do pedido");
		}

		OrderFinancialAdjustment a = new OrderFinancialAdjustment();
		a.setDelivery(d);
		a.setChangedBy(user);
		a.setReason(req.reason() == null || req.reason().isBlank() ? null : req.reason().trim());
		a.setPreviousItemsSubtotal(d.getItemsSubtotal());
		a.setPreviousDeliveryFee(d.getDeliveryFee());
		a.setPreviousDiscount(d.getDiscount());
		a.setPreviousPaymentFee(d.getPaymentFee());

		d.setItemsSubtotal(items);
		if (req.itemsSubtotal() != null) {
			d.setUnitPrice(items.divide(BigDecimal.valueOf(d.getQuantity()), 2, RoundingMode.HALF_UP));
		}
		d.setDeliveryFee(req.deliveryFee());
		d.setDiscount(req.discount());
		d.setPaymentFee(req.paymentFee());

		a.setNewItemsSubtotal(d.getItemsSubtotal());
		a.setNewDeliveryFee(d.getDeliveryFee());
		a.setNewDiscount(d.getDiscount());
		a.setNewPaymentFee(d.getPaymentFee());
		adjustments.save(a);
		return financialOrder(d, true);
	}

	@Transactional(readOnly = true)
	public List<OrderAdjustmentResponse> orderAdjustments(User user, UUID deliveryId) {
		Company company = expenseService.companyOf(user);
		deliveries.findOwned(deliveryId, company.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
		return adjustments.findByDelivery(deliveryId).stream().map(OrderAdjustmentResponse::of).toList();
	}

	// ======================= Relatórios =======================

	@Transactional
	public ReportsResponse reports(User user, LocalDate from, LocalDate to) {
		Company company = expenseService.companyOf(user);
		expenseService.materializeRecurring(company);
		Period p = periods.resolve(from, to);
		List<Delivery> orders = finalized(company, p);
		List<Expense> periodExpenses = expensesByDate(company, p);

		Map<YearMonth, List<Delivery>> ordersByMonth = orders.stream()
				.collect(Collectors.groupingBy(d -> YearMonth.from(finalizedDate(d))));
		Map<YearMonth, List<Expense>> expensesByMonth = periodExpenses.stream()
				.collect(Collectors.groupingBy(e -> YearMonth.from(e.getExpenseDate())));

		List<MonthPoint> months = new ArrayList<>();
		for (YearMonth m = YearMonth.from(p.from()); !m.isAfter(YearMonth.from(p.to())); m = m.plusMonths(1)) {
			List<Delivery> mo = ordersByMonth.getOrDefault(m, List.of());
			List<Expense> me = expensesByMonth.getOrDefault(m, List.of());
			LocalDate mFrom = max(m.atDay(1), p.from());
			LocalDate mTo = min(m.atEndOfMonth(), p.to());
			BigDecimal gross = sum(mo, OrderValues::gross);
			BigDecimal net = sum(mo, OrderValues::net);
			ResultSummary r = result(company, mFrom, mTo, net, me);
			months.add(new MonthPoint(m.toString(), gross, net, mo.size(), sum(me, Expense::getAmount),
					sum(filter(me, ExpenseStatus.PAGO), Expense::getAmount),
					sum(filter(me, ExpenseStatus.PENDENTE), Expense::getAmount), r.profit(), r.marginPercent()));
		}

		return new ReportsResponse(p.from(), p.to(), months,
				p.days() <= MAX_DAILY_POINTS ? daily(orders, p) : List.of(),
				expenseSummary(periodExpenses).byGroup());
	}

	// ======================= Cálculos =======================

	private List<Delivery> finalized(Company company, Period p) {
		return deliveries.findFinalized(company.getId(), DeliveryStatus.ENTREGUE, p.start(), p.end());
	}

	private long canceled(Company company, Period p) {
		return deliveries.countCanceled(company.getId(), DeliveryStatus.CANCELADO, p.start(), p.end());
	}

	private List<Expense> expensesByDate(Company company, Period p) {
		return expenses.findByCompanyIdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(company.getId(), p.from(), p.to());
	}

	private LocalDate finalizedDate(Delivery d) {
		return periods.localDate(d.getDeliveredAt() != null ? d.getDeliveredAt() : d.getCreatedAt());
	}

	RevenueSummary revenueSummary(List<Delivery> orders, long canceledOrders) {
		List<Delivery> valued = orders.stream().filter(OrderValues::hasValue).toList();
		BigDecimal gross = sum(valued, OrderValues::gross);
		BigDecimal discounts = sum(valued, d -> nz(d.getDiscount()));
		BigDecimal fees = sum(valued, d -> nz(d.getPaymentFee()));
		BigDecimal net = gross.subtract(discounts).subtract(fees);
		BigDecimal ticket = valued.isEmpty() ? null
				: gross.divide(BigDecimal.valueOf(valued.size()), 2, RoundingMode.HALF_UP);
		return new RevenueSummary(orders.size(), orders.size() - valued.size(),
				orders.stream().mapToLong(Delivery::getQuantity).sum(), canceledOrders,
				sum(valued, d -> nz(d.getItemsSubtotal())), sum(valued, d -> nz(d.getDeliveryFee())),
				gross, discounts, fees, net, ticket);
	}

	private List<DailyPoint> daily(List<Delivery> orders, Period p) {
		Map<LocalDate, List<Delivery>> byDay = orders.stream().collect(Collectors.groupingBy(this::finalizedDate));
		List<DailyPoint> out = new ArrayList<>();
		for (LocalDate d = p.from(); !d.isAfter(p.to()); d = d.plusDays(1)) {
			List<Delivery> l = byDay.getOrDefault(d, List.of());
			out.add(new DailyPoint(d, sum(l, OrderValues::gross), sum(l, OrderValues::net), l.size()));
		}
		return out;
	}

	ExpenseSummary expenseSummary(List<Expense> list) {
		LocalDate today = periods.today();
		Map<ExpenseGroup, List<Expense>> byGroup = list.stream()
				.collect(Collectors.groupingBy(Expense::getCategoryGroup, () -> new EnumMap<>(ExpenseGroup.class), Collectors.toList()));
		List<GroupTotal> groups = byGroup.entrySet().stream()
				.map(en -> new GroupTotal(en.getKey(), en.getKey().label(), sum(en.getValue(), Expense::getAmount),
						sum(filter(en.getValue(), ExpenseStatus.PAGO), Expense::getAmount),
						sum(filter(en.getValue(), ExpenseStatus.PENDENTE), Expense::getAmount),
						en.getValue().stream().collect(Collectors.groupingBy(Expense::getSubcategory)).entrySet().stream()
								.map(s -> new SubcategoryTotal(s.getKey(), sum(s.getValue(), Expense::getAmount)))
								.sorted(Comparator.comparing(SubcategoryTotal::total).reversed()).toList()))
				.sorted(Comparator.comparing(GroupTotal::total).reversed())
				.toList();
		return new ExpenseSummary(list.size(), sum(list, Expense::getAmount),
				sum(filter(list, ExpenseStatus.PAGO), Expense::getAmount),
				sum(filter(list, ExpenseStatus.PENDENTE), Expense::getAmount),
				sum(list.stream().filter(e -> e.getStatus() == ExpenseStatus.PENDENTE && e.getDueDate() != null
						&& e.getDueDate().isBefore(today)).toList(), Expense::getAmount),
				sum(list.stream().filter(e -> e.getType() == ExpenseType.FIXA).toList(), Expense::getAmount),
				sum(list.stream().filter(e -> e.getType() == ExpenseType.VARIAVEL).toList(), Expense::getAmount),
				groups);
	}

	/**
	 * Resultado por competência: receita líquida − CMV − despesas operacionais.
	 * Pagas e pendentes entram (o custo existe mesmo antes de sair do caixa); o que já está no CMV não é somado de novo.
	 */
	ResultSummary result(Company company, LocalDate from, LocalDate to, BigDecimal net, List<Expense> periodExpenses) {
		BigDecimal costOfGoods = cogs.costOfGoods(company.getId(), from, to, periodExpenses);
		BigDecimal operating = sum(periodExpenses.stream().filter(e -> !cogs.coveredByCostOfGoods(e)).toList(), Expense::getAmount);
		BigDecimal profit = net.subtract(costOfGoods).subtract(operating);
		BigDecimal margin = net.signum() > 0
				? profit.multiply(HUNDRED).divide(net, 1, RoundingMode.HALF_UP) : null;
		return new ResultSummary(net, costOfGoods, cogs.method(), operating, profit, margin);
	}

	private FinancialOrder financialOrder(Delivery d, boolean adjusted) {
		boolean has = hasValue(d);
		return new FinancialOrder(d.getId(), d.getFoodName(), d.getQuantity(), d.getClient().getName(),
				d.getDeliveredAt() != null ? d.getDeliveredAt() : d.getCreatedAt(),
				d.getUnitPrice(), d.getItemsSubtotal(), d.getDeliveryFee(), d.getDiscount(), d.getPaymentFee(),
				has ? gross(d) : null, has ? net(d) : null, has, adjusted);
	}

	private static List<Expense> filter(List<Expense> l, ExpenseStatus s) {
		return l.stream().filter(e -> e.getStatus() == s).toList();
	}

	private static <T> BigDecimal sum(Collection<T> items, Function<T, BigDecimal> f) {
		return items.stream().map(f).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	private static LocalDate max(LocalDate a, LocalDate b) { return a.isAfter(b) ? a : b; }

	private static LocalDate min(LocalDate a, LocalDate b) { return a.isBefore(b) ? a : b; }
}
