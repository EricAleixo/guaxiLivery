package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, UUID> {
	List<Product> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);

	@Query("select p from Product p join fetch p.company where p.available = true order by p.createdAt desc")
	List<Product> findFeed();

	Optional<Product> findByIdAndCompanyId(UUID id, UUID companyId);
}
