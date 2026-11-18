package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.security.AppUserDetails;
import com.guaxi_livery.guaxiLivery.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

	private final ProfileService service;

	public ProfileController(ProfileService service) {
		this.service = service;
	}

	@GetMapping
	public ProfileResponse get(@AuthenticationPrincipal AppUserDetails me) {
		return service.get(me.user());
	}

	@PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ProfileResponse update(@AuthenticationPrincipal AppUserDetails me,
								  @Valid @ModelAttribute ProfileRequest request,
								  @RequestPart(value = "image", required = false) MultipartFile image) {
		return service.update(me.user(), request, image);
	}
}
