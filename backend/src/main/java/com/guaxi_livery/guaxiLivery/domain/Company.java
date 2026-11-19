package com.guaxi_livery.guaxiLivery.domain;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
public class Company {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(nullable = false)
	private String tradeName;

	@Column(nullable = false, unique = true, length = 14)
	private String cnpj;

	private String phone;

	private String address;

	@Column(length = 500)
	private String description;

	/** Logo / foto da empresa dentro de app.upload.dir. */
	private String logoFilename;
}
