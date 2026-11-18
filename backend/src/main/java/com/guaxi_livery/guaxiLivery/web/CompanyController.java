package com.guaxi_livery.guaxiLivery.web;

import com.guaxi_livery.guaxiLivery.dto.Dtos.CompanyResponse;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

	private final CompanyRepository companies;

	public CompanyController(CompanyRepository companies) {
		this.companies = companies;
	}

	@GetMapping
	public List<CompanyResponse> list() {
		return companies.findAll().stream().map(CompanyResponse::of).toList();
	}
}
