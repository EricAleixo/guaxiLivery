package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

	@Column(nullable = false)
	private String name;

	@Column(length = 500)
	private String description;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ProductCategory category = ProductCategory.OUTROS;

	/** Legado: foto única. Migrada para {@link #media} na inicialização. */
	private String imageFilename;

	/** Fotos e vídeos, na ordem de exibição. */
	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("position, id")
	@BatchSize(size = 50)
	private List<ProductMedia> media = new ArrayList<>();

	/** false = esgotado / fora do cardápio. */
	@Column(nullable = false)
	private boolean available = true;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();
}
