# 🔍 Instructions de débogage - Vercel

## ✅ Corrections appliquées

1. **Logs détaillés** ajoutés partout
2. **Erreurs affichées** à l'utilisateur (plus de silence)
3. **Filesystem writes** supprimés (Commun tools)
4. **User lookup** corrigé (username/name/email)

## 🧪 Tester en local (marche parfaitement)

```bash
# Test de connexion Prisma
node test-prisma-save.js

# Lancer l'app
npm run dev
```

## 🚀 Sur Vercel - Comment déboguer

### Étape 1 : Vérifier les variables d'environnement

**OBLIGATOIRES** :
- `NEXTAUTH_URL` = `https://test-beta-ivory-52.vercel.app`
- `NEXTAUTH_SECRET` = `fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=`
- `DATABASE_URL` = `postgresql://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require`

### Étape 2 : Après redéploiement

1. **Ouvrez votre site** : https://test-beta-ivory-52.vercel.app
2. **Ouvrez la console** (F12)
3. **Connectez-vous**
4. **Testez la session** :
   ```javascript
   fetch('/api/session').then(r => r.json()).then(console.log)
   ```
   - ✅ Devrait montrer : `{ user: { name: "...", role: "..." } }`
   - ❌ Si `401` : NEXTAUTH_URL manquant ou incorrect

### Étape 3 : Scanner et regarder les logs

1. **Scanner un QR** (ou saisir manuellement)
2. **Modifier l'état** (ex: RAS → Bon état)
3. **Cliquer "Enregistrer"**
4. **Regarder la console** :

**Logs attendus si ça marche** :
```
✅ Save successful: { tool: {...} }
```

**Si erreur** :
```
❌ API Error: { error: "...", details: "..." }
```

### Étape 4 : Vérifier les logs Vercel

1. Allez sur **Vercel Dashboard** → Votre projet
2. **Deployments** → Cliquez sur le dernier
3. **Logs** → Cherchez :

**Logs Care Tools** :
```
[CARE] Attempting to save to database: ABC123
[CARE] Database save SUCCESS: cmg...
```

**Logs Commun Tools** :
```
[COMMUN] User found: xxx xxx
[COMMUN] Log created successfully: xxx
```

**Si erreur** :
```
[CARE] Database save FAILED: ...
[COMMUN] Error creating log entry: ...
```

## 🔍 Erreurs courantes et solutions

### ❌ "Database save failed"

**Cause** : DATABASE_URL incorrect ou Prisma pas accessible

**Solution** :
1. Vérifier `DATABASE_URL` sur Vercel
2. Vérifier que la base est accessible depuis Vercel
3. Vérifier les logs Vercel pour l'erreur exacte

### ❌ "User not found in database"

**Cause** : L'utilisateur connecté n'existe pas dans la table `User`

**Solution** :
```sql
-- Vérifier les utilisateurs
SELECT id, username, name, email FROM "User";
```

Si vide, créer un utilisateur :
```sql
INSERT INTO "User" (id, username, name, email, "passwordHash", role)
VALUES ('xxx', 'admin', 'Admin', 'admin@example.com', 'hash', 'ADMIN');
```

### ❌ "Session expirée"

**Cause** : Token expired ou NEXTAUTH_URL incorrect

**Solution** :
1. Vérifier `NEXTAUTH_URL` = exactement votre URL Vercel
2. Pas de `/` à la fin
3. `https://` (pas `http://`)

### ❌ "401 Unauthorized"

**Cause** : NextAuth ne fonctionne pas

**Solution** :
1. Vérifier `NEXTAUTH_SECRET` est configuré
2. Vérifier `NEXTAUTH_URL` est correct
3. Redéployer après ajout des variables

## 📊 Test complet

### Checklist de test :

1. [ ] Variables d'environnement configurées
2. [ ] Redéploiement effectué
3. [ ] Build réussi (✅ Ready)
4. [ ] Connexion fonctionne
5. [ ] Session API retourne user
6. [ ] Scanner fonctionne (caméra ou manuel)
7. [ ] Modification enregistrée
8. [ ] Pas d'erreur dans console
9. [ ] Rechargement → Données conservées
10. [ ] Logs Vercel montrent SUCCESS

## 🆘 Si rien ne fonctionne

**Envoyez-moi** :

1. **Console navigateur** (F12 → Console) → Screenshot
2. **Logs Vercel** → Copier les logs complets
3. **Variables d'environnement** → Liste (sans les secrets)

## ✨ Une fois que ça marche

Vous devriez voir dans la console :
```
✅ Save successful
[CARE] Database save SUCCESS
```

Et les données seront **persistées** même après rechargement ! 🎉
