# Tests Unitaires et d'Intégration - Backend Padel Corpo

Ce document explique comment installer et exécuter les tests de sécurité pour le backend.

## Table des matières

1. [Installation des dépendances](#installation-des-dépendances)
2. [Structure des tests](#structure-des-tests)
3. [Exécution des tests](#exécution-des-tests)
4. [Couverture des tests](#couverture-des-tests)
5. [Description des tests](#description-des-tests)

## Installation des dépendances

### Étape 1: Nettoyer le cache npm (si nécessaire)

Si vous rencontrez des problèmes de permissions, exécutez :

```bash
npm cache clean --force
```

### Étape 2: Installer les dépendances de test

```bash
cd backend
npm install --save-dev jest supertest
```

### Étape 3: Vérifier l'installation

```bash
npx jest --version
```

## Structure des tests

```
backend/
├── __tests__/
│   ├── setup.js                           # Configuration globale des tests
│   ├── helpers/
│   │   └── testHelpers.js                # Fonctions utilitaires pour les tests
│   ├── unit/
│   │   └── security.test.js              # Tests unitaires (bcrypt, JWT, validation)
│   └── integration/
│       ├── auth.test.js                  # Tests d'authentification
│       ├── bruteforce.test.js            # Tests anti-brute force
│       ├── validation.test.js            # Tests de validation des entrées
│       └── security-headers.test.js      # Tests des headers de sécurité
├── jest.config.js                         # Configuration Jest
└── package.json                           # Scripts de test
```

## Exécution des tests

### Lancer tous les tests avec couverture

```bash
npm test
```

### Lancer tous les tests en mode watch (développement)

```bash
npm run test:watch
```

### Lancer uniquement les tests unitaires

```bash
npm run test:unit
```

### Lancer uniquement les tests d'intégration

```bash
npm run test:integration
```

### Lancer les tests avec verbose

```bash
npm run test:verbose
```

### Lancer un fichier de test spécifique

```bash
npx jest __tests__/unit/security.test.js
npx jest __tests__/integration/auth.test.js
```

### Lancer les tests avec un pattern spécifique

```bash
npx jest --testNamePattern="bcrypt"
npx jest --testNamePattern="brute force"
```

## Couverture des tests

Les tests génèrent automatiquement un rapport de couverture dans le dossier `coverage/`.

### Voir le rapport de couverture HTML

```bash
npm test
open coverage/lcov-report/index.html
```

### Objectifs de couverture

- **Lignes** : > 80%
- **Branches** : > 75%
- **Fonctions** : > 80%
- **Instructions** : > 80%

## Description des tests

### 1. Tests Unitaires (unit/security.test.js)

#### Hashing bcrypt
- ✅ Le hash ne doit pas être identique au mot de passe en clair
- ✅ Le même mot de passe génère des hashes différents (salt)
- ✅ La vérification du mot de passe fonctionne
- ✅ Un mauvais mot de passe ne passe pas la vérification
- ✅ Le coût de hashing est suffisant (≥ 10)

#### JWT (JSON Web Tokens)
- ✅ Création de token JWT
- ✅ Décodage de token JWT valide
- ✅ Token invalide lève une erreur
- ✅ Token avec mauvaise signature lève une erreur
- ✅ Token expiré lève une erreur
- ✅ Le payload ne contient pas de données sensibles

#### Validation des entrées
- ✅ Validation email - formats valides
- ✅ Validation email - formats invalides
- ✅ Validation mot de passe - longueur minimale

### 2. Tests d'Intégration - Authentification (integration/auth.test.js)

#### POST /api/v1/auth/register
- ✅ Inscription réussie avec credentials valides
- ✅ Échec si email déjà utilisé
- ✅ Échec si email invalide
- ✅ Échec si mot de passe trop court
- ✅ Échec si champs manquants

#### POST /api/v1/auth/login
- ✅ Connexion réussie avec credentials valides
- ✅ Échec avec email incorrect
- ✅ Échec avec mot de passe incorrect
- ✅ Échec si compte désactivé

#### POST /api/v1/auth/change-password
- ✅ Changement de mot de passe réussi
- ✅ Échec si mot de passe actuel incorrect
- ✅ Échec si nouveau mot de passe identique à l'ancien
- ✅ Échec sans authentification
- ✅ Échec avec token invalide

#### POST /api/v1/auth/logout
- ✅ Déconnexion réussie avec token valide
- ✅ Échec sans token
- ✅ Échec avec token invalide

### 3. Tests Anti-Brute Force (integration/bruteforce.test.js)

- ✅ Blocage après 5 tentatives échouées
- ✅ Compteur de tentatives décrémente correctement
- ✅ Réinitialisation du compteur après connexion réussie
- ✅ Le compte reste bloqué pendant toute la durée du lockout
- ✅ Le blocage expire après le délai configuré (30 minutes)
- ✅ Chaque email a son propre compteur de tentatives
- ✅ Le timestamp last_attempt est mis à jour
- ✅ Protection contre les attaques par dictionnaire

### 4. Tests de Validation (integration/validation.test.js)

#### Validation de l'email
- ✅ Formats valides acceptés
- ✅ Formats invalides rejetés
- ✅ Email manquant rejeté
- ✅ Email null ou vide rejeté

#### Validation du mot de passe
- ✅ Longueur minimale respectée
- ✅ Mots de passe trop courts rejetés
- ✅ Mot de passe manquant rejeté
- ✅ Mot de passe null ou vide rejeté

#### Protection contre les injections
- ✅ Protection SQL injection
- ✅ Protection XSS
- ✅ Protection contre caractères spéciaux malveillants

#### Sanitization des sorties
- ✅ Messages d'erreur ne révèlent pas d'informations sensibles
- ✅ Pas de hash de mot de passe dans les réponses

### 5. Tests des Headers de Sécurité (integration/security-headers.test.js)

#### Headers implémentés
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ CORS configuré correctement
- ✅ Content-Type correct pour les réponses JSON

#### Headers recommandés (documentation)
- 📋 Strict-Transport-Security (HSTS) - À ajouter
- 📋 Content-Security-Policy (CSP) - À ajouter
- 📋 Permissions-Policy - À ajouter
- 📋 Referrer-Policy - À ajouter

#### Sécurité des headers
- ✅ Pas d'informations de version exposées
- ✅ X-Powered-By désactivé
- ✅ Pas d'informations de débogage

## Métriques de sécurité testées

### 🔐 Hashing des mots de passe
- **Algorithme** : bcrypt
- **Coût** : 10 (2^10 = 1024 itérations)
- **Salt** : Automatique et unique par mot de passe

### 🛡️ Protection anti-brute force
- **Tentatives max** : 5
- **Durée de blocage** : 30 minutes
- **Scope** : Par email

### 🔑 JWT
- **Algorithme** : HS256
- **Expiration** : 24 heures
- **Contenu** : user id, email, role (pas de données sensibles)

### ✅ Validation
- **Email** : Format RFC 5322
- **Mot de passe** : Minimum 8 caractères

### 🛡️ Headers de sécurité
- **X-Content-Type-Options** : nosniff
- **X-Frame-Options** : DENY
- **X-XSS-Protection** : 1; mode=block

## Résolution des problèmes

### Les tests échouent avec "Cannot find module"

```bash
npm install
```

### Les tests SQLite échouent

```bash
npm rebuild sqlite3
```

### Erreur de permissions npm

```bash
npm cache clean --force
sudo chown -R $USER ~/.npm
```

### Les tests sont lents

Utilisez l'option `--maxWorkers` :

```bash
npx jest --maxWorkers=4
```

## Bonnes pratiques

1. **Lancer les tests avant chaque commit**
   ```bash
   npm test
   ```

2. **Vérifier la couverture de code**
   - Objectif : > 80% de couverture

3. **Utiliser le mode watch en développement**
   ```bash
   npm run test:watch
   ```

4. **Tester en environnement isolé**
   - Les tests utilisent une base de données SQLite en mémoire
   - Pas d'impact sur la base de données de développement

## Amélioration continue

### Tests à ajouter
- [ ] Tests de performance
- [ ] Tests de charge pour la protection anti-brute force
- [ ] Tests end-to-end (E2E)
- [ ] Tests de sécurité OWASP

### Fonctionnalités à tester
- [ ] Rate limiting global
- [ ] 2FA (authentification à deux facteurs)
- [ ] Rotation des tokens
- [ ] Audit logs

## Ressources

- [Documentation Jest](https://jestjs.io/)
- [Documentation Supertest](https://github.com/visionmedia/supertest)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [bcrypt Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
