package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

	boolean existsByDeliveryId(UUID deliveryId);

	@Query("select r from Review r join fetch r.client join fetch r.product where r.product.id = :productId order by r.createdAt desc")
	List<Review> findByProduct(UUID productId);

	@Query("select r from Review r join fetch r.client join fetch r.product p where p.company.id = :companyId order by r.createdAt desc")
	List<Review> findByCompany(UUID companyId);

	/** [productId, média, quantidade] por produto. */
	@Query("select r.product.id, avg(r.rating), count(r) from Review r group by r.product.id")
	List<Object[]> stats();

	@Query("select r.delivery.id from Review r where r.client.id = :clientId")
	List<UUID> reviewedDeliveryIds(UUID clientId);
}
