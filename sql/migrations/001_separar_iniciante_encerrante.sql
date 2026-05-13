-- Migration 001: Separar iniciante e encerrante em momentos distintos.
-- Aplicar uma unica vez no BD existente:
--   docker compose exec -T mysql mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} < sql/migrations/001_separar_iniciante_encerrante.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Encerrante e suas fotos passam a ser opcionais
ALTER TABLE leituras_bomba MODIFY encerrante DECIMAL(12,2) NULL;
ALTER TABLE leituras_bomba MODIFY foto_encerrante LONGBLOB NULL;
ALTER TABLE leituras_bomba MODIFY foto_encerrante_mime VARCHAR(50) NULL;

-- Novas colunas de auditoria temporal
ALTER TABLE leituras_bomba
  ADD COLUMN data_inicio DATETIME NULL AFTER data_leitura,
  ADD COLUMN data_encerramento DATETIME NULL AFTER data_inicio,
  ADD COLUMN user_encerramento_id INT NULL AFTER user_id;

-- Preencher data_inicio com created_at e data_encerramento para registros existentes ja completos
UPDATE leituras_bomba
   SET data_inicio = created_at
 WHERE data_inicio IS NULL;

UPDATE leituras_bomba
   SET data_encerramento = created_at,
       user_encerramento_id = user_id
 WHERE encerrante IS NOT NULL
   AND data_encerramento IS NULL;

-- Tornar data_inicio obrigatoria
ALTER TABLE leituras_bomba MODIFY data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- FK do encerramento
ALTER TABLE leituras_bomba
  ADD CONSTRAINT fk_leitura_user_enc
  FOREIGN KEY (user_encerramento_id) REFERENCES users(id) ON DELETE SET NULL;

-- Indice para localizar rapido as leituras abertas (encerrante IS NULL)
ALTER TABLE leituras_bomba ADD INDEX idx_leitura_aberta (encerrante);

SET FOREIGN_KEY_CHECKS = 1;
