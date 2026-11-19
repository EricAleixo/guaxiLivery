package com.guaxi_livery.guaxiLivery.service;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.CourierDtos.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos;
import com.guaxi_livery.guaxiLivery.repository.*;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Cadastro, perfil e vínculos de entregadores (lado do entregador e lado da empresa). */
@Service
public class CourierService {

	private final UserRepository users;
	private final CourierRepository couriers;
	private final CourierLinkRepository links;
	private final CompanyRepository companies;
	private final DeliveryRepository deliveries;
	private final PasswordEncoder encoder;

	public CourierService(UserRepository users, CourierRepository couriers, CourierLinkRepository links,
						  CompanyRepository companies, DeliveryRepository deliveries, PasswordEncoder encoder) {
		this.users = users;
		this.couriers = couriers;
		this.links = links;
		this.companies = companies;
		this.deliveries = deliveries;
		this.encoder = encoder;
	}

	// ---------------- cadastro ----------------

	@Transactional
	public User register(CourierRegisterRequest req) {
		User user = createUser(req.name(), req.email(), req.password(), req.phone());
		Courier courier = createCourier(user, req.cpf(), req.vehicleType(), req.vehiclePlate(), req.vehicleModel(), req.vehicleColor(), req.cnh());
		if (req.companyIds() != null) {
			for (UUID id : Set.copyOf(req.companyIds())) {
				Company company = companies.findById(id)
						.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Empresa não encontrada"));
				newLink(courier, company, CourierLinkStatus.CANDIDATURA);
			}
		}
		return user;
	}

	/** Empresa cadastra (ou convida) um entregador. */
	@Transactional
	public CompanyLinkResponse companyAdds(User companyUser, CompanyCourierRequest req) {
		Company company = companyOf(companyUser);
		User existing = users.findByEmailIgnoreCase(req.email()).orElse(null);
		if (existing != null) {
			Courier courier = couriers.findByUserId(existing.getId())
					.orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Este e-mail já pertence a uma conta que não é de entregador"));
			CourierLink link = links.findByCourierIdAndCompanyId(courier.getId(), company.getId()).orElse(null);
			if (link == null) return CompanyLinkResponse.of(newLink(courier, company, CourierLinkStatus.CONVITE));
			switch (link.getStatus()) {
				case ATIVO -> throw new ApiException(HttpStatus.CONFLICT, "Entregador já trabalha com você");
				case CONVITE -> throw new ApiException(HttpStatus.CONFLICT, "Convite já enviado");
				case CANDIDATURA -> link.setStatus(CourierLinkStatus.ATIVO); // ele já tinha pedido: convite vira aprovação
				default -> link.setStatus(CourierLinkStatus.CONVITE);
			}
			return CompanyLinkResponse.of(link);
		}
		if (blank(req.name()) || blank(req.password()) || blank(req.phone()) || blank(req.cpf()) || req.vehicleType() == null)
			throw new ApiException(HttpStatus.BAD_REQUEST, "Informe nome, senha, telefone, CPF e veículo do novo entregador");
		User user = createUser(req.name(), req.email(), req.password(), req.phone());
		Courier courier = createCourier(user, req.cpf(), req.vehicleType(), req.vehiclePlate(), req.vehicleModel(), req.vehicleColor(), req.cnh());
		return CompanyLinkResponse.of(newLink(courier, company, CourierLinkStatus.ATIVO)); // cadastrado pela empresa: já ativo
	}

	// ---------------- perfil ----------------

	@Transactional(readOnly = true)
	public CourierResponse profile(User user) {
		return CourierResponse.of(courierOf(user));
	}

