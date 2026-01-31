# Padel Corpo - Application de Gestion de Tournoi

Application web de gestion de tournoi de Padel inter-entreprises, developpee dans le cadre du projet Polytech Tours.

## Sommaire

- [Presentation](#presentation)
- [Technologies](#technologies)
- [Installation](#installation)
- [Lancement](#lancement)
- [Comptes de Test](#comptes-de-test)
- [Structure du Projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Tests](#tests)

---

## Presentation

Padel Corpo est une application permettant de gerer un tournoi de Padel entre entreprises. Elle permet de :

- **Gerer les joueurs** : creation, modification, suppression de joueurs avec leur entreprise
- **Gerer les equipes** : association de 2 joueurs de la meme entreprise
- **Gerer les entreprises** : creation et gestion des entreprises participantes
- **Gerer les poules** : organisation des equipes en poules de 6
- **Gerer les evenements** : planification des journees de matchs
- **Gerer les matchs** : creation, saisie des scores, suivi des resultats
- **Consulter le planning** : calendrier interactif des matchs
- **Consulter les classements** : classement par poule et general

### Roles utilisateurs

| Role | Acces |
|------|-------|
| **Visiteur** | Page d'accueil uniquement |
| **Joueur** | Planning, matchs, resultats, profil |
| **Administrateur** | Toutes les pages + gestion complete |

---

## Technologies

### Backend
- **Node.js** avec Express.js
- **Sequelize** ORM
- **SQLite** base de donnees
- **JWT** authentification
- **bcrypt** hashage des mots de passe
- **Zod** validation des donnees

### Frontend
- **Vue.js 3** avec Composition API
- **Vite** build tool
- **Pinia** state management
- **Vue Router** navigation
- **TailwindCSS** styles
- **Radix Vue / shadcn-vue** composants UI
- **Lucide** icones

---

## Installation

### Prerequis

- **Node.js** version 18 ou superieure
- **npm** (inclus avec Node.js)

### Etapes d'installation

#### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd PolytechTours-PadelStarterKit
```

#### 2. Installer les dependances Backend

```bash
cd backend
npm install
```

#### 3. Initialiser la base de donnees

Cette commande cree la base de donnees SQLite et insere les donnees de test :

```bash
npm run init
```

> **Note** : Cette commande execute `setup` puis `seed`. Vous pouvez aussi les lancer separement :
> - `npm run setup` : cree uniquement les tables
> - `npm run seed` : insere les donnees de test

#### 4. Installer les dependances Frontend

```bash
cd ../frontend
npm install
```

---

## Lancement

### Option 1 : Lancement separe (recommande pour le developpement)

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```
Le serveur backend demarre sur : **http://localhost:8000**

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```
Le serveur frontend demarre sur : **http://localhost:5173**

### Option 2 : Lancement en production

**Backend :**
```bash
cd backend
npm start
```

**Frontend :**
```bash
cd frontend
npm run build
npm run preview
```

---

## Comptes de Test

Apres l'initialisation avec `npm run init`, les comptes suivants sont disponibles :

### Administrateur
```
Email: admin@padel.com
Mot de passe: Admin123!
```

### Joueurs (12 comptes)
```
Email: jean.martin@padel.com
Mot de passe: Player123!

Email: paul.bernard@padel.com
Mot de passe: Player123!

Email: pierre.dubois@padel.com
Mot de passe: Player123!
```

*(et 9 autres joueurs avec le meme format d'email et mot de passe)*

---

## Structure du Projet

```
PolytechTours-PadelStarterKit/
├── backend/                    # API Express.js
│   ├── config/                 # Configuration (database)
│   ├── middleware/             # Middlewares (auth, errorHandler)
│   ├── models/                 # Modeles Sequelize
│   │   ├── User.js
│   │   ├── Player.js
│   │   ├── Team.js
│   │   ├── Company.js
│   │   ├── Pool.js
│   │   ├── Event.js
│   │   └── Match.js
│   ├── routes/                 # Routes API
│   │   ├── auth.js
│   │   ├── players.js
│   │   ├── teams.js
│   │   ├── companies.js
│   │   ├── pools.js
│   │   ├── events.js
│   │   ├── matches.js
│   │   └── ...
│   ├── scripts/                # Scripts utilitaires
│   │   ├── setup.js            # Initialisation DB
│   │   ├── seed_complete.js    # Donnees de test
│   │   └── createAdmin.js      # Creation admin manuel
│   ├── validators/             # Schemas de validation Zod
│   ├── __tests__/              # Tests Jest
│   ├── server.js               # Point d'entree
│   └── package.json
│
├── frontend/                   # Application Vue.js
│   ├── src/
│   │   ├── components/         # Composants reutilisables
│   │   ├── views/              # Pages
│   │   │   ├── admin/          # Pages administration
│   │   │   ├── LoginView.vue
│   │   │   ├── PlanningView.vue
│   │   │   └── ...
│   │   ├── stores/             # Stores Pinia
│   │   ├── services/           # Services API
│   │   ├── router/             # Configuration routes
│   │   └── App.vue
│   └── package.json
│
├── .gitignore
├── README.md                   # Ce fichier
├── SPECS.md                    # Specifications detaillees
└── QUICK_START.md              # Guide rapide (ancien)
```

---

## API Endpoints

Base URL : `http://localhost:8000/api/v1`

### Authentification
| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion |
| POST | `/auth/register` | Inscription |
| GET | `/auth/me` | Utilisateur courant |

### Joueurs
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/players` | Liste des joueurs |
| GET | `/players/:id` | Details joueur |
| POST | `/players` | Creer joueur (Admin) |
| PUT | `/players/:id` | Modifier joueur (Admin) |
| DELETE | `/players/:id` | Supprimer joueur (Admin) |

### Equipes
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/teams` | Liste des equipes |
| POST | `/teams` | Creer equipe (Admin) |
| PUT | `/teams/:id` | Modifier equipe (Admin) |
| DELETE | `/teams/:id` | Supprimer equipe (Admin) |

### Entreprises
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/companies` | Liste des entreprises |
| POST | `/companies` | Creer entreprise (Admin) |
| PUT | `/companies/:id` | Modifier entreprise (Admin) |
| DELETE | `/companies/:id` | Supprimer entreprise (Admin) |
| GET | `/companies/:id/players` | Joueurs de l'entreprise |

### Poules
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/pools` | Liste des poules |
| POST | `/pools` | Creer poule (Admin) |
| PUT | `/pools/:id` | Modifier poule (Admin) |
| DELETE | `/pools/:id` | Supprimer poule (Admin) |

### Evenements
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/events` | Liste des evenements |
| POST | `/events` | Creer evenement (Admin) |
| PUT | `/events/:id` | Modifier evenement (Admin) |
| DELETE | `/events/:id` | Supprimer evenement (Admin) |

### Matchs
| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/matches` | Liste des matchs |
| POST | `/matches` | Creer match (Admin) |
| PUT | `/matches/:id` | Modifier match / score (Admin) |
| DELETE | `/matches/:id` | Supprimer match (Admin) |

---

## Tests

### Lancer les tests

```bash
cd backend
npm test
```

### Tests avec couverture detaillee

```bash
npm run test:verbose
```

### Resultats actuels

- **144 tests** passes
- **11 suites** de tests
- **41.5%** de couverture globale
- **100%** taux de reussite

Couverture par module :
- Models : 97%
- Middleware : 66%
- Routes : 33%

---

## Donnees de test

L'initialisation cree automatiquement :

| Element | Quantite |
|---------|----------|
| Entreprises | 12 |
| Joueurs | 48 (4 par entreprise) |
| Comptes joueurs | 12 |
| Equipes | 12 (1 par entreprise) |
| Poules | 2 (6 equipes chacune) |
| Evenements | 5 journees |
| Matchs | 30 (round-robin complet) |

Les matchs sont organises en tournoi round-robin : chaque equipe affronte toutes les autres equipes de sa poule une fois.

---

## Reinitialiser les donnees

Pour repartir de zero avec une base propre :

```bash
cd backend
npm run init
```

> **Attention** : Cette commande supprime toutes les donnees existantes et recree la base avec les donnees de test.

---

## Resolution de problemes

### La base de donnees n'existe pas
```bash
cd backend
npm run init
```

### Erreur de connexion a la base
Verifiez que vous etes dans le bon dossier et que les dependances sont installees :
```bash
cd backend
npm install
npm run init
```

### Le frontend ne se connecte pas au backend
Verifiez que le backend est bien lance sur le port 8000 :
```bash
cd backend
npm run dev
```

### Reinitialiser completement
```bash
cd backend
rm -f padel_corpo.db   # Supprimer la DB existante
npm run init           # Recreer et peupler
npm run dev            # Relancer le serveur
```

---

## Auteurs

Projet realise dans le cadre du cours de developpement web - Polytech Tours

---

## Licence

Ce projet est a usage educatif uniquement.
