# Quick Start - Padel Corpo

Pour les instructions completes d'installation et d'utilisation, consultez le fichier **[README.md](README.md)**.

## Installation rapide

```bash
# 1. Backend
cd backend
npm install
npm run init   # Cree la base de donnees et insere les donnees de test

# 2. Frontend (dans un autre terminal)
cd frontend
npm install
```

## Lancement

```bash
# Terminal 1 - Backend
cd backend
npm run dev     # http://localhost:8000

# Terminal 2 - Frontend
cd frontend
npm run dev     # http://localhost:5173
```

## Comptes de test

| Role | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@padel.com | Admin123! |
| Joueur | jean.martin@padel.com | Player123! |

## Reinitialiser les donnees

```bash
cd backend
npm run init
```
