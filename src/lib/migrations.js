import { query, queryOne } from './db';
import { log } from './logger';

async function columnExists(table, column) {
  const r = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  return r && Number(r.c) > 0;
}

async function indexExists(table, indexName) {
  const r = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, indexName]
  );
  return r && Number(r.c) > 0;
}

async function fkExists(table, fkName) {
  const r = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.table_constraints
      WHERE table_schema = DATABASE() AND table_name = ?
        AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'`,
    [table, fkName]
  );
  return r && Number(r.c) > 0;
}

async function migration001() {
  const m = 'migration 001 (separar iniciante/encerrante)';

  if (!(await columnExists('leituras_bomba', 'data_inicio'))) {
    log.info(`${m}: adicionando coluna data_inicio`);
    await query('ALTER TABLE leituras_bomba ADD COLUMN data_inicio DATETIME NULL AFTER data_leitura');
  }
  if (!(await columnExists('leituras_bomba', 'data_encerramento'))) {
    log.info(`${m}: adicionando coluna data_encerramento`);
    await query('ALTER TABLE leituras_bomba ADD COLUMN data_encerramento DATETIME NULL AFTER data_inicio');
  }
  if (!(await columnExists('leituras_bomba', 'user_encerramento_id'))) {
    log.info(`${m}: adicionando coluna user_encerramento_id`);
    await query('ALTER TABLE leituras_bomba ADD COLUMN user_encerramento_id INT NULL AFTER user_id');
  }

  await query('ALTER TABLE leituras_bomba MODIFY encerrante DECIMAL(12,2) NULL');
  await query('ALTER TABLE leituras_bomba MODIFY foto_encerrante LONGBLOB NULL');
  await query('ALTER TABLE leituras_bomba MODIFY foto_encerrante_mime VARCHAR(50) NULL');

  await query('UPDATE leituras_bomba SET data_inicio = created_at WHERE data_inicio IS NULL');
  await query(
    `UPDATE leituras_bomba
        SET data_encerramento = created_at,
            user_encerramento_id = user_id
      WHERE encerrante IS NOT NULL AND data_encerramento IS NULL`
  );

  await query('ALTER TABLE leituras_bomba MODIFY data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP');

  if (!(await fkExists('leituras_bomba', 'fk_leitura_user_enc'))) {
    log.info(`${m}: criando FK fk_leitura_user_enc`);
    await query(
      `ALTER TABLE leituras_bomba
         ADD CONSTRAINT fk_leitura_user_enc
         FOREIGN KEY (user_encerramento_id) REFERENCES users(id) ON DELETE SET NULL`
    );
  }

  if (!(await indexExists('leituras_bomba', 'idx_leitura_aberta'))) {
    log.info(`${m}: criando indice idx_leitura_aberta`);
    await query('ALTER TABLE leituras_bomba ADD INDEX idx_leitura_aberta (encerrante)');
  }
}

async function tableExists(name) {
  const r = await queryOne(
    `SELECT COUNT(*) AS c FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [name]
  );
  return r && Number(r.c) > 0;
}

async function migration002() {
  const m = 'migration 002 (operacoes do dia)';

  if (!(await tableExists('operacoes'))) {
    log.info(`${m}: criando tabela operacoes`);
    await query(`
      CREATE TABLE operacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data DATE NOT NULL,
        iniciado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        encerrado_em DATETIME NULL,
        iniciado_por INT NOT NULL,
        encerrado_por INT NULL,
        observacao TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_op_iniciador FOREIGN KEY (iniciado_por) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_op_encerrador FOREIGN KEY (encerrado_por) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_op_aberta (encerrado_em),
        INDEX idx_op_data (data)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  if (!(await columnExists('leituras_bomba', 'operacao_id'))) {
    log.info(`${m}: adicionando operacao_id em leituras_bomba`);
    await query('ALTER TABLE leituras_bomba ADD COLUMN operacao_id INT NULL AFTER user_encerramento_id');
  }
  if (!(await fkExists('leituras_bomba', 'fk_leitura_operacao'))) {
    await query(
      `ALTER TABLE leituras_bomba
         ADD CONSTRAINT fk_leitura_operacao
         FOREIGN KEY (operacao_id) REFERENCES operacoes(id) ON DELETE SET NULL`
    );
  }
  if (!(await indexExists('leituras_bomba', 'idx_leitura_op'))) {
    await query('ALTER TABLE leituras_bomba ADD INDEX idx_leitura_op (operacao_id)');
  }

  if (!(await columnExists('abastecimentos', 'operacao_id'))) {
    log.info(`${m}: adicionando operacao_id em abastecimentos`);
    await query('ALTER TABLE abastecimentos ADD COLUMN operacao_id INT NULL AFTER user_id');
  }
  if (!(await fkExists('abastecimentos', 'fk_abast_operacao'))) {
    await query(
      `ALTER TABLE abastecimentos
         ADD CONSTRAINT fk_abast_operacao
         FOREIGN KEY (operacao_id) REFERENCES operacoes(id) ON DELETE SET NULL`
    );
  }
  if (!(await indexExists('abastecimentos', 'idx_abast_op'))) {
    await query('ALTER TABLE abastecimentos ADD INDEX idx_abast_op (operacao_id)');
  }
}

export async function runMigrations() {
  if (!(await tableExists('leituras_bomba'))) {
    log.warn('migrations: tabela leituras_bomba ainda nao existe, pulando');
    return;
  }
  await migration001();
  await migration002();
}
