package com.guaxi_livery.guaxiLivery.service.finance;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Como o custo das mercadorias vendidas (CMV) entra no resultado.
 *
 * <p>Hoje não há estoque nem ficha técnica, então a implementação padrão usa as compras de insumos e
 * embalagens do período como aproximação. Quando o estoque existir, basta registrar outro bean desta interface
 * (marcado como {@code @Primary}) que calcule o CMV pelo consumo das fichas técnicas dos pedidos vendidos;
 * nesse caso as compras deixam de entrar no resultado (viram estoque) mas continuam no fluxo de caixa.</p>
 */
public interface CostOfGoodsStrategy {

	/** Identificador mostrado no front (ex.: COMPRAS_DO_PERIODO, FICHA_TECNICA). */
	String method();

	/** Custo das mercadorias no período, dado o conjunto de despesas por competência desse período. */
	BigDecimal costOfGoods(UUID companyId, LocalDate from, LocalDate to, List<Expense> periodExpenses);

	/**
	 * Se a despesa já está coberta pelo CMV (e por isso não deve ser somada de novo nas despesas operacionais).
	 * Evita contar duas vezes a mesma compra.
	 */
	boolean coveredByCostOfGoods(Expense expense);
}
