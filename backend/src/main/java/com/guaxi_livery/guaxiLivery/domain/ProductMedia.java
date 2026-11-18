package com.guaxi_livery.guaxiLivery.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Foto ou vídeo de um produto (carrossel do feed). */
@Entity
@Table(name = "product_media")
@Getter
@Setter
@NoArgsConstructor
public class ProductMedia {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id", nullable = false)
	private Product product;

	@Column(nullable = false)
	private String filename;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MediaType type;

	@Column(nullable = false)
	private int position;

	public ProductMedia(Product product, String filename, MediaType type, int position) {
		this.product = product;
		this.filename = filename;
		this.type = type;
		this.position = position;
	}
}
