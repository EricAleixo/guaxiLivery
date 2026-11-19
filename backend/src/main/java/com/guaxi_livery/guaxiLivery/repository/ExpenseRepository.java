package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Expense;
import com.guaxi_livery.guaxiLivery.domain.ExpenseRecurrence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

	/** Despesas por competência (data da despesa), intervalo fechado. */
	List<Expense> findByCompanyIdAndExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(UUID companyId, LocalDate from, LocalDate to);

	/** Despesas pagas pela data em que saíram do caixa, intervalo fechado. */
	List<Expense> findByCompanyIdAndPaidAtBetween(UUID companyId, LocalDate from, LocalDate to);

	Optional<Expense> findByIdAndCompanyId(UUID id, UUID companyId);

	@Query("select e from Expense e where e.company.id = :companyId and e.recurrenceParent is null and e.recurrence <> :none")
	List<Expense> findRecurringRoots(UUID companyId, ExpenseRecurrence none);

	@Modifying
	@Query("update Expense e set e.recurrenceParent = null where e.recurrenceParent.id = :parentId")
	void detachOccurrences(UUID parentId);
}
