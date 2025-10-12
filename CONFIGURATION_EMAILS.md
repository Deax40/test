# Configuration des Notifications Email - ENGEL QR

## Vue d'ensemble

Le système ENGEL QR envoie automatiquement des emails pour:
1. **Habilitations expirant bientôt** (< 30 jours) → Envoyé à l'utilisateur concerné
2. **Outils cassés/abîmés** → Envoyé à tous les administrateurs avec email

## Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `.env`:

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app_gmail

# Email admin (optionnel, pour d'autres notifications)
ADMIN_EMAIL=admin@engel.com
```

## Configuration Gmail (Recommandé)

### Étape 1: Activer l'authentification à 2 facteurs
1. Allez dans votre compte Google
2. Sécurité → Validation en deux étapes
3. Activez la validation en deux étapes

### Étape 2: Générer un mot de passe d'application
1. Sécurité → Mots de passe des applications
2. Sélectionnez "Autre (nom personnalisé)"
3. Nommez-le "ENGEL QR"
4. Copiez le mot de passe généré (16 caractères)
5. Utilisez ce mot de passe dans `SMTP_PASS`

## Types de notifications

### 1. Alerte habilitation expirante

**Déclencheur:** Habilitation expire dans moins de 30 jours

**Destinataire:** L'utilisateur concerné (si email renseigné)

**Contenu:**
- Nom de l'utilisateur
- Titre de l'habilitation
- Nombre de jours restants
- Date d'expiration

**Comment ça marche:**
- Vérification automatique via l'endpoint `/api/cron/check-expirations`
- À configurer avec un cron job ou service externe
- L'utilisateur doit avoir un email dans son profil

### 2. Alerte outil cassé

**Déclencheur:** Un outil est marqué "Abîmé" ou "Problème"

**Destinataires:** TOUS les administrateurs ayant un email

**Contenu:**
- Nom de l'outil
- Lieu
- Description du problème
- Nom de l'utilisateur qui a signalé
- Photo en pièce jointe (si fournie)

**Comment ça marche:**
- Envoi automatique lors du scan avec état "Abîmé"
- Envoi automatique lors de modification avec état "Problème"
- Fonctionne pour outils Care ET Commun

## Configuration du Cron Job pour les habilitations

### Option 1: Service externe (Recommandé)

Utilisez un service comme [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com):

1. Créez un compte
2. Ajoutez une nouvelle tâche cron
3. URL: `https://votre-domaine.com/api/cron/check-expirations`
4. Fréquence: Tous les jours à 9h00
5. Méthode: GET

### Option 2: Cron système (si hébergement VPS/Serveur)

Ajoutez dans votre crontab:

```bash
# Vérifier les habilitations expirantes tous les jours à 9h
0 9 * * * curl https://votre-domaine.com/api/cron/check-expirations
```

### Option 3: Vercel Cron (si hébergé sur Vercel)

Créez `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expirations",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Tester les notifications

### Test alerte habilitation:

1. Créez une habilitation avec expiration < 30 jours
2. Assurez-vous que l'utilisateur a un email
3. Appelez manuellement: `GET https://votre-domaine.com/api/cron/check-expirations`
4. Vérifiez la boîte email de l'utilisateur

### Test alerte outil cassé:

1. Assurez-vous qu'au moins un admin a un email
2. Scannez un outil et marquez-le comme "Abîmé"
3. Vérifiez les boîtes email des admins

## Résolution de problèmes

### Les emails ne sont pas envoyés

**Vérifications:**

1. Variables d'environnement correctement définies:
   ```bash
   echo $SMTP_USER
   echo $SMTP_HOST
   ```

2. Mot de passe d'application Gmail valide (pas le mot de passe principal)

3. Vérifiez les logs serveur:
   ```bash
   npm run dev
   # Regardez les messages console
   ```

4. Les utilisateurs/admins ont-ils un email?
   ```sql
   -- Dans Prisma Studio
   SELECT name, email, role FROM User WHERE role = 'ADMIN';
   ```

### Erreur "Invalid login"

- Utilisez un mot de passe d'application Gmail, pas votre mot de passe Google
- Activez l'authentification à 2 facteurs

### Emails en spam

- Configurez SPF/DKIM pour votre domaine
- Utilisez un service SMTP professionnel (SendGrid, Mailgun)

## Services SMTP alternatifs

### SendGrid (Recommandé pour production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre_api_key_sendgrid
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASS=votre_password_mailgun
```

### Outlook/Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=votre_email@outlook.com
SMTP_PASS=votre_mot_de_passe
```

## Sécurité

⚠️ **Important:**

1. Ne commitez JAMAIS le fichier `.env` dans Git
2. Ajoutez `.env` dans `.gitignore`
3. Utilisez des mots de passe d'application, jamais les mots de passe principaux
4. Changez les mots de passe régulièrement
5. Limitez l'accès aux variables d'environnement en production

## Monitoring

Consultez les logs pour voir l'activité des emails:

```bash
# Développement
npm run dev

# Production (PM2)
pm2 logs engel-qr
```

Messages dans les logs:
- `Habilitation expiration alert sent to email@example.com`
- `Broken tool alert sent to 3 admin(s)`
- `Email not configured. ...` (si SMTP pas configuré)

## Personnalisation

Pour personnaliser les templates d'email, modifiez:

```
lib/email.js
```

Fonctions disponibles:
- `sendHabilitationExpirationAlert()` - Habilitations expirantes
- `sendBrokenToolAlertToAdmins()` - Outils cassés
- `sendProblemNotification()` - Notifications problèmes (existante)

## Support

Pour toute question sur la configuration des emails, contactez l'administrateur système.
