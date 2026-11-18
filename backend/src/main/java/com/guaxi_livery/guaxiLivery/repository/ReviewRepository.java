package com.guaxi_livery.guaxiLivery.repository;

import com.guaxi_livery.guaxiLivery.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByDeliveryId(Long deliveryId);

	@Query("select r from Review r join fetch r.client join fetch r.product where r.product.id = :productId order by r.createdAt desc")
	List<Review> findByProduct(Long productId);

	@Query("select r from Review r join fetch r.client join fetch r.product p where p.company.id = :companyId order by r.createdAt desc")
	List<Review> findByCompany(Long companyId);

	/** [productId, média, quantidade] por produto. */
	@Query("select r.product.id, avg(r.rating), count(r) from Review r group by r.product.id")
	List<Object[]> stats();

	@Query("select r.delivery.id from Review r where r.client.id = :clientId")
	List<Long> reviewedDeliveryIds(Long clientId);
}
