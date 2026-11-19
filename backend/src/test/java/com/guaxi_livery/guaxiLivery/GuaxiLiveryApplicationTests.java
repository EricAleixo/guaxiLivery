package com.guaxi_livery.guaxiLivery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
class GuaxiLiveryApplicationTests {

	@Autowired
	MockMvc mvc;

	private String token(MvcResult r) throws Exception {
		Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(r.getResponse().getContentAsString());
		m.find();
		return m.group(1);
	}

	@Test
	void fluxoCompleto() throws Exception {
		String companyJson = """
				{"name":"Dona Maria","email":"maria@pizza.com","password":"Senha@123","tradeName":"Pizza da Maria",
				 "cnpj":"12345678000199","phone":"11999999999","address":"Rua A, 1"}""";
		String companyToken = token(mvc.perform(post("/api/auth/register/company")
				.contentType(MediaType.APPLICATION_JSON).content(companyJson))
				.andExpect(status().isCreated()).andReturn());

		String clientToken = token(mvc.perform(post("/api/auth/register/client")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Joao\",\"email\":\"joao@x.com\",\"password\":\"Senha@123\"}"))
				.andExpect(status().isCreated()).andReturn());

		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"joao@x.com\",\"password\":\"errada\"}"))
				.andExpect(status().isUnauthorized());

		mvc.perform(get("/api/deliveries/mine")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/deliveries/available").header("Authorization", "Bearer " + clientToken))
				.andExpect(status().isForbidden());

		MockMultipartFile img = new MockMultipartFile("image", "pizza.png", "image/png", new byte[] {1, 2, 3});
		MvcResult created = mvc.perform(multipart("/api/deliveries").file(img)
				.param("foodName", "Pizza calabresa").param("quantity", "1")
				.param("pickupAddress", "Rua A, 1").param("deliveryAddress", "Rua B, 2")
				.header("Authorization", "Bearer " + clientToken))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDENTE")).andReturn();

		String deliveryId = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"")
				.matcher(created.getResponse().getContentAsString()).results().findFirst().get().group(1);

		// sem imagem de tipo valido
		mvc.perform(multipart("/api/deliveries")
				.file(new MockMultipartFile("image", "x.exe", "application/octet-stream", new byte[] {1}))
				.param("foodName", "X").param("quantity", "1")
				.param("pickupAddress", "a").param("deliveryAddress", "b")
				.header("Authorization", "Bearer " + clientToken))
				.andExpect(status().isBadRequest());

		String imageUrl = Pattern.compile("\"imageUrl\":\"([^\"]+)\"")
				.matcher(created.getResponse().getContentAsString()).results().findFirst().get().group(1);
		mvc.perform(get(imageUrl)).andExpect(status().isOk());

		mvc.perform(get("/api/deliveries/available").header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
		mvc.perform(patch("/api/deliveries/" + deliveryId + "/status").contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"ACEITO\"}").header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACEITO"));
		mvc.perform(patch("/api/deliveries/" + deliveryId + "/status").contentType(MediaType.APPLICATION_JSON)
				.content("{\"status\":\"ENTREGUE\"}").header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isConflict());
	}

	@Test
	void produtoComVariasMidias() throws Exception {
		String companyToken = token(mvc.perform(post("/api/auth/register/company")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
				{"name":"Ze","email":"ze@lanche.com","password":"Senha@123","tradeName":"Lanches do Ze","cnpj":"98765432000100"}"""))
				.andExpect(status().isCreated()).andReturn());
		String clientToken = token(mvc.perform(post("/api/auth/register/client")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Ana\",\"email\":\"ana@x.com\",\"password\":\"Senha@123\"}"))
				.andExpect(status().isCreated()).andReturn());

		mvc.perform(multipart("/api/products")
				.file(new MockMultipartFile("media", "a.png", "image/png", new byte[] {1}))
				.file(new MockMultipartFile("media", "b.jpg", "image/jpeg", new byte[] {2}))
				.file(new MockMultipartFile("media", "v.mp4", "video/mp4", new byte[] {3}))
				.param("name", "X-Ze").param("price", "20.00").param("category", "LANCHE")
				.header("Authorization", "Bearer " + companyToken))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.media.length()").value(3))
				.andExpect(jsonPath("$.media[2].type").value("VIDEO"));

		mvc.perform(get("/api/products/feed").header("Authorization", "Bearer " + clientToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].product.media.length()").value(3))
				.andExpect(jsonPath("$[0].product.imageUrl").exists());
	}
}
