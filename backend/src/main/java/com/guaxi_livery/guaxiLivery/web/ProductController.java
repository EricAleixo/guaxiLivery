package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Cardápio da empresa logada (somente EMPRESA, ver SecurityConfig). */
@RestController
@RequestMapping("/api/products")
public class ProductController {

	private final ProductService service;

	public ProductController(ProductService service) {
		this.service = service;
	}

	/** Feed de produtos disponíveis de todas as empresas (somente CLIENTE). */
	@GetMapping("/feed")
	public List<FeedItemResponse> feed() {
		return service.feed();
	}

	@GetMapping("/mine")
	public List<ProductResponse> mine(@AuthenticationPrincipal AppUserDetails me) {
		return service.mine(me.user());
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public ProductResponse create(@AuthenticationPrincipal AppUserDetails me,
								  @Valid @ModelAttribute ProductRequest request,
								  @RequestPart(value = "media", required = false) List<MultipartFile> media) {
		return service.create(me.user(), request, media);
	}

	@PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ProductResponse update(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
								  @Valid @ModelAttribute ProductRequest request,
								  @RequestPart(value = "media", required = false) List<MultipartFile> media,
								  @RequestParam(value = "removeMedia", required = false) List<Long> removeMedia) {
		return service.update(me.user(), id, request, media, removeMedia);
	}

	@PatchMapping("/{id}/availability")
	public ProductResponse availability(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
										@Valid @RequestBody AvailabilityRequest body) {
		return service.setAvailable(me.user(), id, body.available());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id) {
		service.delete(me.user(), id);
	}
}
