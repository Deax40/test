# ENGEL – QR Logs (Next.js)

> Thème ENGEL inclus (couleurs, logo, header).

Application **Next.js** pour ENGEL permettant aux **techniciens** de scanner des QR codes et d'enregistrer un log (lieu, date, qui le fait), et un **panneau d'administration** (connexion admin, liste des logs, ajout/suppression d'admins).

## Fonctions

- Login (page d'accueil `/`)
- Page **Scan** `/scan` avec lecteur de QR (mobile/desktop)
- Persistance des logs en base (Prisma)
- **Admin Panel** `/admin/panel` : liste des logs (du plus ancien au plus récent), ajout et suppression d’administrateurs
- **RBAC** : seules les personnes Admin peuvent gérer les admins et voir les logs
- **UI épurée** avec TailwindCSS

## Stack

- Next.js 14 (App Router)
- NextAuth (Credentials, sessions JWT)
- Prisma (PostgreSQL)
- TailwindCSS
- @yudiel/react-qr-scanner

---

## ⚙️ Installation locale

1. **Cloner** le projet et installer :

```bash
npm install
cp .env.example .env
```

2. **Modifier** `.env` : renseignez `DATABASE_URL` avec l'URL de votre base Postgres et définissez `NEXTAUTH_SECRET` à une valeur aléatoire forte.

3. **Init DB Prisma** et **seed** (créera 1 admin et 1 technicien de démo) :
   > Assurez-vous que `DATABASE_URL` pointe vers une base Postgres accessible.

```bash
npm run prisma:dev
npm run seed
```

4. **Lancer** :

```bash
npm run dev
```

5. Accès :

- Technicien :
  - **user**: `tech`
  - **pass**: `tech123`
- Administrateur :
  - **user**: `admin`
  - **pass**: `admin123`

> ⚠️ **Changez ces identifiants** dès que possible (ajoutez un nouvel admin puis supprimez l'ancien).

---

## 🚀 Déploiement sur Vercel

1. Créez un projet sur Vercel et **importez** ce repo.
2. **Variables d'environnement** à ajouter dans Vercel :
   - `NEXTAUTH_URL` = `https://votre-domaine.vercel.app`
   - `NEXTAUTH_SECRET` = générez une valeur aléatoire
   - `DATABASE_URL` = **recommandé en Postgres** (Neon / Vercel Postgres). Exemple Neon : `postgresql://user:pass@host/db?sslmode=require`

   > Si vous utilisez Postgres en prod, **modifiez `prisma/schema.prisma`** : `provider = "postgresql"` puis executez une migration locale et **push** les changements, ou lancez `prisma migrate deploy` pendant le build.

3. Dans **Build Command**, laissez par défaut (Next.js). `npm run build` génère le client Prisma puis compile l'application.

4. Après déploiement, exécutez (si Postgres) `npm run prisma:deploy` via un job ou un shell (ou activez les migrations Prisma automatiques).

5. Connectez-vous sur `/` avec l’admin seedé et ajoutez de nouveaux admins.

---

## ✏️ Personnalisation

- **Branding** : modifiez les composants dans `components/` et les couleurs dans `app/globals.css`.
- **Champs du log** : ajustez `prisma/schema.prisma` et les formulaires dans `app/scan/page.js`.
- **Ordre des logs** : dans `app/admin/panel/page.js`, changez `orderBy: { createdAt: 'asc' }` en `'desc'` si vous préférez du plus récent au plus ancien.

---

## 🔒 Sécurité & limites (à prévoir pour la prod)

- Mots de passe hashés (bcrypt) ; identifiants de démo à **changer** rapidement.
- Pas de 2FA, pas de journal d'audit d'administration, pas de ratelimiting → à ajouter si besoin.
- `@yudiel/react-qr-scanner` nécessite l'autorisation caméra (HTTPS sur mobile). Prévoir un fallback manuel (déjà présent: champ “Donnée QR”).

Bon dev ✌️


---

## 🪟 Astuce Windows
Dans l’invite de commandes (CMD), utilisez :

```bat
copy .env.example .env
```

Sous PowerShell :

```powershell
Copy-Item .env.example .env
```
