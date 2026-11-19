package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
	Optional<Company> findByUserId(UUID userId);

	boolean existsByCnpj(String cnpj);
}
