package com.guaxi_livery.guaxiLivery.dto;

import java.util.UUID;

import com.guaxi_livery.guaxiLivery.domain.*;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public final class CourierDtos {
	private CourierDtos() {}

	private static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$";

	/** Cadastro público do entregador (tela de cadastro). companyIds = empresas para se candidatar já na criação. */
	public record CourierRegisterRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Email String email,
			@NotBlank @Size(min = 8, max = 72) @Pattern(regexp = PASSWORD_RULE, message = "Senha deve ter letra, número e caractere especial") String password,
			@NotBlank @Size(max = 30) String phone,
			@NotBlank @Pattern(regexp = "\\d{11}", message = "CPF deve ter 11 dígitos") String cpf,
			@NotNull VehicleType vehicleType,
			@Size(max = 10) String vehiclePlate,
			@Size(max = 60) String vehicleModel,
			@Size(max = 40) String vehicleColor,
			@Pattern(regexp = "|\\d{11}", message = "CNH deve ter 11 dígitos") String cnh,
			List<UUID> companyIds) {}

	/**
	 * Empresa cadastra um entregador. Se o e-mail já for de um entregador, ele recebe um convite
	 * (nesse caso os demais dados são ignorados). Senha é a inicial; o entregador pode usá-la para entrar.
	 */
	public record CompanyCourierRequest(
			@NotBlank @Email String email,
			@Size(max = 120) String name,
			@Pattern(regexp = PASSWORD_RULE, message = "Senha deve ter letra, número e caractere especial") String password,
			@Size(max = 30) String phone,
			@Pattern(regexp = "|\\d{11}", message = "CPF deve ter 11 dígitos") String cpf,
			VehicleType vehicleType,
			@Size(max = 10) String vehiclePlate,
			@Size(max = 60) String vehicleModel,
			@Size(max = 40) String vehicleColor,
			@Pattern(regexp = "|\\d{11}", message = "CNH deve ter 11 dígitos") String cnh) {}

	public record CourierProfileRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 30) String phone,
			@NotBlank @Pattern(regexp = "\\d{11}", message = "CPF deve ter 11 dígitos") String cpf,
			@NotNull VehicleType vehicleType,
			@Size(max = 10) String vehiclePlate,
			@Size(max = 60) String vehicleModel,
			@Size(max = 40) String vehicleColor,
			@Pattern(regexp = "|\\d{11}", message = "CNH deve ter 11 dígitos") String cnh) {}

	public record CourierResponse(UUID id, String name, String email, String phone, String cpf, VehicleType vehicleType,
								  String vehiclePlate, String vehicleModel, String vehicleColor, String cnh, String avatarUrl) {
		public static CourierResponse of(Courier c) {
			User u = c.getUser();
			return new CourierResponse(c.getId(), u.getName(), u.getEmail(), u.getPhone(), c.getCpf(), c.getVehicleType(),
					c.getVehiclePlate(), c.getVehicleModel(), c.getVehicleColor(), c.getCnh(),
					u.getAvatarFilename() == null || u.getAvatarFilename().isBlank() ? null : "/api/uploads/" + u.getAvatarFilename());
		}
	}

	/** Vínculo visto pela empresa. */
	public record CompanyLinkResponse(UUID id, CourierLinkStatus status, Instant updatedAt, CourierResponse courier) {
		public static CompanyLinkResponse of(CourierLink l) {
			return new CompanyLinkResponse(l.getId(), l.getStatus(), l.getUpdatedAt(), CourierResponse.of(l.getCourier()));
		}
	}

	/** Empresa vista pelo entregador, com o estado do vínculo (null = sem vínculo). */
	public record CourierCompanyResponse(Dtos.CompanyResponse company, UUID linkId, CourierLinkStatus status) {}

	public record AssignCourierRequest(UUID courierId) {}

	public record CourierStatusRequest(@NotNull DeliveryStatus status) {}
}
