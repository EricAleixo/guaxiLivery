package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

	private final DeliveryService service;

	public DeliveryController(DeliveryService service) {
		this.service = service;
	}

	/** Cliente solicita entrega de comida: multipart com campos + arquivo "image". */
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public DeliveryResponse create(@AuthenticationPrincipal AppUserDetails me,
								   @Valid @ModelAttribute DeliveryRequest request,
								   @RequestPart("image") MultipartFile image) {
		return service.create(me.user(), request, image);
	}

	/** Cliente pede um produto do feed. */
	@PostMapping("/order")
	@ResponseStatus(HttpStatus.CREATED)
	public DeliveryResponse order(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody OrderRequest request) {
		return service.order(me.user(), request);
	}

	@GetMapping("/mine")
	public List<DeliveryResponse> mine(@AuthenticationPrincipal AppUserDetails me) {
		return service.mine(me.user());
	}

	@GetMapping("/available")
	public List<DeliveryResponse> available(@AuthenticationPrincipal AppUserDetails me) {
		return service.available(me.user());
	}

	@PatchMapping("/{id}/status")
	public DeliveryResponse updateStatus(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
										 @Valid @RequestBody StatusUpdateRequest body) {
		return service.updateStatus(me.user(), id, body.status());
	}
}
