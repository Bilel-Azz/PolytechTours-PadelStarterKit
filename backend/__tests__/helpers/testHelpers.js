// ============================================
// FICHIER : backend/__tests__/helpers/testHelpers.js
// Helpers pour les tests
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginAttempt } = require('../../models');

const SECRET_KEY = process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod";

/**
 * Crée un utilisateur de test dans la base de données
 */
async function createTestUser(data = {}) {
  const defaultData = {
    email: 'test@example.com',
    password_hash: await bcrypt.hash('ValidP@ssw0rd123', 10),
    role: 'JOUEUR',
    is_active: true,
    must_change_password: false
  };

  const userData = { ...defaultData, ...data };
  return await User.create(userData);
}

/**
 * Crée un administrateur de test
 */
async function createTestAdmin() {
  return await createTestUser({
    email: 'admin@example.com',
    role: 'ADMINISTRATEUR'
  });
}

/**
 * Génère un token JWT valide pour un utilisateur
 */
function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
}

/**
 * Génère un token JWT expiré
 */
function generateExpiredToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    SECRET_KEY,
    { expiresIn: '-1h' } // Token expiré
  );
}

/**
 * Crée une tentative de connexion échouée
 */
async function createLoginAttempt(email, attemptsCount = 0, lockedUntil = null) {
  return await LoginAttempt.create({
    email,
    attempts_count: attemptsCount,
    last_attempt: new Date(),
    locked_until: lockedUntil
  });
}

/**
 * Nettoie toutes les données de test
 */
async function cleanupTestData() {
  await User.destroy({ where: {}, truncate: true });
  await LoginAttempt.destroy({ where: {}, truncate: true });
}

module.exports = {
  createTestUser,
  createTestAdmin,
  generateToken,
  generateExpiredToken,
  createLoginAttempt,
  cleanupTestData,
  SECRET_KEY
};
