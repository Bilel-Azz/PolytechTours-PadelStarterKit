# 📋 Spécifications Importantes - Corpo Padel

## 🎯 Informations Projet

- **Durée**: 12 heures
- **Équipe**: 4-5 personnes
- **Date limite**: 31/12/2025
- **Stack**: VueJS 3 + FastAPI + SQLite + shadcn-vue

---

## 🔐 Sécurité (PRIORITÉ MAXIMALE)

### Authentification JWT
- **Algorithme**: HS256
- **Durée validité**: 24 heures
- **Stockage**: localStorage
- **Payload**: `{sub: user_id, email, role, exp}`

### Anti-Brute Force (OBLIGATOIRE)
- **Max tentatives**: 5
- **Blocage**: 30 minutes
- **Compteur**: Réinitialisation après connexion réussie
- **Messages**: Afficher tentatives restantes + temps de déblocage

### Hashing
- **Algorithme**: bcrypt
- **Politique mot de passe**:
  - Min 12 caractères
  - Majuscules + minuscules + chiffres + spéciaux

### Protection
- ✅ ORM SQLAlchemy uniquement (JAMAIS de SQL brut)
- ✅ Sanitization toutes entrées (bleach)
- ✅ Headers sécurité: `X-Content-Type-Options`, `X-Frame-Options`, `CSP`
- ✅ Protection XSS: v-text (pas v-html)
- ✅ Protection CSRF: JWT dans headers (pas cookies)

---

## 📊 Base de Données

### Tables Principales
1. **users** - Comptes utilisateurs
2. **players** - Joueurs
3. **teams** - Équipes (2 joueurs)
4. **pools** - Poules (6 équipes)
5. **events** - Événements (date/heure)
6. **matches** - Matchs
7. **login_attempts** - Tentatives connexion

### Contraintes Clés
```sql
-- Licence format: LXXXXXX (L + 6 chiffres)
CONSTRAINT chk_license_format CHECK(license_number GLOB 'L[0-9][0-9][0-9][0-9][0-9][0-9]')

-- Pistes: 1-10
CONSTRAINT CHECK(court_number BETWEEN 1 AND 10)

-- Statuts match
CONSTRAINT CHECK(status IN ('A_VENIR', 'TERMINE', 'ANNULE'))

-- Joueurs différents
CONSTRAINT chk_different_players CHECK(player1_id != player2_id)
```

---

## 🎭 Rôles & Permissions

| Rôle | Description | Accès |
|------|-------------|-------|
| **VISITEUR** | Non authentifié | Page accueil uniquement |
| **JOUEUR** | Joueur inscrit | Toutes pages sauf Admin |
| **ADMINISTRATEUR** | Gestionnaire | Toutes pages + édition |

---

## 📐 Règles Métier Critiques

### Joueurs
- ✅ Tous champs obligatoires (nom, prénom, entreprise, licence, email)
- ✅ Licence unique format `LXXXXXX`
- ✅ Email unique
- ❌ Suppression impossible si dans une équipe

### Équipes
- ✅ 2 joueurs même entreprise
- ✅ Un joueur = 1 seule équipe par saison
- ❌ Modification/suppression impossible si matchs joués

### Poules
- ✅ **EXACTEMENT 6 équipes** (strict)
- ✅ Nom unique
- ❌ Suppression impossible si matchs joués

### Événements
- ✅ Date >= aujourd'hui
- ✅ 1 à 3 matchs par événement
- ✅ Heure format HH:MM (00:00-23:59)
- ❌ Suppression impossible si matchs terminés

### Matchs
- ✅ Une piste = 1 match par créneau
- ✅ Une équipe = 1 match par événement
- ✅ Piste entre 1-10
- ❌ Suppression uniquement si statut `A_VENIR`

### Scores
- **Format**: `"X-Y, X-Y"` ou `"X-Y, X-Y, X-Y"`
- **Exemples**: `"6-4, 6-3"`, `"6-4, 3-6, 7-5"`
- **Règles**:
  - Vainqueur set >= 6 jeux
  - Si 7-X alors X <= 5
  - 7-6 autorisé (tie-break)
  - 2 ou 3 sets max

