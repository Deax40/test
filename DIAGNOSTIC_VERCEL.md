# 🔍 Diagnostic Vercel - Rien ne fonctionne

## ✅ Ce qui marche

- `/api/debug/db-test` → ✅ Base de données OK
- Build Vercel → ✅ Réussi
- Prisma → ✅ Connecté

## ❌ Ce qui ne marche pas

- Site principal ne fonctionne pas
- (À compléter avec les détails de l'utilisateur)

## 🔧 Vérifications à faire

### 1. Variables d'environnement Vercel

Allez sur **Vercel Dashboard** → Votre projet → Settings → Environment Variables

Vérifiez que vous avez **TOUTES** ces variables:

```bash
# OBLIGATOIRE - Base de données
DATABASE_URL=postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require

# OBLIGATOIRE - NextAuth
NEXTAUTH_URL=https://test-beta-ivory-52.vercel.app
NEXTAUTH_SECRET=supersecretkey123456789abcdefghijklmnopqrstuvwxyz

# OPTIONNEL - Prisma Accelerate (pour performances)
PRISMA_ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4

# OPTIONNEL - Email (pour notifications de problèmes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=julien.civi@gmail.com
```

**⚠️ IMPORTANT**: La variable `NEXTAUTH_URL` doit être:
- ❌ PAS `http://localhost:3002`
- ✅ `https://test-beta-ivory-52.vercel.app`

### 2. Après avoir ajouté/modifié les variables

1. Cliquez sur **"Redeploy"** dans Vercel
2. Attendez 2-3 minutes
3. Testez à nouveau

### 3. Tests à faire dans l'ordre

#### Test 1: Page d'accueil
```
https://test-beta-ivory-52.vercel.app/
```
**Attendu**: Page de login ou redirection

#### Test 2: Login
```
https://test-beta-ivory-52.vercel.app/login
```
**Attendu**: Formulaire de connexion
**Action**: Connectez-vous avec vos identifiants

#### Test 3: Page de scan
```
https://test-beta-ivory-52.vercel.app/scan
```
**Attendu**: Scanner QR fonctionnel

#### Test 4: API session
```
https://test-beta-ivory-52.vercel.app/api/session
```
**Attendu**: Retourne votre session utilisateur (JSON)

### 4. Logs à vérifier

#### Console navigateur (F12)
Ouvrez la console et cherchez:
- ❌ Erreurs en rouge
- ⚠️ Warnings en jaune
- 🔴 Erreurs 401, 403, 404, 500

#### Vercel Logs
1. Vercel Dashboard → Deployments → Dernier déploiement
2. Onglet "Logs"
3. Cherchez les erreurs `[ERROR]` ou `❌`

### 5. Problèmes courants

#### Problème: "Unable to verify authorization" ou erreurs 401
**Cause**: NEXTAUTH_URL mal configuré
**Solution**: Vérifier que `NEXTAUTH_URL=https://test-beta-ivory-52.vercel.app` sur Vercel

#### Problème: Page blanche
**Cause**: Erreur JavaScript
**Solution**: Vérifier console F12

#### Problème: "Internal Server Error"
**Cause**: Variable d'environnement manquante
**Solution**: Vérifier toutes les variables sur Vercel

#### Problème: Scans ne sauvegardent pas
**Cause**: Prisma ne se connecte pas
**Solution**: Vérifier DATABASE_URL sur Vercel

## 🎯 Checklist de dépannage

- [ ] DATABASE_URL configuré sur Vercel
- [ ] NEXTAUTH_URL = https://test-beta-ivory-52.vercel.app (PAS localhost!)
- [ ] NEXTAUTH_SECRET configuré sur Vercel
- [ ] Redéployé après modification des variables
- [ ] Console F12 vérifiée pour erreurs
- [ ] Logs Vercel vérifiés
- [ ] Test /api/debug/db-test → ✅
- [ ] Test /api/session → ?
- [ ] Login fonctionne → ?
- [ ] Scan fonctionne → ?

## 📞 Informations à fournir si problème persiste

1. **Screenshot console F12** (onglet Console)
2. **Screenshot console F12** (onglet Network, montrer requêtes en rouge)
3. **Logs Vercel** (copier/coller les dernières 50 lignes)
4. **Capture d'écran de la page** qui ne fonctionne pas
5. **Message d'erreur exact** affiché à l'utilisateur

---

**Note**: Si `/api/debug/db-test` fonctionne, la base de données est OK. Le problème est probablement NextAuth mal configuré.
