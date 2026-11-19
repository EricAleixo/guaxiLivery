package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "courier_links", uniqueConstraints = @UniqueConstraint(columnNames = {"courier_id", "company_id"}))
@Getter
@Setter
@NoArgsConstructor
public class CourierLink {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "courier_id", nullable = false)
	private Courier courier;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "company_id", nullable = false)
	private Company company;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private CourierLinkStatus status;

	@Column(nullable = false, updatable = false)
	private Instant createdAt = Instant.now();

	@Column(nullable = false)
	private Instant updatedAt = Instant.now();

	public void setStatus(CourierLinkStatus s) {
		this.status = s;
		this.updatedAt = Instant.now();
	}
}
