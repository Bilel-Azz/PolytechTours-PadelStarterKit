# 🚀 Quick Start - Corpo Padel

## Installation rapide

### 1️⃣ Installer les dépendances Frontend

```bash
cd frontend
npm install
```

### 2️⃣ Lancer le serveur Frontend

```bash
npm run dev
```

✅ Le frontend sera accessible sur : **http://localhost:5173**

### 3️⃣ Accéder à la page Planning

Ouvrez votre navigateur et allez sur :
- **http://localhost:5173/planning**

### 4️⃣ Backend (optionnel pour l'instant)

Le backend n'est pas nécessaire pour voir l'UI de la page Planning (mock data).

Pour lancer le backend plus tard :

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend accessible sur : **http://localhost:8000**

---

## 📋 Pages disponibles

| Page | URL | Auth requise |
|------|-----|--------------|
| Accueil | http://localhost:5173/ | Non |
| Planning | http://localhost:5173/planning | Non (temporaire) |
| Login | http://localhost:5173/login | Non |

---

## ⚠️ Problèmes courants

### Erreur : "npm: command not found"
**Solution :** Installez Node.js depuis https://nodejs.org/ (version 18+)

### Page blanche sur /planning
**Solution :**
1. Vérifiez la console du navigateur (F12)
2. Exécutez : `npm install`
3. Consultez `frontend/TROUBLESHOOTING.md`

### Module 'lucide-vue-next' not found
**Solution :**
```bash
cd frontend
npm install lucide-vue-next radix-vue clsx tailwind-merge
```

---

## 🎯 Fonctionnalités de la page Planning

### ✅ Implémenté
- Calendrier mensuel interactif
- Navigation entre les mois
- Sélection de date
- Affichage des événements par date
- Détails des matchs (piste, équipes, statut)
- Mock data pour démonstration

### 🔜 À venir
- Connexion à l'API backend
- Ajout/modification d'événements (Admin)
- Filtres (mes matchs / tous les matchs)
- Gestion des permissions (Joueur vs Admin)

---

## 📦 Dépendances installées

Frontend :
- Vue 3.3.4
- Vue Router 4.2.5
- Pinia 2.1.7
- Axios 1.6.0
- TailwindCSS 3.3.5
- Radix Vue (composants UI)
- Lucide Icons (icônes)

---

**Bon développement ! 🎾**
