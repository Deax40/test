# Configuration Vercel - Base de données Prisma

## Variables d'environnement à configurer sur Vercel

Allez dans votre projet Vercel > Settings > Environment Variables et ajoutez :

### 1. Base de données (OBLIGATOIRE)
```
DATABASE_URL=postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
```

### 2. Prisma Accelerate (OBLIGATOIRE pour les performances)
```
PRISMA_ACCELERATE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4
```

### 3. NextAuth (OBLIGATOIRE)
```
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXTAUTH_SECRET=supersecretkey123456789abcdefghijklmnopqrstuvwxyz
```

### 4. Email (OPTIONNEL)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=julien.civi@gmail.com
```

## Étapes de déploiement

### 1. Migrer la base de données
```bash
npx prisma migrate deploy
```

### 2. Générer le client Prisma
```bash
npx prisma generate
```

### 3. Seed la base de données (si nécessaire)
```bash
npm run seed
```

### 4. Vérifier la connexion
```bash
npx prisma studio
```

## Configuration GitHub Secrets (pour CI/CD)

Allez dans votre repo GitHub > Settings > Secrets and variables > Actions > New repository secret

Ajoutez les mêmes variables qu'au-dessus.

## Notes importantes

- ✅ La base de données Prisma Data Platform est déjà créée
- ✅ Prisma Accelerate est configuré pour de meilleures performances
- ✅ Toutes les données existantes seront préservées
- ⚠️ N'oubliez pas de mettre à jour NEXTAUTH_URL avec votre vrai domaine Vercel
- ⚠️ Ne commitez JAMAIS le fichier .env dans Git

## Vérification

Une fois déployé sur Vercel, vérifiez que :
1. L'application se connecte à la base de données
2. Les utilisateurs peuvent se connecter
3. Les outils Care/Commun s'affichent correctement
4. Les scans QR fonctionnent
