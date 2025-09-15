# nextjs-starter-vercel-db

Starter Next.js ultra-minimal **prêt pour Vercel** avec **Prisma** pour se connecter à une base de données (PostgreSQL par défaut).

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
src/app/page.jsx           → page d'accueil minimale
src/app/api/health/db      → route API pour tester la DB
lib/db.js                  → client Prisma (singleton)
prisma/schema.prisma       → schéma de la base
```

## 📝 Notes
- Par défaut : **PostgreSQL**. Pour SQLite en local, remplace `provider = "postgresql"` par `provider = "sqlite"` et `DATABASE_URL="file:./dev.db"` puis relance `migrate`.
- TypeScript n'est **pas** activé pour rester minimal. Tu peux l'ajouter ensuite (`npx tsc --init`).

Bon dev 👾
