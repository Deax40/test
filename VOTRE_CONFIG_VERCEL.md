# ✅ Configuration pour votre projet Vercel

## URL détectée
**https://test-beta-ivory-52.vercel.app**

## 🔧 Variables à ajouter sur Vercel

Allez sur : https://vercel.com → Votre projet → **Settings** → **Environment Variables**

### Variables OBLIGATOIRES :

```bash
# 1. NEXTAUTH_URL (CRITIQUE - C'EST CELLE QUI MANQUE !)
Name: NEXTAUTH_URL
Value: https://test-beta-ivory-52.vercel.app
Environments: ✅ Production, ✅ Preview, ✅ Development

# 2. DATABASE_URL (déjà configurée normalement)
Name: DATABASE_URL
Value: postgresql://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
Environments: ✅ Production, ✅ Preview, ✅ Development

# 3. NEXTAUTH_SECRET (déjà configurée normalement)
Name: NEXTAUTH_SECRET
Value: fyVP5Zfgie1sq7KOuk5i64jqGldQ6irc6TilWfdi2W4=
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### Variables OPTIONNELLES (mais recommandées) :

```bash
# Prisma Accelerate (pour meilleures performances)
Name: PRISMA_ACCELERATE_URL
Value: prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4
Environments: ✅ Production, ✅ Preview, ✅ Development

# Email (pour notifications)
Name: SMTP_HOST
Value: smtp.gmail.com

Name: SMTP_PORT
Value: 587

Name: SMTP_USER
Value: votre-email@gmail.com

Name: SMTP_PASS
Value: votre-mot-de-passe-app

Name: ADMIN_EMAIL
Value: julien.civi@gmail.com
```

## 🚀 Après avoir ajouté les variables

1. **Redéployer** :
   - Deployments → [...] menu → **Redeploy**
   - Attendre que le build soit ✅ Ready

2. **Tester** :
   - Ouvrir https://test-beta-ivory-52.vercel.app
   - Se connecter
   - Scanner un QR (ou saisir manuellement)
   - Modifier l'état
   - **Recharger la page** → La modification DOIT être conservée

## 🧪 Test de vérification

Ouvrez la console (F12) sur votre site et tapez :

```javascript
fetch('/api/session')
  .then(r => r.json())
  .then(console.log)
```

**Résultat attendu** :
```json
{
  "user": {
    "id": "...",
    "name": "...",
    "role": "TECH" ou "ADMIN"
  }
}
```

Si vous voyez `401 Unauthorized` → NEXTAUTH_URL n'est pas configuré

## ✅ Checklist

- [ ] NEXTAUTH_URL ajouté avec **https://test-beta-ivory-52.vercel.app**
- [ ] DATABASE_URL configuré
- [ ] NEXTAUTH_SECRET configuré
- [ ] Redéploiement lancé
- [ ] Build réussi (✅ Ready)
- [ ] Test de session OK
- [ ] Scan + modification → Sauvegardé

## 🎉 Une fois configuré

Tout fonctionnera parfaitement :
- ✅ Scans sauvegardés
- ✅ Photos uploadées
- ✅ Modifications persistées
- ✅ Emails envoyés (si SMTP configuré)

**L'app est prête à être utilisée en production ! 🚀**
