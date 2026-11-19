package com.guaxi_livery.guaxiLivery.web;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.dto.CourierDtos.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.DeliveryResponse;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.CourierDeliveryService;
import com.guaxi_livery.guaxiLivery.service.CourierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Entregadores da empresa (somente EMPRESA, ver SecurityConfig). */
@RestController
@RequestMapping("/api/company")
public class CompanyCourierController {

	private final CourierService couriers;
	private final CourierDeliveryService deliveries;

	public CompanyCourierController(CourierService couriers, CourierDeliveryService deliveries) {
		this.couriers = couriers;
		this.deliveries = deliveries;
	}

	@GetMapping("/couriers")
	public List<CompanyLinkResponse> list(@AuthenticationPrincipal AppUserDetails me) { return couriers.companyLinks(me.user()); }

	@PostMapping("/couriers")
	@ResponseStatus(HttpStatus.CREATED)
	public CompanyLinkResponse add(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody CompanyCourierRequest body) {
		return couriers.companyAdds(me.user(), body);
	}

	@PostMapping("/couriers/{linkId}/approve")
	public CompanyLinkResponse approve(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID linkId) {
		return couriers.decide(me.user(), linkId, true);
	}

	@PostMapping("/couriers/{linkId}/reject")
	public CompanyLinkResponse reject(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID linkId) {
		return couriers.decide(me.user(), linkId, false);
	}

	@DeleteMapping("/couriers/{linkId}")
	public CompanyLinkResponse end(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID linkId) {
		return couriers.end(me.user(), linkId);
	}

	@PutMapping("/deliveries/{id}/courier")
	public DeliveryResponse assign(@AuthenticationPrincipal AppUserDetails me, @PathVariable UUID id, @RequestBody AssignCourierRequest body) {
		return deliveries.assign(me.user(), id, body.courierId());
	}
}
