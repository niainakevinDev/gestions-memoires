USE gestion_memoires;
CREATE TABLE IF NOT EXISTS soutenances (
  soutenance_id INT NOT NULL AUTO_INCREMENT,
  memoire_id INT NOT NULL,
  soutenance_date DATETIME NOT NULL,
  soutenance_lieu VARCHAR(255) NOT NULL,
  soutenance_jury TEXT NULL,
  soutenance_statut ENUM('PLANIFIEE','REALISEE','ANNULEE') NOT NULL DEFAULT 'PLANIFIEE',
  soutenance_commentaire TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (soutenance_id),
  KEY idx_soutenances_date (soutenance_date),
  UNIQUE KEY uq_soutenance_memoire (memoire_id),
  CONSTRAINT fk_soutenances_memoire FOREIGN KEY (memoire_id) REFERENCES memoires(memoire_id) ON DELETE CASCADE
) ENGINE=InnoDB;
