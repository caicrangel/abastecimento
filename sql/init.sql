SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  role ENUM('admin','operador') NOT NULL DEFAULT 'operador',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bombas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  descricao VARCHAR(120),
  combustivel ENUM('diesel','arla32') NOT NULL DEFAULT 'diesel',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS veiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefixo VARCHAR(30) NOT NULL UNIQUE,
  placa VARCHAR(10),
  modelo VARCHAR(80),
  qr_token VARCHAR(64) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leituras_bomba (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bomba_id INT NOT NULL,
  user_id INT NOT NULL,
  user_encerramento_id INT NULL,
  data_leitura DATE NOT NULL,
  data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_encerramento DATETIME NULL,
  iniciante DECIMAL(12,2) NOT NULL,
  encerrante DECIMAL(12,2) NULL,
  foto_iniciante LONGBLOB,
  foto_iniciante_mime VARCHAR(50),
  foto_encerrante LONGBLOB,
  foto_encerrante_mime VARCHAR(50),
  observacao TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leitura_bomba FOREIGN KEY (bomba_id) REFERENCES bombas(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leitura_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leitura_user_enc FOREIGN KEY (user_encerramento_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_leitura_data (data_leitura),
  INDEX idx_leitura_bomba (bomba_id),
  INDEX idx_leitura_aberta (encerrante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS abastecimentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  bomba_id INT,
  user_id INT NOT NULL,
  data_abastecimento DATETIME NOT NULL,
  odometro INT NOT NULL,
  qtd_diesel DECIMAL(10,2) NOT NULL DEFAULT 0,
  qtd_arla32 DECIMAL(10,2) NOT NULL DEFAULT 0,
  foto_odometro LONGBLOB,
  foto_odometro_mime VARCHAR(50),
  observacao TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_abast_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_abast_bomba FOREIGN KEY (bomba_id) REFERENCES bombas(id) ON DELETE SET NULL,
  CONSTRAINT fk_abast_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_abast_data (data_abastecimento),
  INDEX idx_abast_veiculo (veiculo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
