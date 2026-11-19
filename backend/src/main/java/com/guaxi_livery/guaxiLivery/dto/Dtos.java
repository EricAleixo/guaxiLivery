package com.guaxi_livery.guaxiLivery.dto;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public final class Dtos {

	/** Mínimo 8 caracteres com ao menos uma letra, um número e um caractere especial. */
	private static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$";
	private Dtos() {}

	static String upload(String filename) {
		return filename == null || filename.isBlank() ? null : "/api/uploads/" + filename;
	}

	public record LoginRequest(
			@NotBlank @Email String email,
			@NotBlank String password) {}

	public record ClientRegisterRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Email String email,
			@NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_RULE, message = "Senha deve ter letra, número e caractere especial") String password) {}

	public record CompanyRegisterRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Email String email,
			@NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_RULE, message = "Senha deve ter letra, número e caractere especial") String password,
			@NotBlank @Size(max = 120) String tradeName,
			@NotBlank @Pattern(regexp = "\\d{14}", message = "CNPJ deve ter 14 dígitos") String cnpj,
			@Size(max = 30) String phone,
			@Size(max = 255) String address,
			@Size(max = 500) String description) {}

	public record AuthResponse(String token, UserResponse user) {}

	public record UserResponse(UUID id, String name, String email, Role role, UUID companyId, String avatarUrl) {}

	public record CompanyResponse(UUID id, String tradeName, String phone, String address, String description, String logoUrl) {
		public static CompanyResponse of(Company c) {
			return new CompanyResponse(c.getId(), c.getTradeName(), c.getPhone(), c.getAddress(), c.getDescription(), upload(c.getLogoFilename()));
		}
	}

	/** Dados do entregador visíveis no pedido (sem documentos). */
	public record CourierBrief(UUID id, String name, String phone, VehicleType vehicleType, String vehiclePlate,
							   String vehicleModel, String vehicleColor, String avatarUrl) {
		public static CourierBrief of(Courier c) {
			String avatar = c.getUser().getAvatarFilename();
			return new CourierBrief(c.getId(), c.getUser().getName(), c.getUser().getPhone(), c.getVehicleType(),
					c.getVehiclePlate(), c.getVehicleModel(), c.getVehicleColor(),
					avatar == null || avatar.isBlank() ? null : "/api/uploads/" + avatar);
		}
	}

	/** Recebido como multipart/form-data (campos + arquivo "image"). */
	public record DeliveryRequest(
			@NotBlank @Size(max = 120) String foodName,
			@Size(max = 500) String description,
			@NotNull @Min(1) @Max(50) Integer quantity,
			@NotBlank @Size(max = 255) String pickupAddress,
			@NotBlank @Size(max = 255) String deliveryAddress,
			UUID companyId) {}

	/** Pedido feito a partir de um produto do feed. */
	public record OrderRequest(
			@NotNull UUID productId,
			@NotNull @Min(1) @Max(50) Integer quantity,
			@NotBlank @Size(max = 255) String deliveryAddress,
			@Size(max = 500) String description) {}

	public record StatusUpdateRequest(@NotNull DeliveryStatus status) {}

	public record DeliveryResponse(
			UUID id,
			String foodName,
			String description,
			Integer quantity,
			String pickupAddress,
			String deliveryAddress,
			String imageUrl,
			DeliveryStatus status,
			String clientName,
			CompanyResponse company,
			Instant createdAt,
			UUID productId,
			boolean reviewed,
			CourierBrief courier) {
		public static DeliveryResponse of(Delivery d) {
			return of(d, false);
		}

		public static DeliveryResponse of(Delivery d, boolean reviewed) {
			return new DeliveryResponse(d.getId(), d.getFoodName(), d.getDescription(), d.getQuantity(),
					d.getPickupAddress(), d.getDeliveryAddress(), d.getImageFilename().isBlank() ? null : "/api/uploads/" + d.getImageFilename(),
					d.getStatus(), d.getClient().getName(),
					d.getCompany() == null ? null : CompanyResponse.of(d.getCompany()), d.getCreatedAt(),
					d.getProduct() == null ? null : d.getProduct().getId(), reviewed,
					d.getCourier() == null ? null : CourierBrief.of(d.getCourier()));
		}
	}

	/** Recebido como multipart/form-data (campos + arquivo opcional "image"). */
	public record ProductRequest(
			@NotBlank @Size(max = 120) String name,
			@Size(max = 500) String description,
			@NotNull @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
			@DecimalMax(value = "99999.99") @Digits(integer = 5, fraction = 2) BigDecimal price,
			@NotNull ProductCategory category) {}

	/** Produto disponível no feed do cliente, junto da empresa que o vende. */
	public record FeedItemResponse(ProductResponse product, CompanyResponse company, Double ratingAvg, long ratingCount) {
		public static FeedItemResponse of(Product p, Double avg, long count) {
			return new FeedItemResponse(ProductResponse.of(p), CompanyResponse.of(p.getCompany()), avg, count);
		}
	}

	public record ReviewRequest(
			@NotNull UUID deliveryId,
			@NotNull @Min(1) @Max(5) Integer rating,
			@Size(max = 500) String comment) {}

	public record ReviewResponse(UUID id, int rating, String comment, String clientName, String clientAvatarUrl,
								 UUID productId, String productName, Instant createdAt) {
		public static ReviewResponse of(Review r) {
			return new ReviewResponse(r.getId(), r.getRating(), r.getComment(), r.getClient().getName(),
					upload(r.getClient().getAvatarFilename()), r.getProduct().getId(), r.getProduct().getName(), r.getCreatedAt());
		}
	}

	public record ProductReviewsResponse(Double average, long count, java.util.List<ReviewResponse> reviews) {}

	/** Multipart: campos + arquivo opcional "image" (foto do cliente ou logo da empresa). */
	public record ProfileRequest(
			@NotBlank @Size(max = 120) String name,
			@Size(max = 30) String phone,
			@Size(max = 255) String address,
			@Size(max = 120) String tradeName,
			@Size(max = 500) String description) {}

	public record ProfileResponse(String name, String email, Role role, String avatarUrl, String phone, String address,
								  String tradeName, String cnpj, String description) {}

	public record AvailabilityRequest(@NotNull Boolean available) {}

	public record MediaResponse(UUID id, String url, MediaType type) {
		public static MediaResponse of(ProductMedia m) {
			return new MediaResponse(m.getId(), upload(m.getFilename()), m.getType());
		}
	}

	public record ProductResponse(UUID id, String name, String description, BigDecimal price,
								  ProductCategory category, String imageUrl, java.util.List<MediaResponse> media,
								  boolean available, Instant createdAt) {
		public static ProductResponse of(Product p) {
			java.util.List<MediaResponse> media = p.getMedia().stream().map(MediaResponse::of).toList();
			String cover = media.stream().filter(m -> m.type() == MediaType.IMAGE).map(MediaResponse::url).findFirst()
					.orElseGet(() -> upload(p.getImageFilename()));
			return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getCategory(),
					cover, media, p.isAvailable(), p.getCreatedAt());
		}
	}
}
