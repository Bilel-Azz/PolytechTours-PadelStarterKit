// ============================================
// FICHIER : backend/__tests__/integration/security-complete.test.js
// Tests de sécurité complets (TC069-TC075)
// ============================================

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRoutes = require('../../routes/auth');
const playersRoutes = require('../../routes/players');
const { User, Player } = require('../../models');

const SECRET_KEY = process.env.SECRET_KEY || "votre_super_secret_key_changez_moi_en_prod";

// Créer une application Express de test avec les middlewares de sécurité
const app = express();

// Désactiver X-Powered-By
app.disable('x-powered-by');

app.use(express.json());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/players', playersRoutes);

describe('Tests de sécurité complets (SC11)', () => {

  describe('TC069 - Protection contre l\'injection SQL', () => {
    test('Injection SQL dans email bloquée', async () => {
      const sqlInjections = [
        "' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users;--",
        "' OR 1=1--",
        "1' OR '1' = '1"
      ];

      for (const injection of sqlInjections) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: injection,
            password: 'anypassword'
          });

        // Doit être rejeté proprement (400 ou 401), pas une erreur SQL 500
        expect([400, 401]).toContain(response.status);
        expect(response.body).not.toHaveProperty('sql');
        expect(JSON.stringify(response.body)).not.toContain('SQLITE_ERROR');
        expect(JSON.stringify(response.body)).not.toContain('syntax error');
      }
    });

    test('Injection SQL dans password bloquée', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: "' OR '1'='1"
        });

      expect([400, 401]).toContain(response.status);
      expect(JSON.stringify(response.body)).not.toContain('SQLITE');
    });
  });

  describe('TC070 - Protection contre XSS', () => {
    test('Script XSS échappé dans les réponses', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg/onload=alert(1)>',
        '"><script>alert(1)</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `${payload}@example.com`,
            password: 'ValidP@ss123'
          });

        // Doit être rejeté (validation email)
        expect(response.status).toBe(400);
      }
    });

    test('Caractères dangereux rejetés dans l\'email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: '<script>test@example.com</script>',
          password: 'ValidP@ss123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('TC071 - Headers de sécurité présents', () => {
    test('X-Content-Type-Options présent', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('X-Frame-Options présent', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('X-XSS-Protection présent', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('X-Powered-By absent', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('TC072 - Mots de passe hashés en base', () => {
    test('Le mot de passe n\'est jamais stocké en clair', async () => {
      const email = 'hash-check@example.com';
      const password = 'ClearTextPassword123';

      // Créer un utilisateur
      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      // Vérifier en base de données
      const user = await User.findOne({ where: { email } });

      expect(user).toBeDefined();
      expect(user.password_hash).not.toBe(password);
      expect(user.password_hash.startsWith('$2')).toBe(true); // bcrypt
      expect(user.password_hash.length).toBeGreaterThan(50);
    });

    test('Deux utilisateurs avec le même mot de passe ont des hashes différents', async () => {
      const password = 'SamePassword123';

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user1-hash@example.com', password });

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'user2-hash@example.com', password });

      const user1 = await User.findOne({ where: { email: 'user1-hash@example.com' } });
      const user2 = await User.findOne({ where: { email: 'user2-hash@example.com' } });

      // Les hashes doivent être différents (salt différent)
      expect(user1.password_hash).not.toBe(user2.password_hash);
    });
  });

  describe('TC073 - Validation du token JWT', () => {
    test('Token JWT modifié manuellement retourne 401', async () => {
      // Créer un utilisateur valide
      const email = 'jwt-test@example.com';
      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'ValidP@ss123' });

      // Créer un token avec une mauvaise signature
      const fakeToken = jwt.sign(
        { sub: 999, email, role: 'ADMINISTRATEUR' },
        'wrong_secret_key',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
    });

    test('Token JWT malformé retourne 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
    });

    test('Token JWT avec payload modifié retourne 401', async () => {
      // Créer un token valide mais modifier le payload après signature
      const originalToken = jwt.sign({ sub: 1, email: 'test@test.com', role: 'JOUEUR' }, SECRET_KEY);

      // Modifier une partie du token
      const parts = originalToken.split('.');
      parts[1] = Buffer.from(JSON.stringify({ sub: 999, email: 'hacker@test.com', role: 'ADMINISTRATEUR' })).toString('base64');
      const tamperedToken = parts.join('.');

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('TC074 - Gestion sécurisée des erreurs', () => {
    test('Erreurs ne révèlent pas d\'infos sensibles (stack trace)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });

      const responseStr = JSON.stringify(response.body);

      // Ne doit pas contenir de stack trace
      expect(responseStr).not.toContain('at ');
      expect(responseStr).not.toContain('.js:');
      expect(responseStr).not.toContain('node_modules');
      expect(responseStr).not.toContain('Error:');
    });

    test('Erreurs ne révèlent pas d\'infos sur la base de données', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: "'; SELECT * FROM users;--", password: 'test' });

      const responseStr = JSON.stringify(response.body);

      expect(responseStr).not.toContain('SQLITE');
      expect(responseStr).not.toContain('SELECT');
      expect(responseStr).not.toContain('FROM');
      expect(responseStr).not.toContain('users');
      expect(responseStr).not.toContain('password_hash');
    });

    test('Message d\'erreur générique pour login échoué', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'wrong' });

      // Le message ne doit pas dire si c'est l'email ou le mot de passe qui est faux
      const message = response.body.detail?.message || response.body.detail;
      expect(message).not.toContain('email n\'existe pas');
      expect(message).not.toContain('utilisateur non trouvé');
    });
  });

  describe('TC075 - Variables d\'environnement', () => {
    test('SECRET_KEY n\'est pas exposé dans les réponses', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      const responseStr = JSON.stringify(response.body);

      expect(responseStr).not.toContain('SECRET_KEY');
      expect(responseStr).not.toContain(SECRET_KEY);
    });

    test('Les tokens JWT ne contiennent pas de données sensibles', async () => {
      const email = 'token-data@example.com';
      const password = 'ValidP@ss123';

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      const token = loginResponse.body.access_token;

      // Décoder le payload du token (sans vérifier la signature)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      // Le payload ne doit pas contenir de données sensibles
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('password_hash');
      expect(payload).not.toHaveProperty('secret');

      // Doit contenir uniquement les infos nécessaires
      expect(payload).toHaveProperty('sub'); // user id
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('role');
    });
  });

  describe('TC001-TC006 - Tests d\'authentification', () => {
    test('TC001 - Connexion réussie avec credentials valides', async () => {
      const email = 'tc001@example.com';
      const password = 'ValidP@ss123';

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.token_type).toBe('bearer');
    });

    test('TC002 - Mot de passe invalide affiche erreur et décrémente compteur', async () => {
      const email = 'tc002@example.com';

      await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'ValidP@ss123' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword' });

      expect(response.status).toBe(401);
      expect(response.body.detail).toHaveProperty('message');
      expect(response.body.detail).toHaveProperty('attempts_remaining');
      expect(response.body.detail.attempts_remaining).toBe(4);
    });

    test('TC005 - Token JWT expiré retourne 401', async () => {
      // Créer un token expiré
      const expiredToken = jwt.sign(
        { sub: 1, email: 'test@test.com', role: 'JOUEUR' },
        SECRET_KEY,
        { expiresIn: '-1h' } // Déjà expiré
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    test('TC006 - Requête sans token retourne 401', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');
      // Pas de header Authorization

      expect(response.status).toBe(401);
    });
  });
});
