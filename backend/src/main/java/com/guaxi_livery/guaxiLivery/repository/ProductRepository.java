package com.guaxi_livery.guaxiLivery.repository;

import com.guaxi_livery.guaxiLivery.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
	List<Product> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

	@Query("select p from Product p join fetch p.company where p.available = true order by p.createdAt desc")
	List<Product> findFeed();

	Optional<Product> findByIdAndCompanyId(Long id, Long companyId);
}
