package com.guaxi_livery.guaxiLivery.service;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.DeliveryRepository;
import com.guaxi_livery.guaxiLivery.repository.ProductRepository;
import com.guaxi_livery.guaxiLivery.repository.ReviewRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DeliveryService {

	/** Transições permitidas para a empresa. */
	private static final Map<DeliveryStatus, Set<DeliveryStatus>> TRANSITIONS = Map.of(
			DeliveryStatus.PENDENTE, Set.of(DeliveryStatus.ACEITO, DeliveryStatus.CANCELADO),
			DeliveryStatus.ACEITO, Set.of(DeliveryStatus.EM_ROTA, DeliveryStatus.CANCELADO),
			DeliveryStatus.EM_ROTA, Set.of(DeliveryStatus.ENTREGUE, DeliveryStatus.CANCELADO));

	private final DeliveryRepository deliveries;
	private final CompanyRepository companies;
	private final FileStorageService storage;
	private final ProductRepository products;
	private final ReviewRepository reviews;

	public DeliveryService(DeliveryRepository deliveries, CompanyRepository companies, FileStorageService storage,
						   ProductRepository products, ReviewRepository reviews) {
		this.reviews = reviews;
		this.products = products;
		this.deliveries = deliveries;
		this.companies = companies;
		this.storage = storage;
	}

	@Transactional
	public DeliveryResponse create(User client, DeliveryRequest req, MultipartFile image) {
		Company company = null;
		if (req.companyId() != null) {
			company = companies.findById(req.companyId())
					.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Empresa não encontrada"));
		}
		Delivery d = new Delivery();
		d.setClient(client);
		d.setCompany(company);
		d.setFoodName(req.foodName());
		d.setDescription(req.description());
		d.setQuantity(req.quantity());
		d.setPickupAddress(req.pickupAddress());
		d.setDeliveryAddress(req.deliveryAddress());
		d.setImageFilename(storage.storeImage(image));
		return DeliveryResponse.of(deliveries.save(d));
	}

	@Transactional
	public DeliveryResponse order(User client, OrderRequest req) {
		Product p = products.findById(req.productId())
				.filter(Product::isAvailable)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto indisponível"));
		Company company = p.getCompany();
		Delivery d = new Delivery();
		d.setClient(client);
		d.setCompany(company);
		d.setProduct(p);
		d.setFoodName(p.getName());
		d.setDescription(req.description());
		d.setQuantity(req.quantity());
		d.setPickupAddress(company.getAddress() == null || company.getAddress().isBlank()
				? company.getTradeName() : company.getAddress());
		d.setDeliveryAddress(req.deliveryAddress());
		// Congela o valor do pedido: alterações futuras no preço do produto não mudam o histórico financeiro.
		d.setUnitPrice(p.getPrice());
		d.setItemsSubtotal(p.getPrice().multiply(BigDecimal.valueOf(req.quantity())));
		d.setDeliveryFee(BigDecimal.ZERO);
		d.setDiscount(BigDecimal.ZERO);
		d.setPaymentFee(BigDecimal.ZERO);
		d.setImageFilename(p.getMedia().stream().filter(m -> m.getType() == MediaType.IMAGE)
				.map(ProductMedia::getFilename).findFirst()
				.orElse(p.getImageFilename() == null ? "" : p.getImageFilename()));
		return DeliveryResponse.of(deliveries.save(d));
	}

	@Transactional(readOnly = true)
	public List<DeliveryResponse> mine(User client) {
		Set<UUID> reviewed = new HashSet<>(reviews.reviewedDeliveryIds(client.getId()));
		return deliveries.findByClient(client.getId()).stream()
				.map(d -> DeliveryResponse.of(d, reviewed.contains(d.getId()))).toList();
	}

	@Transactional(readOnly = true)
	public List<DeliveryResponse> available(User companyUser) {
		Company company = companyOf(companyUser);
		return deliveries.findForCompany(company.getId(), DeliveryStatus.PENDENTE).stream()
				.map(DeliveryResponse::of).toList();
	}

	@Transactional
	public DeliveryResponse updateStatus(User companyUser, UUID id, DeliveryStatus next) {
		Company company = companyOf(companyUser);
		Delivery d = deliveries.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
		if (d.getCompany() != null && !d.getCompany().getId().equals(company.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Pedido pertence a outra empresa");
		}
		if (!TRANSITIONS.getOrDefault(d.getStatus(), Set.of()).contains(next)) {
			throw new ApiException(HttpStatus.CONFLICT, "Não é possível ir de " + d.getStatus() + " para " + next);
		}
		if (d.getCompany() == null) {
			d.setCompany(company); // a empresa que aceita o pedido aberto assume ele
		}
		d.setStatus(next);
		if (next == DeliveryStatus.ENTREGUE) d.setDeliveredAt(Instant.now());
		if (next == DeliveryStatus.CANCELADO) d.setCanceledAt(Instant.now());
		return DeliveryResponse.of(d);
	}

	private Company companyOf(User user) {
		return companies.findByUserId(user.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Usuário sem empresa cadastrada"));
	}
}
