package com.guaxi_livery.guaxiLivery.service;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import com.guaxi_livery.guaxiLivery.dto.Dtos.*;
import com.guaxi_livery.guaxiLivery.repository.CompanyRepository;
import com.guaxi_livery.guaxiLivery.repository.ProductRepository;
import com.guaxi_livery.guaxiLivery.repository.ReviewRepository;
import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

	private static final int MAX_MEDIA = 10;

	private final ProductRepository products;
	private final CompanyRepository companies;
	private final FileStorageService storage;
	private final ReviewRepository reviews;

	public ProductService(ProductRepository products, CompanyRepository companies, FileStorageService storage,
						  ReviewRepository reviews) {
		this.reviews = reviews;
		this.products = products;
		this.companies = companies;
		this.storage = storage;
	}

	private Company companyOf(User user) {
		return companies.findByUserId(user.getId())
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Conta sem empresa"));
	}

	private Product owned(User user, UUID id) {
		return products.findByIdAndCompanyId(id, companyOf(user).getId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> mine(User user) {
		return products.findByCompanyIdOrderByCreatedAtDesc(companyOf(user).getId())
				.stream().map(ProductResponse::of).toList();
	}

	@Transactional(readOnly = true)
	public List<FeedItemResponse> feed() {
		Map<UUID, Object[]> stats = new HashMap<>();
		for (Object[] row : reviews.stats()) stats.put((UUID) row[0], row);
		return products.findFeed().stream().map(p -> {
			Object[] s = stats.get(p.getId());
			return FeedItemResponse.of(p, s == null ? null : ((Number) s[1]).doubleValue(), s == null ? 0 : (Long) s[2]);
		}).toList();
	}

	@Transactional
	public ProductResponse create(User user, ProductRequest req, List<MultipartFile> media) {
		Product p = new Product();
		p.setCompany(companyOf(user));
		apply(p, req);
		addMedia(p, media);
		return ProductResponse.of(products.save(p));
	}

	@Transactional
	public ProductResponse update(User user, UUID id, ProductRequest req,
								  List<MultipartFile> media, List<UUID> removeMedia) {
		Product p = owned(user, id);
		apply(p, req);
		if (removeMedia != null && !removeMedia.isEmpty()) {
			p.getMedia().removeIf(m -> {
				boolean remove = removeMedia.contains(m.getId());
				if (remove) storage.delete(m.getFilename());
				return remove;
			});
		}
		addMedia(p, media);
		return ProductResponse.of(p);
	}

	@Transactional
	public ProductResponse setAvailable(User user, UUID id, boolean available) {
		Product p = owned(user, id);
		p.setAvailable(available);
		return ProductResponse.of(p);
	}

	@Transactional
	public void delete(User user, UUID id) {
		products.delete(owned(user, id));
	}

	private void addMedia(Product p, List<MultipartFile> files) {
		if (files == null) return;
		List<MultipartFile> valid = files.stream().filter(f -> f != null && !f.isEmpty()).toList();
		if (p.getMedia().size() + valid.size() > MAX_MEDIA) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Cada produto aceita no máximo " + MAX_MEDIA + " fotos/vídeos");
		}
		int pos = p.getMedia().stream().mapToInt(ProductMedia::getPosition).max().orElse(-1) + 1;
		for (MultipartFile f : valid) {
			String name = storage.storeMedia(f);
			p.getMedia().add(new ProductMedia(p, name,
					FileStorageService.isVideo(name) ? MediaType.VIDEO : MediaType.IMAGE, pos++));
		}
	}

	private void apply(Product p, ProductRequest req) {
		p.setName(req.name().trim());
		p.setDescription(req.description());
		p.setPrice(req.price());
		p.setCategory(req.category());
	}
}
