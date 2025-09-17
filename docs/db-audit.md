# Audit de la base de données existante

## Résumé rapide
- **Type de base** : PostgreSQL (via Prisma)
- **Problèmes critiques identifiés** :
  - Table `CommonTool` utilisée en production avec des champs temporels stockés en texte.
  - Schéma des outils dupliqué entre `Tool` et `CommonTool` → source d'incohérences.
  - Absence de contraintes de clé étrangère et de validations sur plusieurs relations.
  - Historique des migrations Prisma très verbeux et difficile à rejouer (succession d'ajouts/suppressions sur les mêmes colonnes).

## Détails par table
### `User`
- Champs principaux présents (`username`, `passwordHash`, `role`, `createdAt`).
- Relation `logs`, `toolLogs`, `habilitations` encore définies mais obsolètes pour l'application QR → surcharge inutile.
- Pas de colonne `updatedAt` → difficile de tracer les modifications.

### `Log` / `ToolLog`
- Tables héritées d'une ancienne fonctionnalité de journalisation.
- Colonnes (`photo`, `transporteur`, etc.) non utilisées dans l'app actuelle.
- Génèrent des relations optionnelles (`createdBy`) qui ralentissent Prisma lors des requêtes `include`.

### `Tool`
- Contient déjà `hash` et `qrData` (dupliqués) ainsi qu'un champ `category`.
- N'est **plus utilisée** par le code applicatif actuel qui s'appuie sur `CommonTool`.
- Colonnes `lastScanLieu`, `lastScanEtat` jamais alimentées.

### `CommonTool`
- Table réellement exploitée par `/scan` et `/commun`.
- Colonnes principales (`contact`, `weight`, `date`, `lastUser`, `dimensions`).
- **Problème majeur** : `lastScanAt` et `updatedAt` stockés en texte. Cela rend impossibles les tris/filtrages temporels et crée des bugs de fuseaux horaires.
- `updatedBy` stocke un nom libre → absence de référence au compte utilisateur.

### `Certification`, `MachineRevision`, `Habilitation`
- Présentes dans le schéma mais non utilisées par les écrans demandés.
- Certaines migrations ajoutent/suppriment des colonnes plusieurs fois (ex. `Certification`).

## Origine probable des bugs
1. **Surcharge du schéma** : trop d'anciennes tables/colonnes non maintenues.
2. **Champs temporels en texte** (`CommonTool.lastScanAt`, `CommonTool.updatedAt`) entraînant des erreurs d'ordonnancement et de comparaison.
3. **Incohérences entre `Tool` et `CommonTool`** : certains scripts (ex. `scripts/seed.mjs`) insèrent dans `Tool` alors que l'API lit `CommonTool` → données invisibles.
4. **Absence de contraintes sur les rôles** : historiquement, la couche API ne vérifiait pas l'authentification, ouvrant la porte à des modifications anonymes.

## Plan de remédiation proposé
### 1. Nettoyage du schéma Prisma
- Supprimer les modèles inutilisés (`Log`, `ToolLog`, `Certification`, `MachineRevision`).
- Étendre le modèle `User` avec `updatedAt` et restreindre `role` à un enum (`TECH`, `ADMIN`).
- Remplacer `CommonTool` par un modèle `Tool` unique contenant :
  ```prisma
  model Tool {
    id          String   @id @default(cuid())
    hash        String   @unique
    name        String
    description String?
    contact     String?
    weight      String?
    dimensions  String?
    lastUser    String?
    lastScanAt  DateTime?
    lastScanBy  String?
    updatedAt   DateTime @updatedAt
    updatedBy   String?
    createdAt   DateTime @default(now())
  }
  ```
- Re-générer une migration `prisma migrate dev --name rbac_reset` pour reconstruire proprement la base.

### 2. Migration des données existantes
1. **Export** des enregistrements de `CommonTool` vers un CSV (`COPY` SQL) pour conserver les valeurs saisies.
2. **Script Node/Prisma** de réimport :
   - Normaliser les dates (`new Date(value)` lorsque possible, sinon laisser `null`).
   - Injecter les données dans la nouvelle table `Tool` (champ `description` optionnel pour stocker `date` ou informations diverses).
3. **Migration des utilisateurs** :
   - Conserver `username`, `passwordHash`, `role`.
   - Vérifier l'unicité des emails.

### 3. Renforcement des contrôles applicatifs
- Centraliser l'accès à Prisma (déjà fait via `lib/prisma.js`).
- Vérifier systématiquement le rôle via NextAuth dans les routes API (implémenté dans cette livraison).
- Remplacer les champs libres (`updatedBy`) par l'`id` utilisateur et afficher le nom côté interface.
- Ajouter des validations Zod sur les payloads (implémenté sur `/api/scan/start` et `/api/tools/[hash]`).

### 4. Tests & déploiement
- Lancer `npm run prisma:dev` sur une base de test pour vérifier les migrations.
- Exécuter les tests manuels :
  1. Connexion TECH puis scan d'un QR → outil renvoyé, formulaire éditable.
  2. Connexion ADMIN → accès à `/admin` uniquement pour ce rôle.
  3. Vérifier que `/commun` reflète immédiatement les modifications après sauvegarde.
- Mettre en place une sauvegarde de la base avant migration finale.

## Conclusion
La base actuelle fonctionne mais repose sur des compromis (champs texte, tables héritées). Une migration vers un schéma simplifié — centrée sur `User` et `Tool` — permettra :
- Une maintenance plus simple.
- Des requêtes plus fiables (types date réels, relations explicites).
- Une base saine pour les futures fonctionnalités d'administration.
