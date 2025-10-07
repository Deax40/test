# 🔧 Corrections pour Vercel - Persistance des données

## ⚠️ Problèmes identifiés

### 1. **Système de fichiers en lecture seule**
Sur Vercel, le système de fichiers est **en lecture seule** (sauf `/tmp`). Les tentatives d'écriture avec `fs.writeFileSync()` échouent silencieusement.

### 2. **Photos non sauvegardées**
Les photos de problèmes étaient stockées dans `uploads/` sur le disque, ce qui ne fonctionne pas sur Vercel.

### 3. **Modifications non persistées**
Les modifications des outils (scans, états, etc.) étaient sauvegardées dans des fichiers JSON (`care-data.json`, `commun-data.json`), perdus à chaque redémarrage.

## ✅ Solutions implémentées

### 1. **Migration vers Prisma Database**

#### Schéma mis à jour
- Ajout de `problemPhotoBuffer` (Bytes) pour stocker les photos
- Ajout de `problemPhotoType` (String) pour le type MIME
- Les champs `problemPhotoPath` sont conservés pour rétrocompatibilité

#### Routes API modifiées

**Care Tools** (`app/api/care/[hash]/route.js`) :
- Photos stockées en tant que `Buffer` dans la BDD
- Chaque modification crée/met à jour l'outil dans Prisma
- Double système : mémoire (rapide) + BDD (persistant)

**Commun Tools** (`app/api/commons/[hash]/route.js`) :
- Photos stockées dans le modèle `Log`
- Chaque scan crée une entrée dans la BDD
- État et lieu enregistrés dans `Log`

### 2. **Détection de l'environnement**

Les fonctions `persistState()` vérifient maintenant `process.env.VERCEL` :
```javascript
if (process.env.VERCEL) {
  return // Skip filesystem operations on Vercel
}
```

### 3. **Flux de données**

#### Avant (❌ Ne fonctionnait pas sur Vercel)
```
Scan → Mémoire → fs.writeFileSync() → 💥 Échec
Photo → uploads/ → 💥 Échec
```

#### Après (✅ Fonctionne sur Vercel)
```
Scan → Mémoire → Prisma.upsert() → ✅ PostgreSQL
Photo (Buffer) → Prisma → ✅ PostgreSQL (BYTEA)
```

## 📊 Structure de la base de données

### Care Tools
```sql
Tool {
  hash                 String (unique)
  name                 String
  lastScanAt           DateTime
  lastScanUser         String
  lastScanLieu         String
  lastScanEtat         String
  problemDescription   String
  problemPhotoBuffer   Bytes      -- Photo stockée ici
  problemPhotoType     String     -- image/jpeg, image/png, etc.
  ...
}
```

### Commun Tools (via Log)
```sql
Log {
  id          String
  qrData      String    -- Hash de l'outil Commun
  lieu        String
  date        DateTime
  actorName   String
  etat        String
  probleme    String
  photo       Bytes     -- Photo stockée ici
  photoType   String
  ...
}
```

## 🚀 Déploiement sur Vercel

### Variables d'environnement requises

Dans Vercel Dashboard → Settings → Environment Variables :

```bash
# Base de données
DATABASE_URL=postgres://...
PRISMA_ACCELERATE_URL=prisma+postgres://...

# NextAuth
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXTAUTH_SECRET=Mroor2+glerLs0H5G5B6rtSCr9tA1Wgqq8BcAUpKVa8=

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=julien.civi@gmail.com
```

### Vérifications après déploiement

1. **Tester un scan** :
   - Scanner un QR code Care ou Commun
   - Modifier l'état
   - Vérifier que la modification est persistée

2. **Tester une photo** :
   - Signaler un problème avec photo
   - Vérifier que la photo est bien uploadée
   - Vérifier que l'email contient la photo

3. **Vérifier la BDD** :
   ```bash
   npx prisma studio
   # Ou via Prisma Data Platform
   ```

## 🔍 Debugging

### Logs Vercel
Allez dans : Projet → Deployments → [Dernier déploiement] → Logs

### Erreurs courantes

#### "Failed to persist to database"
- Vérifier que `DATABASE_URL` est correctement configuré
- Vérifier la connexion avec `npx prisma studio`

#### "Photo upload failed"
- Vérifier que le champ `problemPhotoBuffer` existe dans la BDD
- Relancer `npx prisma db push` si nécessaire

#### "Tool not found"
- Les outils Care doivent d'abord être créés dans Prisma
- Utiliser le script de seed ou importer depuis les fichiers

## 📝 Notes importantes

1. **Double système** :
   - Mémoire (rapide pour lecture)
   - BDD (persistant pour écriture)

2. **Rétrocompatibilité** :
   - Le système fonctionne toujours en local avec fichiers
   - Sur Vercel, seule la BDD est utilisée

3. **Migration de données** :
   - Les données existantes en local doivent être migrées vers Prisma
   - Utiliser le script de seed pour importer les Care tools

4. **Performance** :
   - Prisma Accelerate améliore les performances
   - Photos en BYTEA (efficace jusqu'à quelques MB)

## ✨ Résultat

- ✅ Photos persistées dans PostgreSQL
- ✅ Modifications persistées entre redémarrages
- ✅ Système compatible Vercel
- ✅ Rétrocompatible avec le système local
- ✅ Aucune perte de données

## 🆘 Support

En cas de problème :
1. Vérifier les logs Vercel
2. Tester la connexion BDD : `node test-db-connection.js`
3. Vérifier Prisma Studio : `npx prisma studio`
4. Consulter `RESUME_CONFIGURATION.md` pour la configuration complète
