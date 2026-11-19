package com.guaxi_livery.guaxiLivery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FinanceFlowTests {

	@Autowired
	MockMvc mvc;

	private static String find(MvcResult r, String regex) throws Exception {
		Matcher m = Pattern.compile(regex).matcher(r.getResponse().getContentAsString());
		m.find();
		return m.group(1);
	}

	private MvcResult json(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder b, String token, String body) throws Exception {
		b.header("Authorization", "Bearer " + token);
		if (body != null) b.contentType(MediaType.APPLICATION_JSON).content(body);
		return mvc.perform(b).andReturn();
	}

	private String order(String clientToken, String productId, int qty) throws Exception {
		return find(json(post("/api/deliveries/order"), clientToken,
				"{\"productId\":\"" + productId + "\",\"quantity\":" + qty + ",\"deliveryAddress\":\"Rua C, 3\"}"), "\"id\":\"([0-9a-f-]{36})\"");
	}

	private void setStatus(String token, String id, String st) throws Exception {
		mvc.perform(patch("/api/deliveries/" + id + "/status").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + st + "\"}")).andExpect(status().isOk());
	}

	@Test
	void faturamentoDespesasEResultado() throws Exception {
		MvcResult reg = mvc.perform(post("/api/auth/register/company").contentType(MediaType.APPLICATION_JSON).content("""
				{"name":"Bia","email":"bia@fin.com","password":"Senha@123","tradeName":"Fin Burger","cnpj":"99888777000166","address":"Rua B, 2"}""")).andReturn();
		String co = find(reg, "\"token\":\"([^\"]+)\"");
		String productId = find(mvc.perform(multipart("/api/products").header("Authorization", "Bearer " + co)
				.param("name", "X-Burger").param("price", "20.00").param("category", "LANCHE")).andExpect(status().isCreated()).andReturn(), "\"id\":\"([0-9a-f-]{36})\"");
		String cl = find(mvc.perform(post("/api/auth/register/client").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Joao\",\"email\":\"jf@x.com\",\"password\":\"Senha@123\"}")).andReturn(), "\"token\":\"([^\"]+)\"");

		String a = order(cl, productId, 2);          // 40,00 finalizado
		String b = order(cl, productId, 1);          // cancelado
		order(cl, productId, 5);                      // pendente (não conta)
		setStatus(co, a, "ACEITO"); setStatus(co, a, "EM_ROTA"); setStatus(co, a, "ENTREGUE");
		setStatus(co, b, "CANCELADO");

		// ajuste: taxa de entrega 5, desconto 3, taxa de pagamento 2 => bruto 45, líquido 40
		mvc.perform(patch("/api/finance/orders/" + a).header("Authorization", "Bearer " + co).contentType(MediaType.APPLICATION_JSON)
				.content("{\"deliveryFee\":5.00,\"discount\":3.00,\"paymentFee\":2.00}")).andExpect(status().isOk());

		// preço do produto muda depois: histórico não pode mudar
		mvc.perform(multipart("/api/products/" + productId).with(r -> { r.setMethod("PUT"); return r; })
				.header("Authorization", "Bearer " + co).param("name", "X-Burger").param("price", "99.00").param("category", "LANCHE"));

		String today = LocalDate.now().toString();
		String ins = "{\"description\":\"Carne\",\"group\":\"INGREDIENTES\",\"subcategory\":\"Carne\",\"amount\":10.00,\"expenseDate\":\"" + today
				+ "\",\"paymentMethod\":\"PIX\",\"type\":\"VARIAVEL\",\"status\":\"PAGO\",\"recurrence\":\"NENHUMA\"}";
		String alu = ins.replace("Carne", "Aluguel").replace("INGREDIENTES", "ESTABELECIMENTO").replace("10.00", "5.00")
				.replace("PAGO", "PENDENTE").replace("VARIAVEL", "FIXA");
		mvc.perform(post("/api/finance/expenses").header("Authorization", "Bearer " + co).contentType(MediaType.APPLICATION_JSON).content(ins)).andExpect(status().isCreated());
		mvc.perform(post("/api/finance/expenses").header("Authorization", "Bearer " + co).contentType(MediaType.APPLICATION_JSON).content(alu)).andExpect(status().isCreated());

		mvc.perform(get("/api/finance/overview?from=" + today + "&to=" + today).header("Authorization", "Bearer " + co))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.revenue.orders").value(1))
				.andExpect(jsonPath("$.revenue.itemsSold").value(2))
				.andExpect(jsonPath("$.revenue.canceledOrders").value(1))
				.andExpect(jsonPath("$.revenue.gross").value(45.0))
				.andExpect(jsonPath("$.revenue.discounts").value(3.0))
				.andExpect(jsonPath("$.revenue.net").value(40.0))
				.andExpect(jsonPath("$.expenses.total").value(15.0))
				.andExpect(jsonPath("$.expenses.pending").value(5.0))
				.andExpect(jsonPath("$.result.profit").value(25.0))
				.andExpect(jsonPath("$.result.marginPercent").value(62.5))
				.andExpect(jsonPath("$.cashFlow.outflow").value(10.0));
	}
}
