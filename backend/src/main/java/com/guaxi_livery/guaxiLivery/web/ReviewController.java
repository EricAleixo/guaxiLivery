package com.guaxi_livery.guaxiLivery.web;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ReviewController {

	private final ReviewService service;

	public ReviewController(ReviewService service) {
		this.service = service;
	}

	@PostMapping("/api/reviews")
	@ResponseStatus(HttpStatus.CREATED)
	public ReviewResponse create(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody ReviewRequest request) {
		return service.create(me.user(), request);
	}

	/** Avaliações de todos os produtos da empresa logada. */
	@GetMapping("/api/reviews/company")
	public List<ReviewResponse> company(@AuthenticationPrincipal AppUserDetails me) {
		return service.forCompany(me.user());
	}

	/** Avaliações de um produto (qualquer usuário logado). */
	@GetMapping("/api/products/{id}/reviews")
	public ProductReviewsResponse forProduct(@PathVariable UUID id) {
		return service.forProduct(id);
	}
}
