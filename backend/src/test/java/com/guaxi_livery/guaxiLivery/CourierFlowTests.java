package com.guaxi_livery.guaxiLivery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CourierFlowTests {

	@Autowired
	MockMvc mvc;

	private static String find(MvcResult r, String regex) throws Exception {
		Matcher m = Pattern.compile(regex).matcher(r.getResponse().getContentAsString());
		m.find();
		return m.group(1);
	}

	private MvcResult json(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder b, String token, String body) throws Exception {
		if (token != null) b.header("Authorization", "Bearer " + token);
		if (body != null) b.contentType(MediaType.APPLICATION_JSON).content(body);
		return mvc.perform(b).andReturn();
	}

	@Test
	void fluxoEntregador() throws Exception {
		String companyToken = find(json(post("/api/auth/register/company"), null, """
				{"name":"Ana","email":"ana@burger.com","password":"Senha@123","tradeName":"Burger Ana","cnpj":"11222333000181","address":"Rua B, 2"}"""), "\"token\":\"([^\"]+)\"");
		String companyId = find(json(get("/api/auth/me"), companyToken, null), "\"companyId\":\"([0-9a-f-]{36})\"");

		// moto sem placa/CNH é recusada
		MvcResult bad = json(post("/api/auth/register/courier"), null, """
				{"name":"Zé","email":"zeentregador@x.com","password":"Senha@123","phone":"11988887777","cpf":"12345678901","vehicleType":"MOTO"}""");
		org.junit.jupiter.api.Assertions.assertEquals(400, bad.getResponse().getStatus());

		MvcResult reg = json(post("/api/auth/register/courier"), null, """
				{"name":"Zé","email":"zeentregador@x.com","password":"Senha@123","phone":"11988887777","cpf":"12345678901",
				 "vehicleType":"MOTO","vehiclePlate":"abc1d23","cnh":"12345678900","companyIds":["%s"]}""".formatted(companyId));
		org.junit.jupiter.api.Assertions.assertEquals(201, reg.getResponse().getStatus());
		String courierToken = find(reg, "\"token\":\"([^\"]+)\"");

		// entregador não entra no painel da empresa; empresa não entra na área do entregador
		mvc.perform(get("/api/company/couriers").header("Authorization", "Bearer " + courierToken)).andExpect(status().isForbidden());
		mvc.perform(get("/api/courier/profile").header("Authorization", "Bearer " + companyToken)).andExpect(status().isForbidden());
		// ...mas é cliente também
		mvc.perform(get("/api/deliveries/mine").header("Authorization", "Bearer " + courierToken)).andExpect(status().isOk());

		// sem vínculo ativo não vê pedidos
		mvc.perform(get("/api/courier/deliveries/available").header("Authorization", "Bearer " + courierToken))
				.andExpect(status().isOk()).andExpect(content().json("[]"));

		// empresa aprova a candidatura
		MvcResult links = json(get("/api/company/couriers"), companyToken, null);
		String linkId = find(links, "\"id\":\"([0-9a-f-]{36})\",\"status\":\"CANDIDATURA\"");
		mvc.perform(post("/api/company/couriers/" + linkId + "/approve").header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ATIVO"));

		// produto + pedido do cliente
		String productId = find(mvc.perform(multipart("/api/products").header("Authorization", "Bearer " + companyToken)
				.param("name", "X-Burger").param("price", "20.00").param("category", "LANCHE")).andExpect(status().isCreated()).andReturn(), "\"id\":\"([0-9a-f-]{36})\"");
		String clientToken = find(json(post("/api/auth/register/client"), null, "{\"name\":\"Joao\",\"email\":\"j@x.com\",\"password\":\"Senha@123\"}"), "\"token\":\"([^\"]+)\"");
		String deliveryId = find(json(post("/api/deliveries/order"), clientToken,
				"{\"productId\":\"" + productId + "\",\"quantity\":2,\"deliveryAddress\":\"Rua C, 3\"}"), "\"id\":\"([0-9a-f-]{36})\"");

		// ainda PENDENTE: entregador não pode pegar
		mvc.perform(post("/api/courier/deliveries/" + deliveryId + "/claim").header("Authorization", "Bearer " + courierToken)).andExpect(status().isConflict());

		json(patch("/api/deliveries/" + deliveryId + "/status"), companyToken, "{\"status\":\"ACEITO\"}");
		mvc.perform(get("/api/courier/deliveries/available").header("Authorization", "Bearer " + courierToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(deliveryId));
		mvc.perform(post("/api/courier/deliveries/" + deliveryId + "/claim").header("Authorization", "Bearer " + courierToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$.courier.name").value("Zé"));
		mvc.perform(patch("/api/courier/deliveries/" + deliveryId + "/status").header("Authorization", "Bearer " + courierToken)
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ENTREGUE\"}")).andExpect(status().isConflict());
		for (String st : new String[]{"EM_ROTA", "ENTREGUE"})
			mvc.perform(patch("/api/courier/deliveries/" + deliveryId + "/status").header("Authorization", "Bearer " + courierToken)
					.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + st + "\"}")).andExpect(status().isOk());

		// a entrega do entregador entra no faturamento da empresa (2 × 20,00)
		mvc.perform(get("/api/finance/revenue").header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$.summary.orders").value(1)).andExpect(jsonPath("$.summary.gross").value(40.0));
	}
}
