# guaxiLivery

## Migração dos ids numéricos para UUID

Todas as chaves primárias passaram de `bigint` para `UUID`. Para bancos que já têm dados (produção), existe a migration
`backend/db/migrations/001_ids_to_uuid.sql`, executada pelo serviço `migrate` do `docker-compose.yml`
(`backend/db/migrate-uuid.sh`).

```bash
docker compose up -d --build            # o serviço "migrate" roda sozinho antes do backend
docker compose run --rm migrate check   # só informa se há migração pendente (exit 2 = pendente)
docker compose run --rm migrate         # aplica manualmente
```

- **Backup automático** antes de alterar qualquer coisa: `./backups/pre-uuid-AAAAMMDD-HHMMSS.dump`
  (restaurar: `pg_restore -c -d <banco> arquivo.dump`).
- **Atômica**: roda em uma única transação; se falhar, nada é alterado e o backend não sobe.
- **Idempotente**: se o banco já está em UUID (ou ainda vazio), não faz nada.
- Descobre PKs/FKs pelo catálogo do Postgres, preserva relações, nomes de constraints e índices.
- O mapeamento `id antigo → UUID` fica na tabela `uuid_migration_map`.
- Sessões (JWT) continuam válidas; a sacola salva no navegador com ids antigos é descartada.
- Faça o deploy do backend **e** do frontend juntos (a API passa a devolver ids como string).
