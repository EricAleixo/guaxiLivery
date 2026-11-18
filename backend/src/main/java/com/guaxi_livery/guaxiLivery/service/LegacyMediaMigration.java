package com.guaxi_livery.guaxiLivery.service;

import com.guaxi_livery.guaxiLivery.domain.MediaType;
import com.guaxi_livery.guaxiLivery.domain.ProductMedia;
import com.guaxi_livery.guaxiLivery.repository.ProductRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Converte a antiga foto única (imageFilename) dos produtos em um item de mídia. */
@Component
public class LegacyMediaMigration implements ApplicationRunner {

	private final ProductRepository products;

	public LegacyMediaMigration(ProductRepository products) {
		this.products = products;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		products.findAll().stream()
				.filter(p -> p.getImageFilename() != null && !p.getImageFilename().isBlank() && p.getMedia().isEmpty())
				.forEach(p -> {
					p.getMedia().add(new ProductMedia(p, p.getImageFilename(), MediaType.IMAGE, 0));
					p.setImageFilename(null);
				});
	}
}
