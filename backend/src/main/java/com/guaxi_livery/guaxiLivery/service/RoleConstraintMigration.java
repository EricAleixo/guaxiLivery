package com.guaxi_livery.guaxiLivery.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * O Hibernate cria um CHECK com os valores do enum Role; com ddl-auto=update ele não é atualizado
 * e o papel ENTREGADOR seria rejeitado em bancos já existentes. Remove o CHECK antigo (a validação fica na aplicação).
 */
@Component
public class RoleConstraintMigration implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(RoleConstraintMigration.class);
	private final JdbcTemplate jdbc;

	public RoleConstraintMigration(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		try {
			jdbc.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
		} catch (Exception e) {
			log.warn("Não consegui remover users_role_check: {}", e.getMessage());
		}
	}
}
