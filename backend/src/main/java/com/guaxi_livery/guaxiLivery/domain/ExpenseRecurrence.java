package com.guaxi_livery.guaxiLivery.domain;

import java.time.LocalDate;

public enum ExpenseRecurrence {
	NENHUMA, SEMANAL, MENSAL, ANUAL;

	/** Data da n-ésima ocorrência a partir da original (sempre calculada a partir da base, sem acumular erro de fim de mês). */
	public LocalDate occurrence(LocalDate base, int n) {
		return switch (this) {
			case NENHUMA -> base;
			case SEMANAL -> base.plusWeeks(n);
			case MENSAL -> base.plusMonths(n);
			case ANUAL -> base.plusYears(n);
		};
	}
}
