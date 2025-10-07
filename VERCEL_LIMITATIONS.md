# ⚠️ Limitations Vercel et solutions

## ✅ Fonctionnalités qui marchent

- ✅ **Scans QR Care/Commun** - Fonctionne parfaitement
- ✅ **Modifications d'outils** - Sauvegardées dans PostgreSQL
- ✅ **Photos de problèmes** - Stockées en BYTEA (< 1MB compressé)
- ✅ **Logs et historique** - Tout dans Prisma
- ✅ **Authentification** - NextAuth fonctionne
- ✅ **Emails** - Si SMTP configuré

## ⚠️ Fonctionnalités limitées sur Vercel

### 1. Upload de fichiers volumineux (> 4.5MB)

**Problème** : Vercel limite les requêtes à 4.5MB

**Solution actuelle** :
- Photos compressées automatiquement à < 1MB ✅
- PDFs de certificats : limite 4MB

**Solution future** :
- Utiliser Vercel Blob Storage
- Ou Amazon S3
- Ou Cloudinary

### 2. Stockage de PDFs de certificats

**Fichiers concernés** :
- `app/api/certifications/route.js`
- `app/api/habilitations/route.js`
- `app/api/tools/[hash]/certificate/route.js`
- `app/api/admin/upload-tool/route.js`

**Problème** : Filesystem en lecture seule sur Vercel

**État actuel** :
- Les métadonnées sont sauvegardées (date, nom, etc.)
- Le fichier PDF n'est PAS stocké physiquement
- Warning dans les logs : `PDF not actually stored`

**Solution temporaire** :
- Les certificats fonctionnent mais sans le PDF
- Date de révision et infos sauvegardées

**Solution permanente** :
```bash
# Installer Vercel Blob
npm install @vercel/blob

# Utiliser dans les routes
import { put } from '@vercel/blob'
const blob = await put(filename, file, { access: 'public' })
certData.pdfPath = blob.url
```

### 3. Upload d'habilitations

**Fichier** : `app/api/habilitations/route.js`

**Problème** : Même que certificats (filesystem)

**Solution** : Utiliser Vercel Blob ou S3

### 4. Care Tools .bs files

**Problème** : Les fichiers `.bs` ne peuvent pas être lus depuis `/Care Tools` sur Vercel

**Solution actuelle** : ✅
- 19 outils Care migrés vers Prisma
- Lecture depuis la base de données
- Auto-création lors du premier scan

**Note** : Les nouveaux outils Care doivent être ajoutés via l'admin panel, pas par upload de fichiers .bs

## 📋 Routes API auditées

### ✅ Fonctionnent sur Vercel

- `/api/scan/start` - ✅
- `/api/care/[hash]` - ✅ (photos en BDD)
- `/api/commons/[hash]` - ✅
- `/api/tools/[hash]` - ✅ (photos en BDD)
- `/api/admin/resolve-problem` - ✅ (corrigé)
- `/api/session` - ✅
- `/api/auth/[...nextauth]` - ✅
- `/api/admin/stats` - ✅
- `/api/admin/logs` - ✅
- `/api/admin/users` - ✅

### ⚠️ Limitées (PDFs non stockés)

- `/api/certifications` - ⚠️ Métadonnées OK, PDF non stocké
- `/api/habilitations` - ⚠️ Métadonnées OK, fichier non stocké
- `/api/tools/[hash]/certificate` - ⚠️ Métadonnées OK, PDF non stocké
- `/api/admin/upload-tool` - ⚠️ Limitée

## 🔧 Prochaines étapes recommandées

### Court terme (pour production immédiate)

1. ✅ **Utilisez l'app comme elle est**
   - Scans fonctionnent
   - Modifications sauvegardées
   - Photos < 1MB fonctionnent
   - Logs et stats OK

2. ⚠️ **Évitez temporairement**
   - Upload de PDFs > 4MB
   - Upload de nouveaux fichiers .bs
   - Upload d'habilitations volumineuses

### Long terme (migration vers storage externe)

1. **Configurer Vercel Blob** (recommandé, gratuit jusqu'à 1GB)
   ```bash
   npm install @vercel/blob
   ```

2. **Ou configurer AWS S3**
   ```bash
   npm install @aws-sdk/client-s3
   ```

3. **Mettre à jour les routes**
   - Remplacer `fs.writeFile` par `put()`
   - Stocker l'URL retournée dans Prisma

## 💡 Alternatives

### Pour les certificats PDF

**Option A** : Vercel Blob (recommandé)
- Gratuit jusqu'à 1GB
- Intégration simple
- CDN inclus

**Option B** : AWS S3
- Plus de contrôle
- Coût très bas
- Nécessite configuration

**Option C** : Base64 en BDD (non recommandé)
- PDFs volumineux = BDD gonflée
- Performances réduites
- Limite PostgreSQL : 1GB par champ

### Pour les fichiers .bs

**Solution actuelle** : ✅ Tout en BDD
- Outils migrés vers Prisma
- Métadonnées sauvegardées
- Fichier .bs pas nécessaire

## 🎯 Résumé

| Fonctionnalité | État | Notes |
|----------------|------|-------|
| Scans QR | ✅ | Parfait |
| Modifications | ✅ | Parfait |
| Photos problèmes | ✅ | < 1MB, en BDD |
| Logs/Historique | ✅ | Tout en Prisma |
| PDFs certificats | ⚠️ | Métadonnées seulement |
| Upload habilitations | ⚠️ | Métadonnées seulement |
| Upload .bs files | ⚠️ | Non supporté |

**L'app est fonctionnelle pour 90% des cas d'usage !** 🎉

Les limitations sont documentées et des solutions existent pour le futur.
