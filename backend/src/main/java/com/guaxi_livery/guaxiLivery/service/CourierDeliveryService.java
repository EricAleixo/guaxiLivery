package com.guaxi_livery.guaxiLivery.service;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.DeliveryResponse;
import com.guaxi_livery.guaxiLivery.repository.CourierLinkRepository;
import com.guaxi_livery.guaxiLivery.repository.DeliveryRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Entregas do ponto de vista do entregador: só enxerga pedidos das empresas em que tem vínculo ATIVO.
 * Fluxo: empresa aceita (ACEITO) → entregador pega (ou a empresa atribui) → EM_ROTA → ENTREGUE.
 */
@Service
public class CourierDeliveryService {

	private final DeliveryRepository deliveries;
	private final CourierLinkRepository links;
	private final CourierService couriers;

	public CourierDeliveryService(DeliveryRepository deliveries, CourierLinkRepository links, CourierService couriers) {
		this.deliveries = deliveries;
		this.links = links;
		this.couriers = couriers;
	}

	@Transactional(readOnly = true)
	public List<DeliveryResponse> available(User user) {
		Courier c = couriers.courierOf(user);
		List<UUID> companyIds = links.companyIdsOf(c.getId(), CourierLinkStatus.ATIVO);
		if (companyIds.isEmpty()) return List.of();
		return deliveries.findUnassigned(companyIds, DeliveryStatus.ACEITO).stream().map(DeliveryResponse::of).toList();
	}

	@Transactional(readOnly = true)
	public List<DeliveryResponse> mine(User user) {
		return deliveries.findByCourier(couriers.courierOf(user).getId()).stream().map(DeliveryResponse::of).toList();
	}

	@Transactional
	public DeliveryResponse claim(User user, UUID id) {
		Courier c = couriers.courierOf(user);
		Delivery d = lock(id);
		if (d.getCompany() == null || !links.existsByCourierIdAndCompanyIdAndStatus(c.getId(), d.getCompany().getId(), CourierLinkStatus.ATIVO))
			throw new ApiException(HttpStatus.FORBIDDEN, "Você não trabalha com a empresa deste pedido");
		if (d.getStatus() != DeliveryStatus.ACEITO) throw new ApiException(HttpStatus.CONFLICT, "Este pedido não está disponível para entrega");
		if (d.getCourier() != null) throw new ApiException(HttpStatus.CONFLICT, "Outro entregador já pegou este pedido");
		d.setCourier(c);
		return DeliveryResponse.of(d);
	}

	/** Desiste de um pedido que ainda não saiu para entrega. */
	@Transactional
	public DeliveryResponse release(User user, UUID id) {
		Delivery d = own(user, id);
		if (d.getStatus() != DeliveryStatus.ACEITO) throw new ApiException(HttpStatus.CONFLICT, "Só dá para desistir antes de sair para entrega");
		d.setCourier(null);
		return DeliveryResponse.of(d);
	}

	@Transactional
	public DeliveryResponse updateStatus(User user, UUID id, DeliveryStatus next) {
		Delivery d = own(user, id);
		boolean ok = (d.getStatus() == DeliveryStatus.ACEITO && next == DeliveryStatus.EM_ROTA)
				|| (d.getStatus() == DeliveryStatus.EM_ROTA && next == DeliveryStatus.ENTREGUE);
		if (!ok) throw new ApiException(HttpStatus.CONFLICT, "Não é possível ir de " + d.getStatus() + " para " + next);
		d.setStatus(next);
		if (next == DeliveryStatus.ENTREGUE) d.setDeliveredAt(Instant.now()); // alimenta o faturamento
		return DeliveryResponse.of(d);
	}

	/** Empresa atribui (ou remove, courierId null) o entregador de um pedido em andamento. */
	@Transactional
	public DeliveryResponse assign(User companyUser, UUID id, UUID courierId) {
		Company company = couriers.companyOf(companyUser);
		Delivery d = lock(id);
		if (d.getCompany() == null || !d.getCompany().getId().equals(company.getId()))
			throw new ApiException(HttpStatus.FORBIDDEN, "Pedido pertence a outra empresa");
		if (d.getStatus() != DeliveryStatus.ACEITO && d.getStatus() != DeliveryStatus.EM_ROTA)
			throw new ApiException(HttpStatus.CONFLICT, "Só é possível atribuir entregador a pedidos aceitos ou em rota");
		if (courierId == null) {
			d.setCourier(null);
		} else {
			CourierLink l = links.findByCourierIdAndCompanyId(courierId, company.getId())
					.filter(x -> x.getStatus() == CourierLinkStatus.ATIVO)
					.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Entregador sem vínculo ativo com sua empresa"));
			d.setCourier(l.getCourier());
		}
		return DeliveryResponse.of(d);
	}

	private Delivery own(User user, UUID id) {
		Courier c = couriers.courierOf(user);
		Delivery d = lock(id);
		if (d.getCourier() == null || !d.getCourier().getId().equals(c.getId()))
			throw new ApiException(HttpStatus.FORBIDDEN, "Este pedido não é seu");
		return d;
	}

	private Delivery lock(UUID id) {
		return deliveries.findForUpdate(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
	}
}
