package com.guaxi_livery.guaxiLivery.service.finance;

import com.guaxi_livery.guaxiLivery.domain.Delivery;

import java.math.BigDecimal;

/** Leitura dos valores registrados no pedido. Nunca consulta o preço atual do produto. */
final class OrderValues {
	private OrderValues() {}

	static boolean hasValue(Delivery d) {
		return d.getItemsSubtotal() != null;
	}

	static BigDecimal nz(BigDecimal v) {
		return v == null ? BigDecimal.ZERO : v;
	}

	/** Bruto = itens + taxa de entrega cobrada do cliente. */
	static BigDecimal gross(Delivery d) {
		return nz(d.getItemsSubtotal()).add(nz(d.getDeliveryFee()));
	}

	/** Líquido = bruto − desconto − taxas sobre a venda. */
	static BigDecimal net(Delivery d) {
		return gross(d).subtract(nz(d.getDiscount())).subtract(nz(d.getPaymentFee()));
	}
}
