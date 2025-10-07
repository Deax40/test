# Configuration des GitHub Secrets

## Étapes pour ajouter les secrets GitHub

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** > **Actions**
4. Cliquez sur **New repository secret**

## Secrets à ajouter

### DATABASE_URL
```
postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
```

### PRISMA_ACCELERATE_URL
```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4
```

### NEXTAUTH_SECRET
```
supersecretkey123456789abcdefghijklmnopqrstuvwxyz
```

### NEXTAUTH_URL (à mettre à jour avec votre domaine)
```
https://your-app.vercel.app
```

### SMTP_HOST (optionnel)
```
smtp.gmail.com
```

### SMTP_PORT (optionnel)
```
587
```

### SMTP_USER (optionnel)
```
your-email@gmail.com
```

### SMTP_PASS (optionnel)
```
your-app-password
```

### ADMIN_EMAIL
```
julien.civi@gmail.com
```

## Vérification

Une fois tous les secrets ajoutés, vous devriez voir :
- DATABASE_URL
- PRISMA_ACCELERATE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- SMTP_HOST (si configuré)
- SMTP_PORT (si configuré)
- SMTP_USER (si configuré)
- SMTP_PASS (si configuré)
- ADMIN_EMAIL

Ces secrets seront automatiquement disponibles pour vos GitHub Actions et workflows CI/CD.
