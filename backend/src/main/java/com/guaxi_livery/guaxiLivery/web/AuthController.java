package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService auth;

	public AuthController(AuthService auth) {
		this.auth = auth;
	}

	@PostMapping("/register/client")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse registerClient(@Valid @RequestBody ClientRegisterRequest req) {
		return auth.registerClient(req);
	}

	@PostMapping("/register/company")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse registerCompany(@Valid @RequestBody CompanyRegisterRequest req) {
		return auth.registerCompany(req);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest req) {
		return auth.login(req);
	}

	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
		if (principal == null) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Não autenticado");
		}
		return auth.toResponse(principal.user());
	}
}
