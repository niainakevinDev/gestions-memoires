-- Schéma initial de Gestion des mémoires universitaires
-- Importer ce fichier dans MySQL avant de démarrer le backend.
CREATE DATABASE IF NOT EXISTS gestion_memoires
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_memoires;

CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT,
  user_email VARCHAR(254) NOT NULL,
  user_mdp VARCHAR(255) NOT NULL,
  user_role ENUM('ADMIN','ETUDIANT','ENCADREUR') NOT NULL DEFAULT 'ETUDIANT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (user_email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS etudiants (
  etudiant_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  etudiant_matricule VARCHAR(50) NOT NULL,
  etudiant_nom VARCHAR(100) NOT NULL,
  etudiant_prenom VARCHAR(100) NOT NULL,
  etudiant_telephone VARCHAR(30) NULL,
  etudiant_niveau VARCHAR(50) NOT NULL DEFAULT '',
  etudiant_formation VARCHAR(150) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (etudiant_id),
  UNIQUE KEY uq_etudiants_user (user_id),
  UNIQUE KEY uq_etudiants_matricule (etudiant_matricule),
  CONSTRAINT fk_etudiants_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS encadreurs (
  encadreur_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  encadreur_matricule VARCHAR(50) NOT NULL,
  encadreur_nom VARCHAR(100) NOT NULL,
  encadreur_prenom VARCHAR(100) NOT NULL,
  encadreur_telephone VARCHAR(30) NULL,
  encadreur_specialite VARCHAR(150) NULL,
  encadreur_grade VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (encadreur_id),
  UNIQUE KEY uq_encadreurs_user (user_id),
  UNIQUE KEY uq_encadreurs_matricule (encadreur_matricule),
  CONSTRAINT fk_encadreurs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS memoires (
  memoire_id INT NOT NULL AUTO_INCREMENT,
  memoire_titre VARCHAR(255) NOT NULL,
  memoire_resume TEXT NULL,
  memoire_niveau VARCHAR(50) NOT NULL,
  memoire_formation VARCHAR(150) NOT NULL,
  annee_universitaire VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (memoire_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS memoire_etudiants (
  memoire_id INT NOT NULL,
  etudiant_id INT NOT NULL,
  PRIMARY KEY (memoire_id, etudiant_id),
  UNIQUE KEY uq_memoire_etudiants_etudiant (etudiant_id),
  CONSTRAINT fk_me_memoire FOREIGN KEY (memoire_id) REFERENCES memoires(memoire_id) ON DELETE CASCADE,
  CONSTRAINT fk_me_etudiant FOREIGN KEY (etudiant_id) REFERENCES etudiants(etudiant_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS memoire_encadreurs (
  memoire_id INT NOT NULL,
  encadreur_id INT NOT NULL,
  memoire_role ENUM('PRINCIPAL','CO_ENCADREUR') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (memoire_id, encadreur_id),
  KEY idx_memoire_encadreurs_encadreur (encadreur_id),
  CONSTRAINT fk_memoire_encadreurs_memoire FOREIGN KEY (memoire_id) REFERENCES memoires(memoire_id) ON DELETE CASCADE,
  CONSTRAINT fk_memoire_encadreurs_encadreur FOREIGN KEY (encadreur_id) REFERENCES encadreurs(encadreur_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS versions_memoires (
  version_id INT NOT NULL AUTO_INCREMENT,
  memoire_id INT NOT NULL,
  numero_version INT NOT NULL,
  commentaire_etudiant TEXT NULL,
  version_statut ENUM('SOUMISE','EN_REVISION','VALIDEE','REJETEE') NOT NULL DEFAULT 'SOUMISE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chemin_fichier VARCHAR(500) NOT NULL,
  PRIMARY KEY (version_id),
  UNIQUE KEY uq_version_memoire_numero (memoire_id, numero_version),
  CONSTRAINT fk_versions_memoire FOREIGN KEY (memoire_id) REFERENCES memoires(memoire_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commentaires (
  commentaire_id INT NOT NULL AUTO_INCREMENT,
  version_id INT NOT NULL,
  encadreur_id INT NOT NULL,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (commentaire_id),
  KEY idx_commentaires_version (version_id),
  CONSTRAINT fk_commentaires_version FOREIGN KEY (version_id) REFERENCES versions_memoires(version_id) ON DELETE CASCADE,
  CONSTRAINT fk_commentaires_encadreur FOREIGN KEY (encadreur_id) REFERENCES encadreurs(encadreur_id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

-- Créer un compte administrateur après l'inscription d'un utilisateur :
-- UPDATE users SET user_role = 'ADMIN' WHERE user_email = 'admin@exemple.com';
