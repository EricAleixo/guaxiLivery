#!/bin/sh
# Migra os ids numericos do banco para UUID, com backup automatico antes.
#
#   docker compose run --rm migrate          # aplica (se necessario)
#   docker compose run --rm migrate check    # so informa se ha migracao pendente
#
# Roda sozinho a cada "docker compose up" (o backend so sobe depois que este servico termina).
# Seguro para rodar varias vezes: se o banco ja esta em UUID (ou ainda vazio), nao faz nada.
set -eu

: "${PGHOST:=db}" "${PGPORT:=5432}" "${PGUSER:?PGUSER nao definido}" "${PGDATABASE:?PGDATABASE nao definido}"
export PGHOST PGPORT PGUSER PGDATABASE
BACKUP_DIR="${BACKUP_DIR:-/backups}"
SQL_DIR="$(dirname "$0")/migrations"

echo "[migrate] aguardando o banco em $PGHOST:$PGPORT ..."
i=0
until pg_isready -q; do
  i=$((i + 1)); [ "$i" -ge 60 ] && { echo "[migrate] banco indisponivel, abortando." >&2; exit 1; }
  sleep 2
done

# Quantas tabelas ainda tem PK numerica? (0 = banco novo/vazio ou ja migrado)
PENDING=$(psql -tA -v ON_ERROR_STOP=1 -c "
  SELECT count(*) FROM pg_constraint con
    JOIN pg_class c     ON c.oid = con.conrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
   WHERE con.contype = 'p' AND array_length(con.conkey,1) = 1
     AND c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
     AND a.atttypid IN ('int2'::regtype,'int4'::regtype,'int8'::regtype)")

if [ "$PENDING" = "0" ]; then
  echo "[migrate] nada a migrar (ids ja sao UUID ou banco ainda vazio)."
  exit 0
fi
echo "[migrate] $PENDING tabela(s) com id numerico."
[ "${1:-}" = "check" ] && { echo "[migrate] migracao PENDENTE."; exit 2; }

mkdir -p "$BACKUP_DIR"
BACKUP="$BACKUP_DIR/pre-uuid-$(date +%Y%m%d-%H%M%S).dump"
echo "[migrate] backup em $BACKUP ..."
pg_dump -Fc -f "$BACKUP"
[ -s "$BACKUP" ] || { echo "[migrate] backup vazio, abortando." >&2; exit 1; }

echo "[migrate] convertendo ids para UUID ..."
if psql -v ON_ERROR_STOP=1 --single-transaction -f "$SQL_DIR/001_ids_to_uuid.sql"; then
  echo "[migrate] concluido. Backup mantido em $BACKUP"
else
  echo "[migrate] FALHOU. Nada foi alterado (transacao revertida). Backup: $BACKUP" >&2
  exit 1
fi
