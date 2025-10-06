# 🚀 Guide de déploiement Vercel

## ✅ Étape 1 : Code sur GitHub
Votre code est maintenant sur GitHub : https://github.com/Deax40/engel-qr-admin

## 📝 Étape 2 : Configuration Vercel

### 2.1 Connexion à Vercel
1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"** ou **"Log In"**
3. Connectez-vous avec votre compte GitHub

### 2.2 Import du projet
1. Sur le dashboard Vercel, cliquez sur **"Add New..."** → **"Project"**
2. Cherchez le repository **"engel-qr-admin"**
3. Cliquez sur **"Import"**

### 2.3 Configuration du build
Vercel détectera automatiquement Next.js. Vérifiez que :
- **Framework Preset** : Next.js
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build` (auto-détecté)
- **Output Directory** : `.next` (auto-détecté)

### 2.4 Variables d'environnement

⚠️ **IMPORTANT** : Avant de déployer, ajoutez ces variables d'environnement :

#### Variables déjà configurées dans votre base Vercel :
- `DATABASE_URL` : Votre connexion PostgreSQL (déjà configurée ✅)
- `NEXTAUTH_URL` : L'URL de votre site Vercel (déjà configurée ✅)
- `NEXTAUTH_SECRET` : Clé secrète NextAuth (déjà configurée ✅)

#### Variables à ajouter plus tard (pour les emails) :
- `SMTP_HOST` : smtp.gmail.com
- `SMTP_PORT` : 587
- `SMTP_USER` : votre-email@gmail.com
- `SMTP_PASS` : votre-mot-de-passe-application
- `ADMIN_EMAIL` : admin@votreentreprise.com

**Comment ajouter des variables :**
1. Dans Vercel, allez dans **Settings** → **Environment Variables**
2. Ajoutez chaque variable avec sa valeur
3. Sélectionnez les environnements : **Production**, **Preview**, **Development**

## 🗄️ Étape 3 : Base de données PostgreSQL

### Option 1 : Utiliser Vercel Postgres (Recommandé)
1. Dans votre projet Vercel, allez sur **Storage** → **Create Database**
2. Sélectionnez **Postgres**
3. Suivez les instructions
4. Vercel ajoutera automatiquement `DATABASE_URL` à vos variables

### Option 2 : Utiliser une base externe
Si vous utilisez déjà une base PostgreSQL (Neon, Supabase, Railway, etc.) :
- La variable `DATABASE_URL` est déjà configurée ✅

### Initialiser la base de données :
Après le premier déploiement, exécutez Prisma migrations :

1. Allez dans **Settings** → **Functions** → **Environment Variables**
2. Installez Vercel CLI localement :
   ```bash
   npm i -g vercel
   ```
3. Connectez-vous à Vercel :
   ```bash
   vercel login
   ```
4. Liez le projet :
   ```bash
   vercel link
   ```
5. Exécutez les migrations :
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   npx prisma db push
   ```

**OU** utilisez le script Vercel CLI intégré :
```bash
vercel env pull
npx prisma generate
npx prisma db push
```

## 🚀 Étape 4 : Déploiement

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine (2-5 minutes)
3. Vercel vous donnera une URL : `https://engel-qr-admin.vercel.app` ou `https://votre-nom.vercel.app`

## ✅ Étape 5 : Vérification post-déploiement

### 5.1 Vérifier que le site fonctionne
- Accédez à votre URL Vercel
- Testez la connexion avec votre compte admin

### 5.2 Configurer NEXTAUTH_URL (si nécessaire)
Si votre URL finale a changé :
1. Allez dans **Settings** → **Environment Variables**
2. Modifiez `NEXTAUTH_URL` avec votre nouvelle URL Vercel
3. Redéployez : **Deployments** → **...** → **Redeploy**

### 5.3 Vérifier la base de données
- Connectez-vous en tant qu'admin
- Vérifiez que vos outils Care et Commun apparaissent
- Testez un scan QR

## 📧 Étape 6 : Configuration email (plus tard)

Quand vous serez prêt à configurer les emails :

### 6.1 Configuration Gmail (exemple)
1. Activez la validation en 2 étapes sur votre compte Google
2. Générez un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Ajoutez les variables dans Vercel :
   - `SMTP_HOST` : smtp.gmail.com
   - `SMTP_PORT` : 587
   - `SMTP_USER` : votre-email@gmail.com
   - `SMTP_PASS` : le mot de passe d'application généré
   - `ADMIN_EMAIL` : votre email admin

### 6.2 Configurer le Cron Job
Pour les notifications d'expiration automatiques :

1. Dans Vercel, allez sur **Settings** → **Cron Jobs**
2. Créez un nouveau Cron Job :
   - **Path** : `/api/cron/check-expirations`
   - **Schedule** : `0 9 * * *` (tous les jours à 9h00)
3. Sauvegardez

**OU** utilisez un service externe comme :
- **Cron-job.org** (gratuit)
- **EasyCron** (gratuit jusqu'à 1000/mois)

Configurez pour appeler : `https://votre-site.vercel.app/api/cron/check-expirations`

## 🔒 Étape 7 : Domaine personnalisé (optionnel)

Pour utiliser votre propre domaine :

1. Dans Vercel, allez sur **Settings** → **Domains**
2. Cliquez sur **"Add Domain"**
3. Entrez votre domaine (exemple : `engel-qr.votreentreprise.com`)
4. Suivez les instructions DNS
5. Mettez à jour `NEXTAUTH_URL` avec votre nouveau domaine
6. Redéployez

## 🐛 Dépannage

### Erreur de build
- Vérifiez les logs dans **Deployments** → **Building**
- Assurez-vous que `DATABASE_URL` est configuré

### Erreur de connexion base de données
- Vérifiez que `DATABASE_URL` est correct
- Exécutez `npx prisma db push` après avoir configuré la variable

### Erreur NextAuth
- Vérifiez `NEXTAUTH_URL` correspond à l'URL de votre site
- Vérifiez `NEXTAUTH_SECRET` est défini

### Page blanche après déploiement
- Vérifiez les logs dans **Deployments** → **Functions**
- Vérifiez la console du navigateur (F12)

## 📚 Ressources

- Documentation Vercel : https://vercel.com/docs
- Vercel CLI : https://vercel.com/docs/cli
- Prisma avec Vercel : https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- NextAuth : https://next-auth.js.org/deployment

---

✅ **Votre projet est maintenant sur GitHub et prêt pour Vercel !**

Repository : https://github.com/Deax40/engel-qr-admin
