// ============================================
// FICHIER : backend/__tests__/integration/bruteforce.test.js
// Tests d'intégration pour la protection anti-brute force
// ============================================

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { createTestUser, createLoginAttempt } = require('../helpers/testHelpers');
const { LoginAttempt } = require('../../models');

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Tests d\'intégration - Protection anti-brute force', () => {

  test('Blocage après 5 tentatives échouées', async () => {
    const email = 'brute-test-1@example.com';
    await createTestUser({ email });

    const wrongPassword = 'WrongPassword123';

    // Faire 5 tentatives échouées
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: wrongPassword });

      if (i < 4) {
        expect(response.status).toBe(401);
        expect(response.body.detail.attempts_remaining).toBe(4 - i);
      } else {
        // 5ème tentative doit bloquer le compte
        expect(response.status).toBe(403);
        expect(response.body.detail.message).toContain('bloqué');
        expect(response.body.detail).toHaveProperty('locked_until');
        expect(response.body.detail.minutes_remaining).toBe(30);
      }
    }

    // Vérifier que même avec le bon mot de passe, le compte reste bloqué
    const validAttempt = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'ValidP@ssw0rd123'
      });

    expect(validAttempt.status).toBe(403);
    expect(validAttempt.body.detail.message).toContain('bloqué');
  });

  test('Compteur de tentatives décrémente correctement', async () => {
    const email = 'counter-test@example.com';
    await createTestUser({ email });

    // Première tentative échouée
    let response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong1' });
    expect(response.body.detail.attempts_remaining).toBe(4);

    // Deuxième tentative échouée
    response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong2' });
    expect(response.body.detail.attempts_remaining).toBe(3);

    // Troisième tentative échouée
    response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong3' });
    expect(response.body.detail.attempts_remaining).toBe(2);
  });

  test('Réinitialisation du compteur après connexion réussie', async () => {
    const email = 'reset-test@example.com';
    await createTestUser({ email });

    // Faire 2 tentatives échouées
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong1' });
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong2' });

    // Connexion réussie
    const successResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'ValidP@ssw0rd123'
      });
    expect(successResponse.status).toBe(200);

    // Vérifier que le compteur est réinitialisé
    const attempt = await LoginAttempt.findOne({ where: { email } });
    expect(attempt.attempts_count).toBe(0);
    expect(attempt.locked_until).toBeNull();

    // Une nouvelle tentative échouée devrait montrer 4 tentatives restantes
    const failResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong' });
    expect(failResponse.body.detail.attempts_remaining).toBe(4);
  });

  test('Le compte reste bloqué pendant toute la durée du lockout', async () => {
    const email = 'lockout-test@example.com';
    await createTestUser({ email });

    // Créer un compte déjà bloqué (locked_until dans le futur)
    const lockoutTime = new Date(Date.now() + 30 * 60 * 1000); // +30 minutes
    await createLoginAttempt(email, 5, lockoutTime);

    // Essayer de se connecter avec le bon mot de passe
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'ValidP@ssw0rd123'
      });

    expect(response.status).toBe(403);
    expect(response.body.detail.message).toContain('bloqué');
    expect(response.body.detail.minutes_remaining).toBeGreaterThan(25);
  });

  test('Le blocage expire après le délai configuré', async () => {
    const email = 'expired-lockout@example.com';
    await createTestUser({ email });

    // Créer un compte bloqué qui vient d'expirer
    const expiredLockout = new Date(Date.now() - 1000); // -1 seconde
    await createLoginAttempt(email, 5, expiredLockout);

    // Essayer de se connecter avec le bon mot de passe
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'ValidP@ssw0rd123'
      });

    // Le blocage devrait être expiré, connexion devrait réussir
    expect(response.status).toBe(200);
  });

  test('Chaque email a son propre compteur de tentatives', async () => {
    // Créer deux utilisateurs
    await createTestUser({
      email: 'user1-separate@example.com'
    });
    await createTestUser({
      email: 'user2-separate@example.com'
    });

    // Faire 3 tentatives échouées pour le premier utilisateur
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user1-separate@example.com', password: 'Wrong' });
    }

    // Vérifier que le deuxième utilisateur a toujours 5 tentatives
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user2-separate@example.com', password: 'Wrong' });

    expect(response.status).toBe(401);
    expect(response.body.detail.attempts_remaining).toBe(4);
  });

  test('Le timestamp last_attempt est mis à jour à chaque tentative', async () => {
    const email = 'timestamp-test@example.com';
    await createTestUser({ email });

    // Première tentative
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong' });

    const firstAttempt = await LoginAttempt.findOne({ where: { email } });
    const firstTimestamp = firstAttempt.last_attempt;

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 100));

    // Deuxième tentative
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Wrong' });

    const secondAttempt = await LoginAttempt.findOne({ where: { email } });
    const secondTimestamp = secondAttempt.last_attempt;

    expect(secondTimestamp.getTime()).toBeGreaterThan(firstTimestamp.getTime());
  });

  test('Protection contre les attaques par dictionnaire', async () => {
    const email = 'dictionary-test@example.com';
    await createTestUser({ email });

    const commonPasswords = [
      'password123',
      '12345678',
      'qwerty123',
      'admin123',
      'letmein123'
    ];

    // Essayer plusieurs mots de passe courants
    for (let i = 0; i < commonPasswords.length; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: commonPasswords[i] });

      if (i < 4) {
        expect(response.status).toBe(401);
      } else {
        // Au 5ème essai, le compte doit être bloqué
        expect(response.status).toBe(403);
        expect(response.body.detail.message).toContain('bloqué');
      }
    }
  });
});
