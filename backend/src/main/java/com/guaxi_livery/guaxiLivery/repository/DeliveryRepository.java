package com.guaxi_livery.guaxiLivery.repository;

import com.guaxi_livery.guaxiLivery.domain.Delivery;
import com.guaxi_livery.guaxiLivery.domain.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

	@Query("select d from Delivery d join fetch d.client left join fetch d.company where d.client.id = :clientId order by d.createdAt desc")
	List<Delivery> findByClient(Long clientId);

	/** Pedidos sem empresa (abertos a todas) ou destinados a / aceitos por esta empresa. */
	@Query("""
			select d from Delivery d join fetch d.client left join fetch d.company c
			where (c is null and d.status = :pending) or c.id = :companyId
			order by d.createdAt desc
			""")
	List<Delivery> findForCompany(Long companyId, DeliveryStatus pending);
}
