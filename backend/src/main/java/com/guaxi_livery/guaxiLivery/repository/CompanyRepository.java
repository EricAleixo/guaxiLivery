package com.guaxi_livery.guaxiLivery.repository;

import com.guaxi_livery.guaxiLivery.domain.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
	Optional<Company> findByUserId(Long userId);

	boolean existsByCnpj(String cnpj);
}
