// ============================================
// FICHIER : backend/__tests__/integration/register.test.js
// Tests d'intégration pour l'inscription
// ============================================

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { User } = require('../../models');

// Créer une application Express de test
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Tests d\'intégration - Inscription (Register)', () => {

  describe('POST /api/v1/auth/register - Cas de succès', () => {
    test('Inscription réussie avec email et mot de passe valides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser-register@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('token_type', 'bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser-register@example.com');
      expect(response.body.user.role).toBe('JOUEUR');
      expect(response.body.user.is_active).toBe(true);
    });

    test('Le nouvel utilisateur reçoit le rôle JOUEUR par défaut', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'joueur-default@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('JOUEUR');
    });

    test('Le token JWT est retourné après inscription', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'token-test@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.access_token.length).toBeGreaterThan(0);
    });

    test('Le mot de passe n\'est pas retourné dans la réponse', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'no-password-response@example.com',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(201);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
      expect(JSON.stringify(response.body)).not.toContain('password_hash');
    });
  });

  describe('POST /api/v1/auth/register - Validation email', () => {
    test('Inscription échouée - email déjà utilisé', async () => {
      // Premier enregistrement
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'ValidP@ssw0rd123'
        });

      // Tentative de duplication
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'DifferentP@ss123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('déjà utilisé');
    });

    test('Inscription échouée - email invalide (pas de @)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('email');
    });

    test('Inscription échouée - email invalide (pas de domaine)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('email');
    });

    test('Inscription échouée - email manquant', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('requis');
    });

    test('Inscription échouée - email vide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: '',
          password: 'ValidP@ssw0rd123'
        });

      expect(response.status).toBe(400);
    });

    test('Inscription échouée - email avec caractères XSS', async () => {
      const xssEmails = [
        '<script>alert("XSS")</script>@example.com',
        'user@<script>evil.com</script>',
        'test@example.com<img src=x onerror=alert(1)>'
      ];

      for (const xssEmail of xssEmails) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: xssEmail,
            password: 'ValidP@ssw0rd123'
          });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('POST /api/v1/auth/register - Validation mot de passe', () => {
    test('Inscription échouée - mot de passe trop court', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'short-pass@example.com',
          password: 'Short1!'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('au moins 8 caractères');
    });

    test('Inscription échouée - mot de passe manquant', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'no-pass@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('requis');
    });

    test('Inscription échouée - mot de passe vide', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'empty-pass@example.com',
          password: ''
        });

      expect(response.status).toBe(400);
    });

    test('Inscription réussie avec mot de passe de 8 caractères exactement', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'min-pass@example.com',
          password: '12345678'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/v1/auth/register - Sécurité', () => {
    test('Le mot de passe est hashé en base de données', async () => {
      const email = 'hash-test@example.com';
      const password = 'TestPassword123';

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      // Vérifier en base de données
      const user = await User.findOne({ where: { email } });
      expect(user).toBeDefined();
      expect(user.password_hash).not.toBe(password);
      expect(user.password_hash.startsWith('$2')).toBe(true); // bcrypt hash
    });

    test('Protection contre l\'injection SQL dans l\'email', async () => {
      const sqlInjectionEmails = [
        "admin'--",
        "' OR '1'='1",
        "'; DROP TABLE users;--"
      ];

      for (const maliciousEmail of sqlInjectionEmails) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: maliciousEmail,
            password: 'ValidP@ssw0rd123'
          });

        // Doit échouer avec validation, pas avec erreur SQL
        expect(response.status).toBe(400);
        expect(response.body).not.toHaveProperty('sql');
      }
    });
  });

  describe('POST /api/v1/auth/register - Connexion après inscription', () => {
    test('L\'utilisateur peut se connecter après inscription', async () => {
      const email = 'login-after-register@example.com';
      const password = 'ValidP@ssw0rd123';

      // Inscription
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      expect(registerResponse.status).toBe(201);

      // Connexion
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('access_token');
    });
  });
});
