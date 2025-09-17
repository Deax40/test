# Gestion d'outillage par QR code

Application Next.js (App Router) avec authentification et contrôle d'accès par rôles. Elle permet de :

- Se connecter en tant que **Technicien** ou **Administrateur**.
- Scanner des QR codes (caméra ou saisie manuelle) et récupérer les informations associées à l'outil.
- Mettre à jour les caractéristiques de l'outil (statut, localisation, opérateur, note...).
- Consulter l'inventaire complet synchronisé en temps réel.
- Gérer son mot de passe et préparer un espace d'administration.

## Démarrage en local

```bash
npm install
cp .env.example .env
# Renseigner DATABASE_URL (PostgreSQL ou SQLite) et AUTH_SECRET
npx prisma migrate dev --name init-rbac
npm run dev
```

### Comptes de test (seed)

Le script `npm run seed` crée :

- `admin@example.com` / `Admin123!` (rôle ADMIN)
- `tech@example.com` / `Tech123!` (rôle TECH)

Ainsi que la liste officielle des outils avec leur hash QR.

## Architecture

```
prisma/schema.prisma        # Schéma (users, tools, tool_history)
prisma/seed.mjs             # Initialisation utilisateurs + outils
src/lib/db.js               # Client Prisma partagé
src/lib/passwords.js        # Hash/validation des mots de passe (scrypt)
src/lib/tokens.js           # Génération/validation des jetons de session HMAC
middleware.js               # RBAC (pages + API)
```

### Pages principales

- `/logging` : page de connexion sécurisée.
- `/scan` : lecteur QR + formulaire d'édition (Tech/Admin).
- `/common` : vue consolidée des outils.
- `/profile` : informations du compte + changement de mot de passe.
- `/admin` : espace réservé aux administrateurs.

### API

- `GET /api/tools/:hash` : récupère l'outil correspondant (Tech/Admin).
- `PATCH /api/tools/:hash` : met à jour l'outil et journalise l'action.

## Sécurité

- Jetons de session signés (HMAC) stockés dans un cookie `app_session` (8h).
- Middleware RBAC appliqué aux pages et routes API sensibles.
- Politique de mot de passe forte (min 8 caractères + chiffre + caractère spécial).
- Journal `ToolHistory` des modifications (avant/après + opérateur).

## Audit de la base

Le document [`docs/DB_AUDIT.md`](docs/DB_AUDIT.md) détaille les problèmes du schéma initial et les corrections apportées.
