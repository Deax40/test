# 🔧 Engel QR Admin - Système de Gestion des Outils

Un système complet de gestion et de traçabilité des outils basé sur les codes QR, développé avec Next.js et Tailwind CSS.

## 🖥️ Fonctionnalités Générales

### 🔐 Authentification et Rôles
- **Système d'authentification** avec NextAuth.js
- **Rôles utilisateurs** : TECH (techniciens) et ADMIN (administrateurs)
- **Accès sécurisé** aux différentes sections selon les droits

### 🛠️ Gestion des Outils
- **Deux types d'outils** : Care Tools et Commun Tools
- **Scan QR code** pour identification rapide
- **Traçabilité complète** de tous les mouvements
- **États multiples** : RAS, Abîmé, En maintenance, Hors service
- **Localisation en temps réel** avec dernier lieu scanné

### 📊 Logging et Traçabilité
- **Historique automatique** de toutes les actions
- **Limite de 7 logs** par outil (suppression automatique des plus anciens)
- **Types de logs** : SCAN, MODIFY, CREATE
- **Horodatage** automatique avec fuseau horaire Paris

## Stack Technique

- Next.js 14 (App Router)
- NextAuth (Credentials, sessions JWT)
- Prisma (SQLite/PostgreSQL)
- TailwindCSS
- @yudiel/react-qr-scanner

---

## 📋 Page Care

### 🖼️ Présentation
- **Interface moderne** avec cartes visuelles pour chaque outil
- **Design responsive** et intuitive
- **Recherche en temps réel** par nom d'outil
- **Actualisation automatique** des données

### ⚙️ Fonctionnalités

#### **Modification d'un Outil**
- **Menu déroulant d'actions** accessible via le bouton "Actions"
- Options disponibles :
  - 📤 **Envoi** : Marque l'outil comme envoyé
  - 📥 **Réception** : Marque l'outil comme reçu
  - ✅ **État: RAS** : Mise à jour rapide de l'état
  - ⚠️ **État: Abîmé** : Signalement de dommage avec modal

#### **Gestion des Outils Abîmés**
- **Modal de signalement** automatique
- **Upload de photo** obligatoire
- **Description détaillée** du problème
- **Transfert automatique** vers la section Admin

#### **Informations Visibles**
- **Dernier lieu scanné** (toujours affiché en haut)
- **Localisation actuelle** de l'appareil
- **Informations de traçabilité** complètes
- **Bouton "Voir suivi"** pour les détails (affiche tracking si en transport)

#### **Mise à Jour Temps Réel**
- Synchronisation automatique avec la base de données
- Actualisation des états et locations
- Persistance des modifications

---

## 📡 Page Scan

### 🔍 Scanner QR Code
- **Interface caméra** intégrée pour scanner les codes QR
- **Compatible** avec les outils Care et Commun
- **Détection automatique** du type d'outil

### ⚙️ Fonctionnalités de Scan

#### **Choix du Statut**
Menu déroulant avec options :

1. **📤 Envoi matériel**
   - Lieu d'envoi (obligatoire)
   - Client (obligatoire)
   - Transporteur (obligatoire)
   - Tracking number (obligatoire)

2. **📥 Réception matériel / Dépôt**
   - **Dépôt bureau Paris/Gleizé** :
     - État (RAS/Abîmé)
     - Heure (auto, non modifiable, grisée)
     - Responsable (auto, non modifiable, grisé)

3. **🚪 Sortie bureau Paris/Gleizé**
   - Lieu (obligatoire)
   - Nom du client (obligatoire)
   - État (RAS/Abîmé)
   - Heure (auto, grisée)
   - Responsable (auto, grisé)

4. **📍 Autres / Chez client**
   - Lieu (obligatoire)
   - Nom du client (obligatoire)
   - État (RAS/Abîmé)
   - Heure (auto, grisée)
   - Responsable (auto, grisé)

#### **Gestion des Outils Cassés**
- **Détection automatique** des outils déclarés abîmés
- **Photo obligatoire** avec description
- **Transfert automatique** vers la page Admin
- **Notification** de l'envoi des données

### 📝 Enregistrement des Données
- **Toutes les actions** sont enregistrées sur la page Care
- **Horodatage automatique** avec fuseau horaire Paris
- **Utilisateur tracé** automatiquement

---

## 🔧 Page Admin

### 🛡️ Accès Sécurisé
- **Réservé aux administrateurs** (rôle ADMIN)
- **Contrôle d'accès** strict avec vérification de session

### 📊 Séparations des Données

#### **📋 Section Logs**
- **Logs individuels** pour chaque outil
- **Filtrage par outil** avec recherche
- **Affichage des 7 derniers logs** maximum par outil
- **Types d'actions** : SCAN, MODIFY, CREATE
- **Détails des modifications** (ancienne → nouvelle valeur)

#### **🔍 Section Scans**
- **Historique complet** de tous les scans
- **Table triable** avec pagination
- **Informations** : Outil, Lieu, État, Utilisateur, Date
- **Filtres** par date, utilisateur, état

#### **⚠️ Section Outils Abîmés**
- **Vue dédiée** aux outils endommagés
- **Photos et descriptions** des problèmes
- **Informations complètes** de localisation
- **Statut en temps réel** de chaque outil
- **Gestion des réparations** et suivi

### 🗃️ Gestion des Données
- **Suppression automatique** des logs au-delà du 7e
- **Archivage intelligent** des données anciennes

---

## 🔒 Fonctionnalités Techniques

### 🗄️ Base de Données
- **SQLite** pour stockage local
- **Prisma ORM** pour gestion des données
- **Modèles** : User, Tool, ToolLog, CareLog, Certification, etc.

### 🛡️ Sécurité
- **Heure et Responsable** automatiques (non modifiables)
- **Tokens de session** pour modification sécurisée
- **Validation** des permissions utilisateur
- **Chiffrement** des données sensibles

### 📱 Interface Utilisateur
- **Responsive design** pour mobile et desktop
- **Tailwind CSS** pour styling moderne
- **React hooks** pour gestion d'état
- **Modals et dropdowns** interactifs

### 🔄 Synchronisation
- **Mise à jour temps réel** entre toutes les pages
- **Persistance** automatique des modifications
- **Gestion des conflits** et états incohérents

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
