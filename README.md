# nextjs-starter-vercel-db

Starter Next.js ultra-minimal **prêt pour Vercel** avec **Prisma** pour se connecter à une base de données (PostgreSQL par défaut).
Il embarque désormais une démonstration complète de gestion d&apos;outillage (rôles, inventaire commun et fiche via QR code).

## 🔐 Gestion des accès

- **Tech** : accès aux pages Common (inventaire) et Scan (mise à jour).
- **Admin** : mêmes accès + page d&apos;administration (contenu à venir).

Comptes de démonstration créés par le `seed` :

| Email               | Rôle  |
|---------------------|-------|
| `tech@example.com`  | Tech  |
| `admin@example.com` | Admin |

> Le script `npm run seed` insère également l&apos;ensemble des outils et leur hash (non affiché dans l&apos;interface, uniquement stocké en base).

## 🧭 Pages disponibles

- `/` : page de connexion et navigation rapide.
- `/common` : inventaire centralisé des outils (informations visibles, sans hash).
- `/scan` : formulaire connecté à l&apos;API pour identifier un outil via QR code et modifier ses informations visibles.
- `/admin` : espace réservé aux administrateurs (placeholder en attendant les futures fonctions).

## 🚀 Démarrage en local

1) Installe les dépendances :
```bash
npm install
```
2) Copie le fichier d'exemple et configure ta base :
```bash
cp .env.example .env
# édite .env et renseigne DATABASE_URL
```
3) Initialise Prisma (crée le schéma et le client) :
```bash
npx prisma migrate dev --name init
```
4) Lance le serveur de dev :
```bash
npm run dev
```
5) Teste l'API de santé BD : ouvre http://localhost:3000/api/health/db

## 🗃️ Schéma Prisma (PostgreSQL)

Le modèle inclus est simple (`User`). Tu peux l'éditer dans `prisma/schema.prisma` puis régénérer:
```bash
npx prisma migrate dev --name change
```

## 🌐 Déploiement sur Vercel (avec GitHub)

1) **Crée un dépôt GitHub** et pousse ce dossier :
```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin <URL_DU_DEPOT>
git push -u origin main
```

2) **Sur Vercel** : "Add New..." → "Project" → importe ton repo GitHub.

3) **Variables d’environnement** : dans *Settings → Environment Variables*, ajoute :
- `DATABASE_URL` : l’URL de ta base (ex : Render, Neon, Supabase, Railway...).

4) **Build & Runtime** : rien de spécial à faire, Vercel détecte Next.js.
Le script `postinstall` exécute `prisma generate` automatiquement.
Pour les migrations de prod, préfère les lancer manuellement depuis ta machine
ou via un workflow (exécute `npx prisma migrate deploy`).

5) **Test en prod** : une fois le déploiement terminé, va sur `/api/health/db` pour vérifier la connexion.

## ✅ Vérifier la connexion BD (local & Vercel)
- Route : `GET /api/health/db`
- Réponse attendue :
```json
{"ok":true,"provider":"postgresql","users":0}
```

## 🧩 Structure
```
src/app/page.jsx                    → accueil / authentification
src/app/actions/auth.js             → actions serveur login/logout
src/app/common/page.jsx             → inventaire commun
src/app/scan/page.jsx               → page Scan (accès Tech/Admin)
src/app/scan/ScanClient.jsx         → composant client pour l'édition
src/app/admin/page.jsx              → placeholder administration (Admin)
src/app/api/tools/[hash]/route.js   → API QR code (GET/PUT)
src/components/LoginForm.jsx        → formulaire client
src/lib/auth.js                     → gestion des sessions par cookie
lib/db.js                           → client Prisma (singleton)
prisma/schema.prisma                → schéma de la base (User + Tool)
```

## 📝 Notes
- Par défaut : **PostgreSQL**. Pour SQLite en local, remplace `provider = "postgresql"` par `provider = "sqlite"` et `DATABASE_URL="file:./dev.db"` puis relance `migrate`.
- TypeScript n'est **pas** activé pour rester minimal. Tu peux l'ajouter ensuite (`npx tsc --init`).

Bon dev 👾
