package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.CourierLink;
import com.guaxi_livery.guaxiLivery.domain.CourierLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourierLinkRepository extends JpaRepository<CourierLink, UUID> {

	Optional<CourierLink> findByCourierIdAndCompanyId(UUID courierId, UUID companyId);

	@Query("select l from CourierLink l join fetch l.company where l.courier.id = :courierId order by l.updatedAt desc")
	List<CourierLink> findByCourier(UUID courierId);

	@Query("select l from CourierLink l join fetch l.courier c join fetch c.user where l.company.id = :companyId order by l.updatedAt desc")
	List<CourierLink> findByCompany(UUID companyId);

	@Query("select l.company.id from CourierLink l where l.courier.id = :courierId and l.status = :status")
	List<UUID> companyIdsOf(UUID courierId, CourierLinkStatus status);

	boolean existsByCourierIdAndCompanyIdAndStatus(UUID courierId, UUID companyId, CourierLinkStatus status);
}
