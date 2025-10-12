# ✅ SOLUTION SIMPLE - Variables Vercel

## Le problème

Vous avez:
- ✅ `STORAGE_POSTGRES_URL` (créée automatiquement par Vercel Prisma)
- ❌ Mais l'app cherche `DATABASE_URL`

## 🎯 Solution la plus simple

### Sur Vercel Dashboard:

1. **Settings** → **Environment Variables**

2. Cliquez **"Add New"**

3. Remplissez:
   - **Name:** `DATABASE_URL`
   - **Value:** Copiez EXACTEMENT la même valeur que `STORAGE_POSTGRES_URL`

   Normalement c'est:
   ```
   postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
   ```

4. **Environments:** Cochez Production + Preview + Development

5. Cliquez **"Save"**

6. Ajoutez aussi si absentes:
   - `NEXTAUTH_URL` = `https://test-beta-ivory-52.vercel.app`
   - `NEXTAUTH_SECRET` = `fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=`

7. **Redeploy**

---

## ✅ Résultat final sur Vercel

Vous devez avoir ces variables (minimum):

```
DATABASE_URL = postgres://cc319d...  (COPIE de STORAGE_POSTGRES_URL)
NEXTAUTH_URL = https://test-beta-ivory-52.vercel.app
NEXTAUTH_SECRET = fyVP5Zfgie...

STORAGE_POSTGRES_URL = postgres://cc319d... (auto-créée par Vercel)
STORAGE_PRISMA_DATABASE_URL = ... (auto-créée par Vercel)
STORAGE_DATABASE_URL = ... (auto-créée par Vercel)
```

Les variables `STORAGE_*` sont créées par Vercel, **ne les supprimez pas**.

`DATABASE_URL` est celle que l'app utilise, elle doit avoir **la même valeur** que `STORAGE_POSTGRES_URL`.

---

## 🧪 Tester

Après redéploiement:

1. https://test-beta-ivory-52.vercel.app/api/debug/check-env
   → Devrait afficher: `✅ All required variables configured`

2. https://test-beta-ivory-52.vercel.app/api/debug/db-test
   → Devrait afficher: `✅ ALL TESTS PASSED`

3. Testez l'application complète

---

**C'est juste une question d'ajouter `DATABASE_URL` avec la même valeur que `STORAGE_POSTGRES_URL`!**
