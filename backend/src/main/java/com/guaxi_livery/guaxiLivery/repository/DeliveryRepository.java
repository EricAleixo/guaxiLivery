package com.guaxi_livery.guaxiLivery.repository;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.Delivery;
import com.guaxi_livery.guaxiLivery.domain.DeliveryStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

	@Query("select d from Delivery d join fetch d.client left join fetch d.company where d.client.id = :clientId order by d.createdAt desc")
	List<Delivery> findByClient(UUID clientId);

	/** Pedidos sem empresa (abertos a todas) ou destinados a / aceitos por esta empresa. */
	@Query("""
			select d from Delivery d join fetch d.client left join fetch d.company c
			where (c is null and d.status = :pending) or c.id = :companyId
			order by d.createdAt desc
			""")
	List<Delivery> findForCompany(UUID companyId, DeliveryStatus pending);

	/**
	 * Pedidos finalizados da empresa no intervalo [start, end), pela data de finalização.
	 * Pedidos entregues antes do módulo financeiro não têm deliveredAt: usa a data de criação.
	 */
	@Query("""
			select d from Delivery d join fetch d.client
			where d.company.id = :companyId and d.status = :status
			and coalesce(d.deliveredAt, d.createdAt) >= :start and coalesce(d.deliveredAt, d.createdAt) < :end
			order by coalesce(d.deliveredAt, d.createdAt) desc
			""")
	List<Delivery> findFinalized(UUID companyId, DeliveryStatus status, Instant start, Instant end);

	@Query("""
			select count(d) from Delivery d
			where d.company.id = :companyId and d.status = :status
			and coalesce(d.canceledAt, d.createdAt) >= :start and coalesce(d.canceledAt, d.createdAt) < :end
			""")
	long countCanceled(UUID companyId, DeliveryStatus status, Instant start, Instant end);

	@Query("select d from Delivery d join fetch d.client where d.id = :id and d.company.id = :companyId")
	Optional<Delivery> findOwned(UUID id, UUID companyId);

	/** Pedidos aceitos, sem entregador, das empresas em que o entregador trabalha. */
	@Query("""
			select d from Delivery d join fetch d.client
			where d.company.id in :companyIds and d.status = :status and d.courier is null
			order by d.createdAt
			""")
	List<Delivery> findUnassigned(List<UUID> companyIds, DeliveryStatus status);

	@Query("select d from Delivery d join fetch d.client where d.courier.id = :courierId order by d.createdAt desc")
	List<Delivery> findByCourier(UUID courierId);

	/** Trava a linha: dois entregadores não pegam o mesmo pedido. */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select d from Delivery d where d.id = :id")
	Optional<Delivery> findForUpdate(UUID id);

	// Usados pelo chat (a service é transacional, então o acesso lazy é seguro).
	List<Delivery> findTop50ByClientIdOrderByCreatedAtDesc(UUID clientId);

	List<Delivery> findTop50ByCompanyIdOrderByCreatedAtDesc(UUID companyId);

	List<Delivery> findTop50ByCourierIdOrderByCreatedAtDesc(UUID courierId);

	/** Pedidos entre duas pessoas via empresa (qualquer direção), do mais novo para o mais antigo. */
	@Query("""
			select d from Delivery d join fetch d.client
			where (d.client.id = :a and d.company.user.id = :b) or (d.client.id = :b and d.company.user.id = :a)
			order by d.createdAt desc
			""")
	List<Delivery> pairCompany(UUID a, UUID b);

	/** Pedidos entre duas pessoas via entregador (qualquer direção), do mais novo para o mais antigo. */
	@Query("""
			select d from Delivery d join fetch d.client
			where (d.client.id = :a and d.courier.user.id = :b) or (d.client.id = :b and d.courier.user.id = :a)
			order by d.createdAt desc
			""")
	List<Delivery> pairCourier(UUID a, UUID b);
}
