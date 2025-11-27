# Installation Frontend - Corpo Padel

## Étapes d'installation

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

## Structure créée

### Composants shadcn-vue

Les composants suivants ont été créés dans `src/components/ui/` :

- **Button** - Boutons avec variants (default, outline, destructive, etc.)
- **Card** - Cartes pour conteneurs
- **Badge** - Badges pour statuts
- **Dialog** - Modales (préparé pour les formulaires)

### Pages

- **PlanningPage** (`src/views/PlanningPage.vue`)
  - Calendrier mensuel interactif
  - Sélection de date
  - Affichage des événements par date
  - Mock data pour démonstration

### Configuration

- ✅ TailwindCSS configuré avec variables CSS personnalisées
- ✅ shadcn-vue prêt avec dépendances (radix-vue, lucide-icons)
- ✅ Alias `@` configuré pour imports
- ✅ Proxy API vers backend (port 8000)

## Prochaines étapes

1. Installer les dépendances : `npm install`
2. Connecter l'API backend pour remplacer les mock data
3. Ajouter le formulaire d'ajout/modification d'événements (Dialog)
4. Implémenter les filtres (mes matchs uniquement / tous les matchs)
5. Ajouter la gestion des permissions (Admin vs Joueur)

## Dépendances principales

```json
{
  "vue": "^3.3.4",
  "vue-router": "^4.2.5",
  "pinia": "^2.1.7",
  "axios": "^1.6.0",
  "radix-vue": "^1.9.0",
  "lucide-vue-next": "^0.379.0",
  "@vueuse/core": "^10.9.0"
}
```
