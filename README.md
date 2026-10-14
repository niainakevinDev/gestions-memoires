# Gestion des mémoires universitaires

Application web de gestion des mémoires universitaires construite avec React, Vite, Tailwind CSS, Node.js, Express et MySQL.

## Fonctionnalités incluses

- Inscription et connexion des étudiants avec mot de passe haché et jeton JWT.
- Gestion du profil étudiant et changement du mot de passe.
- Création et modification du mémoire par son étudiant associé.
- Dépôt de versions PDF (10 Mo maximum), historique et téléchargement contrôlé.
- Commentaires des encadreurs sur les versions et changement de statut (`SOUMISE`, `EN_REVISION`, `VALIDEE`, `REJETEE`).
- Administration : création et liste des encadreurs, statistiques, consultation des mémoires, affectation et retrait des encadreurs.
- Planification des soutenances (date, lieu, jury, statut, remarques), modification et suppression.
- Affichage des soutenances associées à l'étudiant ou à l'encadreur concerné.

## Prérequis

- Node.js récent (recommandé : Node.js 20 ou plus récent).
- MySQL 8 ou compatible.

## Installation

1. Ouvrir un terminal dans le dossier `gestions-memoires`.
2. Créer la base et les tables en important `database/schema.sql` dans MySQL. Le script utilise `CREATE TABLE IF NOT EXISTS`, donc il ne remplace pas les tables déjà existantes ; il ajoute notamment la table `soutenances` si elle manque.
3. Copier `backend/.env.example` vers `backend/.env` et renseigner les identifiants MySQL ainsi qu'une valeur `JWT_SECRET` privée et longue. Ne jamais publier le fichier `.env`.
4. Installer les dépendances :

   ```bash
   npm run install:all
   ```

5. Démarrer le backend dans un terminal :

   ```bash
   npm run dev:backend
   ```

6. Démarrer le frontend dans un deuxième terminal :

   ```bash
   npm run dev:frontend
   ```

7. Ouvrir l'adresse Vite affichée dans le terminal, généralement `http://localhost:5173`.

Le backend écoute par défaut sur `http://localhost:3000`. Pour utiliser une autre adresse API côté frontend, définir `VITE_API_URL` dans `frontend/.env` (par exemple `VITE_API_URL=http://localhost:3000`), puis redémarrer Vite.

## Créer un compte administrateur

L'inscription publique crée un compte étudiant. Inscrire d'abord un compte via l'interface, puis promouvoir ce compte dans MySQL en adaptant l'adresse email :

```sql
USE gestion_memoires;
UPDATE users SET user_role = 'ADMIN' WHERE user_email = 'admin@exemple.com';
```

Ne pas utiliser cette instruction avec un email qui ne vous appartient pas. Pour créer les comptes encadreurs, se connecter avec un compte administrateur et utiliser la page « Encadreurs ».

## Stockage des PDF

Les fichiers sont conservés dans `backend/storage/memoires/`. Le dossier doit être accessible en écriture par le processus Node.js. Les PDF existants dans cette archive sont des fichiers déjà présents dans le projet ; ils ne sont pas nécessaires au fonctionnement neuf de l'application.

## Notes de configuration

- Le backend utilise les variables de `backend/.env`.
- Le frontend utilise `VITE_API_URL` si cette variable est définie, sinon `http://localhost:3000`.
- Le schéma fourni est un point de départ pour une installation neuve. Si la base existe déjà, faire une sauvegarde avant toute migration et vérifier que les colonnes correspondent aux requêtes actuelles.
- Avant un déploiement public, prévoir une configuration CORS limitée au domaine autorisé, HTTPS, une gestion de secrets appropriée, des sauvegardes MySQL et une revue de sécurité complète.
