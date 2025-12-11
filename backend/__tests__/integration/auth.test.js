// ============================================
// FICHIER : backend/__tests__/integration/auth.test.js
// Tests d'intégration pour l'authentification
// ============================================

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { createTestUser, generateToken } = require('../helpers/testHelpers');

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Tests d\'intégration - Authentification', () => {

  describe('POST /api/v1/auth/register', () => {
    test('Inscription réussie avec email et mot de passe valides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('token_type', 'bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.role).toBe('JOUEUR');
      expect(response.body.user.is_active).toBe(true);
    });

    test('Inscription échouée - email déjà utilisé', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('déjà utilisé');
    });

    test('Inscription échouée - email invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('email invalide');
    });

    test('Inscription échouée - mot de passe trop court', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Short1!'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('au moins 8 caractères');
    });

    test('Inscription échouée - champs manquants', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com'
          // Pas de password
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('requis');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('Connexion réussie avec credentials valides', async () => {
      const email = 'test-login-success@example.com';
      await createTestUser({
        email,
        is_active: true
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('token_type', 'bearer');
      expect(response.body.user.email).toBe(email);
    });

    test('Connexion échouée - email incorrect', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(401);
      expect(response.body.detail.message).toContain('incorrect');
      expect(response.body.detail).toHaveProperty('attempts_remaining');
    });

    test('Connexion échouée - mot de passe incorrect', async () => {
      const email = 'test-wrong-password@example.com';
      await createTestUser({
        email,
        is_active: true
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.detail.message).toContain('incorrect');
      expect(response.body.detail.attempts_remaining).toBe(4);
    });

    test('Connexion échouée - compte désactivé', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        is_active: false
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(403);
      expect(response.body.detail).toContain('désactivé');
    });
  });

  describe('POST /api/v1/auth/change-password', () => {

    test('Changement de mot de passe réussi', async () => {
      const user = await createTestUser({ email: 'change-pwd-success@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'ValidP@ssw0rd123',
          new_password: 'NewValidP@ssw0rd456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('succès');

      // Vérifier qu'on peut se connecter avec le nouveau mot de passe
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'NewValidP@ssw0rd456'
        });

      expect(loginResponse.status).toBe(200);
    });

    test('Changement échoué - mot de passe actuel incorrect', async () => {
      const user = await createTestUser({ email: 'change-pwd-wrong@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'WrongPassword123',
          new_password: 'NewValidP@ssw0rd456'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('incorrect');
    });

    test('Changement échoué - nouveau mot de passe identique à l\'ancien', async () => {
      const user = await createTestUser({ email: 'change-pwd-same@example.com' });
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'ValidP@ssw0rd123',
          new_password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('différent');
    });

    test('Changement échoué - sans authentification', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          current_password: 'ValidP@ssw0rd123',
          new_password: 'NewValidP@ssw0rd456'
        });

      expect(response.status).toBe(401);
    });

    test('Changement échoué - token invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          current_password: 'ValidP@ssw0rd123',
          new_password: 'NewValidP@ssw0rd456'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('Déconnexion réussie avec token valide', async () => {
      const user = await createTestUser();
      const token = generateToken(user);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Déconnexion réussie');
    });

    test('Déconnexion échouée - sans token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
    });

    test('Déconnexion échouée - token invalide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });
});
