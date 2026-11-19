package com.guaxi_livery.guaxiLivery.service.finance;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Expense;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** CMV aproximado: compras de itens estocáveis (insumos e embalagens) lançadas no período. */
@Component
public class PurchasesCostOfGoods implements CostOfGoodsStrategy {

	@Override
	public String method() {
		return "COMPRAS_DO_PERIODO";
	}

	@Override
	public BigDecimal costOfGoods(UUID companyId, LocalDate from, LocalDate to, List<Expense> periodExpenses) {
		return periodExpenses.stream().filter(this::coveredByCostOfGoods)
				.map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	@Override
	public boolean coveredByCostOfGoods(Expense expense) {
		return expense.getCategoryGroup().stock();
	}
}
