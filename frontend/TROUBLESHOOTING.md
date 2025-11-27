# Troubleshooting - Page Planning

## Problème : "Je ne vois rien sur la page Planning"

### Solutions possibles :

### 1. Installer les dépendances

La page Planning nécessite des dépendances supplémentaires. Exécutez :

```bash
cd frontend
npm install
```

### 2. Vérifier que le serveur tourne

```bash
npm run dev
```

Le serveur doit afficher :
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3. Ouvrir la bonne URL

- Page Planning : http://localhost:5173/planning
- Page Accueil : http://localhost:5173/

### 4. Vérifier la console du navigateur

Ouvrez les DevTools (F12) et regardez la console pour voir les erreurs :

**Erreurs communes :**

#### Erreur : "Failed to resolve module specifier 'lucide-vue-next'"
**Solution :** Les icônes ne sont pas installées
```bash
npm install lucide-vue-next
```

#### Erreur : "Cannot find module '@/lib/utils'"
**Solution :** L'alias @ n'est pas configuré (déjà fait dans vite.config.js)

#### Erreur : "Cannot find module 'clsx' or 'tailwind-merge'"
**Solution :**
```bash
npm install clsx tailwind-merge class-variance-authority
```

#### Erreur : "radix-vue is not defined"
**Solution :**
```bash
npm install radix-vue @vueuse/core
```

### 5. Installer TOUTES les dépendances manquantes

Si plusieurs erreurs apparaissent, installez tout en une fois :

```bash
cd frontend
npm install radix-vue lucide-vue-next clsx tailwind-merge class-variance-authority @vueuse/core tailwindcss-animate
```

### 6. Vider le cache et redémarrer

```bash
# Arrêter le serveur (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

### 7. Vérifier que les composants sont bien importés

Les composants UI doivent être dans `src/components/ui/` :
- ✅ button.vue
- ✅ card.vue
- ✅ badge.vue
- ✅ dialog.vue

### 8. Problème de route (redirection vers login)

Si vous êtes redirigé vers `/login`, c'est normal car la route Planning nécessite l'authentification.

**Solution temporaire :** La route a été modifiée pour ne pas nécessiter d'auth pendant le développement.

**Solution permanente :** Créez un compte et connectez-vous.

## Vérification rapide

Commandes à exécuter dans l'ordre :

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Vérifier que package.json contient les bonnes dépendances
cat package.json | grep -E "(lucide-vue-next|radix-vue|clsx)"

# 4. Lancer le serveur
npm run dev

# 5. Ouvrir http://localhost:5173/planning dans le navigateur
```

## État attendu

### Console navigateur (aucune erreur)
✅ Pas d'erreur rouge

### Page Planning affiche :
- ✅ Titre "Planning" en haut
- ✅ Bouton "Nouvel événement"
- ✅ Calendrier avec le mois actuel (Novembre 2025)
- ✅ Boutons de navigation (< >)
- ✅ Grille de 7 colonnes (Lun à Dim)
- ✅ Jours du mois cliquables
- ✅ Points bleus sur les dates avec événements (15 et 22)
- ✅ Message "Sélectionnez une date..." en bas

### Après clic sur un jour avec événement (15 ou 22) :
- ✅ Carte avec détails de l'événement
- ✅ Heure (19:30 ou 20:00)
- ✅ Liste des matchs
- ✅ Pistes, équipes, statut

## Toujours des problèmes ?

1. Vérifiez que Node.js est installé : `node --version` (minimum v18)
2. Vérifiez que npm est installé : `npm --version`
3. Supprimez node_modules et réinstallez :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contact

Si le problème persiste, partagez :
- La sortie de `npm run dev`
- Les erreurs dans la console du navigateur (F12)
- La version de Node.js : `node --version`
