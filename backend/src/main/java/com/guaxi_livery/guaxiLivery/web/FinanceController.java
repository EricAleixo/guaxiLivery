package com.guaxi_livery.guaxiLivery.web;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.ExpenseGroup;
import com.guaxi_livery.guaxiLivery.domain.ExpenseStatus;
import com.guaxi_livery.guaxiLivery.dto.FinanceDtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.finance.ExpenseService;
import com.guaxi_livery.guaxiLivery.service.finance.FinanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Módulo financeiro da empresa. Períodos: from/to (yyyy-MM-dd, inclusivos); sem datas = mês atual. */
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

	private final FinanceService finance;
	private final ExpenseService expenses;

	public FinanceController(FinanceService finance, ExpenseService expenses) {
		this.finance = finance;
		this.expenses = expenses;
	}

	@GetMapping("/overview")
	public OverviewResponse overview(@AuthenticationPrincipal AppUserDetails me,
									 @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
									 @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate to) {
		return finance.overview(me.user(), from, to);
	}

	@GetMapping("/revenue")
	public RevenueResponse revenue(@AuthenticationPrincipal AppUserDetails me,
								   @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
								   @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate to) {
		return finance.revenue(me.user(), from, to);
	}

	@GetMapping("/reports")
	public ReportsResponse reports(@AuthenticationPrincipal AppUserDetails me,
								   @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
								   @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate to) {
		return finance.reports(me.user(), from, to);
	}

	@PatchMapping("/orders/{id}")
	public FinancialOrder adjustOrder(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id,
									  @Valid @RequestBody OrderAdjustmentRequest body) {
		return finance.adjustOrder(me.user(), id, body);
	}

	@GetMapping("/orders/{id}/adjustments")
	public List<OrderAdjustmentResponse> adjustments(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) {
		return finance.orderAdjustments(me.user(), id);
	}

	@GetMapping("/expenses/categories")
	public List<ExpenseCategoryResponse> categories() {
		return expenses.categories();
	}

	@GetMapping("/expenses")
	public List<ExpenseResponse> listExpenses(@AuthenticationPrincipal AppUserDetails me,
											  @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
											  @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate to,
											  @RequestParam(required = false) ExpenseGroup group,
											  @RequestParam(required = false) ExpenseStatus status) {
		return expenses.list(me.user(), from, to, group, status);
	}

	@PostMapping("/expenses")
	@ResponseStatus(HttpStatus.CREATED)
	public ExpenseResponse createExpense(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody ExpenseRequest body) {
		return expenses.create(me.user(), body);
	}

	@PutMapping("/expenses/{id}")
	public ExpenseResponse updateExpense(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id,
										 @Valid @RequestBody ExpenseRequest body) {
		return expenses.update(me.user(), id, body);
	}

	@PatchMapping("/expenses/{id}/status")
	public ExpenseResponse updateExpenseStatus(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id,
											   @Valid @RequestBody ExpenseStatusRequest body) {
		return expenses.updateStatus(me.user(), id, body);
	}

	@DeleteMapping("/expenses/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteExpense(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) {
		expenses.delete(me.user(), id);
	}
}
