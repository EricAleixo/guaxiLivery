package com.guaxi_livery.guaxiLivery.service;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.UserRepository;
import com.guaxi_livery.guaxiLivery.security.JwtService;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private final UserRepository users;
	private final CompanyRepository companies;
	private final PasswordEncoder encoder;
	private final AuthenticationManager authManager;
	private final JwtService jwt;
	private final CourierService courierService;

	public AuthService(UserRepository users, CompanyRepository companies, PasswordEncoder encoder,
					   AuthenticationManager authManager, JwtService jwt, CourierService courierService) {
		this.courierService = courierService;
		this.users = users;
		this.companies = companies;
		this.encoder = encoder;
		this.authManager = authManager;
		this.jwt = jwt;
	}

	@Transactional
	public AuthResponse registerClient(ClientRegisterRequest req) {
		User user = newUser(req.name(), req.email(), req.password(), Role.CLIENTE);
		return response(user);
	}

	@Transactional
	public AuthResponse registerCompany(CompanyRegisterRequest req) {
		if (companies.existsByCnpj(req.cnpj())) {
			throw new ApiException(HttpStatus.CONFLICT, "CNPJ já cadastrado");
		}
		User user = newUser(req.name(), req.email(), req.password(), Role.EMPRESA);
		Company company = new Company();
		company.setUser(user);
		company.setTradeName(req.tradeName());
		company.setCnpj(req.cnpj());
		company.setPhone(req.phone());
		company.setAddress(req.address());
		company.setDescription(req.description());
		companies.save(company);
		return response(user);
	}

	@Transactional
	public AuthResponse registerCourier(com.guaxi_livery.guaxiLivery.dto.CourierDtos.CourierRegisterRequest req) {
		return response(courierService.register(req));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest req) {
		try {
			authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
		} catch (AuthenticationException e) {
			throw new BadCredentialsException("Credenciais inválidas");
		}
		User user = users.findByEmailIgnoreCase(req.email()).orElseThrow();
		return response(user);
	}

	@Transactional(readOnly = true)
	public UserResponse toResponse(User user) {
		return userResponse(user);
	}

	private UserResponse userResponse(User user) {
		Company company = user.getRole() == Role.EMPRESA ? companies.findByUserId(user.getId()).orElse(null) : null;
		String avatar = company != null ? company.getLogoFilename() : user.getAvatarFilename();
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(),
				company == null ? null : company.getId(), avatar == null || avatar.isBlank() ? null : "/api/uploads/" + avatar);
	}

	private User newUser(String name, String email, String rawPassword, Role role) {
		if (users.existsByEmailIgnoreCase(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "E-mail já cadastrado");
		}
		User user = new User();
		user.setName(name);
		user.setEmail(email.toLowerCase());
		user.setPassword(encoder.encode(rawPassword));
		user.setRole(role);
		return users.save(user);
	}

	private AuthResponse response(User user) {
		return new AuthResponse(jwt.generate(user.getEmail()), userResponse(user));
	}
}
