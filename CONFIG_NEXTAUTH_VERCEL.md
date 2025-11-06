# 🔑 Configuration NEXTAUTH_URL sur Vercel

## ❌ Problème : Aucune sauvegarde possible

Si vos modifications ne se sauvent pas, c'est probablement que **NEXTAUTH_URL est manquant ou incorrect**.

## ✅ Solution rapide

### Étape 1 : Trouver votre URL Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Ouvrez votre projet
3. Cliquez sur "Visit" ou notez l'URL affichée

**Exemple** : `https://engel-qr-admin.vercel.app`

### Étape 2 : Ajouter NEXTAUTH_URL

1. Projet Vercel → **Settings** → **Environment Variables**
2. Cliquez sur **Add New**
3. Remplissez :

```
Name: NEXTAUTH_URL
Value: https://VOTRE-URL-EXACTE.vercel.app
```

⚠️ **Important** :
- Ne mettez PAS de `/` à la fin
- Utilisez `https://` (pas `http://`)
- Copiez l'URL exacte depuis Vercel

4. Sélectionnez : **Production**, **Preview**, **Development**
5. Cliquez **Save**

### Étape 3 : Redéployer

1. Allez dans **Deployments**
2. Cliquez sur les `...` du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez que le build soit ✅ Ready

## 🧪 Tester la configuration

Après redéploiement, ouvrez votre site et testez :

### Test 1 : Vérifier la session
Ouvrez la console (F12) et tapez :
```javascript
fetch('/api/session')
  .then(r => r.json())
  .then(console.log)
```

✅ **Si vous voyez** : `{ user: { name: "...", role: "..." } }`
→ Parfait, NextAuth fonctionne !

❌ **Si vous voyez** : `401 Unauthorized`
→ NEXTAUTH_URL est manquant ou incorrect

### Test 2 : Scanner et sauvegarder
1. Scanner un QR code (ou utiliser la saisie manuelle)
2. Modifier l'état
3. Cliquer "Enregistrer"
4. Recharger la page
5. ✅ La modification doit être conservée

## 📋 Toutes les variables requises

Vérifiez que vous avez TOUTES ces variables sur Vercel :

```bash
✅ DATABASE_URL=postgresql://...
✅ NEXTAUTH_URL=https://votre-domaine.vercel.app
✅ NEXTAUTH_SECRET=fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=
```

Variables optionnelles (mais recommandées) :
```bash
PRISMA_ACCELERATE_URL=prisma+postgres://...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=julien.civi@gmail.com
```

## 🔍 Debugging

### Erreur : "Session expirée"
→ NEXTAUTH_URL incorrect ou manquant

### Erreur : "Unauthorized"
→ NEXTAUTH_SECRET manquant

### Erreur : Connexion échoue
→ DATABASE_URL incorrect

### Logs Vercel
Projet → Deployments → [Dernier] → Logs
Recherchez : "NEXTAUTH", "session", "unauthorized"

## ✨ C'est tout !

Une fois NEXTAUTH_URL configuré et redéployé, tout devrait fonctionner parfaitement ! 🎉
