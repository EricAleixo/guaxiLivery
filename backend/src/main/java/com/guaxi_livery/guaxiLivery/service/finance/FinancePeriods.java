package com.guaxi_livery.guaxiLivery.service.finance;

import com.guaxi_livery.guaxiLivery.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/** Converte períodos de datas (no fuso do negócio) para instantes, usados no filtro dos pedidos. */
@Component
public class FinancePeriods {

	/** Limite para evitar consultas gigantes por engano. */
	static final long MAX_DAYS = 3 * 366;

	private final ZoneId zone;

	public FinancePeriods(@Value("${app.finance.zone:America/Sao_Paulo}") String zone) {
		this.zone = ZoneId.of(zone);
	}

	public record Period(LocalDate from, LocalDate to, Instant start, Instant end) {
		public long days() { return ChronoUnit.DAYS.between(from, to) + 1; }
	}

	public ZoneId zone() { return zone; }

	public LocalDate today() { return LocalDate.now(zone); }

	/** Intervalo fechado [from, to]; sem datas = mês atual. */
	public Period resolve(LocalDate from, LocalDate to) {
		LocalDate today = today();
		if (from == null) from = today.withDayOfMonth(1);
		if (to == null) to = from.withDayOfMonth(from.lengthOfMonth());
		if (to.isBefore(from)) throw new ApiException(HttpStatus.BAD_REQUEST, "A data final deve ser depois da inicial");
		if (ChronoUnit.DAYS.between(from, to) >= MAX_DAYS)
			throw new ApiException(HttpStatus.BAD_REQUEST, "Período máximo de 3 anos");
		return new Period(from, to, from.atStartOfDay(zone).toInstant(), to.plusDays(1).atStartOfDay(zone).toInstant());
	}

	public LocalDate localDate(Instant instant) {
		return instant.atZone(zone).toLocalDate();
	}
}
