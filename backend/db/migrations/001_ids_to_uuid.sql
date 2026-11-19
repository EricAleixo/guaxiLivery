-- =====================================================================================
-- GuaxiLivery - migra TODAS as chaves primarias numericas (bigint/int) para UUID.
--
--  * Generico: descobre PKs e FKs pelo catalogo do Postgres (nada de lista fixa de tabelas).
--  * Atomico: roda tudo em uma transacao; se algo falhar, nada muda.
--  * Idempotente: se nao ha mais PK numerica, nao faz nada (pode rodar quantas vezes quiser).
--  * Preserva dados: todo FK e remapeado junto (inclusive auto-referencia), e nomes de
--    constraints/indices unicos sao mantidos para o Hibernate nao recria-los.
--  * Guarda o mapeamento antigo->novo em uuid_migration_map (para auditoria/suporte).
--
-- Use via scripts: backend/db/migrate-uuid.sh (ja embutido no docker-compose, servico "migrate").
-- =====================================================================================
DO $mig$
DECLARE
  r      record;
  v_cnt  bigint;
  v_bad  bigint;
BEGIN
  -- ---------- 1. PKs numericas de coluna unica no schema public ----------
  CREATE TEMP TABLE _m_pk ON COMMIT DROP AS
  SELECT c.oid AS relid, c.relname AS tbl, a.attname AS col, a.attnum, con.conname AS pkname
    FROM pg_constraint con
    JOIN pg_class c      ON c.oid = con.conrelid
    JOIN pg_attribute a  ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
   WHERE con.contype = 'p'
     AND array_length(con.conkey, 1) = 1
     AND c.relnamespace = 'public'::regnamespace
     AND c.relkind = 'r'
     AND a.atttypid IN ('int2'::regtype, 'int4'::regtype, 'int8'::regtype);

  IF NOT EXISTS (SELECT 1 FROM _m_pk) THEN
    RAISE NOTICE '[uuid] nenhuma PK numerica encontrada: nada a fazer.';
    RETURN;
  END IF;

  -- Trava as tabelas durante a migracao (a aplicacao esta parada).
  FOR r IN SELECT tbl FROM _m_pk LOOP
    EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', r.tbl);
  END LOOP;

  -- ---------- 2. FKs que apontam para essas PKs ----------
  CREATE TEMP TABLE _m_fk ON COMMIT DROP AS
  SELECT con.conname, con.conrelid AS child_relid, cc.relname AS child_tbl, ca.attname AS child_col, ca.attnum AS child_attnum,
         pk.relid AS parent_relid, pk.tbl AS parent_tbl, pk.col AS parent_col,
         NOT ca.attnotnull AS nullable,
         pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN _m_pk pk        ON pk.relid = con.confrelid
    JOIN pg_class cc     ON cc.oid = con.conrelid
    JOIN pg_attribute ca ON ca.attrelid = con.conrelid AND ca.attnum = con.conkey[1]
   WHERE con.contype = 'f' AND array_length(con.conkey, 1) = 1;

  IF EXISTS (
    SELECT 1 FROM pg_constraint con JOIN _m_pk pk ON pk.relid = con.confrelid
     WHERE con.contype = 'f' AND array_length(con.conkey, 1) <> 1
  ) THEN
    RAISE EXCEPTION '[uuid] FK composta apontando para PK numerica: migracao manual necessaria.';
  END IF;

  -- ---------- 3. Guarda indices/uniques que envolvem colunas afetadas (PKs e FKs) ----------
  CREATE TEMP TABLE _m_aff ON COMMIT DROP AS
  SELECT relid, attnum FROM _m_pk
  UNION SELECT child_relid, child_attnum FROM _m_fk;

  CREATE TEMP TABLE _m_idx ON COMMIT DROP AS
  SELECT DISTINCT i.indexrelid, i.indrelid AS relid, ic.relname AS idxname, tc.relname AS tbl,
         con.conname AS conname,
         CASE WHEN con.oid IS NOT NULL THEN pg_get_constraintdef(con.oid) ELSE pg_get_indexdef(i.indexrelid) END AS def
    FROM pg_index i
    JOIN pg_class ic ON ic.oid = i.indexrelid
    JOIN pg_class tc ON tc.oid = i.indrelid
    LEFT JOIN pg_constraint con ON con.conindid = i.indexrelid AND con.contype IN ('u', 'x')
   WHERE NOT i.indisprimary
     AND tc.relnamespace = 'public'::regnamespace
     AND EXISTS (SELECT 1 FROM _m_aff a WHERE a.relid = i.indrelid AND a.attnum = ANY (i.indkey::int2[]));

  -- ---------- 4. Cria colunas UUID e preenche (mapeando as FKs) ----------
  CREATE TABLE IF NOT EXISTS public.uuid_migration_map (
    table_name text NOT NULL, old_id bigint NOT NULL, new_id uuid NOT NULL, PRIMARY KEY (table_name, old_id));

  FOR r IN SELECT * FROM _m_pk LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN __uuid uuid', r.tbl);
    EXECUTE format('UPDATE public.%I SET __uuid = gen_random_uuid()', r.tbl);
    EXECUTE format('INSERT INTO public.uuid_migration_map SELECT %L, %I, __uuid FROM public.%I ON CONFLICT DO NOTHING', r.tbl, r.col, r.tbl);
  END LOOP;

  FOR r IN SELECT * FROM _m_fk LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I uuid', r.child_tbl, r.child_col || '__uuid');
    EXECUTE format('UPDATE public.%I c SET %I = p.__uuid FROM public.%I p WHERE c.%I = p.%I',
                   r.child_tbl, r.child_col || '__uuid', r.parent_tbl, r.child_col, r.parent_col);
    -- Nenhum FK pode ficar sem correspondencia (seria perda de vinculo).
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NOT NULL AND %I IS NULL',
                   r.child_tbl, r.child_col, r.child_col || '__uuid') INTO v_bad;
    IF v_bad > 0 THEN
      RAISE EXCEPTION '[uuid] % linha(s) em %.% sem correspondencia na tabela pai %. Abortando.', v_bad, r.child_tbl, r.child_col, r.parent_tbl;
    END IF;
  END LOOP;

  -- ---------- 5. Remove FKs, indices e PKs antigos ----------
  FOR r IN SELECT * FROM _m_fk LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.child_tbl, r.conname);
  END LOOP;
  FOR r IN SELECT * FROM _m_idx LOOP
    IF r.conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tbl, r.conname);
    ELSE
      EXECUTE format('DROP INDEX public.%I', r.idxname);
    END IF;
  END LOOP;
  FOR r IN SELECT * FROM _m_pk LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tbl, r.pkname);
  END LOOP;

  -- ---------- 6. Troca as colunas ----------
  FOR r IN SELECT * FROM _m_fk LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', r.child_tbl, r.child_col);
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', r.child_tbl, r.child_col || '__uuid', r.child_col);
    IF NOT r.nullable THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', r.child_tbl, r.child_col);
    END IF;
  END LOOP;
  FOR r IN SELECT * FROM _m_pk LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', r.tbl, r.col);          -- remove tambem a identity/sequence
    EXECUTE format('ALTER TABLE public.%I RENAME COLUMN __uuid TO %I', r.tbl, r.col);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', r.tbl, r.col);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (%I)', r.tbl, r.pkname, r.col);
  END LOOP;

  -- ---------- 7. Recria indices/uniques e FKs com os mesmos nomes ----------
  FOR r IN SELECT * FROM _m_idx LOOP
    IF r.conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.tbl, r.conname, r.def);
    ELSE
      EXECUTE r.def;
    END IF;
  END LOOP;
  FOR r IN SELECT * FROM _m_fk LOOP
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', r.child_tbl, r.conname, r.def);
  END LOOP;

  -- ---------- 8. Registro ----------
  CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
  INSERT INTO public.schema_migrations(name) VALUES ('001_ids_to_uuid') ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_cnt FROM _m_pk;
  RAISE NOTICE '[uuid] OK: % tabela(s) convertida(s).', v_cnt;
END
$mig$;