### Classement
- **Victoire**: 3 points
- **Défaite**: 0 point
- **Match annulé**: ne compte pas
- **Ordre**: Points > Victoires > Diff sets > Alphabétique

---

## 🎨 Stack & Composants shadcn-vue

### Par Page

| Page | Composants shadcn-vue |
|------|----------------------|
| **Login** | Card, Input, Button, Alert |
| **Planning** | Calendar, Dialog, Badge, Select |
| **Matchs** | Table, Badge, Checkbox, Dialog |
| **Résultats** | Table, Tabs, Card |
| **Administration** | Dialog, AlertDialog, Form, Select, Table |
| **Profil** | Avatar, Card, Input, Button, Form |

---

## 🔌 API REST

### Base URL
```
http://localhost:8000/api/v1
```

### Codes HTTP
| Code | Usage |
|------|-------|
| 200 | OK (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (rôle insuffisant ou compte bloqué) |
| 404 | Not Found |
| 409 | Conflict (email/licence déjà utilisé) |
| 422 | Validation échouée |
| 500 | Erreur serveur |

### Endpoints Critiques

#### Auth
```
POST /auth/login - Connexion (avec anti-brute force)
POST /auth/change-password - Changer mot de passe
POST /auth/logout - Déconnexion
```

#### Players
```
GET /players - Liste joueurs (Admin)
GET /players/{id} - Détails joueur
POST /players - Créer joueur (Admin)
PUT /players/{id} - Modifier joueur (Admin)
DELETE /players/{id} - Supprimer joueur (Admin, si pas dans équipe)
```

#### Teams
```
GET /teams?pool_id=&company= - Liste équipes
POST /teams - Créer équipe (Admin, validation même entreprise)
PUT /teams/{id} - Modifier équipe (Admin, si pas de matchs joués)
DELETE /teams/{id} - Supprimer équipe (Admin, si pas de matchs joués)
```

#### Events
```
GET /events?start_date=&end_date=&month= - Liste événements
POST /events - Créer événement (Admin, 1-3 matchs)
PUT /events/{id} - Modifier événement (Admin)
DELETE /events/{id} - Supprimer événement (Admin, si statut A_VENIR)
```

#### Matches
```
GET /matches?upcoming=true&team_id=&my_matches=true - Liste matchs
POST /matches - Créer match (Admin)
PUT /matches/{id} - Modifier match (Admin, score si TERMINE)
DELETE /matches/{id} - Supprimer match (Admin, si A_VENIR)
```

#### Results
```
GET /results/my-results - Résultats utilisateur connecté
GET /results/rankings - Classement général entreprises
```

#### Profile
```
GET /profile/me - Profil utilisateur
PUT /profile/me - Modifier profil
POST /profile/me/photo - Upload photo (max 2MB, jpg/png)
DELETE /profile/me/photo - Supprimer photo
```

#### Admin
```
POST /admin/accounts/create - Créer compte pour joueur
POST /admin/accounts/{user_id}/reset-password - Reset mot de passe
```

---

## 📝 Validation Formats

### Regex
```javascript
// Email
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

// Licence
^L\d{6}$

// Nom/Prénom
^[a-zA-ZÀ-ÿ\s'-]{2,50}$

// Score
^(\d+-\d+)(,\s*\d+-\d+){1,2}$

// Date
^\d{4}-\d{2}-\d{2}$

// Heure
^([01]\d|2[0-3]):([0-5]\d)$
```

### Contraintes
- **Nom/Prénom**: 2-50 caractères, lettres uniquement
- **Entreprise**: 2-100 caractères
- **Email**: Format valide + unique
- **Licence**: LXXXXXX + unique
- **Date naissance**: >= 16 ans, pas futur
- **Photo**: jpg/png, max 2MB, 400x400px recommandé
- **Piste**: 1-10
- **Heure**: 00:00-23:59

---

## 🧪 Tests (Couverture >= 70%)

### Tests Unitaires Backend (Pytest)
```bash
pytest --cov=app --cov-report=html --cov-report=term
```

**À tester**:
- ✅ Auth (login success, échec, brute force)
- ✅ Joueurs (CRUD + validations)
- ✅ Équipes (même entreprise, joueur unique)
- ✅ Poules (exactement 6 équipes)
- ✅ Matchs (piste unique, validation scores)
- ✅ Sécurité (SQL injection, XSS, sanitization)

### Tests E2E Cypress
```bash
npx cypress open
```

**Scénarios**:
- ✅ Parcours visiteur (page accueil → login)
- ✅ Parcours joueur (login → planning → matchs → résultats → profil)
- ✅ Parcours admin (login → admin → gestion complète)
- ✅ Brute force (5 tentatives → blocage)

---

## 📦 Livrables

### Code Source
- ✅ Backend FastAPI complet
- ✅ Frontend VueJS + shadcn-vue
- ✅ Base SQLite avec données test
- ✅ Tests unitaires + E2E
- ✅ README.md détaillé
- ✅ requirements.txt + package.json
- ✅ Fichiers .env.example

### Rapport Technique (10-15 pages PDF)
1. **Introduction** - Contexte, objectifs
2. **Architecture** - Schémas, stack, modèle données
3. **Fonctionnalités** - Description + screenshots
4. **Sécurité** - Mesures, tests, vulnérabilités
5. **Tests** - Stratégie, couverture, résultats
6. **Difficultés** - Problèmes rencontrés
7. **Améliorations** - Suggestions futures
8. **Conclusion**

---

## 🎯 Critères Évaluation

| Critère | Points | Détails |
|---------|--------|---------|
| **Fonctionnalités** | 10 | Toutes pages implémentées |
| **Sécurité** | 3 | Auth JWT, anti-brute force, protection |
| **Tests** | 4 | Unitaires (2pts) + E2E (2pts) |
| **Qualité code** | 2 | Organisation, conventions, erreurs |
| **Rapport** | 1 | Clarté, structure, screenshots |
| **BONUS** | +2 | Tests OWASP (+1), Features (+0.5), UI (+0.5) |
| **TOTAL** | 20 | (+2 max bonus) |

---

## 🚀 Comptes Test

### Administrateur
```
Email: admin@padel.com
Password: Admin@2025!
```

### Joueur
```
Email: joueur@padel.com
Password: Joueur@2025!
```

---

## ⚠️ Checklist Avant Rendu

- [ ] Application démarre selon README
- [ ] Comptes test fonctionnent
- [ ] Anti-brute force opérationnel
- [ ] Mots de passe hashés (bcrypt)
- [ ] Toutes validations en place
- [ ] Tests unitaires >= 70%
- [ ] Tests E2E passent
- [ ] Rapport PDF complet
- [ ] Code commenté et propre
- [ ] .gitignore correct (venv/, node_modules/, .env)
- [ ] requirements.txt + package.json à jour
- [ ] Pas d'erreurs console frontend
- [ ] Pas d'erreurs logs backend
- [ ] Messages erreur clairs
- [ ] Navigation fonctionnelle
- [ ] Rôles vérifiés
- [ ] Routes protégées
- [ ] Classement correct
- [ ] Filtres matchs OK
- [ ] Validation temps réel formulaires

---

## 📅 Planning Suggéré (12h)

| Heures | Tâches |
|--------|--------|
| H0-H1 | Prise en main kit + CDC |
| H1-H3 | Modèle données + API joueurs/équipes/poules |
| H3-H5 | API événements/matchs + Frontend base |
| H5-H7 | Pages Planning, Matchs, Résultats |
| H7-H8 | Page Admin + Gestion comptes |
| H8-H9 | Profil + Upload photo |
| H9-H10 | Tests unitaires + E2E |
| H10-H11 | Corrections + Sécurité |
| H11-H12 | Rapport technique |

---

## 🔗 Ressources

- **shadcn-vue**: https://www.shadcn-vue.com
- **FastAPI**: https://fastapi.tiangolo.com
- **VueJS 3**: https://vuejs.org
- **SQLAlchemy**: https://docs.sqlalchemy.org
- **Pytest**: https://docs.pytest.org
- **Cypress**: https://docs.cypress.io
- **OWASP Top 10**: https://owasp.org/www-project-top-ten

---

**Version**: 1.0
**Dernière mise à jour**: 2025-11-26
**Projet**: Corpo Padel - Polytech Tours
