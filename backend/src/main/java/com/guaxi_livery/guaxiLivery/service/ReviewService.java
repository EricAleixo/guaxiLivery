package com.guaxi_livery.guaxiLivery.service;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.DeliveryRepository;
import com.guaxi_livery.guaxiLivery.repository.ReviewRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

	private final ReviewRepository reviews;
	private final DeliveryRepository deliveries;
	private final CompanyRepository companies;

	public ReviewService(ReviewRepository reviews, DeliveryRepository deliveries, CompanyRepository companies) {
		this.reviews = reviews;
		this.deliveries = deliveries;
		this.companies = companies;
	}

	@Transactional
	public ReviewResponse create(User client, ReviewRequest req) {
		Delivery d = deliveries.findById(req.deliveryId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado"));
		if (!d.getClient().getId().equals(client.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Esse pedido não é seu");
		}
		if (d.getStatus() != DeliveryStatus.ENTREGUE) {
			throw new ApiException(HttpStatus.CONFLICT, "Só dá para avaliar depois que o pedido for entregue");
		}
		if (d.getProduct() == null) {
			throw new ApiException(HttpStatus.CONFLICT, "Esse pedido não tem produto para avaliar");
		}
		if (reviews.existsByDeliveryId(d.getId())) {
			throw new ApiException(HttpStatus.CONFLICT, "Você já avaliou esse pedido");
		}
		Review r = new Review();
		r.setDelivery(d);
		r.setProduct(d.getProduct());
		r.setClient(client);
		r.setRating(req.rating());
		String comment = req.comment() == null ? "" : req.comment().trim();
		r.setComment(comment.isEmpty() ? null : comment);
		return ReviewResponse.of(reviews.save(r));
	}

	@Transactional(readOnly = true)
	public ProductReviewsResponse forProduct(UUID productId) {
		List<ReviewResponse> list = reviews.findByProduct(productId).stream().map(ReviewResponse::of).toList();
		Double avg = list.isEmpty() ? null : list.stream().mapToInt(ReviewResponse::rating).average().orElse(0);
		return new ProductReviewsResponse(avg, list.size(), list);
	}

	@Transactional(readOnly = true)
	public List<ReviewResponse> forCompany(User companyUser) {
		Company company = companies.findByUserId(companyUser.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Conta sem empresa"));
		return reviews.findByCompany(company.getId()).stream().map(ReviewResponse::of).toList();
	}
}
