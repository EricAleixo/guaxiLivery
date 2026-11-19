package com.guaxi_livery.guaxiLivery.domain;

import java.util.List;

/**
 * Grupo (categoria principal) de despesa. As subcategorias são sugestões; o proprietário pode digitar outras.
 *
 * <p>{@code stock = true} marca compras de itens estocáveis (insumos e embalagens). Hoje elas entram no
 * resultado como aproximação do CMV; quando houver estoque/ficha técnica, o CMV real substitui essas compras
 * no resultado (mas elas continuam saindo do caixa).</p>
 */
public enum ExpenseGroup {
	INGREDIENTES("Ingredientes e insumos", true,
			List.of("Carne", "Pão", "Queijo", "Bacon", "Verduras e legumes", "Molhos e temperos", "Outros ingredientes")),
	EMBALAGENS("Embalagens", true,
			List.of("Caixas", "Sacolas", "Guardanapos", "Copos", "Outros descartáveis")),
	FUNCIONARIOS("Funcionários", false,
			List.of("Salários", "Encargos", "Benefícios", "Pagamentos adicionais")),
	ESTABELECIMENTO("Estabelecimento", false,
			List.of("Aluguel", "Água", "Energia elétrica", "Internet", "Gás", "Produtos de limpeza")),
	DELIVERY("Delivery", false,
			List.of("Entregadores", "Combustível", "Manutenção de veículos")),
	MARKETING("Marketing", false,
			List.of("Anúncios", "Divulgação", "Design")),
	IMPOSTOS("Impostos e serviços", false,
			List.of("DAS", "Contabilidade", "Taxas e serviços administrativos")),
	TECNOLOGIA("Tecnologia", false,
			List.of("Sistemas", "Hospedagem", "Serviços digitais")),
	EQUIPAMENTOS("Equipamentos", false,
			List.of("Manutenção", "Reposição", "Compra de equipamentos")),
	OUTROS("Outros", false, List.of());

	private final String label;
	private final boolean stock;
	private final List<String> subcategories;

	ExpenseGroup(String label, boolean stock, List<String> subcategories) {
		this.label = label;
		this.stock = stock;
		this.subcategories = subcategories;
	}

	public String label() { return label; }

	public boolean stock() { return stock; }

	public List<String> subcategories() { return subcategories; }
}
