# 🔧 Guide de dépannage Vercel

## ❌ Erreur 413 - Requête trop grande

### Symptômes
- Console : `Failed to load resource: the server responded with a status of 413`
- Photos ne s'uploadent pas
- Modifications échouent silencieusement

### Causes
1. **Photos trop volumineuses** : Vercel a une limite de **4.5MB** par requête
2. **Pas de compression** : Images envoyées sans compression

### ✅ Solutions implémentées

#### 1. Compression automatique des images
- Fichier : `lib/image-compression.js`
- Compresse les images à **< 1MB**
- Résolution max : **1920px**
- Qualité JPEG adaptative (0.3 à 0.8)

#### 2. Configuration Next.js
- Fichier : `next.config.mjs`
- Body size limit : **4MB**

#### 3. Configuration des routes API
- Routes Care et Commun configurées
- Runtime : `nodejs`
- Max duration : **30 secondes**

#### 4. Configuration Vercel
- Fichier : `vercel.json`
- Mémoire : **1024 MB**
- Timeout : **30 secondes**

### Test
```javascript
// La compression devrait afficher dans la console :
"Photo compressed successfully"
"Image compressed: 2500KB → 850KB"
```

## ❌ Données non sauvegardées

### Symptômes
- Scan réussi mais changements perdus au rechargement
- Modifications disparaissent
- Photos non retrouvées

### Causes
1. **Filesystem en lecture seule** sur Vercel
2. **Pas de persistance** dans la base de données

### ✅ Solutions implémentées

#### 1. Migration vers Prisma
- **Care Tools** : `prisma.tool.upsert()` à chaque modification
- **Commun Tools** : `prisma.log.create()` à chaque scan
- **Photos** : Stockées en `BYTEA` dans PostgreSQL

#### 2. Détection d'environnement
```javascript
if (process.env.VERCEL) {
  // Skip filesystem writes
  return
}
```

#### 3. Double système
- **Mémoire** : Pour lecture rapide
- **Base de données** : Pour persistance

### Vérification
```bash
# Tester la connexion
node test-db-connection.js

# Vérifier la BDD
npx prisma studio
```

## ❌ Erreur de permissions caméra

### Symptômes
- Console : `NotAllowedError: Permission dismissed`
- Scanner QR ne fonctionne pas

### Causes
1. **HTTPS requis** : La caméra nécessite HTTPS
2. **Permissions refusées** par l'utilisateur
3. **Navigateur non compatible**

### Solutions

#### Sur Vercel (Production)
✅ HTTPS automatique - Fonctionne

#### En local (Development)
1. Utiliser `https://localhost:3000` au lieu de `http://`
2. Ou accepter les permissions caméra dans le navigateur

#### Permissions
1. Chrome : Paramètres > Confidentialité > Paramètres de site > Caméra
2. Safari : Préférences > Sites web > Caméra
3. Firefox : Préférences > Vie privée > Permissions > Caméra

## ❌ Variables d'environnement manquantes

### Symptômes
- Erreur de connexion BDD
- NextAuth ne fonctionne pas
- Erreur 500 sur les API

### Solutions

#### Vérifier Vercel Dashboard
Settings → Environment Variables → Vérifier :

```bash
✅ DATABASE_URL
✅ PRISMA_ACCELERATE_URL
✅ NEXTAUTH_URL (avec vraie URL Vercel)
✅ NEXTAUTH_SECRET
```

#### Tester localement
```bash
# Vérifier .env
cat .env

# Tester connexion
node test-db-connection.js
```

## ❌ Build échoue sur Vercel

### Symptômes
- Deployment failed
- Erreur Prisma
- Module not found

### Solutions

#### 1. Générer Prisma Client
Ajouter dans `package.json` :
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build"
  }
}
```

#### 2. Vérifier les dépendances
```bash
npm install
npm run build
```

#### 3. Logs Vercel
Projet → Deployments → [Dernier] → Logs

## 🚀 Checklist de déploiement

### Avant de déployer

- [ ] Variables d'environnement configurées sur Vercel
- [ ] `NEXTAUTH_URL` mis à jour avec vraie URL
- [ ] Base de données Prisma accessible
- [ ] `npx prisma db push` exécuté
- [ ] Code commité et poussé sur GitHub

### Après déploiement

- [ ] Scanner un QR code → Fonctionne
- [ ] Modifier l'état → Persisté
- [ ] Upload une photo (< 5MB) → Réussi
- [ ] Recharger la page → Données conservées
- [ ] Email de notification → Reçu (si configuré)

## 📊 Limites Vercel

| Ressource | Limite Hobby | Limite Pro |
|-----------|--------------|------------|
| Body size | 4.5 MB | 4.5 MB |
| Timeout | 10s | 60s |
| Mémoire | 1024 MB | 3008 MB |
| Bandwidth | 100 GB/mois | 1 TB/mois |

**Important** : Les photos > 4MB ne peuvent pas être uploadées sur le plan Hobby.

## 🔍 Debugging

### Logs Vercel
```
Projet → Deployments → [Dernier] → Logs
```

### Logs en temps réel
```bash
vercel logs --follow
```

### Console navigateur
F12 → Console → Rechercher :
- Erreurs 413
- "Photo compressed"
- "Failed to persist"

### Base de données
```bash
# Local
npx prisma studio

# Vercel (via Prisma Data Platform)
# Aller sur https://console.prisma.io
```

## 📞 Support

### Erreur persistante ?

1. **Vérifier les logs** :
   - Console navigateur (F12)
   - Logs Vercel
   - Logs Prisma

2. **Tester localement** :
   ```bash
   npm run dev
   # Tester les mêmes actions
   ```

3. **Vérifier la BDD** :
   ```bash
   node test-db-connection.js
   npx prisma studio
   ```

4. **Consulter la documentation** :
   - `CORRECTIONS_VERCEL.md`
   - `CONFIGURATION_VERCEL.md`
   - `RESUME_CORRECTIONS.md`

## ✅ Résultat attendu

Après toutes les corrections :

1. ✅ Photos compressées automatiquement
2. ✅ Upload < 1MB fonctionne toujours
3. ✅ Données persistées dans PostgreSQL
4. ✅ Pas d'erreur 413
5. ✅ Scans sauvegardés correctement
6. ✅ Photos visibles dans les emails

**Tout devrait fonctionner parfaitement ! 🎉**
