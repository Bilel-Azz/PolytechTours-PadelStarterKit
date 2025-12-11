// ============================================
// FICHIER : backend/__tests__/setup.js
// Setup global pour tous les tests
// ============================================

const { sequelize } = require('../models');

// Configuration globale avant tous les tests
beforeAll(async () => {
  // Utiliser une base de données de test
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = ':memory:';

  // Synchroniser la base de données
  await sequelize.sync({ force: true });
});

// Nettoyage après tous les tests
afterAll(async () => {
  await sequelize.close();
});

// Nettoyer la base de données entre chaque test
afterEach(async () => {
  // Supprimer toutes les données des tables avec force pour éviter les contraintes
  const models = Object.values(sequelize.models);

  // Nettoyer dans l'ordre inverse pour respecter les foreign keys
  for (const model of models.reverse()) {
    try {
      await model.destroy({
        where: {},
        truncate: true,
        cascade: true,
        force: true,
        restartIdentity: true
      });
    } catch (error) {
      // Ignorer les erreurs de nettoyage (table déjà vide)
      console.debug(`Cleanup skipped for ${model.name}:`, error.message);
    }
  }
});
