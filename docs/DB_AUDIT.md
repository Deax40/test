# Audit de la base existante

## Constat initial

La base fournie au démarrage contenait les modèles Prisma suivants :

- `User` (id, email, name, createdAt, updatedAt)
- `Scan` (table `SCAN`) regroupant les informations saisies lors d'un scan
- `Common` (table `COMMON`) censée refléter l'état le plus récent de chaque outil

Plusieurs problèmes ont été identifiés :

1. **Absence d'authentification forte** : la table `User` n'intégrait ni mot de passe ni rôle, empêchant tout contrôle d'accès.
2. **Structure redondante** : `Scan` et `Common` dupliquaient les mêmes colonnes (nom, statut, localisation, etc.) sans contrainte d'intégrité.
3. **Manque de clé fonctionnelle** : les outils étaient identifiés uniquement par leur nom, sans référence au hash QR code.
4. **Pas de journalisation** : aucune trace des modifications n'était conservée, rendant impossible l'audit des interventions.
5. **Incohérences potentielles** : la synchronisation `Scan` → `Common` s'effectuait au niveau applicatif sans verrouillage ni validations côté serveur.

## Schéma cible

Le schéma a été repensé autour de deux concepts :

- `User` : utilisateur avec `passwordHash`, `role` (enum `ADMIN`/`TECH`) et métadonnées.
- `Tool` : outil identifié par un `hash` unique, enrichi de toutes les informations métier (description, statut, localisation, note...).
- `ToolHistory` : journal des modifications contenant l'utilisateur, le timestamp et les données avant/après.

Ce schéma supprime les tables `SCAN`/`COMMON` au profit d'une table unique cohérente et traçable. Les relations garantissent l'intégrité des données et facilitent l'implémentation du RBAC.

## Migration

L'ancien contenu n'étant pas exploitable tel quel, la migration a consisté à :

1. Créer le nouveau schéma Prisma (`users`, `tools`, `tool_history`).
2. Importer la liste officielle des outils fournie (hash + nom) dans la table `tools`.
3. Initialiser deux comptes (`admin@example.com`, `tech@example.com`) avec des mots de passe forts (hachés).
4. Implémenter un module unique de connexion à la base (`src/lib/db.js`) utilisé par l'ensemble du backend.

Cette base propre constitue désormais le point d'ancrage fiable pour l'application Next.js.
