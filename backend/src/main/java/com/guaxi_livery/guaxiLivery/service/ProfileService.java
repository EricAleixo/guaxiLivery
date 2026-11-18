package com.guaxi_livery.guaxiLivery.service;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.UserRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProfileService {

	private final UserRepository users;
	private final CompanyRepository companies;
	private final FileStorageService storage;

	public ProfileService(UserRepository users, CompanyRepository companies, FileStorageService storage) {
		this.users = users;
		this.companies = companies;
		this.storage = storage;
	}

	@Transactional(readOnly = true)
	public ProfileResponse get(User principal) {
		User user = users.findById(principal.getId()).orElseThrow();
		return build(user, company(user));
	}

	@Transactional
	public ProfileResponse update(User principal, ProfileRequest req, MultipartFile image) {
		User user = users.findById(principal.getId()).orElseThrow();
		Company company = company(user);
		user.setName(req.name().trim());
		String filename = image != null && !image.isEmpty() ? storage.storeImage(image) : null;
		if (company == null) {
			user.setPhone(blankToNull(req.phone()));
			user.setAddress(blankToNull(req.address()));
			if (filename != null) user.setAvatarFilename(filename);
		} else {
			if (req.tradeName() == null || req.tradeName().isBlank()) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o nome fantasia");
			}
			company.setTradeName(req.tradeName().trim());
			company.setPhone(blankToNull(req.phone()));
			company.setAddress(blankToNull(req.address()));
			company.setDescription(blankToNull(req.description()));
			if (filename != null) company.setLogoFilename(filename);
		}
		return build(user, company);
	}

	private Company company(User user) {
		return user.getRole() == Role.EMPRESA ? companies.findByUserId(user.getId()).orElse(null) : null;
	}

	private static String blankToNull(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	private static String url(String filename) {
		return filename == null || filename.isBlank() ? null : "/api/uploads/" + filename;
	}

	private ProfileResponse build(User u, Company c) {
		return c == null
				? new ProfileResponse(u.getName(), u.getEmail(), u.getRole(), url(u.getAvatarFilename()), u.getPhone(),
						u.getAddress(), null, null, null)
				: new ProfileResponse(u.getName(), u.getEmail(), u.getRole(), url(c.getLogoFilename()), c.getPhone(),
						c.getAddress(), c.getTradeName(), c.getCnpj(), c.getDescription());
	}
}
