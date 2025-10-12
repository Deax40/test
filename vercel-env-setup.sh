#!/bin/bash
# Script pour configurer les variables d'environnement Vercel

echo "🚀 Configuration des variables d'environnement Vercel..."

# Variables de base de données
vercel env add DATABASE_URL production << EOF
postgres://cc319d77dd400747f8a961c4d5037d0fe764359aea2d1f29878efb36ce4b4248:sk_cCeJAMQE23O7eiLw_dyDx@db.prisma.io:5432/postgres?sslmode=require
EOF

vercel env add PRISMA_ACCELERATE_URL production << EOF
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19jQ2VKQU1RRTIzTzdlaUx3X2R5RHgiLCJhcGlfa2V5IjoiMDFLNTdFOFdWQk1GSlkwQlc1V1I3RjVFVFciLCJ0ZW5hbnRfaWQiOiJjYzMxOWQ3N2RkNDAwNzQ3ZjhhOTYxYzRkNTAzN2QwZmU3NjQzNTlhZWEyZDFmMjk4NzhlZmIzNmNlNGI0MjQ4IiwiaW50ZXJuYWxfc2VjcmV0IjoiOThkNzE5N2UtNmE3Mi00ZDg5LWEzMzEtZTFkNWVmM2I1MzRlIn0.ml8W2voqaPMWnEMmsifNN1IWb5RCqpEo_H9SNdK6wA4
EOF

# NextAuth
vercel env add NEXTAUTH_SECRET production << EOF
supersecretkey123456789abcdefghijklmnopqrstuvwxyz
EOF

# Email (optionnel)
vercel env add SMTP_HOST production << EOF
smtp.gmail.com
EOF

vercel env add SMTP_PORT production << EOF
587
EOF

vercel env add ADMIN_EMAIL production << EOF
julien.civi@gmail.com
EOF

echo "✅ Configuration terminée !"
echo "⚠️  N'oubliez pas de configurer NEXTAUTH_URL avec votre domaine Vercel"
echo "⚠️  N'oubliez pas de configurer SMTP_USER et SMTP_PASS si vous utilisez les emails"
