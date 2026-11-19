package com.guaxi_livery.guaxiLivery.service.finance;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.FinanceDtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.ExpenseRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;

@Service
public class ExpenseService {

	/** Teto de ocorrências geradas por chamada, para uma data base muito antiga não travar a requisição. */
	private static final int MAX_OCCURRENCES_PER_RUN = 600;

	private final ExpenseRepository expenses;
	private final CompanyRepository companies;
	private final FinancePeriods periods;

	public ExpenseService(ExpenseRepository expenses, CompanyRepository companies, FinancePeriods periods) {
		this.expenses = expenses;
		this.companies = companies;
		this.periods = periods;
	}

	public List<ExpenseCategoryResponse> categories() {
		return Arrays.stream(ExpenseGroup.values())
				.map(g -> new ExpenseCategoryResponse(g, g.label(), g.stock(), g.subcategories())).toList();
	}

	@Transactional
	public List<ExpenseResponse> list(User user, LocalDate from, LocalDate to, ExpenseGroup group, ExpenseStatus status) {
		Company company = companyOf(user);
		materializeRecurring(company);
		FinancePeriods.Period p = periods.resolve(from, to);
		LocalDate today = periods.today();
		return expenses.findByCompanyIdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(company.getId(), p.from(), p.to())
				.stream()
				.filter(e -> group == null || e.getCategoryGroup() == group)
				.filter(e -> status == null || e.getStatus() == status)
				.map(e -> ExpenseResponse.of(e, today)).toList();
	}

	@Transactional
	public ExpenseResponse create(User user, ExpenseRequest req) {
		Expense e = new Expense();
		e.setCompany(companyOf(user));
		apply(e, req);
		return ExpenseResponse.of(expenses.save(e), periods.today());
	}

	@Transactional
	public ExpenseResponse update(User user, UUID id, ExpenseRequest req) {
		Expense e = owned(user, id);
		if (e.getRecurrenceParent() != null && req.recurrence() != ExpenseRecurrence.NENHUMA) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Ocorrências geradas não podem ter recorrência própria; edite a despesa original");
		}
		boolean recurrenceChanged = e.getRecurrence() != req.recurrence() || !e.getExpenseDate().equals(req.expenseDate());
		apply(e, req);
		if (recurrenceChanged && e.getRecurrenceParent() == null) {
			// Nova regra de recorrência: as ocorrências já geradas ficam no histórico como lançamentos avulsos.
			expenses.detachOccurrences(e.getId());
			e.setOccurrencesGenerated(0);
		}
		return ExpenseResponse.of(e, periods.today());
	}

	@Transactional
	public ExpenseResponse updateStatus(User user, UUID id, ExpenseStatusRequest req) {
		Expense e = owned(user, id);
		setStatus(e, req.status(), req.paidAt(), periods.today());
		e.setUpdatedAt(Instant.now());
		return ExpenseResponse.of(e, periods.today());
	}

	@Transactional
	public void delete(User user, UUID id) {
		Expense e = owned(user, id);
		// Excluir a despesa recorrente encerra a recorrência; as ocorrências já lançadas são preservadas.
		expenses.detachOccurrences(e.getId());
		expenses.delete(e);
	}

	/**
	 * Gera, como PENDENTE, as ocorrências das despesas recorrentes até o fim do mês atual.
	 * Cada ocorrência é uma despesa independente ligada à original; editar a original não reescreve o histórico.
	 */
	@Transactional
	public void materializeRecurring(Company company) {
		LocalDate today = periods.today();
		LocalDate until = today.withDayOfMonth(today.lengthOfMonth());
		for (Expense root : expenses.findRecurringRoots(company.getId(), ExpenseRecurrence.NENHUMA)) {
			int created = 0;
			int n = root.getOccurrencesGenerated() + 1;
			LocalDate date;
			while (created < MAX_OCCURRENCES_PER_RUN && !(date = root.getRecurrence().occurrence(root.getExpenseDate(), n)).isAfter(until)) {
				expenses.save(occurrence(root, date, n));
				root.setOccurrencesGenerated(n);
				n++;
				created++;
			}
		}
	}

	private Expense occurrence(Expense root, LocalDate date, int n) {
		Expense o = new Expense();
		o.setCompany(root.getCompany());
		o.setDescription(root.getDescription());
		o.setCategoryGroup(root.getCategoryGroup());
		o.setSubcategory(root.getSubcategory());
		o.setAmount(root.getAmount());
		o.setExpenseDate(date);
		if (root.getDueDate() != null) {
			long offset = ChronoUnit.DAYS.between(root.getExpenseDate(), root.getDueDate());
			o.setDueDate(date.plusDays(offset));
		}
		o.setPaymentMethod(root.getPaymentMethod());
		o.setSupplier(root.getSupplier());
		o.setNotes(root.getNotes());
		o.setType(root.getType());
		o.setStatus(ExpenseStatus.PENDENTE);
		o.setRecurrence(ExpenseRecurrence.NENHUMA);
		o.setRecurrenceParent(root);
		return o;
	}

	private void apply(Expense e, ExpenseRequest req) {
		e.setDescription(req.description().trim());
		e.setCategoryGroup(req.group());
		e.setSubcategory(req.subcategory().trim());
		e.setAmount(req.amount());
		e.setExpenseDate(req.expenseDate());
		if (req.dueDate() != null && req.dueDate().isBefore(req.expenseDate())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "O vencimento não pode ser antes da data da despesa");
		}
		e.setDueDate(req.dueDate());
		e.setPaymentMethod(req.paymentMethod());
		e.setSupplier(blankToNull(req.supplier()));
		e.setNotes(blankToNull(req.notes()));
		e.setType(req.type());
		e.setRecurrence(req.recurrence());
		// Lançamento de despesa já paga: por padrão saiu do caixa na própria data da despesa.
		setStatus(e, req.status(), req.paidAt(), e.getExpenseDate());
		e.setUpdatedAt(Instant.now());
	}

	/** Pago exige data de pagamento; pendente nunca tem. */
	private void setStatus(Expense e, ExpenseStatus status, LocalDate paidAt, LocalDate fallback) {
		e.setStatus(status);
		if (status == ExpenseStatus.PAGO) {
			LocalDate when = paidAt != null ? paidAt : (e.getPaidAt() != null ? e.getPaidAt() : fallback);
			e.setPaidAt(when);
		} else {
			e.setPaidAt(null);
		}
	}

	private static String blankToNull(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	private Expense owned(User user, UUID id) {
		return expenses.findByIdAndCompanyId(id, companyOf(user).getId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Despesa não encontrada"));
	}

	Company companyOf(User user) {
		return companies.findByUserId(user.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuário sem empresa cadastrada"));
	}
}