	@Transactional
	public CourierResponse updateProfile(User principal, CourierProfileRequest req) {
		Courier c = courierOf(principal);
		User user = c.getUser();
		if (!c.getCpf().equals(req.cpf()) && couriers.existsByCpf(req.cpf()))
			throw new ApiException(HttpStatus.CONFLICT, "CPF já cadastrado");
		validateVehicle(req.vehicleType(), req.vehiclePlate(), req.cnh());
		user.setName(req.name().trim());
		user.setPhone(req.phone().trim());
		fill(c, req.cpf(), req.vehicleType(), req.vehiclePlate(), req.vehicleModel(), req.vehicleColor(), req.cnh());
		return CourierResponse.of(c);
	}

	// ---------------- lado do entregador ----------------

	@Transactional(readOnly = true)
	public List<CourierCompanyResponse> companiesFor(User user) {
		Courier c = courierOf(user);
		Map<UUID, CourierLink> byCompany = links.findByCourier(c.getId()).stream()
				.collect(Collectors.toMap(l -> l.getCompany().getId(), Function.identity()));
		return companies.findAll().stream().map(co -> {
			CourierLink l = byCompany.get(co.getId());
			return new CourierCompanyResponse(Dtos.CompanyResponse.of(co), l == null ? null : l.getId(), l == null ? null : l.getStatus());
		}).toList();
	}

