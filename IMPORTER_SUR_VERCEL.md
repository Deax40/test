# 🚀 Comment importer le .env sur Vercel

## Méthode 1: Import automatique (RECOMMANDÉ)

### Étape 1: Aller sur Vercel
1. Ouvrez https://vercel.com/dashboard
2. Sélectionnez votre projet: **test-beta-ivory-52**
3. Cliquez sur **Settings** (en haut)
4. Dans le menu de gauche: **Environment Variables**

### Étape 2: Supprimer les anciennes variables (IMPORTANT)
Avant d'importer, **supprimez** ces variables si elles existent:
- POSTGRES_URL
- POSTGRES_PRISMA_URL
- STORAGE_POSTGRES_URL
- STORAGE_PRISMA_DATABASE_URL
- STORAGE_DATABASE_URL

Cliquez sur l'icône **poubelle** (🗑️) à droite de chaque variable.

### Étape 3: Importer le fichier .env.vercel
1. En haut à droite, cliquez sur **"Import from .env"** ou **"..."** → **"Import"**
2. Sélectionnez le fichier **`.env.vercel`** depuis votre ordinateur
3. **IMPORTANT**: Cochez les 3 environnements:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Cliquez **"Import"**

### Étape 4: Vérifier les variables importées
Vous devriez voir:
- ✅ DATABASE_URL
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET
- ✅ PRISMA_ACCELERATE_URL

### Étape 5: Redéployer
1. En haut à droite, cliquez sur **Deployments**
2. Sur le dernier déploiement, cliquez sur **"..."** → **"Redeploy"**
3. Attendez 2-3 minutes

---

## Méthode 2: Copier-coller manuel (si import ne marche pas)

Si Vercel ne propose pas l'import, copiez-collez manuellement:

### Variable 1
**Name:** `DATABASE_URL`
**Value:** `postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require`
**Environments:** Production + Preview + Development

### Variable 2
**Name:** `NEXTAUTH_URL`
**Value:** `https://test-beta-ivory-52.vercel.app`
**Environments:** Production + Preview + Development

### Variable 3
**Name:** `NEXTAUTH_SECRET`
**Value:** `fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=`
**Environments:** Production + Preview + Development

### Variable 4
**Name:** `PRISMA_ACCELERATE_URL`
**Value:** `prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4`
**Environments:** Production + Preview + Development

---

## ✅ Tester après redéploiement

### Test 1: Variables configurées
```
https://test-beta-ivory-52.vercel.app/api/debug/check-env
```
**Attendu:** `"overallStatus": "✅ All required variables configured"`

### Test 2: Base de données
```
https://test-beta-ivory-52.vercel.app/api/debug/db-test
```
**Attendu:** `"overallStatus": "✅ ALL TESTS PASSED"`

### Test 3: Application complète
1. https://test-beta-ivory-52.vercel.app/login
2. Connectez-vous
3. Scannez un outil
4. Modifiez lieu/état
5. Sauvegardez
6. **Rechargez la page**
7. **Les modifications doivent persister!** ✅

---

## ⚠️ IMPORTANT

Après l'import, vérifiez que `NEXTAUTH_URL` est bien:
```
https://test-beta-ivory-52.vercel.app
```

Et **PAS** `http://localhost:3002`!

Si c'est localhost, modifiez-le manuellement.

---

## 🎉 Résultat attendu

Avec ces 4 variables correctement configurées, votre application devrait:
- ✅ Se connecter à la base de données
- ✅ Permettre l'authentification
- ✅ Sauvegarder les modifications
- ✅ Persister les données après rechargement

**C'est tout! Ça devrait enfin marcher!** 🚀
