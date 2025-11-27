# Collection Bruno - Tests d'Authentification API

Cette collection Bruno contient tous les tests automatisés pour les endpoints d'authentification de l'API Padel Corpo.

## 📋 Prérequis

1. **Installer Bruno** : Téléchargez et installez Bruno depuis [usebruno.com](https://www.usebruno.com/)
2. **Backend en cours d'exécution** : Assurez-vous que votre backend est démarré

## 🚀 Configuration

### Importer la collection dans Bruno

1. Ouvrez Bruno
2. Cliquez sur "Open Collection"
3. Sélectionnez le dossier `bruno_collection`
4. La collection sera chargée avec tous les tests

### Configuration de l'environnement

L'environnement `Local` est pré-configuré avec les variables suivantes :

```
base_url: http://localhost:5173
token: (sera rempli automatiquement après login/register)
```

> **⚠️ Note importante** : L'URL de base est configurée sur `http://localhost:5173`. Si votre backend tourne sur un port différent (par exemple `http://localhost:8000`), modifiez la variable `base_url` dans le fichier `environments/Local.bru`.

## 🧪 Tests disponibles

### 1. Tests d'inscription (Register)

1. ✅ **Register - Success** : Inscription réussie d'un nouvel utilisateur
2. ❌ **Register - Duplicate Email** : Vérification du rejet d'un email déjà utilisé
3. ❌ **Register - Invalid Email** : Vérification du format d'email invalide
4. ❌ **Register - Password Too Short** : Vérification de la longueur minimale du mot de passe
5. ❌ **Register - Missing Fields** : Vérification des champs requis

### 2. Tests de connexion (Login)

6. ✅ **Login - Success** : Connexion réussie avec les identifiants corrects

### 3. Tests de déconnexion (Logout)

7. ✅ **Logout - With Token** : Déconnexion avec un token valide
8. ❌ **Logout - Without Token** : Vérification du rejet sans token d'authentification

## 📝 Utilisation

### Exécuter les tests manuellement

1. Sélectionnez un test dans la liste
2. Cliquez sur "Send" pour exécuter la requête
3. Les assertions et tests s'exécuteront automatiquement
4. Vérifiez la console pour les logs de succès/échec

### Exécuter tous les tests en séquence

1. Cliquez avec le bouton droit sur le nom de la collection
2. Sélectionnez "Run Collection"
3. Tous les tests s'exécuteront dans l'ordre (seq: 1, 2, 3, etc.)

### Variables dynamiques

- **{{timestamp}}** : Utilisé dans le test "Register - Success" pour générer un email unique à chaque exécution
- **{{token}}** : Automatiquement défini après une inscription ou connexion réussie, utilisé pour les tests d'authentification

## 🔍 Vérifications automatiques

Chaque test inclut :

- ✅ **Assertions** : Vérification automatique du status code et des champs de réponse
- ✅ **Tests** : Tests JavaScript pour valider la logique métier
- ✅ **Scripts post-response** : Logs de console et sauvegarde automatique du token

## 📊 Format des réponses attendues

### Inscription/Connexion réussie
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhb...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "JOUEUR",
    "is_active": true
  }
}
```

### Erreur
```json
{
  "detail": "Message d'erreur en français"
}
```

## 🆚 Différences avec Insomnia

Bruno utilise un format de fichiers texte qui est :
- ✅ Plus git-friendly
- ✅ Plus facile à versionner
- ✅ Opensource et gratuit
- ✅ Stockage local uniquement (pas de cloud)

## 🔧 Personnalisation

Pour modifier l'URL de base ou ajouter d'autres variables d'environnement :

1. Ouvrez le fichier `environments/Local.bru`
2. Modifiez ou ajoutez des variables dans le bloc `vars { }`
3. Utilisez-les dans vos requêtes avec la syntaxe `{{nom_variable}}`

## 🐛 Dépannage

### Les tests échouent tous
- Vérifiez que le backend est bien démarré
- Vérifiez l'URL de base dans `environments/Local.bru`
- Assurez-vous que la base de données est configurée

### Le token n'est pas sauvegardé
- Exécutez d'abord le test "Register - Success" ou "Login - Success"
- Vérifiez la console pour les messages de confirmation

### Erreur 404
- L'URL de base est probablement incorrecte
- Vérifiez que votre backend écoute sur le bon port
- L'API devrait être accessible à `http://localhost:[PORT]/api/v1`