	@Transactional
	public CourierCompanyResponse apply(User user, UUID companyId) {
		Courier c = courierOf(user);
		Company company = companies.findById(companyId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Empresa não encontrada"));
		CourierLink l = links.findByCourierIdAndCompanyId(c.getId(), companyId).orElse(null);
		if (l == null) l = newLink(c, company, CourierLinkStatus.CANDIDATURA);
		else switch (l.getStatus()) {
			case ATIVO -> throw new ApiException(HttpStatus.CONFLICT, "Você já trabalha com esta empresa");
			case CANDIDATURA -> throw new ApiException(HttpStatus.CONFLICT, "Candidatura já enviada");
			case CONVITE -> l.setStatus(CourierLinkStatus.ATIVO); // candidatar-se a quem já convidou = aceitar
			default -> l.setStatus(CourierLinkStatus.CANDIDATURA);
		}
		return new CourierCompanyResponse(Dtos.CompanyResponse.of(company), l.getId(), l.getStatus());
	}

	/** Aceita ou recusa um convite. */
	@Transactional
	public CourierCompanyResponse answerInvite(User user, UUID linkId, boolean accept) {
		CourierLink l = ownLink(user, linkId);
		if (l.getStatus() != CourierLinkStatus.CONVITE) throw new ApiException(HttpStatus.CONFLICT, "Não há convite pendente");
		l.setStatus(accept ? CourierLinkStatus.ATIVO : CourierLinkStatus.RECUSADO);
		return new CourierCompanyResponse(Dtos.CompanyResponse.of(l.getCompany()), l.getId(), l.getStatus());
	}

	/** Cancela a candidatura ou sai da empresa. Entregas em andamento precisam ser concluídas antes. */
	@Transactional
	public CourierCompanyResponse leave(User user, UUID linkId) {
		CourierLink l = ownLink(user, linkId);
		close(l);
		return new CourierCompanyResponse(Dtos.CompanyResponse.of(l.getCompany()), l.getId(), l.getStatus());
	}

	// ---------------- lado da empresa ----------------

	@Transactional(readOnly = true)
	public List<CompanyLinkResponse> companyLinks(User companyUser) {
		return links.findByCompany(companyOf(companyUser).getId()).stream().map(CompanyLinkResponse::of).toList();
	}

	@Transactional
	public CompanyLinkResponse decide(User companyUser, UUID linkId, boolean approve) {
		CourierLink l = companyLink(companyUser, linkId);
		if (l.getStatus() != CourierLinkStatus.CANDIDATURA) throw new ApiException(HttpStatus.CONFLICT, "Não há candidatura pendente");
		l.setStatus(approve ? CourierLinkStatus.ATIVO : CourierLinkStatus.RECUSADO);
		return CompanyLinkResponse.of(l);
	}

	@Transactional
	public CompanyLinkResponse end(User companyUser, UUID linkId) {
		CourierLink l = companyLink(companyUser, linkId);
		close(l);
		return CompanyLinkResponse.of(l);
	}

	// ---------------- util ----------------

	public Courier courierOf(User user) {
		return couriers.findByUserId(user.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuário sem cadastro de entregador"));
	}

	public Company companyOf(User user) {
		return companies.findByUserId(user.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuário sem empresa cadastrada"));
	}

	private void close(CourierLink l) {
		switch (l.getStatus()) {
			case ATIVO -> {
				boolean busy = deliveries.findByCourier(l.getCourier().getId()).stream().anyMatch(d ->
						d.getCompany() != null && d.getCompany().getId().equals(l.getCompany().getId())
								&& (d.getStatus() == DeliveryStatus.ACEITO || d.getStatus() == DeliveryStatus.EM_ROTA));
				if (busy) throw new ApiException(HttpStatus.CONFLICT, "Há entregas em andamento. Conclua, cancele ou reatribua antes de encerrar.");
				l.setStatus(CourierLinkStatus.ENCERRADO);
			}
			case CANDIDATURA, CONVITE -> l.setStatus(CourierLinkStatus.ENCERRADO);
			default -> throw new ApiException(HttpStatus.CONFLICT, "Vínculo já está encerrado");
		}
	}

	private CourierLink ownLink(User user, UUID linkId) {
		Courier c = courierOf(user);
		CourierLink l = links.findById(linkId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vínculo não encontrado"));
		if (!l.getCourier().getId().equals(c.getId())) throw new ApiException(HttpStatus.FORBIDDEN, "Vínculo de outro entregador");
		return l;
	}

	private CourierLink companyLink(User companyUser, UUID linkId) {
		Company co = companyOf(companyUser);
		CourierLink l = links.findById(linkId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vínculo não encontrado"));
		if (!l.getCompany().getId().equals(co.getId())) throw new ApiException(HttpStatus.FORBIDDEN, "Vínculo de outra empresa");
		return l;
	}

	private CourierLink newLink(Courier c, Company co, CourierLinkStatus status) {
		CourierLink l = new CourierLink();
		l.setCourier(c);
		l.setCompany(co);
		l.setStatus(status);
		return links.save(l);
	}

	private User createUser(String name, String email, String password, String phone) {
		if (users.existsByEmailIgnoreCase(email)) throw new ApiException(HttpStatus.CONFLICT, "E-mail já cadastrado");
		User u = new User();
		u.setName(name.trim());
		u.setEmail(email.toLowerCase());
		u.setPassword(encoder.encode(password));
		u.setRole(Role.ENTREGADOR);
		u.setPhone(phone == null || phone.isBlank() ? null : phone.trim());
		return users.save(u);
	}

	private Courier createCourier(User user, String cpf, VehicleType type, String plate, String model, String color, String cnh) {
		if (couriers.existsByCpf(cpf)) throw new ApiException(HttpStatus.CONFLICT, "CPF já cadastrado");
		validateVehicle(type, plate, cnh);
		Courier c = new Courier();
		c.setUser(user);
		fill(c, cpf, type, plate, model, color, cnh);
		return couriers.save(c);
	}

	private void fill(Courier c, String cpf, VehicleType type, String plate, String model, String color, String cnh) {
		c.setCpf(cpf);
		c.setVehicleType(type);
		c.setVehiclePlate(type.motorized() ? plate.trim().toUpperCase() : null);
		c.setVehicleModel(trim(model));
		c.setVehicleColor(trim(color));
		c.setCnh(type.motorized() ? cnh : null);
	}

	private void validateVehicle(VehicleType type, String plate, String cnh) {
		if (type.motorized() && (blank(plate) || blank(cnh)))
			throw new ApiException(HttpStatus.BAD_REQUEST, "Moto e carro exigem placa e CNH");
	}

	private static boolean blank(String s) { return s == null || s.isBlank(); }

	private static String trim(String s) { return blank(s) ? null : s.trim(); }
}
