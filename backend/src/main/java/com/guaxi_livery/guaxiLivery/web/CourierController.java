package com.guaxi_livery.guaxiLivery.web;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.dto.CourierDtos.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.DeliveryResponse;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.CourierDeliveryService;
import com.guaxi_livery.guaxiLivery.service.CourierService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Área do entregador (somente ENTREGADOR, ver SecurityConfig). */
@RestController
@RequestMapping("/api/courier")
public class CourierController {

	private final CourierService couriers;
	private final CourierDeliveryService deliveries;

	public CourierController(CourierService couriers, CourierDeliveryService deliveries) {
		this.couriers = couriers;
		this.deliveries = deliveries;
	}

	@GetMapping("/profile")
	public CourierResponse profile(@AuthenticationPrincipal AppUserDetails me) { return couriers.profile(me.user()); }

	@PutMapping("/profile")
	public CourierResponse updateProfile(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody CourierProfileRequest body) {
		return couriers.updateProfile(me.user(), body);
	}

	@GetMapping("/companies")
	public List<CourierCompanyResponse> companies(@AuthenticationPrincipal AppUserDetails me) { return couriers.companiesFor(me.user()); }

	@PostMapping("/companies/{companyId}/apply")
	public CourierCompanyResponse apply(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID companyId) {
		return couriers.apply(me.user(), companyId);
	}

	@PostMapping("/links/{id}/accept")
	public CourierCompanyResponse accept(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) {
		return couriers.answerInvite(me.user(), id, true);
	}

	@PostMapping("/links/{id}/decline")
	public CourierCompanyResponse decline(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) {
		return couriers.answerInvite(me.user(), id, false);
	}

	@DeleteMapping("/links/{id}")
	public CourierCompanyResponse leave(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) {
		return couriers.leave(me.user(), id);
	}

	@GetMapping("/deliveries/available")
	public List<DeliveryResponse> available(@AuthenticationPrincipal AppUserDetails me) { return deliveries.available(me.user()); }

	@GetMapping("/deliveries/mine")
	public List<DeliveryResponse> mine(@AuthenticationPrincipal AppUserDetails me) { return deliveries.mine(me.user()); }

	@PostMapping("/deliveries/{id}/claim")
	public DeliveryResponse claim(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) { return deliveries.claim(me.user(), id); }

	@PostMapping("/deliveries/{id}/release")
	public DeliveryResponse release(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id) { return deliveries.release(me.user(), id); }

	@PatchMapping("/deliveries/{id}/status")
	public DeliveryResponse status(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id, @Valid @RequestBody CourierStatusRequest body) {
		return deliveries.updateStatus(me.user(), id, body.status());
	}
}
