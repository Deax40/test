# ENGEL QR Logs — Fonctionnalités détaillées

---

## 1. Authentification

- Connexion par identifiant / mot de passe (NextAuth)
- Case "Se souvenir de moi" avec auto-connexion
- Affichage/masquage du mot de passe
- Redirection automatique après connexion
- Gestion des sessions utilisateur
- Deux rôles : **ADMIN** et **TECH**

---

## 2. Scan QR Code

- Scan en temps réel via la caméra (`@yudiel/react-qr-scanner`)
- Saisie manuelle en cas d'échec de la caméra
- Recherche automatique de l'outil après le scan
- Identification de l'utilisateur connecté lors du scan

**Actions disponibles lors d'un scan :**
- ENVOIE MATÉRIEL
- RECEPTION MATERIEL
- DEPOT BUREAU PARIS / SORTIE BUREAU PARIS
- DEPOT BUREAU GLEIZE / SORTIE BUREAU GLEIZE
- DEPOT BUREAU TANGER / SORTIE BUREAU TANGER
- CHEZ CLIENT
- AUTRES

**Champs selon l'action :**
- Nom du client (obligatoire pour CHEZ CLIENT, SORTIE, RECEPTION, AUTRES)
- Lieu d'envoi, transporteur, numéro de tracking (pour ENVOIE MATÉRIEL)
- État de l'outil (RAS / Abîmé)
- Description du problème + photo (si Abîmé)

---

## 3. Outils Care (`/care`)

- Liste complète des outils Care
- Tri alphabétique fixe (ne change pas après scan ou modification)
- Recherche et filtrage (par lieu, état)
- Affichage par outil :
  - Nom et hash
  - Lieu en gras
  - Date et heure du dernier scan
  - Nom de la personne ayant scanné
  - État (RAS / Problème)
- **J'ai l'outil** : enregistrement rapide sans scan QR
- **Modifier** : modification de la position, du statut, des infos (mêmes options que le scan)
  - Champ client obligatoire si CHEZ CLIENT
- **Détails** : historique des 6 derniers scans, certificats associés
- Signalement de dommages avec photo et description

---

## 4. Outils Communs (`/commun`)

Fonctionnalités identiques aux outils Care :
- Liste, tri, filtrage, recherche
- J'ai l'outil, Modifier, Détails
- Historique des scans et certificats
- Signalement de dommages

---

## 5. Tableau de bord Admin (`/admin`)

**Statistiques en temps réel :**
- Nombre total d'outils
- Scans du jour (cliquable → liste détaillée)
- Outils en problème (cliquable → liste avec photos)

**Onglet Activité :**
- 10 dernières activités avec horodatage
- Type d'action, utilisateur, lieu, état

**Onglet Utilisateurs :**
- Création d'utilisateurs (identifiant, nom, email, mot de passe, rôle)
- Modification et suppression
- Recherche par nom / identifiant / email
- Confirmation du mot de passe obligatoire

**Onglet Habilitations :**
- Ajout d'habilitations (utilisateur, titre, PDF, date d'expiration)
- Indicateur de statut coloré :
  - 🟢 Valide
  - 🟠 Expire bientôt (< 90 jours)
  - 🔴 Expirée
- Téléchargement des PDFs
- Suppression

**Onglet Historique des scans :**
- Filtres : lieu, état, utilisateur
- Colonnes : outil, date/heure, lieu, état, utilisateur, détails
- Affichage du nombre total de scans

---

## 6. Panel Admin avancé (`/admin/panel`)

**Onglet Vue d'ensemble :**
- Tableau des activités récentes
- Suppression individuelle ou totale des activités

**Onglet Utilisateurs :**
- Même gestion que `/admin` + vue détails modale

**Onglet Habilitations :**
- Même gestion que `/admin` + recherche avancée

**Onglet Logs système :**
- Logs complets : date, utilisateur, action, outil, lieu, état, détails
- Filtre par type (Scan / Modification)

**Onglet Base de données :**
- Réinitialisation de la base (double confirmation requise)
- Conservation des 6 derniers scans par outil

---

## 7. Certifications (`/admin/certificats`)

- Liste de tous les outils et machines
- Ajout de certifications (date de révision, PDF optionnel)
- Modification et suppression
- Téléchargement des PDFs
- Filtrage par statut :
  - Tous / Certifié / Expire bientôt / Non certifié
- Statistiques : total, certifiés, expirant bientôt, non certifiés
- Alerte d'expiration (3 mois avant)
- Gestion séparée pour les **machines**

---

## 8. Habilitations (`/admin/habilitations`)

- Liste de toutes les habilitations utilisateurs
- Ajout : utilisateur, titre, fichier PDF, date d'expiration
- Statut coloré (Valide / Expire bientôt / Expirée)
- Téléchargement des PDFs
- Suppression

---

## 9. Gestion des fichiers outils (`/admin/files`)

- Import de fichiers Badge Studio (format `.bs`)
- Sélection de la catégorie (Care / Commun)
- Statistiques : total, Care, Commun, taille stockage
- Recherche par nom de fichier
- Filtres : catégorie, lieu, type d'équipement
- Modale de détails : nom, catégorie, type, lieu, taille, UUID, hash, chemin

---

## 10. Compte utilisateur (`/compte`)

- Affichage des informations personnelles (nom, identifiant, email)
- Modification de l'email
- Modification du mot de passe (avec confirmation obligatoire)
- Historique des 10 derniers scans personnels
- Visualisation des habilitations personnelles avec dates d'expiration
- Téléchargement des PDFs d'habilitations

---

## 11. Général

- Interface entièrement en **français**
- Design responsive (mobile, tablette, desktop)
- Version affichée dans le footer : **v1.0.3**
- Saisie des dates en format **JJ/MM/AAAA**
- Compression automatique des photos de dommages
- Protection des routes par rôle (ADMIN/TECH)
