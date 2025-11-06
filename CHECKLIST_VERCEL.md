# ✅ Checklist Variables Vercel

## 🎯 Ce que vous avez actuellement (MAUVAIS)

| Variable sur Vercel | Status | Action |
|---------------------|--------|---------|
| NEXTAUTH_URL | ✅ | **GARDER** mais vérifier = `https://test-beta-ivory-52.vercel.app` |
| NEXTAUTH_SECRET | ✅ | **GARDER** |
| POSTGRES_URL | ❌ | **SUPPRIMER** (mauvais nom) |
| POSTGRES_PRISMA_URL | ❌ | **SUPPRIMER** (mauvais nom) |
| STORAGE_POSTGRES_URL | ❌ | **SUPPRIMER** (mauvais nom) |
| STORAGE_PRISMA_DATABASE_URL | ❌ | **SUPPRIMER** (mauvais nom) |
| STORAGE_DATABASE_URL | ❌ | **SUPPRIMER** (mauvais nom) |
| DATABASE_URL | ⚠️ | **VÉRIFIER** la valeur (voir ci-dessous) |

---

## ✅ Ce que vous DEVEZ avoir

### 1. DATABASE_URL ⭐ CRITIQUE
```
DATABASE_URL=postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
```
**Sans cette variable avec le BON NOM, Prisma ne peut pas se connecter!**

### 2. NEXTAUTH_URL ⭐ CRITIQUE
```
NEXTAUTH_URL=https://test-beta-ivory-52.vercel.app
```
**PAS localhost! Doit être l'URL Vercel!**

### 3. NEXTAUTH_SECRET ⭐ CRITIQUE
```
NEXTAUTH_SECRET=fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=
```

### 4. PRISMA_ACCELERATE_URL (optionnel, pour performances)
```
PRISMA_ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4
```

---

## 📋 Actions à faire MAINTENANT

### Étape 1: Vérifier DATABASE_URL
1. Sur Vercel → Settings → Environment Variables
2. Cliquez sur **DATABASE_URL**
3. Vérifiez que la valeur est EXACTEMENT:
   ```
   postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
   ```
4. Si différent, cliquez **Edit** et corrigez

### Étape 2: Vérifier NEXTAUTH_URL
1. Cliquez sur **NEXTAUTH_URL**
2. Vérifiez que la valeur est:
   ```
   https://test-beta-ivory-52.vercel.app
   ```
3. **PAS `http://localhost:3002`!**

### Étape 3: Supprimer les variables inutiles
Supprimez (bouton poubelle à droite):
- ❌ POSTGRES_URL
- ❌ POSTGRES_PRISMA_URL
- ❌ STORAGE_POSTGRES_URL
- ❌ STORAGE_PRISMA_DATABASE_URL
- ❌ STORAGE_DATABASE_URL

Ces variables ont des mauvais noms et perturbent l'application.

### Étape 4: Ajouter PRISMA_ACCELERATE_URL (optionnel)
Si absent, cliquez **Add New** et ajoutez la variable ci-dessus.

### Étape 5: Redéployer
1. En haut à droite: **Deployments**
2. Dernier déploiement → **...** → **Redeploy**
3. Attendez 2-3 minutes

---

## 🧪 Tester après redéploiement

### Test 1: Vérifier les variables
```
https://test-beta-ivory-52.vercel.app/api/debug/check-env
```
**Attendu**: `"overallStatus": "✅ All required variables configured"`

### Test 2: Tester la base de données
```
https://test-beta-ivory-52.vercel.app/api/debug/db-test
```
**Attendu**: `"overallStatus": "✅ ALL TESTS PASSED"`

### Test 3: Tester l'application
1. Login: https://test-beta-ivory-52.vercel.app/login
2. Scanner un outil
3. Modifier lieu/état
4. Sauvegarder
5. Recharger la page
6. **Modifications doivent persister!** ✅

---

## 🎯 Le problème expliqué

```
❌ CE QUE VOUS AVIEZ:
App cherche: DATABASE_URL
Vercel a: STORAGE_POSTGRES_URL, POSTGRES_URL, etc.
Résultat: Prisma ne trouve pas la connexion → Erreur

✅ CE QU'IL FAUT:
App cherche: DATABASE_URL
Vercel a: DATABASE_URL
Résultat: Prisma se connecte → Tout marche!
```

**Les noms de variables DOIVENT correspondre EXACTEMENT!**

---

## 📞 Si ça ne marche toujours pas

Envoyez-moi une capture d'écran de:
1. Vercel → Settings → Environment Variables (toute la liste)
2. Le résultat de `/api/debug/check-env`
3. La console F12 quand vous essayez de sauvegarder

Mais normalement, avec les bonnes variables, **ça doit marcher!** 🎉
