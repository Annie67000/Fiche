-- =====================================================
-- ROLES ET UTILISATEURS
-- =====================================================

-- Supprimer les utilisateurs existants s'ils existent (pour recréation)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'payroll_user') THEN
        DROP ROLE payroll_user;
    END IF;
END
$$;

-- Créer le rôle user (select, insert uniquement - pas de update, delete)
CREATE ROLE payroll_user LOGIN PASSWORD 'payroll_user_pass';

-- =====================================================
-- DROITS POUR L'UTILISATEUR USER (select + insert uniquement)
-- =====================================================

-- Connexion à la base
GRANT CONNECT ON DATABASE annie_db TO payroll_user;

-- Usage sur le schéma public
GRANT USAGE ON SCHEMA public TO payroll_user;

-- SELECT sur toutes les tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO payroll_user;

-- INSERT sur toutes les tables
GRANT INSERT ON ALL TABLES IN SCHEMA public TO payroll_user;

-- Séquences (pour auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO payroll_user;

-- Privileges par défaut pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT ON TABLES TO payroll_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO payroll_user;

-- =====================================================
-- NOTES
-- =====================================================
-- L'utilisateur 'payroll_user' a uniquement:
--   - SELECT: lire les données
--   - INSERT: créer de nouvelles entrées
--   - USAGE on sequences: pour les auto-increment
--
-- Il n'a PAS:
--   - UPDATE: modifier les données
--   - DELETE: supprimer les données
--   - DDL: créer/modifier des tables