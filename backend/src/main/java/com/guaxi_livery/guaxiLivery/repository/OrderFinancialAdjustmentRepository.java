package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.OrderFinancialAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface OrderFinancialAdjustmentRepository extends JpaRepository<OrderFinancialAdjustment, UUID> {

	@Query("select a from OrderFinancialAdjustment a join fetch a.changedBy where a.delivery.id = :deliveryId order by a.createdAt desc")
	List<OrderFinancialAdjustment> findByDelivery(UUID deliveryId);

	@Query("select distinct a.delivery.id from OrderFinancialAdjustment a where a.delivery.id in :ids")
	List<UUID> adjustedAmong(Collection<UUID> ids);
}
