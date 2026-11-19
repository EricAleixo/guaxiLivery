package com.guaxi_livery.guaxiLivery.domain;

public enum VehicleType {
	BICICLETA, MOTO, CARRO, A_PE, OUTRO;

	/** Veículos motorizados exigem placa e CNH. */
	public boolean motorized() { return this == MOTO || this == CARRO; }
}
